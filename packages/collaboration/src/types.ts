/** User presence information for cursor sharing */
export interface UserPresence {
  odUserId: string;
  name: string;
  color: string;
  cursor: { x: number; y: number } | null;
  selection: string[];
  viewport: { x: number; y: number; scale: number };
  /** Whether this user is presenting in spotlight mode */
  isPresenting?: boolean;
}

/** Connection status */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';
