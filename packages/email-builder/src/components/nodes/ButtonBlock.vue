<template>
  <div 
    :class="[
      'button-block-wrapper',
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
          :title="isEditing ? 'Stop Editing' : 'Edit Button'"
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
        <span class="block-label">Button</span>
      </div>
    </div>
    
    <!-- Button Content using Vuemail Button -->
    <div class="button-content">
      <!-- Edit Mode -->
      <div 
        v-if="isEditing"
        class="button-editor"
      >
        <div class="editor-fields">
          <div class="field-group">
            <label class="field-label">Button Text</label>
            <input
              v-model="buttonText"
              type="text"
              class="field-input"
              placeholder="Click me"
            />
          </div>
          
          <div class="field-group">
            <label class="field-label">Link URL</label>
            <input
              v-model="buttonUrl"
              type="url"
              class="field-input"
              placeholder="https://example.com"
            />
          </div>
          
          <div class="field-group">
            <label class="field-label">Target</label>
            <select v-model="buttonTarget" class="field-select">
              <option value="_blank">New Window (_blank)</option>
              <option value="_self">Same Window (_self)</option>
            </select>
          </div>
          
          <div class="editor-actions">
            <button @click="saveButton" class="save-btn">Save</button>
            <button @click="cancelEdit" class="cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
      
      <!-- Display Mode -->
      <VueEmailButton 
        v-else
        :href="block.href || '#'"
        :target="block.target || '_blank'"
        class="button-element"
        :style="buttonStyles"
        @dblclick="toggleEdit"
      >
        {{ block.label || 'Click me' }}
      </VueEmailButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
// Removed unused useDocumentStore import
import { Button as VueEmailButton } from '@vue-email/components';
import type { ButtonBlock } from '../../schema/document';

/**
 * Component props
 */
interface Props {
  block: ButtonBlock;
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
  update: [updates: Partial<ButtonBlock>];
}

const emit = defineEmits<Emits>();

// Stores (removed unused documentStore)

// State
const showControls = ref(false);
const isEditing = ref(false);
const buttonText = ref(props.block.label || '');
const buttonUrl = ref(props.block.href || '');
const buttonTarget = ref(props.block.target || '_blank');

/**
 * Computed button styles for Vuemail Button component
 */
const buttonStyles = computed(() => {
  const styles: Record<string, string> = {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: 'Arial, sans-serif',
    padding: '12px 24px',
    borderRadius: '6px',
    textDecoration: 'none',
    display: 'inline-block',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'center',
    lineHeight: '1',
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
    buttonText.value = props.block.label || '';
    buttonUrl.value = props.block.href || '';
    buttonTarget.value = props.block.target || '_blank';
  }
}

/**
 * Save button changes
 */
function saveButton() {
  if (!isEditing.value) return;
  
  const updates: Partial<ButtonBlock> = {
    label: buttonText.value,
    href: buttonUrl.value,
    target: buttonTarget.value as '_blank' | '_self'
  };
  
  emit('update', updates);
  isEditing.value = false;
}

/**
 * Cancel edit mode
 */
function cancelEdit() {
  buttonText.value = props.block.label || '';
  buttonUrl.value = props.block.href || '';
  buttonTarget.value = props.block.target || '_blank';
  isEditing.value = false;
}
</script>

<style scoped>
/* Button Block Styles */
.button-block-wrapper {
  position: relative;
  margin-bottom: 4px;
  transition: all 0.2s ease;
}

.button-block-wrapper:hover {
  z-index: 10;
}

.button-block-wrapper.selected {
  z-index: 20;
}

.button-block-wrapper.selected .button-content {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

.button-block-wrapper.editing .button-content {
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

/* Button Content */
.button-content {
  position: relative;
  min-height: 50px;
  border-radius: 0 0 4px 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

/* Button Element */
.button-element {
  cursor: pointer;
  transition: all 0.2s ease;
}

.button-element:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Button Editor */
.button-editor {
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

.field-input,
.field-select {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 14px;
  background-color: var(--panel);
  color: var(--fg);
  transition: all 0.2s ease;
}

.field-input:focus,
.field-select:focus {
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
  
  .button-editor {
    padding: 12px;
  }
  
  .editor-actions {
    flex-direction: column;
  }
}
</style>