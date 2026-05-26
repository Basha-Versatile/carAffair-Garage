package com.garrage.service;

import com.garrage.dto.request.CreateOrderRequest;
import com.garrage.dto.request.UpdateOrderRequest;
import com.garrage.exception.ResourceNotFoundException;
import com.garrage.model.Order;
import com.garrage.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Year;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;

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
                .build();

        Order saved = orderRepository.save(order);
        activityLogService.log("CREATE", "ORDER", saved.getId(),
                "created order " + saved.getJobCard());
        return saved;
    }

    public List<Order> getOrders(String garageId) {
        return orderRepository.findByGarageIdOrderByCreatedAtDesc(garageId);
    }

    public List<Order> getOrdersByStatus(String garageId, String status) {
        return orderRepository.findByGarageIdAndStatus(garageId, status);
    }

    public Order getOrderById(String id, String garageId) {
        return orderRepository.findByIdAndGarageId(id, garageId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
    }

    public Order updateOrder(String id, UpdateOrderRequest request, String garageId) {
        Order order = getOrderById(id, garageId);

        if (request.getStatus() != null) {
            order.setStatus(request.getStatus());
        }
        if (request.getAmount() != null) {
            order.setAmount(request.getAmount());
        }

        Order saved = orderRepository.save(order);
        activityLogService.log("UPDATE", "ORDER", saved.getId(),
                "updated order " + saved.getJobCard() + " (status: " + saved.getStatus() + ")");

        // Notify on important status changes
        String newStatus = saved.getStatus();
        if ("ready".equals(newStatus)) {
            notificationService.notifyAdmin(garageId,
                    "SERVICE_READY", "APPOINTMENTS", "high",
                    "Service Ready",
                    "Order " + saved.getJobCard() + " for " + saved.getCustomerName() + " is ready",
                    "/dashboard/orders/" + saved.getId(),
                    "ORDER", saved.getId());
        } else if ("completed".equals(newStatus)) {
            notificationService.notifyAdmin(garageId,
                    "ORDER_COMPLETED", "APPOINTMENTS", "normal",
                    "Order Completed",
                    "Order " + saved.getJobCard() + " has been completed",
                    "/dashboard/orders/" + saved.getId(),
                    "ORDER", saved.getId());
        }

        return saved;
    }

    public Map<String, Long> getOrderCounts(String garageId) {
        Map<String, Long> counts = new LinkedHashMap<>();
        String[] statuses = {"open", "wip", "ready", "payment_due", "completed"};
        for (String status : statuses) {
            counts.put(status, orderRepository.countByGarageIdAndStatus(garageId, status));
        }
        return counts;
    }

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
