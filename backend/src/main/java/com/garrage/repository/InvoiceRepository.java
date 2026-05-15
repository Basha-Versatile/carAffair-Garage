package com.garrage.repository;

import com.garrage.model.Invoice;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends MongoRepository<Invoice, String> {
    List<Invoice> findByGarageIdOrderByCreatedAtDesc(String garageId);
    Optional<Invoice> findByIdAndGarageId(String id, String garageId);
}
