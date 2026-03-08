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
        List<Path<CoffeeShopState>> results = new ArrayList<>();
        List<Node<CoffeeShopState>> currentNodes = new ArrayList<>();
        List<Move> moves = getMovesForPreset(request.getPreset());

        CoffeeShopState initialState = (CoffeeShopState) request.getInitialState();

        search(
            initialState,
            currentNodes,
            results,
            moves,
            request.getHorizon(),
            request.getMaxCombos(),
            request.getBeamWidth(),
            request.getScoringWeights()
        );

        // sort by score descending
        results.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));

        // return top 3
        SimulationResult result = new SimulationResult();
        result.setPathsEvaluated(pathsEvaluated);
        result.setTopPaths(new ArrayList<>(results.subList(0, Math.min(3, results.size()))));
        return result;
    }

    private void search(
        CoffeeShopState state,
        List<Node<CoffeeShopState>> currentNodes,
        List<Path<CoffeeShopState>> results,
        List<Move> availableMoves,
        double horizon,
        int maxCombos,
        int beamWidth,
        ScoringWeights weights
    ) {
        // pruning 1 — bankrupt
        if (state.getRunway() <= 0) return;

        // pruning 2 — hit horizon, score and save
        if (state.getMonthsElapsed() >= horizon) {
            savePath(state, currentNodes, results, weights);
            return;
        }

        // get all affordable combos
        List<List<Move>> combinations = getCombinations(availableMoves, maxCombos)
            .stream()
            .filter(combo -> moveApplier.canAfford(state, combo))
            .collect(Collectors.toList());

        // pruning 3 — no valid moves, coast to horizon
        if (combinations.isEmpty()) {
            double remaining = horizon - state.getMonthsElapsed();
            CoffeeShopState finalState = stateEngine.timeStep(state, remaining);
            savePath(finalState, currentNodes, results, weights);
            return;
        }

        // pruning 4 — beam search, keep only top N combos by projected score
        if (combinations.size() > beamWidth) {
            combinations = combinations.stream()
                .sorted((a, b) -> Double.compare(
                    scorer.score(moveApplier.applyCombo(state, b), weights),
                    scorer.score(moveApplier.applyCombo(state, a), weights)
                ))
                .limit(beamWidth)
                .collect(Collectors.toList());
        }

        // explore each combo
        for (List<Move> combo : combinations) {
            CoffeeShopState nextState = moveApplier.applyCombo(state, combo);

            // add node to current path
            Node<CoffeeShopState> node = new Node<>(combo, nextState);
            currentNodes.add(node);

            // recurse
            search(nextState, currentNodes, results, availableMoves, 
                   horizon, maxCombos, beamWidth, weights);

            // backtrack
            currentNodes.remove(currentNodes.size() - 1);
        }
    }

    private void savePath(
        CoffeeShopState state,
        List<Node<CoffeeShopState>> currentNodes,
        List<Path<CoffeeShopState>> results,
        ScoringWeights weights
    ) {
        pathsEvaluated++;
        Path<CoffeeShopState> path = new Path<>();
        path.setId("path_" + pathsEvaluated);
        path.setNodes(new ArrayList<>(currentNodes));
        path.setScore(scorer.score(state, weights));
        results.add(path);
    }

    // generate all combinations of moves up to maxCombo size
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

    // placeholder — will move to preset system
    private List<Move> getMovesForPreset(String preset) {
        List<Move> moves = new ArrayList<>();

        if (preset.equals("coffee_shop")) {
            moves.add(new Move("hire_barista", "Hire Barista", "👤", 1.0,
                Map.of("cash", -2000.0, "baristas", 1.0)));
            moves.add(new Move("upgrade_utilities", "Upgrade Utilities", "⚡", 1.0,
                Map.of("cash", -5000.0, "utilityCapacity", 50.0)));
            moves.add(new Move("increase_marketing", "Increase Marketing", "📣", 1.0,
                Map.of("cash", -1000.0, "marketingSpend", 500.0)));
            moves.add(new Move("raise_prices", "Raise Prices", "💲", 1.0,
                Map.of("avgOrderValue", 1.0)));
            moves.add(new Move("extend_hours", "Extend Hours", "🕐", 1.0,
                Map.of("hoursOpen", 2.0)));
        }

        return moves;
    }
}