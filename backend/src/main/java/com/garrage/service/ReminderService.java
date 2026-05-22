package com.garrage.service;

import com.garrage.exception.ResourceNotFoundException;
import com.garrage.model.ServiceReminder;
import com.garrage.repository.ReminderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReminderService {

    private final ReminderRepository reminderRepository;
    private final ActivityLogService activityLogService;

    public ServiceReminder createReminder(ServiceReminder reminder, String garageId) {
        log.info("Creating service reminder for garage {}", garageId);
        reminder.setGarageId(garageId);
        ServiceReminder saved = reminderRepository.save(reminder);
        activityLogService.log("CREATE", "REMINDER", saved.getId(),
                "created reminder for " + saved.getCustomerName());
        return saved;
    }

    public List<ServiceReminder> getReminders(String garageId) {
        log.info("Fetching all reminders for garage {}", garageId);
        return reminderRepository.findByGarageId(garageId);
    }

    public List<ServiceReminder> getRemindersByStatus(String garageId, String status) {
        log.info("Fetching reminders with status '{}' for garage {}", status, garageId);
        return reminderRepository.findByGarageIdAndStatus(garageId, status);
    }

    public ServiceReminder updateReminder(String id, ServiceReminder updates, String garageId) {
        log.info("Updating reminder {} for garage {}", id, garageId);
        ServiceReminder reminder = reminderRepository.findByIdAndGarageId(id, garageId)
                .orElseThrow(() -> new ResourceNotFoundException("Reminder not found with id: " + id));

        reminder.setCustomerId(updates.getCustomerId());
        reminder.setCustomerName(updates.getCustomerName());
        reminder.setCustomerPhone(updates.getCustomerPhone());
        reminder.setVehicleNumber(updates.getVehicleNumber());
        reminder.setVehicleName(updates.getVehicleName());
        reminder.setServiceType(updates.getServiceType());
        reminder.setDueDate(updates.getDueDate());
        reminder.setStatus(updates.getStatus());
        reminder.setLastServiceDate(updates.getLastServiceDate());
        reminder.setKmsDue(updates.getKmsDue());
        reminder.setNotes(updates.getNotes());

        ServiceReminder saved = reminderRepository.save(reminder);
        activityLogService.log("UPDATE", "REMINDER", saved.getId(),
                "updated reminder for " + saved.getCustomerName());
        return saved;
    }
}
