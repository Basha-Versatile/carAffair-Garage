package com.garrage.repository;

import com.garrage.model.BrandRequest;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface BrandRequestRepository extends MongoRepository<BrandRequest, String> {

    List<BrandRequest> findAllByOrderByCreatedAtDesc();

    List<BrandRequest> findByStatus(String status);

    boolean existsByNameIgnoreCaseAndStatusNot(String name, String status);
}
