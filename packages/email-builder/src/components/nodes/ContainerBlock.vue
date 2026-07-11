<template>
  <div 
    :class="[
      'container-block-wrapper',
      {
        'selected': selected,
        'editing': isEditing
      }
    ]"
    @click.stop="handleSelect"
    @mouseenter="showControls = true"
    @mouseleave="showControls = false"
  >
    <!-- Block Controls -->
    <div 
      v-if="showControls || selected"
      class="block-controls"
    >
      <div class="block-controls__handle block-handle" title="Drag to reorder">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </div>
      
      <div class="block-controls__actions">
        <button 
          @click.stop="toggleEdit"
          class="control-btn"
          :title="isEditing ? 'Stop Editing' : 'Edit Container'"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        
        <button 
          @click.stop="$emit('duplicate')"
          class="control-btn"
          title="Duplicate Block"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2 2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
        
        <button 
          @click.stop="$emit('delete')"
          class="control-btn control-btn--danger"
          title="Delete Block"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3,6 5,6 21,6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      </div>
      
      <div class="block-controls__info">
        <span class="block-label">Container</span>
      </div>
    </div>
    
    <!-- Container Content -->
    <div class="container-content">
      <!-- Edit Mode -->
      <div 
        v-if="isEditing"
        class="container-editor"
      >
        <div class="editor-fields">
          <div class="field-group">
            <label class="field-label">Background Color</label>
            <input
              v-model="containerBgColor"
              type="color"
              class="field-color"
            />
          </div>
          
          <div class="field-group">
            <label class="field-label">Padding (px)</label>
            <input
              v-model="containerPadding"
              type="number"
              min="0"
              max="100"
              class="field-input"
              placeholder="16"
            />
          </div>
          
          <div class="field-group">
            <label class="field-label">Border Radius (px)</label>
            <input
              v-model="containerBorderRadius"
              type="number"
              min="0"
              max="50"
              class="field-input"
              placeholder="0"
            />
          </div>
          
          <div class="field-group">
            <label class="field-label">Border Width (px)</label>
            <input
              v-model="containerBorderWidth"
              type="number"
              min="0"
              max="10"
              class="field-input"
              placeholder="0"
            />
          </div>
          
          <div class="field-group">
            <label class="field-label">Border Color</label>
            <input
              v-model="containerBorderColor"
              type="color"
              class="field-color"
            />
          </div>
          
          <div class="editor-actions">
            <button @click="saveContainer" class="save-btn">Save</button>
            <button @click="cancelEdit" class="cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
      
      <!-- Display Mode -->
      <div 
        v-else
        class="container-element"
        :style="containerStyles"
        @dblclick="toggleEdit"
      >
        <div class="container-placeholder">
          <div class="placeholder-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <path d="M9 9h6v6H9z"/>
            </svg>
          </div>
          <span class="placeholder-text">Container Block</span>
          <span class="placeholder-hint">Double-click to edit styling</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
// Removed unused useDocumentStore import
import type { ContainerBlock } from '../../schema/document';

/**
 * Component props
 */
interface Props {
  block: ContainerBlock;
  columnId: string;
  rowId: string;
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
  update: [updates: Partial<ContainerBlock>];
}

const emit = defineEmits<Emits>();

// Stores (removed unused documentStore)

// State
const showControls = ref(false);
const isEditing = ref(false);
const containerBgColor = ref((props.block.style?.backgroundColor as string) || '#f8fafc');
const containerPadding = ref(parseInt((props.block.style?.padding as string) || '16'));
const containerBorderRadius = ref(parseInt((props.block.style?.borderRadius as string) || '0'));
const containerBorderWidth = ref(parseInt((props.block.style?.borderWidth as string) || '0'));
const containerBorderColor = ref((props.block.style?.borderColor as string) || '#e2e8f0');

/**
 * Computed container styles
 */
const containerStyles = computed(() => {
  const styles: Record<string, string> = {
    backgroundColor: containerBgColor.value,
    padding: `${containerPadding.value}px`,
    borderRadius: `${containerBorderRadius.value}px`,
    borderWidth: `${containerBorderWidth.value}px`,
    borderStyle: containerBorderWidth.value > 0 ? 'solid' : 'none',
    borderColor: containerBorderColor.value,
    minHeight: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...props.block.style
  };
  
  return styles;
});

/**
 * Handle block selection
 */
function handleSelect() {
  emit('select');
}

/**
 * Toggle edit mode
 */
function toggleEdit() {
  isEditing.value = !isEditing.value;
  
  if (isEditing.value) {
    containerBgColor.value = (props.block.style?.backgroundColor as string) || '#f8fafc';
    containerPadding.value = parseInt((props.block.style?.padding as string) || '16');
    containerBorderRadius.value = parseInt((props.block.style?.borderRadius as string) || '0');
    containerBorderWidth.value = parseInt((props.block.style?.borderWidth as string) || '0');
    containerBorderColor.value = (props.block.style?.borderColor as string) || '#e2e8f0';
  }
}

/**
 * Save container changes
 */
function saveContainer() {
  if (!isEditing.value) return;
  
  const updates: Partial<ContainerBlock> = {
    style: {
      ...props.block.style,
      backgroundColor: containerBgColor.value,
      padding: `${containerPadding.value}px`,
      borderRadius: `${containerBorderRadius.value}px`,
      borderWidth: `${containerBorderWidth.value}px`,
      borderStyle: containerBorderWidth.value > 0 ? 'solid' : 'none',
      borderColor: containerBorderColor.value,
      minHeight: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  };
  
  emit('update', updates);
  isEditing.value = false;
}

/**
 * Cancel edit mode
 */
function cancelEdit() {
  containerBgColor.value = (props.block.style?.backgroundColor as string) || '#f8fafc';
  containerPadding.value = parseInt((props.block.style?.padding as string) || '16');
  containerBorderRadius.value = parseInt((props.block.style?.borderRadius as string) || '0');
  containerBorderWidth.value = parseInt((props.block.style?.borderWidth as string) || '0');
  containerBorderColor.value = (props.block.style?.borderColor as string) || '#e2e8f0';
  isEditing.value = false;
}
</script>

<style scoped>
/* Container Block Styles */
.container-block-wrapper {
  position: relative;
  margin-bottom: 4px;
  transition: all 0.2s ease;
}

.container-block-wrapper:hover {
  z-index: 10;
}

.container-block-wrapper.selected {
  z-index: 20;
}

.container-block-wrapper.selected .container-content {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

.container-block-wrapper.editing .container-content {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

/* Block Controls */
.block-controls {
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 6px;
  background-color: var(--panel);
  border: 1px solid var(--border);
  border-radius: 4px 4px 0 0;
  z-index: 10;
  font-size: 11px;
}

.block-controls__handle {
  display: flex;
  align-items: center;
  color: var(--muted);
  cursor: grab;
}

.block-controls__handle:active {
  cursor: grabbing;
}

.block-controls__actions {
  display: flex;
  gap: 2px;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
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

.block-controls__info {
  display: flex;
  align-items: center;
}

.block-label {
  font-size: 10px;
  font-weight: 500;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Container Content */
.container-content {
  position: relative;
  min-height: 60px;
  border-radius: 0 0 4px 4px;
  transition: all 0.2s ease;
}

/* Container Element */
.container-element {
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 60px;
}

.container-element:hover {
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
}

.container-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  text-align: center;
}

.placeholder-icon {
  color: var(--muted);
  opacity: 0.6;
}

.placeholder-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--fg);
}

.placeholder-hint {
  font-size: 12px;
  color: var(--muted);
}

/* Container Editor */
.container-editor {
  width: 100%;
  padding: 16px;
  background-color: var(--panel);
  border: 1px solid var(--border);
  border-radius: 4px;
}

.editor-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--fg);
}

.field-input {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 14px;
  background-color: var(--panel);
  color: var(--fg);
  transition: all 0.2s ease;
}

.field-color {
  width: 60px;
  height: 40px;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background-color: var(--panel);
  cursor: pointer;
}

.field-input:focus,
.field-color:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.field-input::placeholder {
  color: var(--muted);
}

.editor-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.save-btn {
  padding: 6px 12px;
  border: none;
  background-color: var(--accent);
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-btn:hover {
  background-color: var(--accent);
  opacity: 0.9;
}

.cancel-btn {
  padding: 6px 12px;
  border: 1px solid var(--border);
  background-color: transparent;
  color: var(--fg);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background-color: var(--border);
}

/* Responsive */
@media (max-width: 768px) {
  .block-controls {
    padding: 1px 4px;
  }
  
  .control-btn {
    width: 16px;
    height: 16px;
  }
  
  .block-label {
    font-size: 9px;
  }
  
  .container-editor {
    padding: 12px;
  }
  
  .editor-actions {
    flex-direction: column;
  }
}
</style>