package com.dylanlively.Augur.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class CoffeeShopState extends GameState {
    // base variables
    private int baristas;
    private double hoursOpen;
    private double avgOrderValue;
    private double marketingSpend;
    private double rent;
    private double baristaWage;
    private double baseFootTraffic;
    private double utilityCapacity;

    // derived variables
    private double serviceCapacity;
    private double footTraffic;
    private double customersServed;
    private double revenue;
    private double operatingCosts;
}