// Enhanced Electrical Calculations with Proper Formulas and Realistic Analysis
import type { Component, Circuit, CircuitAnalysis, CircuitIssue } from '../types/circuit.types';

export interface ElectricalResult {
  voltage: number;
  current: number;
  power: number;
  resistance: number;
  efficiency: number;
  powerFactor?: number;
  frequency?: number;
  phaseAngle?: number;
}

export class ElectricalCalculations {
  // Basic electrical formulas
  static calculatePower(voltage: number, current: number, powerFactor: number = 1): number {
    return voltage * current * powerFactor;
  }

  static calculateCurrent(voltage: number, resistance: number): number {
    return resistance > 0 ? voltage / resistance : 0;
  }

  static calculateResistance(voltage: number, current: number): number {
    return current > 0 ? voltage / current : 0;
  }

  static calculateEfficiency(outputPower: number, inputPower: number): number {
    if (inputPower === 0) return 0;
    return Math.min((outputPower / inputPower) * 100, 100);
  }

  // AC circuit calculations
  static calculateACPower(voltage: number, current: number, powerFactor: number = 0.8): number {
    return voltage * current * powerFactor;
  }

  static calculateImpedance(resistance: number, reactance: number): number {
    return Math.sqrt(resistance * resistance + reactance * reactance);
  }

  static calculatePowerFactor(activePower: number, apparentPower: number): number {
    if (apparentPower === 0) return 0;
    return Math.min(activePower / apparentPower, 1);
  }

  // Three-phase calculations
  static calculateThreePhasePower(lineVoltage: number, lineCurrent: number, powerFactor: number = 0.8): number {
    return Math.sqrt(3) * lineVoltage * lineCurrent * powerFactor;
  }

  static calculatePhaseVoltage(lineVoltage: number): number {
    return lineVoltage / Math.sqrt(3);
  }

  static calculatePhaseCurrent(lineCurrent: number): number {
    return lineCurrent;
  }

  // Load calculations
  static calculateTotalLoad(appliances: Array<{power: number, quantity: number, powerFactor?: number}>): number {
    return appliances.reduce((total, appliance) => {
      const powerFactor = appliance.powerFactor || 0.8;
      return total + (appliance.power * appliance.quantity * powerFactor);
    }, 0);
  }

  // Enhanced wire sizing calculations with proper formulas
  static calculateWireSize(current: number, length: number, voltageDrop: number = 3, voltage: number = 230): number {
    // Voltage drop formula: V_drop = 2 * I * R * L / 1000
    // Where R is resistance per km, L is length in meters
    // For copper wire: R = 0.0175 ohm/mm²/m
    const resistivity = 0.0175; // Copper resistivity in ohm*mm²/m
    const maxVoltageDrop = (voltage * voltageDrop) / 100; // Percentage to volts
    
    // Calculate required cross-sectional area in mm²
    // V_drop = 2 * I * (resistivity / A) * (L / 1000)
    // Solving for A: A = (2 * I * resistivity * L) / (V_drop * 1000)
    const crossSectionalArea = (2 * current * resistivity * length) / (maxVoltageDrop * 1000);
    
    // Round up to standard wire sizes (mm²): 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120
    const standardSizes = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];
    const selectedSize = standardSizes.find(size => size >= crossSectionalArea) || 240;
    
    return Math.max(selectedSize, 1.5); // Minimum 1.5mm²
  }

  // Calculate voltage drop for a given wire size
  static calculateVoltageDrop(current: number, length: number, wireSize: number, voltage: number = 230): number {
    const resistivity = 0.0175; // ohm*mm²/m
    const resistance = (resistivity * length * 2) / (wireSize * 1000); // 2 for round trip
    const voltageDrop = current * resistance;
    return (voltageDrop / voltage) * 100; // Return as percentage
  }

  // Calculate wire gauge (AWG) from cross-sectional area
  static calculateWireGauge(crossSectionalArea: number): number {
    // Convert mm² to AWG (approximate)
    // AWG formula: diameter = 0.127 * 92^((36-AWG)/39)
    // Area = π * (diameter/2)^2
    const diameter = Math.sqrt((crossSectionalArea * 4) / Math.PI);
    const awg = 36 - (39 * Math.log10(diameter / 0.127)) / Math.log10(92);
    return Math.round(awg);
  }

  // Enhanced circuit protection calculations
  static calculateMCBRating(totalLoad: number, voltage: number, powerFactor: number = 0.8, safetyFactor: number = 1.25): number {
    // Account for power factor in current calculation
    const apparentPower = totalLoad / powerFactor;
    const current = (apparentPower / voltage) * safetyFactor;
    const standardRatings = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125];
    return standardRatings.find(rating => rating >= current) || 125;
  }

  static calculateRCCBRating(mcbRating: number): number {
    const standardRatings = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125];
    return standardRatings.find(rating => rating >= mcbRating) || 125;
  }

  // Short-circuit current calculation
  static calculateShortCircuitCurrent(voltage: number, sourceImpedance: number = 0.1): number {
    // Simplified short-circuit current: I_sc = V / Z_source
    // sourceImpedance in ohms (typically very low for utility supply)
    return voltage / sourceImpedance;
  }

  // Power factor correction calculation
  static calculatePowerFactorCorrection(currentPF: number, targetPF: number, activePower: number, voltage: number): number {
    // Calculate required reactive power for correction
    const currentAngle = Math.acos(currentPF);
    const targetAngle = Math.acos(targetPF);
    
    const currentReactive = activePower * Math.tan(currentAngle);
    const targetReactive = activePower * Math.tan(targetAngle);
    const requiredReactive = currentReactive - targetReactive;
    
    // Calculate capacitor size in microfarads
    const frequency = 50; // Hz
    const capacitance = (requiredReactive * 1000000) / (2 * Math.PI * frequency * voltage * voltage);
    
    return Math.max(capacitance, 0);
  }

  // Thermal calculations for component heating
  static calculateComponentTemperature(ambientTemp: number, powerDissipation: number, thermalResistance: number): number {
    // Temperature rise = Power * Thermal Resistance
    // Component temp = Ambient + Temperature rise
    const tempRise = powerDissipation * thermalResistance;
    return ambientTemp + tempRise;
  }

  // Grounding resistance calculation
  static calculateGroundingResistance(soilResistivity: number, electrodeLength: number, electrodeDiameter: number): number {
    // Simplified grounding resistance for rod electrode
    // R = (ρ / (2πL)) * ln(4L/d)
    // Where ρ is soil resistivity, L is length, d is diameter
    const resistance = (soilResistivity / (2 * Math.PI * electrodeLength)) * Math.log((4 * electrodeLength) / electrodeDiameter);
    return resistance;
  }

  // Arc flash hazard calculation (simplified)
  static calculateArcFlashEnergy(voltage: number, shortCircuitCurrent: number, clearingTime: number = 0.1): number {
    // Simplified arc flash energy calculation
    // Energy (cal/cm²) = 1.732 * V * I_sc * t / (4 * π * d²)
    // Where d is working distance (assumed 18 inches = 45.72 cm)
    const workingDistance = 45.72; // cm
    const energy = (1.732 * voltage * shortCircuitCurrent * clearingTime) / (4 * Math.PI * workingDistance * workingDistance);
    return energy;
  }

  // Calculate required PPE category based on arc flash energy
  static calculatePPECategory(arcFlashEnergy: number): { category: number; description: string } {
    if (arcFlashEnergy < 1.2) {
      return { category: 0, description: 'Arc-rated long-sleeve shirt and pants' };
    } else if (arcFlashEnergy < 4) {
      return { category: 1, description: 'Arc-rated clothing, minimum 4 cal/cm²' };
    } else if (arcFlashEnergy < 8) {
      return { category: 2, description: 'Arc-rated clothing, minimum 8 cal/cm²' };
    } else if (arcFlashEnergy < 25) {
      return { category: 3, description: 'Arc-rated clothing, minimum 25 cal/cm²' };
    } else {
      return { category: 4, description: 'Arc-rated clothing, minimum 40 cal/cm²' };
    }
  }

  // Enhanced circuit analysis with proper electrical engineering principles
  static analyzeCircuit(circuit: Circuit): CircuitAnalysis {
    const voltages: { [key: string]: number } = {};
    const currents: { [key: string]: number } = {};
    const power: { [key: string]: number } = {};
    const issues: CircuitIssue[] = [];

    // Find power sources
    const powerSources = circuit.components.filter(c => c.type === 'battery' || c.type === 'socket');
    if (powerSources.length === 0) {
      issues.push({
        id: 'no-power-source',
        type: 'error',
        severity: 'critical',
        message: 'No power source found in circuit',
        recommendation: 'Add a battery or power source to the circuit'
      });
      return { voltages, currents, power, totalPower: 0, efficiency: 0, issues };
    }

    const metadataVoltage = circuit.metadata?.voltage && circuit.metadata.voltage > 0 ? circuit.metadata.voltage : 230;
    const validSource = powerSources.find(source => typeof source.value === 'number' && source.value > 0);
    const sourceVoltage = validSource ? validSource.value : metadataVoltage;
    const isThreePhase = circuit.metadata?.phase === 'three';

    // Build connection graph for topology analysis
    const componentMap = new Map(circuit.components.map(c => [c.id, c]));
    const connectionGraph = new Map<string, Array<{ componentId: string; port: number; wireColor?: string }>>();
    
    // Initialize graph
    circuit.components.forEach(comp => {
      connectionGraph.set(comp.id, []);
    });

    // Build bidirectional graph from connections
    circuit.connections.forEach(conn => {
      const fromConnections = connectionGraph.get(conn.from) || [];
      const toConnections = connectionGraph.get(conn.to) || [];
      
      fromConnections.push({ componentId: conn.to, port: conn.toPort, wireColor: conn.wireColor });
      toConnections.push({ componentId: conn.from, port: conn.fromPort, wireColor: conn.wireColor });
      
      connectionGraph.set(conn.from, fromConnections);
      connectionGraph.set(conn.to, toConnections);
    });

    // Identify appliances (loads)
    const applianceTypes = ['fan', 'light', 'tv', 'ac', 'motor', 'heater', 'refrigerator', 'washing-machine', 'microwave', 'ups', 'inverter', 'dishwasher', 'water-heater', 'electric-stove', 'electric-oven', 'heat-pump', 'electric-boiler'];
    const appliances = circuit.components.filter(c => applianceTypes.includes(c.type));

    // Calculate total load from appliances only
    const totalLoad = appliances.reduce((sum, app) => {
      const appPower = app.properties.powerConsumption || 0;
      return sum + appPower;
    }, 0);

    // Initialize all components with default values
    circuit.components.forEach(component => {
      voltages[component.id] = 0;
      currents[component.id] = 0;
      power[component.id] = 0;
    });

    // Step 1: Set power source voltages
    powerSources.forEach(source => {
      const supplyVoltage = source.value && source.value > 0 ? source.value : sourceVoltage;
      voltages[source.id] = supplyVoltage;
    });

    // Step 2: Calculate appliance currents and power (use powerConsumption directly)
    const applianceCurrents: { [key: string]: number } = {};
    appliances.forEach(app => {
      const appPower = app.properties.powerConsumption || 0;
      const appVoltage = app.properties.operatingVoltage || sourceVoltage;
      const appPowerFactor = app.properties.powerFactor || 0.8;
      
      // Calculate current per appliance
      let appCurrent: number;
      if (isThreePhase) {
        appCurrent = appPower > 0 ? appPower / (Math.sqrt(3) * appVoltage * appPowerFactor) : 0;
      } else {
        appCurrent = appPower > 0 ? appPower / (appVoltage * appPowerFactor) : 0;
      }
      
      if (!Number.isFinite(appCurrent) || appCurrent < 0) {
        appCurrent = 0;
      }
      
      applianceCurrents[app.id] = appCurrent;
      voltages[app.id] = appVoltage;
      currents[app.id] = appCurrent;
      power[app.id] = appPower; // Use powerConsumption directly, not calculated
    });

    // Step 3: Trace current flow from sources through protection devices to loads
    // Use BFS to propagate voltage and calculate current flow
    const visited = new Set<string>();
    const queue: Array<{ id: string; voltage: number; current: number }> = [];
    
    // Start from power sources
    powerSources.forEach(source => {
      const supplyVoltage = source.value && source.value > 0 ? source.value : sourceVoltage;
      queue.push({ id: source.id, voltage: supplyVoltage, current: 0 });
      visited.add(source.id);
    });

    // Calculate total current needed (sum of all appliance currents)
    const totalCurrent = Object.values(applianceCurrents).reduce((sum, curr) => sum + curr, 0);

    // Step 4: Process protection devices and junctions
    // Protection devices pass voltage through and carry downstream current
    const protectionDevices = circuit.components.filter(c => 
      ['mcb', 'rccb', 'fuse', 'gfci', 'afci', 'spd', 'surge-protector', 'two-way-switch', 'switch'].includes(c.type)
    );
    
    protectionDevices.forEach(device => {
      voltages[device.id] = sourceVoltage; // Pass-through voltage
      currents[device.id] = totalCurrent; // Carry total load current
      power[device.id] = this.calculatePower(sourceVoltage, totalCurrent);
      
      // Check ratings for protection devices
      if (device.type === 'mcb') {
        const mcbRating = device.properties.tripCurrent || 16;
        if (totalCurrent > mcbRating) {
          issues.push({
            id: `mcb-overcurrent-${device.id}`,
            type: 'error',
            severity: 'critical',
            componentId: device.id,
            message: `MCB will trip: Current (${totalCurrent.toFixed(2)}A) exceeds rating (${mcbRating}A)`,
            recommendation: `Use MCB with rating ${Math.ceil(totalCurrent * 1.25)}A or higher`
          });
        }
      } else if (device.type === 'fuse') {
        const fuseRating = device.properties.fuseRating || 16;
        if (totalCurrent > fuseRating) {
          issues.push({
            id: `fuse-overcurrent-${device.id}`,
            type: 'error',
            severity: 'critical',
            componentId: device.id,
            message: `Fuse will blow: Current (${totalCurrent.toFixed(2)}A) exceeds rating (${fuseRating}A)`,
            recommendation: `Use fuse with rating ${Math.ceil(totalCurrent * 1.25)}A or higher`
          });
        }
      } else if (device.type === 'two-way-switch' || device.type === 'switch') {
        // Switches have minimal power loss
        power[device.id] = this.calculatePower(sourceVoltage, totalCurrent * 0.01);
      } else if (device.type === 'gfci' || device.type === 'afci' || device.type === 'surge-protector') {
        // These devices have minimal current draw
        currents[device.id] = Math.min(totalCurrent, 2);
        power[device.id] = this.calculatePower(sourceVoltage, currents[device.id]);
      }
    });

    // Step 5: Process junctions (sum currents from branches)
    const junctions = circuit.components.filter(c => c.type === 'junction');
    junctions.forEach(junction => {
      // Find all appliances connected to this junction
      const connectedAppliances = appliances.filter(app => {
        return circuit.connections.some(conn => 
          (conn.from === junction.id && conn.to === app.id) ||
          (conn.to === junction.id && conn.from === app.id)
        );
      });
      
      // Sum currents from connected appliances
      const junctionCurrent = connectedAppliances.reduce((sum, app) => {
        return sum + (applianceCurrents[app.id] || 0);
      }, 0);
      
      voltages[junction.id] = sourceVoltage; // Junction maintains supply voltage
      currents[junction.id] = junctionCurrent;
      power[junction.id] = this.calculatePower(sourceVoltage, junctionCurrent);
    });

    // Step 6: Process other components
    const processedComponentIds = new Set([
      ...powerSources.map(s => s.id),
      ...appliances.map(a => a.id),
      ...protectionDevices.map(p => p.id),
      ...junctions.map(j => j.id)
    ]);
    
    circuit.components.forEach(component => {
      // Skip if already processed
      if (processedComponentIds.has(component.id)) {
        return;
      }

      switch (component.type) {
        case 'ground':
        case 'lightning-rod':
          voltages[component.id] = 0;
          currents[component.id] = 0;
          power[component.id] = 0;
          break;

        case 'voltmeter':
          voltages[component.id] = sourceVoltage;
          currents[component.id] = 0.001; // Very low current
          power[component.id] = this.calculatePower(voltages[component.id], currents[component.id]);
          break;

        case 'ammeter':
          voltages[component.id] = 0.1; // Very low voltage drop
          currents[component.id] = totalCurrent;
          power[component.id] = this.calculatePower(voltages[component.id], currents[component.id]);
          break;

        case 'wattmeter':
          voltages[component.id] = sourceVoltage;
          currents[component.id] = totalCurrent;
          power[component.id] = this.calculatePower(sourceVoltage, totalCurrent);
          break;

        case 'transformer':
          const turnsRatio = component.properties.turnsRatio || 1;
          const primaryVoltage = component.properties.primaryVoltage || sourceVoltage;
          const secondaryVoltage = primaryVoltage / turnsRatio;
          voltages[component.id] = secondaryVoltage;
          currents[component.id] = totalCurrent * turnsRatio;
          power[component.id] = this.calculatePower(secondaryVoltage, currents[component.id]);
          break;

        case 'resistor':
          // Only process resistors that are explicitly added (not defaulted from invalid types)
          // For resistors in parallel with loads, they would have minimal effect
          // For now, if resistor has a reasonable value, calculate it properly
          const safeResistance = component.value > 0 && component.value < 1000000 ? component.value : 1000;
          // Don't use totalCurrent for resistor - it's likely in parallel, so voltage is sourceVoltage
          const resistorVoltage = sourceVoltage;
          const resistorCurrent = resistorVoltage / safeResistance;
          const resistorPower = this.calculatePower(resistorVoltage, resistorCurrent);
          
          voltages[component.id] = resistorVoltage;
          currents[component.id] = resistorCurrent;
          power[component.id] = resistorPower;

          if (component.properties.powerRating && resistorPower > component.properties.powerRating) {
            issues.push({
              id: `overpower-${component.id}`,
              type: 'warning',
              severity: 'high',
              componentId: component.id,
              message: `Resistor ${component.id} is exceeding its power rating`,
              recommendation: `Use a resistor with higher power rating (${resistorPower.toFixed(2)}W)`
            });
          }
          break;

        case 'ups':
        case 'inverter':
          // These are already processed as appliances, but handle if not
          if (!appliances.some(a => a.id === component.id)) {
            const upsPower = component.properties.powerConsumption || 1000;
            const upsVoltage = component.properties.operatingVoltage || sourceVoltage;
            const upsPowerFactor = component.properties.powerFactor || 0.8;
            let upsCurrent: number;
            if (isThreePhase) {
              upsCurrent = upsPower > 0 ? upsPower / (Math.sqrt(3) * upsVoltage * upsPowerFactor) : 0;
            } else {
              upsCurrent = upsPower > 0 ? upsPower / (upsVoltage * upsPowerFactor) : 0;
            }
            voltages[component.id] = upsVoltage;
            currents[component.id] = upsCurrent;
            power[component.id] = upsPower;
          }
          break;

        default:
          // For unknown components, use conservative defaults
          voltages[component.id] = sourceVoltage;
          currents[component.id] = 0; // Don't assume current
          power[component.id] = 0;
      }
    });

    // Step 7: Validate all calculated values
    Object.keys(voltages).forEach(compId => {
      const v = voltages[compId];
      const i = currents[compId];
      const p = power[compId];
      
      // Flag impossible values as calculation errors
      if (v > 1000 || v < -100) {
        issues.push({
          id: `invalid-voltage-${compId}`,
          type: 'error',
          severity: 'critical',
          componentId: compId,
          message: `Invalid voltage calculated: ${v.toFixed(2)}V (expected 0-1000V)`,
          recommendation: 'Check circuit connections and component values'
        });
        // Clamp to reasonable value
        voltages[compId] = Math.max(0, Math.min(1000, v));
      }
      
      if (i > 10000 || i < -100) {
        issues.push({
          id: `invalid-current-${compId}`,
          type: 'error',
          severity: 'critical',
          componentId: compId,
          message: `Invalid current calculated: ${i.toFixed(2)}A (expected 0-10000A)`,
          recommendation: 'Check circuit connections and load calculations'
        });
        // Clamp to reasonable value
        currents[compId] = Math.max(0, Math.min(10000, i));
      }
      
      if (p > 10000000 || p < -1000) {
        issues.push({
          id: `invalid-power-${compId}`,
          type: 'error',
          severity: 'critical',
          componentId: compId,
          message: `Invalid power calculated: ${p.toFixed(2)}W (expected 0-10000000W)`,
          recommendation: 'Check circuit connections and component power ratings'
        });
        // Clamp to reasonable value
        power[compId] = Math.max(0, Math.min(10000000, p));
      }
    });

    // Step 8: Calculate total power (sum of appliance powers only)
    const totalPower = appliances.reduce((sum, app) => {
      return sum + (app.properties.powerConsumption || 0);
    }, 0);
    
    const efficiency = totalLoad > 0 && totalPower > 0 ? Math.min(100, (totalPower / totalLoad) * 100) : 100;

    // Add circuit-level issues
    if (totalCurrent > 100 && totalCurrent < 10000) {
      issues.push({
        id: 'high-current',
        type: 'warning',
        severity: 'high',
        message: `High total current: ${totalCurrent.toFixed(2)}A`,
        recommendation: 'Consider dividing into multiple circuits'
      });
    }

    if (efficiency < 80 && totalLoad > 0 && efficiency > 0) {
      issues.push({
        id: 'low-efficiency',
        type: 'warning',
        severity: 'medium',
        message: `Low circuit efficiency: ${efficiency.toFixed(1)}%`,
        recommendation: 'Check for power losses and improve power factor'
      });
    }

    return {
      voltages,
      currents,
      power,
      totalPower,
      efficiency,
      issues
    };
  }

  // Helper methods
  static calculateVoltage(current: number, resistance: number): number {
    return current * resistance;
  }

  static calculateGroundFaultCurrent(voltage: number, resistance: number): number {
    return resistance > 0 ? voltage / resistance : 0;
  }

  // Component validation
  static validateComponent(component: Component): CircuitIssue[] {
    const issues: CircuitIssue[] = [];

    switch (component.type) {
      case 'resistor':
        if (component.value <= 0) {
          issues.push({
            id: `invalid-resistor-${component.id}`,
            type: 'error',
            severity: 'high',
            componentId: component.id,
            message: 'Resistor value must be positive',
            recommendation: 'Set a valid resistance value'
          });
        }
        break;

      case 'battery':
        if (component.value <= 0) {
          issues.push({
            id: `invalid-battery-${component.id}`,
            type: 'error',
            severity: 'high',
            componentId: component.id,
            message: 'Battery voltage must be positive',
            recommendation: 'Set a valid voltage value'
          });
        }
        break;

      case 'mcb':
        if (component.properties.tripCurrent && component.properties.tripCurrent <= 0) {
          issues.push({
            id: `invalid-mcb-${component.id}`,
            type: 'error',
            severity: 'high',
            componentId: component.id,
            message: 'MCB trip current must be positive',
            recommendation: 'Set a valid trip current value'
          });
        }
        break;
    }

    return issues;
  }
}