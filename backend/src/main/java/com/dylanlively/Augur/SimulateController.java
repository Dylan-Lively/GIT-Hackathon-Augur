package com.dylanlively.Augur;

import com.dylanlively.Augur.engine.*;
import com.dylanlively.Augur.model.*;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "*")
public class SimulateController {

    private final SimulationEngine engine;

    public SimulateController() {
        StateEngine stateEngine = new StateEngine();
        MoveApplier moveApplier = new MoveApplier(stateEngine);
        Scorer scorer = new Scorer();
        this.engine = new SimulationEngine(stateEngine, moveApplier, scorer);
    }

    @PostMapping("/simulate")
    public SimulationResult simulate(@RequestBody SimulationRequest request) {
        return engine.run(request);
    }
}