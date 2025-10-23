import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Circuit, CircuitAnalysis, Component, Connection, Position } from '../../types/circuit.types';
import { Trash2, Edit3, Link } from 'lucide-react';

interface CircuitCanvasProps {
  circuit: Circuit;
  analysis: CircuitAnalysis | null;
  onCircuitUpdate: (circuit: Circuit) => void;
  onImageUpload: (file: File) => void;
  isAnalyzing: boolean;
}

export const CircuitCanvas: React.FC<CircuitCanvasProps> = ({
  circuit,
  analysis,
  onCircuitUpdate,
  onImageUpload,
  isAnalyzing
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Canvas state
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [draggedComponent, setDraggedComponent] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState<Position>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });
  
  // Component editing state
  const [editingComponent, setEditingComponent] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editProperty, setEditProperty] = useState<'value' | 'unit' | 'batteryType' | 'frequency' | 'turnsRatio' | 'forwardVoltage' | 'powerConsumption' | 'operatingVoltage' | 'operatingCurrent' | 'efficiency' | 'coolingCapacity' | 'heatingCapacity' | 'screenSize' | 'fanSpeed' | 'motorType' | 'description' | 'name'>('value');
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Connection state
  const [connectionMode, setConnectionMode] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [connectionPreview, setConnectionPreview] = useState<Position | null>(null);
  
  // Canvas dimensions
  const CANVAS_WIDTH = 1000;
  const CANVAS_HEIGHT = 700;
  const GRID_SIZE = 20;
  const COMPONENT_SIZE = 40;

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Draw initial circuit
    drawCircuit(ctx);
  }, [circuit, analysis, zoom, showGrid, panOffset, connectionMode, connectionStart, connectionPreview]);

  // Draw circuit on canvas
  const drawCircuit = useCallback((ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Apply transformations
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // Draw grid
    if (showGrid) {
      drawGrid(ctx);
    }

    // Draw connections first (behind components)
    drawConnections(ctx);

    // Draw components
    drawComponents(ctx);

    // Draw connection preview
    if (connectionMode && connectionStart && connectionPreview) {
      drawConnectionPreview(ctx);
    }

    // Draw analysis overlays
    if (analysis) {
      drawAnalysisOverlays(ctx);
    }

    ctx.restore();
  }, [circuit, analysis, showGrid, zoom, panOffset, connectionMode, connectionStart, connectionPreview]);

  // Draw grid
  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);

    const startX = Math.floor(-panOffset.x / zoom / GRID_SIZE) * GRID_SIZE;
    const startY = Math.floor(-panOffset.y / zoom / GRID_SIZE) * GRID_SIZE;
    const endX = Math.ceil((CANVAS_WIDTH - panOffset.x) / zoom / GRID_SIZE) * GRID_SIZE;
    const endY = Math.ceil((CANVAS_HEIGHT - panOffset.y) / zoom / GRID_SIZE) * GRID_SIZE;

    for (let x = startX; x <= endX; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    for (let y = startY; y <= endY; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  };

  // Draw connections
  const drawConnections = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 3;

    circuit.connections.forEach(connection => {
      const fromComponent = circuit.components.find(c => c.id === connection.from);
      const toComponent = circuit.components.find(c => c.id === connection.to);

      if (fromComponent && toComponent) {
        // Draw connection line
        ctx.beginPath();
        ctx.moveTo(fromComponent.position.x, fromComponent.position.y);
        ctx.lineTo(toComponent.position.x, toComponent.position.y);
        ctx.stroke();

        // Draw connection points
        ctx.fillStyle = '#6b7280';
        ctx.beginPath();
        ctx.arc(fromComponent.position.x, fromComponent.position.y, 3, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(toComponent.position.x, toComponent.position.y, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  };

  // Draw components
  const drawComponents = (ctx: CanvasRenderingContext2D) => {
    circuit.components.forEach(component => {
      drawComponent(ctx, component);
    });
  };

  // Draw individual component
  const drawComponent = (ctx: CanvasRenderingContext2D, component: Component) => {
    const { position, value, unit } = component;
    const isSelected = selectedComponent === component.id;
    const isConnectionStart = connectionStart === component.id;

    // Component dimensions
    const width = COMPONENT_SIZE;
    const height = COMPONENT_SIZE;

    // Set component color based on analysis and state
    let fillColor = '#f3f4f6';
    let strokeColor = '#6b7280';

    if (isSelected) {
      fillColor = '#dbeafe';
      strokeColor = '#3b82f6';
    } else if (isConnectionStart) {
      fillColor = '#fef3c7';
      strokeColor = '#f59e0b';
    } else if (analysis) {
      const voltage = analysis.voltages[component.id];
      const current = analysis.currents[component.id];
      
      if (voltage !== undefined && current !== undefined) {
        const power = analysis.power[component.id] || 0;
        if (power > 1) {
          fillColor = '#fef3c7'; // Yellow for high power
          strokeColor = '#f59e0b';
        } else if (power > 0.1) {
          fillColor = '#d1fae5'; // Green for normal power
          strokeColor = '#10b981';
        }
      }
    }

    // Draw component background
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.fillRect(position.x - width/2, position.y - height/2, width, height);
    ctx.strokeRect(position.x - width/2, position.y - height/2, width, height);

    // Draw component symbol
    drawComponentSymbol(ctx, component, position);

    // Draw port circles
    drawPortCircles(ctx, component);

    // Draw component label (value and unit)
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${value}${unit}`,
      position.x,
      position.y + height/2 + 10
    );

    // Draw component ID (smaller, below the value)
    ctx.font = '7px Arial';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(
      component.id.length > 8 ? component.id.substring(0, 8) + '...' : component.id,
      position.x,
      position.y + height/2 + 22
    );

    // Draw component name/description if available
    if (component.properties?.description) {
      ctx.font = '6px Arial';
      ctx.fillStyle = '#9ca3af';
      ctx.fillText(
        component.properties.description.length > 12 ? 
          component.properties.description.substring(0, 12) + '...' : 
          component.properties.description,
        position.x,
        position.y + height/2 + 30
      );
    }

    // Draw analysis values if available
    if (analysis) {
      const voltage = analysis.voltages[component.id];
      const current = analysis.currents[component.id];
      
      if (voltage !== undefined && current !== undefined) {
        ctx.font = '8px Arial';
        ctx.fillStyle = '#059669';
        ctx.fillText(
          `${voltage.toFixed(1)}V`,
          position.x - 15,
          position.y + height/2 + 20
        );
        ctx.fillText(
          `${(current * 1000).toFixed(0)}mA`,
          position.x + 15,
          position.y + height/2 + 20
        );
      }
    }
  };

  // Draw component symbol
  const drawComponentSymbol = (ctx: CanvasRenderingContext2D, component: Component, position: Position) => {
    const { type } = component;
    
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;

    switch (type) {
      case 'resistor':
        // Draw resistor zigzag
        ctx.beginPath();
        ctx.moveTo(position.x - 15, position.y);
        ctx.lineTo(position.x - 8, position.y - 8);
        ctx.lineTo(position.x, position.y + 8);
        ctx.lineTo(position.x + 8, position.y - 8);
        ctx.lineTo(position.x + 15, position.y);
        ctx.stroke();
        break;

      case 'battery':
        // Draw battery symbol
        ctx.beginPath();
        ctx.moveTo(position.x - 15, position.y);
        ctx.lineTo(position.x - 12, position.y);
        ctx.moveTo(position.x - 12, position.y - 12);
        ctx.lineTo(position.x - 12, position.y + 12);
        ctx.moveTo(position.x - 8, position.y - 8);
        ctx.lineTo(position.x - 8, position.y + 8);
        ctx.moveTo(position.x - 4, position.y - 4);
        ctx.lineTo(position.x - 4, position.y + 4);
        ctx.moveTo(position.x + 15, position.y);
        ctx.lineTo(position.x + 12, position.y);
        ctx.stroke();
        break;

      case 'led':
        // Draw LED symbol
        ctx.beginPath();
        ctx.moveTo(position.x - 15, position.y);
        ctx.lineTo(position.x - 5, position.y);
        ctx.moveTo(position.x - 5, position.y - 8);
        ctx.lineTo(position.x - 5, position.y + 8);
        ctx.moveTo(position.x - 5, position.y - 8);
        ctx.lineTo(position.x + 5, position.y);
        ctx.lineTo(position.x - 5, position.y + 8);
        ctx.moveTo(position.x + 5, position.y);
        ctx.lineTo(position.x + 15, position.y);
        ctx.stroke();
        break;

      case 'capacitor':
        // Draw capacitor symbol
        ctx.beginPath();
        ctx.moveTo(position.x - 15, position.y);
        ctx.lineTo(position.x - 5, position.y);
        ctx.moveTo(position.x - 5, position.y - 8);
        ctx.lineTo(position.x - 5, position.y + 8);
        ctx.moveTo(position.x + 5, position.y - 8);
        ctx.lineTo(position.x + 5, position.y + 8);
        ctx.moveTo(position.x + 5, position.y);
        ctx.lineTo(position.x + 15, position.y);
        ctx.stroke();
        break;

      case 'ground':
        // Draw ground symbol
        ctx.beginPath();
        ctx.moveTo(position.x, position.y - 15);
        ctx.lineTo(position.x, position.y - 5);
        ctx.moveTo(position.x - 8, position.y - 5);
        ctx.lineTo(position.x + 8, position.y - 5);
        ctx.moveTo(position.x - 4, position.y);
        ctx.lineTo(position.x + 4, position.y);
        ctx.moveTo(position.x - 2, position.y + 5);
        ctx.lineTo(position.x + 2, position.y + 5);
        ctx.stroke();
        break;

      case 'transformer':
        // Draw transformer symbol with + and - terminals
        ctx.beginPath();
        ctx.moveTo(position.x - 15, position.y - 8);
        ctx.lineTo(position.x - 15, position.y + 8);
        ctx.moveTo(position.x - 12, position.y - 8);
        ctx.lineTo(position.x - 12, position.y + 8);
        ctx.moveTo(position.x + 12, position.y - 8);
        ctx.lineTo(position.x + 12, position.y + 8);
        ctx.moveTo(position.x + 15, position.y - 8);
        ctx.lineTo(position.x + 15, position.y + 8);
        ctx.stroke();
        // Draw + and - terminals
        ctx.fillStyle = '#374151';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('+', position.x - 13, position.y - 10);
        ctx.fillText('-', position.x + 13, position.y - 10);
        ctx.fillText('+', position.x - 13, position.y + 12);
        ctx.fillText('-', position.x + 13, position.y + 12);
        break;

      case 'inductor':
        // Draw inductor symbol
        ctx.beginPath();
        ctx.moveTo(position.x - 15, position.y);
        ctx.lineTo(position.x - 10, position.y);
        for (let i = -10; i <= 10; i += 5) {
          ctx.moveTo(position.x + i, position.y - 5);
          ctx.lineTo(position.x + i, position.y + 5);
        }
        ctx.moveTo(position.x + 10, position.y);
        ctx.lineTo(position.x + 15, position.y);
        ctx.stroke();
        break;

      case 'diode':
        // Draw diode symbol
        ctx.beginPath();
        ctx.moveTo(position.x - 15, position.y);
        ctx.lineTo(position.x - 5, position.y);
        ctx.moveTo(position.x - 5, position.y - 8);
        ctx.lineTo(position.x - 5, position.y + 8);
        ctx.moveTo(position.x - 5, position.y - 8);
        ctx.lineTo(position.x + 5, position.y);
        ctx.lineTo(position.x - 5, position.y + 8);
        ctx.moveTo(position.x + 5, position.y);
        ctx.lineTo(position.x + 15, position.y);
        ctx.stroke();
        break;

      case 'fan':
        // Draw fan symbol
        ctx.beginPath();
        ctx.arc(position.x, position.y, 8, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(position.x - 6, position.y - 6);
        ctx.lineTo(position.x + 6, position.y + 6);
        ctx.moveTo(position.x + 6, position.y - 6);
        ctx.lineTo(position.x - 6, position.y + 6);
        ctx.stroke();
        break;

      case 'light':
        // Draw light bulb symbol
        ctx.beginPath();
        ctx.arc(position.x, position.y, 8, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(position.x, position.y - 8);
        ctx.lineTo(position.x, position.y - 15);
        ctx.moveTo(position.x - 3, position.y - 8);
        ctx.lineTo(position.x + 3, position.y - 8);
        ctx.stroke();
        break;

      case 'tv':
        // Draw TV symbol
        ctx.strokeRect(position.x - 10, position.y - 6, 20, 12);
        ctx.beginPath();
        ctx.moveTo(position.x - 8, position.y - 4);
        ctx.lineTo(position.x + 8, position.y - 4);
        ctx.moveTo(position.x - 8, position.y);
        ctx.lineTo(position.x + 8, position.y);
        ctx.moveTo(position.x - 8, position.y + 4);
        ctx.lineTo(position.x + 8, position.y + 4);
        ctx.stroke();
        break;

      case 'ac':
        // Draw AC symbol
        ctx.strokeRect(position.x - 10, position.y - 6, 20, 12);
        ctx.beginPath();
        ctx.moveTo(position.x - 8, position.y - 2);
        ctx.lineTo(position.x + 8, position.y - 2);
        ctx.moveTo(position.x - 8, position.y + 2);
        ctx.lineTo(position.x + 8, position.y + 2);
        ctx.stroke();
        break;

      case 'motor':
        // Draw motor symbol
        ctx.beginPath();
        ctx.arc(position.x, position.y, 8, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(position.x - 6, position.y);
        ctx.lineTo(position.x + 6, position.y);
        ctx.moveTo(position.x, position.y - 6);
        ctx.lineTo(position.x, position.y + 6);
        ctx.stroke();
        break;

      case 'heater':
        // Draw heater symbol
        ctx.strokeRect(position.x - 10, position.y - 6, 20, 12);
        ctx.beginPath();
        for (let i = -8; i <= 8; i += 4) {
          ctx.moveTo(position.x + i, position.y - 4);
          ctx.lineTo(position.x + i, position.y + 4);
        }
        ctx.stroke();
        break;

      case 'voltmeter':
        // Draw voltmeter symbol
        ctx.strokeRect(position.x - 10, position.y - 6, 20, 12);
        ctx.fillStyle = '#374151';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('V', position.x, position.y + 2);
        break;

      case 'ammeter':
        // Draw ammeter symbol
        ctx.strokeRect(position.x - 10, position.y - 6, 20, 12);
        ctx.fillStyle = '#374151';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('A', position.x, position.y + 2);
        break;

      case 'wattmeter':
        // Draw wattmeter symbol
        ctx.strokeRect(position.x - 10, position.y - 6, 20, 12);
        ctx.fillStyle = '#374151';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('W', position.x, position.y + 2);
        break;

      default:
        // Default rectangle
        ctx.strokeRect(position.x - 12, position.y - 8, 24, 16);
        break;
    }
  };

  // Draw port circles around components
  const drawPortCircles = (ctx: CanvasRenderingContext2D, component: Component) => {
    const { position, ports } = component;
    const portRadius = 3;
    
    ctx.fillStyle = '#6B7280';
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    
    // Draw ports based on component type and port count
    if (ports >= 2) {
      // Two ports - left and right
      ctx.beginPath();
      ctx.arc(position.x - 20, position.y, portRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(position.x + 20, position.y, portRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
    
    if (ports >= 3) {
      // Three ports - add top port
      ctx.beginPath();
      ctx.arc(position.x, position.y - 20, portRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
    
    if (ports >= 4) {
      // Four ports - add bottom port
      ctx.beginPath();
      ctx.arc(position.x, position.y + 20, portRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  };

  // Draw connection preview
  const drawConnectionPreview = (ctx: CanvasRenderingContext2D) => {
    if (!connectionStart || !connectionPreview) return;

    const startComponent = circuit.components.find(c => c.id === connectionStart);
    if (!startComponent) return;

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(startComponent.position.x, startComponent.position.y);
    ctx.lineTo(connectionPreview.x, connectionPreview.y);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // Draw analysis overlays
  const drawAnalysisOverlays = (ctx: CanvasRenderingContext2D) => {
    if (!analysis) return;

    // Draw voltage indicators
    Object.entries(analysis.voltages).forEach(([componentId, voltage]) => {
      const component = circuit.components.find(c => c.id === componentId);
      if (component) {
        ctx.fillStyle = voltage > 0 ? '#10b981' : '#ef4444';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${voltage.toFixed(1)}V`,
          component.position.x,
          component.position.y - COMPONENT_SIZE/2 - 8
        );
      }
    });
  };

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = (screenX: number, screenY: number): Position => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (screenX - rect.left - panOffset.x) / zoom,
      y: (screenY - rect.top - panOffset.y) / zoom
    };
  };

  // Find component at position
  const findComponentAt = (x: number, y: number): Component | null => {
    return circuit.components.find(component => {
      const dx = x - component.position.x;
      const dy = y - component.position.y;
      return Math.abs(dx) <= COMPONENT_SIZE/2 && Math.abs(dy) <= COMPONENT_SIZE/2;
    }) || null;
  };

  // Find connection at given position
  const findConnectionAt = (x: number, y: number): Connection | null => {
    for (const connection of circuit.connections) {
      const fromComponent = circuit.components.find(c => c.id === connection.from);
      const toComponent = circuit.components.find(c => c.id === connection.to);
      
      if (fromComponent && toComponent) {
        const fromX = fromComponent.position.x;
        const fromY = fromComponent.position.y;
        const toX = toComponent.position.x;
        const toY = toComponent.position.y;
        
        // Check if point is near the line connecting the components
        const distance = distanceToLine(x, y, fromX, fromY, toX, toY);
        if (distance < 10) { // 10 pixel tolerance
          return connection;
        }
      }
    }
    return null;
  };

  // Calculate distance from point to line
  const distanceToLine = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B);
    
    let param = dot / lenSq;
    
    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    const clickedComponent = findComponentAt(canvasPos.x, canvasPos.y);

    if (connectionMode) {
      if (clickedComponent) {
        if (!connectionStart) {
          setConnectionStart(clickedComponent.id);
        } else if (connectionStart !== clickedComponent.id) {
          // Create connection
          const newConnection: Connection = {
            id: `conn-${Date.now()}`,
            from: connectionStart,
            to: clickedComponent.id,
            fromPort: 1,
            toPort: 1
          };

          const updatedCircuit = {
            ...circuit,
            connections: [...circuit.connections, newConnection],
            metadata: {
              ...circuit.metadata,
              updatedAt: new Date()
            }
          };

          onCircuitUpdate(updatedCircuit);
          setConnectionStart(null);
        }
      } else {
        setConnectionStart(null);
      }
    } else {
      if (clickedComponent) {
        setSelectedComponent(clickedComponent.id);
        setDraggedComponent(clickedComponent.id);
        setDragOffset({
          x: canvasPos.x - clickedComponent.position.x,
          y: canvasPos.y - clickedComponent.position.y
        });
        setIsDragging(true);
      } else {
        setSelectedComponent(null);
        // Start panning
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvasPos = screenToCanvas(e.clientX, e.clientY);

    if (isDragging && draggedComponent) {
      // Update component position
      const updatedCircuit = {
        ...circuit,
        components: circuit.components.map(component =>
          component.id === draggedComponent
            ? { ...component, position: { x: canvasPos.x - dragOffset.x, y: canvasPos.y - dragOffset.y } }
            : component
        ),
        metadata: {
          ...circuit.metadata,
          updatedAt: new Date()
        }
      };

      onCircuitUpdate(updatedCircuit);
    } else if (isPanning) {
      // Update pan offset
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      setPanOffset({
        x: panOffset.x + deltaX,
        y: panOffset.y + deltaY
      });
      setPanStart({ x: e.clientX, y: e.clientY });
    } else if (connectionMode && connectionStart) {
      // Update connection preview
      setConnectionPreview(canvasPos);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedComponent(null);
    setIsPanning(false);
  };

  // Handle double click to edit component or remove wire
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    const clickedComponent = findComponentAt(canvasPos.x, canvasPos.y);
    const clickedConnection = findConnectionAt(canvasPos.x, canvasPos.y);

    if (clickedConnection) {
      // Remove wire/connection
      const updatedCircuit = {
        ...circuit,
        connections: circuit.connections.filter(conn => conn.id !== clickedConnection.id),
        metadata: {
          ...circuit.metadata,
          updatedAt: new Date()
        }
      };
      onCircuitUpdate(updatedCircuit);
    } else if (clickedComponent) {
      // Edit component
      setEditingComponent(clickedComponent.id);
      setEditValue(clickedComponent.value.toString());
      setEditProperty('value');
      setShowEditModal(true);
    }
  };

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(Math.max(0.1, Math.min(3, zoom * delta)));
  };

  // Handle image upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  // Handle value edit
  const handleValueEdit = () => {
    if (!editingComponent) return;

    const component = circuit.components.find(c => c.id === editingComponent);
    if (!component) return;

    const updatedComponents = circuit.components.map(c => {
      if (c.id === editingComponent) {
        const updatedComponent = { ...c };
        
        switch (editProperty) {
          case 'value':
            updatedComponent.value = parseFloat(editValue) || 0;
            break;
          case 'unit':
            updatedComponent.unit = editValue;
            break;
          case 'batteryType':
            updatedComponent.properties.batteryType = editValue as 'DC' | 'AC';
            break;
          case 'frequency':
            updatedComponent.properties.frequency = parseFloat(editValue) || 0;
            break;
          case 'turnsRatio':
            updatedComponent.properties.turnsRatio = parseFloat(editValue) || 1;
            break;
          case 'forwardVoltage':
            updatedComponent.properties.forwardVoltage = parseFloat(editValue) || 0;
            break;
          case 'powerConsumption':
            updatedComponent.properties.powerConsumption = parseFloat(editValue) || 0;
            break;
          case 'operatingVoltage':
            updatedComponent.properties.operatingVoltage = parseFloat(editValue) || 120;
            break;
          case 'operatingCurrent':
            updatedComponent.properties.operatingCurrent = parseFloat(editValue) || 0;
            break;
          case 'efficiency':
            updatedComponent.properties.efficiency = parseFloat(editValue) || 0;
            break;
          case 'coolingCapacity':
            updatedComponent.properties.coolingCapacity = parseFloat(editValue) || 0;
            break;
          case 'heatingCapacity':
            updatedComponent.properties.heatingCapacity = parseFloat(editValue) || 0;
            break;
          case 'screenSize':
            updatedComponent.properties.screenSize = parseFloat(editValue) || 0;
            break;
          case 'fanSpeed':
            updatedComponent.properties.fanSpeed = parseFloat(editValue) || 0;
            break;
          case 'motorType':
            updatedComponent.properties.motorType = editValue as 'induction' | 'brushless' | 'stepper';
            break;
        }
        
        return updatedComponent;
      }
      return c;
    });

    const updatedCircuit = {
      ...circuit,
      components: updatedComponents,
      metadata: {
        ...circuit.metadata,
        updatedAt: new Date()
      }
    };

    onCircuitUpdate(updatedCircuit);
    setEditingComponent(null);
    setEditValue('');
    setShowEditModal(false);
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (data) {
      try {
        const component = JSON.parse(data);
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const x = (e.clientX - rect.left - panOffset.x) / zoom;
          const y = (e.clientY - rect.top - panOffset.y) / zoom;
          
          const newComponent = {
            ...component,
            id: `${component.type}-${Date.now()}`,
            position: { x, y }
          };
          
          const updatedCircuit = {
            ...circuit,
            components: [...circuit.components, newComponent],
            metadata: {
              ...circuit.metadata,
              updatedAt: new Date()
            }
          };
          
          onCircuitUpdate(updatedCircuit);
        }
      } catch (error) {
        console.error('Error parsing dropped component:', error);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Delete selected component
  const deleteSelectedComponent = () => {
    if (!selectedComponent) return;

    const updatedCircuit = {
      ...circuit,
      components: circuit.components.filter(c => c.id !== selectedComponent),
      connections: circuit.connections.filter(
        conn => conn.from !== selectedComponent && conn.to !== selectedComponent
      ),
      metadata: {
        ...circuit.metadata,
        updatedAt: new Date()
      }
    };

    onCircuitUpdate(updatedCircuit);
    setSelectedComponent(null);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Canvas Header */}
      <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">Circuit Canvas</h2>
          {isAnalyzing && (
            <div className="flex items-center text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Analyzing...
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Mode buttons */}
          <button
            onClick={() => setConnectionMode(!connectionMode)}
            className={`px-3 py-1 text-sm rounded flex items-center ${
              connectionMode ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Link className="h-3 w-3 mr-1" />
            Connect
          </button>
          
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-3 py-1 text-sm rounded ${
              showGrid ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Grid
          </button>
          
          <label className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded cursor-pointer hover:bg-green-200">
            Upload Image
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 relative overflow-hidden bg-gray-50">
        <div
          ref={containerRef}
          className="w-full h-full bg-gray-50 relative overflow-auto"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onMouseDown={handleMouseDown as any}
          onMouseMove={handleMouseMove as any}
          onMouseUp={handleMouseUp as any}
          onWheel={handleWheel as any}
        >
          <canvas
            ref={canvasRef}
            className="block cursor-crosshair bg-white border border-gray-200 shadow-sm"
            style={{ minWidth: CANVAS_WIDTH, minHeight: CANVAS_HEIGHT }}
            onDoubleClick={handleDoubleClick}
          />
          
          {/* Instructions overlay */}
          <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-sm text-sm text-gray-600">
            <div className="space-y-1">
              <div><strong>Drag:</strong> Move components</div>
              <div><strong>Double-click:</strong> Edit values</div>
              <div><strong>Connect mode:</strong> Link components</div>
              <div><strong>Wheel:</strong> Zoom in/out</div>
              <div><strong>Right-click:</strong> Pan canvas</div>
            </div>
          </div>
        </div>
        
        {/* Component Editing Modal */}
        {showEditModal && editingComponent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Edit Component
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingComponent(null);
                    setEditValue('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              {(() => {
                const component = circuit.components.find(c => c.id === editingComponent);
                if (!component) return null;

                return (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Component Type
                      </label>
                      <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
                        {component.type.toUpperCase()} - {component.properties.description}
                      </div>
                    </div>

                    {/* Basic Value */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Value
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          value={editProperty === 'value' ? editValue : component.value.toString()}
                          onChange={(e) => {
                            setEditProperty('value');
                            setEditValue(e.target.value);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={component.unit}
                          onChange={(e) => {
                            setEditProperty('unit');
                            setEditValue(e.target.value);
                          }}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Battery-specific fields */}
                    {component.type === 'battery' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Battery Type
                          </label>
                          <select
                            value={component.properties.batteryType || 'DC'}
                            onChange={(e) => {
                              setEditProperty('batteryType');
                              setEditValue(e.target.value);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="DC">DC</option>
                            <option value="AC">AC</option>
                          </select>
                        </div>
                        {component.properties.batteryType === 'AC' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Frequency (Hz)
                            </label>
                            <input
                              type="number"
                              value={editProperty === 'frequency' ? editValue : (component.properties.frequency || 60).toString()}
                              onChange={(e) => {
                                setEditProperty('frequency');
                                setEditValue(e.target.value);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        )}
                      </>
                    )}

                    {/* Transformer-specific fields */}
                    {component.type === 'transformer' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Turns Ratio
                        </label>
                        <input
                          type="number"
                          value={editProperty === 'turnsRatio' ? editValue : (component.properties.turnsRatio || 1).toString()}
                          onChange={(e) => {
                            setEditProperty('turnsRatio');
                            setEditValue(e.target.value);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {/* Diode-specific fields */}
                    {component.type === 'diode' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Forward Voltage (V)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={editProperty === 'forwardVoltage' ? editValue : (component.properties.forwardVoltage || 0.7).toString()}
                          onChange={(e) => {
                            setEditProperty('forwardVoltage');
                            setEditValue(e.target.value);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {/* Appliance-specific fields */}
                    {['fan', 'light', 'tv', 'ac', 'motor', 'heater'].includes(component.type) && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Power Consumption (W)
                          </label>
                          <input
                            type="number"
                            value={editProperty === 'powerConsumption' ? editValue : (component.properties.powerConsumption || 0).toString()}
                            onChange={(e) => {
                              setEditProperty('powerConsumption');
                              setEditValue(e.target.value);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Operating Voltage (V)
                          </label>
                          <input
                            type="number"
                            value={editProperty === 'operatingVoltage' ? editValue : (component.properties.operatingVoltage || 120).toString()}
                            onChange={(e) => {
                              setEditProperty('operatingVoltage');
                              setEditValue(e.target.value);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Operating Current (A)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={editProperty === 'operatingCurrent' ? editValue : (component.properties.operatingCurrent || 0).toString()}
                            onChange={(e) => {
                              setEditProperty('operatingCurrent');
                              setEditValue(e.target.value);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Efficiency (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editProperty === 'efficiency' ? editValue : (component.properties.efficiency || 0).toString()}
                            onChange={(e) => {
                              setEditProperty('efficiency');
                              setEditValue(e.target.value);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </>
                    )}

                    {/* AC-specific fields */}
                    {component.type === 'ac' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cooling Capacity (BTU)
                        </label>
                        <input
                          type="number"
                          value={editProperty === 'coolingCapacity' ? editValue : (component.properties.coolingCapacity || 0).toString()}
                          onChange={(e) => {
                            setEditProperty('coolingCapacity');
                            setEditValue(e.target.value);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {/* Heater-specific fields */}
                    {component.type === 'heater' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Heating Capacity (W)
                        </label>
                        <input
                          type="number"
                          value={editProperty === 'heatingCapacity' ? editValue : (component.properties.heatingCapacity || 0).toString()}
                          onChange={(e) => {
                            setEditProperty('heatingCapacity');
                            setEditValue(e.target.value);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {/* TV-specific fields */}
                    {component.type === 'tv' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Screen Size (inches)
                        </label>
                        <input
                          type="number"
                          value={editProperty === 'screenSize' ? editValue : (component.properties.screenSize || 0).toString()}
                          onChange={(e) => {
                            setEditProperty('screenSize');
                            setEditValue(e.target.value);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {/* Fan-specific fields */}
                    {component.type === 'fan' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fan Speed (RPM)
                        </label>
                        <input
                          type="number"
                          value={editProperty === 'fanSpeed' ? editValue : (component.properties.fanSpeed || 0).toString()}
                          onChange={(e) => {
                            setEditProperty('fanSpeed');
                            setEditValue(e.target.value);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {/* Motor-specific fields */}
                    {component.type === 'motor' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Motor Type
                        </label>
                        <select
                          value={component.properties.motorType || 'induction'}
                          onChange={(e) => {
                            setEditProperty('motorType');
                            setEditValue(e.target.value);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="induction">Induction</option>
                          <option value="brushless">Brushless</option>
                          <option value="stepper">Stepper</option>
                        </select>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <button
                        onClick={() => {
                          setShowEditModal(false);
                          setEditingComponent(null);
                          setEditValue('');
                        }}
                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          // Delete component
                          const updatedCircuit = {
                            ...circuit,
                            components: circuit.components.filter(c => c.id !== editingComponent),
                            metadata: {
                              ...circuit.metadata,
                              updatedAt: new Date()
                            }
                          };
                          onCircuitUpdate(updatedCircuit);
                          setShowEditModal(false);
                          setEditingComponent(null);
                          setEditValue('');
                        }}
                        className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={handleValueEdit}
                        className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Canvas Footer */}
      <div className="flex justify-between items-center p-4 border-t bg-gray-50 flex-shrink-0">
        <div className="text-sm text-gray-600">
          Components: {circuit.components.length} | 
          Connections: {circuit.connections.length} |
          Zoom: {Math.round(zoom * 100)}%
          {connectionMode && <span className="ml-2 text-orange-600">• Connection Mode</span>}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Component actions */}
          {selectedComponent && (
            <>
              <button
                onClick={() => {
                  const component = circuit.components.find(c => c.id === selectedComponent);
                  if (component) {
                    setEditingComponent(component.id);
                    setEditValue(component.value.toString());
                  }
                }}
                className="px-2 py-1 text-sm bg-blue-200 text-blue-700 rounded hover:bg-blue-300 flex items-center"
              >
                <Edit3 className="h-3 w-3 mr-1" />
                Edit
              </button>
              <button
                onClick={deleteSelectedComponent}
                className="px-2 py-1 text-sm bg-red-200 text-red-700 rounded hover:bg-red-300 flex items-center"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </button>
            </>
          )}
          
          {/* Zoom controls */}
          <button
            onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
            className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
          >
            -
          </button>
          <span className="text-sm text-gray-600">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.min(3, zoom + 0.1))}
            className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};