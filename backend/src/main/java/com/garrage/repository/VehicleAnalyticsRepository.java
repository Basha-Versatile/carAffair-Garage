package com.garrage.repository;

import com.garrage.model.VehicleAnalytics;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface VehicleAnalyticsRepository extends MongoRepository<VehicleAnalytics, String> {

    List<VehicleAnalytics> findByGarageIdOrderByCountDesc(String garageId);

    Optional<VehicleAnalytics> findByGarageIdAndBrandId(String garageId, String brandId);
}
