package com.dylanlively.Augur.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class RetailChainState extends GameState {
    // base variables
    private int locations;
    private int distributionCenters;
    private int employeesPerLocation;
    private double avgBasketSize;
    private double marketingSpend;
    private double rentPerLocation;
    private double wagePerEmployee;
    private double brandStrength;
    private double inventoryTurnover;
    private double supplyChainEfficiency;

    // derived variables
    private double footTrafficPerLocation;
    private double revenuePerLocation;
    private double totalRevenue;
    private double operatingCosts;
    private double shrinkage;
}