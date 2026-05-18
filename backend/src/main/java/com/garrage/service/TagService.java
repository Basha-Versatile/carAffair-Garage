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
}
