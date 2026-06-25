export type ShapeType = 'rect' | 'rrect' | 'ellipse' | 'diamond' | 'text' | 'sticky' | 'arrow' | 'line' | 'pen' | 'image';

export interface Shape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right';
  startShapeId: string | null;
  endShapeId: string | null;
  points?: { x: number; y: number }[]; // For pen strokes
  imageData?: string; // Base64 or URL data for image insertion
  groupId?: string | null; // For shape grouping
  layerId?: string; // Unique layer ID reference
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface WhiteboardScene {
  shapes: Shape[];
  viewport: Viewport;
}

export function genId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 's' + Date.now() + Math.random().toString(36).slice(2, 7);
}

const SHAPE_DEFAULTS: Record<ShapeType, Partial<Shape>> = {
  rect:       { width: 160, height: 80, fill: '#ffffff', stroke: '#333333', strokeWidth: 2 },
  rrect:      { width: 160, height: 80, fill: '#ffffff', stroke: '#333333', strokeWidth: 2 },
  ellipse:    { width: 140, height: 80, fill: '#ffffff', stroke: '#333333', strokeWidth: 2 },
  diamond:    { width: 140, height: 100, fill: '#fff3cd', stroke: '#333333', strokeWidth: 2 },
  text:       { width: 200, height: 40, fill: '#333333', stroke: 'transparent', strokeWidth: 0, text: 'Text' },
  sticky:     { width: 160, height: 160, fill: '#ffeaa7', stroke: '#fdcb6e', strokeWidth: 1 },
  arrow:      { width: 0, height: 0, fill: 'transparent', stroke: '#333333', strokeWidth: 2 },
  line:       { width: 0, height: 0, fill: 'transparent', stroke: '#333333', strokeWidth: 2 },
  pen:        { width: 0, height: 0, fill: 'transparent', stroke: '#333333', strokeWidth: 2 },
  image:      { width: 200, height: 150, fill: 'transparent', stroke: 'transparent', strokeWidth: 0 },
};

export function createShape(type: ShapeType, overrides: Partial<Shape> = {}): Shape {
  const defaults = SHAPE_DEFAULTS[type] || {};
  return {
    id: genId(),
    type,
    x: 0,
    y: 0,
    width: defaults.width || 100,
    height: defaults.height || 60,
    fill: defaults.fill || '#ffffff',
    stroke: defaults.stroke || '#333333',
    strokeWidth: defaults.strokeWidth || 2,
    opacity: 1,
    text: defaults.text || '',
    fontSize: 14,
    fontFamily: 'Arial',
    textAlign: 'center',
    startShapeId: null,
    endShapeId: null,
    groupId: null,
    layerId: 'default',
    ...overrides,
  };
}

export const TOOL_LIST = [
  { id: 'select', label: 'Select', key: 'V' },
  { id: 'pen', label: 'Pen', key: 'P' },
  { id: 'rect', label: 'Rectangle', key: 'R' },
  { id: 'rrect', label: 'Rounded Rect', key: '' },
  { id: 'ellipse', label: 'Ellipse', key: 'E' },
  { id: 'diamond', label: 'Diamond', key: 'D' },
  { id: 'text', label: 'Text', key: 'T' },
  { id: 'arrow', label: 'Arrow', key: 'A' },
  { id: 'sticky', label: 'Sticky Note', key: 'S' },
  { id: 'image', label: 'Image', key: 'I' },
] as const;

export type ToolId = typeof TOOL_LIST[number]['id'];

export const COLORS = [
  '#000000','#808080','#800000','#808000','#008000','#008080','#000080','#800080',
  '#ffffff','#c0c0c0','#ff0000','#ffff00','#00ff00','#00ffff','#0000ff','#ff00ff',
  '#c08040','#406080','#ff8040','#00ff80','#40ffff','#4080ff','#ff40ff','#804000',
];
