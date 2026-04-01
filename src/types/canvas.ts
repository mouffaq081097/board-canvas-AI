export type ObjectType = 'sticky' | 'note' | 'book' | 'shape' | 'drawing';

export type ToolType =
  | 'pointer'
  | 'hand'
  | 'sticky'
  | 'note'
  | 'book'
  | 'circle'
  | 'rectangle'
  | 'arrow'
  | 'pen'
  | 'eraser';

export type AnchorSide = 'top' | 'right' | 'bottom' | 'left';

export type GridMode = 'none' | 'dots' | 'isometric' | 'graph';

export interface ObjectStyle {
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  opacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  roughEdges?: boolean;
  coverImage?: string;
  spineColor?: string;
}

export interface BookPage {
  id: string;
  content: string;
}

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

export interface ObjectMetadata {
  pages?: BookPage[];
  shapeType?: 'circle' | 'rectangle' | 'arrow';
  pathData?: string;
  ocrText?: string;
  todoMode?: boolean;
  todoItems?: TodoItem[];
}

export interface CanvasObject {
  id: string;
  type: ObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  style: ObjectStyle;
  metadata?: ObjectMetadata;
  rotation?: number;
  locked?: boolean;
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
  fromAnchor: AnchorSide;
  toAnchor: AnchorSide;
  color: string;
  label?: string;
}

export interface CanvasState {
  objects: CanvasObject[];
  connections: Connection[];
}

export interface Board {
  id: string;
  title: string;
  user_id: string;
  canvas_state: CanvasState;
  updated_at: string;
  created_at: string;
}

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}
