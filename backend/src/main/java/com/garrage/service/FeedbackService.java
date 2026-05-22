package com.garrage.service;

import com.garrage.model.ServiceFeedback;
import com.garrage.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final ActivityLogService activityLogService;

    public ServiceFeedback createFeedback(ServiceFeedback feedback, String garageId) {
        log.info("Creating service feedback for garage {}", garageId);
        feedback.setGarageId(garageId);
        ServiceFeedback saved = feedbackRepository.save(feedback);
        activityLogService.log("CREATE", "FEEDBACK", saved.getId(),
                "created feedback for " + saved.getCustomerName());
        return saved;
    }

    public List<ServiceFeedback> getFeedbacks(String garageId) {
        log.info("Fetching all feedbacks for garage {}", garageId);
        return feedbackRepository.findByGarageId(garageId);
    }
}
