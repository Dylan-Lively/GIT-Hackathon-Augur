package com.dylanlively.Augur.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ScoringWeights {
    private double cashWeight;
    private double profitWeight;
    private double growthWeight;
    private double riskTolerance;
}