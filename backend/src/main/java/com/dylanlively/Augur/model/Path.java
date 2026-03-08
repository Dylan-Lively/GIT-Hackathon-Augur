package com.dylanlively.Augur.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.ArrayList;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Path<T extends GameState> {
    private String id;
    private List<Node<T>> nodes;
    private double score;

    public Path(Path<T> other) {
        this.id = other.id;
        this.nodes = new ArrayList<>(other.nodes);
        this.score = other.score;
    }

    public T getFinalState() {
        return nodes.get(nodes.size() - 1).getState();
    }

    public List<Double> getCashProgression() {
        List<Double> progression = new ArrayList<>();
        for (Node<T> node : nodes) {
            progression.add(node.getState().getCash());
        }
        return progression;
    }
}