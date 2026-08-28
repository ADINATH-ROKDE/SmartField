package com.example.smartfield.controller;

import com.example.smartfield.model.*;
import com.example.smartfield.repository.*;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.*;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class ApiController {
    private final UserRepository users;
    private final WorkSessionRepository sessions;
    private final LocationPointRepository points;
    private final BreakRepository breaks;
    private final WorkPolicyRepository policies;
    private final AuditLogRepository audits;

    public ApiController(UserRepository users, WorkSessionRepository sessions, LocationPointRepository points,
                         BreakRepository breaks, WorkPolicyRepository policies, AuditLogRepository audits) {
        this.users = users; this.sessions = sessions; this.points = points; this.breaks = breaks;
        this.policies = policies; this.audits = audits;
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody LoginRequest request, HttpSession httpSession) {
        User user = users.findByUsername(request.username())
                .filter(found -> found.password.equals(request.password()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password"));
        httpSession.setAttribute("userId", user.id);
        return Map.of("id", user.id, "name", user.name, "role", user.role);
    }

    @PostMapping("/logout")
    public Map<String, String> logout(HttpSession session) {
        session.invalidate();
        return Map.of("message", "Logged out");
    }

    @GetMapping("/me")
    public Map<String, Object> me(HttpSession session) {
        User user = currentUser(session);
        return Map.of("id", user.id, "name", user.name, "role", user.role);
    }

    @GetMapping("/salesman/today")
    public Map<String, Object> salesmanToday(HttpSession httpSession) {
        User user = salesman(httpSession);
        WorkSession work = sessions.findByUserIdAndWorkDate(user.id, LocalDate.now()).orElse(null);
        if (work != null) return sessionView(work);
        Map<String, Object> empty = new LinkedHashMap<>();
        empty.put("user", user.name); empty.put("session", null); empty.put("minimumHours", minimumHours());
        return empty;
    }

    @PostMapping("/salesman/start")
    public Map<String, Object> startDay(@RequestBody LocationRequest request, HttpSession httpSession) {
        User user = salesman(httpSession);
        WorkSession work = sessions.findByUserIdAndWorkDate(user.id, LocalDate.now()).orElseGet(() -> new WorkSession(user));
        if (work.startTime != null && !"NOT_STARTED".equals(work.status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Today's day has already started");
        }
        work.startTime = LocalDateTime.now(); work.startLatitude = request.latitude(); work.startLongitude = request.longitude();
        work.status = "WORKING"; work.totalDistanceKm = 0.0;
        work = sessions.save(work);
        points.save(new LocationPoint(work, request.latitude(), request.longitude(), request.accuracy()));
        return sessionView(work);
    }

    @PostMapping("/salesman/location")
    public Map<String, Object> addLocation(@RequestBody LocationRequest request, HttpSession httpSession) {
        WorkSession work = activeSession(httpSession);
        List<LocationPoint> existing = points.findBySessionIdOrderByRecordedAtAsc(work.id);
        if (!existing.isEmpty()) {
            LocationPoint previous = existing.get(existing.size() - 1);
            work.totalDistanceKm += distance(previous.latitude, previous.longitude, request.latitude(), request.longitude());
        }
        points.save(new LocationPoint(work, request.latitude(), request.longitude(), request.accuracy()));
        sessions.save(work);
        return sessionView(work);
    }

    @PostMapping("/salesman/break/start")
    public Map<String, Object> startBreak(HttpSession httpSession) {
        WorkSession work = activeSession(httpSession);
        if (breaks.findBySessionId(work.id).stream().anyMatch(item -> item.endTime == null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A break is already active");
        }
        work.status = "ON_BREAK"; sessions.save(work); breaks.save(new BreakRecord(work));
        return sessionView(work);
    }

    @PostMapping("/salesman/break/end")
    public Map<String, Object> endBreak(HttpSession httpSession) {
        WorkSession work = activeSession(httpSession);
        BreakRecord current = breaks.findBySessionId(work.id).stream().filter(item -> item.endTime == null).findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active break"));
        current.endTime = LocalDateTime.now(); breaks.save(current); work.status = "WORKING"; sessions.save(work);
        return sessionView(work);
    }

    @PostMapping("/salesman/end")
    public Map<String, Object> endDay(@RequestBody LocationRequest request, HttpSession httpSession) {
        WorkSession work = activeSession(httpSession);
        if (breaks.findBySessionId(work.id).stream().anyMatch(item -> item.endTime == null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End the active break first");
        }
        addLocation(request, httpSession);
        work.endTime = LocalDateTime.now(); work.endLatitude = request.latitude(); work.endLongitude = request.longitude();
        work.status = "COMPLETED"; work.workingHours = calculateHours(work); sessions.save(work);
        return sessionView(work);
    }

    @GetMapping("/manager/salesmen")
    public List<Map<String, Object>> salesmen(HttpSession httpSession) {
        manager(httpSession);
        Map<Long, WorkSession> today = new HashMap<>();
        sessions.findByWorkDate(LocalDate.now()).forEach(work -> today.put(work.user.id, work));
        return users.findAll().stream().filter(user -> "SALESMAN".equals(user.role)).map(user ->
            today.containsKey(user.id) ? sessionView(today.get(user.id)) : emptySalesmanView(user)).toList();
    }

    @GetMapping("/manager/salesmen/{id}")
    public Map<String, Object> salesmanDetails(@PathVariable Long id, HttpSession httpSession) {
        manager(httpSession);
        WorkSession work = sessions.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return sessionView(work);
    }

    @GetMapping("/manager/policy")
    public Map<String, Double> policy(HttpSession httpSession) {
        manager(httpSession); return Map.of("minimumHours", minimumHours());
    }

    @PutMapping("/manager/policy")
    public Map<String, Double> updatePolicy(@RequestBody PolicyRequest request, HttpSession httpSession) {
        User manager = manager(httpSession);
        if (request.minimumHours() < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hours cannot be negative");
        WorkPolicy policy = policies.findFirstByOrderByIdAsc().orElseGet(() -> new WorkPolicy(7.0));
        String old = String.valueOf(policy.minimumHours); policy.minimumHours = request.minimumHours(); policies.save(policy);
        audits.save(new AuditLog(manager.username, "minimumHours", old, String.valueOf(request.minimumHours())));
        return Map.of("minimumHours", policy.minimumHours);
    }

    @PatchMapping("/manager/sessions/{id}")
    public Map<String, Object> editSession(@PathVariable Long id, @RequestBody SessionEditRequest request, HttpSession httpSession) {
        User manager = manager(httpSession);
        WorkSession work = sessions.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (request.workingHours() != null) {
            audits.save(new AuditLog(manager.username, "workingHours", String.valueOf(work.workingHours), String.valueOf(request.workingHours())));
            work.workingHours = request.workingHours();
        }
        if (request.status() != null) {
            audits.save(new AuditLog(manager.username, "status", work.status, request.status())); work.status = request.status();
        }
        return sessionView(sessions.save(work));
    }

    private Map<String, Object> sessionView(WorkSession work) {
        List<LocationPoint> route = points.findBySessionIdOrderByRecordedAtAsc(work.id);
        List<Map<String, Object>> locations = route.stream().map(point -> {
            Map<String, Object> location = new LinkedHashMap<>();
            location.put("latitude", point.latitude); location.put("longitude", point.longitude);
            location.put("accuracy", point.accuracy); location.put("timestamp", point.recordedAt);
            return location;
        }).toList();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", work.id); result.put("salesman", work.user.name); result.put("status", work.status);
        result.put("startTime", work.startTime); result.put("endTime", work.endTime);
        result.put("workingHours", calculateHours(work)); result.put("distanceKm", work.totalDistanceKm);
        result.put("startLatitude", work.startLatitude); result.put("startLongitude", work.startLongitude);
        result.put("endLatitude", work.endLatitude); result.put("endLongitude", work.endLongitude);
        result.put("locations", locations); result.put("minimumHours", minimumHours());
        result.put("alert", calculateHours(work) < minimumHours() && work.endTime != null ? "Working hours below required " + minimumHours() + " hours." : "");
        result.put("breaks", breaks.findBySessionId(work.id));
        return result;
    }

    private Map<String, Object> emptySalesmanView(User user) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", null); result.put("salesman", user.name); result.put("status", "NOT_STARTED");
        result.put("startTime", null); result.put("endTime", null); result.put("workingHours", 0.0);
        result.put("distanceKm", 0.0); result.put("startLatitude", null); result.put("startLongitude", null);
        result.put("endLatitude", null); result.put("endLongitude", null); result.put("locations", List.of());
        result.put("minimumHours", minimumHours()); result.put("alert", ""); result.put("breaks", List.of());
        return result;
    }

    private double calculateHours(WorkSession work) {
        if (work.startTime == null) return 0.0;
        LocalDateTime finish = work.endTime == null ? LocalDateTime.now() : work.endTime;
        long seconds = Duration.between(work.startTime, finish).getSeconds();
        long breakSeconds = breaks.findBySessionId(work.id).stream().mapToLong(item -> {
            LocalDateTime end = item.endTime == null ? (work.endTime == null ? LocalDateTime.now() : work.endTime) : item.endTime;
            return Math.max(0, Duration.between(item.startTime, end).getSeconds());
        }).sum();
        return Math.round(Math.max(0, seconds - breakSeconds) / 3600.0 * 100.0) / 100.0;
    }

    private double minimumHours() { return policies.findFirstByOrderByIdAsc().map(item -> item.minimumHours).orElse(7.0); }
    private WorkSession activeSession(HttpSession session) {
        User user = salesman(session);
        WorkSession work = sessions.findByUserIdAndWorkDate(user.id, LocalDate.now()).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start the day first"));
        if (!"WORKING".equals(work.status) && !"ON_BREAK".equals(work.status)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The work day is not active");
        return work;
    }
    private User salesman(HttpSession session) { User user = currentUser(session); if (!"SALESMAN".equals(user.role)) throw new ResponseStatusException(HttpStatus.FORBIDDEN); return user; }
    private User manager(HttpSession session) { User user = currentUser(session); if (!"MANAGER".equals(user.role)) throw new ResponseStatusException(HttpStatus.FORBIDDEN); return user; }
    private User currentUser(HttpSession session) { Object id = session.getAttribute("userId"); if (id == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in"); return users.findById((Long) id).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED)); }

    private static double distance(double firstLat, double firstLon, double secondLat, double secondLon) {
        double radius = 6371.0, lat = Math.toRadians(secondLat - firstLat), lon = Math.toRadians(secondLon - firstLon);
        double value = Math.sin(lat / 2) * Math.sin(lat / 2) + Math.cos(Math.toRadians(firstLat)) * Math.cos(Math.toRadians(secondLat)) * Math.sin(lon / 2) * Math.sin(lon / 2);
        return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
    }

    public record LoginRequest(String username, String password) {}
    public record LocationRequest(Double latitude, Double longitude, Double accuracy) {}
    public record PolicyRequest(Double minimumHours) {}
    public record SessionEditRequest(Double workingHours, String status) {}
}
