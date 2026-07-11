/**
 * Validation functions for email document schema
 * Ensures data integrity and validates document structure
 */

import type { EmailDocument, Row, Column, Block, BlockType, TextBlock, ImageBlock, ButtonBlock } from './document';

/**
 * Validates if a string is a valid block type
 */
export function isValidBlockType(type: string): type is BlockType {
  return ['text', 'image', 'button', 'divider'].includes(type);
}

/**
 * Validates if an ID is properly formatted
 */
export function isValidId(id: string): boolean {
  return typeof id === 'string' && id.length > 0 && /^[a-zA-Z0-9_-]+$/.test(id);
}

/**
 * Validates a block object
 */
export function validateBlock(block: unknown): block is Block {
  if (!block || typeof block !== 'object') {
    return false;
  }

  const blockObj = block as Record<string, unknown>;
  
  if (!isValidId(blockObj.id) || !isValidBlockType(blockObj.type)) {
    return false;
  }

  // Type-specific validation
  switch (blockObj.type) {
    case 'text':
      return typeof blockObj.html === 'string' || typeof blockObj.plaintext === 'string';
    case 'image':
      return typeof blockObj.src === 'string' && typeof blockObj.alt === 'string';
    case 'button':
      return typeof blockObj.label === 'string';
    case 'divider':
      return true;
    default:
      return false;
  }
}

/**
 * Validates a column object
 */
export function validateColumn(column: unknown): column is Column {
  if (!column || typeof column !== 'object') {
    return false;
  }

  const columnObj = column as Record<string, unknown>;
  
  if (!isValidId(columnObj.id)) {
    return false;
  }

  if (columnObj.width !== undefined && (typeof columnObj.width !== 'number' || columnObj.width < 1 || columnObj.width > 12)) {
    return false;
  }

  if (!Array.isArray(columnObj.blocks)) {
    return false;
  }

  return columnObj.blocks.every(validateBlock);
}

/**
 * Validates a row object
 */
export function validateRow(row: unknown): row is Row {
  if (!row || typeof row !== 'object') {
    return false;
  }

  const rowObj = row as Record<string, unknown>;
  
  if (!isValidId(rowObj.id)) {
    return false;
  }

  if (!Array.isArray(rowObj.columns)) {
    return false;
  }

  // Validate all columns
  if (!rowObj.columns.every(validateColumn)) {
    return false;
  }

  // Validate total width doesn't exceed 12
  const totalWidth = rowObj.columns.reduce((sum: number, col: Column) => sum + (col.width || 12), 0);
  if (totalWidth > 12) {
    return false;
  }

  return true;
}

/**
 * Validates an email document
 */
export function validateEmailDocument(doc: unknown): doc is EmailDocument {
  if (!doc || typeof doc !== 'object') {
    return false;
  }

  const docObj = doc as Record<string, unknown>;
  
  if (!isValidId(docObj.id)) {
    return false;
  }

  if (!Array.isArray(docObj.rows)) {
    return false;
  }

  return docObj.rows.every(validateRow);
}

/**
 * Validates that all IDs in a document are unique
 */
export function validateUniqueIds(doc: EmailDocument): boolean {
  const ids = new Set<string>();
  
  // Add document ID
  if (ids.has(doc.id)) return false;
  ids.add(doc.id);

  // Check all rows, columns, and blocks
  for (const row of doc.rows) {
    if (ids.has(row.id)) return false;
    ids.add(row.id);

    for (const column of row.columns) {
      if (ids.has(column.id)) return false;
      ids.add(column.id);

      for (const block of column.blocks) {
        if (ids.has(block.id)) return false;
        ids.add(block.id);
      }
    }
  }

  return true;
}

/**
 * Sanitizes HTML content for text blocks
 */
export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '');
}

/**
 * Validates and sanitizes a text block's HTML content
 */
export function validateAndSanitizeTextBlock(block: unknown): TextBlock | null {
  if (!validateBlock(block) || block.type !== 'text') {
    return null;
  }

  const sanitizedBlock = { ...block };
  if (sanitizedBlock.html && typeof sanitizedBlock.html === 'string') {
    sanitizedBlock.html = sanitizeHtml(sanitizedBlock.html);
  }

  return sanitizedBlock as TextBlock;
}

/**
 * Validates URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates image block URLs
 */
export function validateImageBlock(block: unknown): ImageBlock | null {
  if (!validateBlock(block) || block.type !== 'image') {
    return null;
  }

  const blockObj = block as Record<string, unknown>;
  
  // Validate image source URL
  if (typeof blockObj.src !== 'string' || !isValidUrl(blockObj.src)) {
    return null;
  }

  // Validate optional href URL
  if (blockObj.href && (typeof blockObj.href !== 'string' || !isValidUrl(blockObj.href))) {
    return null;
  }

  return block as ImageBlock;
}

/**
 * Validates button block URLs
 */
export function validateButtonBlock(block: unknown): ButtonBlock | null {
  if (!validateBlock(block) || block.type !== 'button') {
    return null;
  }

  const blockObj = block as Record<string, unknown>;
  
  // Validate optional href URL
  if (blockObj.href && (typeof blockObj.href !== 'string' || !isValidUrl(blockObj.href))) {
    return null;
  }

  return block as ButtonBlock;
}