// Safety Assessment Agent
import type { Circuit, CircuitAnalysis, SafetyAssessment, SafetyHazard, ComplianceCheck, Component } from '../types/circuit.types';
import { ElectricalCalculations } from '../utils/electricalCalculations';

export class SafetyAssessmentAgent {
  private safetyStandards = {
    NEC: {
      maxVoltage: 600, // Volts
      maxCurrent: 100, // Amperes
      minWireGauge: 14, // AWG
      maxPowerDensity: 1000 // W/m²
    },
    OSHA: {
      maxTouchVoltage: 50, // Volts
      maxArcFlashEnergy: 1.2, // cal/cm²
      minWorkingDistance: 18 // inches
    },
    NFPA: {
      maxArcFlashEnergy: 1.2, // cal/cm²
      minPPERating: 1.2, // cal/cm²
      maxIncidentEnergy: 1.2 // cal/cm²
    }
  };

  // Main safety assessment method
  assessSafety(analysis: CircuitAnalysis, circuit: Circuit): SafetyAssessment {
    const hazards: SafetyHazard[] = [];
    const compliance: ComplianceCheck[] = [];
    const recommendations: string[] = [];

    // Validate analysis values first - filter out impossible values
    const validatedAnalysis = this.validateAnalysisValues(analysis, circuit);

    // Analyze circuit for safety hazards
    this.analyzeOvercurrentHazards(validatedAnalysis, circuit, hazards);
    this.analyzeOvervoltageHazards(validatedAnalysis, circuit, hazards);
    this.analyzeShortCircuitHazards(validatedAnalysis, circuit, hazards);
    this.analyzeGroundFaultHazards(validatedAnalysis, circuit, hazards);
    this.analyzeThermalHazards(validatedAnalysis, circuit, hazards);
    this.analyzeArcFlashHazards(validatedAnalysis, circuit, hazards);

    // Remove duplicate hazards (same type/component/description)
    const hazardMap = new Map<string, SafetyHazard>();
    hazards.forEach(hazard => {
      const key = `${hazard.type}|${hazard.componentId || 'global'}|${hazard.description}`;
      if (!hazardMap.has(key)) {
        hazardMap.set(key, hazard);
      }
    });
    const uniqueHazards = Array.from(hazardMap.values());

    // Check compliance with safety standards
    this.checkNECCompliance(validatedAnalysis, circuit, compliance);
    this.checkOSHACompliance(validatedAnalysis, circuit, compliance);
    this.checkNFPACompliance(validatedAnalysis, circuit, compliance);

    // Generate recommendations
    this.generateSafetyRecommendations(uniqueHazards, compliance, recommendations);

    // Remove duplicate recommendations
    const recommendationSet = new Set<string>();
    const uniqueRecommendations = recommendations.filter(rec => {
      if (recommendationSet.has(rec)) {
        return false;
      }
      recommendationSet.add(rec);
      return true;
    });

    // Calculate safety score
    const safetyScore = this.calculateSafetyScore(uniqueHazards, compliance);
    const riskLevel = this.determineRiskLevel(safetyScore, uniqueHazards);

    return {
      safetyScore,
      hazards: uniqueHazards,
      compliance,
      recommendations: uniqueRecommendations,
      riskLevel
    };
  }

  // Validate analysis values - filter out impossible values
  private validateAnalysisValues(analysis: CircuitAnalysis, circuit: Circuit): CircuitAnalysis {
    const validatedVoltages: { [key: string]: number } = {};
    const validatedCurrents: { [key: string]: number } = {};
    const validatedPower: { [key: string]: number } = {};
    
    // Filter and clamp impossible values
    Object.keys(analysis.voltages || {}).forEach(compId => {
      const v = analysis.voltages[compId];
      if (Number.isFinite(v) && v >= 0 && v <= 1000) {
        validatedVoltages[compId] = v;
      } else {
        validatedVoltages[compId] = 0; // Set to 0 for invalid values
      }
    });
    
    Object.keys(analysis.currents || {}).forEach(compId => {
      const i = analysis.currents[compId];
      if (Number.isFinite(i) && i >= 0 && i <= 10000) {
        validatedCurrents[compId] = i;
      } else {
        validatedCurrents[compId] = 0; // Set to 0 for invalid values
      }
    });
    
    // For power, use appliance powerConsumption directly when available
    circuit.components.forEach(comp => {
      const compId = comp.id;
      const applianceTypes = ['fan', 'light', 'tv', 'ac', 'motor', 'heater', 'refrigerator', 'washing-machine', 'microwave', 'ups', 'inverter', 'dishwasher', 'water-heater', 'electric-stove', 'electric-oven', 'heat-pump', 'electric-boiler'];
      
      if (applianceTypes.includes(comp.type) && comp.properties.powerConsumption) {
        // Use powerConsumption directly for appliances
        validatedPower[compId] = comp.properties.powerConsumption;
      } else {
        // For other components, validate calculated power
        const p = analysis.power[compId] || 0;
        if (Number.isFinite(p) && p >= 0 && p <= 10000000) {
          validatedPower[compId] = p;
        } else {
          validatedPower[compId] = 0;
        }
      }
    });
    
    return {
      voltages: validatedVoltages,
      currents: validatedCurrents,
      power: validatedPower,
      totalPower: analysis.totalPower || 0,
      efficiency: analysis.efficiency || 0,
      issues: analysis.issues || []
    };
  }

  // Analyze overcurrent hazards
  private analyzeOvercurrentHazards(analysis: CircuitAnalysis, circuit: Circuit, hazards: SafetyHazard[]): void {
    const powerSources = circuit.components.filter(c => c.type === 'battery');
    
    powerSources.forEach(source => {
      const current = analysis.currents[source.id] || 0;
      const voltage = analysis.voltages[source.id] || 0;
      
      // Check against NEC limits
      if (current > this.safetyStandards.NEC.maxCurrent) {
        hazards.push({
          id: `overcurrent-${source.id}`,
          type: 'overcurrent',
          severity: 'critical',
          componentId: source.id,
          description: `Current ${current.toFixed(2)}A exceeds NEC limit of ${this.safetyStandards.NEC.maxCurrent}A`,
          mitigation: 'Add current limiting devices or reduce load'
        });
      }

      // Check component ratings
      circuit.components.forEach(component => {
        if (component.properties.currentRating && analysis.currents[component.id]) {
          const componentCurrent = analysis.currents[component.id];
          if (componentCurrent > component.properties.currentRating) {
            hazards.push({
              id: `component-overcurrent-${component.id}`,
              type: 'overcurrent',
              severity: 'high',
              componentId: component.id,
              description: `Component ${component.id} current ${componentCurrent.toFixed(2)}A exceeds rating ${component.properties.currentRating}A`,
              mitigation: 'Replace with higher rated component or add current limiting'
            });
          }
        }
      });
    });
  }

  // Analyze overvoltage hazards
  private analyzeOvervoltageHazards(analysis: CircuitAnalysis, circuit: Circuit, hazards: SafetyHazard[]): void {
    const accessibleTypes: Component['type'][] = [
      'socket', 'switch', 'two-way-switch', 'light', 'fan', 'tv', 'ac', 'heater',
      'motor', 'washing-machine', 'dishwasher', 'microwave', 'refrigerator',
      'water-heater', 'electric-stove', 'electric-oven', 'heat-pump', 'electric-boiler'
    ];
    const hasProtection = circuit.components.some(c => ['gfci', 'rccb', 'afci'].includes(c.type));
    const accessibleHighVoltage: string[] = [];

    circuit.components.forEach(component => {
      const voltage = analysis.voltages[component.id] || 0;
      
      // Check against NEC voltage limits
      if (voltage > this.safetyStandards.NEC.maxVoltage) {
        hazards.push({
          id: `overvoltage-${component.id}`,
          type: 'overvoltage',
          severity: 'critical',
          componentId: component.id,
          description: `Voltage ${voltage.toFixed(2)}V exceeds NEC limit of ${this.safetyStandards.NEC.maxVoltage}V`,
          mitigation: 'Use appropriate voltage rating or add voltage protection'
        });
      }

      // Check component voltage ratings
      if (component.properties.voltageRating && voltage > component.properties.voltageRating) {
        hazards.push({
          id: `component-overvoltage-${component.id}`,
          type: 'overvoltage',
          severity: 'high',
          componentId: component.id,
          description: `Component ${component.id} voltage ${voltage.toFixed(2)}V exceeds rating ${component.properties.voltageRating}V`,
          mitigation: 'Replace with higher voltage rated component'
        });
      }

      const isAccessible = accessibleTypes.includes(component.type);
      if (!hasProtection && isAccessible && voltage > this.safetyStandards.OSHA.maxTouchVoltage) {
        accessibleHighVoltage.push(`${component.type} (${component.id})`);
      }
    });

    if (!hasProtection && accessibleHighVoltage.length > 0) {
      hazards.push({
        id: 'touch-voltage-accessible',
        type: 'overvoltage',
        severity: 'high',
        description: `${accessibleHighVoltage.length} accessible component(s) exceed OSHA touch voltage limit of ${this.safetyStandards.OSHA.maxTouchVoltage}V`,
        mitigation: 'Install GFCI/RCCB protection and ensure proper insulation/grounding'
      });
    }
  }

  // Analyze short circuit hazards
  private analyzeShortCircuitHazards(analysis: CircuitAnalysis, circuit: Circuit, hazards: SafetyHazard[]): void {
    const powerSources = circuit.components.filter(c => c.type === 'battery' || c.type === 'socket');
    const reportedShorts = new Set<string>();
    const supplyVoltage = circuit.metadata?.voltage && circuit.metadata.voltage > 0 
      ? circuit.metadata.voltage 
      : 230;
    
    powerSources.forEach(source => {
      const current = analysis.currents[source.id] || 0;
      const voltage = analysis.voltages[source.id] || supplyVoltage;
      
      // Only flag if voltage is reasonable (not a misread) and current is truly excessive
      // For 230V systems, normal loads shouldn't exceed ~150A for residential
      // Short circuit would be much higher (1000A+)
      const expectedMaxCurrent = supplyVoltage <= 50 ? 50 : 150; // Higher threshold for low voltage
      
      // Only report if it's a genuine short circuit (very high current relative to voltage)
      if (voltage > 0 && voltage <= 600 && current > expectedMaxCurrent && current > voltage * 3) {
        const key = `short-${source.id}`;
        if (!reportedShorts.has(key)) {
          hazards.push({
            id: `short-circuit-${source.id}`,
            type: 'short_circuit',
            severity: 'critical',
            componentId: source.id,
            description: `Potential short circuit detected: ${current.toFixed(2)}A at ${voltage.toFixed(2)}V`,
            mitigation: 'Add fuses, circuit breakers, or current limiting devices'
          });
          reportedShorts.add(key);
        }
      }
    });
  }

  // Analyze ground fault hazards
  private analyzeGroundFaultHazards(analysis: CircuitAnalysis, circuit: Circuit, hazards: SafetyHazard[]): void {
    const hasGround = circuit.components.some(c => c.type === 'ground');
    const hasGroundFaultProtection = circuit.components.some(c => ['gfci', 'rccb'].includes(c.type));
    
    if (!hasGround) {
      hazards.push({
        id: 'no-ground',
        type: 'ground_fault',
        severity: 'medium',
        description: 'No ground connection found in circuit',
        mitigation: 'Add proper grounding for safety'
      });
    }

    // Check for ground fault current
    if (hasGroundFaultProtection) {
      return;
    }

    const powerSources = circuit.components.filter(c => c.type === 'battery');
    powerSources.forEach(source => {
      const voltage = analysis.voltages[source.id] || 0;
      const current = analysis.currents[source.id] || 0;
      
      if (voltage > 0 && current > 0) {
        const groundFaultCurrent = ElectricalCalculations.calculateGroundFaultCurrent(voltage, 1000); // Assume 1kΩ ground resistance
        
        if (groundFaultCurrent > 0.03) { // 30mA limit
          hazards.push({
            id: `ground-fault-${source.id}`,
            type: 'ground_fault',
            severity: 'high',
            componentId: source.id,
            description: `Ground fault current ${(groundFaultCurrent * 1000).toFixed(1)}mA exceeds safety limit`,
            mitigation: 'Install GFCI protection or improve grounding'
          });
        }
      }
    });
  }

  // Analyze thermal hazards
  private analyzeThermalHazards(analysis: CircuitAnalysis, circuit: Circuit, hazards: SafetyHazard[]): void {
    // List of appliance types that legitimately consume high power
    const highPowerAppliances: Component['type'][] = [
      'ac', 'heater', 'motor', 'washing-machine', 'microwave', 'dishwasher',
      'water-heater', 'electric-stove', 'electric-oven', 'heat-pump', 'electric-boiler',
      'ups', 'inverter', 'refrigerator'
    ];

    circuit.components.forEach(component => {
      // Use powerConsumption directly for appliances, validated power for others
      let power: number;
      if (highPowerAppliances.includes(component.type) && component.properties.powerConsumption) {
        power = component.properties.powerConsumption;
      } else {
        power = analysis.power[component.id] || 0;
      }
      
      // Skip if power is invalid or zero
      if (!Number.isFinite(power) || power <= 0 || power > 10000000) {
        return;
      }
      
      const isHighPowerAppliance = highPowerAppliances.includes(component.type);
      
      // Check power ratings
      if (component.properties.powerRating && power > component.properties.powerRating) {
        hazards.push({
          id: `thermal-${component.id}`,
          type: 'thermal',
          severity: 'high',
          componentId: component.id,
          description: `Component ${component.id} power ${power.toFixed(2)}W exceeds rating ${component.properties.powerRating}W`,
          mitigation: 'Replace with higher power rated component or add heat sinking'
        });
      }

      // Only check for excessive power density for non-appliance components or protection devices
      // Appliances like AC, heaters, etc. are designed to handle their rated power
      if (!component.properties.powerRating && !isHighPowerAppliance) {
        // For protection devices and small components, flag if power is unusually high
        const isProtectionDevice = ['mcb', 'rccb', 'gfci', 'afci', 'spd', 'surge-protector', 'fuse'].includes(component.type);
        const threshold = isProtectionDevice ? 100 : 500; // Lower threshold for protection devices
        
        if (power > threshold) {
          hazards.push({
            id: `thermal-density-${component.id}`,
            type: 'thermal',
            severity: 'medium',
            componentId: component.id,
            description: `High power dissipation ${power.toFixed(2)}W may cause thermal issues`,
            mitigation: 'Ensure adequate ventilation and heat sinking'
          });
        }
      }
    });
  }

  // Analyze arc flash hazards
  private analyzeArcFlashHazards(analysis: CircuitAnalysis, circuit: Circuit, hazards: SafetyHazard[]): void {
    const powerSources = circuit.components.filter(c => c.type === 'battery' || c.type === 'socket');
    
    powerSources.forEach(source => {
      const voltage = analysis.voltages[source.id] || 0;
      const current = analysis.currents[source.id] || 0;
      
      // Validate values before calculating arc flash
      if (!Number.isFinite(voltage) || voltage < 0 || voltage > 1000) return;
      if (!Number.isFinite(current) || current < 0 || current > 10000) return;
      
      if (voltage > 50) { // Arc flash risk above 50V
        // Use realistic fault current (typically 10x operating current for short circuit)
        const faultCurrent = Math.min(current * 10, 10000); // Cap at 10kA for realistic calculation
        const arcFlashEnergy = ElectricalCalculations.calculateArcFlashEnergy(voltage, faultCurrent, 18); // 18 inch working distance
        
        if (Number.isFinite(arcFlashEnergy) && arcFlashEnergy > this.safetyStandards.NFPA.maxArcFlashEnergy) {
          hazards.push({
            id: `arc-flash-${source.id}`,
            type: 'arc_flash',
            severity: 'critical',
            componentId: source.id,
            description: `Arc flash energy ${arcFlashEnergy.toFixed(2)} cal/cm² exceeds NFPA limit`,
            mitigation: 'Use appropriate PPE, maintain safe working distance, or reduce fault current'
          });
        }
      }
    });
  }

  // Check NEC compliance
  private checkNECCompliance(analysis: CircuitAnalysis, circuit: Circuit, compliance: ComplianceCheck[]): void {
    // Filter out impossible values
    const voltageValues = Object.values(analysis.voltages || {}).filter(value => 
      Number.isFinite(value) && value >= 0 && value <= 1000
    );
    const currentValues = Object.values(analysis.currents || {}).filter(value => 
      Number.isFinite(value) && value >= 0 && value <= 10000
    );
    const maxVoltage = voltageValues.length ? Math.max(...voltageValues) : 0;
    const maxCurrent = currentValues.length ? Math.max(...currentValues) : 0;

    const criticalProtection = ['mcb', 'rccb', 'ground'];
    const recommendedProtection = ['gfci', 'afci', 'spd', 'surge-protector', 'overvoltage-protector', 'undervoltage-protector', 'emergency-stop'];

    const hasComponentType = (type: string) => circuit.components.some(component => component.type === type);
    const missingCritical = criticalProtection.filter(type => !hasComponentType(type));
    const missingRecommended = recommendedProtection.filter(type => !hasComponentType(type));

    let status: ComplianceCheck['status'] = 'compliant';
    const descriptionParts: string[] = [];

    if (!voltageValues.length || !currentValues.length) {
      status = 'warning';
      descriptionParts.push('Insufficient voltage/current data to fully verify NEC limits');
    } else if (maxVoltage > this.safetyStandards.NEC.maxVoltage || maxCurrent > this.safetyStandards.NEC.maxCurrent) {
      status = 'non_compliant';
      if (maxVoltage > this.safetyStandards.NEC.maxVoltage) {
        descriptionParts.push(`Max voltage ${maxVoltage.toFixed(1)}V exceeds NEC limit ${this.safetyStandards.NEC.maxVoltage}V`);
      }
      if (maxCurrent > this.safetyStandards.NEC.maxCurrent) {
        descriptionParts.push(`Max current ${maxCurrent.toFixed(2)}A exceeds NEC limit ${this.safetyStandards.NEC.maxCurrent}A`);
      }
    } else {
      descriptionParts.push(`Voltage ${maxVoltage.toFixed(1)}V and current ${maxCurrent.toFixed(2)}A within NEC limits`);
    }

    if (missingCritical.length) {
      status = 'non_compliant';
      descriptionParts.push(`Missing critical protection: ${missingCritical.join(', ')}`);
    } else if (missingRecommended.length) {
      if (status !== 'non_compliant') {
        status = 'warning';
      }
      descriptionParts.push(`Consider adding protection: ${missingRecommended.join(', ')}`);
    } else {
      descriptionParts.push('All critical protection devices present');
    }

    compliance.push({
      standard: 'NEC',
      status,
      description: descriptionParts.join(' | '),
      requirement: `Keep voltage ≤ ${this.safetyStandards.NEC.maxVoltage}V & current ≤ ${this.safetyStandards.NEC.maxCurrent}A. Required protection: MCB, RCCB, grounding. Recommended: GFCI, AFCI, SPD, surge, over/undervoltage, emergency stop.`
    });
  }

  // Check OSHA compliance
  private checkOSHACompliance(analysis: CircuitAnalysis, circuit: Circuit, compliance: ComplianceCheck[]): void {
    // Filter out impossible values
    const voltageValues = Object.values(analysis.voltages || {}).filter(value => 
      Number.isFinite(value) && value >= 0 && value <= 1000
    );
    const maxVoltage = voltageValues.length ? Math.max(...voltageValues) : 0;

    let status: ComplianceCheck['status'] = 'compliant';
    let description: string;

    if (!voltageValues.length) {
      status = 'warning';
      description = 'Touch voltage data unavailable – unable to fully verify OSHA compliance';
    } else if (maxVoltage > this.safetyStandards.OSHA.maxTouchVoltage) {
      status = 'warning';
      description = `Touch voltage ${maxVoltage.toFixed(1)}V exceeds OSHA recommended limit ${this.safetyStandards.OSHA.maxTouchVoltage}V`;
    } else {
      description = `Touch voltage ${maxVoltage.toFixed(1)}V within OSHA safe limit ${this.safetyStandards.OSHA.maxTouchVoltage}V`;
    }

    compliance.push({
      standard: 'OSHA',
      status,
      description,
      requirement: `Keep accessible touch voltage ≤ ${this.safetyStandards.OSHA.maxTouchVoltage}V and provide proper isolation/guards.`
    });
  }

  // Check NFPA compliance
  private checkNFPACompliance(analysis: CircuitAnalysis, circuit: Circuit, compliance: ComplianceCheck[]): void {
    const powerSources = circuit.components.filter(c => c.type === 'battery');
    let maxArcFlashEnergy = 0;

    powerSources.forEach(source => {
      const voltage = analysis.voltages[source.id] || 0;
      const current = analysis.currents[source.id] || 0;
      
      if (voltage > 50) {
        const arcFlashEnergy = ElectricalCalculations.calculateArcFlashEnergy(voltage, current, 18);
        if (Number.isFinite(arcFlashEnergy)) {
          maxArcFlashEnergy = Math.max(maxArcFlashEnergy, arcFlashEnergy);
        }
      }
    });

    let status: ComplianceCheck['status'] = 'compliant';
    let description: string;

    if (powerSources.length === 0) {
      status = 'warning';
      description = 'No primary power sources detected – unable to evaluate arc flash risk';
    } else if (maxArcFlashEnergy === 0) {
      status = 'warning';
      description = 'Arc flash energy could not be calculated – verify fault current data';
    } else if (maxArcFlashEnergy > this.safetyStandards.NFPA.maxArcFlashEnergy) {
      status = 'non_compliant';
      description = `Arc flash energy ${maxArcFlashEnergy.toFixed(2)} cal/cm² exceeds NFPA limit ${this.safetyStandards.NFPA.maxArcFlashEnergy} cal/cm²`;
    } else {
      description = `Arc flash energy ${maxArcFlashEnergy.toFixed(2)} cal/cm² within NFPA limit ${this.safetyStandards.NFPA.maxArcFlashEnergy} cal/cm²`;
    }

    compliance.push({
      standard: 'NFPA',
      status,
      description,
      requirement: `Limit incident energy to ≤ ${this.safetyStandards.NFPA.maxArcFlashEnergy} cal/cm² at 18" working distance and apply appropriate PPE.`
    });
  }

  // Generate safety recommendations
  private generateSafetyRecommendations(hazards: SafetyHazard[], compliance: ComplianceCheck[], recommendations: string[]): void {
    // Add recommendations based on hazards
    hazards.forEach(hazard => {
      recommendations.push(hazard.mitigation);
    });

    // Add general safety recommendations
    if (hazards.length === 0) {
      recommendations.push('Circuit appears safe - continue monitoring');
    } else {
      recommendations.push('Review all safety hazards before operation');
      recommendations.push('Consider adding protective devices (fuses, circuit breakers)');
    }

    // Add compliance-based recommendations
    const nonCompliant = compliance.filter(c => c.status === 'non_compliant');
    if (nonCompliant.length > 0) {
      recommendations.push('Address non-compliance issues before operation');
    }
  }

  // Calculate safety score (0-100)
  private calculateSafetyScore(hazards: SafetyHazard[], compliance: ComplianceCheck[]): number {
    let score = 100;
    const hasProtection = hazards.length === 0 || 
      !hazards.some(h => h.type === 'short_circuit' && h.severity === 'critical');
    const protectionBonus = hasProtection ? 20 : 0; // Bonus for having protection devices
    score += protectionBonus;

    // Deduct points for hazards (reduced penalties)
    hazards.forEach(hazard => {
      switch (hazard.severity) {
        case 'critical':
          score -= 25; // Reduced from 30
          break;
        case 'high':
          score -= 15; // Reduced from 20
          break;
        case 'medium':
          score -= 8; // Reduced from 10
          break;
        case 'low':
          score -= 3; // Reduced from 5
          break;
      }
    });

    // Deduct points for non-compliance (reduced penalties)
    compliance.forEach(check => {
      if (check.status === 'non_compliant') {
        score -= 12; // Reduced from 15
      } else if (check.status === 'warning') {
        score -= 3; // Reduced from 5
      }
    });

    // Cap at 100 and ensure minimum of 10 if protection devices exist
    const finalScore = Math.min(100, Math.max(hasProtection ? 10 : 0, score));
    return finalScore;
  }

  // Determine risk level
  private determineRiskLevel(safetyScore: number, hazards: SafetyHazard[]): 'low' | 'medium' | 'high' | 'critical' {
    const criticalHazards = hazards.filter(h => h.severity === 'critical').length;
    const highHazards = hazards.filter(h => h.severity === 'high').length;

    if (criticalHazards > 0 || safetyScore < 30) {
      return 'critical';
    } else if (highHazards > 0 || safetyScore < 50) {
      return 'high';
    } else if (safetyScore < 75) {
      return 'medium';
    } else {
      return 'low';
    }
  }
}
