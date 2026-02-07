/**
 * Generate a unique ID for shapes and connectors
 */
export function generateId(): string {
  return `shape-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
