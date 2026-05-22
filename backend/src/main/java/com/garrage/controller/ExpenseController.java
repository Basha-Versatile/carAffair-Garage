package com.garrage.controller;

import com.garrage.dto.response.ApiResponse;
import com.garrage.model.Expense;
import com.garrage.security.PermissionChecker;
import com.garrage.security.TenantContext;
import com.garrage.service.ExpenseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Expense>>> getExpenses() {
        String garageId = TenantContext.getGarageId();
        log.info("GET /api/expenses for garage {}", garageId);
        List<Expense> expenses = expenseService.getExpenses(garageId);
        return ResponseEntity.ok(ApiResponse.ok(expenses));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Expense>> createExpense(@RequestBody Expense expense) {
        PermissionChecker.require("ACCOUNTS:MANAGE");
        String garageId = TenantContext.getGarageId();
        log.info("POST /api/expenses for garage {}", garageId);
        Expense created = expenseService.createExpense(expense, garageId);
        return ResponseEntity.ok(ApiResponse.ok(created));
    }
}
