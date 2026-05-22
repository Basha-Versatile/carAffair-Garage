package com.garrage.security;

import com.garrage.exception.ForbiddenException;
import com.garrage.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

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

    private static boolean hasImplicitAccess(String role) {
        return "super_admin".equals(role) || "garage_admin".equals(role);
    }

    /**
     * MANAGE implies VIEW. So if user has "ORDERS:MANAGE" and we check "ORDERS:VIEW", it passes.
     */
    private static boolean hasPermission(List<String> permissions, String required) {
        if (permissions.contains(required)) return true;
        if (required.endsWith(":VIEW")) {
            String module = required.split(":")[0];
            return permissions.contains(module + ":MANAGE");
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
