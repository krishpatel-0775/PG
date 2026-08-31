package com.example.backend.propertymanagement.entity;

/**
 * Enumeration representing room occupancy types and their corresponding bed capacities.
 */
public enum RoomType {
    SINGLE(1),
    DOUBLE(2),
    TRIPLE(3),
    FOUR_SHARING(4);

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
}
