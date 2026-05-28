package com.collincorp.houserental.api.v1;

import com.collincorp.houserental.dto.NotificationResponse;
import com.collincorp.houserental.entity.UserEntity;
import com.collincorp.houserental.service.NotificationService;
import com.collincorp.houserental.support.SecurityUtils;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getMyNotifications() {
        UserEntity user = SecurityUtils.currentUser();
        return ResponseEntity.ok(notificationService.getMyNotifications(user.getId()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Integer> getUnreadCount() {
        UserEntity user = SecurityUtils.currentUser();
        return ResponseEntity.ok(notificationService.getUnreadCount(user.getId()));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        UserEntity user = SecurityUtils.currentUser();
        notificationService.markAsRead(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        UserEntity user = SecurityUtils.currentUser();
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.noContent().build();
    }
}
