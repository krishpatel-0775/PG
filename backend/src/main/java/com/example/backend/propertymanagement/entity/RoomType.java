package com.example.backend.propertymanagement.entity;

import com.fasterxml.jackson.annotation.JsonCreator;

/**
 * Enumeration representing room occupancy types and their corresponding bed capacities.
 */
public enum RoomType {
    SINGLE(1),
    DOUBLE(2),
    TRIPLE(3),
    FOUR_SHARING(4),
    FIVE_SHARING(5),
    SIX_SHARING(6),
    SEVEN_SHARING(7),
    EIGHT_SHARING(8),
    NINE_SHARING(9),
    TEN_SHARING(10);

    private final int capacity;

    RoomType(int capacity) {
        this.capacity = capacity;
    }

    /**
     * Gets the number of beds associated with this room type.
     *
     * @return Total bed capacity
     */
    public int getCapacity() {
        return capacity;
    }

    @JsonCreator
    public static RoomType fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        String normalized = value.trim().toUpperCase().replace(" ", "_").replace("-", "_");
        for (RoomType type : RoomType.values()) {
            if (type.name().equalsIgnoreCase(normalized)) {
                return type;
            }
        }
        try {
            int cap = Integer.parseInt(normalized);
            for (RoomType type : RoomType.values()) {
                if (type.getCapacity() == cap) {
                    return type;
                }
            }
        } catch (NumberFormatException ignored) {}

        throw new IllegalArgumentException("Unknown room type: " + value);
    }
}
