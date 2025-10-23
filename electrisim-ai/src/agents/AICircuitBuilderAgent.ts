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

  async generateCircuitFromPrompt(prompt: CircuitPrompt): Promise<CircuitRecommendation> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      const systemPrompt = this.buildSystemPrompt(prompt);
      const result = await model.generateContent(systemPrompt);
      const response = await result.response;
      const text = response.text();

      // Parse the AI response and generate circuit
      const circuit = this.parseCircuitFromResponse(text, prompt);
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

    } catch (error) {
      console.error('Error generating circuit:', error);
      throw new Error('Failed to generate circuit from prompt');
    }
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

Please design a complete electrical circuit that includes:

1. ALL APPLIANCES with proper ratings:
   - Fans: 75W each (230V, 0.33A)
   - Lights: 60W each (230V, 0.26A) 
   - AC: 1500W each (230V, 6.52A)
   - Heater: 1500W each (230V, 6.52A)
   - TV: 150W each (230V, 0.65A)
   - Motor: 750W each (230V, 3.26A)

2. PROTECTION DEVICES:
   - Main MCB (Miniature Circuit Breaker)
   - Individual MCBs for each circuit
   - RCCB (Residual Current Circuit Breaker) for safety
   - Fuses where appropriate

3. CONTROL DEVICES:
   - Switches for each appliance
   - Contactors for high-power devices
   - Relays for control circuits

4. DISTRIBUTION:
   - Junction boxes
   - Distribution boards
   - Proper wiring connections

5. SAFETY FEATURES:
   - Ground connections
   - Proper earthing
   - Overload protection

Provide the circuit design in this JSON format:
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
      "toPort": 1
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

Focus on:
- Proper load calculation
- Appropriate protection devices
- Safe wiring practices
- Code compliance
- Energy efficiency
- Maintenance accessibility

Generate a complete, safe, and code-compliant electrical circuit design.`;
  }

  private parseCircuitFromResponse(response: string, prompt: CircuitPrompt): Circuit {
    try {
      // Prefer fenced JSON blocks when present
      let text = response.trim();
      const fenceMatch = text.match(/```[\w-]*\n([\s\S]*?)\n```/);
      if (fenceMatch && fenceMatch[1]) {
        text = fenceMatch[1];
      }

      // Fallback to first JSON-like object if no fence
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      let jsonText = jsonMatch[0];
      // Strip JS-style comments and trailing commas to harden parsing
      jsonText = jsonText
        .replace(/\/\/[^\n]*$/gm, '') // line comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
        .replace(/,\s*([}\]])/g, '$1'); // trailing commas

      const parsed = JSON.parse(jsonText);

      const circuit: Circuit = {
        id: `ai-circuit-${Date.now()}`,
        name: `AI Generated Circuit - ${new Date().toLocaleDateString()}`,
        components: parsed.components || [],
        connections: parsed.connections || [],
        metadata: {
          voltage: prompt.voltage || 230,
          phase: prompt.phase || 'single',
          description: `AI-generated circuit for: ${JSON.stringify(prompt.appliances)}`,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      return circuit;
    } catch (error) {
      console.error('Error parsing circuit from response:', error);
      // Return a basic circuit if parsing fails
      return this.generateBasicCircuit(prompt);
    }
  }

  private generateBasicCircuit(prompt: CircuitPrompt): Circuit {
    const components: Component[] = [];
    const connections: Connection[] = [];
    let componentId = 1;
    let connectionId = 1;

    // Calculate total load to determine proper MCB rating
    const totalLoad = this.calculateTotalLoad(prompt);
    const totalCurrent = totalLoad / (prompt.voltage || 230);
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

    // Connect main supply to MCB
    connections.push({
      id: `conn-${connectionId++}`,
      from: mainSupplyId,
      to: mainMCBId,
      fromPort: 1,
      toPort: 1
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

    // Connect MCB to RCCB
    connections.push({
      id: `conn-${connectionId++}`,
      from: mainMCBId,
      to: rccbId,
      fromPort: 2,
      toPort: 1
    });

    // Add junction box for parallel connections
    const junctionId = `junction-${componentId++}`;
    components.push({
      id: junctionId,
      type: 'junction',
      value: 0,
      unit: 'V',
      position: { x: 400, y: 200 },
      rotation: 0,
      connections: [],
      ports: 6,
      properties: {
        description: 'Distribution Junction Box',
        junctionType: 'distribution'
      }
    });

    // Connect RCCB to junction box
    connections.push({
      id: `conn-${connectionId++}`,
      from: rccbId,
      to: junctionId,
      fromPort: 2,
      toPort: 1
    });

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

        // Connect to junction box (parallel connection)
        connections.push({
          id: `conn-${connectionId++}`,
          from: junctionId,
          to: fanId,
          fromPort: 2 + i,
          toPort: 1
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

        // Connect to junction box (parallel connection)
        connections.push({
          id: `conn-${connectionId++}`,
          from: junctionId,
          to: lightId,
          fromPort: 2 + (prompt.appliances.fans || 0) + i,
          toPort: 1
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

        // Connect to junction box (parallel connection)
        connections.push({
          id: `conn-${connectionId++}`,
          from: junctionId,
          to: acId,
          fromPort: 2 + (prompt.appliances.fans || 0) + (prompt.appliances.lights || 0) + i,
          toPort: 1
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

        // Connect to junction box (parallel connection)
        connections.push({
          id: `conn-${connectionId++}`,
          from: junctionId,
          to: heaterId,
          fromPort: 2 + (prompt.appliances.fans || 0) + (prompt.appliances.lights || 0) + (prompt.appliances.ac || 0) + i,
          toPort: 1
        });
        yPos += 80;
      }
    }

    if (prompt.appliances.tv) {
      for (let i = 0; i < prompt.appliances.tv; i++) {
        const tvId = `tv-${componentId++}`;
        components.push({
          id: tvId,
          type: 'tv',
          value: 150,
          unit: 'W',
          position: { x: 400, y: yPos },
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

        // Connect to junction box (parallel connection)
        connections.push({
          id: `conn-${connectionId++}`,
          from: junctionId,
          to: tvId,
          fromPort: 2 + (prompt.appliances.fans || 0) + (prompt.appliances.lights || 0) + (prompt.appliances.ac || 0) + (prompt.appliances.heater || 0) + i,
          toPort: 1
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

        // Connect to junction box (parallel connection)
        connections.push({
          id: `conn-${connectionId++}`,
          from: junctionId,
          to: motorId,
          fromPort: 2 + (prompt.appliances.fans || 0) + (prompt.appliances.lights || 0) + (prompt.appliances.ac || 0) + (prompt.appliances.heater || 0) + (prompt.appliances.tv || 0) + i,
          toPort: 1
        });
        yPos += 80;
      }
    }

    // Add ground connection
    const groundId = `ground-${componentId++}`;
    components.push({
      id: groundId,
      type: 'ground',
      value: 0,
      unit: 'V',
      position: { x: 500, y: yPos },
      rotation: 0,
      connections: [],
      ports: 1,
      properties: {
        description: 'Ground Connection'
      }
    });

    // Ground the distribution junction to establish reference
    connections.push({
      id: `conn-${connectionId++}`,
      from: junctionId,
      to: groundId,
      fromPort: 1,
      toPort: 1
    });

    return {
      id: `ai-circuit-${Date.now()}`,
      name: `AI Generated Circuit`,
      components,
      connections,
      metadata: {
        voltage: prompt.voltage || 230,
        description: `AI-generated circuit`,
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
}
