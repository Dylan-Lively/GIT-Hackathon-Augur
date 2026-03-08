package com.dylanlively.Augur;

import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class SimulateController {

    @PostMapping("/simulate")
    public Map<String, Object> simulate(@RequestBody Map<String, Object> request) {
        String preset = (String) request.get("preset");
        System.out.println("Running simulation for: " + preset);
        return Map.of("status", "ok", "preset", preset);
    }
}