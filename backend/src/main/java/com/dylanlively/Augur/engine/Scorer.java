package com.dylanlively.Augur.engine;

import com.dylanlively.Augur.model.*;

public class Scorer {

    public double score(GameState state, ScoringWeights weights) {
        double score = 0;

        // cash component
        score += weights.getCashWeight() * normalizeCash(state.getCash());

        // profit component
        score += weights.getProfitWeight() * normalizeProfit(state.getProfit());

        // growth component
        score += weights.getGrowthWeight() * normalizeGrowth(state);

        // risk penalty — lower runway = higher penalty
        double riskPenalty = calculateRiskPenalty(state, weights.getRiskTolerance());
        score -= riskPenalty;

        return Math.max(0, Math.min(100, score));
    }

    // normalize cash to 0-100 range
    private double normalizeCash(double cash) {
        // assumes max meaningful cash is $500k
        return Math.min(100, (cash / 500000) * 100);
    }

    // normalize profit to 0-100 range
    private double normalizeProfit(double profit) {
        // assumes max meaningful monthly profit is $20k
        return Math.min(100, Math.max(0, (profit / 20000) * 100));
    }

    // growth depends on preset
    private double normalizeGrowth(GameState state) {
        if (state instanceof CoffeeShopState s) {
            // growth based on customers served
            return Math.min(100, (s.getCustomersServed() / 300) * 100);
        }
        if (state instanceof RetailChainState s) {
            // growth based on total revenue
            return Math.min(100, (s.getTotalRevenue() / 1000000) * 100);
        }
        return 0;
    }

    // risk penalty scales with how conservative the user is
    private double calculateRiskPenalty(GameState state, double riskTolerance) {
        // riskTolerance 0=conservative, 100=aggressive
        double riskAversion = (100 - riskTolerance) / 100.0;

        // penalty is higher when runway is low
        double runwayPenalty = state.getRunway() < 2
            ? (2 - state.getRunway()) * 20
            : 0;

        // penalty is higher when profit is negative
        double profitPenalty = state.getProfit() < 0
            ? Math.abs(state.getProfit() / 1000)
            : 0;

        return riskAversion * (runwayPenalty + profitPenalty);
    }
}