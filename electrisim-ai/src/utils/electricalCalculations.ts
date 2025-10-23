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

  // Wire sizing calculations (simplified)
  static calculateWireSize(current: number, length: number, voltageDrop: number = 3): number {
    const resistivity = 0.0000017; // Copper resistivity in ohm-m
    const crossSectionalArea = (2 * resistivity * length * current) / (voltageDrop * 0.01);
    return Math.max(crossSectionalArea, 1.5); // Minimum 1.5mm²
  }

  // Circuit protection calculations
  static calculateMCBRating(totalLoad: number, voltage: number, safetyFactor: number = 1.25): number {
    const current = (totalLoad / voltage) * safetyFactor;
    const standardRatings = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125];
    return standardRatings.find(rating => rating >= current) || 125;
  }

  static calculateRCCBRating(mcbRating: number): number {
    const standardRatings = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125];
    return standardRatings.find(rating => rating >= mcbRating) || 125;
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

    const sourceVoltage = powerSources[0].value;
    const isThreePhase = circuit.metadata?.phase === 'three';

    // Calculate total load
    const appliances = circuit.components.filter(c => 
      ['fan', 'light', 'tv', 'ac', 'motor', 'heater', 'refrigerator', 'washing-machine', 'microwave', 'ups', 'inverter', 'dishwasher', 'water-heater', 'electric-stove', 'electric-oven', 'heat-pump', 'electric-boiler'].includes(c.type)
    );

    const totalLoad = this.calculateTotalLoad(appliances.map(app => ({
      power: app.properties.powerConsumption || 0,
      quantity: 1,
      powerFactor: app.properties.powerFactor || 0.8
    })));

    // Calculate total current based on phase type
    let totalCurrent: number;
    if (isThreePhase) {
      totalCurrent = this.calculateThreePhasePower(sourceVoltage, 0, 0.8) > 0 ? 
        totalLoad / (Math.sqrt(3) * sourceVoltage * 0.8) : 0;
    } else {
      totalCurrent = totalLoad / sourceVoltage;
    }

    // Calculate voltages and currents for each component
    circuit.components.forEach(component => {
      switch (component.type) {
        case 'battery':
        case 'socket':
          voltages[component.id] = component.value;
          currents[component.id] = totalCurrent;
          power[component.id] = this.calculatePower(component.value, totalCurrent);
          break;

        case 'mcb':
          const mcbRating = component.properties.tripCurrent || 16;
          voltages[component.id] = sourceVoltage;
          currents[component.id] = totalCurrent;
          power[component.id] = this.calculatePower(sourceVoltage, totalCurrent);
          
          if (totalCurrent > mcbRating) {
            issues.push({
              id: `mcb-overcurrent-${component.id}`,
              type: 'error',
              severity: 'critical',
              componentId: component.id,
              message: `MCB will trip: Current (${totalCurrent.toFixed(2)}A) exceeds rating (${mcbRating}A)`,
              recommendation: `Use MCB with rating ${Math.ceil(totalCurrent * 1.25)}A or higher`
            });
          }
          break;

        case 'rccb':
          voltages[component.id] = sourceVoltage;
          currents[component.id] = totalCurrent;
          power[component.id] = this.calculatePower(sourceVoltage, totalCurrent);
          break;

        case 'fuse':
          const fuseRating = component.properties.fuseRating || 16;
          voltages[component.id] = sourceVoltage;
          currents[component.id] = totalCurrent;
          power[component.id] = this.calculatePower(sourceVoltage, totalCurrent);
          
          if (totalCurrent > fuseRating) {
            issues.push({
              id: `fuse-overcurrent-${component.id}`,
              type: 'error',
              severity: 'critical',
              componentId: component.id,
              message: `Fuse will blow: Current (${totalCurrent.toFixed(2)}A) exceeds rating (${fuseRating}A)`,
              recommendation: `Use fuse with rating ${Math.ceil(totalCurrent * 1.25)}A or higher`
            });
          }
          break;

        case 'fan':
          const fanPower = component.properties.powerConsumption || 75;
          const fanVoltage = component.properties.operatingVoltage || 230;
          const fanCurrent = fanPower / fanVoltage;
          const fanPowerFactor = component.properties.powerFactor || 0.8;
          
          voltages[component.id] = fanVoltage;
          currents[component.id] = fanCurrent;
          power[component.id] = this.calculateACPower(fanVoltage, fanCurrent, fanPowerFactor);
          break;

        case 'light':
          const lightPower = component.properties.powerConsumption || 10;
          const lightVoltage = component.properties.operatingVoltage || 230;
          const lightCurrent = lightPower / lightVoltage;
          const lightPowerFactor = component.properties.powerFactor || 0.9;
          
          voltages[component.id] = lightVoltage;
          currents[component.id] = lightCurrent;
          power[component.id] = this.calculateACPower(lightVoltage, lightCurrent, lightPowerFactor);
          break;

        case 'ac':
          const acPower = component.properties.powerConsumption || 2000;
          const acVoltage = component.properties.operatingVoltage || 230;
          const acCurrent = acPower / acVoltage;
          const acPowerFactor = component.properties.powerFactor || 0.85;
          
          voltages[component.id] = acVoltage;
          currents[component.id] = acCurrent;
          power[component.id] = this.calculateACPower(acVoltage, acCurrent, acPowerFactor);
          break;

        case 'heater':
          const heaterPower = component.properties.powerConsumption || 1500;
          const heaterVoltage = component.properties.operatingVoltage || 230;
          const heaterCurrent = heaterPower / heaterVoltage;
          const heaterPowerFactor = component.properties.powerFactor || 1.0;
          
          voltages[component.id] = heaterVoltage;
          currents[component.id] = heaterCurrent;
          power[component.id] = this.calculateACPower(heaterVoltage, heaterCurrent, heaterPowerFactor);
          break;

        case 'tv':
          const tvPower = component.properties.powerConsumption || 150;
          const tvVoltage = component.properties.operatingVoltage || 230;
          const tvCurrent = tvPower / tvVoltage;
          const tvPowerFactor = component.properties.powerFactor || 0.9;
          
          voltages[component.id] = tvVoltage;
          currents[component.id] = tvCurrent;
          power[component.id] = this.calculateACPower(tvVoltage, tvCurrent, tvPowerFactor);
          break;

        case 'motor':
          const motorPower = component.properties.powerConsumption || 750;
          const motorVoltage = component.properties.operatingVoltage || 230;
          const motorCurrent = motorPower / motorVoltage;
          const motorPowerFactor = component.properties.powerFactor || 0.8;
          
          voltages[component.id] = motorVoltage;
          currents[component.id] = motorCurrent;
          power[component.id] = this.calculateACPower(motorVoltage, motorCurrent, motorPowerFactor);
          break;

        case 'ups':
          const upsPower = component.properties.powerConsumption || 1000;
          const upsVoltage = component.properties.operatingVoltage || 230;
          const upsCurrent = upsPower / upsVoltage;
          const upsPowerFactor = component.properties.powerFactor || 0.8;
          
          voltages[component.id] = upsVoltage;
          currents[component.id] = upsCurrent;
          power[component.id] = this.calculateACPower(upsVoltage, upsCurrent, upsPowerFactor);
          break;

        case 'inverter':
          const inverterPower = component.properties.powerConsumption || 2000;
          const inverterVoltage = component.properties.operatingVoltage || 230;
          const inverterCurrent = inverterPower / inverterVoltage;
          const inverterPowerFactor = component.properties.powerFactor || 0.9;
          
          voltages[component.id] = inverterVoltage;
          currents[component.id] = inverterCurrent;
          power[component.id] = this.calculateACPower(inverterVoltage, inverterCurrent, inverterPowerFactor);
          break;

        case 'refrigerator':
          const fridgePower = component.properties.powerConsumption || 150;
          const fridgeVoltage = component.properties.operatingVoltage || 230;
          const fridgeCurrent = fridgePower / fridgeVoltage;
          const fridgePowerFactor = component.properties.powerFactor || 0.8;
          
          voltages[component.id] = fridgeVoltage;
          currents[component.id] = fridgeCurrent;
          power[component.id] = this.calculateACPower(fridgeVoltage, fridgeCurrent, fridgePowerFactor);
          break;

        case 'washing-machine':
          const washingPower = component.properties.powerConsumption || 2000;
          const washingVoltage = component.properties.operatingVoltage || 230;
          const washingCurrent = washingPower / washingVoltage;
          const washingPowerFactor = component.properties.powerFactor || 0.85;
          
          voltages[component.id] = washingVoltage;
          currents[component.id] = washingCurrent;
          power[component.id] = this.calculateACPower(washingVoltage, washingCurrent, washingPowerFactor);
          break;

        case 'microwave':
          const microwavePower = component.properties.powerConsumption || 1200;
          const microwaveVoltage = component.properties.operatingVoltage || 230;
          const microwaveCurrent = microwavePower / microwaveVoltage;
          const microwavePowerFactor = component.properties.powerFactor || 0.9;
          
          voltages[component.id] = microwaveVoltage;
          currents[component.id] = microwaveCurrent;
          power[component.id] = this.calculateACPower(microwaveVoltage, microwaveCurrent, microwavePowerFactor);
          break;

        case 'dishwasher':
          const dishwasherPower = component.properties.powerConsumption || 1800;
          const dishwasherVoltage = component.properties.operatingVoltage || 230;
          const dishwasherCurrent = dishwasherPower / dishwasherVoltage;
          const dishwasherPowerFactor = component.properties.powerFactor || 0.85;
          
          voltages[component.id] = dishwasherVoltage;
          currents[component.id] = dishwasherCurrent;
          power[component.id] = this.calculateACPower(dishwasherVoltage, dishwasherCurrent, dishwasherPowerFactor);
          break;

        case 'water-heater':
          const waterHeaterPower = component.properties.powerConsumption || 3000;
          const waterHeaterVoltage = component.properties.operatingVoltage || 230;
          const waterHeaterCurrent = waterHeaterPower / waterHeaterVoltage;
          const waterHeaterPowerFactor = component.properties.powerFactor || 1.0;
          
          voltages[component.id] = waterHeaterVoltage;
          currents[component.id] = waterHeaterCurrent;
          power[component.id] = this.calculateACPower(waterHeaterVoltage, waterHeaterCurrent, waterHeaterPowerFactor);
          break;

        case 'electric-stove':
          const stovePower = component.properties.powerConsumption || 4000;
          const stoveVoltage = component.properties.operatingVoltage || 230;
          const stoveCurrent = stovePower / stoveVoltage;
          const stovePowerFactor = component.properties.powerFactor || 1.0;
          
          voltages[component.id] = stoveVoltage;
          currents[component.id] = stoveCurrent;
          power[component.id] = this.calculateACPower(stoveVoltage, stoveCurrent, stovePowerFactor);
          break;

        case 'electric-oven':
          const ovenPower = component.properties.powerConsumption || 2500;
          const ovenVoltage = component.properties.operatingVoltage || 230;
          const ovenCurrent = ovenPower / ovenVoltage;
          const ovenPowerFactor = component.properties.powerFactor || 1.0;
          
          voltages[component.id] = ovenVoltage;
          currents[component.id] = ovenCurrent;
          power[component.id] = this.calculateACPower(ovenVoltage, ovenCurrent, ovenPowerFactor);
          break;

        case 'heat-pump':
          const heatPumpPower = component.properties.powerConsumption || 3000;
          const heatPumpVoltage = component.properties.operatingVoltage || 230;
          const heatPumpCurrent = heatPumpPower / heatPumpVoltage;
          const heatPumpPowerFactor = component.properties.powerFactor || 0.9;
          
          voltages[component.id] = heatPumpVoltage;
          currents[component.id] = heatPumpCurrent;
          power[component.id] = this.calculateACPower(heatPumpVoltage, heatPumpCurrent, heatPumpPowerFactor);
          break;

        case 'electric-boiler':
          const boilerPower = component.properties.powerConsumption || 6000;
          const boilerVoltage = component.properties.operatingVoltage || 230;
          const boilerCurrent = boilerPower / boilerVoltage;
          const boilerPowerFactor = component.properties.powerFactor || 1.0;
          
          voltages[component.id] = boilerVoltage;
          currents[component.id] = boilerCurrent;
          power[component.id] = this.calculateACPower(boilerVoltage, boilerCurrent, boilerPowerFactor);
          break;

        case 'voltmeter':
          voltages[component.id] = sourceVoltage;
          currents[component.id] = 0.001; // Very low current for voltmeter
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
          const componentVoltage = this.calculateVoltage(totalCurrent, component.value);
          const componentCurrent = totalCurrent;
          const componentPower = this.calculatePower(componentVoltage, componentCurrent);
          
          voltages[component.id] = componentVoltage;
          currents[component.id] = componentCurrent;
          power[component.id] = componentPower;

          if (component.properties.powerRating && componentPower > component.properties.powerRating) {
            issues.push({
              id: `overpower-${component.id}`,
              type: 'warning',
              severity: 'high',
              componentId: component.id,
              message: `Component ${component.id} is exceeding its power rating`,
              recommendation: `Use a resistor with higher power rating (${componentPower.toFixed(2)}W)`
            });
          }
          break;

        default:
          voltages[component.id] = sourceVoltage;
          currents[component.id] = totalCurrent;
          power[component.id] = this.calculatePower(sourceVoltage, totalCurrent);
      }
    });

    const totalPower = Object.values(power).reduce((sum, p) => sum + p, 0);
    const efficiency = totalLoad > 0 ? (totalPower / totalLoad) * 100 : 0;

    // Add circuit-level issues
    if (totalCurrent > 100) {
      issues.push({
        id: 'high-current',
        type: 'warning',
        severity: 'high',
        message: `High total current: ${totalCurrent.toFixed(2)}A`,
        recommendation: 'Consider dividing into multiple circuits'
      });
    }

    if (efficiency < 80) {
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

  // Safety calculations
  static calculateArcFlashEnergy(voltage: number, current: number, distance: number): number {
    const energy = (voltage * current) / (distance * 1000);
    return Math.max(0, energy);
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