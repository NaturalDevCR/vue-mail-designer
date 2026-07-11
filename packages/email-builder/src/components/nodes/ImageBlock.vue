<template>
  <div 
    :class="[
      'image-block-wrapper',
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
          :title="isEditing ? 'Stop Editing' : 'Edit Image'"
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
        <span class="block-label">Image</span>
      </div>
    </div>
    
    <!-- Image Content using Vuemail Img -->
    <div class="image-content">
      <!-- Edit Mode -->
      <div 
        v-if="isEditing"
        class="image-editor"
      >
        <div class="editor-fields">
          <div class="field-group">
            <label class="field-label">Image URL</label>
            <input
              v-model="imageUrl"
              type="url"
              class="field-input"
              placeholder="https://example.com/image.jpg"
            />
          </div>
          
          <div class="field-group">
            <label class="field-label">Alt Text</label>
            <input
              v-model="altText"
              type="text"
              class="field-input"
              placeholder="Describe the image"
            />
          </div>
          
          <div class="field-group">
            <label class="field-label">Link URL (optional)</label>
            <input
              v-model="linkUrl"
              type="url"
              class="field-input"
              placeholder="https://example.com"
            />
          </div>
          
          <div class="editor-actions">
            <button @click="saveImage" class="save-btn">Save</button>
            <button @click="cancelEdit" class="cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
      
      <!-- Display Mode -->
      <VueEmailImg 
        v-else
        :src="block.src || placeholderImage"
        :alt="block.alt || 'Image'"
        :width="imageWidth"
        :height="imageHeight"
        :style="imageStyles"
        class="image-element"
        @dblclick="toggleEdit"
        @error="handleImageError"
      />
      
      <!-- Link Wrapper -->
      <a 
        v-if="block.href && !isEditing"
        :href="block.href"
        target="_blank"
        rel="noopener noreferrer"
        class="image-link"
      >
        <VueEmailImg 
          :src="block.src || placeholderImage"
          :alt="block.alt || 'Image'"
          :width="imageWidth"
          :height="imageHeight"
          :style="imageStyles"
          class="image-element"
          @error="handleImageError"
        />
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
// Removed unused useDocumentStore import
import { Img as VueEmailImg } from '@vue-email/components';
import type { ImageBlock } from '../../schema/document';

/**
 * Component props
 */
interface Props {
  block: ImageBlock;
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
  update: [updates: Partial<ImageBlock>];
}

const emit = defineEmits<Emits>();

// Stores (removed unused documentStore)

// State
const showControls = ref(false);
const isEditing = ref(false);
const imageUrl = ref(props.block.src || '');
const altText = ref(props.block.alt || '');
const linkUrl = ref(props.block.href || '');
const imageError = ref(false);

// Placeholder image for empty state
const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMjUgNzVIMTc1VjEyNUgxMjVWNzVaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xNDAgMTAwTDE2MCA4MEwxODAgMTAwTDE2MCA4MEwxNDAgMTAwWiIgZmlsbD0iIzZCNzI4MCIvPgo8L3N2Zz4K';

/**
 * Computed image width
 */
const imageWidth = computed(() => {
  return props.block.width || 'auto';
});

/**
 * Computed image height
 */
const imageHeight = computed(() => {
  return props.block.height || 'auto';
});

/**
 * Computed image styles for Vuemail Img component
 */
const imageStyles = computed(() => {
  const styles: Record<string, string> = {
    display: 'block',
    maxWidth: '100%',
    height: 'auto',
    border: '0',
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
    imageUrl.value = props.block.src || '';
    altText.value = props.block.alt || '';
    linkUrl.value = props.block.href || '';
  }
}

/**
 * Save image changes
 */
function saveImage() {
  if (!isEditing.value) return;
  
  const updates: Partial<ImageBlock> = {
    src: imageUrl.value,
    alt: altText.value,
    href: linkUrl.value || undefined
  };
  
  emit('update', updates);
  isEditing.value = false;
  imageError.value = false;
}

/**
 * Cancel edit mode
 */
function cancelEdit() {
  imageUrl.value = props.block.src || '';
  altText.value = props.block.alt || '';
  linkUrl.value = props.block.href || '';
  isEditing.value = false;
}

/**
 * Handle image load error
 */
function handleImageError() {
  imageError.value = true;
}
</script>

<style scoped>
/* Image Block Styles */
.image-block-wrapper {
  position: relative;
  margin-bottom: 4px;
  transition: all 0.2s ease;
}

.image-block-wrapper:hover {
  z-index: 10;
}

.image-block-wrapper.selected {
  z-index: 20;
}

.image-block-wrapper.selected .image-content {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

.image-block-wrapper.editing .image-content {
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

/* Image Content */
.image-content {
  position: relative;
  min-height: 100px;
  border-radius: 0 0 4px 4px;
  transition: all 0.2s ease;
}

/* Image Element */
.image-element {
  cursor: pointer;
  transition: all 0.2s ease;
}

.image-element:hover {
  opacity: 0.9;
}

/* Image Link */
.image-link {
  display: block;
  text-decoration: none;
}

/* Image Editor */
.image-editor {
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

.field-input:focus {
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
  
  .image-editor {
    padding: 12px;
  }
  
  .editor-actions {
    flex-direction: column;
  }
}
</style>