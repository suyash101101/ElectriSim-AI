// Circuit Types for ElectriSim AI
export interface Position {
  x: number;
  y: number;
}

export interface Connection {
  id: string;
  from: string; // component id
  to: string; // component id
  fromPort: number; // port index
  toPort: number; // port index
  wireColor?: 'red' | 'black' | 'green' | 'blue'; // Wire color for visualization (red/green/blue for phases, black for neutral/ground)
}

export interface Component {
  id: string;
  type: 'battery' | 'resistor' | 'capacitor' | 'inductor' | 'transformer' | 'diode' | 'led' | 'switch' | 'ground' | 'wire' | 'fan' | 'light' | 'tv' | 'ac' | 'motor' | 'heater' | 'voltmeter' | 'ammeter' | 'wattmeter' | 'fuse' | 'mcb' | 'rccb' | 'contactor' | 'relay' | 'timer' | 'sensor' | 'breaker' | 'socket' | 'junction' | 'ups' | 'inverter' | 'refrigerator' | 'washing-machine' | 'microwave' | 'dishwasher' | 'water-heater' | 'electric-stove' | 'electric-oven' | 'heat-pump' | 'electric-boiler' | 'two-way-switch' | 'surge-protector' | 'gfci' | 'afci' | 'spd' | 'lightning-rod' | 'isolation-transformer' | 'emergency-stop' | 'overvoltage-protector' | 'undervoltage-protector';
  value: number;
  unit: string;
  position: Position;
  rotation: number; // degrees
  connections: string[]; // connection ids
  ports: number; // number of connection ports
  properties: {
    // Common properties
    color?: string;
    tolerance?: number;
    powerRating?: number;
    voltageRating?: number;
    currentRating?: number;
    description?: string;
    commonUse?: string;
    resistance?: number;
    
    // Battery specific
    batteryType?: 'DC' | 'AC';
    frequency?: number; // Hz for AC
    
    // Transformer specific
    turnsRatio?: number;
    primaryVoltage?: number;
    secondaryVoltage?: number;
    
    // Diode specific
    forwardVoltage?: number;
    reverseVoltage?: number;
    
    // Inductor specific
    inductance?: number;
    
    // Capacitor specific
    capacitance?: number;
    dielectricType?: string;
    
    // Appliance specific
    powerConsumption?: number; // Watts
    efficiency?: number; // Percentage
    operatingVoltage?: number; // Volts
    operatingCurrent?: number; // Amperes
    applianceFrequency?: number; // Hz for AC appliances
    phase?: 'single' | 'three'; // Phase type
    powerFactor?: number; // Power factor for AC appliances
    coolingCapacity?: number; // BTU for AC
    heatingCapacity?: number; // Watts for heaters
    screenSize?: number; // Inches for TV
    fanSpeed?: number; // RPM for fans
    motorType?: 'induction' | 'brushless' | 'stepper';
    
    // UPS specific
    batteryCapacity?: number; // Ah
    backupTime?: number; // minutes
    
    // Inverter specific
    inputVoltage?: number; // DC input voltage
    outputFrequency?: number; // Hz
    
    // Refrigerator specific
    compressorType?: 'reciprocating' | 'rotary' | 'scroll';
    
    // Washing machine specific
    capacity?: number; // kg
    
    // Microwave specific
    microwaveFrequency?: number; // MHz
    
    // Dishwasher specific
    waterHeating?: boolean;
    
    // Water heater specific
    heatingElement?: 'resistive' | 'induction';
    
    // Electric stove specific
    burners?: number;
    
    // Electric oven specific
    temperatureRange?: string;
    
    // Heat pump specific
    refrigerant?: string;
    
    // Electric boiler specific
    pressure?: number; // bar
    
    // Meter specific
    measurementRange?: number; // Maximum measurement value
    accuracy?: number; // Accuracy percentage
    displayType?: 'digital' | 'analog';
    
    // Protection device specific
    tripCurrent?: number; // Trip current for MCB/RCCB
    breakingCapacity?: number; // Breaking capacity in kA
    sensitivity?: number; // Sensitivity for RCCB
    fuseRating?: number; // Fuse rating in Amperes
    fuseType?: 'slow' | 'fast' | 'time-delay';
    
    // Control device specific
    coilVoltage?: number; // Coil voltage for contactor/relay
    contactRating?: number; // Contact rating
    timerType?: 'on-delay' | 'off-delay' | 'interval';
    timerRange?: number; // Timer range in seconds
    
    // Sensor specific
    sensorType?: 'temperature' | 'motion' | 'light' | 'pressure' | 'current';
    sensingRange?: number; // Sensing range
    outputType?: 'digital' | 'analog';
    
    // Socket specific
    socketType?: 'single' | 'double' | 'triple' | 'USB';
    socketRating?: number; // Socket rating in Amperes
    
    // Junction specific
    junctionType?: 'distribution' | 'junction' | 'terminal';
    
    // Two-way switch specific
    switchState?: 'on' | 'off';
    switchType?: 'single-pole' | 'double-pole' | 'three-way' | 'four-way';
    
    // Surge protector specific
    surgeRating?: number; // Joules
    clampingVoltage?: number; // Volts
    responseTime?: number; // Nanoseconds
    
    // GFCI specific
    gfciSensitivity?: number; // mA (typically 5-30mA)
    testButton?: boolean;
    
    // AFCI specific
    afciSensitivity?: number; // mA
    arcDetectionType?: 'series' | 'parallel' | 'both';
    
    // SPD specific
    spdType?: 'type1' | 'type2' | 'type3';
    maxDischargeCurrent?: number; // kA
    
    // Isolation transformer specific
    isolationVoltage?: number; // Volts
    isolationResistance?: number; // Ohms
    
    // Emergency stop specific
    estopType?: 'normally-open' | 'normally-closed';
    resetType?: 'manual' | 'automatic';
    
    // Overvoltage/Undervoltage protector specific
    tripVoltage?: number; // Volts
    resetVoltage?: number; // Volts
    hysteresis?: number; // Volts

    // Lightning protection
    conductorMaterial?: 'copper' | 'aluminum' | 'galvanized';
    protectionRadius?: number; // meters
    rodHeight?: number; // meters
    groundingResistance?: number; // ohms
  };
}

export interface Circuit {
  id: string;
  name: string;
  components: Component[];
  connections: Connection[];
  metadata: {
    voltage: number;
    frequency?: number;
    phase?: 'single' | 'three';
    description?: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface CircuitAnalysis {
  voltages: { [componentId: string]: number };
  currents: { [componentId: string]: number };
  power: { [componentId: string]: number };
  totalPower: number;
  efficiency: number;
  issues: CircuitIssue[];
}

export interface CircuitIssue {
  id: string;
  type: 'warning' | 'error' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  componentId?: string;
  message: string;
  recommendation: string;
}

export interface SafetyAssessment {
  safetyScore: number; // 0-100
  hazards: SafetyHazard[];
  compliance: ComplianceCheck[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface SafetyHazard {
  id: string;
  type: 'overcurrent' | 'overvoltage' | 'short_circuit' | 'ground_fault' | 'arc_flash' | 'thermal';
  severity: 'low' | 'medium' | 'high' | 'critical';
  componentId?: string;
  description: string;
  mitigation: string;
}

export interface ComplianceCheck {
  standard: string; // NEC, OSHA, NFPA, etc.
  status: 'compliant' | 'non_compliant' | 'warning';
  description: string;
  requirement: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  circuitContext?: Circuit;
  analysisContext?: CircuitAnalysis;
  safetyContext?: SafetyAssessment;
}

export interface AgentResponse {
  message: string;
  suggestions: string[];
  actions: string[];
  confidence: number;
  circuitUpdates?: Partial<Circuit>;
}
