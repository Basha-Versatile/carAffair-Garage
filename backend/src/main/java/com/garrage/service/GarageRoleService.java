package com.garrage.service;

import com.garrage.dto.request.CreateRoleRequest;
import com.garrage.dto.request.UpdateRoleRequest;
import com.garrage.exception.BadRequestException;
import com.garrage.exception.ResourceNotFoundException;
import com.garrage.model.GarageRole;
import com.garrage.model.User;
import com.garrage.repository.GarageRoleRepository;
import com.garrage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class GarageRoleService {

    private final GarageRoleRepository garageRoleRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;

    private static final Set<String> VALID_PERMISSIONS = Set.of(
            "DASHBOARD:VIEW", "DASHBOARD:MANAGE",
            "ORDERS:VIEW", "ORDERS:MANAGE",
            "INVOICES:VIEW", "INVOICES:MANAGE",
            "INVENTORY:VIEW", "INVENTORY:MANAGE",
            "ACCOUNTS:VIEW", "ACCOUNTS:MANAGE",
            "CUSTOMERS:VIEW", "CUSTOMERS:MANAGE",
            "VENDORS:VIEW", "VENDORS:MANAGE",
            "VEHICLES:VIEW", "VEHICLES:MANAGE",
            "APPOINTMENTS:VIEW", "APPOINTMENTS:MANAGE",
            "REMINDERS:VIEW", "REMINDERS:MANAGE",
            "REPORTS:VIEW", "REPORTS:MANAGE",
            "SETTINGS:VIEW", "SETTINGS:MANAGE",
            "LOGS:VIEW", "LOGS:MANAGE"
    );

    public List<GarageRole> listRoles(String garageId) {
        return garageRoleRepository.findByGarageIdAndIsActiveTrue(garageId);
    }

    public GarageRole createRole(CreateRoleRequest request, String garageId) {
        validatePermissions(request.getPermissions());

        if (garageRoleRepository.existsByGarageIdAndNameIgnoreCase(garageId, request.getName().trim())) {
            throw new BadRequestException("A role with this name already exists in your garage");
        }

        GarageRole role = GarageRole.builder()
                .garageId(garageId)
                .name(request.getName().trim())
                .description(request.getDescription())
                .permissions(request.getPermissions())
                .isActive(true)
                .build();

        role = garageRoleRepository.save(role);
        log.info("Role created: {} for garage {}", role.getName(), garageId);
        activityLogService.log("CREATE", "ROLE", role.getId(),
                "created role '" + role.getName() + "'");
        return role;
    }

    public GarageRole updateRole(String id, UpdateRoleRequest request, String garageId) {
        GarageRole role = garageRoleRepository.findByIdAndGarageId(id, garageId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));

        validatePermissions(request.getPermissions());

        role.setName(request.getName().trim());
        role.setDescription(request.getDescription());
        role.setPermissions(request.getPermissions());
        role = garageRoleRepository.save(role);
        log.info("Role updated: {} for garage {}", role.getName(), garageId);
        activityLogService.log("UPDATE", "ROLE", role.getId(),
                "updated role '" + role.getName() + "'");
        return role;
    }

    public void deleteRole(String id, String garageId) {
        GarageRole role = garageRoleRepository.findByIdAndGarageId(id, garageId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));

        // Check if any active staff members are assigned this role
        List<User> assignedStaff = userRepository.findByGarageIdAndRoleAndGarageRoleId(
                garageId, "garage_staff", id);
        long activeCount = assignedStaff.stream().filter(User::isActive).count();
        if (activeCount > 0) {
            throw new BadRequestException(
                    "Cannot delete this role. " + activeCount + " active staff member(s) are assigned to it. " +
                    "Reassign them to a different role first.");
        }

        role.setActive(false);
        garageRoleRepository.save(role);
        log.info("Role deleted: {} for garage {}", role.getName(), garageId);
        activityLogService.log("DELETE", "ROLE", role.getId(),
                "deleted role '" + role.getName() + "'");
    }

    public GarageRole getRoleById(String id, String garageId) {
        return garageRoleRepository.findByIdAndGarageId(id, garageId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));
    }

    private void validatePermissions(List<String> permissions) {
        if (permissions == null || permissions.isEmpty()) {
            throw new BadRequestException("At least one permission is required");
        }
        for (String p : permissions) {
            if (!VALID_PERMISSIONS.contains(p)) {
                throw new BadRequestException("Invalid permission: " + p);
            }
        }
    }
}
