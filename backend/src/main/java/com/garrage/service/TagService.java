package com.garrage.service;

import com.garrage.model.Tag;
import com.garrage.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
    private final ActivityLogService activityLogService;

    public List<Tag> getTags(String garageId) {
        return tagRepository.findByGarageId(garageId);
    }

    public List<Tag> getTagsByType(String garageId, String type) {
        return tagRepository.findByGarageIdAndType(garageId, type);
    }

    public Tag createTag(Tag tag, String garageId) {
        tag.setGarageId(garageId);
        Tag saved = tagRepository.save(tag);
        activityLogService.log("CREATE", "TAG", saved.getId(),
                "created tag '" + saved.getName() + "'");
        return saved;
    }

    public Tag updateTag(String id, Tag updates, String garageId) {
        Tag existing = tagRepository.findById(id)
                .orElseThrow(() -> new com.garrage.exception.ResourceNotFoundException("Tag not found: " + id));
        if (!garageId.equals(existing.getGarageId())) {
            throw new IllegalArgumentException("Tag does not belong to this garage");
        }
        if (updates.getName() != null) existing.setName(updates.getName());
        if (updates.getType() != null) existing.setType(updates.getType());
        if (updates.getColor() != null) existing.setColor(updates.getColor());
        Tag saved = tagRepository.save(existing);
        activityLogService.log("UPDATE", "TAG", saved.getId(),
                "updated tag '" + saved.getName() + "'");
        return saved;
    }

    public void deleteTag(String id, String garageId) {
        Tag existing = tagRepository.findById(id)
                .orElseThrow(() -> new com.garrage.exception.ResourceNotFoundException("Tag not found: " + id));
        if (!garageId.equals(existing.getGarageId())) {
            throw new IllegalArgumentException("Tag does not belong to this garage");
        }
        tagRepository.deleteById(id);
        activityLogService.log("DELETE", "TAG", id,
                "deleted tag '" + existing.getName() + "'");
    }
}
