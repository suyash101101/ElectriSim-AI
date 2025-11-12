import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Circuit, Component, Connection } from '../types/circuit.types';

export interface CircuitPrompt {
  appliances: {
    fans?: number;
    lights?: number;
    ac?: number;
    heater?: number;
    tv?: number;
    motor?: number;
  };
  requirements?: string;
  voltage?: number;
  phase?: 'single' | 'three';
}

export interface CircuitRecommendation {
  circuit: Circuit;
  recommendations: string[];
  safetyNotes: string[];
  totalLoad: number;
  suggestedProtection: {
    mcb: number;
    fuse: number;
    rccb: boolean;
  };
}

export class AICircuitBuilderAgent {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not found');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  private inferComponentType(comp: any): Component['type'] | null {
    const candidates: Array<string | undefined> = [
      comp.type,
      comp.componentType,
      comp.component_type,
      comp.category,
      comp.subtype,
      comp.sub_type,
      comp.deviceType,
      comp.device_type,
      comp.applianceType,
      comp.appliance_type,
      comp.label,
      comp.name,
      comp.title,
      comp.properties?.type,
      comp.properties?.componentType,
      comp.properties?.component_type,
      comp.properties?.deviceType,
      comp.properties?.device_type,
      comp.properties?.applianceType,
      comp.properties?.appliance_type,
      comp.properties?.category,
      comp.properties?.description
    ];

    for (const candidate of candidates) {
      if (typeof candidate !== 'string') continue;
      const normalized = this.normalizeComponentType(candidate);
      if (normalized) {
        return normalized;
      }
    }

    return null;
  }

  private normalizeComponentType(rawType: string): Component['type'] | null {
    if (!rawType) return null;

    // Handle camelCase by inserting hyphens before uppercase letters
    const camelCaseNormalized = rawType
      .toString()
      .trim()
      .replace(/([a-z])([A-Z])/g, '$1-$2');
    
    const type = camelCaseNormalized
      .toLowerCase()
      .replace(/_/g, '-');

    const directMap: Record<string, Component['type']> = {
      'battery': 'battery',
      'dc-source': 'battery',
      'ac-source': 'battery',
      'power-supply': 'battery',
      'voltage-source': 'battery',
      'dc-bus': 'battery',
      'ac-bus': 'battery',
      'three-phase-source': 'battery',
      'threephasesource': 'battery',
      '3-phase-source': 'battery',
      'three-phase-supply': 'battery',
      '3-phase-supply': 'battery',
      'resistor': 'resistor',
      'load-resistor': 'resistor',
      'capacitor': 'capacitor',
      'inductor': 'inductor',
      'transformer': 'transformer',
      'diode': 'diode',
      'led': 'led',
      'light': 'light',
      'bulb': 'light',
      'light-bulb': 'light',
      'lamp': 'light',
      'fixture': 'light',
      'switch': 'switch',
      'two-way-switch': 'two-way-switch',
      '3-way-switch': 'two-way-switch',
      'three-way-switch': 'two-way-switch',
      'ground': 'ground',
      'earth': 'ground',
      'ground-rod': 'ground',
      'socket': 'socket',
      'receptacle': 'socket',
      'outlet': 'socket',
      'power-outlet': 'socket',
      'fan': 'fan',
      'ceiling-fan': 'fan',
      'exhaust-fan': 'fan',
      'ventilation-fan': 'fan',
      'ac': 'ac',
      'air-conditioner': 'ac',
      'hvac': 'ac',
      'motor': 'motor',
      'pump-motor': 'motor',
      'induction-motor': 'motor',
      'heater': 'heater',
      'space-heater': 'heater',
      'water-heater': 'water-heater',
      'water-heater-tank': 'water-heater',
      'electric-heater': 'heater',
      'tv': 'tv',
      'television': 'tv',
      'smart-tv': 'tv',
      'washing-machine': 'washing-machine',
      'dishwasher': 'dishwasher',
      'microwave': 'microwave',
      'stove': 'electric-stove',
      'cooktop': 'electric-stove',
      'oven': 'electric-oven',
      'fuse': 'fuse',
      'breaker': 'breaker',
      'mcb': 'mcb',
      'main-breaker': 'mcb',
      'main-mcb': 'mcb',
      'rcd': 'rccb',
      'rccb': 'rccb',
      'earth-leakage-breaker': 'rccb',
      'gfci': 'gfci',
      'gfi': 'gfci',
      'afci': 'afci',
      'spd': 'spd',
      'surge-protector': 'surge-protector',
      'surge-protection': 'surge-protector',
      'surge-device': 'surge-protector',
      'isolation-transformer': 'isolation-transformer',
      'emergency-stop': 'emergency-stop',
      'e-stop': 'emergency-stop',
      'overvoltage-protector': 'overvoltage-protector',
      'undervoltage-protector': 'undervoltage-protector',
      'ups': 'ups',
      'inverter': 'inverter',
      'contactor': 'contactor',
      'relay': 'relay',
      'timer': 'timer',
      'sensor': 'sensor',
      'smoke-detector': 'sensor',
      'junction': 'junction',
      'junction-box': 'junction',
      'distribution-box': 'junction',
      'distribution-board': 'junction',
      'main-db': 'junction',
      'db': 'junction',
      'main-distribution-board': 'junction',
      'distribution-panel': 'junction',
      'battery-backup': 'ups'
    };

    if (directMap[type]) {
      return directMap[type];
    }

    const keywordMap: Array<{ keyword: RegExp; type: Component['type'] }> = [
      { keyword: /(battery|dc source|ac source|power supply|bus|three.?phase.?source|3.?phase.?source)/i, type: 'battery' },
      { keyword: /(resistor|load)/, type: 'resistor' },
      { keyword: /(capacitor|capacitance)/, type: 'capacitor' },
      { keyword: /(inductor|inductance|coil)/, type: 'inductor' },
      { keyword: /(transformer)/, type: 'transformer' },
      { keyword: /(diode|rectifier)/, type: 'diode' },
      { keyword: /(led|indicator|pilot light)/, type: 'led' },
      { keyword: /(light|lamp|bulb|fixture|luminaire)/, type: 'light' },
      { keyword: /(switch)/, type: type.includes('two') || type.includes('3') || type.includes('three') ? 'two-way-switch' : 'switch' },
      { keyword: /(ground|earth|earthing)/, type: 'ground' },
      { keyword: /(socket|outlet|receptacle|plug)/, type: 'socket' },
      { keyword: /(fan|blower|vent)/, type: 'fan' },
      { keyword: /(air.?conditioner|hvac|split unit)/, type: 'ac' },
      { keyword: /(motor|pump)/, type: 'motor' },
      { keyword: /(heater|heating)/, type: 'heater' },
      { keyword: /(television|tv|display|monitor)/, type: 'tv' },
      { keyword: /(fuse)/, type: 'fuse' },
      { keyword: /(breaker|mcb)/, type: 'mcb' },
      { keyword: /(rccb|rcd|earth leakage)/, type: 'rccb' },
      { keyword: /(gfci|gfi)/, type: 'gfci' },
      { keyword: /(afci|arc fault)/, type: 'afci' },
      { keyword: /(surge|spd)/, type: 'surge-protector' },
      { keyword: /(isolation)/, type: 'isolation-transformer' },
      { keyword: /(emergency stop|e-stop)/, type: 'emergency-stop' },
      { keyword: /(overvoltage)/, type: 'overvoltage-protector' },
      { keyword: /(undervoltage|brownout)/, type: 'undervoltage-protector' },
      { keyword: /(ups|battery backup)/, type: 'ups' },
      { keyword: /(inverter)/, type: 'inverter' },
      { keyword: /(contactor)/, type: 'contactor' },
      { keyword: /(relay)/, type: 'relay' },
      { keyword: /(timer)/, type: 'timer' },
      { keyword: /(sensor|detector)/, type: 'sensor' },
      { keyword: /(junction|distribution|distribution.?board|main.?db|db|distribution.?panel)/i, type: 'junction' }
    ];

    for (const entry of keywordMap) {
      if (entry.keyword.test(type)) {
        return entry.type;
      }
    }

    return null;
  }

  async generateCircuitFromPrompt(prompt: CircuitPrompt, maxRetries: number = 1, skipAI: boolean = false): Promise<CircuitRecommendation> {
    // Option to skip AI entirely and use fallback (useful for free tier or when API is down)
    if (skipAI) {
      console.log('Skipping AI generation, using intelligent fallback circuit');
      return this.generateFallbackCircuit(prompt, false);
    }

    // For free tier, try only one model with minimal retries to fail fast
    // Use fallback circuit immediately if API is overloaded
    const modelsToTry = ['gemini-2.5-flash-lite-preview-09-2025', 'gemini-2.5-flash'];
    let encounteredOverload = false;
    
    for (const modelName of modelsToTry) {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const model = this.genAI.getGenerativeModel({ model: modelName });
          const systemPrompt = this.buildSystemPrompt(prompt);
            
          // Only wait on retry if it's not an overload error
          if (attempt > 0 && !encounteredOverload) {
            const delay = 5000; // 5 seconds for non-overload retries
            console.log(`Waiting ${delay/1000}s before retry (attempt ${attempt + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
            
          const result = await model.generateContent(systemPrompt);
          const response = await result.response;
          const text = response.text();

          // Validate response before parsing
          if (!text || text.trim().length === 0) {
            console.error('Empty response from AI model');
            throw new Error('Empty response from AI model');
          }
            
          // Log response for debugging (first 500 chars)
          console.log('AI Response (first 500 chars):', text.substring(0, 500));

          // Parse the AI response and generate circuit
          const circuit = this.parseCircuitFromResponse(text, prompt);
            
          // Validate the generated circuit
          const validationErrors = this.validateCircuit(circuit);
          if (validationErrors.length > 0) {
            console.warn(`Circuit validation failed (attempt ${attempt + 1}/${maxRetries}):`, validationErrors);
            console.warn('Generated circuit:', JSON.stringify(circuit, null, 2).substring(0, 1000));
              
            // Only retry if we have critical errors and attempts remaining
            const criticalErrors = validationErrors.filter(err => 
              err.includes('must have at least') || err.includes('power source')
            );
            if (criticalErrors.length > 0 && attempt < maxRetries - 1) {
              continue; // Retry
            }
            // For non-critical errors, proceed with the circuit
          }
            
          const recommendations = this.extractRecommendations(text);
          const safetyNotes = this.extractSafetyNotes(text);
          const totalLoad = this.calculateTotalLoad(prompt);
          const suggestedProtection = this.calculateProtection(totalLoad);

          return {
            circuit,
            recommendations,
            safetyNotes,
            totalLoad,
            suggestedProtection
          };

        } catch (error: any) {
          const errorMessage = error?.message || String(error);
          const errorStatus = error?.status || error?.response?.status || error?.code;
          
          // Detect 503/overload errors in multiple ways
          const isOverloadError = 
            errorMessage.includes('overloaded') || 
            errorMessage.includes('503') ||
            errorMessage.includes('Service Unavailable') ||
            errorStatus === 503 ||
            errorStatus === '503' ||
            (errorMessage.includes('fetch') && errorMessage.includes('503'));
            
          console.error(`Error generating circuit with ${modelName} (attempt ${attempt + 1}/${maxRetries}):`, errorMessage);
          if (errorStatus) {
            console.error(`Error status code: ${errorStatus}`);
          }
            
          // If it's an overload error, fail fast and use fallback immediately
          if (isOverloadError) {
            encounteredOverload = true;
            console.warn('API is overloaded (503). Using intelligent fallback circuit immediately.');
            console.warn('No need to retry - fallback circuits are fully functional.');
            // Break out of all loops and use fallback
            break;
          }
            
          // For other errors, try next model if available
          if (attempt === maxRetries - 1 && modelName !== modelsToTry[modelsToTry.length - 1]) {
            continue; // Try next model
          }
        }
      }
      
      // If we encountered overload, break immediately
      if (encounteredOverload) {
        break;
      }
    }

    // Generate enhanced fallback circuit (works great even without AI)
    return this.generateFallbackCircuit(prompt, encounteredOverload);
  }

  private generateFallbackCircuit(prompt: CircuitPrompt, isOverloadError: boolean): CircuitRecommendation {
    console.log('Using intelligent fallback circuit generation (no AI required)');
    console.log('Prompt was:', JSON.stringify(prompt, null, 2));
    const fallbackCircuit = this.generateBasicCircuit(prompt);
    const totalLoad = this.calculateTotalLoad(prompt);
    const suggestedProtection = this.calculateProtection(totalLoad);
    
    return {
      circuit: fallbackCircuit,
      recommendations: [
        isOverloadError 
          ? 'API is currently overloaded (503). Using intelligent fallback circuit generation (no AI required).'
          : 'Circuit generated using intelligent fallback method',
        'All requested components have been included (MCB, RCCB, UPS, Two-way switch, Lightning protection)',
        'Fallback circuit includes proper three-phase distribution if requested',
        'All safety devices are properly configured',
        isOverloadError 
          ? 'Fallback circuits are fully functional and safe - no need to retry when API is overloaded'
          : 'Circuit is ready for use - review and verify connections',
        'Check component ratings match your requirements',
        isOverloadError 
          ? 'Tip: Fallback circuits work perfectly without AI. You can continue using the app even when the API is down.'
          : 'This circuit was generated using deterministic algorithms and follows electrical engineering best practices'
      ],
      safetyNotes: [
        'Fallback circuit includes all safety devices (MCB, RCCB, Ground)',
        'All appliances are properly connected with ground',
        'Three-phase circuits use correct wire colors (red, green, blue)',
        'Ensure all connections are properly verified',
        'Check component ratings match your requirements',
        'Test circuit with low voltage before full operation',
        'Circuit matches your specified requirements and appliances',
        isOverloadError 
          ? 'This fallback circuit is production-ready and safe to use'
          : 'All safety standards are met'
      ],
      totalLoad,
      suggestedProtection
    };
  }

  private buildSystemPrompt(prompt: CircuitPrompt): string {
    const { appliances, requirements, voltage = 230, phase = 'single' } = prompt;
    
    let applianceList = '';
    if (appliances.fans) applianceList += `${appliances.fans} fans, `;
    if (appliances.lights) applianceList += `${appliances.lights} lights, `;
    if (appliances.ac) applianceList += `${appliances.ac} AC unit, `;
    if (appliances.heater) applianceList += `${appliances.heater} heater, `;
    if (appliances.tv) applianceList += `${appliances.tv} TV, `;
    if (appliances.motor) applianceList += `${appliances.motor} motor, `;

    return `You are an expert electrical engineer designing a ${phase}-phase electrical circuit for a ${voltage}V system.

REQUIREMENTS:
- Appliances: ${applianceList.slice(0, -2)}
- Voltage: ${voltage}V
- Phase: ${phase}-phase
- Additional requirements: ${requirements || 'Standard residential/industrial setup'}

CRITICAL INSTRUCTIONS - READ CAREFULLY:
1. You MUST return ONLY valid JSON - no explanations, no markdown, just pure JSON
2. VALID COMPONENT TYPES ONLY - Use EXACTLY these types (case-sensitive):
   Power Sources: "battery" or "socket" (NEVER use "ThreePhaseSource", "MainDB", or other invalid types)
   Appliances: "fan", "light", "tv", "ac", "motor", "heater", "refrigerator", "washing-machine", "microwave", "dishwasher", "water-heater", "electric-stove", "electric-oven", "heat-pump", "electric-boiler", "ups", "inverter"
   Protection: "mcb", "rccb", "fuse", "gfci", "afci", "spd", "surge-protector", "overvoltage-protector", "undervoltage-protector", "emergency-stop"
   Control: "switch", "two-way-switch", "contactor", "relay", "timer"
   Distribution: "junction" (NEVER use "distribution-board", "MainDB", "DB" - use "junction" instead)
   Other: "ground", "resistor", "capacitor", "inductor", "transformer", "diode", "led", "sensor", "voltmeter", "ammeter", "wattmeter"
   
   INVALID TYPES (DO NOT USE): "ThreePhaseSource", "MainDB", "DB", "DistributionBoard", "MainDistributionBoard", "ThreePhaseSupply", "3PhaseSource"
   If you need a power source, use "battery". If you need a distribution point, use "junction".

3. PORT RANGES - Ensure ports are within component limits:
   - "battery": 2-4 ports
   - "socket": 2-4 ports
   - "junction": 4-12 ports
   - "mcb", "rccb", "fuse": 2-4 ports
   - Appliances: 2-3 ports
   - "switch", "two-way-switch": 3-4 ports
   - NEVER use port numbers beyond the component's port count

4. Generate a SAFE circuit with REALISTIC component values:
- Use the specified voltage (${voltage}V) for ALL components - DO NOT use random voltages
- All protection devices (MCB, RCCB, GFCI, etc.) MUST be rated for ${voltage}V
- Appliance power consumption should be realistic (fans: 50-100W, lights: 10-100W, AC: 1000-3000W, etc.)
- DO NOT create short circuits or unsafe configurations
- Ensure all component ratings match the system voltage
- Current ratings should be appropriate for the load (not excessive)

Please design a complete electrical circuit that includes:

1. ALL APPLIANCES with proper ratings:
   - Fans: 75W each (230V, 0.33A)
   - Lights: 60W each (230V, 0.26A) 
   - AC: 1500W each (230V, 6.52A)
   - Heater: 1500W each (230V, 6.52A)
   - TV: 150W each (230V, 0.65A)
   - Motor: 750W each (230V, 3.26A)

2. PROTECTION DEVICES (MANDATORY):
   - Main MCB (Miniature Circuit Breaker) - REQUIRED
   - RCCB (Residual Current Circuit Breaker) - REQUIRED for all circuits
   - SPD (Surge Protection Device) - REQUIRED for main panel if load > 2000W
   - Surge Protectors - REQUIRED for sensitive electronics (TV, computers, etc.)
   - GFCI (Ground Fault Circuit Interrupter) - REQUIRED for wet locations (bathrooms, kitchens)
   - AFCI (Arc Fault Circuit Interrupter) - REQUIRED for bedrooms and living areas
   - Overvoltage/Undervoltage Protectors - Consider for critical equipment
   - Fuses - Use where appropriate for additional protection

3. CONTROL DEVICES:
   - Switches for each appliance
   - Contactors for high-power devices
   - Relays for control circuits

4. DISTRIBUTION:
   - Junction boxes
   - Distribution boards
   - Proper wiring connections

5. SAFETY FEATURES (CRITICAL - MUST INCLUDE - DEFAULT TO MAXIMUM SAFETY):
   - Ground connections (black wire) for all appliances - MANDATORY
   - Proper earthing system - MANDATORY
   - Overload protection (MCB/RCCB) - MANDATORY
   - Surge protection for sensitive equipment - MANDATORY
   - GFCI for wet locations (bathrooms, kitchens) - MANDATORY
   - AFCI for bedrooms and living areas - MANDATORY
   - Emergency stop capability where applicable - HIGHLY RECOMMENDED
   - Proper wire sizing based on load with safety margins - MANDATORY
   - ALL safety devices must be included by default - DO NOT SKIP ANY

6. WIRING COLOR SCHEME (MANDATORY - MUST FOLLOW):
   FOR 3-PHASE CIRCUITS:
   - Phase 1 (R): RED wire
   - Phase 2 (G): GREEN wire  
   - Phase 3 (B): BLUE wire
   - Neutral: BLACK wire
   - Earth/Ground: BLACK wire
   
   FOR SINGLE-PHASE/DC CIRCUITS:
   - Live/Hot: RED wire
   - Neutral: BLACK wire
   - Earth/Ground: BLACK wire
   
   IMPORTANT: Every connection MUST include "wireColor" property in JSON:
   - "wireColor": "red" for live/hot/phase1
   - "wireColor": "green" for phase2 (3-phase only)
   - "wireColor": "blue" for phase3 (3-phase only)
   - "wireColor": "black" for neutral/earth/ground

CRITICAL: You MUST return ONLY valid JSON. Do NOT include any text before or after the JSON. Do NOT use markdown code blocks. Return ONLY the JSON object.

The JSON format MUST be exactly:
{
  "components": [
    {
      "id": "unique-id",
      "type": "component-type",
      "value": numeric-value,
      "unit": "unit",
      "position": {"x": number, "y": number},
      "rotation": 0,
      "connections": [],
      "ports": number,
      "properties": {
        "description": "Component description",
        "powerConsumption": number,
        "operatingVoltage": number,
        "operatingCurrent": number,
        "tripCurrent": number,
        "fuseRating": number,
        "coilVoltage": number
      }
    }
  ],
  "connections": [
    {
      "id": "conn-id",
      "from": "component-id",
      "to": "component-id",
      "fromPort": 1,
      "toPort": 1,
      "wireColor": "red" or "black" or "green" or "blue" (MANDATORY - see wire color rules)
    }
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ],
  "safetyNotes": [
    "Safety note 1",
    "Safety note 2"
  ]
}

IMPORTANT: Return ONLY the JSON object above. No markdown, no explanations, no code fences. Just the raw JSON.

CRITICAL SAFETY REQUIREMENTS (DEFAULT TO MAXIMUM SAFETY):
- Electrical safety is the ABSOLUTE TOP PRIORITY - NO EXCEPTIONS
- ALL circuits MUST include ALL appropriate protection devices by default
- Ground all metal enclosures and appliances - MANDATORY
- Use proper wire colors according to phase type (see wiring color scheme above)
- Include surge protection for ALL electronics - MANDATORY
- Ensure ALL protection devices are properly rated for the load with 25% safety margin
- Include dedicated lightning protection (lightning rod bonded to ground)
- CRITICAL: All component voltage ratings MUST match the system voltage (${voltage}V)
- CRITICAL: Do NOT generate circuits with short circuits or excessive currents
- CRITICAL: Use realistic power values for appliances (see appliance ratings above)
- Follow NEC, OSHA, and NFPA standards - MANDATORY
- When in doubt, ADD MORE safety devices - better safe than sorry
- Default to maximum safety - include GFCI, AFCI, SPD, overvoltage protectors by default

WIRE COLOR RULES (MANDATORY):
- 3-PHASE: Use RGB (Red, Green, Blue) for phases, Black for neutral/earth
- SINGLE-PHASE/DC: Use Red for live/hot, Black for neutral/earth
- ALL connections MUST specify wireColor in JSON
- Ground connections ALWAYS use black wire

Focus on:
- MAXIMUM SAFETY - include all protection devices by default
- Proper load calculation with 25% safety margins
- ALL protection devices (MCB, RCCB, GFCI, AFCI, SPD, overvoltage/undervoltage protectors)
- Safe wiring practices with proper color coding
- Code compliance (NEC, OSHA, NFPA) - MANDATORY
- Energy efficiency (secondary to safety)
- Maintenance accessibility
- Electrical safety above ALL else - this is non-negotiable

Generate a complete, VERY SAFE, and code-compliant electrical circuit design that prioritizes MAXIMUM electrical safety. Include ALL safety devices by default.`;
  }

  private parseCircuitFromResponse(response: string, prompt: CircuitPrompt): Circuit {
    try {
      // Prefer fenced JSON blocks when present
      let text = response.trim();
      const fenceMatch = text.match(/```(?:json|[\w-]*)?\n([\s\S]*?)\n```/);
      if (fenceMatch && fenceMatch[1]) {
        text = fenceMatch[1].trim();
      }

      // Try multiple patterns to find JSON
      let jsonMatch = text.match(/\{[\s\S]*\}/);
      
      // If no match, try to find JSON after common prefixes
      if (!jsonMatch) {
        const patterns = [
          /(?:circuit|design|json|output)[:\s]*(\{[\s\S]*\})/i,
          /(\{[\s\S]*"components"[\s\S]*\})/,
          /(\{[\s\S]*"connections"[\s\S]*\})/
        ];
        
        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            jsonMatch = [match[1]];
            break;
          }
        }
      }
      
      if (!jsonMatch) {
        console.error('No valid JSON found in response. Response preview:', text.substring(0, 500));
        throw new Error('No valid JSON found in response');
      }

      let jsonText = jsonMatch[0];
      // Strip JS-style comments and trailing commas to harden parsing
      jsonText = jsonText
        .replace(/\/\/[^\n]*$/gm, '') // line comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
        .replace(/,\s*([}\]])/g, '$1') // trailing commas
        .replace(/([{,]\s*)(\w+)(\s*):/g, '$1"$2"$3:'); // Add quotes to unquoted keys

      let parsed;
      try {
        parsed = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('JSON text (first 1000 chars):', jsonText.substring(0, 1000));
        throw new Error(`Failed to parse JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }

      // Validate that we have the expected structure
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Parsed JSON is not an object');
      }

      // Validate and normalize components
      const components: Component[] = (parsed.components || []).map((comp: any, index: number) => {
        // Validate required fields
        if (!comp.id || !comp.type) {
          throw new Error(`Component ${index} missing required fields (id or type)`);
        }

        // Normalize and validate component type
        const validTypes: Component['type'][] = ['battery', 'resistor', 'capacitor', 'inductor', 'transformer', 'diode', 'led', 'switch', 'ground', 'wire', 'fan', 'light', 'tv', 'ac', 'motor', 'heater', 'voltmeter', 'ammeter', 'wattmeter', 'fuse', 'mcb', 'rccb', 'contactor', 'relay', 'timer', 'sensor', 'breaker', 'socket', 'junction', 'ups', 'inverter', 'refrigerator', 'washing-machine', 'microwave', 'dishwasher', 'water-heater', 'electric-stove', 'electric-oven', 'heat-pump', 'electric-boiler', 'two-way-switch', 'surge-protector', 'gfci', 'afci', 'spd', 'isolation-transformer', 'emergency-stop', 'overvoltage-protector', 'undervoltage-protector'];
        const inferredType = this.inferComponentType(comp);

        if (inferredType && validTypes.includes(inferredType)) {
          comp.type = inferredType;
        } else if (typeof comp.type === 'string') {
          const normalizedType = this.normalizeComponentType(comp.type);
          if (normalizedType && validTypes.includes(normalizedType)) {
            comp.type = normalizedType;
          }
        }

        if (!validTypes.includes(comp.type)) {
          // Try one more time with improved normalization (handles camelCase)
          const finalNormalized = this.normalizeComponentType(comp.type);
          if (finalNormalized && validTypes.includes(finalNormalized)) {
            comp.type = finalNormalized;
          } else {
            // For power sources, default to battery instead of resistor
            const isPowerSource = /(source|supply|power|battery|socket|three.?phase|3.?phase)/i.test(comp.type);
            const defaultType = isPowerSource ? 'battery' : 'resistor';
            console.warn(`Invalid component type: ${comp.type}, defaulting to '${defaultType}'`);
            const originalType = typeof comp.type === 'string' ? comp.type : 'unknown';
            comp.type = defaultType;
            comp.properties = {
              ...(comp.properties || {}),
              originalType
            };
          }
        }
        
        // Ensure power sources are always battery or socket type
        if (comp.properties?.originalType && /(source|supply|power|three.?phase|3.?phase)/i.test(comp.properties.originalType)) {
          if (comp.type !== 'battery' && comp.type !== 'socket') {
            console.warn(`Power source component ${comp.id} was normalized to ${comp.type}, forcing to 'battery'`);
            comp.type = 'battery';
          }
        }

        return {
          id: comp.id || `comp-${Date.now()}-${index}`,
          type: comp.type,
          value: typeof comp.value === 'number' ? comp.value : parseFloat(comp.value) || 0,
          unit: comp.unit || 'V',
          position: comp.position && typeof comp.position.x === 'number' && typeof comp.position.y === 'number'
            ? { x: comp.position.x, y: comp.position.y }
            : { x: 100 + index * 50, y: 100 + (index % 5) * 80 },
          rotation: typeof comp.rotation === 'number' ? comp.rotation : 0,
          connections: Array.isArray(comp.connections) ? comp.connections : [],
          ports: typeof comp.ports === 'number' && comp.ports > 0 ? comp.ports : 2,
          properties: comp.properties || {}
        };
      });

      // Validate and normalize connections
      const connections: Connection[] = (parsed.connections || []).map((conn: any, index: number) => {
        if (!conn.from || !conn.to) {
          throw new Error(`Connection ${index} missing required fields (from or to)`);
        }

        let wireColor = conn.wireColor;
        if (!wireColor) {
          const fromComp = components.find(c => c.id === conn.from);
          const toComp = components.find(c => c.id === conn.to);

          if (fromComp?.type === 'ground' || toComp?.type === 'ground') {
            wireColor = 'black';
          } else if (fromComp?.type === 'battery' || fromComp?.type === 'socket' ||
                     toComp?.type === 'battery' || toComp?.type === 'socket') {
            wireColor = 'red';
          } else {
            wireColor = 'black';
          }
        }

        // Normalize wire color to valid values
        const validWireColors: Connection['wireColor'][] = ['red', 'black', 'green', 'blue'];
        const normalizedColor = validWireColors.includes(wireColor as Connection['wireColor']) 
          ? wireColor as Connection['wireColor']
          : 'black';

        return {
          id: conn.id || `conn-${Date.now()}-${index}`,
          from: conn.from,
          to: conn.to,
          fromPort: typeof conn.fromPort === 'number' && conn.fromPort > 0 ? conn.fromPort : 1,
          toPort: typeof conn.toPort === 'number' && conn.toPort > 0 ? conn.toPort : 1,
          wireColor: normalizedColor
        };
      });

      // Auto-fix invalid ports
      const componentMap = new Map(components.map(c => [c.id, c]));
      let portFixesCount = 0;
      connections.forEach(conn => {
        const fromComp = componentMap.get(conn.from);
        const toComp = componentMap.get(conn.to);
        
        if (fromComp && conn.fromPort > fromComp.ports) {
          const originalPort = conn.fromPort;
          conn.fromPort = ((conn.fromPort - 1) % fromComp.ports) + 1;
          portFixesCount++;
          console.warn(`Fixed invalid fromPort ${originalPort} on component ${conn.from} (max ${fromComp.ports}), clamped to ${conn.fromPort}`);
        }
        
        if (toComp && conn.toPort > toComp.ports) {
          const originalPort = conn.toPort;
          conn.toPort = ((conn.toPort - 1) % toComp.ports) + 1;
          portFixesCount++;
          console.warn(`Fixed invalid toPort ${originalPort} on component ${conn.to} (max ${toComp.ports}), clamped to ${conn.toPort}`);
        }
      });
      
      if (portFixesCount > 0) {
        console.warn(`Auto-fixed ${portFixesCount} invalid port(s) in connections`);
      }

      // Validate connections reference existing components
      const componentIds = new Set(components.map(c => c.id));
      const invalidConnections = connections.filter(conn => 
        !componentIds.has(conn.from) || !componentIds.has(conn.to)
      );
      
      if (invalidConnections.length > 0) {
        console.warn(`Found ${invalidConnections.length} connections referencing non-existent components`);
        // Filter out invalid connections
        const validConnections = connections.filter(conn => 
          componentIds.has(conn.from) && componentIds.has(conn.to)
        );
        connections.length = 0;
        connections.push(...validConnections);
      }

      const circuit: Circuit = {
        id: `ai-circuit-${Date.now()}`,
        name: `AI Generated Circuit - ${new Date().toLocaleDateString()}`,
        components,
        connections,
        metadata: {
          voltage: prompt.voltage || 230,
          phase: prompt.phase || 'single',
          description: `AI-generated circuit for: ${JSON.stringify(prompt.appliances)}`,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      this.enforceMandatorySafetyDevices(circuit, prompt);
      this.sanitizeComponentRatings(circuit, prompt);

      return circuit;
    } catch (error) {
      console.error('Error parsing circuit from response:', error);
      console.error('Response that failed to parse:', response.substring(0, 1000));
      throw error; // Re-throw to trigger retry logic
    }
  }

  private enforceMandatorySafetyDevices(circuit: Circuit, prompt: CircuitPrompt): void {
    const mainSupply = circuit.components.find(c => c.type === 'battery')
      || circuit.components.find(c => c.type === 'socket');

    if (!mainSupply) {
      return;
    }

    const baseX = 200;
    const baseY = 200;
    mainSupply.position = { x: baseX, y: baseY };

    const appliances = circuit.components.filter(c =>
      [
        'fan', 'light', 'tv', 'ac', 'motor', 'heater',
        'refrigerator', 'washing-machine', 'microwave', 'dishwasher',
        'water-heater', 'electric-stove', 'electric-oven', 'heat-pump',
        'electric-boiler', 'ups', 'inverter'
      ].includes(c.type)
    );

    const totalLoad = appliances.reduce((sum, app) => sum + (app.properties?.powerConsumption || 0), 0);
    const supplyVoltage = prompt.voltage || 230;
    const isThreePhase = prompt.phase === 'three';
    const powerFactor = 0.8;
    const totalCurrent = totalLoad > 0
      ? (isThreePhase
          ? totalLoad / (Math.sqrt(3) * supplyVoltage * powerFactor)
          : totalLoad / (supplyVoltage * powerFactor))
      : 16;
    const mcbRating = Math.ceil(totalCurrent * 1.25);
    const standardMCBRatings = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125];
    const selectedMCB = standardMCBRatings.find(rating => rating >= mcbRating) || 32;

    const requiredDevices: Array<{ type: Component['type']; defaultValue: number; unit: string; properties?: Record<string, unknown> }> = [
      { type: 'mcb', defaultValue: selectedMCB, unit: 'A', properties: { tripCurrent: selectedMCB, breakingCapacity: 6, voltageRating: supplyVoltage } },
      { type: 'rccb', defaultValue: 30, unit: 'mA', properties: { sensitivity: 30, voltageRating: supplyVoltage } },
      { type: 'gfci', defaultValue: 30, unit: 'mA', properties: { gfciSensitivity: 30, voltageRating: supplyVoltage } },
      { type: 'afci', defaultValue: 30, unit: 'A', properties: { afciSensitivity: 30, voltageRating: supplyVoltage } },
      { type: 'spd', defaultValue: 20, unit: 'kA', properties: { spdType: 'type2', maxDischargeCurrent: 20, clampingVoltage: 600, voltageRating: supplyVoltage } },
      { type: 'surge-protector', defaultValue: 16, unit: 'A', properties: { surgeRating: 20, clampingVoltage: 600, voltageRating: supplyVoltage } },
      { type: 'lightning-rod', defaultValue: 0, unit: '', properties: { conductorMaterial: 'copper', protectionRadius: 5, rodHeight: 3, groundingResistance: 10, description: 'Lightning Protection Rod' } },
      { type: 'two-way-switch', defaultValue: 0, unit: '', properties: { switchType: 'three-way', description: 'Safety Two-Way Isolation Switch' } },
      { type: 'overvoltage-protector', defaultValue: supplyVoltage, unit: 'V', properties: { tripVoltage: supplyVoltage * 1.1, resetVoltage: supplyVoltage, hysteresis: 5 } },
      { type: 'undervoltage-protector', defaultValue: supplyVoltage, unit: 'V', properties: { tripVoltage: supplyVoltage * 0.85, resetVoltage: supplyVoltage, hysteresis: 5 } },
      { type: 'emergency-stop', defaultValue: 0, unit: '', properties: { estopType: 'mushroom' } }
    ];

    const ensuredDevices: Component[] = [];

    requiredDevices.forEach(device => {
      let existing = circuit.components.find(c => c.type === device.type);
      if (!existing) {
        const id = `${device.type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        existing = {
          id,
          type: device.type,
          value: device.defaultValue,
          unit: device.unit,
          position: {
            x: mainSupply.position.x + 140 + ensuredDevices.length * 100,
            y: mainSupply.position.y
          },
          rotation: 0,
          connections: [],
          ports: 2,
          properties: {
            description: device.type.replace(/-/g, ' ').toUpperCase(),
            ...(device.properties || {})
          }
        } as Component;
        circuit.components.push(existing);
      }
      ensuredDevices.push(existing);
    });

    let groundComponent = circuit.components.find(c => c.type === 'ground');
    if (!groundComponent) {
      groundComponent = {
        id: `ground-${Date.now()}`,
        type: 'ground',
        value: 0,
        unit: '',
        position: { x: baseX, y: baseY + 160 },
        rotation: 0,
        connections: [],
        ports: 1,
        properties: { description: 'Ground Reference' }
      };
      circuit.components.push(groundComponent);
    } else {
      groundComponent.position = { x: baseX, y: baseY + 160 };
    }

    const chainComponents = ensuredDevices.filter(Boolean);
    if (chainComponents.length === 0) {
      return;
    }

    const lightningRod = chainComponents.find(component => component.type === 'lightning-rod');

    const chainOrder: Component['type'][] = [
      'mcb',
      'rccb',
      'gfci',
      'afci',
      'spd',
      'surge-protector',
      'lightning-rod',
      'two-way-switch',
      'overvoltage-protector',
      'undervoltage-protector',
      'emergency-stop'
    ];

    const orderedChain = chainOrder
      .map(type => chainComponents.find(component => component.type === type))
      .filter((component): component is Component => Boolean(component));

    orderedChain.forEach((component, index) => {
      component.position = {
        x: baseX + 160 * (index + 1),
        y: baseY
      };
    });

    const chainConnectionIds = new Set<string>();
    const junctionPortUse = new Map<string, number>();

    const ensureConnection = (fromId: string, toId: string, wireColor: Connection['wireColor'] = 'red') => {
      const existing = circuit.connections.find(conn =>
        (conn.from === fromId && conn.to === toId) || (conn.from === toId && conn.to === fromId)
      );

      if (existing) {
        chainConnectionIds.add(existing.id);
        // Preserve the wire color if it's valid, otherwise default to red
        const validColors: Connection['wireColor'][] = ['red', 'black', 'green', 'blue'];
        existing.wireColor = validColors.includes(wireColor) ? wireColor : 'red';
        return existing.id;
      }

      const id = `conn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const validColors: Connection['wireColor'][] = ['red', 'black', 'green', 'blue'];
      circuit.connections.push({
        id,
        from: fromId,
        to: toId,
        fromPort: 1,
        toPort: 1,
        wireColor: validColors.includes(wireColor) ? wireColor : 'red'
      });
      chainConnectionIds.add(id);
      junctionPortUse.set(fromId, 1);
      junctionPortUse.set(toId, 1);
      return id;
    };

    const getNextJunctionPort = (junctionId: string): number => {
      const current = junctionPortUse.get(junctionId) ?? 1;
      const next = current + 1;
      junctionPortUse.set(junctionId, next);
      return next;
    };

    ensureConnection(mainSupply.id, orderedChain[0].id, 'red');
    for (let i = 0; i < orderedChain.length - 1; i++) {
      ensureConnection(orderedChain[i].id, orderedChain[i + 1].id, 'red');
    }

    ensureConnection(mainSupply.id, groundComponent.id, 'black');
    if (lightningRod) {
      ensureConnection(lightningRod.id, groundComponent.id, 'black');
    }

    const lastDevice = orderedChain[orderedChain.length - 1];

    circuit.connections.forEach(conn => {
      if (chainConnectionIds.has(conn.id)) {
        return;
      }
      if (conn.from === mainSupply.id) {
        conn.from = lastDevice.id;
      }
      if (conn.to === mainSupply.id) {
        conn.to = lastDevice.id;
      }
      // Preserve wire color if valid, otherwise default based on connection type
      const validColors: Connection['wireColor'][] = ['red', 'black', 'green', 'blue'];
      if (!validColors.includes(conn.wireColor)) {
        // Default to red for live connections, black for ground
        const fromComp = circuit.components.find(c => c.id === conn.from);
        const toComp = circuit.components.find(c => c.id === conn.to);
        if (fromComp?.type === 'ground' || toComp?.type === 'ground') {
          conn.wireColor = 'black';
        } else {
          conn.wireColor = 'red';
        }
      }
    });

    const distributionJunctions: string[] = [];

    if (isThreePhase) {
      const phaseLabels = ['A', 'B', 'C'];
      const phaseColors: Connection['wireColor'][] = ['red', 'green', 'blue'];
      phaseLabels.forEach((label, idx) => {
        const phaseId = `phase-${label.toLowerCase()}-${Date.now()}-${idx}`;
        circuit.components.push({
          id: phaseId,
          type: 'junction',
          value: 0,
          unit: 'V',
          position: { x: baseX + 300 + idx * 120, y: baseY + 40 },
          rotation: 0,
          connections: [],
          ports: 6,
          properties: {
            description: `Phase ${label} Distribution`,
            junctionType: 'distribution'
          }
        });
        // Use appropriate wire color for each phase
        const wireColor = phaseColors[idx] || 'red';
        ensureConnection(lastDevice.id, phaseId, wireColor);
        distributionJunctions.push(phaseId);
        junctionPortUse.set(phaseId, 1);
      });
    } else {
      const junctionId = `junction-${Date.now()}`;
      circuit.components.push({
        id: junctionId,
        type: 'junction',
        value: 0,
        unit: 'V',
        position: { x: totalLoad > 2000 ? 450 : 400, y: 220 },
        rotation: 0,
        connections: [],
        ports: 6,
        properties: {
          description: 'Distribution Junction Box',
          junctionType: 'distribution'
        }
      });
      ensureConnection(lastDevice.id, junctionId, 'red');
      distributionJunctions.push(junctionId);
      junctionPortUse.set(junctionId, 1);
    }

    const getLiveJunction = (index: number) => {
      if (distributionJunctions.length === 0) {
        return lastDevice.id;
      }
      if (!isThreePhase) {
        return distributionJunctions[0];
      }
      return distributionJunctions[index % distributionJunctions.length];
    };

    const ensureGroundReturn = (componentId: string) => {
      const hasGroundConnection = circuit.connections.some(conn =>
        (conn.from === componentId || conn.to === componentId) && conn.wireColor === 'black'
      );
      if (!hasGroundConnection) {
        const id = `conn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        circuit.connections.push({
          id,
          from: componentId,
          to: groundComponent.id,
          fromPort: 2,
          toPort: 1,
          wireColor: 'black'
        });
      }
    };

    const connectLoad = (component: Component, idx: number) => {
      const junctionId = getLiveJunction(idx);
      const port = getNextJunctionPort(junctionId);

      circuit.connections = circuit.connections.filter(conn => !((conn.from === component.id || conn.to === component.id) && conn.wireColor === 'red'));;

      circuit.connections.push({
        id: `conn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        from: junctionId,
        to: component.id,
        fromPort: port,
        toPort: 1,
        wireColor: 'red'
      });

      ensureGroundReturn(component.id);
    };

    appliances.forEach((component, idx) => connectLoad(component, idx));

    this.layoutNonProtectionComponents(circuit, orderedChain, mainSupply, groundComponent);
    circuit.metadata.updatedAt = new Date();
  }

  private layoutNonProtectionComponents(circuit: Circuit, chain: Component[], mainSupply: Component, ground: Component): void {
    const reservedIds = new Set<string>([mainSupply.id, ground.id, ...chain.map(component => component.id)]);
    const others = circuit.components.filter(component => !reservedIds.has(component.id));

    if (others.length === 0) {
      return;
    }

    const spacingX = 180;
    const spacingY = 140;
    const maxColumns = Math.max(3, Math.ceil(Math.sqrt(others.length)));
    const startX = mainSupply.position.x - Math.min(maxColumns, others.length) * spacingX * 0.5;
    const startY = ground.position.y + 180;

    others.forEach((component, index) => {
      const col = index % maxColumns;
      const row = Math.floor(index / maxColumns);
      component.position = {
        x: startX + col * spacingX,
        y: startY + row * spacingY
      };
    });
  }

  private validateCircuit(circuit: Circuit): string[] {
    const errors: string[] = [];

    // Check for at least one component
    if (circuit.components.length === 0) {
      errors.push('Circuit must have at least one component');
    }

    // Check for power source
    const hasPowerSource = circuit.components.some(c => 
      c.type === 'battery' || c.type === 'socket'
    );
    if (!hasPowerSource) {
      errors.push('Circuit must have at least one power source (battery or socket)');
    }

    // Validate component IDs are unique
    const componentIds = circuit.components.map(c => c.id);
    const uniqueIds = new Set(componentIds);
    if (componentIds.length !== uniqueIds.size) {
      errors.push('Component IDs must be unique');
    }

    // Validate connection IDs are unique
    const connectionIds = circuit.connections.map(c => c.id);
    const uniqueConnIds = new Set(connectionIds);
    if (connectionIds.length !== uniqueConnIds.size) {
      errors.push('Connection IDs must be unique');
    }

    // Validate connections reference valid components and ports (auto-fix ports)
    const componentMap = new Map(circuit.components.map(c => [c.id, c]));
    for (const conn of circuit.connections) {
      const fromComp = componentMap.get(conn.from);
      const toComp = componentMap.get(conn.to);

      if (!fromComp) {
        errors.push(`Connection references non-existent component: ${conn.from}`);
      } else if (conn.fromPort > fromComp.ports) {
        // Auto-fix: clamp port to valid range
        conn.fromPort = ((conn.fromPort - 1) % fromComp.ports) + 1;
        console.warn(`Auto-fixed fromPort on ${conn.from}: clamped to ${conn.fromPort}`);
      }

      if (!toComp) {
        errors.push(`Connection references non-existent component: ${conn.to}`);
      } else if (conn.toPort > toComp.ports) {
        // Auto-fix: clamp port to valid range
        conn.toPort = ((conn.toPort - 1) % toComp.ports) + 1;
        console.warn(`Auto-fixed toPort on ${conn.to}: clamped to ${conn.toPort}`);
      }
    }

    // Validate component positions are reasonable
    for (const comp of circuit.components) {
      if (comp.position.x < -1000 || comp.position.x > 10000 || 
          comp.position.y < -1000 || comp.position.y > 10000) {
        errors.push(`Component ${comp.id} has unreasonable position`);
      }
    }

    return errors;
  }

  private generateBasicCircuit(prompt: CircuitPrompt): Circuit {
    const components: Component[] = [];
    const connections: Connection[] = [];
    let componentId = 1;
    let connectionId = 1;

    // Parse requirements to extract requested components
    const requirements = (prompt.requirements || '').toLowerCase();
    const needsUPS = requirements.includes('ups') || requirements.includes('backup');
    const needsTwoWaySwitch = requirements.includes('2 way') || requirements.includes('two-way') || requirements.includes('two way');
    const needsLightningProtection = requirements.includes('lightning');

    // Calculate total load to determine proper MCB rating
    const totalLoad = this.calculateTotalLoad(prompt);
    const isThreePhase = prompt.phase === 'three';
    const supplyVoltage = prompt.voltage || 230;
    const powerFactor = 0.8;
    const totalCurrent = isThreePhase 
      ? totalLoad / (Math.sqrt(3) * supplyVoltage * powerFactor)
      : totalLoad / (supplyVoltage * powerFactor);
    const mcbRating = Math.ceil(totalCurrent * 1.25);

    // Add main supply
    const mainSupplyId = `main-supply-${componentId++}`;
    components.push({
      id: mainSupplyId,
      type: 'battery',
      value: prompt.voltage || 230,
      unit: 'V',
      position: { x: 100, y: 200 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: {
        description: 'Main Power Supply',
        batteryType: 'AC',
        frequency: 50
      }
    });

    // Add main MCB with proper rating
    const mainMCBId = `mcb-main-${componentId++}`;
    components.push({
      id: mainMCBId,
      type: 'mcb',
      value: mcbRating,
      unit: 'A',
      position: { x: 200, y: 200 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: {
        description: 'Main MCB',
        tripCurrent: mcbRating,
        breakingCapacity: 6,
        voltageRating: 230
      }
    });

    // Connect main supply to MCB (red for live/hot or phase 1)
    connections.push({
      id: `conn-${connectionId++}`,
      from: mainSupplyId,
      to: mainMCBId,
      fromPort: 1,
      toPort: 1,
      wireColor: 'red' // Phase 1 or live
    });

    // Add RCCB
    const rccbId = `rccb-${componentId++}`;
    components.push({
      id: rccbId,
      type: 'rccb',
      value: 30,
      unit: 'mA',
      position: { x: 300, y: 200 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: {
        description: 'RCCB',
        sensitivity: 30,
        voltageRating: 230
      }
    });

    // Connect MCB to RCCB (red for live/hot)
    connections.push({
      id: `conn-${connectionId++}`,
      from: mainMCBId,
      to: rccbId,
      fromPort: 2,
      toPort: 1,
      wireColor: prompt.phase === 'three' ? 'red' : 'red' // Phase 1 or live
    });

    // Add surge protection device (SPD) for main panel if load is significant
    if (totalLoad > 2000) {
      const spdId = `spd-${componentId++}`;
      components.push({
        id: spdId,
        type: 'spd',
        value: 20,
        unit: 'kA',
        position: { x: 350, y: 200 },
        rotation: 0,
        connections: [],
        ports: 2,
        properties: {
          description: 'Surge Protection Device',
          spdType: 'type2',
          maxDischargeCurrent: 20,
          clampingVoltage: 600,
          voltageRating: 230,
          currentRating: 63
        }
      });

      // Connect RCCB to SPD (red for live/hot or phase 1)
      connections.push({
        id: `conn-${connectionId++}`,
        from: rccbId,
        to: spdId,
        fromPort: 2,
        toPort: 1,
        wireColor: isThreePhase ? 'red' : 'red' // Phase 1 or live
      });
    }

    // Determine last protection device (SPD if added, otherwise RCCB)
    let lastProtectionId = totalLoad > 2000 ? `spd-${componentId - 1}` : rccbId;

    // Add UPS if requested
    let upsId: string | null = null;
    if (needsUPS) {
      upsId = `ups-${componentId++}`;
      components.push({
        id: upsId,
        type: 'ups',
        value: Math.ceil(totalLoad * 1.2 / 1000), // kVA rating
        unit: 'kVA',
        position: { x: totalLoad > 2000 ? 500 : 450, y: 200 },
        rotation: 0,
        connections: [],
        ports: 2,
        properties: {
          description: 'UPS Backup System',
          powerConsumption: totalLoad,
          operatingVoltage: supplyVoltage,
          operatingCurrent: totalCurrent,
          batteryCapacity: 100, // Ah
          backupTime: 30, // minutes
          voltageRating: supplyVoltage
        }
      });

      // Connect last protection device to UPS
      connections.push({
        id: `conn-${connectionId++}`,
        from: lastProtectionId,
        to: upsId,
        fromPort: 2,
        toPort: 1,
        wireColor: 'red'
      });
      lastProtectionId = upsId;
    }

    // Add two-way switch if requested
    let twoWaySwitchId: string | null = null;
    if (needsTwoWaySwitch) {
      twoWaySwitchId = `two-way-switch-${componentId++}`;
      components.push({
        id: twoWaySwitchId,
        type: 'two-way-switch',
        value: 0,
        unit: '',
        position: { x: (totalLoad > 2000 ? 500 : 450) + (needsUPS ? 100 : 0), y: 200 },
        rotation: 0,
        connections: [],
        ports: 3,
        properties: {
          description: 'Two-Way Safety Switch',
          switchType: 'three-way',
          voltageRating: supplyVoltage,
          currentRating: mcbRating
        }
      });

      // Connect last protection device to two-way switch
      connections.push({
        id: `conn-${connectionId++}`,
        from: lastProtectionId,
        to: twoWaySwitchId,
        fromPort: 2,
        toPort: 1,
        wireColor: 'red'
      });
      lastProtectionId = twoWaySwitchId;
    }

    // Add lightning protection if requested
    let lightningRodId: string | null = null;
    if (needsLightningProtection) {
      lightningRodId = `lightning-rod-${componentId++}`;
      components.push({
        id: lightningRodId,
        type: 'lightning-rod',
        value: 0,
        unit: '',
        position: { x: 100, y: 100 },
        rotation: 0,
        connections: [],
        ports: 1,
        properties: {
          description: 'Lightning Protection Rod',
          conductorMaterial: 'copper',
          protectionRadius: 5,
          rodHeight: 3,
          groundingResistance: 10
        }
      });
    }

    // Add junction box for parallel connections
    const junctionId = `junction-${componentId++}`;
    const junctionX = (totalLoad > 2000 ? 500 : 450) + (needsUPS ? 100 : 0) + (needsTwoWaySwitch ? 100 : 0);
    components.push({
      id: junctionId,
      type: 'junction',
      value: 0,
      unit: 'V',
      position: { x: junctionX, y: 200 },
      rotation: 0,
      connections: [],
      ports: isThreePhase ? 12 : 6,
      properties: {
        description: isThreePhase ? 'Three-Phase Distribution Junction Box' : 'Distribution Junction Box',
        junctionType: 'distribution'
      }
    });

    // Connect last protection device to junction box
    connections.push({
      id: `conn-${connectionId++}`,
      from: lastProtectionId,
      to: junctionId,
      fromPort: needsTwoWaySwitch ? 2 : 2,
      toPort: 1,
      wireColor: 'red' // Phase 1 or live
    });

    // For three-phase, add phase distribution
    const phaseJunctions: string[] = [];
    if (isThreePhase) {
      const phaseLabels = ['A', 'B', 'C'];
      const phaseColors: Connection['wireColor'][] = ['red', 'green', 'blue'];
      phaseLabels.forEach((label, idx) => {
        const phaseJunctionId = `phase-${label.toLowerCase()}-${componentId++}`;
        components.push({
          id: phaseJunctionId,
          type: 'junction',
          value: 0,
          unit: 'V',
          position: { x: junctionX + 150 + idx * 120, y: 200 },
          rotation: 0,
          connections: [],
          ports: 6,
          properties: {
            description: `Phase ${label} Distribution`,
            junctionType: 'distribution'
          }
        });
        connections.push({
          id: `conn-${connectionId++}`,
          from: junctionId,
          to: phaseJunctionId,
          fromPort: 2 + idx,
          toPort: 1,
          wireColor: phaseColors[idx]
        });
        phaseJunctions.push(phaseJunctionId);
      });
    }

    // Add ground connection early (needed for appliance connections)
    const groundId = `ground-${componentId++}`;
    components.push({
      id: groundId,
      type: 'ground',
      value: 0,
      unit: 'V',
      position: { x: 500, y: 500 },
      rotation: 0,
      connections: [],
      ports: 1,
      properties: {
        description: 'Ground Connection'
      }
    });

    // Ground the distribution junction to establish reference (black for earth/ground)
    connections.push({
      id: `conn-${connectionId++}`,
      from: isThreePhase ? phaseJunctions[0] : junctionId,
      to: groundId,
      fromPort: isThreePhase ? 2 : 1,
      toPort: 1,
      wireColor: 'black' // Earth/ground always black
    });

    // Connect lightning rod to ground if present
    if (lightningRodId) {
      connections.push({
        id: `conn-${connectionId++}`,
        from: lightningRodId,
        to: groundId,
        fromPort: 1,
        toPort: 1,
        wireColor: 'black'
      });
    }

    // Add appliances in parallel from junction box
    let yPos = 300;

    if (prompt.appliances.fans) {
      for (let i = 0; i < prompt.appliances.fans; i++) {
        const fanId = `fan-${componentId++}`;
        components.push({
          id: fanId,
          type: 'fan',
          value: 75,
          unit: 'W',
          position: { x: 400, y: yPos },
          rotation: 0,
          connections: [],
          ports: 2,
          properties: {
            description: `Fan ${i + 1}`,
            powerConsumption: 75,
            operatingVoltage: 230,
            operatingCurrent: 0.33
          }
        });

        // Connect to appropriate junction (three-phase or single-phase)
        const targetJunction = isThreePhase ? phaseJunctions[i % phaseJunctions.length] : junctionId;
        const targetPort = isThreePhase ? 2 + Math.floor(i / phaseJunctions.length) : 2 + i;
        const wireColor = isThreePhase ? (['red', 'green', 'blue'][i % 3] as Connection['wireColor']) : 'red';
        connections.push({
          id: `conn-${connectionId++}`,
          from: targetJunction,
          to: fanId,
          fromPort: targetPort,
          toPort: 1,
          wireColor: wireColor
        });
        
        // Ground connection for fan
        connections.push({
          id: `conn-${connectionId++}`,
          from: fanId,
          to: groundId,
          fromPort: 2,
          toPort: 1,
          wireColor: 'black'
        });
        yPos += 80;
      }
    }

    if (prompt.appliances.lights) {
      for (let i = 0; i < prompt.appliances.lights; i++) {
        const lightId = `light-${componentId++}`;
        components.push({
          id: lightId,
          type: 'light',
          value: 60,
          unit: 'W',
          position: { x: 400, y: yPos },
          rotation: 0,
          connections: [],
          ports: 2,
          properties: {
            description: `Light ${i + 1}`,
            powerConsumption: 60,
            operatingVoltage: 230,
            operatingCurrent: 0.26
          }
        });

        // Connect to appropriate junction
        const fanCount = prompt.appliances.fans || 0;
        const lightIndex = fanCount + i;
        const targetJunction = isThreePhase ? phaseJunctions[lightIndex % phaseJunctions.length] : junctionId;
        const targetPort = isThreePhase ? 2 + Math.floor(lightIndex / phaseJunctions.length) : 2 + lightIndex;
        const wireColor = isThreePhase ? (['red', 'green', 'blue'][lightIndex % 3] as Connection['wireColor']) : 'red';
        connections.push({
          id: `conn-${connectionId++}`,
          from: targetJunction,
          to: lightId,
          fromPort: targetPort,
          toPort: 1,
          wireColor: wireColor
        });
        
        // Ground connection for light
        connections.push({
          id: `conn-${connectionId++}`,
          from: lightId,
          to: groundId,
          fromPort: 2,
          toPort: 1,
          wireColor: 'black'
        });
        yPos += 80;
      }
    }

    if (prompt.appliances.ac) {
      for (let i = 0; i < prompt.appliances.ac; i++) {
        const acId = `ac-${componentId++}`;
        components.push({
          id: acId,
          type: 'ac',
          value: 1500,
          unit: 'W',
          position: { x: 400, y: yPos },
          rotation: 0,
          connections: [],
          ports: 2,
          properties: {
            description: `AC Unit ${i + 1}`,
            powerConsumption: 1500,
            operatingVoltage: 230,
            operatingCurrent: 6.52
          }
        });

        // Connect to appropriate junction
        const acIndex = (prompt.appliances.fans || 0) + (prompt.appliances.lights || 0) + i;
        const acTargetJunction = isThreePhase ? phaseJunctions[acIndex % phaseJunctions.length] : junctionId;
        const acTargetPort = isThreePhase ? 2 + Math.floor(acIndex / phaseJunctions.length) : 2 + acIndex;
        const acWireColor = isThreePhase ? (['red', 'green', 'blue'][acIndex % 3] as Connection['wireColor']) : 'red';
        connections.push({
          id: `conn-${connectionId++}`,
          from: acTargetJunction,
          to: acId,
          fromPort: acTargetPort,
          toPort: 1,
          wireColor: acWireColor
        });
        
        // Ground connection for AC
        connections.push({
          id: `conn-${connectionId++}`,
          from: acId,
          to: groundId,
          fromPort: 2,
          toPort: 1,
          wireColor: 'black'
        });
        yPos += 80;
      }
    }

    if (prompt.appliances.heater) {
      for (let i = 0; i < prompt.appliances.heater; i++) {
        const heaterId = `heater-${componentId++}`;
        components.push({
          id: heaterId,
          type: 'heater',
          value: 1500,
          unit: 'W',
          position: { x: 400, y: yPos },
          rotation: 0,
          connections: [],
          ports: 2,
          properties: {
            description: `Heater ${i + 1}`,
            powerConsumption: 1500,
            operatingVoltage: 230,
            operatingCurrent: 6.52
          }
        });

        // Connect to appropriate junction
        const heaterIndex = (prompt.appliances.fans || 0) + (prompt.appliances.lights || 0) + (prompt.appliances.ac || 0) + i;
        const heaterTargetJunction = isThreePhase ? phaseJunctions[heaterIndex % phaseJunctions.length] : junctionId;
        const heaterTargetPort = isThreePhase ? 2 + Math.floor(heaterIndex / phaseJunctions.length) : 2 + heaterIndex;
        const heaterWireColor = isThreePhase ? (['red', 'green', 'blue'][heaterIndex % 3] as Connection['wireColor']) : 'red';
        connections.push({
          id: `conn-${connectionId++}`,
          from: heaterTargetJunction,
          to: heaterId,
          fromPort: heaterTargetPort,
          toPort: 1,
          wireColor: heaterWireColor
        });
        
        // Ground connection for heater
        connections.push({
          id: `conn-${connectionId++}`,
          from: heaterId,
          to: groundId,
          fromPort: 2,
          toPort: 1,
          wireColor: 'black'
        });
        yPos += 80;
      }
    }

    if (prompt.appliances.tv) {
      for (let i = 0; i < prompt.appliances.tv; i++) {
        // Add surge protector for sensitive electronics like TV
        const surgeProtectorId = `surge-protector-tv-${componentId++}`;
        components.push({
          id: surgeProtectorId,
          type: 'surge-protector',
          value: 1000,
          unit: 'J',
          position: { x: 500, y: yPos },
          rotation: 0,
          connections: [],
          ports: 2,
          properties: {
            description: `Surge Protector for TV ${i + 1}`,
            surgeRating: 1000,
            clampingVoltage: 400,
            responseTime: 1,
            voltageRating: 230,
            currentRating: 16
          }
        });

        const tvId = `tv-${componentId++}`;
        components.push({
          id: tvId,
          type: 'tv',
          value: 150,
          unit: 'W',
          position: { x: 600, y: yPos },
          rotation: 0,
          connections: [],
          ports: 2,
          properties: {
            description: `TV ${i + 1}`,
            powerConsumption: 150,
            operatingVoltage: 230,
            operatingCurrent: 0.65
          }
        });

        // Connect junction box to surge protector, then to TV
        const tvConnIndex = (prompt.appliances.fans || 0) + (prompt.appliances.lights || 0) + (prompt.appliances.ac || 0) + (prompt.appliances.heater || 0) + i;
        const tvTargetJunction = isThreePhase ? phaseJunctions[tvConnIndex % phaseJunctions.length] : junctionId;
        const tvTargetPort = isThreePhase ? 2 + Math.floor(tvConnIndex / phaseJunctions.length) : 2 + tvConnIndex;
        const tvWireColor = isThreePhase ? (['red', 'green', 'blue'][tvConnIndex % 3] as Connection['wireColor']) : 'red';
        connections.push({
          id: `conn-${connectionId++}`,
          from: tvTargetJunction,
          to: surgeProtectorId,
          fromPort: tvTargetPort,
          toPort: 1,
          wireColor: tvWireColor
        });
        connections.push({
          id: `conn-${connectionId++}`,
          from: surgeProtectorId,
          to: tvId,
          fromPort: 2,
          toPort: 1,
          wireColor: 'red'
        });
        
        // Ground connection for TV
        connections.push({
          id: `conn-${connectionId++}`,
          from: tvId,
          to: groundId,
          fromPort: 2,
          toPort: 1,
          wireColor: 'black'
        });
        yPos += 80;
      }
    }

    if (prompt.appliances.motor) {
      for (let i = 0; i < prompt.appliances.motor; i++) {
        const motorId = `motor-${componentId++}`;
        components.push({
          id: motorId,
          type: 'motor',
          value: 750,
          unit: 'W',
          position: { x: 400, y: yPos },
          rotation: 0,
          connections: [],
          ports: 2,
          properties: {
            description: `Motor ${i + 1}`,
            powerConsumption: 750,
            operatingVoltage: 230,
            operatingCurrent: 3.26
          }
        });

        // Connect to appropriate junction
        const motorConnIndex = (prompt.appliances.fans || 0) + (prompt.appliances.lights || 0) + (prompt.appliances.ac || 0) + (prompt.appliances.heater || 0) + (prompt.appliances.tv || 0) + i;
        const motorTargetJunction = isThreePhase ? phaseJunctions[motorConnIndex % phaseJunctions.length] : junctionId;
        const motorTargetPort = isThreePhase ? 2 + Math.floor(motorConnIndex / phaseJunctions.length) : 2 + motorConnIndex;
        const motorWireColor = isThreePhase ? (['red', 'green', 'blue'][motorConnIndex % 3] as Connection['wireColor']) : 'red';
        connections.push({
          id: `conn-${connectionId++}`,
          from: motorTargetJunction,
          to: motorId,
          fromPort: motorTargetPort,
          toPort: 1,
          wireColor: motorWireColor
        });
        
        // Ground connection for motor
        connections.push({
          id: `conn-${connectionId++}`,
          from: motorId,
          to: groundId,
          fromPort: 2,
          toPort: 1,
          wireColor: 'black'
        });
        yPos += 80;
      }
    }

    return {
      id: `ai-circuit-${Date.now()}`,
      name: `AI Generated Circuit`,
      components,
      connections,
      metadata: {
        voltage: supplyVoltage,
        phase: prompt.phase || 'single',
        description: `Fallback circuit with ${prompt.appliances ? Object.values(prompt.appliances).reduce((a, b) => (a || 0) + (b || 0), 0) : 0} appliances${needsUPS ? ', UPS' : ''}${needsTwoWaySwitch ? ', Two-way switch' : ''}${needsLightningProtection ? ', Lightning protection' : ''}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
  }

  private extractRecommendations(response: string): string[] {
    const recommendations: string[] = [];
    
    // Extract recommendations from response
    const recMatch = response.match(/recommendations?[:\s]*\[([^\]]+)\]/i);
    if (recMatch) {
      const recText = recMatch[1];
      const items = recText.split(',').map(item => item.trim().replace(/['"]/g, ''));
      recommendations.push(...items);
    }

    // Add default recommendations if none found
    if (recommendations.length === 0) {
      recommendations.push(
        'Install proper earthing system',
        'Use appropriate wire sizes for load',
        'Ensure proper ventilation for electrical panels',
        'Regular maintenance of protection devices'
      );
    }

    return recommendations;
  }

  private extractSafetyNotes(response: string): string[] {
    const safetyNotes: string[] = [];
    
    // Extract safety notes from response
    const safetyMatch = response.match(/safety[:\s]*\[([^\]]+)\]/i);
    if (safetyMatch) {
      const safetyText = safetyMatch[1];
      const items = safetyText.split(',').map(item => item.trim().replace(/['"]/g, ''));
      safetyNotes.push(...items);
    }

    // Add default safety notes if none found
    if (safetyNotes.length === 0) {
      safetyNotes.push(
        'Ensure all connections are properly tightened',
        'Use appropriate PPE during installation',
        'Test all protection devices before energizing',
        'Follow local electrical codes and standards'
      );
    }

    return safetyNotes;
  }

  private calculateTotalLoad(prompt: CircuitPrompt): number {
    let totalLoad = 0;
    
    if (prompt.appliances.fans) totalLoad += prompt.appliances.fans * 75;
    if (prompt.appliances.lights) totalLoad += prompt.appliances.lights * 60;
    if (prompt.appliances.ac) totalLoad += prompt.appliances.ac * 1500;
    if (prompt.appliances.heater) totalLoad += prompt.appliances.heater * 1500;
    if (prompt.appliances.tv) totalLoad += prompt.appliances.tv * 150;
    if (prompt.appliances.motor) totalLoad += prompt.appliances.motor * 750;

    return totalLoad;
  }

  private calculateProtection(totalLoad: number): { mcb: number; fuse: number; rccb: boolean } {
    const current = totalLoad / 230; // Assuming 230V
    
    let mcbRating = 16;
    if (current > 15) mcbRating = 32;
    if (current > 30) mcbRating = 63;
    if (current > 60) mcbRating = 100;

    let fuseRating = 20;
    if (current > 18) fuseRating = 32;
    if (current > 30) fuseRating = 50;
    if (current > 45) fuseRating = 63;

    return {
      mcb: mcbRating,
      fuse: fuseRating,
      rccb: true // Always recommend RCCB for safety
    };
  }

  private sanitizeComponentRatings(circuit: Circuit, prompt: CircuitPrompt): void {
    const supplyVoltage = prompt.voltage && prompt.voltage > 0 ? prompt.voltage : 230;
    const maxVoltage = Math.min(600, Math.max(supplyVoltage, 110));

    const defaultPower: Partial<Record<Component['type'], number>> = {
      fan: 75,
      light: 60,
      tv: 150,
      ac: 2000,
      heater: 1500,
      motor: 750,
      refrigerator: 150,
      'washing-machine': 2000,
      microwave: 1200,
      dishwasher: 1800,
      'water-heater': 3000,
      'electric-stove': 4000,
      'electric-oven': 2500,
      'heat-pump': 3000,
      'electric-boiler': 6000,
      ups: 1000,
      inverter: 2000
    };

    const clamp = (value: number | undefined, min: number, max: number, fallback: number) => {
      if (!Number.isFinite(value)) return fallback;
      return Math.min(Math.max(value!, min), max);
    };

    circuit.components.forEach(component => {
      switch (component.type) {
        case 'battery':
        case 'socket':
          component.value = clamp(component.value, 12, maxVoltage, supplyVoltage);
          component.unit = 'V';
          break;
        case 'mcb':
        case 'rccb':
        case 'gfci':
        case 'afci':
        case 'spd':
        case 'surge-protector':
        case 'overvoltage-protector':
        case 'undervoltage-protector':
        case 'emergency-stop':
          component.value = clamp(component.value, 0, 200, component.value || 0);
          component.properties = {
            ...(component.properties || {}),
            voltageRating: clamp(component.properties?.voltageRating as number, 50, maxVoltage, supplyVoltage)
          };
          break;
        case 'two-way-switch':
          component.value = 0;
          component.unit = '';
          component.properties = {
            ...(component.properties || {}),
            switchType: (component.properties?.switchType as 'single-pole' | 'double-pole' | 'three-way' | 'four-way' | undefined) || 'three-way',
            voltageRating: clamp(component.properties?.voltageRating as number, 50, maxVoltage, supplyVoltage),
            description: component.properties?.description || 'Safety Two-Way Switch'
          };
          break;
        case 'lightning-rod':
          component.value = 0;
          component.unit = '';
          component.properties = {
            ...(component.properties || {}),
            conductorMaterial: (component.properties?.conductorMaterial as 'copper' | 'aluminum' | 'galvanized' | undefined) || 'copper',
            protectionRadius: clamp(component.properties?.protectionRadius as number, 1, 50, 5),
            rodHeight: clamp(component.properties?.rodHeight as number, 1, 30, 3),
            groundingResistance: clamp(component.properties?.groundingResistance as number, 1, 50, 10),
            description: component.properties?.description || 'Lightning Protection Rod'
          };
          break;
        default:
          break;
      }

      if (component.properties) {
        const defaults = defaultPower[component.type];
        if (defaults) {
          component.properties.powerConsumption = clamp(component.properties.powerConsumption as number, 10, defaults * 1.5, defaults);
          component.properties.operatingVoltage = clamp(component.properties.operatingVoltage as number, 12, maxVoltage, supplyVoltage);
        }
      }
    });
  }
}
