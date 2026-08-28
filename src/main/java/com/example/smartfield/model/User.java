package com.example.smartfield.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @Column(unique = true, nullable = false)
    public String username;
    public String password;
    public String name;
    public String role;

    public User() {}
    public User(String username, String password, String name, String role) {
        this.username = username; this.password = password; this.name = name; this.role = role;
    }
}
