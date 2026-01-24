import type { ShapeConfig } from '../types';

/**
 * Shape categories
 */
export type ShapeCategory = 'basic' | 'erd' | 'flowchart' | 'text';

/**
 * Basic shape types
 */
export type BasicShapeType =
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'triangle'
  | 'hexagon'
  | 'star';

/**
 * ERD shape types
 */
export type ErdShapeType =
  | 'table'
  | 'column';

/**
 * Flowchart shape types
 */
export type FlowchartShapeType =
  | 'process'      // 사각형 (처리)
  | 'decision'     // 다이아몬드 (조건)
  | 'terminal'     // 둥근 사각형 (시작/종료)
  | 'data'         // 평행사변형 (입출력)
  | 'document'     // 문서 모양
  | 'database'     // 실린더 (데이터베이스)
  | 'predefined';  // 이중 사각형 (서브프로세스)

/**
 * Text shape types
 */
export type TextShapeType =
  | 'title'
  | 'body'
  | 'label';

/**
 * All shape types
 */
export type ShapeType = BasicShapeType | ErdShapeType | FlowchartShapeType | TextShapeType;

/**
 * ERD Table configuration
 */
export interface ErdTableConfig extends ShapeConfig {
  type: 'table';
  tableName: string;
  columns: ErdColumnConfig[];
}

/**
 * ERD Column configuration
 */
export interface ErdColumnConfig {
  name: string;
  dataType: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  isNullable?: boolean;
  defaultValue?: string;
}

/**
 * Text shape configuration
 */
export interface TextShapeConfig extends ShapeConfig {
  type: TextShapeType;
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: 'normal' | 'bold' | 'italic';
  align?: 'left' | 'center' | 'right';
}
