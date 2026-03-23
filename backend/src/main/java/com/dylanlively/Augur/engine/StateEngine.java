package com.dylanlively.Augur.engine;

import com.dylanlively.Augur.model.*;

public class StateEngine {

    public CoffeeShopState computeDerived(CoffeeShopState state) {
        CoffeeShopState s = copy(state);

        // Service capacity (monthly)
        s.setServiceCapacity(s.getBaristas() * 4 * s.getHoursOpen() * 30);

        // Marketing: weak boost, baseline 1.0 at zero spend
        double marketingMultiplier = 1 + 0.1 * Math.log1p(s.getMarketingSpend() / 500.0);

        // Price elasticity: -25% foot traffic per $1 above $6
        double priceElasticity = Math.pow(0.80, Math.max(0, s.getAvgOrderValue() - 6.0));

        s.setFootTraffic(s.getBaseFootTraffic() * 30 * marketingMultiplier * priceElasticity);

        double monthlyUtilityCapacity = s.getUtilityCapacity() * 30;
        double capacityLimit = Math.min(s.getServiceCapacity(), monthlyUtilityCapacity);
        s.setCustomersServed(Math.min(s.getFootTraffic(), capacityLimit));

        s.setRevenue(s.getCustomersServed() * s.getAvgOrderValue());

        double cogs  = s.getCustomersServed() * 1.4;
        double wages = s.getBaristas() * s.getBaristaWage()
                    * s.getHoursOpen() * 26;
        double fixed = s.getRent() + s.getMarketingSpend();

        s.setOperatingCosts(cogs + wages + fixed);
        s.setProfit(s.getRevenue() - s.getOperatingCosts());
        s.setRunway(s.getProfit() >= 0 ? 999 : s.getCash() / Math.abs(s.getProfit()));

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