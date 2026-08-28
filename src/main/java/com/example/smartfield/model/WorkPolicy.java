package com.example.smartfield.model;

import jakarta.persistence.*;

@Entity
@Table(name = "work_policy")
public class WorkPolicy {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    public Double minimumHours;

    public WorkPolicy() {}
    public WorkPolicy(Double minimumHours) { this.minimumHours = minimumHours; }
}
