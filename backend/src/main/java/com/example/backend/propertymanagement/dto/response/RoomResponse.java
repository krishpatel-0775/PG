package com.example.backend.propertymanagement.dto.response;

import com.example.backend.propertymanagement.entity.Room;
import com.example.backend.propertymanagement.entity.RoomType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Response payload representing a room and its associated beds.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomResponse {

    private Long id;
    private Long propertyId;
    private String roomNumber;
    private Integer floor;
    private RoomType roomType;
    private Double baseRent;
    private boolean hasAc;
    private int capacity;

    @Builder.Default
    private List<BedResponse> beds = new ArrayList<>();

    /**
     * Factory method mapping a Room entity to RoomResponse DTO.
     *
     * @param room Room entity
     * @return Populated RoomResponse DTO
     */
    public static RoomResponse fromEntity(Room room) {
        if (room == null) return null;

        List<BedResponse> bedResponses = room.getBeds() != null
                ? room.getBeds().stream().map(BedResponse::fromEntity).collect(Collectors.toList())
                : new ArrayList<>();

        return RoomResponse.builder()
                .id(room.getId())
                .propertyId(room.getProperty() != null ? room.getProperty().getId() : null)
                .roomNumber(room.getRoomNumber())
                .floor(room.getFloor())
                .roomType(room.getRoomType())
                .baseRent(room.getBaseRent())
                .hasAc(room.isHasAc())
                .capacity(room.getRoomType() != null ? room.getRoomType().getCapacity() : 0)
                .beds(bedResponses)
                .build();
    }
}
