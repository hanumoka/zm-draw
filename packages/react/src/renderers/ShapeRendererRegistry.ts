import Konva from 'konva';
import type { Shape } from '@zm-draw/core';

export interface ShapeRendererContext {
  imageCache: Map<string, HTMLImageElement>;
  rerenderShapes: () => void;
}

export interface ShapeRenderer {
  render(shape: Shape, group: Konva.Group, ctx: ShapeRendererContext): Konva.Shape;
}

const registry = new Map<string, ShapeRenderer>();

export function registerShapeRenderer(type: string, renderer: ShapeRenderer): void {
  registry.set(type, renderer);
}

export function getShapeRenderer(type: string): ShapeRenderer | undefined {
  return registry.get(type);
}

export function hasShapeRenderer(type: string): boolean {
  return registry.has(type);
}
