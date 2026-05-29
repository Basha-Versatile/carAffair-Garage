package com.garrage.service;

import com.mongodb.client.gridfs.model.GridFSFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsOperations;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImageStorageService {

    private final GridFsOperations gridFsOperations;

    /**
     * Store a single image in GridFS with metadata.
     */
    public String storeImage(MultipartFile file, String garageId, String orderId) throws IOException {
        Document metadata = new Document();
        metadata.put("garageId", garageId);
        metadata.put("orderId", orderId);
        metadata.put("originalFilename", file.getOriginalFilename());
        metadata.put("contentType", file.getContentType());
        metadata.put("uploadedAt", LocalDateTime.now().toString());

        ObjectId fileId = gridFsOperations.store(
                file.getInputStream(),
                file.getOriginalFilename(),
                file.getContentType(),
                metadata
        );

        log.info("Image stored in GridFS: {} (order: {})", fileId.toHexString(), orderId);
        return fileId.toHexString();
    }

    /**
     * Store multiple images. Returns list of GridFS file IDs.
     */
    public List<String> storeImages(List<MultipartFile> files, String garageId, String orderId) throws IOException {
        List<String> fileIds = new ArrayList<>();
        for (MultipartFile file : files) {
            fileIds.add(storeImage(file, garageId, orderId));
        }
        return fileIds;
    }

    /**
     * Retrieve an image by its GridFS file ID.
     */
    public GridFsResource getImage(String fileId) {
        GridFSFile gridFSFile = gridFsOperations.findOne(
                Query.query(Criteria.where("_id").is(new ObjectId(fileId)))
        );
        if (gridFSFile == null) {
            return null;
        }
        return gridFsOperations.getResource(gridFSFile);
    }

    /**
     * Delete an image from GridFS.
     */
    public void deleteImage(String fileId) {
        gridFsOperations.delete(
                Query.query(Criteria.where("_id").is(new ObjectId(fileId)))
        );
        log.info("Image deleted from GridFS: {}", fileId);
    }

    /**
     * Delete all images for an order.
     */
    public void deleteImagesByOrderId(String orderId) {
        gridFsOperations.delete(
                Query.query(Criteria.where("metadata.orderId").is(orderId))
        );
        log.info("All images deleted for order: {}", orderId);
    }
}
