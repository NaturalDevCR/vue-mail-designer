/**
 * Document store for managing email document state
 * Handles document operations, selection, and undo/redo history
 */

import { defineStore } from 'pinia';
import { reactive, computed } from 'vue';
import type { 
  EmailDocument, 
  Row, 
  Column, 
  Block, 
  BlockType, 
  Selection, 
  History 
} from '../schema/document';
import { 
  createEmailDocument,
  createRow,
  createColumn,
  createTextBlock,
  createImageBlock,
  createButtonBlock,
  createDividerBlock,
  createSpacerBlock,
  createContainerBlock
} from '../schema/document';
import { validateEmailDocument, validateUniqueIds } from '../schema/validators';
import { deepClone } from '../utils/deep';
import { createDocumentId, createRowId, createColumnId, createBlockId } from '../utils/ids';

export const useDocumentStore = defineStore('document', () => {
  // State
  const document = reactive<EmailDocument>(createEmailDocument(createDocumentId()));
  const selection = reactive<Selection>({});
  const history = reactive<History>({ past: [], future: [] });

  // Computed
  const canUndo = computed(() => history.past.length > 0);
  const canRedo = computed(() => history.future.length > 0);
  const selectedElement = computed(() => {
    if (!selection.nodeType || !selection.id) return null;
    
    switch (selection.nodeType) {
      case 'row': {
        const row = document.rows.find(row => row.id === selection.id);
        return row ? { ...row, type: 'row' } : null;
      }
      case 'column': {
        for (const docRow of document.rows) {
          const column = docRow.columns.find(col => col.id === selection.id);
          if (column) return { ...column, type: 'column', rowId: docRow.id };
        }
        return null;
      }
      case 'block': {
        for (const docRow of document.rows) {
          for (const docColumn of docRow.columns) {
            const block = docColumn.blocks.find(block => block.id === selection.id);
            if (block) return { ...block, type: 'block', columnId: docColumn.id, rowId: docRow.id };
          }
        }
        return null;
      }
      default:
        return null;
    }
  });

  // History management
  function commit() {
    // Limit history size to prevent memory issues
    if (history.past.length >= 50) {
      history.past.shift();
    }
    history.past.push(deepClone(document));
    history.future.length = 0; // Clear future when new action is performed
  }

  function undo() {
    const prev = history.past.pop();
    if (!prev) return false;
    
    history.future.push(deepClone(document));
    Object.assign(document, prev);
    
    // Clear selection if the selected element no longer exists
    if (selection.id && !selectedElement.value) {
      clearSelection();
    }
    
    return true;
  }

  function redo() {
    const next = history.future.pop();
    if (!next) return false;
    
    history.past.push(deepClone(document));
    Object.assign(document, next);
    
    return true;
  }

  // Selection management
  function select(nodeType: 'row' | 'column' | 'block', id: string) {
    selection.nodeType = nodeType;
    selection.id = id;
  }

  function clearSelection() {
    selection.nodeType = undefined;
    selection.id = undefined;
  }

  // Row operations
  function addRow(index?: number): string {
    commit();
    
    const rowId = createRowId();
    const newRow = createRow(rowId);
    
    if (index !== undefined && index >= 0 && index <= document.rows.length) {
      document.rows.splice(index, 0, newRow);
    } else {
      document.rows.push(newRow);
    }
    
    select('row', rowId);
    updateTimestamp();
    return rowId;
  }

  function removeRow(rowId: string): boolean {
    const index = document.rows.findIndex(row => row.id === rowId);
    if (index === -1) return false;
    
    commit();
    document.rows.splice(index, 1);
    
    if (selection.id === rowId) {
      clearSelection();
    }
    
    updateTimestamp();
    return true;
  }

  function duplicateRow(rowId: string): string | null {
    const row = document.rows.find(r => r.id === rowId);
    if (!row) return null;
    
    commit();
    
    const newRowId = createRowId();
    const duplicatedRow = deepClone(row);
    duplicatedRow.id = newRowId;
    
    // Generate new IDs for all nested elements
    duplicatedRow.columns = duplicatedRow.columns.map(col => {
      const newCol = { ...col, id: createColumnId() };
      newCol.blocks = newCol.blocks.map(block => ({
        ...block,
        id: createBlockId(block.type)
      }));
      return newCol;
    });
    
    const index = document.rows.findIndex(r => r.id === rowId);
    document.rows.splice(index + 1, 0, duplicatedRow);
    
    select('row', newRowId);
    updateTimestamp();
    return newRowId;
  }

  function moveRow(fromIndex: number, toIndex: number): boolean {
    if (fromIndex < 0 || fromIndex >= document.rows.length ||
        toIndex < 0 || toIndex >= document.rows.length) {
      return false;
    }
    
    commit();
    const [movedRow] = document.rows.splice(fromIndex, 1);
    document.rows.splice(toIndex, 0, movedRow);
    
    updateTimestamp();
    return true;
  }

  function reorderRows(newOrder: string[]): boolean {
    // Validate that all row IDs exist and match current rows
    const currentRowIds = document.rows.map(row => row.id);
    if (newOrder.length !== currentRowIds.length || 
        !newOrder.every(id => currentRowIds.includes(id))) {
      return false;
    }
    
    // Reorder rows based on the new order
    const reorderedRows = newOrder.map(rowId => 
      document.rows.find(row => row.id === rowId)!
    );
    
    document.rows.splice(0, document.rows.length, ...reorderedRows);
    updateTimestamp();
    return true;
  }

  // Column operations
  function addColumn(rowId: string, width: number = 6, index?: number): string | null {
    const row = document.rows.find(r => r.id === rowId);
    if (!row) return null;
    
    commit();
    
    const columnId = createColumnId();
    const newColumn = createColumn(columnId, width);
    
    if (index !== undefined && index >= 0 && index <= row.columns.length) {
      row.columns.splice(index, 0, newColumn);
    } else {
      row.columns.push(newColumn);
    }
    
    select('column', columnId);
    updateTimestamp();
    return columnId;
  }

  function removeColumn(columnId: string): boolean {
    for (const row of document.rows) {
      const index = row.columns.findIndex(col => col.id === columnId);
      if (index !== -1) {
        commit();
        row.columns.splice(index, 1);
        
        if (selection.id === columnId) {
          clearSelection();
        }
        
        updateTimestamp();
        return true;
      }
    }
    return false;
  }

  function duplicateColumn(columnId: string): string | null {
    for (const row of document.rows) {
      const columnIndex = row.columns.findIndex(col => col.id === columnId);
      if (columnIndex !== -1) {
        const column = row.columns[columnIndex];
        commit();
        
        const newColumnId = createColumnId();
        const duplicatedColumn = deepClone(column);
        duplicatedColumn.id = newColumnId;
        
        // Generate new IDs for all blocks
        duplicatedColumn.blocks = duplicatedColumn.blocks.map(block => ({
          ...block,
          id: createBlockId(block.type)
        }));
        
        row.columns.splice(columnIndex + 1, 0, duplicatedColumn);
        
        select('column', newColumnId);
        updateTimestamp();
        return newColumnId;
      }
    }
    return null;
  }

  // Block operations
  function addBlock(columnId: string, blockType: BlockType, index?: number): string | null {
    for (const row of document.rows) {
      const column = row.columns.find(col => col.id === columnId);
      if (column) {
        commit();
        
        const blockId = createBlockId(blockType);
        let newBlock: Block;
        
        switch (blockType) {
          case 'text':
            newBlock = createTextBlock(blockId);
            break;
          case 'image':
            newBlock = createImageBlock(blockId);
            break;
          case 'button':
            newBlock = createButtonBlock(blockId);
            break;
          case 'divider':
            newBlock = createDividerBlock(blockId);
            break;
          case 'spacer':
            newBlock = createSpacerBlock(blockId);
            break;
          case 'container':
            newBlock = createContainerBlock(blockId);
            break;
          default:
            return null;
        }
        
        if (index !== undefined && index >= 0 && index <= column.blocks.length) {
          column.blocks.splice(index, 0, newBlock);
        } else {
          column.blocks.push(newBlock);
        }
        
        select('block', blockId);
        updateTimestamp();
        return blockId;
      }
    }
    return null;
  }

  function removeBlock(blockId: string): boolean {
    for (const row of document.rows) {
      for (const column of row.columns) {
        const index = column.blocks.findIndex(block => block.id === blockId);
        if (index !== -1) {
          commit();
          column.blocks.splice(index, 1);
          
          if (selection.id === blockId) {
            clearSelection();
          }
          
          updateTimestamp();
          return true;
        }
      }
    }
    return false;
  }

  function duplicateBlock(blockId: string): string | null {
    for (const row of document.rows) {
      for (const column of row.columns) {
        const blockIndex = column.blocks.findIndex(block => block.id === blockId);
        if (blockIndex !== -1) {
          const block = column.blocks[blockIndex];
          commit();
          
          const newBlockId = createBlockId(block.type);
          const duplicatedBlock = deepClone(block);
          duplicatedBlock.id = newBlockId;
          
          column.blocks.splice(blockIndex + 1, 0, duplicatedBlock);
          
          select('block', newBlockId);
          updateTimestamp();
          return newBlockId;
        }
      }
    }
    return null;
  }

  function updateRow(rowId: string, updates: Partial<Row>): boolean {
    const row = document.rows.find(r => r.id === rowId);
    if (row) {
      commit();
      Object.assign(row, updates);
      updateTimestamp();
      return true;
    }
    return false;
  }

  function updateColumn(rowId: string, columnId: string, updates: Partial<Column>): boolean {
    const row = document.rows.find(r => r.id === rowId);
    if (row) {
      const column = row.columns.find(c => c.id === columnId);
      if (column) {
        commit();
        Object.assign(column, updates);
        updateTimestamp();
        return true;
      }
    }
    return false;
  }

  function updateBlock(blockId: string, updates: Partial<Block>): boolean {
    for (const row of document.rows) {
      for (const column of row.columns) {
        const block = column.blocks.find(b => b.id === blockId);
        if (block) {
          commit();
          Object.assign(block, updates);
          updateTimestamp();
          return true;
        }
      }
    }
    return false;
  }

  function updateDocument(updates: Partial<EmailDocument>): boolean {
    commit();
    Object.assign(document, updates);
    updateTimestamp();
    return true;
  }

  // Document operations
  function importDocument(jsonData: string | EmailDocument): boolean {
    try {
      const docData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      
      if (!validateEmailDocument(docData) || !validateUniqueIds(docData)) {
        throw new Error('Invalid document format');
      }
      
      commit();
      Object.assign(document, docData);
      clearSelection();
      
      return true;
    } catch (error) {
      // Failed to import document
      return false;
    }
  }

  function exportJson(): string {
    return JSON.stringify(document, null, 2);
  }

  async function exportHtml(): Promise<string> {
    try {
      // Import the HTML exporter
      const { toHtml } = await import('../exporters/toHtml');
      return toHtml(document, {
        inlineStyles: true,
        includeMetaTags: true,
        minifyOutput: false,
        containerWidth: 600
      });
    } catch (error) {
      // Failed to export HTML
      return '<html><body><p>Error generating HTML export</p></body></html>';
    }
  }

  function newDocument(): void {
    commit();
    const newDoc = createEmailDocument(createDocumentId());
    Object.assign(document, newDoc);
    clearSelection();
  }

  function updateTimestamp(): void {
    if (document.meta) {
      document.meta.updatedAt = new Date().toISOString();
    }
  }

  // Initialize with empty document
  function initialize() {
    // Document is already initialized in reactive declaration
    // This function can be used for any additional setup
  }

  return {
    // State
    document,
    selection,
    history,
    
    // Computed
    canUndo,
    canRedo,
    selectedElement,
    
    // Actions
    commit,
    undo,
    redo,
    select,
    clearSelection,
    
    // Row operations
    addRow,
    removeRow,
    duplicateRow,
    moveRow,
    reorderRows,
    updateRow,
    
    // Column operations
    addColumn,
    removeColumn,
    duplicateColumn,
    updateColumn,
    
    // Block operations
    addBlock,
    removeBlock,
    duplicateBlock,
    updateBlock,
    
    // Document operations
    updateDocument,
    importDocument,
    exportJson,
    exportHtml,
    newDocument,
    initialize
  };
});