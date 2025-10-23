import React, { useState } from 'react';
import type { Component } from '../../types/circuit.types';
import { 
  Battery, 
  Minus, 
  Circle,
  Lightbulb, 
  ToggleLeft, 
  Search,
  Plus,
  Star,
  Filter,
  Zap,
  RotateCw,
  Square,
  Fan,
  Tv,
  Wind,
  Flame,
  Cpu,
  Gauge,
  Activity,
  BarChart3,
  Shield,
  Power,
  Clock,
  Eye,
  Plug,
  CircleDot
} from 'lucide-react';

interface ComponentLibraryProps {
  onComponentSelect: (component: Component) => void;
}

export const ComponentLibrary: React.FC<ComponentLibraryProps> = ({
  onComponentSelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Professional electrical component templates
  const componentTemplates: Component[] = [
    // Power Sources
    {
      id: 'battery-dc-9v-template',
      type: 'battery',
      value: 9,
      unit: 'V',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: '9V DC Battery',
        commonUse: 'Small electronics, Arduino projects',
        batteryType: 'DC',
        voltageRating: 9,
        currentRating: 0.5
      }
    },
    {
      id: 'battery-dc-12v-template',
      type: 'battery',
      value: 12,
      unit: 'V',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: '12V DC Battery',
        commonUse: 'Automotive, power supplies',
        batteryType: 'DC',
        voltageRating: 12,
        currentRating: 10
      }
    },
    {
      id: 'ac-source-120v-template',
      type: 'battery',
      value: 120,
      unit: 'V',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: '120V AC Source',
        commonUse: 'Mains power simulation',
        batteryType: 'AC',
        frequency: 60,
        voltageRating: 120,
        currentRating: 15
      }
    },
    {
      id: 'ac-source-240v-template',
      type: 'battery',
      value: 240,
      unit: 'V',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: '240V AC Source',
        commonUse: 'European mains power',
        batteryType: 'AC',
        frequency: 50,
        voltageRating: 240,
        currentRating: 15
      }
    },

    // Passive Components
    {
      id: 'resistor-1k-template',
      type: 'resistor',
      value: 1000,
      unit: 'Ω',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: '1kΩ Resistor',
        commonUse: 'Current limiting, voltage division',
        resistance: 1000,
        powerRating: 0.25,
        tolerance: 5
      }
    },
    {
      id: 'resistor-10k-template',
      type: 'resistor',
      value: 10000,
      unit: 'Ω',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: '10kΩ Resistor',
        commonUse: 'Pull-up/pull-down, biasing',
        resistance: 10000,
        powerRating: 0.25,
        tolerance: 5
      }
    },
    {
      id: 'capacitor-100uf-template',
      type: 'capacitor',
      value: 100,
      unit: 'μF',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: '100μF Capacitor',
        commonUse: 'Power supply filtering',
        capacitance: 100,
        voltageRating: 25,
        dielectricType: 'Electrolytic'
      }
    },
    {
      id: 'inductor-10mh-template',
      type: 'inductor',
      value: 10,
      unit: 'mH',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: '10mH Inductor',
        commonUse: 'Filtering, energy storage',
        inductance: 10,
        currentRating: 1
      }
    },

    // Active Components
    {
      id: 'led-red-template',
      type: 'led',
      value: 2.1,
      unit: 'V',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: 'Red LED',
        commonUse: 'Indicators, displays',
        forwardVoltage: 2.1,
        color: 'red',
        currentRating: 0.02
      }
    },
    {
      id: 'diode-1n4007-template',
      type: 'diode',
      value: 0.7,
      unit: 'V',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: '1N4007 Diode',
        commonUse: 'Rectification, protection',
        forwardVoltage: 0.7,
        reverseVoltage: 1000,
        currentRating: 1
      }
    },
    {
      id: 'transformer-12v-template',
      type: 'transformer',
      value: 12,
      unit: 'V',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 4,
      properties: { 
        description: '12V Transformer',
        commonUse: 'Voltage conversion',
        turnsRatio: 20,
        primaryVoltage: 240,
        secondaryVoltage: 12,
        powerRating: 50
      }
    },

    // Control Components
    {
      id: 'switch-spst-template',
      type: 'switch',
      value: 0,
      unit: '',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: 'SPST Switch',
        commonUse: 'On/off control',
        voltageRating: 250,
        currentRating: 10
      }
    },
    {
      id: 'ground-template',
      type: 'ground',
      value: 0,
      unit: 'V',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 1,
      properties: { 
        description: 'Ground',
        commonUse: 'Reference point',
        voltageRating: 0
      }
    },

    // Appliances
    {
      id: 'led-bulb-template',
      type: 'light',
      value: 9,
      unit: 'W',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: 'LED Bulb',
        commonUse: 'Energy efficient lighting',
        powerConsumption: 9,
        operatingVoltage: 230,
        operatingCurrent: 0.039,
        powerFactor: 0.9,
        efficiency: 90
      }
    },
    {
      id: 'ups-template',
      type: 'ups',
      value: 1000,
      unit: 'VA',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 4,
      properties: { 
        description: 'UPS System',
        commonUse: 'Backup power supply',
        powerConsumption: 1000,
        operatingVoltage: 230,
        operatingCurrent: 4.35,
        powerFactor: 0.8,
        efficiency: 85,
        batteryCapacity: 12,
        backupTime: 30
      }
    },
    {
      id: 'inverter-template',
      type: 'inverter',
      value: 2000,
      unit: 'W',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 4,
      properties: { 
        description: 'Power Inverter',
        commonUse: 'DC to AC conversion',
        powerConsumption: 2000,
        operatingVoltage: 230,
        operatingCurrent: 8.7,
        powerFactor: 0.9,
        efficiency: 90,
        inputVoltage: 12,
        outputFrequency: 50
      }
    },
    {
      id: 'refrigerator-template',
      type: 'refrigerator',
      value: 150,
      unit: 'W',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: 'Refrigerator',
        commonUse: 'Food preservation',
        powerConsumption: 150,
        operatingVoltage: 230,
        operatingCurrent: 0.65,
        powerFactor: 0.8,
        efficiency: 75,
        coolingCapacity: 200,
        compressorType: 'reciprocating'
      }
    },
    {
      id: 'washing-machine-template',
      type: 'washing-machine',
      value: 2000,
      unit: 'W',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: 'Washing Machine',
        commonUse: 'Clothes washing',
        powerConsumption: 2000,
        operatingVoltage: 230,
        operatingCurrent: 8.7,
        powerFactor: 0.85,
        efficiency: 80,
        capacity: 7,
        motorType: 'induction'
      }
    },
    {
      id: 'microwave-template',
      type: 'microwave',
      value: 1200,
      unit: 'W',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: 'Microwave Oven',
        commonUse: 'Food heating',
        powerConsumption: 1200,
        operatingVoltage: 230,
        operatingCurrent: 5.22,
        powerFactor: 0.9,
        efficiency: 70,
        capacity: 25,
        frequency: 2450
      }
    },
    {
      id: 'dishwasher-template',
      type: 'dishwasher',
      value: 1800,
      unit: 'W',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: 'Dishwasher',
        commonUse: 'Dish cleaning',
        powerConsumption: 1800,
        operatingVoltage: 230,
        operatingCurrent: 7.83,
        powerFactor: 0.85,
        efficiency: 75,
        capacity: 12,
        waterHeating: true
      }
    },
    {
      id: 'water-heater-template',
      type: 'water-heater',
      value: 3000,
      unit: 'W',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: 'Water Heater',
        commonUse: 'Water heating',
        powerConsumption: 3000,
        operatingVoltage: 230,
        operatingCurrent: 13.04,
        powerFactor: 1.0,
        efficiency: 95,
        capacity: 50,
        heatingElement: 'resistive'
      }
    },
    {
      id: 'electric-stove-template',
      type: 'electric-stove',
      value: 4000,
      unit: 'W',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: 'Electric Stove',
        commonUse: 'Cooking',
        powerConsumption: 4000,
        operatingVoltage: 230,
        operatingCurrent: 17.39,
        powerFactor: 1.0,
        efficiency: 90,
        burners: 4,
        heatingElement: 'induction'
      }
    },
    {
      id: 'electric-oven-template',
      type: 'electric-oven',
      value: 2500,
      unit: 'W',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: 'Electric Oven',
        commonUse: 'Baking and roasting',
        powerConsumption: 2500,
        operatingVoltage: 230,
        operatingCurrent: 10.87,
        powerFactor: 1.0,
        efficiency: 85,
        capacity: 60,
        temperatureRange: '50-250°C'
      }
    },
    {
      id: 'air-conditioner-template',
      type: 'ac',
      value: 2000,
      unit: 'W',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: 'Air Conditioner',
        commonUse: 'Room cooling',
        powerConsumption: 2000,
        operatingVoltage: 230,
        operatingCurrent: 8.7,
        powerFactor: 0.85,
        efficiency: 80,
        coolingCapacity: 18000,
        refrigerant: 'R410A'
      }
    },
    {
      id: 'heat-pump-template',
      type: 'heat-pump',
      value: 3000,
      unit: 'W',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: 'Heat Pump',
        commonUse: 'Heating and cooling',
        powerConsumption: 3000,
        operatingVoltage: 230,
        operatingCurrent: 13.04,
        powerFactor: 0.9,
        efficiency: 95,
        heatingCapacity: 12000,
        coolingCapacity: 10000
      }
    },
    {
      id: 'electric-boiler-template',
      type: 'electric-boiler',
      value: 6000,
      unit: 'W',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: 'Electric Boiler',
        commonUse: 'Central heating',
        powerConsumption: 6000,
        operatingVoltage: 230,
        operatingCurrent: 26.09,
        powerFactor: 1.0,
        efficiency: 98,
        capacity: 200,
        pressure: 3
      }
    },
    {
      id: 'ceiling-fan-template',
      type: 'fan',
      value: 75,
      unit: 'W',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: 'Ceiling Fan',
        commonUse: 'Air circulation',
        powerConsumption: 75,
        operatingVoltage: 230,
        operatingCurrent: 0.33,
        fanSpeed: 300
      }
    },
    {
      id: 'tv-template',
      type: 'tv',
      value: 150,
      unit: 'W',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: 'Television',
        commonUse: 'Entertainment',
        powerConsumption: 150,
        operatingVoltage: 230,
        operatingCurrent: 0.65
      }
    },
    {
      id: 'ac-template',
      type: 'ac',
      value: 1500,
      unit: 'W',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: 'Air Conditioner',
        commonUse: 'Cooling',
        powerConsumption: 1500,
        operatingVoltage: 230,
        operatingCurrent: 6.52,
        coolingCapacity: 12000
      }
    },
    {
      id: 'heater-template',
      type: 'heater',
      value: 1500,
      unit: 'W',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: 'Electric Heater',
        commonUse: 'Space heating',
        powerConsumption: 1500,
        operatingVoltage: 230,
        operatingCurrent: 6.52,
        heatingCapacity: 1500
      }
    },
    {
      id: 'motor-template',
      type: 'motor',
      value: 750,
      unit: 'W',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: 'Induction Motor',
        commonUse: 'Mechanical work',
        powerConsumption: 750,
        operatingVoltage: 230,
        operatingCurrent: 3.26,
        motorType: 'induction'
      }
    },

    // Meters
    {
      id: 'voltmeter-template',
      type: 'voltmeter',
      value: 0,
      unit: 'V',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: 'Digital Voltmeter',
        commonUse: 'Voltage measurement',
        measurementRange: 1000,
        accuracy: 0.1,
        displayType: 'digital',
        voltageRating: 1000,
        currentRating: 0.001
      }
    },
    {
      id: 'ammeter-template',
      type: 'ammeter',
      value: 0,
      unit: 'A',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: 'Digital Ammeter',
        commonUse: 'Current measurement',
        measurementRange: 10,
        accuracy: 0.1,
        displayType: 'digital',
        voltageRating: 100,
        currentRating: 10
      }
    },
    {
      id: 'wattmeter-template',
      type: 'wattmeter',
      value: 0,
      unit: 'W',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 4,
      properties: { 
        description: 'Digital Wattmeter',
        commonUse: 'Power measurement',
        measurementRange: 5000,
        accuracy: 0.2,
        displayType: 'digital',
        voltageRating: 1000,
        currentRating: 20
      }
    },

    // Protection Devices
    {
      id: 'fuse-5a-template',
      type: 'fuse',
      value: 5,
      unit: 'A',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: '5A Fuse',
        commonUse: 'Overcurrent protection',
        fuseRating: 5,
        fuseType: 'fast',
        voltageRating: 250,
        breakingCapacity: 1.5
      }
    },
    {
      id: 'mcb-16a-template',
      type: 'mcb',
      value: 16,
      unit: 'A',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: '16A MCB',
        commonUse: 'Circuit protection',
        tripCurrent: 16,
        breakingCapacity: 6,
        voltageRating: 230
      }
    },
    {
      id: 'rccb-30ma-template',
      type: 'rccb',
      value: 30,
      unit: 'mA',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 2,
      properties: { 
        description: '30mA RCCB',
        commonUse: 'Earth leakage protection',
        sensitivity: 30,
        voltageRating: 230,
        currentRating: 32
      }
    },

    // Control Devices
    {
      id: 'contactor-template',
      type: 'contactor',
      value: 24,
      unit: 'V',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 6,
      properties: { 
        description: '24V Contactor',
        commonUse: 'Motor control',
        coilVoltage: 24,
        contactRating: 25,
        voltageRating: 230
      }
    },
    {
      id: 'relay-template',
      type: 'relay',
      value: 12,
      unit: 'V',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 5,
      properties: { 
        description: '12V Relay',
        commonUse: 'Switching control',
        coilVoltage: 12,
        contactRating: 10,
        voltageRating: 250
      }
    },
    {
      id: 'timer-template',
      type: 'timer',
      value: 0,
      unit: 's',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 4,
      properties: { 
        description: 'Digital Timer',
        commonUse: 'Time control',
        timerType: 'on-delay',
        timerRange: 999,
        voltageRating: 24
      }
    },

    // Sensors
    {
      id: 'temperature-sensor-template',
      type: 'sensor',
      value: 0,
      unit: '°C',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 3,
      properties: { 
        description: 'Temperature Sensor',
        commonUse: 'Temperature monitoring',
        sensorType: 'temperature',
        sensingRange: 100,
        outputType: 'analog',
        voltageRating: 5
      }
    },
    {
      id: 'motion-sensor-template',
      type: 'sensor',
      value: 0,
      unit: 'V',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 3,
      properties: { 
        description: 'Motion Sensor',
        commonUse: 'Motion detection',
        sensorType: 'motion',
        sensingRange: 10,
        outputType: 'digital',
        voltageRating: 12
      }
    },

    // Distribution
    {
      id: 'socket-template',
      type: 'socket',
      value: 16,
      unit: 'A',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 3,
      properties: { 
        description: '16A Socket',
        commonUse: 'Power outlet',
        socketType: 'single',
        socketRating: 16,
        voltageRating: 230
      }
    },
    {
      id: 'junction-template',
      type: 'junction',
      value: 0,
      unit: '',
      position: { x: 0, y: 0 },
      rotation: 0,
      connections: [],
      ports: 6,
      properties: { 
        description: 'Junction Box',
        commonUse: 'Wire connections',
        voltageRating: 230
      }
    }
  ];

  // Enhanced categories with counts
  const categories = [
    { id: 'all', name: 'All', icon: Circle, count: componentTemplates.length },
    { id: 'power', name: 'Power', icon: Battery, count: componentTemplates.filter(c => c.type === 'battery').length },
    { id: 'passive', name: 'Passive', icon: Square, count: componentTemplates.filter(c => ['resistor', 'capacitor', 'inductor'].includes(c.type)).length },
    { id: 'active', name: 'Active', icon: Zap, count: componentTemplates.filter(c => ['led', 'diode', 'transformer'].includes(c.type)).length },
    { id: 'control', name: 'Control', icon: ToggleLeft, count: componentTemplates.filter(c => ['switch', 'ground'].includes(c.type)).length },
    { id: 'appliances', name: 'Appliances', icon: Lightbulb, count: componentTemplates.filter(c => ['light', 'fan', 'tv', 'ac', 'heater', 'motor'].includes(c.type)).length },
    { id: 'meters', name: 'Meters', icon: Gauge, count: componentTemplates.filter(c => ['voltmeter', 'ammeter', 'wattmeter'].includes(c.type)).length },
    { id: 'protection', name: 'Protection', icon: Shield, count: componentTemplates.filter(c => ['fuse', 'mcb', 'rccb'].includes(c.type)).length },
    { id: 'control-devices', name: 'Control Devices', icon: Power, count: componentTemplates.filter(c => ['contactor', 'relay', 'timer'].includes(c.type)).length },
    { id: 'sensors', name: 'Sensors', icon: Eye, count: componentTemplates.filter(c => c.type === 'sensor').length },
    { id: 'distribution', name: 'Distribution', icon: Plug, count: componentTemplates.filter(c => ['socket', 'junction'].includes(c.type)).length }
  ];

  // Filter components based on search and category
  const filteredComponents = componentTemplates.filter(component => {
    const matchesSearch = component.properties.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         component.properties.commonUse?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         component.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
                           (selectedCategory === 'power' && component.type === 'battery') ||
                           (selectedCategory === 'passive' && ['resistor', 'capacitor', 'inductor'].includes(component.type)) ||
                           (selectedCategory === 'active' && ['led', 'diode', 'transformer'].includes(component.type)) ||
                           (selectedCategory === 'control' && ['switch', 'ground'].includes(component.type)) ||
                           (selectedCategory === 'appliances' && ['light', 'fan', 'tv', 'ac', 'heater', 'motor'].includes(component.type)) ||
                           (selectedCategory === 'meters' && ['voltmeter', 'ammeter', 'wattmeter'].includes(component.type)) ||
                           (selectedCategory === 'protection' && ['fuse', 'mcb', 'rccb'].includes(component.type)) ||
                           (selectedCategory === 'control-devices' && ['contactor', 'relay', 'timer'].includes(component.type)) ||
                           (selectedCategory === 'sensors' && component.type === 'sensor') ||
                           (selectedCategory === 'distribution' && ['socket', 'junction'].includes(component.type));
    
    const matchesFavorites = !showFavorites || favorites.has(component.id);
    
    return matchesSearch && matchesCategory && matchesFavorites;
  });

  // Get component icon
  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'battery': return Battery;
      case 'resistor': return Minus;
      case 'capacitor': return Square;
      case 'inductor': return RotateCw;
      case 'led': return Lightbulb;
      case 'diode': return Zap;
      case 'transformer': return Square;
      case 'switch': return ToggleLeft;
      case 'ground': return Minus;
      case 'light': return Lightbulb;
      case 'fan': return Fan;
      case 'tv': return Tv;
      case 'ac': return Wind;
      case 'heater': return Flame;
      case 'motor': return Cpu;
      case 'voltmeter': return Gauge;
      case 'ammeter': return Activity;
      case 'wattmeter': return BarChart3;
      case 'fuse': return Shield;
      case 'mcb': return Shield;
      case 'rccb': return Shield;
      case 'contactor': return Power;
      case 'relay': return Power;
      case 'timer': return Clock;
      case 'sensor': return Eye;
      case 'socket': return Plug;
      case 'junction': return CircleDot;
      default: return Circle;
    }
  };

  // Get component color
  const getComponentColor = (type: string) => {
    switch (type) {
      case 'battery': return 'text-green-600 bg-green-100';
      case 'resistor': return 'text-yellow-600 bg-yellow-100';
      case 'capacitor': return 'text-blue-600 bg-blue-100';
      case 'inductor': return 'text-purple-600 bg-purple-100';
      case 'led': return 'text-red-600 bg-red-100';
      case 'diode': return 'text-orange-600 bg-orange-100';
      case 'transformer': return 'text-indigo-600 bg-indigo-100';
      case 'switch': return 'text-gray-600 bg-gray-100';
      case 'ground': return 'text-gray-600 bg-gray-100';
      case 'light': return 'text-yellow-600 bg-yellow-100';
      case 'fan': return 'text-blue-600 bg-blue-100';
      case 'tv': return 'text-purple-600 bg-purple-100';
      case 'ac': return 'text-cyan-600 bg-cyan-100';
      case 'heater': return 'text-red-600 bg-red-100';
      case 'motor': return 'text-indigo-600 bg-indigo-100';
      case 'voltmeter': return 'text-blue-600 bg-blue-100';
      case 'ammeter': return 'text-purple-600 bg-purple-100';
      case 'wattmeter': return 'text-indigo-600 bg-indigo-100';
      case 'fuse': return 'text-red-600 bg-red-100';
      case 'mcb': return 'text-red-600 bg-red-100';
      case 'rccb': return 'text-red-600 bg-red-100';
      case 'contactor': return 'text-orange-600 bg-orange-100';
      case 'relay': return 'text-orange-600 bg-orange-100';
      case 'timer': return 'text-orange-600 bg-orange-100';
      case 'sensor': return 'text-teal-600 bg-teal-100';
      case 'socket': return 'text-green-600 bg-green-100';
      case 'junction': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const toggleFavorite = (componentId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(componentId)) {
      newFavorites.delete(componentId);
    } else {
      newFavorites.add(componentId);
    }
    setFavorites(newFavorites);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Component Library</h2>
            <p className="text-sm text-gray-600">Drag components to canvas or click to add</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className={`p-2 rounded-xl transition-all duration-200 ${
                showFavorites 
                  ? 'bg-yellow-100 text-yellow-600 shadow-md' 
                  : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
              }`}
              title={showFavorites ? 'Show all components' : 'Show favorites only'}
            >
              <Star className={`h-5 w-5 ${showFavorites ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={() => setSearchTerm('')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
              title="Clear search"
            >
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 text-base"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {category.name}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  selectedCategory === category.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {category.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Components */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {filteredComponents.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No components found</h3>
              <p className="text-gray-600">Try a different search term or category</p>
            </div>
          ) : (
            filteredComponents.map((component) => {
              const IconComponent = getComponentIcon(component.type);
              const colorClass = getComponentColor(component.type);
              const isFavorite = favorites.has(component.id);
              
              return (
                <div
                  key={component.id}
                  className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  onClick={() => onComponentSelect(component)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${colorClass}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-base">
                            {component.properties.description}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {component.properties.commonUse}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(component.id);
                        }}
                        className={`p-1 rounded-lg transition-colors ${
                          isFavorite 
                            ? 'text-yellow-500 hover:text-yellow-600' 
                            : 'text-gray-300 hover:text-yellow-500'
                        }`}
                      >
                        <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm">
                          <span className="text-gray-500">Value:</span>
                          <span className="ml-1 font-medium text-gray-900">
                            {component.value}{component.unit}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Ports:</span>
                          <span className="ml-1 font-medium text-gray-900">
                            {component.ports}
                          </span>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* Footer */}
        <div className="mt-8 p-4 bg-blue-50 rounded-xl">
          <h4 className="font-medium text-blue-900 mb-2">How to use:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Drag components to canvas or click to add</li>
            <li>• Double-click components on canvas to edit values</li>
            <li>• Use Ctrl+Click to connect components</li>
            <li>• Star components to add to favorites</li>
          </ul>
          <div className="mt-3 text-xs text-blue-700">
            Showing {filteredComponents.length} of {componentTemplates.length} components
          </div>
        </div>
      </div>
    </div>
  );
};