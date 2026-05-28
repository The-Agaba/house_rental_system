package com.collincorp.houserental.repository;

import com.collincorp.houserental.entity.NotificationEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {
    List<NotificationEntity> findByRecipientIdOrderByCreatedAtDesc(Long userId);
    int countByRecipientIdAndReadFalse(Long userId);
    List<NotificationEntity> findByRecipientIdAndReadFalse(Long userId);
}
