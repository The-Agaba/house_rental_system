package com.collincorp.houserental.service;

import com.collincorp.houserental.api.ApiException;
import com.collincorp.houserental.domain.LogAction;
import com.collincorp.houserental.domain.NotificationType;
import com.collincorp.houserental.dto.NotificationResponse;
import com.collincorp.houserental.entity.NotificationEntity;
import com.collincorp.houserental.entity.UserEntity;
import com.collincorp.houserental.repository.NotificationRepository;
import com.collincorp.houserental.repository.UserRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;
    private final LogService logService;

    @Value("${spring.mail.username}")
    private String senderEmail;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserRepository userRepository,
            JavaMailSender mailSender,
            LogService logService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.mailSender = mailSender;
        this.logService = logService;
    }

    @Transactional
    public NotificationResponse sendNotification(Long recipientId, NotificationType type, String title, String message, Long referenceId) {
        UserEntity recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "user_not_found"));

        NotificationEntity entity = new NotificationEntity();
        entity.setRecipient(recipient);
        entity.setType(type);
        entity.setTitle(title);
        entity.setMessage(message);
        entity.setReferenceId(referenceId);
        entity.setRead(false);

        boolean emailSent = false;
        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setFrom(senderEmail);
            mailMessage.setTo(recipient.getEmail());
            mailMessage.setSubject("RentHub: " + title);
            mailMessage.setText(message);
            mailSender.send(mailMessage);
            emailSent = true;
        } catch (Exception e) {
            // Log failure but don't fail transaction
            logService.log(LogAction.NOTIFICATION_SENT, "notification", null, recipient.getId(), recipient.getEmail(), "Failed to send email to " + recipient.getEmail() + ": " + e.getMessage());
        }

        entity.setEmailSent(emailSent);
        notificationRepository.save(entity);

        logService.log(LogAction.NOTIFICATION_SENT, "notification", entity.getId(), recipient.getId(), recipient.getEmail(), "Notification sent. Type: " + type.name());

        return toResponse(entity);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(Long userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public int getUnreadCount(Long userId) {
        return notificationRepository.countByRecipientIdAndReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        NotificationEntity notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "notification_not_found"));

        if (!notification.getRecipient().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "unauthorized");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<NotificationEntity> unread = notificationRepository.findByRecipientIdAndReadFalse(userId);
        for (NotificationEntity notification : unread) {
            notification.setRead(true);
        }
        notificationRepository.saveAll(unread);
    }

    private NotificationResponse toResponse(NotificationEntity entity) {
        return new NotificationResponse(
                entity.getId(),
                entity.getRecipient().getId(),
                entity.getType(),
                entity.getTitle(),
                entity.getMessage(),
                entity.isRead(),
                entity.isEmailSent(),
                entity.getReferenceId(),
                entity.getCreatedAt()
        );
    }
}
