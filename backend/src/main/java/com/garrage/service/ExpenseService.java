package com.garrage.service;

import com.garrage.model.Expense;
import com.garrage.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Year;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;

    public List<Expense> getExpenses(String garageId) {
        return expenseRepository.findByGarageIdOrderByCreatedAtDesc(garageId);
    }

    public Expense createExpense(Expense expense, String garageId) {
        expense.setGarageId(garageId);
        expense.setVoucherNo(generateVoucherNo(garageId));
        log.info("Creating expense {} for garage {}", expense.getVoucherNo(), garageId);
        return expenseRepository.save(expense);
    }

    private String generateVoucherNo(String garageId) {
        int year = Year.now().getValue();
        List<Expense> existing = expenseRepository.findByGarageIdOrderByCreatedAtDesc(garageId);
        long count = existing.stream()
                .filter(e -> e.getVoucherNo() != null
                        && e.getVoucherNo().startsWith("EXP-" + year))
                .count();
        return String.format("EXP-%d-%04d", year, count + 1);
    }
}
