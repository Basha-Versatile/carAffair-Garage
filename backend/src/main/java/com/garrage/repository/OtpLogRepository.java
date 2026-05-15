package com.garrage.repository;

import com.garrage.model.OtpLog;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface OtpLogRepository extends MongoRepository<OtpLog, String> {
    Optional<OtpLog> findTopByPhoneAndVerifiedFalseOrderByCreatedAtDesc(String phone);
    void deleteByPhoneAndVerifiedFalse(String phone);
}
