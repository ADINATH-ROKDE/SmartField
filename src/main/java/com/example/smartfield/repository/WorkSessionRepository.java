package com.example.smartfield.repository;

import com.example.smartfield.model.WorkSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface WorkSessionRepository extends JpaRepository<WorkSession, Long> {
    Optional<WorkSession> findByUserIdAndWorkDate(Long userId, LocalDate workDate);
    List<WorkSession> findByWorkDate(LocalDate workDate);
}
