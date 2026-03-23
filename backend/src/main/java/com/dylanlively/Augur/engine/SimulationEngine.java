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

    // Anchors set once per run from the initial state — not sent from frontend
    private double initialCash;
    private double initialRevenue;
    private double initialCustomers;

    public SimulationResult run(SimulationRequest request) {
        pathsEvaluated = 0;
        List<Path> results = new ArrayList<>();
        List<Node> currentNodes = new ArrayList<>();
        List<Move> moves = getCoffeeShopMoves();

        CoffeeShopState initialState = (CoffeeShopState) request.getInitialState();

        // Compute derived so revenue + customersServed are populated
        CoffeeShopState initial = stateEngine.computeDerived(initialState);

        // Store anchors — used by scorer to normalize relative to this business
        initialCash      = Math.max(1, initial.getCash());
        initialRevenue   = Math.max(1, initial.getRevenue());
        initialCustomers = Math.max(1, initial.getCustomersServed());

        ScoringWeights weights = request.getScoringWeights();

        search(initialState, currentNodes, results, moves,
               request.getHorizon(), request.getMaxCombos(),
               request.getBeamWidth(), weights);

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
        return scorer.score(afterCombo, weights, initialCash, initialRevenue, initialCustomers);
    }

    private boolean respectsCaps(List<Move> combo, CoffeeShopState state) {
        for (Move move : combo) {
            switch (move.getId()) {
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
        path.setScore(scorer.score(state, weights, initialCash, initialRevenue, initialCustomers));
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

        moves.add(new Move("raise_prices", "Raise Prices", "💲", 0.5,
            Map.of("avgOrderValue", 0.75)));

        moves.add(new Move("extend_hours", "Extend Hours", "🕐", 0.5,
            Map.of("hoursOpen", 1.0)));

        moves.add(new Move("hire_barista", "Hire Barista", "👤", 1.0,
            Map.of("baristas", 1.0)));

        moves.add(new Move("increase_marketing", "Marketing Campaign", "📣", 1.0,
            Map.of("marketingSpend", 200.0)));

        moves.add(new Move("upgrade_utilities", "Upgrade Utilities", "⚡", 3.0,
            Map.of("cash", -5000.0, "utilityCapacity", 40.0)));

        return moves;
    }
}