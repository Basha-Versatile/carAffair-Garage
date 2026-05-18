package com.garrage.service;

import com.garrage.model.PartCategory;
import com.garrage.repository.PartCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PartCategoryService {

    private final PartCategoryRepository partCategoryRepository;

    public List<PartCategory> getCategories(String garageId) {
        return partCategoryRepository.findByGarageId(garageId);
    }

    public PartCategory createCategory(String name, String garageId) {
        return partCategoryRepository.findByNameIgnoreCaseAndGarageId(name, garageId)
                .orElseGet(() -> {
                    PartCategory cat = PartCategory.builder()
                            .garageId(garageId)
                            .name(name)
                            .build();
                    return partCategoryRepository.save(cat);
                });
    }
}
