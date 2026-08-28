package com.example.smartfield.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "breaks")
public class BreakRecord {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @ManyToOne(optional = false) public WorkSession session;
    public LocalDateTime startTime;
    public LocalDateTime endTime;

    public BreakRecord() {}
    public BreakRecord(WorkSession session) { this.session = session; this.startTime = LocalDateTime.now(); }
}
