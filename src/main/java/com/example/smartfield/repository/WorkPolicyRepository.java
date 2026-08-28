package com.example.smartfield.repository;

import com.example.smartfield.model.WorkPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface WorkPolicyRepository extends JpaRepository<WorkPolicy, Long> {
    Optional<WorkPolicy> findFirstByOrderByIdAsc();
}
