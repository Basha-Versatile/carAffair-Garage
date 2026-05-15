package com.garrage.repository;

import com.garrage.model.Brand;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface BrandRepository extends MongoRepository<Brand, String> {
    Optional<Brand> findByNameIgnoreCase(String name);
}
