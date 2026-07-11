<template>
  <div class="palette">
    <!-- Palette Header -->
    <div class="palette__header">
      <h3 class="palette__title">Elements</h3>
      <button 
        @click="ui.setSidebarCollapsed(true)"
        class="palette__close-btn"
        title="Close Palette"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    
    <!-- Search/Filter -->
    <div class="palette__search">
      <div class="search-input">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Search elements..."
          class="search-input__field"
        />
      </div>
    </div>
    
    <!-- Element Categories -->
    <div class="palette__content">
      <!-- Structure Elements -->
      <div class="palette__category">
        <div class="palette__category-header" @click="toggleCategory('structure')">
          <svg 
            :class="['category-icon', { expanded: expandedCategories.structure }]"
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          >
            <polyline points="6,9 12,15 18,9"/>
          </svg>
          <span class="category-title">Structure</span>
        </div>
        
        <div v-if="expandedCategories.structure" class="palette__category-content">
          <!-- Row Elements -->
          <div class="palette-draggable">
            <div 
              v-for="element in rowItems" 
              :key="element.id"
              class="palette__item palette__item--structure"
              draggable="true"
              @dragstart="handleDragStart($event, element)"
              @dragend="handleDragEnd"
            >
              <div class="palette__item-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="9" y1="9" x2="15" y2="9"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
              </div>
              <div class="palette__item-content">
                <div class="palette__item-title">{{ element.title }}</div>
                <div class="palette__item-description">{{ element.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Content Elements -->
      <div class="palette__category">
        <div class="palette__category-header" @click="toggleCategory('content')">
          <svg 
            :class="['category-icon', { expanded: expandedCategories.content }]"
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          >
            <polyline points="6,9 12,15 18,9"/>
          </svg>
          <span class="category-title">Content</span>
        </div>
        
        <div v-if="expandedCategories.content" class="palette__category-content">
          <!-- Block Elements -->
          <div class="palette-draggable">
            <div 
              v-for="element in blockItems" 
              :key="element.id"
              class="palette__item palette__item--content"
              draggable="true"
              @dragstart="handleDragStart($event, element)"
              @dragend="handleDragEnd"
            >
              <div class="palette__item-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <component :is="'path'" v-if="element.icon" :d="element.icon" />
                  <template v-else-if="element.type === 'text'">
                    <polyline points="4,7 4,4 20,4 20,7"/>
                    <line x1="9" y1="20" x2="15" y2="20"/>
                    <line x1="12" y1="4" x2="12" y2="20"/>
                  </template>
                  <template v-else-if="element.type === 'image'">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21,15 16,10 5,21"/>
                  </template>
                  <template v-else-if="element.type === 'button'">
                    <rect x="3" y="8" width="18" height="8" rx="4"/>
                    <path d="M12 12h.01"/>
                  </template>
                  <template v-else-if="element.type === 'divider'">
                    <line x1="3" y1="12" x2="21" y2="12"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <line x1="3" y1="18" x2="21" y2="18"/>
                  </template>
                  <template v-else-if="element.type === 'spacer'">
                    <rect x="3" y="8" width="18" height="8" rx="2" fill="none" stroke-dasharray="2,2"/>
                  </template>
                  <template v-else-if="element.type === 'container'">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </template>
                </svg>
              </div>
              <div class="palette__item-content">
                <div class="palette__item-title">{{ element.title }}</div>
                <div class="palette__item-description">{{ element.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Templates Section (Future Enhancement) -->
      <div class="palette__category">
        <div class="palette__category-header" @click="toggleCategory('templates')">
          <svg 
            :class="['category-icon', { expanded: expandedCategories.templates }]"
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          >
            <polyline points="6,9 12,15 18,9"/>
          </svg>
          <span class="category-title">Templates</span>
        </div>
        
        <div v-if="expandedCategories.templates" class="palette__category-content">
          <div class="palette__empty-state">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="9" x2="15" y2="9"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            <p>Templates coming soon</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useUiStore } from '../stores/useUiStore';


// Store
const ui = useUiStore();

// State
const searchQuery = ref('');
const expandedCategories = reactive({
  structure: true,
  content: true,
  templates: false
});

// Palette items data
const rowItems = ref([
  {
    id: 'row-1',
    type: 'row',
    title: 'Row',
    description: 'Container for columns'
  }
]);

const blockItems = ref([
  {
    id: 'text-1',
    type: 'text',
    title: 'Text',
    description: 'Rich text content'
  },
  {
    id: 'image-1',
    type: 'image',
    title: 'Image',
    description: 'Pictures and graphics'
  },
  {
    id: 'button-1',
    type: 'button',
    title: 'Button',
    description: 'Call-to-action button'
  },
  {
    id: 'divider-1',
    type: 'divider',
    title: 'Divider',
    description: 'Visual separator'
  },
  {
    id: 'spacer-1',
    type: 'spacer',
    title: 'Spacer',
    description: 'Add vertical spacing'
  },
  {
    id: 'container-1',
    type: 'container',
    title: 'Container',
    description: 'Content wrapper'
  }
]);

/**
 * Handle drag start for palette items
 */
function handleDragStart(event: DragEvent, element: { id: string; type: string; title: string; description: string }) {
  if (!event.dataTransfer) return;
  
  // Set drag data
  event.dataTransfer.setData('application/json', JSON.stringify({
    source: 'palette',
    type: element.type,
    data: element
  }));
  
  // Set drag effect
  event.dataTransfer.effectAllowed = 'copy';
  
  // Add visual feedback
  document.body.classList.add('dragging-from-palette');
}

/**
 * Handle drag end for palette items
 */
function handleDragEnd() {
  document.body.classList.remove('dragging-from-palette');
}



/**
 * Toggle category expansion
 */
function toggleCategory(category: keyof typeof expandedCategories) {
  expandedCategories[category] = !expandedCategories[category];
}




</script>

<style scoped>
.palette {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--panel);
}

.palette__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border);
}

.palette__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--fg);
}

.palette__close-btn {
  padding: 4px;
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.palette__close-btn:hover {
  background-color: var(--border);
  color: var(--fg);
}

.palette__search {
  padding: 16px;
  border-bottom: 1px solid var(--border);
}

.search-input {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input svg {
  position: absolute;
  left: 12px;
  color: var(--muted);
  pointer-events: none;
}

.search-input__field {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background-color: var(--bg);
  color: var(--fg);
  font-size: 13px;
  transition: border-color 0.2s ease;
}

.search-input__field:focus {
  outline: none;
  border-color: var(--accent);
}

.search-input__field::placeholder {
  color: var(--muted);
}

.palette__content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.palette__category {
  margin-bottom: 8px;
}

.palette__category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  user-select: none;
}

.palette__category-header:hover {
  background-color: var(--border);
}

.category-icon {
  transition: transform 0.2s ease;
  color: var(--muted);
}

.category-icon.expanded {
  transform: rotate(0deg);
}

.category-icon:not(.expanded) {
  transform: rotate(-90deg);
}

.category-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--fg);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.palette__category-content {
  padding: 4px 0;
}

.palette__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin: 2px 8px;
  border-radius: 6px;
  cursor: grab;
  transition: all 0.2s ease;
  user-select: none;
  border: 2px solid transparent;
}

.palette__item:hover {
  background-color: var(--border);
  cursor: grab;
}

.palette__item:active {
  cursor: grabbing;
  transform: scale(0.98);
  opacity: 0.8;
}

.palette-draggable {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.palette__item--structure {
  border-left: 3px solid #10b981;
}

.palette__item--content {
  border-left: 3px solid #3b82f6;
}

.palette__item-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background-color: var(--bg);
  color: var(--muted);
}

.palette__item--structure .palette__item-icon {
  color: #10b981;
}

.palette__item--content .palette__item-icon {
  color: #3b82f6;
}

.palette__item-content {
  flex: 1;
  min-width: 0;
}

.palette__item-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--fg);
  margin-bottom: 2px;
}

.palette__item-description {
  font-size: 11px;
  color: var(--muted);
  line-height: 1.3;
}

.palette__empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
  color: var(--muted);
}

.palette__empty-state svg {
  margin-bottom: 12px;
  opacity: 0.5;
}

.palette__empty-state p {
  margin: 0;
  font-size: 13px;
}

/* Drag and drop visual feedback */
.palette__item[draggable="true"] {
  position: relative;
}

.palette__item[draggable="true"]::after {
  content: '';
  position: absolute;
  top: 2px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: radial-gradient(circle, var(--muted) 1px, transparent 1px);
  background-size: 3px 3px;
  opacity: 0.5;
}

/* Responsive design */
@media (max-width: 768px) {
  .palette__item {
    padding: 10px 12px;
    margin: 1px 4px;
  }
  
  .palette__item-icon {
    width: 28px;
    height: 28px;
  }
  
  .palette__item-title {
    font-size: 12px;
  }
  
  .palette__item-description {
    font-size: 10px;
  }
}
</style>