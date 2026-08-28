package com.example.smartfield.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "location_points")
public class LocationPoint {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @ManyToOne(optional = false) public WorkSession session;
    public Double latitude;
    public Double longitude;
    public Double accuracy;
    public LocalDateTime recordedAt;

    public LocationPoint() {}
    public LocationPoint(WorkSession session, Double latitude, Double longitude, Double accuracy) {
        this.session = session; this.latitude = latitude; this.longitude = longitude;
        this.accuracy = accuracy; this.recordedAt = LocalDateTime.now();
    }
}
