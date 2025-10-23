// Safety Assessment Agent
import type { Circuit, CircuitAnalysis, SafetyAssessment, SafetyHazard, ComplianceCheck } from '../types/circuit.types';
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

    // Analyze circuit for safety hazards
    this.analyzeOvercurrentHazards(analysis, circuit, hazards);
    this.analyzeOvervoltageHazards(analysis, circuit, hazards);
    this.analyzeShortCircuitHazards(analysis, circuit, hazards);
    this.analyzeGroundFaultHazards(analysis, circuit, hazards);
    this.analyzeThermalHazards(analysis, circuit, hazards);
    this.analyzeArcFlashHazards(analysis, circuit, hazards);

    // Check compliance with safety standards
    this.checkNECCompliance(analysis, circuit, compliance);
    this.checkOSHACompliance(analysis, circuit, compliance);
    this.checkNFPACompliance(analysis, circuit, compliance);

    // Generate recommendations
    this.generateSafetyRecommendations(hazards, compliance, recommendations);

    // Calculate safety score
    const safetyScore = this.calculateSafetyScore(hazards, compliance);
    const riskLevel = this.determineRiskLevel(safetyScore, hazards);

    return {
      safetyScore,
      hazards,
      compliance,
      recommendations,
      riskLevel
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

      // Check OSHA touch voltage limits
      if (voltage > this.safetyStandards.OSHA.maxTouchVoltage) {
        hazards.push({
          id: `touch-voltage-${component.id}`,
          type: 'overvoltage',
          severity: 'medium',
          componentId: component.id,
          description: `Touch voltage ${voltage.toFixed(2)}V exceeds OSHA limit of ${this.safetyStandards.OSHA.maxTouchVoltage}V`,
          mitigation: 'Ensure proper insulation and grounding'
        });
      }
    });
  }

  // Analyze short circuit hazards
  private analyzeShortCircuitHazards(analysis: CircuitAnalysis, circuit: Circuit, hazards: SafetyHazard[]): void {
    const powerSources = circuit.components.filter(c => c.type === 'battery');
    
    powerSources.forEach(source => {
      const current = analysis.currents[source.id] || 0;
      const voltage = analysis.voltages[source.id] || 0;
      
      // Detect potential short circuits
      if (voltage > 0 && current > voltage * 5) { // High current relative to voltage
        hazards.push({
          id: `short-circuit-${source.id}`,
          type: 'short_circuit',
          severity: 'critical',
          componentId: source.id,
          description: `Potential short circuit detected: ${current.toFixed(2)}A at ${voltage.toFixed(2)}V`,
          mitigation: 'Add fuses, circuit breakers, or current limiting devices'
        });
      }
    });
  }

  // Analyze ground fault hazards
  private analyzeGroundFaultHazards(analysis: CircuitAnalysis, circuit: Circuit, hazards: SafetyHazard[]): void {
    const hasGround = circuit.components.some(c => c.type === 'ground');
    
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
    circuit.components.forEach(component => {
      const power = analysis.power[component.id] || 0;
      
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

      // Check for excessive power density
      if (power > 1) { // Components dissipating more than 1W
        hazards.push({
          id: `thermal-density-${component.id}`,
          type: 'thermal',
          severity: 'medium',
          componentId: component.id,
          description: `High power dissipation ${power.toFixed(2)}W may cause thermal issues`,
          mitigation: 'Ensure adequate ventilation and heat sinking'
        });
      }
    });
  }

  // Analyze arc flash hazards
  private analyzeArcFlashHazards(analysis: CircuitAnalysis, circuit: Circuit, hazards: SafetyHazard[]): void {
    const powerSources = circuit.components.filter(c => c.type === 'battery');
    
    powerSources.forEach(source => {
      const voltage = analysis.voltages[source.id] || 0;
      const current = analysis.currents[source.id] || 0;
      
      if (voltage > 50) { // Arc flash risk above 50V
        const arcFlashEnergy = ElectricalCalculations.calculateArcFlashEnergy(voltage, current, 18); // 18 inch working distance
        
        if (arcFlashEnergy > this.safetyStandards.NFPA.maxArcFlashEnergy) {
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
    const maxVoltage = Math.max(...Object.values(analysis.voltages));
    const maxCurrent = Math.max(...Object.values(analysis.currents));

    compliance.push({
      standard: 'NEC',
      status: (maxVoltage <= this.safetyStandards.NEC.maxVoltage && maxCurrent <= this.safetyStandards.NEC.maxCurrent) ? 'compliant' : 'non_compliant',
      description: `Voltage and current levels within NEC limits`,
      requirement: `Maximum voltage: ${this.safetyStandards.NEC.maxVoltage}V, Maximum current: ${this.safetyStandards.NEC.maxCurrent}A`
    });
  }

  // Check OSHA compliance
  private checkOSHACompliance(analysis: CircuitAnalysis, circuit: Circuit, compliance: ComplianceCheck[]): void {
    const maxVoltage = Math.max(...Object.values(analysis.voltages));

    compliance.push({
      standard: 'OSHA',
      status: maxVoltage <= this.safetyStandards.OSHA.maxTouchVoltage ? 'compliant' : 'warning',
      description: `Touch voltage within OSHA limits`,
      requirement: `Maximum touch voltage: ${this.safetyStandards.OSHA.maxTouchVoltage}V`
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
        maxArcFlashEnergy = Math.max(maxArcFlashEnergy, arcFlashEnergy);
      }
    });

    compliance.push({
      standard: 'NFPA',
      status: maxArcFlashEnergy <= this.safetyStandards.NFPA.maxArcFlashEnergy ? 'compliant' : 'non_compliant',
      description: `Arc flash energy within NFPA limits`,
      requirement: `Maximum arc flash energy: ${this.safetyStandards.NFPA.maxArcFlashEnergy} cal/cm²`
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

    // Deduct points for hazards
    hazards.forEach(hazard => {
      switch (hazard.severity) {
        case 'critical':
          score -= 30;
          break;
        case 'high':
          score -= 20;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    // Deduct points for non-compliance
    compliance.forEach(check => {
      if (check.status === 'non_compliant') {
        score -= 15;
      } else if (check.status === 'warning') {
        score -= 5;
      }
    });

    return Math.max(0, score);
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
