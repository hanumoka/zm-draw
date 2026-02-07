/** Connection point position on a shape */
export type ConnectionPoint = 'top' | 'right' | 'bottom' | 'left' | 'auto';

/** Arrow head type */
export type ArrowType = 'none' | 'arrow' | 'triangle' | 'diamond' | 'circle';

/** Connector routing type */
export type RoutingType = 'straight' | 'orthogonal';

/** Connector variant for toolbar selection */
export type ConnectorVariant = 'arrow' | 'bidirectional' | 'elbow' | 'line';

/**
 * Connector object representing a line/arrow between two shapes
 */
export interface Connector {
  /** Unique identifier */
  id: string;
  /** ID of the source shape */
  fromShapeId: string;
  /** ID of the target shape */
  toShapeId: string;
  /** Line color (hex or rgba) */
  stroke: string;
  /** Line width in pixels */
  strokeWidth: number;
  /** Whether to show arrowhead (deprecated: use arrowEnd) */
  arrow: boolean;
  /** Line style */
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  /** Label text on the connector */
  label?: string;
  /** Connection point on source shape */
  fromPoint?: ConnectionPoint;
  /** Connection point on target shape */
  toPoint?: ConnectionPoint;
  /** Arrow type at start */
  arrowStart?: ArrowType;
  /** Arrow type at end */
  arrowEnd?: ArrowType;
  /** Routing type */
  routing?: RoutingType;
}
