package com.dylanlively.Augur.engine;

import com.dylanlively.Augur.model.*;

public class Scorer {

    public double score(CoffeeShopState state, ScoringWeights weights) {

        double cashScore   = normalizeCash(state.getCash());
        double profitScore = normalizeProfit(state.getProfit());
        double growthScore = normalizeGrowth(state.getCustomersServed());

        double baseScore = weights.getCashWeight()   * cashScore
                         + weights.getProfitWeight() * profitScore
                         + weights.getGrowthWeight() * growthScore;

        double riskPenalty = calculateRiskPenalty(state, weights.getRiskTolerance());

        // ── State-aware adjustments ───────────────────────────────────────────
        // These make the "best move" depend on the actual company situation.

        double adjustment = 0;

        double footTraffic      = state.getFootTraffic();
        double monthlyUtility   = state.getUtilityCapacity() * 30;
        double serviceCapacity  = state.getServiceCapacity();
        double hardCapacity     = Math.min(serviceCapacity, monthlyUtility);

        // Capacity waste: what fraction of potential customers can't be served?
        double wastedTraffic  = Math.max(0, footTraffic - hardCapacity);
        double wasteFraction  = footTraffic > 0 ? wastedTraffic / footTraffic : 0;

        // Penalise high capacity waste — should have expanded capacity
        if (wasteFraction > 0.6) adjustment -= 12;
        else if (wasteFraction > 0.4) adjustment -= 6;
        else if (wasteFraction < 0.1) adjustment += 8; // well-matched, good planning

        // Penalise price raises proportional to future market destroyed.
        // Even when currently capped, raised prices hurt you the moment you upgrade.
        // The beam projects forward so this will propagate correctly.
        if (state.getPriceRaiseCount() > 0) {
            double marketRetained = Math.pow(0.82, state.getPriceRaiseCount());
            double marketDestroyed = 1.0 - marketRetained; // fraction of foot traffic lost
            // If we could serve that traffic (capacity-wise), it's real lost revenue
            double lostRevenuePotential = state.getBaseFootTraffic() * 30
                * marketDestroyed * state.getAvgOrderValue();
            // But we gained AOV on served customers
            double aovGain = state.getCustomersServed()
                * state.getPriceRaiseCount() * 0.75;
            double netCost = lostRevenuePotential - aovGain;
            if (netCost > 0) {
                adjustment -= Math.min(18, netCost / 400.0);
            }
        }

        // Reward for having grown customer base substantially
        if (state.getCustomersServed() > 3600) adjustment += 6;
        if (state.getCustomersServed() > 5400) adjustment += 8;

        // Penalise hiring/upgrading when severely underutilized — wasted investment
        if (wasteFraction < 0.1 && footTraffic < hardCapacity * 0.5) {
            if (state.getBaristas() > 2) adjustment -= 5;
        }

        double finalScore = baseScore + adjustment - riskPenalty;
        return Math.max(0, Math.min(100, finalScore));
    }

    // Range: $50k start. Coast (no moves): ~$31k after 6mo (losing money).
    // Good outcome: $70-90k. Exceptional: $120k+ (upgrade + market + grow).
    private double normalizeCash(double cash) {
        return Math.min(100, Math.max(0, (cash / 120000.0) * 100));
    }

    // Default: ~-$3,140/mo (underwater — creates real urgency).
    // After 1 upgrade: +$4,240/mo. After 2 upgrades + marketing: ~$12,000/mo.
    private double normalizeProfit(double profit) {
        return Math.min(100, Math.max(0, ((profit + 3500) / 15500.0) * 100));
    }

    // Default: 1800/mo. After 2 upgrades: 5400/mo. After 4 + marketing: ~12000/mo.
    private double normalizeGrowth(double customersServed) {
        return Math.min(100, Math.max(0, (customersServed / 10000.0) * 100));
    }

    private double calculateRiskPenalty(CoffeeShopState state, double riskTolerance) {
        double riskAversion = (100 - riskTolerance) / 100.0;

        double runwayPenalty = 0;
        if (state.getRunway() < 1.5) {
            runwayPenalty = (1.5 - state.getRunway()) * 45;
        } else if (state.getRunway() < 3.0) {
            runwayPenalty = (3.0 - state.getRunway()) * 10;
        }

        double profitPenalty = state.getProfit() < 0
            ? Math.abs(state.getProfit()) / 300.0
            : 0;

        return riskAversion * (runwayPenalty + profitPenalty);
    }
}