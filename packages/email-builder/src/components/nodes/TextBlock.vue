<template>
  <div 
    :class="[
      'text-block-wrapper',
      {
        'selected': selected,
        'editing': isEditing
      }
    ]"
    @click.stop="handleSelect"
    @mouseenter="showControls = true"
    @mouseleave="showControls = false"
    @dragstart.prevent
    @drag.prevent
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
          :title="isEditing ? 'Stop Editing' : 'Quick Edit'"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
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
        <span class="block-label">Text</span>
      </div>
    </div>
    
    <!-- Text Content using Vuemail Text -->
    <VueEmailText 
      class="text-content"
      :style="textStyles"
    >
      <!-- Edit Mode -->
      <div 
        v-if="isEditing"
        class="text-editor"
      >
        <textarea
          ref="textEditor"
          v-model="textContent"
          class="text-input"
          :placeholder="'Enter your text here...'"
          @blur="saveText"
          @keydown.enter.meta="saveText"
          @keydown.enter.ctrl="saveText"
          @keydown.escape="cancelEdit"
          @click.stop
          @mousedown.stop
          @dragstart.stop.prevent
        ></textarea>
      </div>
      
      <!-- Display Mode -->
      <div 
        v-else
        class="text-display"
        @dblclick.stop="toggleEdit"
        @click.stop
        @mousedown.stop
        @dragstart.stop.prevent
        v-html="displayText"
      ></div>
    </VueEmailText>
    

  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
// Removed unused useDocumentStore import
import { Text as VueEmailText } from '@vue-email/components';
import type { TextBlock } from '../../schema/document';

/**
 * Component props
 */
interface Props {
  block: TextBlock;
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
  update: [updates: Partial<TextBlock>];
}

const emit = defineEmits<Emits>();

// Stores (removed unused documentStore)

// State
const showControls = ref(false);
const isEditing = ref(false);

const textContent = ref(props.block.html || props.block.plaintext || '');
const textEditor = ref<HTMLTextAreaElement>();

/**
 * Computed text styles for Vuemail Text component
 */
const textStyles = computed(() => {
  const styles: Record<string, string> = {
    fontSize: '14px',
    lineHeight: '1.4',
    color: '#333333',
    fontFamily: 'Arial, sans-serif',
    margin: '0',
    padding: '8px',
    ...props.block.style
  };
  
  return styles;
});

/**
 * Computed display text
 */
const displayText = computed(() => {
  return props.block.html || props.block.plaintext || 'Enter your text here...';
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
async function toggleEdit() {
  isEditing.value = !isEditing.value;
  
  if (isEditing.value) {
    textContent.value = props.block.html || props.block.plaintext || '';
    await nextTick();
    if (textEditor.value) {
      textEditor.value.focus();
      textEditor.value.select();
    }
  }
}

/**
 * Save text changes
 */
function saveText() {
  if (!isEditing.value) return;
  
  const updates: Partial<TextBlock> = {
    html: textContent.value,
    plaintext: textContent.value.replace(/<[^>]*>/g, '') // Strip HTML for plaintext
  };
  
  emit('update', updates);
  isEditing.value = false;
}

/**
 * Cancel edit mode
 */
function cancelEdit() {
  textContent.value = props.block.html || props.block.plaintext || '';
  isEditing.value = false;
}



// Watch for prop changes to update local state
watch(() => props.block.html, (newHtml) => {
  if (!isEditing.value) {
    textContent.value = newHtml || props.block.plaintext || '';
  }
});

watch(() => props.block.plaintext, (newPlaintext) => {
  if (!isEditing.value && !props.block.html) {
    textContent.value = newPlaintext || '';
  }
});
</script>

<style scoped>
/* Text Block Styles */
.text-block-wrapper {
  position: relative;
  margin-bottom: 4px;
  margin-top: 32px;
  transition: all 0.2s ease;
}

.text-block-wrapper:hover {
  z-index: 10;
}

.text-block-wrapper.selected {
  z-index: 20;
}

.text-block-wrapper.selected .text-content {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

.text-block-wrapper.editing .text-content {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

/* Block Controls */
.block-controls {
  position: absolute;
  top: -28px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background-color: var(--panel);
  border: 1px solid var(--border);
  border-radius: 4px;
  z-index: 10;
  font-size: 11px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

/* Text Content */
.text-content {
  position: relative;
  min-height: 40px;
  border-radius: 4px;
  transition: all 0.2s ease;
  margin-top: 4px;
}

/* Text Editor */
.text-editor {
  position: relative;
}

.text-input {
  width: 100%;
  min-height: 60px;
  padding: 8px;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  color: inherit;
  resize: vertical;
  outline: none;
}

.text-input::placeholder {
  color: var(--muted);
  opacity: 0.7;
}

/* Text Display */
.text-display {
  min-height: 40px;
  cursor: text;
  word-wrap: break-word;
}

.text-display:empty::before {
  content: 'Enter your text here...';
  color: var(--muted);
  opacity: 0.7;
  font-style: italic;
}

.text-display:hover {
  background-color: rgba(0, 0, 0, 0.02);
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
}
</style>