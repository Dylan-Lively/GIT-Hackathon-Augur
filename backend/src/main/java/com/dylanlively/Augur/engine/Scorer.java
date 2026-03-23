package com.dylanlively.Augur.engine;

import com.dylanlively.Augur.model.*;

public class Scorer {

    public double score(CoffeeShopState state, ScoringWeights weights,
                        double initialCash, double initialRevenue, double initialCustomers) {

        double cashScore   = normalizeCash(state.getCash(), initialCash);
        double profitScore = normalizeProfit(state.getProfit(), initialRevenue);
        double growthScore = normalizeGrowth(state.getCustomersServed(), initialCustomers);

        double baseScore = weights.getCashWeight()   * cashScore
                         + weights.getProfitWeight() * profitScore
                         + weights.getGrowthWeight() * growthScore;

        double riskPenalty = calculateRiskPenalty(state, weights.getRiskTolerance());

        return Math.max(0, Math.min(100, baseScore - riskPenalty));
    }

    // 50 = same cash as start, 100 = doubled, 0 = broke
    private double normalizeCash(double cash, double initialCash) {
        return Math.min(100, Math.max(0, (cash / initialCash) * 50));
    }

    // 50 = breaking even, 100 = thriving, 0 = losing initialRevenue every month
    private double normalizeProfit(double profit, double initialRevenue) {
        double shifted = profit + initialRevenue;
        return Math.min(100, Math.max(0, (shifted / (initialRevenue * 1.8)) * 100));
    }

    // 50 = same customers as start, 100 = doubled, 0 = no customers
    private double normalizeGrowth(double customers, double initialCustomers) {
        return Math.min(100, Math.max(0, (customers / initialCustomers) * 66.6));
    }

    // Penalizes when runway drops below 2 months
    private double calculateRiskPenalty(CoffeeShopState state, double riskTolerance) {
        double riskAversion = (100 - riskTolerance) / 100.0;
        double runwayPenalty = state.getRunway() < 2.0
            ? (2.0 - state.getRunway()) * 30
            : 0;
        return riskAversion * runwayPenalty;
    }
}