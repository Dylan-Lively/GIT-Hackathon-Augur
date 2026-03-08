package com.dylanlively.Augur.engine;

import com.dylanlively.Augur.model.*;
import java.util.List;
import java.util.Map;

public class MoveApplier {

    private StateEngine stateEngine;

    public MoveApplier(StateEngine stateEngine) {
        this.stateEngine = stateEngine;
    }

    // apply a combo of moves to a coffee shop state
    public CoffeeShopState applyCombo(CoffeeShopState state, List<Move> combo) {
        CoffeeShopState s = stateEngine.copy(state);

        // apply every move in the combo
        for (Move move : combo) {
            s = applyEffects(s, move.getEffects());
        }

        // time advances by the longest move in the combo
        double duration = combo.stream()
            .mapToDouble(Move::getDuration)
            .max()
            .orElse(1.0);

        // run time step for that duration
        s = stateEngine.timeStep(s, duration);

        return s;
    }

    // apply a single move's effects map to the state
    private CoffeeShopState applyEffects(CoffeeShopState s, Map<String, Double> effects) {
        for (Map.Entry<String, Double> effect : effects.entrySet()) {
            switch (effect.getKey()) {
                case "cash"            -> s.setCash(s.getCash() + effect.getValue());
                case "baristas"        -> s.setBaristas(s.getBaristas() + effect.getValue().intValue());
                case "hoursOpen"       -> s.setHoursOpen(s.getHoursOpen() + effect.getValue());
                case "avgOrderValue"   -> s.setAvgOrderValue(s.getAvgOrderValue() + effect.getValue());
                case "marketingSpend"  -> s.setMarketingSpend(s.getMarketingSpend() + effect.getValue());
                case "utilityCapacity" -> s.setUtilityCapacity(s.getUtilityCapacity() + effect.getValue());
            }
        }
        return s;
    }

    // check if the business can afford this combo
    public boolean canAfford(CoffeeShopState state, List<Move> combo) {
        double totalCashEffect = combo.stream()
            .mapToDouble(move -> move.getEffects().getOrDefault("cash", 0.0))
            .sum();
        return state.getCash() + totalCashEffect >= 0;
    }
}