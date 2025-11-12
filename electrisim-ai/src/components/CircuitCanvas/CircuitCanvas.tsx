import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Circuit, CircuitAnalysis, Component, Connection, Position } from '../../types/circuit.types';
import { Trash2, Link } from 'lucide-react';

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
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; componentId: string } | null>(null);
  
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
    ctx.lineWidth = 3;

    circuit.connections.forEach(connection => {
      const fromComponent = circuit.components.find(c => c.id === connection.from);
      const toComponent = circuit.components.find(c => c.id === connection.to);

      if (fromComponent && toComponent) {
        // Determine wire color based on connection type or default
        let wireColor = connection.wireColor;
        
        // Auto-detect wire color if not specified (only red and black)
        if (!wireColor) {
          const fromType = fromComponent.type;
          const toType = toComponent.type;

          if (fromType === 'ground' || toType === 'ground') {
            wireColor = 'black';
          } else if (fromType === 'battery' || fromType === 'socket' || toType === 'battery' || toType === 'socket') {
            wireColor = 'red';
          } else {
            wireColor = 'black';
          }
        }

        // Set stroke color based on wire color (default to black)
        switch (wireColor) {
          case 'red':
            ctx.strokeStyle = '#dc2626'; // Red for phase 1 or live
            break;
          case 'green':
            ctx.strokeStyle = '#16a34a'; // Green for phase 2
            break;
          case 'blue':
            ctx.strokeStyle = '#2563eb'; // Blue for phase 3
            break;
          default:
            ctx.strokeStyle = '#1f2937'; // Black for neutral/ground
            wireColor = 'black';
        }

        // Draw connection line
        ctx.beginPath();
        ctx.moveTo(fromComponent.position.x, fromComponent.position.y);
        ctx.lineTo(toComponent.position.x, toComponent.position.y);
        ctx.stroke();

        // Draw connection points with matching color
        ctx.fillStyle = ctx.strokeStyle;
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

    // Draw component label (value and unit) - below component, not overlapping
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Add background for better readability
    const labelText = `${value}${unit}`;
    const textMetrics = ctx.measureText(labelText);
    const labelWidth = textMetrics.width + 4;
    const labelHeight = 12;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(
      position.x - labelWidth/2,
      position.y + height/2 + 12,
      labelWidth,
      labelHeight
    );
    
    ctx.fillStyle = '#1f2937';
    ctx.fillText(
      labelText,
      position.x,
      position.y + height/2 + 14
    );

    // Draw analysis values if available (normal text, no green hue)
    if (analysis) {
      const voltage = analysis.voltages[component.id];
      const current = analysis.currents[component.id];
      
      if (voltage !== undefined && current !== undefined) {
        ctx.font = '8px Arial';
        ctx.fillStyle = '#374151'; // Normal gray text, no green
        
        // Add subtle background for analysis values
        const analysisText = `V:${voltage.toFixed(1)}V I:${current.toFixed(2)}A`;
        const analysisMetrics = ctx.measureText(analysisText);
        const analysisWidth = analysisMetrics.width + 4;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(
          position.x - analysisWidth/2,
          position.y - height/2 - 16,
          analysisWidth,
          12
        );
        
        ctx.fillStyle = '#374151';
        ctx.fillText(
          analysisText,
          position.x,
          position.y - height/2 - 8
        );
        
        // Power value with background
        const powerText = `P:${(analysis.power[component.id] || 0).toFixed(1)}W`;
        const powerMetrics = ctx.measureText(powerText);
        const powerWidth = powerMetrics.width + 4;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(
          position.x - powerWidth/2,
          position.y - height/2 - 2,
          powerWidth,
          12
        );
        
        ctx.fillStyle = '#374151';
        ctx.fillText(
          powerText,
          position.x,
          position.y - height/2 + 2
        );
      }
    }
  };

  // Draw component symbol
  const drawComponentSymbol = (ctx: CanvasRenderingContext2D, component: Component, position: Position) => {
    ctx.strokeStyle = '#374151';
    ctx.fillStyle = '#374151';
    ctx.lineWidth = 2;

    switch (component.type) {
      case 'battery':
        // Battery symbol
        ctx.beginPath();
        ctx.moveTo(position.x - 15, position.y);
        ctx.lineTo(position.x - 10, position.y);
        ctx.moveTo(position.x + 10, position.y);
        ctx.lineTo(position.x + 15, position.y);
        ctx.stroke();
        ctx.fillRect(position.x - 10, position.y - 8, 20, 16);
        break;

      case 'resistor':
        // Resistor zigzag
        ctx.beginPath();
        ctx.moveTo(position.x - 15, position.y);
        ctx.lineTo(position.x - 10, position.y - 5);
        ctx.lineTo(position.x - 5, position.y + 5);
        ctx.lineTo(position.x, position.y - 5);
        ctx.lineTo(position.x + 5, position.y + 5);
        ctx.lineTo(position.x + 10, position.y - 5);
        ctx.lineTo(position.x + 15, position.y);
        ctx.stroke();
        break;

      case 'capacitor':
        // Capacitor parallel lines
        ctx.beginPath();
        ctx.moveTo(position.x - 15, position.y);
        ctx.lineTo(position.x - 5, position.y);
        ctx.moveTo(position.x + 5, position.y);
        ctx.lineTo(position.x + 15, position.y);
        ctx.stroke();
        ctx.fillRect(position.x - 5, position.y - 8, 2, 16);
        ctx.fillRect(position.x + 3, position.y - 8, 2, 16);
        break;

      case 'inductor':
        // Inductor coils
        ctx.beginPath();
        ctx.arc(position.x - 5, position.y, 5, 0, Math.PI);
        ctx.arc(position.x, position.y, 5, Math.PI, 0);
        ctx.arc(position.x + 5, position.y, 5, 0, Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(position.x - 15, position.y);
        ctx.lineTo(position.x - 10, position.y);
        ctx.moveTo(position.x + 10, position.y);
        ctx.lineTo(position.x + 15, position.y);
        ctx.stroke();
        break;

      case 'led':
        // LED with arrow
        ctx.beginPath();
        ctx.moveTo(position.x - 15, position.y);
        ctx.lineTo(position.x - 5, position.y);
        ctx.moveTo(position.x + 5, position.y);
        ctx.lineTo(position.x + 15, position.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(position.x, position.y, 6, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(position.x - 2, position.y - 3);
        ctx.lineTo(position.x + 2, position.y);
        ctx.lineTo(position.x - 2, position.y + 3);
        ctx.fill();
        break;

      case 'diode':
        // Diode triangle
        ctx.beginPath();
        ctx.moveTo(position.x - 10, position.y);
        ctx.lineTo(position.x, position.y - 8);
        ctx.lineTo(position.x, position.y + 8);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(position.x - 15, position.y);
        ctx.lineTo(position.x - 10, position.y);
        ctx.moveTo(position.x, position.y);
        ctx.lineTo(position.x + 15, position.y);
        ctx.stroke();
        break;

      case 'switch':
        // Switch symbol
        ctx.beginPath();
        ctx.moveTo(position.x - 15, position.y);
        ctx.lineTo(position.x - 5, position.y);
        ctx.moveTo(position.x + 5, position.y);
        ctx.lineTo(position.x + 15, position.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(position.x, position.y - 5, 3, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(position.x - 5, position.y);
        ctx.lineTo(position.x, position.y - 5);
        ctx.stroke();
        break;

      case 'ground':
        // Ground symbol
        ctx.beginPath();
        ctx.moveTo(position.x, position.y);
        ctx.lineTo(position.x, position.y + 10);
        ctx.lineTo(position.x - 8, position.y + 10);
        ctx.lineTo(position.x + 8, position.y + 10);
        ctx.lineTo(position.x - 4, position.y + 14);
        ctx.lineTo(position.x + 4, position.y + 14);
        ctx.stroke();
        break;

      default:
        // Default: circle with component type initial
        ctx.beginPath();
        ctx.arc(position.x, position.y, 12, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          component.type.charAt(0).toUpperCase(),
          position.x,
          position.y
        );
    }
  };

  // Draw port circles
  const drawPortCircles = (ctx: CanvasRenderingContext2D, component: Component) => {
    const { position, ports } = component;
    const portRadius = 3;

    for (let i = 0; i < ports; i++) {
      const angle = (2 * Math.PI * i) / ports;
      const portX = position.x + Math.cos(angle) * (COMPONENT_SIZE / 2 + 5);
      const portY = position.y + Math.sin(angle) * (COMPONENT_SIZE / 2 + 5);

      ctx.fillStyle = '#6b7280';
      ctx.beginPath();
      ctx.arc(portX, portY, portRadius, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  // Find component at position
  const findComponentAt = (x: number, y: number): Component | null => {
    return circuit.components.find(component => {
      const dx = x - component.position.x;
      const dy = y - component.position.y;
      return Math.sqrt(dx * dx + dy * dy) < COMPONENT_SIZE / 2;
    }) || null;
  };


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

  const drawAnalysisOverlays = (ctx: CanvasRenderingContext2D) => {
    if (!analysis) return;

    // Highlight components with issues
    analysis.issues.forEach(issue => {
      if (!issue.componentId) return;
      const component = circuit.components.find(c => c.id === issue.componentId);
      if (!component) return;

      const { position } = component;

      ctx.save();
      ctx.lineWidth = 3;
      ctx.strokeStyle = issue.severity === 'critical'
        ? '#dc2626'
        : issue.severity === 'high'
          ? '#f97316'
          : '#facc15';
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.rect(
        position.x - COMPONENT_SIZE / 2 - 6,
        position.y - COMPONENT_SIZE / 2 - 6,
        COMPONENT_SIZE + 12,
        COMPONENT_SIZE + 12
      );
      ctx.stroke();
      ctx.restore();

      ctx.save();
      const badgeText = issue.severity.toUpperCase();
      ctx.font = 'bold 9px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = issue.severity === 'critical'
        ? 'rgba(220, 38, 38, 0.9)'
        : issue.severity === 'high'
          ? 'rgba(249, 115, 22, 0.9)'
          : 'rgba(250, 204, 21, 0.9)';
      ctx.fillRect(position.x - 40, position.y - COMPONENT_SIZE / 2 - 28, 80, 16);
      ctx.fillStyle = '#fff';
      ctx.fillText(badgeText, position.x, position.y - COMPONENT_SIZE / 2 - 20);
      ctx.restore();
    });
  };

  // Screen to canvas coordinate conversion
  const screenToCanvas = (screenX: number, screenY: number): Position => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };

    return {
      x: (screenX - rect.left - panOffset.x) / zoom,
      y: (screenY - rect.top - panOffset.y) / zoom
    };
  };

  // Handle mouse down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    const clickedComponent = findComponentAt(canvasPos.x, canvasPos.y);

    if (connectionMode) {
      if (clickedComponent) {
        if (connectionStart) {
          // Complete connection
          if (connectionStart !== clickedComponent.id) {
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
          }
          setConnectionStart(null);
          setConnectionPreview(null);
        } else {
          setConnectionStart(clickedComponent.id);
          setConnectionPreview(canvasPos);
        }
      }
    } else if (clickedComponent) {
      setSelectedComponent(clickedComponent.id);
      setDraggedComponent(clickedComponent.id);
      setDragOffset({
        x: canvasPos.x - clickedComponent.position.x,
        y: canvasPos.y - clickedComponent.position.y
      });
      setIsDragging(true);
    } else {
      // Start panning
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
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

  // Handle double click to edit component (no wire disconnection)
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    const clickedComponent = findComponentAt(canvasPos.x, canvasPos.y);

    if (clickedComponent) {
      // Open edit modal for component
      setEditingComponent(clickedComponent.id);
      setEditValue(clickedComponent.value.toString());
      setEditProperty('value');
      setShowEditModal(true);
    }
  };

  // Handle right click to show context menu
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    const clickedComponent = findComponentAt(canvasPos.x, canvasPos.y);

    if (clickedComponent) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        componentId: clickedComponent.id
      });
    } else {
      setContextMenu(null);
    }
  };

  // Handle context menu actions
  const handleContextMenuAction = (action: string) => {
    if (!contextMenu) return;

    const component = circuit.components.find(c => c.id === contextMenu.componentId);
    if (!component) return;

    switch (action) {
      case 'edit':
        setEditingComponent(component.id);
        setEditValue(component.value.toString());
        setEditProperty('value');
        setShowEditModal(true);
        setContextMenu(null);
        break;

      case 'disconnect':
        // Disconnect all connections from this component
        const updatedConnections = circuit.connections.filter(
          conn => conn.from !== component.id && conn.to !== component.id
        );
        const updatedCircuit = {
          ...circuit,
          connections: updatedConnections,
          metadata: {
            ...circuit.metadata,
            updatedAt: new Date()
          }
        };
        onCircuitUpdate(updatedCircuit);
        setContextMenu(null);
        break;

      case 'delete':
        // Delete component and all its connections
        const filteredConnections = circuit.connections.filter(
          conn => conn.from !== component.id && conn.to !== component.id
        );
        const filteredComponents = circuit.components.filter(c => c.id !== component.id);
        const deletedCircuit = {
          ...circuit,
          components: filteredComponents,
          connections: filteredConnections,
          metadata: {
            ...circuit.metadata,
            updatedAt: new Date()
          }
        };
        onCircuitUpdate(deletedCircuit);
        setContextMenu(null);
        break;

      case 'duplicate':
        // Duplicate component
        const newComponent = {
          ...component,
          id: `${component.type}-${Date.now()}`,
          position: {
            x: component.position.x + 50,
            y: component.position.y + 50
          }
        };
        const duplicatedCircuit = {
          ...circuit,
          components: [...circuit.components, newComponent],
          metadata: {
            ...circuit.metadata,
            updatedAt: new Date()
          }
        };
        onCircuitUpdate(duplicatedCircuit);
        setContextMenu(null);
        break;

      case 'details':
        // Show component details (could open a details modal)
        alert(`Component: ${component.type}\nValue: ${component.value} ${component.unit}\nDescription: ${component.properties.description || 'N/A'}`);
        setContextMenu(null);
        break;
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

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar */}
      <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setConnectionMode(!connectionMode)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              connectionMode
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Link className="h-4 w-4 inline-block mr-1" />
            {connectionMode ? 'Connecting...' : 'Connect'}
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {showGrid ? 'Hide Grid' : 'Show Grid'}
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setZoom(zoom * 0.9)}
              className="px-2 py-1 rounded-md text-sm bg-white text-gray-700 hover:bg-gray-100"
            >
              -
            </button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(zoom * 1.1)}
              className="px-2 py-1 rounded-md text-sm bg-white text-gray-700 hover:bg-gray-100"
            >
              +
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Upload Circuit Image
          </label>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 relative overflow-hidden bg-gray-50">
        <div
          ref={containerRef}
          className="absolute inset-0 overflow-auto"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <canvas
            ref={canvasRef}
            className="block cursor-crosshair bg-white border border-gray-200 shadow-sm"
            style={{ minWidth: CANVAS_WIDTH, minHeight: CANVAS_HEIGHT }}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel as any}
          >
          </canvas>
          
          {/* Instructions overlay */}
          <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-sm text-sm text-gray-600">
            <div className="space-y-1">
              <div><strong>Drag:</strong> Move components</div>
              <div><strong>Double-click:</strong> Edit component</div>
              <div><strong>Right-click:</strong> Component menu</div>
              <div><strong>Connect mode:</strong> Link components</div>
              <div><strong>Wheel:</strong> Zoom in/out</div>
            </div>
          </div>

          {isAnalyzing && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20 pointer-events-none">
              <div className="flex items-center space-x-2 text-gray-700">
                <div className="h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-medium">Analyzing circuit...</span>
              </div>
            </div>
          )}
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-[180px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleContextMenuAction('edit')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            >
              <span>✏️</span>
              <span>Edit Properties</span>
            </button>
            <button
              onClick={() => handleContextMenuAction('disconnect')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            >
              <span>🔌</span>
              <span>Disconnect All</span>
            </button>
            <button
              onClick={() => handleContextMenuAction('duplicate')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            >
              <span>📋</span>
              <span>Duplicate</span>
            </button>
            <button
              onClick={() => handleContextMenuAction('details')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            >
              <span>ℹ️</span>
              <span>View Details</span>
            </button>
            <div className="border-t border-gray-200 my-1"></div>
            <button
              onClick={() => handleContextMenuAction('delete')}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
            >
              <span>🗑️</span>
              <span>Delete Component</span>
            </button>
          </div>
        )}

        {/* Click outside to close context menu */}
        {contextMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
        )}
        
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
                      <input
                        type="text"
                        value={component.type}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Value
                      </label>
                      <input
                        type="number"
                        value={editProperty === 'value' ? editValue : component.value.toString()}
                        onChange={(e) => {
                          setEditProperty('value');
                          setEditValue(e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit
                      </label>
                      <input
                        type="text"
                        value={editProperty === 'unit' ? editValue : component.unit}
                        onChange={(e) => {
                          setEditProperty('unit');
                          setEditValue(e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Battery-specific fields */}
                    {component.type === 'battery' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Battery Type
                          </label>
                          <select
                            value={editProperty === 'batteryType' ? editValue : (component.properties.batteryType || 'DC')}
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
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Frequency (Hz)
                          </label>
                          <input
                            type="number"
                            value={editProperty === 'frequency' ? editValue : (component.properties.frequency || 0).toString()}
                            onChange={(e) => {
                              setEditProperty('frequency');
                              setEditValue(e.target.value);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
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
                          value={editProperty === 'forwardVoltage' ? editValue : (component.properties.forwardVoltage || 0).toString()}
                          onChange={(e) => {
                            setEditProperty('forwardVoltage');
                            setEditValue(e.target.value);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {/* Appliance-specific fields */}
                    {['fan', 'light', 'tv', 'ac', 'heater', 'motor'].includes(component.type) && (
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
                            value={editProperty === 'operatingVoltage' ? editValue : (component.properties.operatingVoltage || 230).toString()}
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
                          value={editProperty === 'motorType' ? editValue : (component.properties.motorType || 'induction')}
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

                    <div className="flex justify-end space-x-2 pt-4 border-t">
                      <button
                        onClick={() => {
                          setShowEditModal(false);
                          setEditingComponent(null);
                          setEditValue('');
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleValueEdit}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CircuitCanvas;
