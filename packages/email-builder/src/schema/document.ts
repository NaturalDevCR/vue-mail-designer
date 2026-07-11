/**
 * Email document schema types and interfaces
 * Defines the structure for the email builder's JSON document model
 */

export type BlockType = 'text' | 'image' | 'button' | 'divider' | 'spacer' | 'container';

/**
 * Base interface for all blocks
 */
export interface BaseBlock {
  id: string;
  type: BlockType;
  style?: Record<string, string | number>;
}

/**
 * Text block for rich text content
 */
export interface TextBlock extends BaseBlock {
  type: 'text';
  html?: string;
  plaintext?: string;
}

/**
 * Image block for displaying images
 */
export interface ImageBlock extends BaseBlock {
  type: 'image';
  src: string;
  alt: string;
  href?: string;
  width?: number;
  height?: number;
}

/**
 * Button block for call-to-action buttons
 */
export interface ButtonBlock extends BaseBlock {
  type: 'button';
  label: string;
  href?: string;
  target?: '_blank' | '_self';
}

/**
 * Divider block for visual separation
 */
export interface DividerBlock extends BaseBlock {
  type: 'divider';
}

/**
 * Spacer block for adding vertical space
 */
export interface SpacerBlock extends BaseBlock {
  type: 'spacer';
  height?: number;
}

/**
 * Container block for grouping other blocks
 */
export interface ContainerBlock extends BaseBlock {
  type: 'container';
  children?: Block[];
}

/**
 * Union type for all block types
 */
export type Block = TextBlock | ImageBlock | ButtonBlock | DividerBlock | SpacerBlock | ContainerBlock;

/**
 * Column interface - contains blocks and has width
 */
export interface Column {
  id: string;
  width?: number; // Width in grid units (1-12) or percentage
  style?: Record<string, string | number>;
  blocks: Block[];
}

/**
 * Row interface - contains columns
 */
export interface Row {
  id: string;
  style?: Record<string, string | number>;
  columns: Column[];
}

/**
 * Email document metadata
 */
export interface EmailDocumentMeta {
  name?: string;
  createdAt?: string;
  updatedAt?: string;
  description?: string;
}

/**
 * Main email document interface
 */
export interface EmailDocument {
  id: string;
  meta?: EmailDocumentMeta;
  rows: Row[];
}

/**
 * Selection state interface
 */
export interface Selection {
  nodeType?: 'row' | 'column' | 'block';
  id?: string;
}

/**
 * History state for undo/redo functionality
 */
export interface History {
  past: EmailDocument[];
  future: EmailDocument[];
}

/**
 * Type guards for block types
 */
export function isTextBlock(block: Block): block is TextBlock {
  return block.type === 'text';
}

export function isImageBlock(block: Block): block is ImageBlock {
  return block.type === 'image';
}

export function isButtonBlock(block: Block): block is ButtonBlock {
  return block.type === 'button';
}

export function isDividerBlock(block: Block): block is DividerBlock {
  return block.type === 'divider';
}

/**
 * Default block creators
 */
export function createTextBlock(id: string): TextBlock {
  return {
    id,
    type: 'text',
    html: '<p>Enter your text here...</p>',
    style: {
      fontSize: '14px',
      color: '#333333',
      lineHeight: '1.5'
    }
  };
}

export function createImageBlock(id: string): ImageBlock {
  return {
    id,
    type: 'image',
    src: 'https://via.placeholder.com/300x200',
    alt: 'Placeholder image',
    width: 300,
    height: 200,
    style: {
      display: 'block',
      maxWidth: '100%'
    }
  };
}

export function createButtonBlock(id: string): ButtonBlock {
  return {
    id,
    type: 'button',
    label: 'Click me',
    href: '#',
    target: '_blank',
    style: {
      backgroundColor: '#007bff',
      color: '#ffffff',
      padding: '12px 24px',
      borderRadius: '4px',
      textDecoration: 'none',
      display: 'inline-block'
    }
  };
}

export function createDividerBlock(id: string): DividerBlock {
  return {
    id,
    type: 'divider',
    style: {
      borderTop: '1px solid #e5e7eb',
      margin: '20px 0'
    }
  };
}

export function createSpacerBlock(id: string): SpacerBlock {
  return {
    id,
    type: 'spacer',
    height: 20,
    style: {
      height: '20px',
      backgroundColor: 'transparent'
    }
  };
}

export function createContainerBlock(id: string): ContainerBlock {
  return {
    id,
    type: 'container',
    children: [],
    style: {
      padding: '16px',
      backgroundColor: 'transparent',
      border: '1px solid #e5e7eb',
      borderRadius: '4px'
    }
  };
}

/**
 * Create a new column with default settings
 */
export function createColumn(id: string, width: number = 12): Column {
  return {
    id,
    width,
    blocks: [],
    style: {
      padding: '10px'
    }
  };
}

/**
 * Create a new row with default settings
 */
export function createRow(id: string): Row {
  return {
    id,
    columns: [],
    style: {
      margin: '10px 0'
    }
  };
}

/**
 * Create a new empty email document
 */
export function createEmailDocument(id: string): EmailDocument {
  return {
    id,
    meta: {
      name: 'Untitled Email',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    rows: []
  };
}