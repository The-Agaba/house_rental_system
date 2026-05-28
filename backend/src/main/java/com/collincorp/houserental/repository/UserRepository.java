package com.collincorp.houserental.repository;

import com.collincorp.houserental.domain.UserRole;
import com.collincorp.houserental.entity.UserEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<UserEntity> findByRoleAndLocality(UserRole role, String locality);

    List<UserEntity> findAllByRole(UserRole role);
}
