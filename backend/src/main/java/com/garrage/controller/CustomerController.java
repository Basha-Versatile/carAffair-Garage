package com.garrage.controller;

import com.garrage.dto.request.CreateCustomerRequest;
import com.garrage.dto.response.ApiResponse;
import com.garrage.model.Customer;
import com.garrage.security.TenantContext;
import com.garrage.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Customer>>> getCustomers() {
        List<Customer> customers = customerService.getCustomers(TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(customers));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Customer>> createCustomer(@Valid @RequestBody CreateCustomerRequest request) {
        Customer customer = customerService.createCustomer(request, TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(customer));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<Customer>>> searchCustomers(@RequestParam("q") String query) {
        List<Customer> customers = customerService.searchCustomers(query, TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(customers));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Customer>> getCustomerById(@PathVariable String id) {
        Customer customer = customerService.getCustomerById(id, TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(customer));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Customer>> updateCustomer(
            @PathVariable String id,
            @Valid @RequestBody CreateCustomerRequest request) {
        Customer customer = customerService.updateCustomer(id, request, TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(customer));
    }
}
