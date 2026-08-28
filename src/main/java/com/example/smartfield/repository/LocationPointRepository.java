package com.example.smartfield.repository;

import com.example.smartfield.model.LocationPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LocationPointRepository extends JpaRepository<LocationPoint, Long> {
    List<LocationPoint> findBySessionIdOrderByRecordedAtAsc(Long sessionId);
}
