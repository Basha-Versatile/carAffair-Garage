package com.garrage.service;

import com.garrage.model.ServiceCategory;
import com.garrage.repository.ServiceCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ServiceCategoryService {

    private final ServiceCategoryRepository serviceCategoryRepository;
    private final ActivityLogService activityLogService;

    public List<ServiceCategory> getCategories(String garageId) {
        return serviceCategoryRepository.findByGarageId(garageId);
    }

    public ServiceCategory createCategory(String name, String garageId) {
        // Return existing if same name already exists
        return serviceCategoryRepository.findByNameIgnoreCaseAndGarageId(name, garageId)
                .orElseGet(() -> {
                    ServiceCategory category = ServiceCategory.builder()
                            .garageId(garageId)
                            .name(name)
                            .build();
                    ServiceCategory saved = serviceCategoryRepository.save(category);
                    activityLogService.log("CREATE", "SERVICE_CATEGORY", saved.getId(),
                            "created service category '" + saved.getName() + "'");
                    return saved;
                });
    }
}
