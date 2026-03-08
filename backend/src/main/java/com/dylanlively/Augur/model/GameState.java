package com.dylanlively.Augur.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GameState {
    // base variables
    private double cash;
    private double monthsElapsed;

    // derived variables
    private double profit;
    private double runway;
}