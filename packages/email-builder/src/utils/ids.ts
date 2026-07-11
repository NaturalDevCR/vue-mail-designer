/**
 * Utility functions for ID generation and management
 * Provides unique ID generation for email builder elements
 */

/**
 * Generates a unique ID with optional prefix
 * Uses timestamp and random string for uniqueness
 */
export function createId(prefix: string = 'el'): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${randomStr}`;
}

/**
 * Generates a unique ID for a row element
 */
export function createRowId(): string {
  return createId('row');
}

/**
 * Generates a unique ID for a column element
 */
export function createColumnId(): string {
  return createId('col');
}

/**
 * Generates a unique ID for a block element
 */
export function createBlockId(blockType?: string): string {
  const prefix = blockType ? `${blockType}_block` : 'block';
  return createId(prefix);
}

/**
 * Generates a unique ID for a document
 */
export function createDocumentId(): string {
  return createId('doc');
}

/**
 * Validates if an ID follows the expected format
 */
export function isValidIdFormat(id: string): boolean {
  return /^[a-zA-Z0-9_]+_[a-zA-Z0-9]+_[a-zA-Z0-9]+$/.test(id);
}

/**
 * Extracts the prefix from an ID
 */
export function getIdPrefix(id: string): string {
  const parts = id.split('_');
  return parts[0] || '';
}

/**
 * Checks if an ID belongs to a specific type
 */
export function isIdOfType(id: string, type: string): boolean {
  return getIdPrefix(id) === type;
}

/**
 * Generates a batch of unique IDs
 */
export function createIds(count: number, prefix: string = 'el'): string[] {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    ids.push(createId(prefix));
  }
  return ids;
}