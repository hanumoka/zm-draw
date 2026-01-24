import type { ConnectorConfig, Point } from '../types';

/**
 * Connector types
 */
export type ConnectorType = 'line' | 'arrow' | 'curve' | 'orthogonal';

/**
 * Arrow head styles
 */
export type ArrowHeadStyle =
  | 'none'
  | 'arrow'
  | 'triangle'
  | 'diamond'
  | 'circle';

/**
 * ERD relationship types (Crow's Foot notation)
 */
export type ErdRelationType =
  | 'one-to-one'      // 1:1
  | 'one-to-many'     // 1:N
  | 'many-to-many';   // N:M

/**
 * ERD Connector configuration
 */
export interface ErdConnectorConfig extends ConnectorConfig {
  relationType: ErdRelationType;
  fromCardinality: 'one' | 'many';
  toCardinality: 'one' | 'many';
  fromOptional?: boolean;
  toOptional?: boolean;
}

/**
 * Flowchart connector configuration
 */
export interface FlowchartConnectorConfig extends ConnectorConfig {
  label?: string;
  labelPosition?: 'start' | 'middle' | 'end';
}

/**
 * Connector path points
 */
export interface ConnectorPath {
  points: Point[];
  controlPoints?: Point[];
}
