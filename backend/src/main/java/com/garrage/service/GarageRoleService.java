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

import java.util.ArrayList;
import java.util.HashSet;
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
            "SERVICE_REMINDERS:VIEW", "SERVICE_REMINDERS:MANAGE",
            "SERVICE_FEEDBACKS:VIEW", "SERVICE_FEEDBACKS:MANAGE",
            "INSURANCE_DUE:VIEW", "INSURANCE_DUE:MANAGE",
            "REPORTS:VIEW", "REPORTS:MANAGE",
            "TALLY_EXPORT:VIEW", "TALLY_EXPORT:MANAGE",
            "SETTINGS:VIEW", "SETTINGS:MANAGE",
            "LOGS:VIEW", "LOGS:MANAGE",
            "STAFF:VIEW", "STAFF:MANAGE",
            "ATTENDANCE:VIEW", "ATTENDANCE:MANAGE",
            "LEAVES:VIEW", "LEAVES:MANAGE",
            "STAFF_PERFORMANCE:VIEW", "STAFF_PERFORMANCE:MANAGE"
    );

    private static final Set<String> VALID_FINANCIAL_MODULES = Set.of(
            "ORDERS", "INVOICES", "INVENTORY", "ACCOUNTS", "DASHBOARD", "REPORTS"
    );

    public List<GarageRole> listRoles(String garageId) {
        return garageRoleRepository.findByGarageIdAndIsActiveTrue(garageId);
    }

    public GarageRole createRole(CreateRoleRequest request, String garageId) {
        validatePermissions(request.getPermissions());
        validateFinancialModules(request.getFinancialModules());

        if (garageRoleRepository.existsByGarageIdAndNameIgnoreCase(garageId, request.getName().trim())) {
            throw new BadRequestException("A role with this name already exists in your garage");
        }

        GarageRole role = GarageRole.builder()
                .garageId(garageId)
                .name(request.getName().trim())
                .description(request.getDescription())
                .permissions(request.getPermissions())
                .financialModules(request.getFinancialModules() != null ? request.getFinancialModules() : List.of())
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
        validateFinancialModules(request.getFinancialModules());

        role.setName(request.getName().trim());
        role.setDescription(request.getDescription());
        role.setPermissions(request.getPermissions());
        role.setFinancialModules(request.getFinancialModules() != null ? request.getFinancialModules() : List.of());
        role = garageRoleRepository.save(role);
        log.info("Role updated: {} for garage {}", role.getName(), garageId);
        activityLogService.log("UPDATE", "ROLE", role.getId(),
                "updated role '" + role.getName() + "'");
        return role;
    }

    public void deleteRole(String id, String garageId) {
        GarageRole role = garageRoleRepository.findByIdAndGarageId(id, garageId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));

        if (role.isDefault()) {
            throw new BadRequestException("Default roles cannot be deleted. You can edit their permissions instead.");
        }

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

    /**
     * Seeds the 6 default roles for a newly created garage.
     * Idempotent: skips if roles already exist for this garage.
     */
    public void seedDefaultRoles(String garageId) {
        List<GarageRole> existing = garageRoleRepository.findByGarageId(garageId);
        if (!existing.isEmpty()) {
            log.info("Roles already exist for garage {}, skipping seed", garageId);
            return;
        }

        List<GarageRole> defaults = new ArrayList<>();

        defaults.add(GarageRole.builder()
                .garageId(garageId).name("General Manager").isDefault(true)
                .description("Oversees all operations, staff, and reports")
                .permissions(List.of(
                        "DASHBOARD:MANAGE", "ORDERS:MANAGE", "INVOICES:MANAGE",
                        "CUSTOMERS:MANAGE", "VEHICLES:MANAGE", "APPOINTMENTS:MANAGE",
                        "SERVICE_REMINDERS:MANAGE", "SERVICE_FEEDBACKS:MANAGE", "INSURANCE_DUE:MANAGE",
                        "REPORTS:MANAGE", "TALLY_EXPORT:MANAGE", "STAFF:MANAGE",
                        "ATTENDANCE:MANAGE", "LEAVES:MANAGE", "STAFF_PERFORMANCE:MANAGE",
                        "INVENTORY:VIEW", "ACCOUNTS:VIEW", "LOGS:VIEW"))
                .financialModules(List.of("ORDERS", "INVOICES", "INVENTORY", "ACCOUNTS", "DASHBOARD", "REPORTS"))
                .build());

        defaults.add(GarageRole.builder()
                .garageId(garageId).name("Service Advisor").isDefault(true)
                .description("Manages job cards, customers, and appointments")
                .permissions(List.of(
                        "DASHBOARD:VIEW", "ORDERS:MANAGE", "INVOICES:VIEW",
                        "CUSTOMERS:MANAGE", "VEHICLES:MANAGE", "APPOINTMENTS:MANAGE",
                        "SERVICE_REMINDERS:VIEW", "SERVICE_FEEDBACKS:VIEW", "INSURANCE_DUE:VIEW",
                        "ATTENDANCE:VIEW", "LEAVES:VIEW"))
                .financialModules(List.of("ORDERS", "INVOICES"))
                .build());

        defaults.add(GarageRole.builder()
                .garageId(garageId).name("Technician").isDefault(true)
                .description("Works on assigned tasks, updates progress")
                .permissions(List.of(
                        "DASHBOARD:VIEW", "ORDERS:VIEW", "ATTENDANCE:VIEW",
                        "LEAVES:VIEW"))
                .financialModules(List.of())
                .build());

        defaults.add(GarageRole.builder()
                .garageId(garageId).name("Store Keeper").isDefault(true)
                .description("Manages inventory, vendors, and purchase orders")
                .permissions(List.of(
                        "DASHBOARD:VIEW", "INVENTORY:MANAGE", "VENDORS:MANAGE",
                        "ORDERS:VIEW", "ATTENDANCE:VIEW", "LEAVES:VIEW"))
                .financialModules(List.of("INVENTORY"))
                .build());

        defaults.add(GarageRole.builder()
                .garageId(garageId).name("Accountant").isDefault(true)
                .description("Manages invoices, expenses, accounts, and reports")
                .permissions(List.of(
                        "DASHBOARD:VIEW", "ORDERS:VIEW", "INVOICES:MANAGE",
                        "ACCOUNTS:MANAGE", "INVENTORY:VIEW", "VENDORS:VIEW",
                        "REPORTS:MANAGE", "TALLY_EXPORT:MANAGE", "ATTENDANCE:VIEW"))
                .financialModules(List.of("ORDERS", "INVOICES", "INVENTORY", "ACCOUNTS", "DASHBOARD", "REPORTS"))
                .build());

        defaults.add(GarageRole.builder()
                .garageId(garageId).name("Front Desk Executive").isDefault(true)
                .description("Handles customers, appointments, and basic job cards")
                .permissions(List.of(
                        "DASHBOARD:VIEW", "ORDERS:VIEW", "CUSTOMERS:MANAGE",
                        "VEHICLES:MANAGE", "APPOINTMENTS:MANAGE",
                        "SERVICE_REMINDERS:VIEW", "SERVICE_FEEDBACKS:VIEW", "INSURANCE_DUE:VIEW",
                        "INVOICES:VIEW", "ATTENDANCE:VIEW", "LEAVES:VIEW"))
                .financialModules(List.of("ORDERS", "INVOICES"))
                .build());

        garageRoleRepository.saveAll(defaults);
        log.info("Seeded {} default roles for garage {}", defaults.size(), garageId);
    }

    /**
     * Migrates old permission names to new granular ones for all existing roles.
     * Also converts FINANCIAL:VIEW/MANAGE into per-module financialModules.
     * Idempotent: only modifies roles that still have legacy permission names.
     */
    public void migrateToGranularPermissions() {
        List<GarageRole> allRoles = garageRoleRepository.findAll();
        int updated = 0;

        for (GarageRole role : allRoles) {
            Set<String> perms = new HashSet<>(role.getPermissions());
            boolean changed = false;

            // Replace REMINDERS with SERVICE_REMINDERS + SERVICE_FEEDBACKS + INSURANCE_DUE
            if (perms.remove("REMINDERS:VIEW")) {
                perms.add("SERVICE_REMINDERS:VIEW");
                perms.add("SERVICE_FEEDBACKS:VIEW");
                perms.add("INSURANCE_DUE:VIEW");
                changed = true;
            }
            if (perms.remove("REMINDERS:MANAGE")) {
                perms.add("SERVICE_REMINDERS:MANAGE");
                perms.add("SERVICE_FEEDBACKS:MANAGE");
                perms.add("INSURANCE_DUE:MANAGE");
                changed = true;
            }

            // Add STAFF_PERFORMANCE alongside ATTENDANCE (if not already present)
            if (perms.contains("ATTENDANCE:VIEW") && !perms.contains("STAFF_PERFORMANCE:VIEW")) {
                perms.add("STAFF_PERFORMANCE:VIEW");
                changed = true;
            }
            if (perms.contains("ATTENDANCE:MANAGE") && !perms.contains("STAFF_PERFORMANCE:MANAGE")) {
                perms.add("STAFF_PERFORMANCE:MANAGE");
                changed = true;
            }

            // Add TALLY_EXPORT alongside REPORTS (if not already present)
            if (perms.contains("REPORTS:VIEW") && !perms.contains("TALLY_EXPORT:VIEW")) {
                perms.add("TALLY_EXPORT:VIEW");
                changed = true;
            }
            if (perms.contains("REPORTS:MANAGE") && !perms.contains("TALLY_EXPORT:MANAGE")) {
                perms.add("TALLY_EXPORT:MANAGE");
                changed = true;
            }

            // Migrate FINANCIAL:VIEW/MANAGE to per-module financialModules
            if (perms.remove("FINANCIAL:VIEW") || perms.remove("FINANCIAL:MANAGE")) {
                perms.remove("FINANCIAL:VIEW");
                perms.remove("FINANCIAL:MANAGE");
                if (role.getFinancialModules() == null || role.getFinancialModules().isEmpty()) {
                    Set<String> finMods = new HashSet<>();
                    for (String p : perms) {
                        String mod = p.split(":")[0];
                        if (VALID_FINANCIAL_MODULES.contains(mod)) {
                            finMods.add(mod);
                        }
                    }
                    role.setFinancialModules(new ArrayList<>(finMods));
                }
                changed = true;
            }

            if (changed) {
                role.setPermissions(new ArrayList<>(perms));
                garageRoleRepository.save(role);
                updated++;
            }
        }

        if (updated > 0) {
            log.info("Migrated permissions for {} roles to granular format.", updated);
        }
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

    private void validateFinancialModules(List<String> financialModules) {
        if (financialModules == null) return;
        for (String m : financialModules) {
            if (!VALID_FINANCIAL_MODULES.contains(m)) {
                throw new BadRequestException("Invalid financial module: " + m);
            }
        }
    }
}
