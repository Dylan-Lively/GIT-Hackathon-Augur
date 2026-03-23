package com.dylanlively.Augur.engine;

import com.dylanlively.Augur.model.*;
import java.util.List;
import java.util.Map;

public class MoveApplier {

    private StateEngine stateEngine;

    public MoveApplier(StateEngine stateEngine) {
        this.stateEngine = stateEngine;
    }

    public CoffeeShopState applyCombo(CoffeeShopState state, List<Move> combo) {
        CoffeeShopState s = stateEngine.copy(state);

        for (Move move : combo) {
            s = applyEffects(s, move);
        }

        double duration = combo.stream()
            .mapToDouble(Move::getDuration)
            .max()
            .orElse(1.0);

        return stateEngine.timeStep(s, duration);
    }

    private CoffeeShopState applyEffects(CoffeeShopState s, Move move) {
        Map<String, Double> effects = move.getEffects();

        for (Map.Entry<String, Double> effect : effects.entrySet()) {
            switch (effect.getKey()) {
                case "cash"             -> s.setCash(s.getCash() + effect.getValue());
                case "baristas"         -> s.setBaristas(s.getBaristas() + effect.getValue().intValue());
                case "hoursOpen"        -> s.setHoursOpen(s.getHoursOpen() + effect.getValue());
                case "avgOrderValue"    -> s.setAvgOrderValue(s.getAvgOrderValue() + effect.getValue());
                case "marketingSpend"   -> s.setMarketingSpend(s.getMarketingSpend() + effect.getValue());
                case "utilityCapacity"  -> s.setUtilityCapacity(s.getUtilityCapacity() + effect.getValue());
                case "baseFootTraffic"  -> s.setBaseFootTraffic(s.getBaseFootTraffic() + effect.getValue());
            }
        }

        // Increment move trackers based on move id
        switch (move.getId()) {
            case "raise_prices"       -> s.setPriceRaiseCount(s.getPriceRaiseCount() + 1);
            case "increase_marketing" -> s.setMarketingCampaignCount(s.getMarketingCampaignCount() + 1);
        }

        return s;
    }

    public boolean canAfford(CoffeeShopState state, List<Move> combo) {
        double totalCashEffect = combo.stream()
            .mapToDouble(move -> move.getEffects().getOrDefault("cash", 0.0))
            .sum();
        return state.getCash() + totalCashEffect >= 0;
    }
}