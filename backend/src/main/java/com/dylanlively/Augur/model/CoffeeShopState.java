package com.dylanlively.Augur.model;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class CoffeeShopState {
    // ── base variables ────────────────────────────────────────────────────────
    private double cash;
    private double monthsElapsed;
    private int    baristas;
    private double hoursOpen;
    private double avgOrderValue;
    private double marketingSpend;
    private double rent;
    private double baristaWage;
    private double baseFootTraffic;
    private double utilityCapacity;

    // ── move trackers (how many times each has been applied) ─────────────────
    // Used by StateEngine to apply relational downsides
    private int priceRaiseCount;       // each raise softly reduces foot traffic
    private int marketingCampaignCount; // each campaign has diminishing returns

    // ── derived variables (computed by StateEngine) ───────────────────────────
    private double profit;
    private double runway;
    private double serviceCapacity;
    private double footTraffic;
    private double customersServed;
    private double revenue;
    private double operatingCosts;
}