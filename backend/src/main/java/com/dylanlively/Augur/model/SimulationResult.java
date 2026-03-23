package com.dylanlively.Augur.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SimulationResult {
    private int pathsEvaluated;
    private List<Path> topPaths;
}