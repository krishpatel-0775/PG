package com.example.backend.ai.tool;

import com.example.backend.propertymanagement.entity.Bed;
import com.example.backend.propertymanagement.entity.BedStatus;
import com.example.backend.propertymanagement.entity.Property;
import com.example.backend.propertymanagement.repository.BedRepository;
import com.example.backend.propertymanagement.repository.PropertyRepository;
import com.example.backend.usermanagement.entity.Role;
import com.example.backend.usermanagement.entity.User;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Tool for inspecting bed occupancy, vacancies, and room capacities.
 * Accurately calculates occupancy percentages and isolates property ownership.
 */
@Component
public class VacantBedsTool implements AiTool {

    private final PropertyRepository propertyRepository;
    private final BedRepository bedRepository;

    public VacantBedsTool(PropertyRepository propertyRepository, BedRepository bedRepository) {
        this.propertyRepository = propertyRepository;
        this.bedRepository = bedRepository;
    }

    @Override
    public String getName() {
        return "getVacantBeds";
    }

    @Override
    public String getDescription() {
        return "Retrieves vacant beds, room availability, total capacity, and occupancy rates.";
    }

    @Override
    public boolean isAuthorized(User user) {
        return user != null && user.getRole() != null;
    }

    @Override
    public ToolExecutionResult execute(User user, Map<String, Object> parameters) {
        Role role = user.getRole();
        List<Property> properties;

        if (role == Role.ROLE_SUPER_ADMIN) {
            properties = propertyRepository.findAll();
        } else if (role == Role.ROLE_PG_OWNER || role == Role.ROLE_STAFF) {
            properties = propertyRepository.findByOwnerId(user.getId());
        } else {
            // Tenants can view general room capacity info
            properties = propertyRepository.findAll();
        }

        if (properties == null || properties.isEmpty()) {
            return ToolExecutionResult.empty(getName(), "No registered properties found in your account.");
        }

        long totalBeds = 0;
        long vacantBeds = 0;
        long occupiedBeds = 0;
        long maintenanceBeds = 0;
        List<String> vacantList = new ArrayList<>();

        for (Property prop : properties) {
            List<Bed> beds = bedRepository.findByRoomPropertyId(prop.getId());
            if (beds != null) {
                for (Bed bed : beds) {
                    totalBeds++;
                    if (bed.getStatus() == BedStatus.VACANT) {
                        vacantBeds++;
                        String roomNo = bed.getRoom() != null ? bed.getRoom().getRoomNumber() : "N/A";
                        Double rent = (bed.getRoom() != null && bed.getRoom().getBaseRent() != null) ? bed.getRoom().getBaseRent() : 0.0;
                        vacantList.add(prop.getName() + " -> Room " + roomNo + ", Bed " + bed.getBedNumber() + " (Rent: ₹" + rent + "/mo)");
                    } else if (bed.getStatus() == BedStatus.OCCUPIED) {
                        occupiedBeds++;
                    } else if (bed.getStatus() == BedStatus.MAINTENANCE) {
                        maintenanceBeds++;
                    }
                }
            }
        }

        double occupancyRate = (totalBeds > 0) ? ((double) occupiedBeds / totalBeds) * 100.0 : 0.0;

        StringBuilder summary = new StringBuilder();
        summary.append("### 🛏️ Bed Occupancy & Vacancy Breakdown\n");
        summary.append("- **Total Properties:** ").append(properties.size()).append("\n");
        summary.append("- **Total Bed Capacity:** ").append(totalBeds).append("\n");
        summary.append("- **Occupied Beds:** ").append(occupiedBeds)
                .append(" (").append(String.format(Locale.US, "%.1f", occupancyRate)).append("% occupancy)\n");
        summary.append("- **Vacant Beds Available:** **").append(vacantBeds).append("**\n");
        if (maintenanceBeds > 0) {
            summary.append("- **Under Maintenance:** ").append(maintenanceBeds).append("\n");
        }

        if (!vacantList.isEmpty()) {
            summary.append("\n**Available Vacant Beds:**\n");
            int limit = Math.min(vacantList.size(), 20);
            for (int i = 0; i < limit; i++) {
                summary.append("  * ").append(vacantList.get(i)).append("\n");
            }
            if (vacantList.size() > limit) {
                summary.append("  * ...and ").append(vacantList.size() - limit).append(" more vacant beds available.\n");
            }
        } else {
            summary.append("\n*Notice: All beds are currently fully occupied (100% capacity).*\n");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("totalBeds", totalBeds);
        data.put("vacantBeds", vacantBeds);
        data.put("occupiedBeds", occupiedBeds);
        data.put("occupancyPercentage", occupancyRate);
        data.put("vacantList", vacantList);

        return ToolExecutionResult.builder()
                .toolName(getName())
                .success(true)
                .summaryText(summary.toString())
                .structuredData(data)
                .recordCount((int) vacantBeds)
                .build();
    }
}
