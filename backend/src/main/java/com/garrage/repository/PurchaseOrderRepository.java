package com.garrage.repository;

import com.garrage.model.PurchaseOrder;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PurchaseOrderRepository extends MongoRepository<PurchaseOrder, String> {
    List<PurchaseOrder> findByGarageIdOrderByCreatedAtDesc(String garageId);
}
