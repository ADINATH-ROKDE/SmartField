package com.example.smartfield;

import com.example.smartfield.model.User;
import com.example.smartfield.model.WorkPolicy;
import com.example.smartfield.repository.UserRepository;
import com.example.smartfield.repository.WorkPolicyRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class SmartFieldApplication {
    public static void main(String[] args) {
        SpringApplication.run(SmartFieldApplication.class, args);
    }

    @Bean
    CommandLineRunner seedData(UserRepository users, WorkPolicyRepository policies) {
        return args -> {
            if (users.count() == 0) {
                users.save(new User("manager", "manager123", "Manager", "MANAGER"));
                users.save(new User("salesman", "salesman123", "Salesman", "SALESMAN"));
            }
            if (policies.count() == 0) {
                policies.save(new WorkPolicy(7.0));
            }
        };
    }
}
