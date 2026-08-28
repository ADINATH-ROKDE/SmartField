package com.example.smartfield.model;

import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "work_sessions")
public class WorkSession {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @ManyToOne(optional = false) public User user;
    public LocalDate workDate;
    public LocalDateTime startTime;
    public LocalDateTime endTime;
    public Double startLatitude;
    public Double startLongitude;
    public Double endLatitude;
    public Double endLongitude;
    public Double totalDistanceKm = 0.0;
    public Double workingHours = 0.0;
    public String status = "NOT_STARTED";

    public WorkSession() {}
    public WorkSession(User user) { this.user = user; this.workDate = LocalDate.now(); }
}
