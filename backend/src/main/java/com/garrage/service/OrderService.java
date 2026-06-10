package com.garrage.service;

import com.garrage.dto.request.CreateOrderRequest;
import com.garrage.dto.request.UpdateOrderRequest;
import com.garrage.exception.ResourceNotFoundException;
import com.garrage.model.*;
import com.garrage.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleAnalyticsRepository vehicleAnalyticsRepository;
    private final CustomerRepository customerRepository;
    private final GarageRepository garageRepository;
    private final InvoiceRepository invoiceRepository;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;
    private final InvoiceService invoiceService;
    private final InvoicePdfService invoicePdfService;
    private final EmailService emailService;
    private final MongoTemplate mongoTemplate;

    // ─── Create ───

    public Order createOrder(CreateOrderRequest request, String garageId) {
        String jobCard = generateJobCard(garageId);

        Order order = Order.builder()
                .garageId(garageId)
                .jobCard(jobCard)
                .customerId(request.getCustomerId())
                .customerName(request.getCustomerName())
                .customerPhone(request.getPhone())
                .vehicleId(request.getVehicleId())
                .vehicle(request.getVehicle())
                .vehicleNumber(request.getVehicleNumber())
                .status("open")
                .amount(request.getAmount())
                .date(LocalDate.now().toString())
                .services(request.getServices())
                .odometerReading(request.getOdometerReading())
                .fuelLevel(request.getFuelLevel())
                .customerRemarks(request.getCustomerRemarks())
                .inspectionNotes(request.getInspectionNotes())
                .build();

        Order saved = orderRepository.save(order);
        activityLogService.log("CREATE", "ORDER", saved.getId(),
                "created order " + saved.getJobCard());

        // Notify admin about new order
        notificationService.notifyAdmin(garageId,
                "ORDER_CREATED", "APPOINTMENTS", "normal",
                "New Order Created",
                "Order " + saved.getJobCard() + " created for " + (saved.getCustomerName() != null ? saved.getCustomerName() : "customer"),
                "/dashboard/orders/" + saved.getId(),
                "ORDER", saved.getId());

        // Track vehicle analytics (brand count)
        trackVehicleAnalytics(garageId, request.getVehicleId());

        // Send vehicle onboarding email if toggle is on
        if (request.isNotifyCustomer()) {
            // Generate onboarding token for public inspection link
            saved.setOnboardingToken(UUID.randomUUID().toString());
            saved = orderRepository.save(saved);

            String customerEmail = resolveCustomerEmail(saved);
            if (customerEmail != null) {
                Garage garage = garageRepository.findById(garageId).orElse(null);
                String garageName = garage != null ? garage.getName() : "Car Affair";
                emailService.sendVehicleOnboardingEmail(customerEmail, saved.getCustomerName(),
                        saved.getVehicle(), saved.getVehicleNumber(),
                        saved.getCustomerRemarks(), garageName, saved.getOnboardingToken());
            }
        }

        return saved;
    }

    // ─── Query methods ───

    public List<Order> getOrders(String garageId) {
        return orderRepository.findByGarageIdOrderByCreatedAtDesc(garageId);
    }

    public List<Order> getOrdersByStatus(String garageId, String status) {
        return orderRepository.findByGarageIdAndStatus(garageId, status);
    }

    public List<Order> getOrdersByCustomer(String customerId, String garageId) {
        return orderRepository.findByCustomerIdAndGarageIdOrderByCreatedAtDesc(customerId, garageId);
    }

    public Order getOrderById(String id, String garageId) {
        return orderRepository.findByIdAndGarageId(id, garageId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
    }

    public Order getOrderByEstimateToken(String token) {
        return orderRepository.findByEstimateToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Estimate not found"));
    }

    public Order getOrderByOnboardingToken(String token) {
        return orderRepository.findByOnboardingToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Onboarding link not found or expired"));
    }

    // ─── Update ───

    public Order updateOrder(String id, UpdateOrderRequest request, String garageId) {
        Order order = getOrderById(id, garageId);

        if (request.getStatus() != null) {
            order.setStatus(request.getStatus());
        }
        if (request.getAmount() != null) {
            order.setAmount(request.getAmount());
        }
        if (request.getCustomerRemarks() != null) {
            order.setCustomerRemarks(request.getCustomerRemarks());
        }

        Order saved = orderRepository.save(order);
        activityLogService.log("UPDATE", "ORDER", saved.getId(),
                "updated order " + saved.getJobCard() + " (status: " + saved.getStatus() + ")");

        // Notify on important status changes
        String newStatus = saved.getStatus();
        if ("wip".equals(newStatus)) {
            notificationService.notifyAdmin(garageId,
                    "ORDER_IN_PROGRESS", "APPOINTMENTS", "normal",
                    "Order In Progress",
                    "Order " + saved.getJobCard() + " for " + saved.getCustomerName() + " is now in progress",
                    "/dashboard/orders/" + saved.getId(),
                    "ORDER", saved.getId());
        } else if ("completed".equals(newStatus)) {
            notificationService.notifyAdmin(garageId,
                    "ORDER_COMPLETED", "APPOINTMENTS", "normal",
                    "Order Completed",
                    "Order " + saved.getJobCard() + " has been completed",
                    "/dashboard/orders/" + saved.getId(),
                    "ORDER", saved.getId());
        } else if ("cancelled".equals(newStatus)) {
            notificationService.notifyAdmin(garageId,
                    "ORDER_CANCELLED", "APPOINTMENTS", "high",
                    "Order Cancelled",
                    "Order " + saved.getJobCard() + " for " + saved.getCustomerName() + " has been cancelled",
                    "/dashboard/orders/" + saved.getId(),
                    "ORDER", saved.getId());
        }

        return saved;
    }

    // ─── Inspection ───

    public Order completeInspection(String id, String garageId,
                                     List<String> customerRemarks,
                                     String inspectionNotes) {
        Order order = getOrderById(id, garageId);
        order.setCustomerRemarks(customerRemarks);
        order.setInspectionNotes(inspectionNotes);
        order.setInspectionCompletedAt(LocalDateTime.now());

        // Move to open if still in inspection status
        if ("inspection".equals(order.getStatus())) {
            order.setStatus("open");
        }

        Order saved = orderRepository.save(order);
        activityLogService.log("UPDATE", "ORDER", saved.getId(),
                "completed inspection for " + saved.getJobCard());
        return saved;
    }

    // ─── Image management ───

    public void addImageIds(String orderId, String garageId, List<String> newImageIds) {
        Order order = getOrderById(orderId, garageId);
        List<String> existing = order.getImageIds();
        if (existing == null) {
            existing = new ArrayList<>();
        }
        existing.addAll(newImageIds);
        order.setImageIds(existing);

        // Record upload timestamps
        Map<String, String> timestamps = order.getImageTimestamps();
        if (timestamps == null) {
            timestamps = new LinkedHashMap<>();
        }
        String now = LocalDateTime.now().toString();
        for (String imageId : newImageIds) {
            timestamps.put(imageId, now);
        }
        order.setImageTimestamps(timestamps);

        orderRepository.save(order);
    }

    public void removeImageId(String orderId, String garageId, String fileId) {
        Order order = getOrderById(orderId, garageId);
        if (order.getImageIds() != null) {
            order.getImageIds().remove(fileId);
        }
        if (order.getImageTimestamps() != null) {
            order.getImageTimestamps().remove(fileId);
        }
        orderRepository.save(order);
    }

    // ─── Estimate ───

    public Order saveEstimate(String id, String garageId,
                               List<Order.OrderLineItem> lineItems,
                               String estimateType, String placeOfSupply,
                               String estimatedDeliveryDate,
                               double subtotal, double discountAmount,
                               double cgstAmount, double sgstAmount,
                               double igstAmount, double totalGst,
                               double grandTotal) {
        Order order = getOrderById(id, garageId);
        order.setLineItems(lineItems);
        order.setEstimateType(estimateType);
        order.setPlaceOfSupply(placeOfSupply);
        order.setEstimatedDeliveryDate(estimatedDeliveryDate);
        order.setSubtotal(subtotal);
        order.setDiscountAmount(discountAmount);
        order.setCgstAmount(cgstAmount);
        order.setSgstAmount(sgstAmount);
        order.setIgstAmount(igstAmount);
        order.setTotalGst(totalGst);
        order.setGrandTotal(grandTotal);
        order.setAmount(grandTotal);

        Order saved = orderRepository.save(order);
        activityLogService.log("UPDATE", "ORDER", saved.getId(),
                "saved estimate for " + saved.getJobCard() + " (₹" + grandTotal + ")");
        return saved;
    }

    public Order sendEstimate(String id, String garageId) {
        Order order = getOrderById(id, garageId);

        // If the order was cancelled (e.g. customer rejected via old flow), reopen it
        if ("cancelled".equals(order.getStatus())) {
            order.setStatus("open");
        }

        // Always clear previous customer response so the new estimate is fresh
        order.setCustomerApproved(null);
        order.setCustomerRejectionNote(null);
        order.setCustomerRequestedProforma(null);
        order.setCustomerRespondedAt(null);

        // Generate unique token for public estimate link
        String token = UUID.randomUUID().toString();
        order.setEstimateToken(token);
        order.setEstimateSentAt(LocalDateTime.now());

        Order saved = orderRepository.save(order);
        activityLogService.log("UPDATE", "ORDER", saved.getId(),
                "sent estimate for " + saved.getJobCard());

        // Send estimate email to customer
        sendEstimateEmailToCustomer(saved, token, garageId);

        return saved;
    }

    private void sendEstimateEmailToCustomer(Order order, String token, String garageId) {
        String customerEmail = resolveCustomerEmail(order);
        if (customerEmail != null) {
            Garage garage = garageRepository.findById(garageId).orElse(null);
            String garageName = garage != null ? garage.getName() : "Car Affair";
            // Generate estimate PDF with the same beautiful invoice design
            byte[] pdfBytes = null;
            if (garage != null) {
                try {
                    pdfBytes = invoicePdfService.generateEstimatePdf(order, garage);
                } catch (Exception e) {
                    log.warn("Failed to generate estimate PDF for {}: {}", order.getJobCard(), e.getMessage());
                }
            }
            emailService.sendEstimateEmail(customerEmail, order.getCustomerName(),
                    order.getJobCard(), garageName, order.getVehicle(),
                    order.getGrandTotal(), token, pdfBytes);
        }
    }

    public String getEstimateLink(String id, String garageId) {
        Order order = getOrderById(id, garageId);
        if (order.getEstimateToken() == null) {
            throw new ResourceNotFoundException("Estimate has not been sent yet for this order");
        }
        return order.getEstimateToken();
    }

    // ─── Customer response (public) ───

    public Order respondToEstimate(String token, boolean approved, String rejectionNote,
                                    boolean requestedProforma) {
        Order order = getOrderByEstimateToken(token);

        if (order.getCustomerApproved() != null) {
            throw new IllegalStateException("Customer has already responded to this estimate");
        }

        order.setCustomerApproved(approved);
        order.setCustomerRespondedAt(LocalDateTime.now());

        if (approved) {
            order.setStatus("wip");
        } else {
            // Keep current status so admin can revise and resend
            order.setCustomerRejectionNote(rejectionNote);
            order.setCustomerRequestedProforma(requestedProforma);
        }

        Order saved = orderRepository.save(order);

        // Notify admin about customer response
        String garageId = saved.getGarageId();
        if (approved) {
            notificationService.notifyAdmin(garageId,
                    "ESTIMATE_APPROVED", "APPOINTMENTS", "high",
                    "Estimate Approved",
                    "Customer " + saved.getCustomerName() + " approved estimate for " + saved.getJobCard(),
                    "/dashboard/orders/" + saved.getId(),
                    "ORDER", saved.getId());
        } else {
            notificationService.notifyAdmin(garageId,
                    "ESTIMATE_REJECTED", "APPOINTMENTS", "urgent",
                    "Estimate Rejected",
                    "Customer " + saved.getCustomerName() + " rejected estimate for " + saved.getJobCard()
                            + (rejectionNote != null ? ": " + rejectionNote : ""),
                    "/dashboard/orders/" + saved.getId(),
                    "ORDER", saved.getId());
        }

        return saved;
    }

    /**
     * Resend estimate after revision (generates new token, resets customer response).
     */
    public Order resendEstimate(String id, String garageId) {
        Order order = getOrderById(id, garageId);
        // If the order was cancelled (e.g. by old rejection flow), reopen it
        if ("cancelled".equals(order.getStatus())) {
            order.setStatus("open");
        }
        order.setEstimateToken(UUID.randomUUID().toString());
        order.setEstimateSentAt(LocalDateTime.now());
        order.setCustomerApproved(null);
        order.setCustomerRejectionNote(null);
        order.setCustomerRequestedProforma(null);
        order.setCustomerRespondedAt(null);

        Order saved = orderRepository.save(order);
        activityLogService.log("UPDATE", "ORDER", saved.getId(),
                "resent estimate for " + saved.getJobCard());

        // Send estimate email to customer
        sendEstimateEmailToCustomer(saved, saved.getEstimateToken(), garageId);

        return saved;
    }

    // ─── Service assignment ───

    public Order assignService(String orderId, String garageId,
                                String lineItemId, String staffUserId, String staffUserName) {
        Order order = getOrderById(orderId, garageId);

        List<Order.ServiceAssignment> assignments = order.getServiceAssignments();
        if (assignments == null) {
            assignments = new ArrayList<>();
        }

        // Remove existing assignment for this line item if any
        assignments.removeIf(a -> lineItemId.equals(a.getLineItemId()));

        assignments.add(Order.ServiceAssignment.builder()
                .lineItemId(lineItemId)
                .assignedUserId(staffUserId)
                .assignedUserName(staffUserName)
                .status("pending")
                .assignedAt(LocalDateTime.now())
                .build());

        order.setServiceAssignments(assignments);
        Order saved = orderRepository.save(order);

        activityLogService.log("UPDATE", "ORDER", saved.getId(),
                "assigned service to " + staffUserName + " for " + saved.getJobCard());

        // Notify assigned staff
        notificationService.notify(garageId, staffUserId,
                "TASK_ASSIGNED", "APPOINTMENTS", "normal",
                "New Task Assigned",
                "You have been assigned a service for order " + saved.getJobCard(),
                "/dashboard/my-tasks",
                "ORDER", saved.getId());

        return saved;
    }

    public Order updateAssignmentStatus(String orderId, String garageId,
                                         String lineItemId, String status, String notes) {
        Order order = getOrderById(orderId, garageId);

        if (order.getServiceAssignments() == null) {
            throw new ResourceNotFoundException("No assignments found for this order");
        }

        Order.ServiceAssignment target = order.getServiceAssignments().stream()
                .filter(a -> lineItemId.equals(a.getLineItemId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found for line item: " + lineItemId));

        target.setStatus(status);
        if (notes != null) {
            target.setNotes(notes);
        }
        if ("completed".equals(status)) {
            target.setCompletedAt(LocalDateTime.now());
        }

        Order saved = orderRepository.save(order);

        activityLogService.log("UPDATE", "ORDER", saved.getId(),
                "updated task status to " + status + " for " + saved.getJobCard());

        // If all assignments are completed, notify admin
        if ("completed".equals(status)) {
            boolean allDone = saved.getServiceAssignments().stream()
                    .allMatch(a -> "completed".equals(a.getStatus()));
            if (allDone) {
                notificationService.notifyAdmin(garageId,
                        "ALL_SERVICES_COMPLETE", "APPOINTMENTS", "high",
                        "All Services Completed",
                        "All assigned services for order " + saved.getJobCard() + " are completed",
                        "/dashboard/orders/" + saved.getId(),
                        "ORDER", saved.getId());
            }
        }

        return saved;
    }

    // ─── Work Timer ───

    public Order startTimer(String orderId, String garageId, String lineItemId) {
        Order order = getOrderById(orderId, garageId);
        Order.ServiceAssignment target = findAssignment(order, lineItemId);

        if ("completed".equals(target.getStatus())) {
            throw new IllegalStateException("Cannot start timer on a completed task");
        }

        target.setWorkStartedAt(LocalDateTime.now());
        target.setWorkPausedAt(null);
        target.setStatus("in_progress");

        // Generate status token if not present
        if (order.getStatusToken() == null) {
            order.setStatusToken(UUID.randomUUID().toString());
        }

        Order saved = orderRepository.save(order);
        activityLogService.log("UPDATE", "ORDER", saved.getId(),
                "started work timer for " + saved.getJobCard());

        // Notify customer
        notifyCustomerAboutUpdate(saved, "WORK_STARTED",
                "Work has begun on your vehicle " + saved.getVehicleNumber());

        return saved;
    }

    public Order pauseTimer(String orderId, String garageId, String lineItemId) {
        Order order = getOrderById(orderId, garageId);
        Order.ServiceAssignment target = findAssignment(order, lineItemId);

        if (!"in_progress".equals(target.getStatus())) {
            throw new IllegalStateException("Can only pause an in-progress task");
        }
        if (target.getWorkPausedAt() != null) {
            throw new IllegalStateException("Task is already paused");
        }

        target.setWorkPausedAt(LocalDateTime.now());

        Order saved = orderRepository.save(order);
        activityLogService.log("UPDATE", "ORDER", saved.getId(),
                "paused work timer for " + saved.getJobCard());

        return saved;
    }

    public Order resumeTimer(String orderId, String garageId, String lineItemId) {
        Order order = getOrderById(orderId, garageId);
        Order.ServiceAssignment target = findAssignment(order, lineItemId);

        if (target.getWorkPausedAt() == null) {
            throw new IllegalStateException("Task is not paused");
        }

        // Accumulate paused duration
        long pausedMs = java.time.Duration.between(target.getWorkPausedAt(), LocalDateTime.now()).toMillis();
        target.setTotalPausedMs(target.getTotalPausedMs() + pausedMs);
        target.setWorkPausedAt(null);

        Order saved = orderRepository.save(order);
        activityLogService.log("UPDATE", "ORDER", saved.getId(),
                "resumed work timer for " + saved.getJobCard());

        return saved;
    }

    public Order completeTimer(String orderId, String garageId, String lineItemId, String notes) {
        Order order = getOrderById(orderId, garageId);
        Order.ServiceAssignment target = findAssignment(order, lineItemId);

        if ("completed".equals(target.getStatus())) {
            throw new IllegalStateException("Task is already completed");
        }

        LocalDateTime now = LocalDateTime.now();

        // If paused, accumulate remaining pause time
        if (target.getWorkPausedAt() != null) {
            long pausedMs = java.time.Duration.between(target.getWorkPausedAt(), now).toMillis();
            target.setTotalPausedMs(target.getTotalPausedMs() + pausedMs);
            target.setWorkPausedAt(null);
        }

        target.setStatus("completed");
        target.setCompletedAt(now);
        if (notes != null) {
            target.setNotes(notes);
        }

        // Calculate total work duration
        if (target.getWorkStartedAt() != null) {
            long totalMs = java.time.Duration.between(target.getWorkStartedAt(), now).toMillis();
            target.setTotalWorkMs(totalMs - target.getTotalPausedMs());
        }

        Order saved = orderRepository.save(order);
        activityLogService.log("UPDATE", "ORDER", saved.getId(),
                "completed work for " + saved.getJobCard());

        // Notify customer about individual task completion
        Order.OrderLineItem lineItemObj = null;
        if (saved.getLineItems() != null) {
            lineItemObj = saved.getLineItems().stream()
                    .filter(li -> lineItemId.equals(li.getId()))
                    .findFirst().orElse(null);
        }
        String serviceName = lineItemObj != null ? lineItemObj.getDescription() : "Service";
        notifyCustomerAboutUpdate(saved, "TASK_COMPLETED",
                serviceName + " completed for your vehicle " + saved.getVehicleNumber());

        // Check if all assignments are done
        boolean allDone = saved.getServiceAssignments().stream()
                .allMatch(a -> "completed".equals(a.getStatus()));
        if (allDone) {
            notificationService.notifyAdmin(garageId,
                    "ALL_SERVICES_COMPLETE", "APPOINTMENTS", "high",
                    "All Services Completed",
                    "All assigned services for order " + saved.getJobCard() + " are completed",
                    "/dashboard/orders/" + saved.getId(),
                    "ORDER", saved.getId());

            // Notify customer: vehicle is ready
            notifyCustomerAboutUpdate(saved, "VEHICLE_READY",
                    "Your vehicle " + saved.getVehicleNumber() + " is ready for pickup!");
        }

        return saved;
    }

    /**
     * Returns task analytics: per-staff and per-service time aggregations.
     */
    public Map<String, Object> getTaskAnalytics(String garageId) {
        List<Order> orders = orderRepository.findByGarageIdOrderByCreatedAtDesc(garageId);

        // Collect completed assignments with timer data
        List<Map<String, Object>> completedTasks = new ArrayList<>();
        Map<String, List<Long>> staffTimes = new LinkedHashMap<>();
        Map<String, List<Long>> serviceTimes = new LinkedHashMap<>();
        Map<String, Integer> staffTaskCount = new LinkedHashMap<>();

        for (Order order : orders) {
            if (order.getServiceAssignments() == null) continue;
            for (Order.ServiceAssignment a : order.getServiceAssignments()) {
                if (!"completed".equals(a.getStatus()) || a.getTotalWorkMs() == null) continue;

                // Per-staff aggregation
                String staffName = a.getAssignedUserName() != null ? a.getAssignedUserName() : "Unknown";
                staffTimes.computeIfAbsent(staffName, k -> new ArrayList<>()).add(a.getTotalWorkMs());
                staffTaskCount.merge(staffName, 1, Integer::sum);

                // Per-service aggregation
                if (order.getLineItems() != null) {
                    order.getLineItems().stream()
                            .filter(li -> li.getId().equals(a.getLineItemId()))
                            .findFirst()
                            .ifPresent(li -> {
                                String desc = li.getDescription() != null ? li.getDescription() : "Service";
                                serviceTimes.computeIfAbsent(desc, k -> new ArrayList<>()).add(a.getTotalWorkMs());
                            });
                }
            }
        }

        // Compute averages
        Map<String, Long> staffAvgMs = new LinkedHashMap<>();
        staffTimes.forEach((name, times) ->
                staffAvgMs.put(name, times.stream().mapToLong(Long::longValue).sum() / times.size()));

        Map<String, Long> serviceAvgMs = new LinkedHashMap<>();
        serviceTimes.forEach((name, times) ->
                serviceAvgMs.put(name, times.stream().mapToLong(Long::longValue).sum() / times.size()));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("staffAvgTimeMs", staffAvgMs);
        result.put("staffTaskCount", staffTaskCount);
        result.put("serviceAvgTimeMs", serviceAvgMs);
        return result;
    }

    private Order.ServiceAssignment findAssignment(Order order, String lineItemId) {
        if (order.getServiceAssignments() == null) {
            throw new ResourceNotFoundException("No assignments found for this order");
        }
        return order.getServiceAssignments().stream()
                .filter(a -> lineItemId.equals(a.getLineItemId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found for line item: " + lineItemId));
    }

    // ─── Task Photos (Before/After) ───

    public Order addTaskBeforeImages(String orderId, String garageId, String lineItemId, List<String> fileIds) {
        Order order = getOrderById(orderId, garageId);
        Order.ServiceAssignment target = findAssignment(order, lineItemId);

        List<String> existing = target.getBeforeImageIds();
        if (existing == null) existing = new ArrayList<>();
        existing.addAll(fileIds);
        target.setBeforeImageIds(existing);

        Order saved = orderRepository.save(order);
        activityLogService.log("UPDATE", "ORDER", saved.getId(),
                "uploaded before photos for " + saved.getJobCard());
        return saved;
    }

    public Order addTaskAfterImages(String orderId, String garageId, String lineItemId, List<String> fileIds) {
        Order order = getOrderById(orderId, garageId);
        Order.ServiceAssignment target = findAssignment(order, lineItemId);

        List<String> existing = target.getAfterImageIds();
        if (existing == null) existing = new ArrayList<>();
        existing.addAll(fileIds);
        target.setAfterImageIds(existing);

        Order saved = orderRepository.save(order);
        activityLogService.log("UPDATE", "ORDER", saved.getId(),
                "uploaded after photos for " + saved.getJobCard());

        // Notify customer about progress photo
        notifyCustomerAboutUpdate(saved, "PHOTO_UPLOADED",
                "New progress photo uploaded for your vehicle " + saved.getVehicleNumber());

        return saved;
    }

    public Map<String, List<String>> getTaskImages(String orderId, String garageId, String lineItemId) {
        Order order = getOrderById(orderId, garageId);
        Order.ServiceAssignment target = findAssignment(order, lineItemId);

        Map<String, List<String>> result = new LinkedHashMap<>();
        result.put("before", target.getBeforeImageIds() != null ? target.getBeforeImageIds() : List.of());
        result.put("after", target.getAfterImageIds() != null ? target.getAfterImageIds() : List.of());
        return result;
    }

    public void deleteTaskImage(String orderId, String garageId, String fileId) {
        Order order = getOrderById(orderId, garageId);
        if (order.getServiceAssignments() != null) {
            for (Order.ServiceAssignment a : order.getServiceAssignments()) {
                if (a.getBeforeImageIds() != null) a.getBeforeImageIds().remove(fileId);
                if (a.getAfterImageIds() != null) a.getAfterImageIds().remove(fileId);
            }
        }
        orderRepository.save(order);
    }

    // ─── Order Status Token (public live updates) ───

    public Order getOrderByStatusToken(String token) {
        return orderRepository.findByStatusToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Order status link not found or expired"));
    }

    /**
     * Ensure order has a statusToken; generate one if missing.
     */
    public String ensureStatusToken(String orderId, String garageId) {
        Order order = getOrderById(orderId, garageId);
        if (order.getStatusToken() == null) {
            order.setStatusToken(UUID.randomUUID().toString());
            order = orderRepository.save(order);
        }
        return order.getStatusToken();
    }

    // ─── Customer Notification Helper ───

    private void notifyCustomerAboutUpdate(Order order, String type, String message) {
        if (order.getCustomerId() == null) return;
        try {
            notificationService.notify(order.getGarageId(), order.getCustomerId(),
                    type, "APPOINTMENTS", "normal",
                    "Vehicle Update",
                    message,
                    order.getStatusToken() != null
                            ? "/order-status/" + order.getStatusToken()
                            : "/dashboard/orders/" + order.getId(),
                    "ORDER", order.getId());
        } catch (Exception e) {
            log.warn("Failed to notify customer about update: {}", e.getMessage());
        }
    }

    // ─── Payment Due ───

    public Order getOrderByPaymentToken(String token) {
        return orderRepository.findByPaymentToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Payment link not found or expired"));
    }

    /**
     * Admin marks order as payment_due → generates payment token, sends payment email to customer.
     */
    public Order markPaymentDue(String id, String garageId) {
        Order order = getOrderById(id, garageId);

        String token = UUID.randomUUID().toString();
        order.setPaymentToken(token);
        order.setPaymentSentAt(LocalDateTime.now());
        order.setStatus("payment_due");

        Order saved = orderRepository.save(order);
        activityLogService.log("UPDATE", "ORDER", saved.getId(),
                "marked payment due for " + saved.getJobCard());

        // Send payment email to customer
        String customerEmail = resolveCustomerEmail(saved);
        if (customerEmail != null) {
            Garage garage = garageRepository.findById(garageId).orElse(null);
            String garageName = garage != null ? garage.getName() : "Car Affair";
            emailService.sendPaymentEmail(customerEmail, saved.getCustomerName(),
                    saved.getJobCard(), garageName, saved.getGrandTotal(), token);
        }

        notificationService.notifyAdmin(garageId,
                "PAYMENT_DUE", "PAYMENTS", "high",
                "Payment Due",
                "Payment link sent for order " + saved.getJobCard() + " — ₹" + String.format("%.2f", saved.getGrandTotal()),
                "/dashboard/orders/" + saved.getId(),
                "ORDER", saved.getId());

        return saved;
    }

    /**
     * Customer confirms payment via public link → status becomes completed,
     * auto-creates invoice, sends invoice PDF via email.
     */
    public Order confirmPayment(String token) {
        Order order = getOrderByPaymentToken(token);

        if ("completed".equals(order.getStatus())) {
            throw new IllegalStateException("Payment has already been confirmed");
        }

        order.setStatus("completed");
        Order saved = orderRepository.save(order);

        String garageId = saved.getGarageId();
        activityLogService.log("UPDATE", "ORDER", saved.getId(),
                "payment confirmed for " + saved.getJobCard());

        // Auto-create invoice from order line items
        try {
            Invoice invoice = buildInvoiceFromOrder(saved);
            Invoice createdInvoice = invoiceService.createInvoice(invoice, garageId);

            // Generate PDF and send via email
            String customerEmail = resolveCustomerEmail(saved);
            if (customerEmail != null) {
                Garage garage = garageRepository.findById(garageId).orElse(null);
                String garageName = garage != null ? garage.getName() : "Car Affair";
                byte[] pdfBytes = invoicePdfService.generateInvoicePdf(createdInvoice, garage);
                emailService.sendThankYouInvoiceEmail(customerEmail, saved.getCustomerName(),
                        createdInvoice.getInvoiceNumber(), garageName, pdfBytes);
                invoiceService.updateInvoiceStatus(createdInvoice.getId(), "paid", garageId);
            }
        } catch (Exception e) {
            log.error("Failed to auto-create invoice for order {}: {}", saved.getId(), e.getMessage());
        }

        notificationService.notifyAdmin(garageId,
                "PAYMENT_RECEIVED", "PAYMENTS", "high",
                "Payment Received",
                "Customer " + saved.getCustomerName() + " paid for order " + saved.getJobCard(),
                "/dashboard/orders/" + saved.getId(),
                "ORDER", saved.getId());

        return saved;
    }

    private String resolveCustomerEmail(Order order) {
        if (order.getCustomerId() != null) {
            var customerOpt = customerRepository.findByIdAndGarageId(
                    order.getCustomerId(), order.getGarageId());
            if (customerOpt.isPresent() && customerOpt.get().getEmail() != null
                    && !customerOpt.get().getEmail().isBlank()) {
                return customerOpt.get().getEmail();
            }
        }
        return null;
    }

    private Invoice buildInvoiceFromOrder(Order order) {
        List<Invoice.InvoiceItem> invoiceItems = new ArrayList<>();
        if (order.getLineItems() != null) {
            for (Order.OrderLineItem li : order.getLineItems()) {
                invoiceItems.add(Invoice.InvoiceItem.builder()
                        .itemType(li.getItemType())
                        .serviceId(li.getServiceId())
                        .partId(li.getPartId())
                        .description(li.getDescription())
                        .hsnSac(li.getHsnSac())
                        .qty(li.getQty())
                        .rate(li.getRate())
                        .discount(li.getDiscountPercent())
                        .amount(li.getAmount())
                        .gstRate(li.getGstRate())
                        .gstAmount(li.getGstAmount())
                        .gstInclusive(false)
                        .build());
            }
        }

        return Invoice.builder()
                .type(order.getEstimateType() != null ? order.getEstimateType() : "tax")
                .repairOrderId(order.getId())
                .customerId(order.getCustomerId())
                .customerName(order.getCustomerName())
                .customerPhone(order.getCustomerPhone())
                .items(invoiceItems)
                .totalAmount(order.getSubtotal())
                .gstAmount(order.getTotalGst())
                .grandTotal(order.getGrandTotal())
                .discount(order.getDiscountAmount())
                .date(LocalDate.now().toString())
                .placeOfSupply(order.getPlaceOfSupply())
                .build();
    }

    // ─── Counts ───

    public Map<String, Long> getOrderCounts(String garageId) {
        Map<String, Long> counts = new LinkedHashMap<>();
        String[] statuses = {"open", "wip", "payment_due", "completed", "cancelled"};
        for (String status : statuses) {
            counts.put(status, orderRepository.countByGarageIdAndStatus(garageId, status));
        }
        return counts;
    }

    // ─── Delivery alerts ───

    public List<Order> getDeliveryAlerts(String garageId) {
        String today = LocalDate.now().toString();
        List<String> activeStatuses = List.of("wip");
        return orderRepository.findByGarageIdAndEstimatedDeliveryDateAndStatusIn(
                garageId, today, activeStatuses);
    }

    // ─── Vehicle analytics ───

    public List<VehicleAnalytics> getVehicleAnalytics(String garageId) {
        return vehicleAnalyticsRepository.findByGarageIdOrderByCountDesc(garageId);
    }

    private void trackVehicleAnalytics(String garageId, String vehicleId) {
        if (vehicleId == null) return;

        try {
            Vehicle vehicle = vehicleRepository.findById(vehicleId).orElse(null);
            if (vehicle == null || vehicle.getBrandId() == null) return;

            // Only count if this vehicle hasn't been serviced at this garage before
            boolean alreadyCounted = orderRepository.existsByGarageIdAndVehicleId(garageId, vehicleId);
            if (alreadyCounted) return;

            // Upsert the analytics counter
            Query query = Query.query(Criteria.where("garageId").is(garageId)
                    .and("brandId").is(vehicle.getBrandId()));
            Update update = new Update()
                    .inc("count", 1)
                    .set("brandName", vehicle.getBrandName())
                    .set("lastUpdatedAt", LocalDateTime.now());
            mongoTemplate.upsert(query, update, VehicleAnalytics.class);

            log.debug("Vehicle analytics updated for brand {} in garage {}", vehicle.getBrandName(), garageId);
        } catch (Exception e) {
            log.warn("Failed to track vehicle analytics: {}", e.getMessage());
        }
    }

    // ─── Job Card Generator ───

    private String generateJobCard(String garageId) {
        int year = Year.now().getValue();
        List<Order> existingOrders = orderRepository.findByGarageIdOrderByCreatedAtDesc(garageId);

        String prefix = "JC-" + year + "-";
        long count = existingOrders.stream()
                .filter(o -> o.getJobCard() != null && o.getJobCard().startsWith(prefix))
                .count();

        return String.format("JC-%d-%03d", year, count + 1);
    }
}
