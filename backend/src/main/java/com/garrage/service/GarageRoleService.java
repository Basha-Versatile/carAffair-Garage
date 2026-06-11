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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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

    // ─── Structured role permission config (single source of truth) ───

    private record RoleDef(String name, String description, List<String> permissions, List<String> financialModules) {}

    private static final Map<String, RoleDef> ROLE_DEFAULTS;
    static {
        Map<String, RoleDef> m = new LinkedHashMap<>();

        m.put("General Manager", new RoleDef(
                "General Manager",
                "Oversees all operations, staff, and reports",
                List.of(
                        "DASHBOARD:MANAGE", "ORDERS:MANAGE", "INVOICES:MANAGE",
                        "CUSTOMERS:MANAGE", "VEHICLES:MANAGE", "APPOINTMENTS:MANAGE",
                        "SERVICE_REMINDERS:MANAGE", "SERVICE_FEEDBACKS:MANAGE", "INSURANCE_DUE:MANAGE",
                        "REPORTS:MANAGE", "TALLY_EXPORT:MANAGE", "STAFF:MANAGE",
                        "ATTENDANCE:MANAGE", "LEAVES:MANAGE", "STAFF_PERFORMANCE:MANAGE",
                        "INVENTORY:VIEW", "ACCOUNTS:VIEW", "LOGS:VIEW"),
                List.of("ORDERS", "INVOICES", "INVENTORY", "ACCOUNTS", "DASHBOARD", "REPORTS")));

        m.put("Service Advisor", new RoleDef(
                "Service Advisor",
                "Manages job cards, customers, appointments, and staff",
                List.of(
                        "DASHBOARD:VIEW", "ORDERS:MANAGE", "INVOICES:VIEW",
                        "CUSTOMERS:MANAGE", "VEHICLES:MANAGE", "APPOINTMENTS:MANAGE",
                        "SERVICE_REMINDERS:VIEW", "SERVICE_FEEDBACKS:VIEW", "INSURANCE_DUE:VIEW",
                        "ATTENDANCE:VIEW", "LEAVES:VIEW",
                        "STAFF:MANAGE", "STAFF_PERFORMANCE:VIEW"),
                List.of("ORDERS", "INVOICES")));

        m.put("Technician", new RoleDef(
                "Technician",
                "Works on assigned tasks, updates progress",
                List.of(
                        "DASHBOARD:VIEW", "ORDERS:VIEW",
                        "ATTENDANCE:VIEW", "LEAVES:VIEW"),
                List.of()));

        m.put("Store Keeper", new RoleDef(
                "Store Keeper",
                "Manages inventory, vendors, and purchase orders",
                List.of(
                        "DASHBOARD:VIEW", "INVENTORY:MANAGE", "VENDORS:MANAGE",
                        "ORDERS:VIEW", "ATTENDANCE:VIEW", "LEAVES:VIEW"),
                List.of("INVENTORY")));

        m.put("Accountant", new RoleDef(
                "Accountant",
                "Manages invoices, expenses, accounts, and reports",
                List.of(
                        "DASHBOARD:VIEW", "ORDERS:VIEW", "INVOICES:MANAGE",
                        "ACCOUNTS:MANAGE", "INVENTORY:VIEW", "VENDORS:VIEW",
                        "REPORTS:MANAGE", "TALLY_EXPORT:MANAGE", "ATTENDANCE:VIEW"),
                List.of("ORDERS", "INVOICES", "INVENTORY", "ACCOUNTS", "DASHBOARD", "REPORTS")));

        m.put("Front Desk Executive", new RoleDef(
                "Front Desk Executive",
                "Handles customers, appointments, and basic job cards",
                List.of(
                        "DASHBOARD:VIEW", "ORDERS:VIEW", "CUSTOMERS:MANAGE",
                        "VEHICLES:MANAGE", "APPOINTMENTS:MANAGE",
                        "SERVICE_REMINDERS:VIEW", "SERVICE_FEEDBACKS:VIEW", "INSURANCE_DUE:VIEW",
                        "INVOICES:VIEW", "ATTENDANCE:VIEW", "LEAVES:VIEW"),
                List.of("ORDERS", "INVOICES")));

        ROLE_DEFAULTS = Map.copyOf(m);
    }

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
     * Seeds default roles for a newly created garage.
     * Idempotent: skips if roles already exist for this garage.
     */
    public void seedDefaultRoles(String garageId) {
        List<GarageRole> existing = garageRoleRepository.findByGarageId(garageId);
        if (!existing.isEmpty()) {
            log.info("Roles already exist for garage {}, skipping seed", garageId);
            return;
        }

        List<GarageRole> defaults = new ArrayList<>();
        for (RoleDef def : ROLE_DEFAULTS.values()) {
            defaults.add(GarageRole.builder()
                    .garageId(garageId)
                    .name(def.name())
                    .description(def.description())
                    .permissions(new ArrayList<>(def.permissions()))
                    .financialModules(new ArrayList<>(def.financialModules()))
                    .isDefault(true)
                    .isActive(true)
                    .build());
        }

        garageRoleRepository.saveAll(defaults);
        log.info("Seeded {} default roles for garage {}", defaults.size(), garageId);
    }

    /**
     * Syncs default role permissions for an existing garage to match the latest ROLE_DEFAULTS config.
     * Only updates default roles (isDefault=true). Custom roles are left untouched.
     * This ensures permission changes (e.g. removing STAFF_PERFORMANCE from Technician) propagate.
     */
    public void syncDefaultRolePermissions(String garageId) {
        List<GarageRole> existing = garageRoleRepository.findByGarageId(garageId);
        int updated = 0;

        for (GarageRole role : existing) {
            if (!role.isDefault()) continue;

            RoleDef def = ROLE_DEFAULTS.get(role.getName());
            if (def == null) continue;

            boolean changed = false;

            if (!new HashSet<>(def.permissions()).equals(new HashSet<>(role.getPermissions() != null ? role.getPermissions() : List.of()))) {
                role.setPermissions(new ArrayList<>(def.permissions()));
                changed = true;
            }
            if (!new HashSet<>(def.financialModules()).equals(
                    new HashSet<>(role.getFinancialModules() != null ? role.getFinancialModules() : List.of()))) {
                role.setFinancialModules(new ArrayList<>(def.financialModules()));
                changed = true;
            }
            if (!def.description().equals(role.getDescription())) {
                role.setDescription(def.description());
                changed = true;
            }

            if (changed) {
                garageRoleRepository.save(role);
                updated++;
                log.info("Synced role '{}' for garage {}", role.getName(), garageId);
            }
        }

        if (updated > 0) {
            log.info("Synced {} default roles for garage {}", updated, garageId);
        }
    }

    /**
     * Migrates legacy permission names to current format.
     * Then syncs all default roles to match ROLE_DEFAULTS config.
     */
    public void migrateAndSyncPermissions() {
        List<GarageRole> allRoles = garageRoleRepository.findAll();
        int migrated = 0;

        // Phase 1: legacy name migration (REMINDERS → granular, FINANCIAL → financialModules)
        for (GarageRole role : allRoles) {
            Set<String> perms = new HashSet<>(role.getPermissions());
            boolean changed = false;

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
            if (perms.remove("FINANCIAL:VIEW") || perms.remove("FINANCIAL:MANAGE")) {
                perms.remove("FINANCIAL:VIEW");
                perms.remove("FINANCIAL:MANAGE");
                if (role.getFinancialModules() == null || role.getFinancialModules().isEmpty()) {
                    Set<String> finMods = new HashSet<>();
                    for (String p : perms) {
                        String mod = p.split(":")[0];
                        if (VALID_FINANCIAL_MODULES.contains(mod)) finMods.add(mod);
                    }
                    role.setFinancialModules(new ArrayList<>(finMods));
                }
                changed = true;
            }

            if (changed) {
                role.setPermissions(new ArrayList<>(perms));
                garageRoleRepository.save(role);
                migrated++;
            }
        }

        if (migrated > 0) {
            log.info("Migrated legacy permissions for {} roles.", migrated);
        }

        // Phase 2: sync default roles to latest config for all garages
        Set<String> garageIds = new HashSet<>();
        for (GarageRole role : allRoles) {
            if (role.getGarageId() != null) garageIds.add(role.getGarageId());
        }
        for (String garageId : garageIds) {
            syncDefaultRolePermissions(garageId);
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
