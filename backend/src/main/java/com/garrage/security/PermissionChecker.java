package com.garrage.security;

import com.garrage.exception.ForbiddenException;
import com.garrage.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Map;

/**
 * Central utility for checking module-level permissions.
 * <p>
 * - super_admin and garage_admin always pass (implicit full access).
 * - garage_staff must have the permission in their JWT claims.
 * - MANAGE implies VIEW (e.g., ORDERS:MANAGE also satisfies ORDERS:VIEW).
 */
public final class PermissionChecker {

    private PermissionChecker() {}

    /**
     * Checks if the current user has the required permission.
     * Throws UnauthorizedException if not.
     */
    public static void require(String permission) {
        UserPrincipal principal = getCurrentPrincipal();
        if (hasImplicitAccess(principal.getRole())) {
            return;
        }
        if (!"garage_staff".equals(principal.getRole())) {
            throw new ForbiddenException("Access denied");
        }
        if (principal.getPermissions() == null ||
                !hasPermission(principal.getPermissions(), permission)) {
            throw new ForbiddenException(
                    "You do not have permission to perform this action");
        }
    }

    /**
     * Non-throwing version — returns boolean.
     */
    public static boolean has(String permission) {
        UserPrincipal principal = getCurrentPrincipal();
        if (hasImplicitAccess(principal.getRole())) return true;
        if (!"garage_staff".equals(principal.getRole())) return false;
        return principal.getPermissions() != null &&
                hasPermission(principal.getPermissions(), permission);
    }

    /**
     * Checks if the current user can see financial data for a given module.
     * super_admin and garage_admin always see financial data.
     */
    public static boolean hasFinancialAccess(String module) {
        UserPrincipal principal = getCurrentPrincipal();
        if (hasImplicitAccess(principal.getRole())) return true;
        if (!"garage_staff".equals(principal.getRole())) return false;
        return principal.getFinancialModules() != null &&
                principal.getFinancialModules().contains(module);
    }

    private static boolean hasImplicitAccess(String role) {
        return "super_admin".equals(role) || "garage_admin".equals(role);
    }

    /**
     * Maps old (legacy) module names to the new granular module names they were split into.
     * This allows JWTs issued before the migration to still work until the user re-logs in.
     */
    private static final Map<String, List<String>> LEGACY_TO_NEW = Map.of(
            "REMINDERS", List.of("SERVICE_REMINDERS", "SERVICE_FEEDBACKS", "INSURANCE_DUE")
    );

    /**
     * MANAGE implies VIEW. So if user has "ORDERS:MANAGE" and we check "ORDERS:VIEW", it passes.
     * Also handles backward compatibility for legacy permission names.
     */
    private static boolean hasPermission(List<String> permissions, String required) {
        if (permissions.contains(required)) return true;

        String[] parts = required.split(":");
        String module = parts[0];
        String action = parts.length > 1 ? parts[1] : "";

        // MANAGE implies VIEW
        if ("VIEW".equals(action) && permissions.contains(module + ":MANAGE")) {
            return true;
        }

        // Backward compat: check if user has old legacy permission that covers the new module
        for (Map.Entry<String, List<String>> entry : LEGACY_TO_NEW.entrySet()) {
            if (entry.getValue().contains(module)) {
                String legacyPerm = entry.getKey() + ":" + action;
                if (permissions.contains(legacyPerm)) return true;
                if ("VIEW".equals(action) && permissions.contains(entry.getKey() + ":MANAGE")) return true;
            }
        }

        return false;
    }

    private static UserPrincipal getCurrentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal)) {
            throw new UnauthorizedException("Not authenticated");
        }
        return (UserPrincipal) auth.getPrincipal();
    }
}
