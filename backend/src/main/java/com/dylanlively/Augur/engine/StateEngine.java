package com.dylanlively.Augur.engine;

import com.dylanlively.Augur.model.*;

public class StateEngine {

    public CoffeeShopState computeDerived(CoffeeShopState state) {
        CoffeeShopState s = copy(state);

        // ── Service capacity (monthly) ────────────────────────────────────────
        double effectiveHours = Math.min(s.getHoursOpen(), 10)
            + Math.max(0, s.getHoursOpen() - 10) * 0.3;
        s.setServiceCapacity(s.getBaristas() * 12 * effectiveHours * 30);

        // ── Base foot traffic (monthly) ───────────────────────────────────────
        double marketingMultiplier = 1 + 0.45 * Math.log1p(s.getMarketingSpend() / 250.0);

        // Price elasticity: -18% customers per raise, compounding.
        // IMPORTANT: This applies to POTENTIAL foot traffic, not capped customers.
        // So even when utility-bottlenecked, raising prices destroys the future
        // addressable market — once you upgrade utilities, you'll have fewer people
        // to serve. The engine must look ahead to see this cost.
        double priceElasticity = Math.pow(0.82, s.getPriceRaiseCount());
        s.setFootTraffic(s.getBaseFootTraffic() * 30 * marketingMultiplier * priceElasticity);

        // ── Utility capacity (monthly) ────────────────────────────────────────
        double monthlyUtilityCapacity = s.getUtilityCapacity() * 30;

        // ── Customers served ──────────────────────────────────────────────────
        double capacityLimit = Math.min(s.getServiceCapacity(), monthlyUtilityCapacity);
        s.setCustomersServed(Math.min(s.getFootTraffic(), capacityLimit));

        // ── Revenue ───────────────────────────────────────────────────────────
        s.setRevenue(s.getCustomersServed() * s.getAvgOrderValue());

        // ── COGS: variable per customer served ────────────────────────────────
        double cogs = s.getCustomersServed() * 1.80;

        // ── Wages: overtime at 1.5x past 10hrs ───────────────────────────────
        double regularHours  = Math.min(s.getHoursOpen(), 10);
        double overtimeHours = Math.max(0, s.getHoursOpen() - 10);
        double wages = s.getBaristas() * s.getBaristaWage() * 30
            * (regularHours + overtimeHours * 1.5);

        // ── Fixed overhead ────────────────────────────────────────────────────
        double utilityMaintenance = Math.max(0, (s.getUtilityCapacity() - 60) / 60.0) * 180;
        double campaignOngoing    = s.getMarketingCampaignCount() * 280.0;

        s.setOperatingCosts(wages + s.getRent() + s.getMarketingSpend()
            + cogs + utilityMaintenance + campaignOngoing);

        // ── Profit & runway ───────────────────────────────────────────────────
        s.setProfit(s.getRevenue() - s.getOperatingCosts());
        s.setRunway(s.getOperatingCosts() > 0
            ? s.getCash() / s.getOperatingCosts()
            : 999);

        return s;
    }

    public CoffeeShopState timeStep(CoffeeShopState state, double months) {
        CoffeeShopState s = computeDerived(copy(state));
        s.setCash(s.getCash() + s.getProfit() * months);
        s.setMonthsElapsed(s.getMonthsElapsed() + months);
        return s;
    }

    public CoffeeShopState copy(CoffeeShopState state) {
        CoffeeShopState s = new CoffeeShopState();
        s.setCash(state.getCash());
        s.setMonthsElapsed(state.getMonthsElapsed());
        s.setBaristas(state.getBaristas());
        s.setHoursOpen(state.getHoursOpen());
        s.setAvgOrderValue(state.getAvgOrderValue());
        s.setMarketingSpend(state.getMarketingSpend());
        s.setRent(state.getRent());
        s.setBaristaWage(state.getBaristaWage());
        s.setBaseFootTraffic(state.getBaseFootTraffic());
        s.setUtilityCapacity(state.getUtilityCapacity());
        s.setPriceRaiseCount(state.getPriceRaiseCount());
        s.setMarketingCampaignCount(state.getMarketingCampaignCount());
        return s;
    }
}