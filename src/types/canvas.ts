export type ObjectType = 'sticky' | 'note' | 'book' | 'shape' | 'drawing' | 'table' | 'image';

export type ToolType =
  | 'pointer' | 'hand' | 'sticky' | 'note' | 'book'
  | 'shape'   // unified shape tool (replaces circle/rectangle/arrow)
  | 'circle' | 'rectangle' | 'arrow'  // keep for backwards compat
  | 'pen' | 'eraser'
  | 'table' | 'image';

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
  title: string;   // editable page title
  content: string;
}

export interface BookSection {
  id: string;
  title: string;
  color: string;
  pages: BookPage[];
}

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

export interface ObjectMetadata {
  pages?: BookPage[];
  sections?: BookSection[];  // OneNote-style sections, replaces pages[]
  shapeType?: 'circle' | 'rectangle' | 'arrow' | 'triangle' | 'diamond' | 'star' | 'hexagon' | 'pentagon';
  pathData?: string;
  ocrText?: string;
  todoMode?: boolean;
  todoItems?: TodoItem[];
  imageUrl?: string;
  imageAlt?: string;
  isGif?: boolean;
  tableData?: {
    rows: number;
    cols: number;
    cells: string[][];
    colWidths?: number[];
    headers?: string[];
    cellStyles?: Record<string, { bold?: boolean; color?: string }>;
  };
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
