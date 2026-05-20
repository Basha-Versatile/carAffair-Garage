package com.garrage.controller;

import com.garrage.dto.response.ApiResponse;
import com.garrage.model.ExpenseLabel;
import com.garrage.repository.ExpenseLabelRepository;
import com.garrage.security.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/expense-labels")
@RequiredArgsConstructor
public class ExpenseLabelController {

    private final ExpenseLabelRepository expenseLabelRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ExpenseLabel>>> getLabels() {
        String garageId = TenantContext.getGarageId();
        log.info("GET /api/expense-labels for garage {}", garageId);
        List<ExpenseLabel> labels = expenseLabelRepository.findByGarageIdOrderByCreatedAtDesc(garageId);
        return ResponseEntity.ok(ApiResponse.ok(labels));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ExpenseLabel>> createLabel(@RequestBody Map<String, String> body) {
        String garageId = TenantContext.getGarageId();
        String name = body.get("name");
        log.info("POST /api/expense-labels name='{}' for garage {}", name, garageId);
        ExpenseLabel label = ExpenseLabel.builder()
                .garageId(garageId)
                .name(name)
                .build();
        ExpenseLabel saved = expenseLabelRepository.save(label);
        return ResponseEntity.ok(ApiResponse.ok(saved));
    }
}
