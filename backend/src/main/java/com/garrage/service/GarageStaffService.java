package com.garrage.service;

import com.garrage.dto.request.CreateStaffRequest;
import com.garrage.dto.request.UpdateStaffRequest;
import com.garrage.dto.response.StaffResponse;
import com.garrage.exception.BadRequestException;
import com.garrage.exception.ResourceNotFoundException;
import com.garrage.exception.UnauthorizedException;
import com.garrage.model.GarageRole;
import com.garrage.model.User;
import com.garrage.repository.GarageRoleRepository;
import com.garrage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GarageStaffService {

    private final UserRepository userRepository;
    private final GarageRoleRepository garageRoleRepository;
    private final ActivityLogService activityLogService;

    public List<StaffResponse> listStaff(String garageId) {
        List<User> staffUsers = userRepository.findByGarageIdAndRole(garageId, "garage_staff");
        return staffUsers.stream()
                .map(user -> toStaffResponse(user, garageId))
                .collect(Collectors.toList());
    }

    public StaffResponse createStaff(CreateStaffRequest request, String garageId, String garageName) {
        // Validate role exists and belongs to this garage
        GarageRole garageRole = garageRoleRepository.findByIdAndGarageId(request.getGarageRoleId(), garageId)
                .orElseThrow(() -> new BadRequestException("Selected role not found in your garage"));

        if (!garageRole.isActive()) {
            throw new BadRequestException("Selected role is inactive");
        }

        // Check if phone already exists as garage_staff for this garage
        Optional<User> existingStaff = userRepository.findFirstByPhoneAndRole(request.getPhone(), "garage_staff");
        if (existingStaff.isPresent() && garageId.equals(existingStaff.get().getGarageId())) {
            throw new BadRequestException("A staff member with this phone already exists in your garage");
        }

        // Check if phone belongs to another role
        if (userRepository.findFirstByPhoneAndRole(request.getPhone(), "garage_admin").isPresent() ||
                userRepository.findFirstByPhoneAndRole(request.getPhone(), "super_admin").isPresent()) {
            throw new BadRequestException("This phone number is already registered as an admin");
        }

        User staff = User.builder()
                .phone(request.getPhone())
                .name(request.getName())
                .email(request.getEmail())
                .role("garage_staff")
                .garageId(garageId)
                .garageName(garageName)
                .staffTitle(request.getStaffTitle())
                .garageRoleId(request.getGarageRoleId())
                .isActive(true)
                .build();

        staff = userRepository.save(staff);
        log.info("Staff created: {} (phone: {}) with role '{}' for garage {}",
                staff.getName(), staff.getPhone(), garageRole.getName(), garageId);
        activityLogService.log("CREATE", "STAFF", staff.getId(),
                "added staff member " + staff.getName() + " with role '" + garageRole.getName() + "'");
        return toStaffResponse(staff, garageId);
    }

    public StaffResponse updateStaff(String userId, UpdateStaffRequest request, String garageId) {
        User staff = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found"));

        if (!garageId.equals(staff.getGarageId()) || !"garage_staff".equals(staff.getRole())) {
            throw new UnauthorizedException("Access denied");
        }

        if (request.getGarageRoleId() != null) {
            GarageRole newRole = garageRoleRepository.findByIdAndGarageId(request.getGarageRoleId(), garageId)
                    .orElseThrow(() -> new BadRequestException("Selected role not found in your garage"));
            if (!newRole.isActive()) {
                throw new BadRequestException("Selected role is inactive");
            }
            staff.setGarageRoleId(request.getGarageRoleId());
        }

        if (request.getName() != null) staff.setName(request.getName());
        if (request.getEmail() != null) staff.setEmail(request.getEmail());
        if (request.getStaffTitle() != null) staff.setStaffTitle(request.getStaffTitle());

        staff = userRepository.save(staff);
        log.info("Staff updated: {} for garage {}", staff.getName(), garageId);
        activityLogService.log("UPDATE", "STAFF", staff.getId(),
                "updated staff member " + staff.getName());
        return toStaffResponse(staff, garageId);
    }

    public void removeStaff(String userId, String garageId) {
        User staff = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found"));

        if (!garageId.equals(staff.getGarageId()) || !"garage_staff".equals(staff.getRole())) {
            throw new UnauthorizedException("Access denied");
        }

        staff.setActive(false);
        userRepository.save(staff);
        log.info("Staff removed: {} for garage {}", staff.getName(), garageId);
        activityLogService.log("DELETE", "STAFF", staff.getId(),
                "removed staff member " + staff.getName());
    }

    private StaffResponse toStaffResponse(User user, String garageId) {
        String roleName = null;
        List<String> permissions = Collections.emptyList();

        if (user.getGarageRoleId() != null) {
            Optional<GarageRole> role = garageRoleRepository.findByIdAndGarageId(user.getGarageRoleId(), garageId);
            if (role.isPresent()) {
                roleName = role.get().getName();
                permissions = role.get().getPermissions() != null ? role.get().getPermissions() : Collections.emptyList();
            }
        }

        return StaffResponse.builder()
                .id(user.getId())
                .phone(user.getPhone())
                .name(user.getName())
                .email(user.getEmail())
                .staffTitle(user.getStaffTitle())
                .garageRoleId(user.getGarageRoleId())
                .roleName(roleName)
                .permissions(permissions)
                .isActive(user.isActive())
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .build();
    }
}
