/**
 * Deep cloning and object manipulation utilities
 * Provides safe deep cloning for email document state management
 */

import type { EmailDocument, Row, Column, Block } from '../schema/document';

/**
 * Deep clones any object using JSON serialization
 * Note: This method doesn't preserve functions, undefined values, or symbols
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }

  return obj;
}

/**
 * Deep clones an email document
 */
export function cloneEmailDocument(document: EmailDocument): EmailDocument {
  return deepClone(document);
}

/**
 * Deep clones a row
 */
export function cloneRow(row: Row): Row {
  return deepClone(row);
}

/**
 * Deep clones a column
 */
export function cloneColumn(column: Column): Column {
  return deepClone(column);
}

/**
 * Deep clones a block
 */
export function cloneBlock(block: Block): Block {
  return deepClone(block);
}

/**
 * Deep merges two objects
 */
export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = deepClone(target);
  
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];
      
      if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue) &&
          targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
        result[key] = deepMerge(targetValue, sourceValue);
      } else {
        result[key] = deepClone(sourceValue) as T[Extract<keyof T, string>];
      }
    }
  }
  
  return result;
}

/**
 * Checks if two objects are deeply equal
 */
export function deepEqual<T>(obj1: T, obj2: T): boolean {
  if (obj1 === obj2) {
    return true;
  }

  if (obj1 === null || obj2 === null || obj1 === undefined || obj2 === undefined) {
    return obj1 === obj2;
  }

  if (typeof obj1 !== typeof obj2) {
    return false;
  }

  if (typeof obj1 !== 'object') {
    return obj1 === obj2;
  }

  if (Array.isArray(obj1) !== Array.isArray(obj2)) {
    return false;
  }

  if (Array.isArray(obj1)) {
    const arr1 = obj1 as unknown as unknown[];
    const arr2 = obj2 as unknown as unknown[];
    
    if (arr1.length !== arr2.length) {
      return false;
    }
    
    for (let i = 0; i < arr1.length; i++) {
      if (!deepEqual(arr1[i], arr2[i])) {
        return false;
      }
    }
    
    return true;
  }

  const keys1 = Object.keys(obj1 as object);
  const keys2 = Object.keys(obj2 as object);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (keys2.indexOf(key) === -1) {
      return false;
    }
    
    const val1 = (obj1 as Record<string, unknown>)[key];
    const val2 = (obj2 as Record<string, unknown>)[key];
    
    if (!deepEqual(val1, val2)) {
      return false;
    }
  }

  return true;
}

/**
 * Safely gets a nested property from an object
 */
export function safeGet<T>(obj: unknown, path: string, defaultValue?: T): T | undefined {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    current = (current as Record<string, unknown>)[key];
  }
  
  return current !== undefined ? current : defaultValue;
}

/**
 * Safely sets a nested property in an object
 */
export function safeSet<T>(obj: Record<string, unknown>, path: string, value: T): void {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    
    if (current[key] === null || current[key] === undefined || typeof current[key] !== 'object') {
      current[key] = {};
    }
    
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
}

/**
 * Removes undefined and null values from an object
 */
export function cleanObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const cleaned: Partial<T> = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (value !== null && value !== undefined) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          const cleanedValue = cleanObject(value);
          if (Object.keys(cleanedValue).length > 0) {
            cleaned[key] = cleanedValue as T[Extract<keyof T, string>];
          }
        } else {
          cleaned[key] = value;
        }
      }
    }
  }
  
  return cleaned;
}