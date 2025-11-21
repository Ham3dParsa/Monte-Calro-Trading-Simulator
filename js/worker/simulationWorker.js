import { runSingleSimulation } from '../core/simulation-engine.js';

let simulationState = {
    isRunning: false,
    isPaused: false,
    params: {},
    allSimulations: [],
    currentRankingStats: [],
    currentSimIndex: 0
};

function runSimulationLoop() {
    if (simulationState.isPaused || !simulationState.isRunning) return;
    const batchSize = 50;
    const endIndex = Math.min(simulationState.currentSimIndex + batchSize, simulationState.params.numSimulations);
    for (let i = simulationState.currentSimIndex; i < endIndex; i++) {
        const result = runSingleSimulation(simulationState.params, simulationState.currentSimIndex);
        simulationState.allSimulations.push(result);
        simulationState.currentSimIndex++;
    }
    self.postMessage({ type: 'progress', completed: simulationState.currentSimIndex, total: simulationState.params.numSimulations });
    if (simulationState.currentSimIndex < simulationState.params.numSimulations) {
        setTimeout(runSimulationLoop, 0);
    } else {
        simulationState.isRunning = false;
        self.postMessage({ type: 'complete', results: simulationState.allSimulations });
    }
}

self.onmessage = function(e) {
    const { command, params } = e.data;
    switch (command) {
        case 'start':
            simulationState = { isRunning: true, isPaused: false, params, allSimulations: [], currentSimIndex: 0, currentRankingStats: [] };
            runSimulationLoop();
            break;
        case 'pause':
            simulationState.isPaused = true;
            break;
        case 'resume':
            if (simulationState.isPaused) {
                simulationState.isPaused = false;
                runSimulationLoop();
            }
            break;
    }
};
