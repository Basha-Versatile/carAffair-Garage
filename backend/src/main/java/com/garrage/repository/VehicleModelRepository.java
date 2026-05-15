package com.garrage.repository;

import com.garrage.model.VehicleModel;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface VehicleModelRepository extends MongoRepository<VehicleModel, String> {
    List<VehicleModel> findByBrandId(String brandId);
}
