// Circuit Analysis Agent
import type { Circuit, CircuitAnalysis,  Component } from '../types/circuit.types';
import { ElectricalCalculations } from '../utils/electricalCalculations';

export class CircuitAnalysisAgent {
  private analysisHistory: CircuitAnalysis[] = [];

  // Main analysis method
  analyzeCircuit(circuit: Circuit): CircuitAnalysis {
    const analysis = ElectricalCalculations.analyzeCircuit(circuit);
    
    // Add additional analysis
    this.detectSeriesParallelConfigurations(circuit, analysis);
    this.checkPowerBalance(circuit, analysis);
    this.validateCircuitTopology(circuit, analysis);
    
    // Store in history
    this.analysisHistory.push(analysis);
    
    return analysis;
  }

  // Detect series and parallel configurations
  private detectSeriesParallelConfigurations(circuit: Circuit, analysis: CircuitAnalysis): void {
    const resistors = circuit.components.filter(c => c.type === 'resistor');
    
    if (resistors.length >= 2) {
      // Simple series detection (components connected in sequence)
      const seriesGroups = this.findSeriesGroups(circuit, resistors);
      
      seriesGroups.forEach(group => {
        if (group.length > 1) {
          analysis.issues.push({
            id: `series-group-${group[0].id}`,
            type: 'info',
            severity: 'low',
            message: `Series configuration detected: ${group.map(r => r.id).join(', ')}`,
            recommendation: 'Series resistors add their values together'
          });
        }
      });
    }
  }

  // Check power balance in circuit
  private checkPowerBalance(circuit: Circuit, analysis: CircuitAnalysis): void {
    const powerSources = circuit.components.filter(c => c.type === 'battery');
    const powerConsumers = circuit.components.filter(c => 
      c.type === 'resistor' || c.type === 'led'
    );

    let totalPowerGenerated = 0;
    let totalPowerConsumed = 0;

    powerSources.forEach(source => {
      const sourcePower = analysis.power[source.id] || 0;
      totalPowerGenerated += sourcePower;
    });

    powerConsumers.forEach(consumer => {
      const consumerPower = analysis.power[consumer.id] || 0;
      totalPowerConsumed += consumerPower;
    });

    const powerBalance = totalPowerGenerated - totalPowerConsumed;
    const efficiency = totalPowerGenerated > 0 ? (totalPowerConsumed / totalPowerGenerated) * 100 : 0;

    if (Math.abs(powerBalance) > 0.1) { // Allow small tolerance
      analysis.issues.push({
        id: 'power-balance',
        type: 'warning',
        severity: 'medium',
        message: `Power balance issue: Generated ${totalPowerGenerated.toFixed(2)}W, Consumed ${totalPowerConsumed.toFixed(2)}W`,
        recommendation: 'Check circuit connections and component values'
      });
    }

    analysis.efficiency = efficiency;
  }

  // Validate circuit topology
  private validateCircuitTopology(circuit: Circuit, analysis: CircuitAnalysis): void {
    // Check for isolated components
    const connectedComponents = new Set<string>();
    circuit.connections.forEach(conn => {
      connectedComponents.add(conn.from);
      connectedComponents.add(conn.to);
    });

    circuit.components.forEach(component => {
      if (!connectedComponents.has(component.id) && component.type !== 'ground') {
        analysis.issues.push({
          id: `isolated-${component.id}`,
          type: 'warning',
          severity: 'medium',
          componentId: component.id,
          message: `Component ${component.id} is not connected to the circuit`,
          recommendation: 'Connect the component or remove it'
        });
      }
    });

    // Check for short circuits
    this.detectShortCircuits(circuit, analysis);
  }

  // Detect potential short circuits
  private detectShortCircuits(circuit: Circuit, analysis: CircuitAnalysis): void {
    const powerSources = circuit.components.filter(c => c.type === 'battery');
    
    powerSources.forEach(source => {
      const sourceVoltage = source.value;
      const sourceCurrent = analysis.currents[source.id] || 0;
      
      // If current is very high relative to voltage, might be a short circuit
      if (sourceVoltage > 0 && sourceCurrent > sourceVoltage * 10) {
        analysis.issues.push({
          id: `short-circuit-${source.id}`,
          type: 'error',
          severity: 'critical',
          componentId: source.id,
          message: `Potential short circuit detected near ${source.id}`,
          recommendation: 'Check for direct connections between positive and negative terminals'
        });
      }
    });
  }

  // Find series groups of resistors
  private findSeriesGroups(circuit: Circuit, resistors: Component[]): Component[][] {
    const groups: Component[][] = [];
    const visited = new Set<string>();

    resistors.forEach(resistor => {
      if (!visited.has(resistor.id)) {
        const group = this.buildSeriesGroup(circuit, resistor, visited);
        if (group.length > 0) {
          groups.push(group);
        }
      }
    });

    return groups;
  }

  // Build a series group starting from a resistor
  private buildSeriesGroup(circuit: Circuit, startResistor: Component, visited: Set<string>): Component[] {
    const group: Component[] = [];
    const queue = [startResistor];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.id)) continue;

      visited.add(current.id);
      group.push(current);

      // Find connected resistors
      const connections = circuit.connections.filter(conn => 
        conn.from === current.id || conn.to === current.id
      );

      connections.forEach(conn => {
        const connectedId = conn.from === current.id ? conn.to : conn.from;
        const connectedComponent = circuit.components.find(c => c.id === connectedId);
        
        if (connectedComponent && 
            connectedComponent.type === 'resistor' && 
            !visited.has(connectedComponent.id)) {
          queue.push(connectedComponent);
        }
      });
    }

    return group;
  }

  // Get analysis history
  getAnalysisHistory(): CircuitAnalysis[] {
    return [...this.analysisHistory];
  }

  // Clear analysis history
  clearHistory(): void {
    this.analysisHistory = [];
  }

  // Compare two circuit analyses
  compareAnalyses(analysis1: CircuitAnalysis, analysis2: CircuitAnalysis): {
    voltageChanges: { [key: string]: number };
    currentChanges: { [key: string]: number };
    powerChanges: { [key: string]: number };
  } {
    const voltageChanges: { [key: string]: number } = {};
    const currentChanges: { [key: string]: number } = {};
    const powerChanges: { [key: string]: number } = {};

    // Compare voltages
    Object.keys(analysis1.voltages).forEach(key => {
      const v1 = analysis1.voltages[key];
      const v2 = analysis2.voltages[key] || 0;
      voltageChanges[key] = v2 - v1;
    });

    // Compare currents
    Object.keys(analysis1.currents).forEach(key => {
      const i1 = analysis1.currents[key];
      const i2 = analysis2.currents[key] || 0;
      currentChanges[key] = i2 - i1;
    });

    // Compare power
    Object.keys(analysis1.power).forEach(key => {
      const p1 = analysis1.power[key];
      const p2 = analysis2.power[key] || 0;
      powerChanges[key] = p2 - p1;
    });

    return { voltageChanges, currentChanges, powerChanges };
  }
}
