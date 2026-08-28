package com.example.smartfield.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    public String manager;
    public String changedField;
    @Column(length = 1000) public String oldValue;
    @Column(length = 1000) public String newValue;
    public LocalDateTime changedAt = LocalDateTime.now();

    public AuditLog() {}
    public AuditLog(String manager, String field, String oldValue, String newValue) {
        this.manager = manager; this.changedField = field; this.oldValue = oldValue; this.newValue = newValue;
    }
}
