package com.example.backend.propertymanagement.dto.response;

import com.example.backend.propertymanagement.entity.BedStatus;
import com.example.backend.propertymanagement.entity.Property;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Response payload representing a PG property with its summary statistics and room hierarchy.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyResponse {

    private Long id;
    private String name;
    private String address;
    private String city;
    private String state;
    private Integer totalFloors;
    private Long ownerId;
    private String ownerName;
    private String ownerEmail;
    private int totalRooms;
    private int totalBeds;
    private int vacantBeds;
    private int occupiedBeds;

    @Builder.Default
    private List<RoomResponse> rooms = new ArrayList<>();

    /**
     * Factory method mapping a Property entity to PropertyResponse DTO.
     *
     * @param property Property entity
     * @return Populated PropertyResponse DTO
     */
    public static PropertyResponse fromEntity(Property property) {
        if (property == null) return null;

        List<RoomResponse> roomResponses = property.getRooms() != null
                ? property.getRooms().stream().map(RoomResponse::fromEntity).collect(Collectors.toList())
                : new ArrayList<>();

        int totalBeds = 0;
        int vacantBeds = 0;
        int occupiedBeds = 0;

        if (property.getRooms() != null) {
            for (var room : property.getRooms()) {
                if (room.getBeds() != null) {
                    for (var bed : room.getBeds()) {
                        totalBeds++;
                        if (bed.getStatus() == BedStatus.VACANT) {
                            vacantBeds++;
                        } else if (bed.getStatus() == BedStatus.OCCUPIED) {
                            occupiedBeds++;
                        }
                    }
                }
            }
        }

        return PropertyResponse.builder()
                .id(property.getId())
                .name(property.getName())
                .address(property.getAddress())
                .city(property.getCity())
                .state(property.getState())
                .totalFloors(property.getTotalFloors())
                .ownerId(property.getOwner() != null ? property.getOwner().getId() : null)
                .ownerName(property.getOwner() != null ? property.getOwner().getName() : null)
                .ownerEmail(property.getOwner() != null ? property.getOwner().getEmail() : null)
                .totalRooms(roomResponses.size())
                .totalBeds(totalBeds)
                .vacantBeds(vacantBeds)
                .occupiedBeds(occupiedBeds)
                .rooms(roomResponses)
                .build();
    }
}
