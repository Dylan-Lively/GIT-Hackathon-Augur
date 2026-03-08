package com.dylanlively.Augur.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Move {
    private String id;
    private String name;
    private String icon;
    private double duration;
    private Map<String, Double> effects;
}