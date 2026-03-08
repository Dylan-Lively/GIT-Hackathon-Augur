package com.dylanlively.Augur.engine;

import com.dylanlively.Augur.model.*;

public class StateEngine {

    // compute all derived variables from base variables
    public CoffeeShopState computeDerived(CoffeeShopState state) {
        CoffeeShopState s = copy(state);

        // service capacity — how many drinks can we make per month
        s.setServiceCapacity(
            s.getBaristas() * 20 * s.getHoursOpen() * 30
        );

        // foot traffic — base + marketing effect with diminishing returns
        s.setFootTraffic(
            s.getBaseFootTraffic() * (1 + Math.log1p(s.getMarketingSpend() / 500))
        );

        // customers served — bottlenecked by capacity and utility
        double capacityLimit = Math.min(s.getServiceCapacity(), s.getUtilityCapacity());
        s.setCustomersServed(
            Math.min(s.getFootTraffic(), capacityLimit)
        );

        // revenue — monthly
        s.setRevenue(s.getCustomersServed() * s.getAvgOrderValue() * 30);

        // operating costs — monthly
        s.setOperatingCosts(
            (s.getBaristas() * s.getBaristaWage() * s.getHoursOpen() * 30)
            + s.getRent()
            + s.getMarketingSpend()
            + (s.getCustomersServed() * 1.5 * 30)  // cost of goods ~$1.5/drink
        );

        // profit — monthly
        s.setProfit(s.getRevenue() - s.getOperatingCosts());

        // runway — months until broke
        s.setRunway(s.getOperatingCosts() > 0
            ? s.getCash() / s.getOperatingCosts()
            : 999
        );

        return s;
    }

    // advance time — business operates for given months
    public CoffeeShopState timeStep(CoffeeShopState state, double months) {
        CoffeeShopState s = computeDerived(copy(state));
        s.setCash(s.getCash() + s.getProfit() * months);
        s.setMonthsElapsed(s.getMonthsElapsed() + months);
        return s;
    }

    // deep copy — never mutate state directly
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
        return s;
    }
}