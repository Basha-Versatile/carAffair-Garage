package com.garrage.service;

import com.garrage.dto.request.CreateStaffRequest;
import com.garrage.dto.request.UpdateStaffRequest;
import com.garrage.dto.response.StaffResponse;
import com.garrage.exception.BadRequestException;
import com.garrage.exception.ForbiddenException;
import com.garrage.exception.ResourceNotFoundException;
import com.garrage.exception.UnauthorizedException;
import com.garrage.model.GarageRole;
import com.garrage.model.User;
import com.garrage.repository.GarageRoleRepository;
import com.garrage.repository.UserRepository;
import com.garrage.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GarageStaffService {

    private final UserRepository userRepository;
    private final GarageRoleRepository garageRoleRepository;
    private final ActivityLogService activityLogService;

    /**
     * Role hierarchy levels (lower number = higher authority).
     * Owner (garage_admin) has implicit level 0 — handled separately.
     * Roles not in this map get the lowest level (can't create anyone).
     */
    private static final Map<String, Integer> ROLE_LEVEL = Map.of(
            "General Manager", 1,
            "Service Advisor", 2,
            "Accountant", 2,
            "Front Desk Executive", 3,
            "Technician", 4,
            "Store Keeper", 4
    );

    private static final int LOWEST_LEVEL = 99;

    public List<StaffResponse> listStaff(String garageId) {
        List<User> staffUsers = userRepository.findByGarageIdAndRole(garageId, "garage_staff");
        return staffUsers.stream()
                .map(user -> toStaffResponse(user, garageId))
                .collect(Collectors.toList());
    }

    public StaffResponse createStaff(CreateStaffRequest request, String garageId,
                                     String garageName, UserPrincipal principal) {
        // Validate role exists and belongs to this garage
        GarageRole targetRole = garageRoleRepository.findByIdAndGarageId(request.getGarageRoleId(), garageId)
                .orElseThrow(() -> new BadRequestException("Selected role not found in your garage"));

        if (!targetRole.isActive()) {
            throw new BadRequestException("Selected role is inactive");
        }

        // Enforce role hierarchy for staff callers
        validateRoleHierarchy(principal, targetRole, garageId);

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
                staff.getName(), staff.getPhone(), targetRole.getName(), garageId);
        activityLogService.log("CREATE", "STAFF", staff.getId(),
                "added staff member " + staff.getName() + " with role '" + targetRole.getName() + "'");
        return toStaffResponse(staff, garageId);
    }

    public StaffResponse updateStaff(String userId, UpdateStaffRequest request,
                                     String garageId, UserPrincipal principal) {
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
            // Enforce role hierarchy for the new role being assigned
            validateRoleHierarchy(principal, newRole, garageId);
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

    public void removeStaff(String userId, String garageId, UserPrincipal principal) {
        User staff = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found"));

        if (!garageId.equals(staff.getGarageId()) || !"garage_staff".equals(staff.getRole())) {
            throw new UnauthorizedException("Access denied");
        }

        // Enforce: staff can only remove someone at or below their level
        if ("garage_staff".equals(principal.getRole()) && staff.getGarageRoleId() != null) {
            garageRoleRepository.findByIdAndGarageId(staff.getGarageRoleId(), garageId)
                    .ifPresent(targetRole -> validateRoleHierarchy(principal, targetRole, garageId));
        }

        staff.setActive(false);
        userRepository.save(staff);
        log.info("Staff removed: {} for garage {}", staff.getName(), garageId);
        activityLogService.log("DELETE", "STAFF", staff.getId(),
                "removed staff member " + staff.getName());
    }

    /**
     * Returns the list of role IDs that a given principal is allowed to assign.
     * Owner/super_admin can assign any role. Staff can only assign roles below their level.
     */
    public List<GarageRole> getAssignableRoles(String garageId, UserPrincipal principal) {
        List<GarageRole> allRoles = garageRoleRepository.findByGarageIdAndIsActiveTrue(garageId);

        // Owner / super_admin can assign any role
        if ("garage_admin".equals(principal.getRole()) || "super_admin".equals(principal.getRole())) {
            return allRoles;
        }

        int callerLevel = getCallerLevel(principal, garageId);
        return allRoles.stream()
                .filter(r -> getRoleLevel(r.getName()) > callerLevel)
                .collect(Collectors.toList());
    }

    // ── Hierarchy helpers ──

    /**
     * Validates that the caller has sufficient authority to assign the target role.
     * Owner/super_admin always pass. Staff must have a higher level than the target.
     */
    private void validateRoleHierarchy(UserPrincipal principal, GarageRole targetRole, String garageId) {
        // Owner / super_admin can assign any role
        if ("garage_admin".equals(principal.getRole()) || "super_admin".equals(principal.getRole())) {
            return;
        }

        int callerLevel = getCallerLevel(principal, garageId);
        int targetLevel = getRoleLevel(targetRole.getName());

        if (targetLevel <= callerLevel) {
            throw new ForbiddenException(
                    "You cannot assign the role '" + targetRole.getName() + "'. " +
                    "You can only create staff with roles below your own level.");
        }
    }

    private int getCallerLevel(UserPrincipal principal, String garageId) {
        // Look up the caller's garageRoleId from the User record
        User callerUser = userRepository.findById(principal.getId()).orElse(null);
        if (callerUser == null || callerUser.getGarageRoleId() == null) {
            return LOWEST_LEVEL;
        }
        GarageRole callerRole = garageRoleRepository
                .findByIdAndGarageId(callerUser.getGarageRoleId(), garageId)
                .orElse(null);
        if (callerRole == null) {
            return LOWEST_LEVEL;
        }
        return getRoleLevel(callerRole.getName());
    }

    private int getRoleLevel(String roleName) {
        return ROLE_LEVEL.getOrDefault(roleName, LOWEST_LEVEL);
    }

    // ── Response mapper ──

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
