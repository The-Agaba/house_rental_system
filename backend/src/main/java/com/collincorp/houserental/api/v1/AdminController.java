package com.collincorp.houserental.api.v1;

import com.collincorp.houserental.dto.AdminStatsResponse;
import com.collincorp.houserental.dto.AdminUserPatchRequest;
import com.collincorp.houserental.dto.AdminUserSaveRequest;
import com.collincorp.houserental.dto.BookingResponse;
import com.collincorp.houserental.dto.ReservationResponse;
import com.collincorp.houserental.dto.UserResponse;
import com.collincorp.houserental.entity.SystemLogEntity;
import com.collincorp.houserental.service.AdminService;
import com.collincorp.houserental.service.BookingService;
import com.collincorp.houserental.service.LogService;
import com.collincorp.houserental.service.ReservationService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final AdminService adminService;
    private final BookingService bookingService;
    private final LogService logService;
    private final ReservationService reservationService;

    public AdminController(AdminService adminService, BookingService bookingService, LogService logService, ReservationService reservationService) {
        this.adminService = adminService;
        this.bookingService = bookingService;
        this.logService = logService;
        this.reservationService = reservationService;
    }

    @GetMapping("/users")
    public List<UserResponse> users() {
        return adminService.users();
    }

    @PostMapping("/users")
    public UserResponse createUser(@Valid @RequestBody AdminUserSaveRequest request) {
        return adminService.createUser(request);
    }

    @PutMapping("/users/{id}")
    public UserResponse updateUser(@PathVariable long id, @Valid @RequestBody AdminUserSaveRequest request) {
        return adminService.updateUser(id, request);
    }

    @PatchMapping("/users/{id}")
    public UserResponse patchUser(@PathVariable long id, @Valid @RequestBody AdminUserPatchRequest request) {
        return adminService.patchUser(id, request);
    }

    @DeleteMapping("/users/{id}")
    public void deleteUser(@PathVariable long id) {
        adminService.deleteUser(id);
    }

    @GetMapping("/stats")
    public AdminStatsResponse stats() {
        return adminService.stats();
    }

    @GetMapping("/bookings")
    public List<BookingResponse> allBookings() {
        return bookingService.listAll();
    }

    @GetMapping("/reservations")
    public List<ReservationResponse> allReservations() {
        return reservationService.getAllReservations();
    }

    @GetMapping("/logs")
    public List<SystemLogEntity> logs(@RequestParam(required = false) Integer days) {
        if (days != null && days > 0) {
            return logService.getRecentLogs(days);
        }
        return logService.getAllLogs();
    }
}
