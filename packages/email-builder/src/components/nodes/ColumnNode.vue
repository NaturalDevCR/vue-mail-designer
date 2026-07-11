<template>
  <div
    :class="[
      'column-node-wrapper',
      {
        selected: selected,
        'has-blocks': column.blocks.length > 0,
        empty: column.blocks.length === 0,
      },
    ]"
    @click.stop="handleSelect"
    @mouseenter="showControls = true"
    @mouseleave="showControls = false"
  >
    <!-- Column Controls -->
    <div
      v-if="(showControls || selected) && !hasChildSelected"
      class="column-controls"
    >
      <div
        class="column-controls__handle column-handle"
        title="Drag to reorder"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </div>

      <div class="column-controls__actions">
        <button
          @click.stop="$emit('duplicate')"
          class="control-btn"
          title="Duplicate Column"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2 2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>

        <button
          @click.stop="$emit('delete')"
          class="control-btn control-btn--danger"
          title="Delete Column"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="3,6 5,6 21,6" />
            <path
              d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
            />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>
      </div>

      <div class="column-controls__info">
        <span class="column-label">{{ columnWidthLabel }}</span>
      </div>
    </div>

    <!-- Column Content using Vuemail Column -->
    <VueEmailColumn
      class="column-content"
      :width="columnWidthPercent"
      :style="columnStyles"
    >
      <!-- Blocks Container (Always Present for Drag-and-Drop) -->
      <div
        ref="blocksContainer"
        class="blocks-container"
        @dragover="handleDragOver"
        @drop="handleDrop"
      >
        <!-- Empty Column State -->
        <div
          v-if="column.blocks.length === 0"
          class="column-empty-state"
          @dragover="handleDragOver"
          @drop="handleDrop"
        >
          <div class="empty-content">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="9" x2="15" y2="9" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            <p>Drop content here</p>
          </div>
        </div>

        <!-- Blocks -->
        <div
          v-for="(block, index) in column.blocks"
          :key="block.id"
          :data-swapy-slot="block.id"
          class="block-slot"
        >
          <div :data-swapy-item="block.id" class="block-item">
            <component
              :is="getBlockComponent(block.type)"
              :block="block"
              :column-id="column.id"
              :row-id="rowId"
              :index="index"
              :selected="isBlockSelected(block.id)"
              @select="selectBlock(block.id)"
              @delete="deleteBlock(block.id)"
              @duplicate="duplicateBlock(block.id)"
              @update="updateBlock(block.id, $event)"
            />
          </div>
        </div>
      </div>
    </VueEmailColumn>

    <!-- Resize Handle -->
    <div
      v-if="(showControls || selected) && !hasChildSelected"
      class="resize-handle"
      @mousedown="startResize"
      title="Resize column"
    >
      <div class="resize-line"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useDocumentStore } from "../../stores/useDocumentStore";
import { useUiStore } from "../../stores/useUiStore";
import { createSwapy } from "swapy";
import TextBlock from "./TextBlock.vue";
import ImageBlock from "./ImageBlock.vue";
import ButtonBlock from "./ButtonBlock.vue";
import DividerBlock from "./DividerBlock.vue";
import SpacerBlock from "./SpacerBlock.vue";
import ContainerBlock from "./ContainerBlock.vue";
import { Column as VueEmailColumn } from "@vue-email/components";
import type { Column, Block, BlockType } from "../../schema/document";

/**
 * Component props
 */
interface Props {
  column: Column;
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
  resize: [width: number];
}

const emit = defineEmits<Emits>();

// Stores
const documentStore = useDocumentStore();
const ui = useUiStore();

// State
const showControls = ref(false);
const isResizing = ref(false);
const columnWidth = ref(props.column.width || 6);
const blocksContainer = ref<HTMLElement | null>(null);
let swapy: ReturnType<typeof createSwapy> | null = null;

/**
 * Computed column width as percentage for Vuemail Column component
 */
const columnWidthPercent = computed(() => {
  const width = props.column.width || 6;
  return `${(width / 12) * 100}%`;
});

/**
 * Computed column width label
 */
const columnWidthLabel = computed(() => {
  const width = props.column.width || 6;
  return `${width}/12`;
});

/**
 * Computed column styles for Vuemail Column component
 */
const columnStyles = computed(() => {
  const styles: Record<string, string> = {
    minHeight: "60px",
    backgroundColor: "#ffffff",
    padding: "8px",
    ...props.column.style,
  };

  // Convert 'transparent' to proper hex format for Vuemail compatibility
  if (styles.backgroundColor === "transparent") {
    styles.backgroundColor = "#ffffff";
  }

  return styles;
});

/**
 * Get the appropriate block component
 */
function getBlockComponent(blockType: BlockType) {
  const components = {
    text: TextBlock,
    image: ImageBlock,
    button: ButtonBlock,
    divider: DividerBlock,
    spacer: SpacerBlock,
    container: ContainerBlock,
  };

  return components[blockType] || TextBlock;
}

/**
 * Handle column selection
 */
function handleSelect() {
  documentStore.select("column", props.column.id);
  emit("select");
}

/**
 * Check if a block is selected
 */
function isBlockSelected(blockId: string): boolean {
  return (
    documentStore.selection.nodeType === "block" &&
    documentStore.selection.id === blockId
  );
}

/**
 * Check if any child block is selected
 */
const hasChildSelected = computed(() => {
  if (!documentStore.selection.nodeType || !documentStore.selection.id)
    return false;

  // Check if any block in this column is selected
  if (documentStore.selection.nodeType === "block") {
    return props.column.blocks.some(
      (block) => block.id === documentStore.selection.id
    );
  }

  return false;
});

/**
 * Select a block
 */
function selectBlock(blockId: string) {
  documentStore.select("block", blockId);
}

/**
 * Delete a block
 */
function deleteBlock(blockId: string) {
  if (ui.preferences.confirmDelete) {
    if (!confirm("Are you sure you want to delete this block?")) {
      return;
    }
  }
  documentStore.removeBlock(blockId);
}

/**
 * Duplicate a block
 */
function duplicateBlock(blockId: string) {
  documentStore.duplicateBlock(blockId);
}

/**
 * Update a block
 */
function updateBlock(blockId: string, updates: Partial<Block>) {
  documentStore.updateBlock(blockId, updates);
}

/**
 * Handle drag over event
 */
function handleDragOver(event: DragEvent) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "copy";
  }
}

/**
 * Handle drop event from Palette
 */
function handleDrop(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation(); // Prevent bubbling to parent handlers

  if (!event.dataTransfer) return;

  try {
    const dragData = JSON.parse(event.dataTransfer.getData("application/json"));

    if (dragData.source === "palette" && dragData.type !== "row") {
      // Add block to this column
      documentStore.addBlock(props.column.id, dragData.type);
    }
  } catch (error) {
    // Silently handle invalid drag data
  }
}

/**
 * Initialize Swapy for block drag and drop
 */
function initializeSwapy() {
  if (blocksContainer.value && props.column.blocks.length > 0) {
    swapy = createSwapy(blocksContainer.value);

    swapy.onSwap(({ data }: { data: { object: Record<string, string> } }) => {
      const newOrder = Object.keys(data.object).map((slotId) => slotId);
      reorderBlocks(newOrder);
    });
  }
}

/**
 * Reorder blocks based on new order from Swapy
 */
function reorderBlocks(newOrder: string[]) {
  const reorderedBlocks = newOrder
    .map(
      (blockId) => props.column.blocks.find((block) => block.id === blockId)!
    )
    .filter(Boolean);

  if (reorderedBlocks.length === props.column.blocks.length) {
    // Find the row that contains this column
    const row = documentStore.document.rows.find((r) =>
      r.columns.some((c) => c.id === props.column.id)
    );
    if (row) {
      documentStore.updateColumn(row.id, props.column.id, {
        blocks: reorderedBlocks,
      });
    }
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

/**
 * Start column resize
 */
function startResize(event: MouseEvent) {
  event.preventDefault();
  isResizing.value = true;

  const startX = event.clientX;
  const startWidth = props.column.width || 6;
  const containerWidth =
    (event.target as HTMLElement).closest(".columns-container")?.clientWidth ||
    800;

  function handleMouseMove(e: MouseEvent) {
    const deltaX = e.clientX - startX;
    const deltaWidth = Math.round((deltaX / containerWidth) * 12);
    const newWidth = Math.max(1, Math.min(12, startWidth + deltaWidth));

    columnWidth.value = newWidth;
    emit("resize", newWidth);
  }

  function handleMouseUp() {
    isResizing.value = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
}

// Watch for prop changes to update local state
watch(
  () => props.column.width,
  (newWidth) => {
    columnWidth.value = newWidth || 6;
  }
);

// Watch for blocks changes to reinitialize Swapy
watch(
  () => props.column.blocks.length,
  () => {
    cleanupSwapy();
    if (props.column.blocks.length > 0) {
      // Use nextTick to ensure DOM is updated
      setTimeout(() => {
        initializeSwapy();
      }, 0);
    }
  }
);

// Lifecycle hooks
onMounted(() => {
  initializeSwapy();
});

onUnmounted(() => {
  cleanupSwapy();
});
</script>

<style scoped>
/* Column Node Styles */
.column-node-wrapper {
  position: relative;
  flex: 1;
  min-width: 0;
  transition: all 0.2s ease;
}

.column-node-wrapper:hover {
  z-index: 10;
}

.column-node-wrapper.selected {
  z-index: 20;
}

.column-node-wrapper.selected .column-content {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

/* Column Controls */
.column-controls {
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

.column-controls__handle {
  display: flex;
  align-items: center;
  color: var(--muted);
  cursor: grab;
}

.column-controls__handle:active {
  cursor: grabbing;
}

.column-controls__actions {
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

.column-controls__info {
  display: flex;
  align-items: center;
}

.column-label {
  font-size: 10px;
  font-weight: 500;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Column Content */
.column-content {
  position: relative;
  min-height: 60px;
  border-radius: 0 0 4px 4px;
  transition: all 0.2s ease;
}

/* Empty Column State */
.column-empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  padding: 16px;
  border: 2px dashed var(--border);
  border-radius: 4px;
  margin: 4px;
}

.empty-content {
  text-align: center;
  color: var(--muted);
}

.empty-content svg {
  margin-bottom: 8px;
  opacity: 0.5;
}

.empty-content p {
  margin: 0;
  font-size: 12px;
}

/* Blocks Container */
.blocks-container {
  min-height: 60px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-radius: 6px;
  background-color: rgba(248, 250, 252, 0.3);
  border: 1px dashed rgba(203, 213, 225, 0.5);
}

.block-slot {
  min-height: 40px;
  margin-bottom: 6px;
}

.block-slot:last-child {
  margin-bottom: 0;
}

.block-item {
  width: 100%;
  height: 100%;
}

/* Resize Handle */
.resize-handle {
  position: absolute;
  top: 0;
  right: -2px;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 15;
}

.resize-handle:hover .resize-line {
  background-color: var(--accent);
  opacity: 1;
}

.resize-line {
  width: 2px;
  height: 20px;
  background-color: var(--border);
  border-radius: 1px;
  opacity: 0.5;
  transition: all 0.2s ease;
}

/* Responsive */
@media (max-width: 768px) {
  .column-controls {
    padding: 1px 4px;
  }

  .control-btn {
    width: 16px;
    height: 16px;
  }

  .column-label {
    font-size: 9px;
  }

  .resize-handle {
    display: none;
  }
}
</style>
