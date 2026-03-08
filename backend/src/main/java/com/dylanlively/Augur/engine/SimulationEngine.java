package com.dylanlively.Augur.engine;

import com.dylanlively.Augur.model.*;
import java.util.*;
import java.util.stream.Collectors;

public class SimulationEngine {

    private StateEngine stateEngine;
    private MoveApplier moveApplier;
    private Scorer scorer;

    public SimulationEngine(StateEngine stateEngine, MoveApplier moveApplier, Scorer scorer) {
        this.stateEngine = stateEngine;
        this.moveApplier = moveApplier;
        this.scorer = scorer;
    }

    private int pathsEvaluated = 0;

    public SimulationResult run(SimulationRequest request) {
        pathsEvaluated = 0;
        List<Path> results = new ArrayList<>();
        List<Node> currentNodes = new ArrayList<>();
        List<Move> moves = getCoffeeShopMoves();

        CoffeeShopState initialState = (CoffeeShopState) request.getInitialState();

        search(initialState, currentNodes, results, moves,
               request.getHorizon(), request.getMaxCombos(),
               request.getBeamWidth(), request.getScoringWeights());

        results.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));

        SimulationResult result = new SimulationResult();
        result.setPathsEvaluated(pathsEvaluated);
        result.setTopPaths(new ArrayList<>(results.subList(0, Math.min(3, results.size()))));
        return result;
    }

    private void search(
        CoffeeShopState state,
        List<Node> currentNodes,
        List<Path> results,
        List<Move> availableMoves,
        double horizon,
        int maxCombos,
        int beamWidth,
        ScoringWeights weights
    ) {
        CoffeeShopState current = stateEngine.computeDerived(state);

        if (current.getRunway() <= 0) return;

        if (current.getMonthsElapsed() >= horizon) {
            savePath(current, currentNodes, results, weights);
            return;
        }

        double remaining = horizon - current.getMonthsElapsed();

        List<List<Move>> combinations = getCombinations(availableMoves, maxCombos)
            .stream()
            .filter(combo -> moveApplier.canAfford(current, combo))
            .filter(combo -> getLongestDuration(combo) <= remaining)
            .filter(combo -> respectsCaps(combo, current))
            .collect(Collectors.toList());

        if (combinations.isEmpty()) {
            CoffeeShopState finalState = stateEngine.timeStep(current, remaining);
            savePath(finalState, currentNodes, results, weights);
            return;
        }

        // Project each combo to end of horizon before scoring for beam pruning.
        // This is critical — without it raise_prices always wins beam because
        // it looks great short-term but destroys the addressable market.
        if (combinations.size() > beamWidth) {
            combinations = combinations.stream()
                .sorted((a, b) -> Double.compare(
                    projectScore(current, b, remaining, weights),
                    projectScore(current, a, remaining, weights)
                ))
                .limit(beamWidth)
                .collect(Collectors.toList());
        }

        for (List<Move> combo : combinations) {
            CoffeeShopState nextState = moveApplier.applyCombo(current, combo);
            Node node = new Node(combo, nextState);
            currentNodes.add(node);
            search(nextState, currentNodes, results, availableMoves,
                   horizon, maxCombos, beamWidth, weights);
            currentNodes.remove(currentNodes.size() - 1);
        }
    }

    private double projectScore(
        CoffeeShopState current,
        List<Move> combo,
        double remaining,
        ScoringWeights weights
    ) {
        CoffeeShopState afterCombo = moveApplier.applyCombo(current, combo);
        double timeAfterCombo = remaining - getLongestDuration(combo);
        if (timeAfterCombo > 0) {
            afterCombo = stateEngine.timeStep(afterCombo, timeAfterCombo);
        }
        return scorer.score(afterCombo, weights);
    }

    private boolean respectsCaps(List<Move> combo, CoffeeShopState state) {
        for (Move move : combo) {
            switch (move.getId()) {
                // Max 2 raises. With 0.82 elasticity, raise 1 loses 18%, raise 2 loses 33%.
                // When utility-capped this doesn't hurt immediately but kills future growth.
                case "raise_prices":
                    if (state.getPriceRaiseCount() >= 2) return false;
                    break;
                case "increase_marketing":
                    if (state.getMarketingCampaignCount() >= 4) return false;
                    break;
                case "hire_barista":
                    if (state.getBaristas() >= 5) return false;
                    break;
                case "extend_hours":
                    if (state.getHoursOpen() >= 12) return false;
                    break;
                // Max 4 upgrades: 60 + 4*60 = 300/day = 9000/mo
                // This allows utility to scale beyond foot traffic,
                // making marketing the binding constraint in later stages.
                case "upgrade_utilities":
                    if (state.getUtilityCapacity() >= 300) return false;
                    break;
            }
        }
        return true;
    }

    private double getLongestDuration(List<Move> combo) {
        return combo.stream().mapToDouble(Move::getDuration).max().orElse(0);
    }

    private void savePath(
        CoffeeShopState state,
        List<Node> currentNodes,
        List<Path> results,
        ScoringWeights weights
    ) {
        pathsEvaluated++;
        Path path = new Path();
        path.setId("path_" + pathsEvaluated);
        path.setNodes(new ArrayList<>(currentNodes));
        path.setScore(scorer.score(state, weights));
        results.add(path);
    }

    private List<List<Move>> getCombinations(List<Move> moves, int maxSize) {
        List<List<Move>> result = new ArrayList<>();
        for (int size = 1; size <= maxSize; size++) {
            getCombinationsOfSize(moves, size, 0, new ArrayList<>(), result);
        }
        return result;
    }

    private void getCombinationsOfSize(
        List<Move> moves, int size, int start,
        List<Move> current, List<List<Move>> result
    ) {
        if (current.size() == size) {
            result.add(new ArrayList<>(current));
            return;
        }
        for (int i = start; i < moves.size(); i++) {
            current.add(moves.get(i));
            getCombinationsOfSize(moves, size, i + 1, current, result);
            current.remove(current.size() - 1);
        }
    }

    private List<Move> getCoffeeShopMoves() {
        List<Move> moves = new ArrayList<>();

        // RAISE PRICES (0.5mo, -$200)
        // +$0.75 AOV but -18% foot traffic per raise (compounding).
        // Good when: utility-capped and cash-starved (AOV gain, no customer loss yet)
        // Bad when: capacity freed up — you've destroyed the market you just unlocked
        moves.add(new Move("raise_prices", "Raise Prices", "💲", 0.5,
            Map.of("cash", -200.0, "avgOrderValue", 0.75)));

        // EXTEND HOURS (0.5mo, -$300)
        // +1hr/day. Past 10hrs: 1.5x wages but only 0.3x capacity gain.
        // Good when: service capacity is near foot traffic ceiling
        // Bad when: utility is still the bottleneck (capacity irrelevant)
        moves.add(new Move("extend_hours", "Extend Hours", "🕐", 0.5,
            Map.of("cash", -300.0, "hoursOpen", 1.0)));

        // HIRE BARISTA (1mo, -$2500)
        // +1 barista. Raises service capacity AND permanent wages.
        // Good when: service capacity < foot traffic AND utility is expanded
        // Bad when: utility still bottlenecked (service capacity irrelevant)
        moves.add(new Move("hire_barista", "Hire Barista", "👤", 1.0,
            Map.of("cash", -2500.0, "baristas", 1.0)));

        // MARKETING CAMPAIGN (1mo, -$2000)
        // +20 base foot traffic/day. Log-scale diminishing returns.
        // Good when: capacity exists to serve more customers
        // Bad when: utility-capped (extra foot traffic just waits outside)
        moves.add(new Move("increase_marketing", "Marketing Campaign", "📣", 1.0,
            Map.of("cash", -2000.0, "baseFootTraffic", 20.0, "marketingSpend", 150.0)));

        // UPGRADE UTILITIES (3mo, -$8000)
        // +60 utility capacity/day = +1800 customers/mo capacity.
        // Almost always the highest-ROI move when utility is bottleneck.
        // Repeatable up to 4 times (cap: 300/day = 9000/mo).
        // Bad when: foot traffic is already below current utility cap.
        moves.add(new Move("upgrade_utilities", "Upgrade Utilities", "⚡", 3.0,
            Map.of("cash", -8000.0, "utilityCapacity", 60.0)));

        return moves;
    }
}