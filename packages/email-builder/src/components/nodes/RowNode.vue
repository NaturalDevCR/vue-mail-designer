<template>
  <div 
    :class="[
      'row-node-wrapper',
      {
        'selected': selected,
        'has-columns': row.columns.length > 0,
        'empty': row.columns.length === 0
      }
    ]"
    @click.stop="handleSelect"
    @mouseenter="showControls = true"
    @mouseleave="showControls = false"
  >
    <!-- Row Controls -->
    <div 
      v-if="(showControls || selected) && !hasChildSelected"
      class="row-controls"
    >
      <div class="row-controls__handle row-handle" title="Drag to reorder">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </div>
      
      <div class="row-controls__actions">
        <button 
          @click.stop="addColumn"
          class="control-btn"
          title="Add Column"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        
        <button 
          @click.stop="$emit('duplicate')"
          class="control-btn"
          title="Duplicate Row"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2 2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
        
        <button 
          @click.stop="$emit('delete')"
          class="control-btn control-btn--danger"
          title="Delete Row"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3,6 5,6 21,6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      </div>
      
      <div class="row-controls__info">
        <span class="row-label">Row</span>
      </div>
    </div>
    
    <!-- Row Content using Vuemail Section -->
    <Section 
      class="row-content"
      :style="sectionStyles"
    >
      <!-- Empty Row State -->
      <div v-if="row.columns.length === 0" class="row-empty-state">
        <div class="empty-content">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="6" width="18" height="4" rx="1"/>
            <rect x="3" y="14" width="18" height="4" rx="1"/>
          </svg>
          <p>Add columns to this row</p>
          <button @click="addColumn" class="add-column-btn">
            Add Column
          </button>
        </div>
      </div>
      
      <!-- Columns Container -->
      <div
        v-else
        ref="columnsContainer"
        class="columns-container"
      >
        <div 
          v-for="(column, index) in row.columns" 
          :key="column.id"
          :data-swapy-slot="column.id"
          class="column-slot"
        >
          <div 
            :data-swapy-item="column.id"
            class="column-item"
          >
            <ColumnNode 
              :column="column"
              :row-id="row.id"
              :index="index"
              :selected="isColumnSelected(column.id)"
              @select="selectColumn(column.id)"
              @delete="deleteColumn(column.id)"
              @duplicate="duplicateColumn(column.id)"
              @resize="handleColumnResize(column.id, $event)"
            />
          </div>
        </div>
      </div>
    </Section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { useUiStore } from '../../stores/useUiStore';
import { createSwapy } from 'swapy';
import ColumnNode from './ColumnNode.vue';
import { Section } from '@vue-email/components';
import type { Row } from '../../schema/document';

/**
 * Component props
 */
interface Props {
  row: Row;
  index: number;
  selected: boolean;
}

const props = defineProps<Props>();

/**
 * Component emits
 */
interface Emits {
  select: [];
  delete: [];
  duplicate: [];
  moveUp: [];
  moveDown: [];
}

const emit = defineEmits<Emits>();

// Stores
const documentStore = useDocumentStore();
const ui = useUiStore();

// State
const showControls = ref(false);
const columnsContainer = ref<HTMLElement | null>(null);
let swapy: ReturnType<typeof createSwapy> | null = null;

/**
 * Computed section styles for Vuemail Section component
 */
const sectionStyles = computed(() => {
  const styles: Record<string, string> = {
    width: '100%',
    minHeight: '60px',
    backgroundColor: '#ffffff',
    ...props.row.style
  };
  
  // Convert 'transparent' to proper hex format for Vuemail compatibility
  if (styles.backgroundColor === 'transparent') {
    styles.backgroundColor = '#ffffff';
  }
  
  return styles;
});

/**
 * Handle row selection
 */
function handleSelect() {
  documentStore.select('row', props.row.id);
  emit('select');
}

/**
 * Check if a column is selected
 */
function isColumnSelected(columnId: string): boolean {
  return documentStore.selection.nodeType === 'column' && 
         documentStore.selection.id === columnId;
}

/**
 * Check if any child element (column or block) is selected
 */
const hasChildSelected = computed(() => {
  if (!documentStore.selection.nodeType || !documentStore.selection.id) return false;
  
  // Check if any column in this row is selected
  if (documentStore.selection.nodeType === 'column') {
    return props.row.columns.some(col => col.id === documentStore.selection.id);
  }
  
  // Check if any block in any column of this row is selected
  if (documentStore.selection.nodeType === 'block') {
    for (const column of props.row.columns) {
      if (column.blocks.some(block => block.id === documentStore.selection.id)) {
        return true;
      }
    }
  }
  
  return false;
});

/**
 * Select a column
 */
function selectColumn(columnId: string) {
  documentStore.select('column', columnId);
}

/**
 * Add a new column to this row
 */
function addColumn() {
  const availableWidth = 12 - props.row.columns.reduce((sum, col) => sum + (col.width || 12), 0);
  const columnWidth = Math.max(1, Math.min(6, availableWidth));
  
  documentStore.addColumn(props.row.id, columnWidth);
}

/**
 * Delete a column
 */
function deleteColumn(columnId: string) {
  if (ui.preferences.confirmDelete) {
    if (!confirm('Are you sure you want to delete this column?')) {
      return;
    }
  }
  documentStore.removeColumn(columnId);
}

/**
 * Duplicate a column
 */
function duplicateColumn(columnId: string) {
  documentStore.duplicateColumn(columnId);
}

/**
 * Handle column resize
 */
function handleColumnResize(columnId: string, newWidth: number) {
  documentStore.updateColumn(props.row.id, columnId, { width: newWidth });
}

/**
 * Initialize Swapy for column drag and drop
 */
function initializeSwapy() {
  if (columnsContainer.value && props.row.columns.length > 0) {
    swapy = createSwapy(columnsContainer.value);
    
    swapy.onSwap(({ data }: { data: { object: Record<string, string> } }) => {
      const newOrder = Object.keys(data.object).map(slotId => slotId);
      reorderColumns(newOrder);
    });
  }
}

/**
 * Reorder columns based on new order from Swapy
 */
function reorderColumns(newOrder: string[]) {
  const reorderedColumns = newOrder.map(columnId => 
    props.row.columns.find(col => col.id === columnId)!
  ).filter(Boolean);
  
  if (reorderedColumns.length === props.row.columns.length) {
    documentStore.updateRow(props.row.id, { columns: reorderedColumns });
  }
}

/**
 * Cleanup Swapy instance
 */
function cleanupSwapy() {
  if (swapy) {
    swapy.destroy();
    swapy = null;
  }
}

// Lifecycle hooks
onMounted(() => {
  initializeSwapy();
});

onUnmounted(() => {
  cleanupSwapy();
});
</script>

<style scoped>
/* Row Node Styles */
.row-node-wrapper {
  position: relative;
  margin-bottom: 12px;
  padding: 8px;
  border: 3px solid transparent;
  border-radius: 10px;
  transition: all 0.2s ease;
  cursor: pointer;
  background-color: rgba(59, 130, 246, 0.02);
}

.row-node-wrapper:hover {
  z-index: 10;
  background-color: rgba(59, 130, 246, 0.08);
  border-color: rgba(59, 130, 246, 0.3);
}

.row-node-wrapper.selected {
  z-index: 20;
  border-color: var(--accent);
  background-color: rgba(59, 130, 246, 0.1);
}

.row-node-wrapper.selected .row-content {
  /* Remove outline since we're using border on wrapper */
}

/* Row Controls */
.row-controls {
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background-color: var(--panel);
  border: 1px solid var(--border);
  border-radius: 6px 6px 0 0;
  z-index: 10;
}

.row-controls__handle {
  display: flex;
  align-items: center;
  color: var(--muted);
  cursor: grab;
}

.row-controls__handle:active {
  cursor: grabbing;
}

.row-controls__actions {
  display: flex;
  gap: 2px;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background-color: var(--border);
  color: var(--fg);
}

.control-btn--danger:hover {
  background-color: #fee2e2;
  color: #dc2626;
}

.row-controls__info {
  display: flex;
  align-items: center;
}

.row-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Row Content */
.row-content {
  position: relative;
  min-height: 60px;
  border-radius: 6px;
  margin-top: 32px;
  margin: 8px;
  padding: 4px;
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
  /* Prevent columns from intercepting row clicks */
  pointer-events: none;
}

.row-content * {
  /* Re-enable pointer events for child elements */
  pointer-events: auto;
}

/* Empty Row State */
.row-empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  padding: 20px;
}

.empty-content {
  text-align: center;
  color: var(--muted);
}

.empty-content svg {
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-content p {
  margin: 0 0 12px 0;
  font-size: 14px;
}

.add-column-btn {
  padding: 6px 12px;
  border: 1px solid var(--border);
  background-color: var(--panel);
  color: var(--fg);
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-column-btn:hover {
  background-color: var(--accent);
  color: white;
  border-color: var(--accent);
}

/* Columns Container */
.columns-container {
  padding: 8px;
  margin: 4px;
  display: flex;
  gap: 12px;
  width: calc(100% - 16px);
  background-color: rgba(248, 250, 252, 0.5);
  border-radius: 4px;
  min-height: 60px;
}

.column-slot {
  flex: 1;
  min-height: 60px;
}

.column-item {
  width: 100%;
  height: 100%;
}

/* Responsive */
@media (max-width: 768px) {
  .row-controls {
    padding: 2px 4px;
  }
  
  .control-btn {
    width: 18px;
    height: 18px;
  }
  
  .row-label {
    display: none;
  }
}
</style>