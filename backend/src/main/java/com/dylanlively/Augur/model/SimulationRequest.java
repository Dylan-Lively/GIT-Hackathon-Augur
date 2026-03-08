package com.dylanlively.Augur.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SimulationRequest {
    private String preset;
    private double horizon;
    private int maxCombos;
    private int beamWidth;
    private ScoringWeights scoringWeights;
    private CoffeeShopState initialState;
}