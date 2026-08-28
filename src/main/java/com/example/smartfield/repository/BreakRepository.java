package com.example.smartfield.repository;

import com.example.smartfield.model.BreakRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BreakRepository extends JpaRepository<BreakRecord, Long> {
    List<BreakRecord> findBySessionId(Long sessionId);
}
