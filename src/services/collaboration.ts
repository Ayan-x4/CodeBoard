import type { CodeAnnotation, CodeFile, WhiteboardData } from '../projects/types';

// Transport-neutral operations: a future Yjs/WebSocket adapter can subscribe at the store boundary.
export type WorkspaceOperation =
  | { type: 'file:update'; file: CodeFile }
  | { type: 'board:update'; board: WhiteboardData }
  | { type: 'annotation:add'; annotation: CodeAnnotation };
export interface Presence { userId: string; name: string; color: string; panel: 'code' | 'board'; cursor?: { x: number; y: number } }
export interface CollaborationProvider {
  connect(roomId: string): Promise<void>;
  publish(operation: WorkspaceOperation): void;
  subscribe(listener: (operation: WorkspaceOperation) => void): () => void;
  updatePresence(presence: Presence): void;
  disconnect(): void;
}
