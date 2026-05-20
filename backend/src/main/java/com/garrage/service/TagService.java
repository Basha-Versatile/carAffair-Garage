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

    public List<Tag> getTags(String garageId) {
        return tagRepository.findByGarageId(garageId);
    }

    public List<Tag> getTagsByType(String garageId, String type) {
        return tagRepository.findByGarageIdAndType(garageId, type);
    }

    public Tag createTag(Tag tag, String garageId) {
        tag.setGarageId(garageId);
        return tagRepository.save(tag);
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
        return tagRepository.save(existing);
    }

    public void deleteTag(String id, String garageId) {
        Tag existing = tagRepository.findById(id)
                .orElseThrow(() -> new com.garrage.exception.ResourceNotFoundException("Tag not found: " + id));
        if (!garageId.equals(existing.getGarageId())) {
            throw new IllegalArgumentException("Tag does not belong to this garage");
        }
        tagRepository.deleteById(id);
    }
}
