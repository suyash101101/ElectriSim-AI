// Image Recognition Agent
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Circuit, Component, Connection } from '../types/circuit.types';

export class ImageRecognitionAgent {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your environment variables.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  // Main method to process circuit images
  async processCircuitImage(imageFile: File): Promise<{
    circuit: Circuit;
    confidence: number;
    detectedComponents: Component[];
    detectedConnections: Connection[];
  }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      const imageParts = await this.fileToGenerativePart(imageFile);
      const prompt = `Analyze this electrical circuit diagram and extract the following information in JSON format:

{
  "components": [
    {
      "id": "unique_id",
      "type": "resistor|capacitor|battery|led|switch|ground",
      "value": numeric_value,
      "unit": "Ω|F|V|A|W",
      "position": {"x": number, "y": number},
      "properties": {
        "color": "string",
        "tolerance": number,
        "powerRating": number,
        "voltageRating": number
      }
    }
  ],
  "connections": [
    {
      "id": "unique_id",
      "from": "component_id",
      "to": "component_id",
      "fromPort": number,
      "toPort": number
    }
  ],
  "metadata": {
    "voltage": number,
    "description": "string"
  },
  "confidence": number
}

Guidelines:
1. Identify all electrical components and their values
2. Determine component positions (approximate coordinates)
3. Identify connections between components
4. Extract voltage ratings and other specifications
5. Provide confidence score (0-1) for the analysis
6. Use standard component symbols and values
7. If values are unclear, use reasonable defaults

Return only the JSON object, no additional text.`;

      const result = await model.generateContent([prompt, imageParts]);
      const response = result.response.text();
      
      // Parse the JSON response
      const parsedData = this.parseCircuitData(response);
      
      // Create circuit object
      const circuit: Circuit = {
        id: `detected-circuit-${Date.now()}`,
        name: 'Detected Circuit',
        components: parsedData.components,
        connections: parsedData.connections,
        metadata: {
          voltage: parsedData.metadata.voltage || 9,
          description: parsedData.metadata.description || 'Circuit detected from image',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      return {
        circuit,
        confidence: parsedData.confidence,
        detectedComponents: parsedData.components,
        detectedConnections: parsedData.connections
      };

    } catch (error) {
      console.error('Error processing circuit image:', error);
      
      // Return empty circuit on error
      const emptyCircuit: Circuit = {
        id: `error-circuit-${Date.now()}`,
        name: 'Error - Could not detect circuit',
        components: [],
        connections: [],
        metadata: {
          voltage: 0,
          description: 'Failed to detect circuit from image',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      return {
        circuit: emptyCircuit,
        confidence: 0,
        detectedComponents: [],
        detectedConnections: []
      };
    }
  }

  // Parse circuit data from AI response
  private parseCircuitData(response: string): {
    components: Component[];
    connections: Connection[];
    metadata: { voltage: number; description: string };
    confidence: number;
  } {
    try {
      // Clean the response to extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const jsonString = jsonMatch[0];
      const parsed = JSON.parse(jsonString);

      // Validate and normalize components
      const components: Component[] = (parsed.components || []).map((comp: any, index: number) => ({
        id: comp.id || `comp-${index}`,
        type: this.normalizeComponentType(comp.type),
        value: this.normalizeValue(comp.value),
        unit: this.normalizeUnit(comp.unit, comp.type),
        position: comp.position || { x: 100 + index * 50, y: 100 },
        rotation: comp.rotation || 0,
        connections: [],
        properties: {
          color: comp.properties?.color,
          tolerance: comp.properties?.tolerance,
          powerRating: comp.properties?.powerRating,
          voltageRating: comp.properties?.voltageRating
        }
      }));

      // Validate and normalize connections
      const connections: Connection[] = (parsed.connections || []).map((conn: any, index: number) => ({
        id: conn.id || `conn-${index}`,
        from: conn.from || '',
        to: conn.to || '',
        fromPort: conn.fromPort || 1,
        toPort: conn.toPort || 1
      }));

      return {
        components,
        connections,
        metadata: {
          voltage: parsed.metadata?.voltage || 9,
          description: parsed.metadata?.description || 'Circuit detected from image'
        },
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5))
      };

    } catch (error) {
      console.error('Error parsing circuit data:', error);
      
      // Return default empty data
      return {
        components: [],
        connections: [],
        metadata: {
          voltage: 9,
          description: 'Failed to parse circuit data'
        },
        confidence: 0
      };
    }
  }

  // Normalize component type
  private normalizeComponentType(type: string): Component['type'] {
    const normalizedType = type?.toLowerCase();
    
    switch (normalizedType) {
      case 'r':
      case 'res':
      case 'resistor':
        return 'resistor';
      case 'c':
      case 'cap':
      case 'capacitor':
        return 'capacitor';
      case 'l':
      case 'ind':
      case 'inductor':
        return 'inductor';
      case 'b':
      case 'bat':
      case 'battery':
      case 'v':
      case 'voltage':
      case 'power':
        return 'battery';
      case 'led':
      case 'diode':
        return 'led';
      case 's':
      case 'sw':
      case 'switch':
        return 'switch';
      case 'gnd':
      case 'ground':
        return 'ground';
      default:
        return 'resistor'; // Default fallback
    }
  }

  // Normalize component value
  private normalizeValue(value: any): number {
    if (typeof value === 'number') {
      return value;
    }
    
    if (typeof value === 'string') {
      // Parse common electrical value formats
      const cleanValue = value.replace(/[^\d.,]/g, '');
      const numValue = parseFloat(cleanValue.replace(',', '.'));
      
      if (!isNaN(numValue)) {
        return numValue;
      }
    }
    
    return 100; // Default value
  }

  // Normalize unit
  private normalizeUnit(unit: string, type: string): string {
    if (!unit) {
      // Default units based on component type
      switch (type?.toLowerCase()) {
        case 'resistor':
          return 'Ω';
        case 'capacitor':
          return 'F';
        case 'inductor':
          return 'H';
        case 'battery':
          return 'V';
        case 'led':
          return 'V';
        default:
          return '';
      }
    }
    
    return unit;
  }

  // Convert file to Generative AI part
  private async fileToGenerativePart(file: File) {
    const base64 = await this.fileToBase64(file);
    return {
      inlineData: {
        data: base64,
        mimeType: file.type,
      },
    };
  }

  // Convert file to base64
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  }

  // Validate detected circuit
  validateDetectedCircuit(circuit: Circuit): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for power source
    const powerSources = circuit.components.filter(c => c.type === 'battery');
    if (powerSources.length === 0) {
      issues.push('No power source detected');
      suggestions.push('Add a battery or power source');
    }

    // Check for components without connections
    const connectedComponents = new Set<string>();
    circuit.connections.forEach(conn => {
      connectedComponents.add(conn.from);
      connectedComponents.add(conn.to);
    });

    circuit.components.forEach(component => {
      if (!connectedComponents.has(component.id) && component.type !== 'ground') {
        issues.push(`Component ${component.id} appears disconnected`);
        suggestions.push(`Connect ${component.id} to the circuit`);
      }
    });

    // Check for reasonable component values
    circuit.components.forEach(component => {
      if (component.value <= 0) {
        issues.push(`Invalid value for ${component.id}: ${component.value}`);
        suggestions.push(`Set a valid value for ${component.id}`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  // Get supported image formats
  getSupportedFormats(): string[] {
    return [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];
  }

  // Check if file format is supported
  isSupportedFormat(file: File): boolean {
    return this.getSupportedFormats().includes(file.type);
  }
}
