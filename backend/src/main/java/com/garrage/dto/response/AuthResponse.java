package com.garrage.dto.response;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;

    private String refreshToken;

    private String userId;

    private String name;

    private String phone;

    private String role;

    private String garageId;

    private String garageName;

    /** Structured permission map: { "ORDERS": { "view": true, "manage": true, "financial": true }, ... } */
    private Map<String, ModulePermission> permissions;

    /** Only populated for garage_staff users */
    private String garageRoleId;

    /** Actual role name, e.g. "General Manager", "Technician". Only for garage_staff. */
    private String roleName;

    /** Only populated for garage_staff users */
    private String staffTitle;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModulePermission {
        private boolean view;
        private boolean manage;
        private boolean financial;
    }

    private static final List<String> ALL_MODULES = List.of(
            "DASHBOARD", "ORDERS", "INVOICES", "INVENTORY", "ACCOUNTS",
            "CUSTOMERS", "VENDORS", "VEHICLES", "APPOINTMENTS",
            "SERVICE_REMINDERS", "SERVICE_FEEDBACKS", "INSURANCE_DUE",
            "ATTENDANCE", "LEAVES", "STAFF_PERFORMANCE",
            "REPORTS", "TALLY_EXPORT", "STAFF", "SETTINGS", "LOGS"
    );

    /**
     * Builds a structured permission map from flat permission and financialModule arrays.
     * For admin roles, all modules get full access.
     */
    public static Map<String, ModulePermission> buildPermissionMap(
            String role, List<String> permissionList, List<String> financialModules) {

        boolean isAdmin = "super_admin".equals(role) || "garage_admin".equals(role);
        Set<String> perms = permissionList != null ? Set.copyOf(permissionList) : Set.of();
        Set<String> finMods = financialModules != null ? Set.copyOf(financialModules) : Set.of();

        Map<String, ModulePermission> map = new LinkedHashMap<>();
        for (String mod : ALL_MODULES) {
            if (isAdmin) {
                map.put(mod, ModulePermission.builder().view(true).manage(true).financial(true).build());
            } else {
                boolean hasManage = perms.contains(mod + ":MANAGE");
                map.put(mod, ModulePermission.builder()
                        .view(hasManage || perms.contains(mod + ":VIEW"))
                        .manage(hasManage)
                        .financial(finMods.contains(mod))
                        .build());
            }
        }
        return map;
    }
}
