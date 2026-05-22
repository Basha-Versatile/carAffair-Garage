package com.garrage.service;

import com.garrage.model.TaxProfile;
import com.garrage.repository.TaxProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TaxProfileService {

    private final TaxProfileRepository taxProfileRepository;
    private final ActivityLogService activityLogService;

    public List<TaxProfile> getProfiles(String garageId) {
        return taxProfileRepository.findByGarageId(garageId);
    }

    public List<TaxProfile> getProfilesByType(String garageId, String taxType) {
        return taxProfileRepository.findByGarageIdAndTaxType(garageId, taxType);
    }

    public TaxProfile createProfile(TaxProfile profile, String garageId) {
        profile.setGarageId(garageId);
        TaxProfile saved = taxProfileRepository.save(profile);
        activityLogService.log("CREATE", "TAX_PROFILE", saved.getId(),
                "created tax profile '" + saved.getName() + "'");
        return saved;
    }
}
