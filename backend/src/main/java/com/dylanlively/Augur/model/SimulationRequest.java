package com.dylanlively.Augur.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SimulationRequest {
    private String preset;
    private double horizon;
    private int maxCombos;
    private int beamWidth;
    private ScoringWeights scoringWeights;

    @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
    @JsonSubTypes({
        @JsonSubTypes.Type(value = CoffeeShopState.class, name = "coffee_shop"),
        @JsonSubTypes.Type(value = RetailChainState.class, name = "retail_chain")
    })
    private GameState initialState;
}