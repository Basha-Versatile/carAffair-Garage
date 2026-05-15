package com.garrage.repository;

import com.garrage.model.Vendor;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface VendorRepository extends MongoRepository<Vendor, String> {
    List<Vendor> findByGarageId(String garageId);
    List<Vendor> findByStatus(String status);
    List<Vendor> findBySourceAndStatus(String source, String status);
    Optional<Vendor> findByIdAndGarageId(String id, String garageId);
}
