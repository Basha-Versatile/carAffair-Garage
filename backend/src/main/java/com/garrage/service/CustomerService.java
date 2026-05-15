package com.garrage.service;

import com.garrage.dto.request.CreateCustomerRequest;
import com.garrage.exception.ResourceNotFoundException;
import com.garrage.model.Customer;
import com.garrage.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;

    public Customer createCustomer(CreateCustomerRequest request, String garageId) {
        Customer customer = Customer.builder()
                .garageId(garageId)
                .name(request.getName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .address(request.getAddress())
                .gstin(request.getGstin())
                .build();
        return customerRepository.save(customer);
    }

    public List<Customer> getCustomers(String garageId) {
        return customerRepository.findByGarageId(garageId);
    }

    public Customer getCustomerById(String id, String garageId) {
        return customerRepository.findByIdAndGarageId(id, garageId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
    }

    public Customer updateCustomer(String id, CreateCustomerRequest request, String garageId) {
        Customer customer = getCustomerById(id, garageId);
        customer.setName(request.getName());
        customer.setPhone(request.getPhone());
        customer.setEmail(request.getEmail());
        customer.setAddress(request.getAddress());
        customer.setGstin(request.getGstin());
        return customerRepository.save(customer);
    }

    public Optional<Customer> findByPhone(String phone, String garageId) {
        return customerRepository.findByPhoneAndGarageId(phone, garageId);
    }
}
