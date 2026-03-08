package com.dylanlively.Augur.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Node {
    private List<Move> moves;
    private CoffeeShopState state;
}