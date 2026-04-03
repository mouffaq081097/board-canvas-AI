import { describe, it, expect } from 'vitest';
import { layoutRoadmap } from '../roadmapLayout';

const source = { x: 100, y: 200, height: 360 };

const nodes = [
  { id: 'n1', label: 'Design mockups', duration: '2 days', depth: 0, branch: 0 },
  { id: 'n2', label: 'Write API spec', duration: '1 day',  depth: 0, branch: 1 },
  { id: 'n3', label: 'Build frontend', duration: '3 days', depth: 1, branch: 0 },
];

describe('layoutRoadmap', () => {
  it('returns one extra node (Start) at index 0', () => {
    const { canvasNodes, aiNodeIds } = layoutRoadmap(source, nodes);
    expect(canvasNodes.length).toBe(nodes.length + 1);
    expect(aiNodeIds[0]).toBe('__START__');
  });

  it('positions depth-0 nodes directly right of Start column', () => {
    const { canvasNodes, aiNodeIds } = layoutRoadmap(source, nodes);
    const n1Index = aiNodeIds.indexOf('n1');
    const n1 = canvasNodes[n1Index];
    // depth 0: x = source.x + 0 * (200 + 80) = 100
    expect(n1.x).toBe(100);
  });

  it('positions depth-1 nodes one column further right', () => {
    const { canvasNodes, aiNodeIds } = layoutRoadmap(source, nodes);
    const n3Index = aiNodeIds.indexOf('n3');
    const n3 = canvasNodes[n3Index];
    // depth 1: x = source.x + 1 * (200 + 80) = 380
    expect(n3.x).toBe(380);
  });

  it('stacks branch-1 below branch-0 at same depth', () => {
    const { canvasNodes, aiNodeIds } = layoutRoadmap(source, nodes);
    const n1Index = aiNodeIds.indexOf('n1');
    const n2Index = aiNodeIds.indexOf('n2');
    expect(canvasNodes[n2Index].y).toBeGreaterThan(canvasNodes[n1Index].y);
  });

  it('Start node uses distinct background color', () => {
    const { canvasNodes } = layoutRoadmap(source, nodes);
    expect(canvasNodes[0].style.backgroundColor).toBe('#e0e7ff');
  });

  it('builds durationMap correctly', () => {
    const { durationMap } = layoutRoadmap(source, nodes);
    expect(durationMap.get('n1')).toBe('2 days');
    expect(durationMap.get('n3')).toBe('3 days');
  });

  it('sets roughEdges: true on all nodes', () => {
    const { canvasNodes } = layoutRoadmap(source, nodes);
    expect(canvasNodes.every(n => n.style.roughEdges)).toBe(true);
  });
});
