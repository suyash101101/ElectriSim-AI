// Circuit Simulator Utility
import type { Circuit, Component, Connection, CircuitAnalysis } from '../types/circuit.types';
import { ElectricalCalculations } from './electricalCalculations';

export class CircuitSimulator {
  private circuit: Circuit;
  private analysis: CircuitAnalysis | null = null;

  constructor(circuit: Circuit) {
    this.circuit = circuit;
  }

  // Update circuit and re-analyze
  updateCircuit(circuit: Circuit): CircuitAnalysis {
    this.circuit = circuit;
    this.analysis = ElectricalCalculations.analyzeCircuit(circuit);
    return this.analysis;
  }

  // Get current analysis
  getAnalysis(): CircuitAnalysis | null {
    return this.analysis;
  }

  // Add component to circuit
  addComponent(component: Component): Circuit {
    const newCircuit = {
      ...this.circuit,
      components: [...this.circuit.components, component],
      metadata: {
        ...this.circuit.metadata,
        updatedAt: new Date()
      }
    };
    
    this.updateCircuit(newCircuit);
    return newCircuit;
  }

  // Remove component from circuit
  removeComponent(componentId: string): Circuit {
    const newCircuit = {
      ...this.circuit,
      components: this.circuit.components.filter(c => c.id !== componentId),
      connections: this.circuit.connections.filter(
        conn => conn.from !== componentId && conn.to !== componentId
      ),
      metadata: {
        ...this.circuit.metadata,
        updatedAt: new Date()
      }
    };
    
    this.updateCircuit(newCircuit);
    return newCircuit;
  }

  // Add connection between components
  addConnection(connection: Connection): Circuit {
    const newCircuit = {
      ...this.circuit,
      connections: [...this.circuit.connections, connection],
      metadata: {
        ...this.circuit.metadata,
        updatedAt: new Date()
      }
    };
    
    this.updateCircuit(newCircuit);
    return newCircuit;
  }

  // Remove connection
  removeConnection(connectionId: string): Circuit {
    const newCircuit = {
      ...this.circuit,
      connections: this.circuit.connections.filter(c => c.id !== connectionId),
      metadata: {
        ...this.circuit.metadata,
        updatedAt: new Date()
      }
    };
    
    this.updateCircuit(newCircuit);
    return newCircuit;
  }

  // Update component properties
  updateComponent(componentId: string, updates: Partial<Component>): Circuit {
    const newCircuit = {
      ...this.circuit,
      components: this.circuit.components.map(c => 
        c.id === componentId ? { ...c, ...updates } : c
      ),
      metadata: {
        ...this.circuit.metadata,
        updatedAt: new Date()
      }
    };
    
    this.updateCircuit(newCircuit);
    return newCircuit;
  }

  // Validate circuit
  validateCircuit(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check for power source
    const powerSources = this.circuit.components.filter(c => c.type === 'battery');
    if (powerSources.length === 0) {
      issues.push('No power source found');
    }

    // Check for components without connections
    const connectedComponents = new Set<string>();
    this.circuit.connections.forEach(conn => {
      connectedComponents.add(conn.from);
      connectedComponents.add(conn.to);
    });

    this.circuit.components.forEach(component => {
      if (!connectedComponents.has(component.id) && component.type !== 'ground') {
        issues.push(`Component ${component.id} is not connected`);
      }
    });

    // Validate individual components
    this.circuit.components.forEach(component => {
      const componentIssues = ElectricalCalculations.validateComponent(component);
      componentIssues.forEach(issue => issues.push(issue.message));
    });

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  // Get circuit statistics
  getCircuitStats() {
    const componentCounts = this.circuit.components.reduce((acc, comp) => {
      acc[comp.type] = (acc[comp.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalComponents: this.circuit.components.length,
      totalConnections: this.circuit.connections.length,
      componentCounts,
      hasPowerSource: this.circuit.components.some(c => c.type === 'battery'),
      hasGround: this.circuit.components.some(c => c.type === 'ground'),
      analysis: this.analysis
    };
  }

  // Export circuit data
  exportCircuit() {
    return {
      circuit: this.circuit,
      analysis: this.analysis,
      stats: this.getCircuitStats(),
      exportedAt: new Date().toISOString()
    };
  }

  // Import circuit data
  importCircuit(data: any) {
    if (data.circuit) {
      this.circuit = data.circuit;
      this.updateCircuit(this.circuit);
    }
  }

  // Create sample circuits for testing
  static createSampleCircuit(): Circuit {
    return {
      id: 'sample-circuit-1',
      name: 'Simple LED Circuit',
      components: [
        {
          id: 'battery-1',
          type: 'battery',
          value: 9,
          unit: 'V',
          position: { x: 100, y: 100 },
          rotation: 0,
          connections: ['conn-1'],
          ports: 2,
          properties: {}
        },
        {
          id: 'resistor-1',
          type: 'resistor',
          value: 330,
          unit: 'Ω',
          position: { x: 200, y: 100 },
          rotation: 0,
          connections: ['conn-1', 'conn-2'],
          ports: 2,
          properties: {
            powerRating: 0.25
          }
        },
        {
          id: 'led-1',
          type: 'led',
          value: 2.5,
          unit: 'V',
          position: { x: 300, y: 100 },
          rotation: 0,
          connections: ['conn-2', 'conn-3'],
          ports: 2,
          properties: {}
        },
        {
          id: 'ground-1',
          type: 'ground',
          value: 0,
          unit: 'V',
          position: { x: 400, y: 100 },
          rotation: 0,
          connections: ['conn-3'],
          ports: 1,
          properties: {}
        }
      ],
      connections: [
        {
          id: 'conn-1',
          from: 'battery-1',
          to: 'resistor-1',
          fromPort: 1,
          toPort: 1
        },
        {
          id: 'conn-2',
          from: 'resistor-1',
          to: 'led-1',
          fromPort: 2,
          toPort: 1
        },
        {
          id: 'conn-3',
          from: 'led-1',
          to: 'ground-1',
          fromPort: 2,
          toPort: 1
        }
      ],
      metadata: {
        voltage: 9,
        description: 'A simple LED circuit with current limiting resistor',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
  }
}
