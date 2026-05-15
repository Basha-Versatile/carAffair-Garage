package com.garrage.security;

public class TenantContext {

    private static final ThreadLocal<String> CURRENT_GARAGE_ID = new ThreadLocal<>();

    public static void setGarageId(String garageId) {
        CURRENT_GARAGE_ID.set(garageId);
    }

    public static String getGarageId() {
        return CURRENT_GARAGE_ID.get();
    }

    public static void clear() {
        CURRENT_GARAGE_ID.remove();
    }
}
