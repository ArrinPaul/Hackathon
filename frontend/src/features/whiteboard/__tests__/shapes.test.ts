import { describe, it, expect } from 'vitest';
import { genId, createShape, TOOL_LIST, COLORS, type Shape, type ShapeType } from '../lib/shapes';

describe('genId', () => {
  it('returns unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => genId()));
    expect(ids.size).toBe(100);
  });

  it('returns a non-empty string', () => {
    const id = genId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });
});

describe('createShape', () => {
  it('creates a rect with correct defaults', () => {
    const shape = createShape('rect');
    expect(shape.type).toBe('rect');
    expect(shape.width).toBe(160);
    expect(shape.height).toBe(80);
    expect(shape.fill).toBe('#ffffff');
    expect(shape.stroke).toBe('#333333');
    expect(shape.strokeWidth).toBe(2);
    expect(shape.opacity).toBe(1);
    expect(shape.text).toBe('');
    expect(shape.fontSize).toBe(14);
    expect(shape.fontFamily).toBe('Arial');
    expect(shape.textAlign).toBe('center');
    expect(shape.startShapeId).toBeNull();
    expect(shape.endShapeId).toBeNull();
  });

  it('creates a diamond with correct defaults', () => {
    const shape = createShape('diamond');
    expect(shape.width).toBe(140);
    expect(shape.height).toBe(100);
    expect(shape.fill).toBe('#fff3cd');
  });

  it('creates a sticky note with correct defaults', () => {
    const shape = createShape('sticky');
    expect(shape.width).toBe(160);
    expect(shape.height).toBe(160);
    expect(shape.fill).toBe('#ffeaa7');
    expect(shape.stroke).toBe('#fdcb6e');
  });

  it('creates an arrow with transparent fill', () => {
    const shape = createShape('arrow');
    expect(shape.fill).toBe('transparent');
    expect(shape.stroke).toBe('#333333');
  });

  it('arrow width/height defaults to 100/60 due to falsy-0 fallback (known issue)', () => {
    const shape = createShape('arrow');
    expect(shape.width).toBe(100);
    expect(shape.height).toBe(60);
  });

  it('applies overrides', () => {
    const shape = createShape('rect', {
      x: 100,
      y: 200,
      width: 300,
      height: 150,
      fill: '#ff0000',
      text: 'Hello',
    });
    expect(shape.x).toBe(100);
    expect(shape.y).toBe(200);
    expect(shape.width).toBe(300);
    expect(shape.height).toBe(150);
    expect(shape.fill).toBe('#ff0000');
    expect(shape.text).toBe('Hello');
  });

  it('generates a unique id for each shape', () => {
    const a = createShape('rect');
    const b = createShape('rect');
    expect(a.id).not.toBe(b.id);
  });

  it('creates a text shape with default text', () => {
    const shape = createShape('text');
    expect(shape.text).toBe('Text');
    expect(shape.width).toBe(200);
    expect(shape.height).toBe(40);
  });

  it('creates each shape type without errors', () => {
    const types: ShapeType[] = ['rect', 'rrect', 'ellipse', 'diamond', 'text', 'sticky', 'arrow', 'line'];
    for (const type of types) {
      const shape = createShape(type);
      expect(shape.type).toBe(type);
      expect(shape.id).toBeTruthy();
    }
  });
});

describe('TOOL_LIST', () => {
  it('has 8 tools', () => {
    expect(TOOL_LIST.length).toBe(8);
  });

  it('has correct tool ids', () => {
    const ids = TOOL_LIST.map(t => t.id);
    expect(ids).toEqual(['select', 'rect', 'rrect', 'ellipse', 'diamond', 'text', 'arrow', 'sticky']);
  });

  it('select tool has key V', () => {
    const select = TOOL_LIST.find(t => t.id === 'select');
    expect(select?.key).toBe('V');
  });
});

describe('COLORS', () => {
  it('has 24 colors', () => {
    expect(COLORS.length).toBe(24);
  });

  it('all colors are valid hex', () => {
    for (const color of COLORS) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
