<template>
  <div class="properties-panel">
    <!-- No Selection State -->
    <div v-if="!selectedElement" class="no-selection">
      <div class="no-selection__icon">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path d="M9 12l2 2 4-4" />
          <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" />
          <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3" />
          <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3" />
          <path d="M12 21c0-1-1-3-3-3s-3 2-3 3 1 3 3 3 3-2 3-3" />
        </svg>
      </div>
      <h3 class="no-selection__title">No Element Selected</h3>
      <p class="no-selection__description">
        Select an element in the canvas to edit its properties
      </p>
    </div>

    <!-- Document Properties -->
    <div
      v-else-if="selectedElement.type === 'document'"
      class="properties-section"
    >
      <div class="section-header">
        <h3 class="section-title">Document Properties</h3>
      </div>

      <div class="property-group">
        <label class="property-label">Title</label>
        <input
          v-model="documentTitle"
          @input="updateDocumentTitle"
          type="text"
          class="text-input"
          placeholder="Email title"
        />
      </div>

      <div class="property-group">
        <label class="property-label">Subject</label>
        <input
          v-model="documentSubject"
          @input="updateDocumentSubject"
          type="text"
          class="text-input"
          placeholder="Email subject"
        />
      </div>

      <div class="property-group">
        <label class="property-label">Preheader</label>
        <textarea
          v-model="documentPreheader"
          @input="updateDocumentPreheader"
          class="textarea-input"
          placeholder="Preview text that appears in email clients"
          rows="2"
        ></textarea>
      </div>

      <div class="property-group">
        <label class="property-label">Background Color</label>
        <div class="color-input-group">
          <input
            v-model="documentBgColor"
            @input="updateDocumentBgColor"
            type="color"
            class="color-input"
          />
          <input
            v-model="documentBgColor"
            @input="updateDocumentBgColor"
            type="text"
            class="text-input color-text"
            placeholder="#ffffff"
          />
        </div>
      </div>

      <div class="property-group">
        <label class="property-label">Content Width</label>
        <div class="dimension-input">
          <input
            v-model.number="documentWidth"
            @input="updateDocumentWidth"
            type="number"
            min="320"
            max="800"
            class="number-input"
          />
          <span class="dimension-unit">px</span>
        </div>
      </div>
    </div>

    <!-- Row Properties -->
    <div v-else-if="selectedElement.type === 'row'" class="properties-section">
      <div class="section-header">
        <h3 class="section-title">Row Properties</h3>
        <span class="element-id">{{ selectedElement.id }}</span>
      </div>

      <div class="property-group">
        <label class="property-label">Background Color</label>
        <div class="color-input-group">
          <input
            v-model="rowBgColor"
            @input="updateRowStyle('backgroundColor', rowBgColor)"
            type="color"
            class="color-input"
          />
          <input
            v-model="rowBgColor"
            @input="updateRowStyle('backgroundColor', rowBgColor)"
            type="text"
            class="text-input color-text"
            placeholder="transparent"
          />
        </div>
      </div>

      <div class="property-group">
        <label class="property-label">Padding</label>
        <div class="padding-controls">
          <div class="padding-input">
            <label class="padding-label">Top</label>
            <input
              v-model.number="rowPaddingTop"
              @input="updateRowPadding"
              type="number"
              min="0"
              max="100"
              class="number-input small"
            />
          </div>
          <div class="padding-input">
            <label class="padding-label">Right</label>
            <input
              v-model.number="rowPaddingRight"
              @input="updateRowPadding"
              type="number"
              min="0"
              max="100"
              class="number-input small"
            />
          </div>
          <div class="padding-input">
            <label class="padding-label">Bottom</label>
            <input
              v-model.number="rowPaddingBottom"
              @input="updateRowPadding"
              type="number"
              min="0"
              max="100"
              class="number-input small"
            />
          </div>
          <div class="padding-input">
            <label class="padding-label">Left</label>
            <input
              v-model.number="rowPaddingLeft"
              @input="updateRowPadding"
              type="number"
              min="0"
              max="100"
              class="number-input small"
            />
          </div>
        </div>
      </div>

      <div class="property-group">
        <label class="property-label">Border</label>
        <div class="border-controls">
          <select
            v-model="rowBorderStyle"
            @change="updateRowBorder"
            class="select-input"
          >
            <option value="none">None</option>
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </select>
          <input
            v-model.number="rowBorderWidth"
            @input="updateRowBorder"
            type="number"
            min="0"
            max="10"
            class="number-input small"
            :disabled="rowBorderStyle === 'none'"
          />
          <input
            v-model="rowBorderColor"
            @input="updateRowBorder"
            type="color"
            class="color-input small"
            :disabled="rowBorderStyle === 'none'"
          />
        </div>
      </div>

      <div class="property-group">
        <label class="property-label">Column Layout</label>
        <div class="column-layout-controls">
          <div class="layout-presets">
            <button
              v-for="preset in columnPresets"
              :key="preset.name"
              @click="applyColumnPreset(preset)"
              :class="['preset-btn', { active: isCurrentPreset(preset) }]"
              :title="preset.name"
            >
              <div class="preset-visual">
                <div
                  v-for="(width, index) in preset.widths"
                  :key="index"
                  class="preset-column"
                  :style="{ width: width + '%' }"
                ></div>
              </div>
              <span class="preset-label">{{ preset.label }}</span>
            </button>
          </div>

          <div class="column-actions">
            <button
              @click="addColumnToRow"
              class="action-btn"
              :disabled="selectedRowColumns.length >= 4"
              title="Add Column"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Column
            </button>

            <button
              @click="removeLastColumn"
              class="action-btn danger"
              :disabled="selectedRowColumns.length <= 1"
              title="Remove Column"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Remove Column
            </button>
          </div>

          <div class="column-spacing">
            <label class="spacing-label">Column Gap</label>
            <input
              v-model.number="columnGap"
              @input="updateColumnGap"
              type="number"
              min="0"
              max="50"
              class="number-input small"
            />
            <span class="spacing-unit">px</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Column Properties -->
    <div
      v-else-if="selectedElement.type === 'column'"
      class="properties-section"
    >
      <div class="section-header">
        <h3 class="section-title">Column Properties</h3>
        <span class="element-id">{{ selectedElement.id }}</span>
      </div>

      <div class="property-group">
        <label class="property-label">Width</label>
        <div class="width-controls">
          <input
            v-model.number="columnWidth"
            @input="updateColumnWidth"
            type="range"
            min="10"
            max="100"
            class="width-slider"
          />
          <span class="width-display">{{ columnWidth }}%</span>
        </div>
      </div>

      <div class="property-group">
        <label class="property-label">Background Color</label>
        <div class="color-input-group">
          <input
            v-model="columnBgColor"
            @input="updateColumnStyle('backgroundColor', columnBgColor)"
            type="color"
            class="color-input"
          />
          <input
            v-model="columnBgColor"
            @input="updateColumnStyle('backgroundColor', columnBgColor)"
            type="text"
            class="text-input color-text"
            placeholder="transparent"
          />
        </div>
      </div>

      <div class="property-group">
        <label class="property-label">Padding</label>
        <div class="padding-controls">
          <div class="padding-input">
            <label class="padding-label">Top</label>
            <input
              v-model.number="columnPaddingTop"
              @input="updateColumnPadding"
              type="number"
              min="0"
              max="100"
              class="number-input small"
            />
          </div>
          <div class="padding-input">
            <label class="padding-label">Right</label>
            <input
              v-model.number="columnPaddingRight"
              @input="updateColumnPadding"
              type="number"
              min="0"
              max="100"
              class="number-input small"
            />
          </div>
          <div class="padding-input">
            <label class="padding-label">Bottom</label>
            <input
              v-model.number="columnPaddingBottom"
              @input="updateColumnPadding"
              type="number"
              min="0"
              max="100"
              class="number-input small"
            />
          </div>
          <div class="padding-input">
            <label class="padding-label">Left</label>
            <input
              v-model.number="columnPaddingLeft"
              @input="updateColumnPadding"
              type="number"
              min="0"
              max="100"
              class="number-input small"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Block Properties -->
    <div
      v-else-if="selectedElement.type === 'block'"
      class="properties-section"
    >
      <div class="section-header">
        <h3 class="section-title">
          {{ getBlockTypeLabel(selectedElement.blockType) }} Properties
        </h3>
        <span class="element-id">{{ selectedElement.id }}</span>
      </div>

      <!-- Text Block Properties -->
      <template v-if="selectedElement.blockType === 'text'">
        <div class="property-group">
          <label class="property-label">Content</label>
          <QuillyTextEditor
            v-model="textContent"
            @update:modelValue="updateTextContent"
            placeholder="Enter your text content..."
          />
        </div>

        <div class="property-group">
          <label class="property-label">Font Family</label>
          <select
            v-model="textFontFamily"
            @change="updateTextStyle('fontFamily', textFontFamily)"
            class="select-input"
          >
            <option value="Arial, sans-serif">Arial</option>
            <option value="'Helvetica Neue', Helvetica, sans-serif">
              Helvetica
            </option>
            <option value="'Times New Roman', Times, serif">
              Times New Roman
            </option>
            <option value="Georgia, serif">Georgia</option>
            <option value="'Courier New', Courier, monospace">
              Courier New
            </option>
            <option value="Verdana, sans-serif">Verdana</option>
            <option value="Tahoma, sans-serif">Tahoma</option>
            <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
            <option value="'Lucida Grande', sans-serif">Lucida Grande</option>
          </select>
        </div>

        <div class="property-group">
          <label class="property-label">Font Size</label>
          <div class="dimension-input">
            <input
              v-model.number="textFontSize"
              @input="updateTextStyle('fontSize', textFontSize + 'px')"
              type="number"
              min="8"
              max="72"
              class="number-input"
            />
            <span class="dimension-unit">px</span>
          </div>
        </div>

        <div class="property-group">
          <label class="property-label">Font Weight</label>
          <select
            v-model="textFontWeight"
            @change="updateTextStyle('fontWeight', textFontWeight)"
            class="select-input"
          >
            <option value="300">Light</option>
            <option value="400">Normal</option>
            <option value="500">Medium</option>
            <option value="600">Semi Bold</option>
            <option value="700">Bold</option>
            <option value="800">Extra Bold</option>
          </select>
        </div>

        <div class="property-group">
          <label class="property-label">Text Style</label>
          <div class="style-controls">
            <button
              @click="toggleTextStyle('fontStyle', 'italic')"
              :class="['style-btn', { active: textFontStyle === 'italic' }]"
              title="Italic"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="19" y1="4" x2="10" y2="4" />
                <line x1="14" y1="20" x2="5" y2="20" />
                <line x1="15" y1="4" x2="9" y2="20" />
              </svg>
            </button>
            <button
              @click="toggleTextStyle('textDecoration', 'underline')"
              :class="[
                'style-btn',
                { active: textTextDecoration === 'underline' },
              ]"
              title="Underline"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M6 4v6a6 6 0 0 0 12 0V4" />
                <line x1="4" y1="20" x2="20" y2="20" />
              </svg>
            </button>
          </div>
        </div>

        <div class="property-group">
          <label class="property-label">Line Height</label>
          <div class="dimension-input">
            <input
              v-model.number="textLineHeight"
              @input="updateTextStyle('lineHeight', textLineHeight)"
              type="number"
              min="1"
              max="3"
              step="0.1"
              class="number-input"
            />
            <span class="dimension-unit">em</span>
          </div>
        </div>

        <div class="property-group">
          <label class="property-label">Text Color</label>
          <div class="color-input-group">
            <input
              v-model="textColor"
              @input="updateTextStyle('color', textColor)"
              type="color"
              class="color-input"
            />
            <input
              v-model="textColor"
              @input="updateTextStyle('color', textColor)"
              type="text"
              class="text-input color-text"
              placeholder="#000000"
            />
          </div>
        </div>

        <div class="property-group">
          <label class="property-label">Text Alignment</label>
          <div class="alignment-controls">
            <button
              v-for="align in textAlignments"
              :key="align.value"
              @click="updateTextStyle('textAlign', align.value)"
              :class="['align-btn', { active: textAlign === align.value }]"
              :title="align.label"
            >
              <component :is="align.icon" />
            </button>
          </div>
        </div>

        <div class="property-group">
          <label class="property-label">Padding</label>
          <div class="padding-controls">
            <div class="padding-input">
              <label class="padding-label">Top</label>
              <input
                v-model.number="textPaddingTop"
                @input="updateTextPadding"
                type="number"
                min="0"
                max="50"
                class="number-input small"
              />
            </div>
            <div class="padding-input">
              <label class="padding-label">Right</label>
              <input
                v-model.number="textPaddingRight"
                @input="updateTextPadding"
                type="number"
                min="0"
                max="50"
                class="number-input small"
              />
            </div>
            <div class="padding-input">
              <label class="padding-label">Bottom</label>
              <input
                v-model.number="textPaddingBottom"
                @input="updateTextPadding"
                type="number"
                min="0"
                max="50"
                class="number-input small"
              />
            </div>
            <div class="padding-input">
              <label class="padding-label">Left</label>
              <input
                v-model.number="textPaddingLeft"
                @input="updateTextPadding"
                type="number"
                min="0"
                max="50"
                class="number-input small"
              />
            </div>
          </div>
        </div>
      </template>

      <!-- Image Block Properties -->
      <template v-else-if="selectedElement.blockType === 'image'">
        <div class="property-group">
          <label class="property-label">Image URL</label>
          <input
            v-model="imageUrl"
            @input="updateBlockProperty('src', imageUrl)"
            type="url"
            class="text-input"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div class="property-group">
          <label class="property-label">Alt Text</label>
          <input
            v-model="imageAlt"
            @input="updateBlockProperty('alt', imageAlt)"
            type="text"
            class="text-input"
            placeholder="Image description"
          />
        </div>

        <div class="property-group">
          <label class="property-label">Link URL</label>
          <input
            v-model="imageLink"
            @input="updateBlockProperty('href', imageLink)"
            type="url"
            class="text-input"
            placeholder="https://example.com (optional)"
          />
        </div>

        <div class="property-group">
          <label class="property-label">Dimensions</label>
          <div class="dimension-controls">
            <div class="dimension-input">
              <label class="dimension-label">Width</label>
              <input
                v-model.number="imageWidth"
                @input="updateImageStyle('width', imageWidth + 'px')"
                type="number"
                min="50"
                max="800"
                class="number-input"
              />
              <span class="dimension-unit">px</span>
            </div>
            <div class="dimension-input">
              <label class="dimension-label">Height</label>
              <input
                v-model.number="imageHeight"
                @input="updateImageStyle('height', imageHeight + 'px')"
                type="number"
                min="50"
                max="600"
                class="number-input"
              />
              <span class="dimension-unit">px</span>
            </div>
          </div>
        </div>
      </template>

      <!-- Button Block Properties -->
      <template v-else-if="selectedElement.blockType === 'button'">
        <div class="property-group">
          <label class="property-label">Button Text</label>
          <input
            v-model="buttonText"
            @input="updateBlockProperty('text', buttonText)"
            type="text"
            class="text-input"
            placeholder="Click here"
          />
        </div>

        <div class="property-group">
          <label class="property-label">Link URL</label>
          <input
            v-model="buttonUrl"
            @input="updateBlockProperty('href', buttonUrl)"
            type="url"
            class="text-input"
            placeholder="https://example.com"
          />
        </div>

        <div class="property-group">
          <label class="property-label">Colors</label>
          <div class="color-row">
            <div class="color-input-group">
              <label class="color-label">Background</label>
              <input
                v-model="buttonBgColor"
                @input="updateButtonStyle('backgroundColor', buttonBgColor)"
                type="color"
                class="color-input"
              />
            </div>
            <div class="color-input-group">
              <label class="color-label">Text</label>
              <input
                v-model="buttonTextColor"
                @input="updateButtonStyle('color', buttonTextColor)"
                type="color"
                class="color-input"
              />
            </div>
          </div>
        </div>

        <div class="property-group">
          <label class="property-label">Border Radius</label>
          <div class="dimension-input">
            <input
              v-model.number="buttonBorderRadius"
              @input="
                updateButtonStyle('borderRadius', buttonBorderRadius + 'px')
              "
              type="number"
              min="0"
              max="50"
              class="number-input"
            />
            <span class="dimension-unit">px</span>
          </div>
        </div>
      </template>

      <!-- Divider Block Properties -->
      <template v-else-if="selectedElement.blockType === 'divider'">
        <div class="property-group">
          <label class="property-label">Style</label>
          <select
            v-model="dividerStyle"
            @change="updateDividerStyle('borderTopStyle', dividerStyle)"
            class="select-input"
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
            <option value="double">Double</option>
          </select>
        </div>

        <div class="property-group">
          <label class="property-label">Color</label>
          <div class="color-input-group">
            <input
              v-model="dividerColor"
              @input="updateDividerStyle('borderTopColor', dividerColor)"
              type="color"
              class="color-input"
            />
            <input
              v-model="dividerColor"
              @input="updateDividerStyle('borderTopColor', dividerColor)"
              type="text"
              class="text-input color-text"
              placeholder="#e5e7eb"
            />
          </div>
        </div>

        <div class="property-group">
          <label class="property-label">Thickness</label>
          <div class="dimension-input">
            <input
              v-model.number="dividerThickness"
              @input="
                updateDividerStyle('borderTopWidth', dividerThickness + 'px')
              "
              type="number"
              min="1"
              max="10"
              class="number-input"
            />
            <span class="dimension-unit">px</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, h } from "vue";
import { useDocumentStore } from "../../stores/useDocumentStore";
import QuillyTextEditor from "../QuillyTextEditor.vue";
import type { Block, Row, Column } from "../../schema/document";

// Store
const documentStore = useDocumentStore();

// Computed properties
const selectedElement = computed(() => documentStore.selectedElement);

// Document properties
const documentTitle = ref("");
const documentSubject = ref("");
const documentPreheader = ref("");
const documentBgColor = ref("#ffffff");
const documentWidth = ref(600);

// Row properties
const rowBgColor = ref("transparent");
const rowPaddingTop = ref(20);
const rowPaddingRight = ref(20);
const rowPaddingBottom = ref(20);
const rowPaddingLeft = ref(20);
const rowBorderStyle = ref("none");
const rowBorderWidth = ref(1);
const rowBorderColor = ref("#e5e7eb");

// Column layout properties
const columnGap = ref(8);
const selectedRowColumns = computed(() => {
  if (selectedElement.value?.type === "row") {
    const row = selectedElement.value as Row;
    return row.columns || [];
  }
  return [];
});

// Column layout presets
const columnPresets = [
  { name: "1-column", label: "1 Col", widths: [100] },
  { name: "2-column-equal", label: "2 Equal", widths: [50, 50] },
  { name: "2-column-left", label: "2/3 - 1/3", widths: [66.67, 33.33] },
  { name: "2-column-right", label: "1/3 - 2/3", widths: [33.33, 66.67] },
  { name: "2-column-narrow-left", label: "1/4 - 3/4", widths: [25, 75] },
  { name: "2-column-narrow-right", label: "3/4 - 1/4", widths: [75, 25] },
  { name: "3-column", label: "3 Equal", widths: [33.33, 33.33, 33.33] },
  { name: "3-column-center", label: "1/4-1/2-1/4", widths: [25, 50, 25] },
  { name: "3-column-left", label: "1/2-1/4-1/4", widths: [50, 25, 25] },
  { name: "3-column-right", label: "1/4-1/4-1/2", widths: [25, 25, 50] },
  { name: "4-column", label: "4 Equal", widths: [25, 25, 25, 25] },
  { name: "4-column-mixed", label: "40-20-20-20", widths: [40, 20, 20, 20] },
];

// Column properties
const columnWidth = ref(100);
const columnBgColor = ref("transparent");
const columnPaddingTop = ref(10);
const columnPaddingRight = ref(10);
const columnPaddingBottom = ref(10);
const columnPaddingLeft = ref(10);

// Text block properties
const textContent = ref("");
const textFontFamily = ref("Arial, sans-serif");
const textFontSize = ref(16);
const textFontWeight = ref("400");
const textFontStyle = ref("normal");
const textTextDecoration = ref("none");
const textLineHeight = ref(1.4);
const textColor = ref("#000000");
const textAlign = ref("left");
const textPaddingTop = ref(8);
const textPaddingRight = ref(8);
const textPaddingBottom = ref(8);
const textPaddingLeft = ref(8);

// Image block properties
const imageUrl = ref("");
const imageAlt = ref("");
const imageLink = ref("");
const imageWidth = ref(300);
const imageHeight = ref(200);

// Button block properties
const buttonText = ref("");
const buttonUrl = ref("");
const buttonBgColor = ref("#3b82f6");
const buttonTextColor = ref("#ffffff");
const buttonBorderRadius = ref(4);

// Divider block properties
const dividerStyle = ref("solid");
const dividerColor = ref("#e5e7eb");
const dividerThickness = ref(1);

// Text alignment icons as render function components
const AlignLeftIcon = {
  render() {
    return h(
      "svg",
      {
        width: "14",
        height: "14",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
      },
      [
        h("line", { x1: "17", y1: "10", x2: "3", y2: "10" }),
        h("line", { x1: "21", y1: "6", x2: "3", y2: "6" }),
        h("line", { x1: "21", y1: "14", x2: "3", y2: "14" }),
        h("line", { x1: "17", y1: "18", x2: "3", y2: "18" }),
      ]
    );
  },
};

const AlignCenterIcon = {
  render() {
    return h(
      "svg",
      {
        width: "14",
        height: "14",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
      },
      [
        h("line", { x1: "18", y1: "10", x2: "6", y2: "10" }),
        h("line", { x1: "21", y1: "6", x2: "3", y2: "6" }),
        h("line", { x1: "21", y1: "14", x2: "3", y2: "14" }),
        h("line", { x1: "18", y1: "18", x2: "6", y2: "18" }),
      ]
    );
  },
};

const AlignRightIcon = {
  render() {
    return h(
      "svg",
      {
        width: "14",
        height: "14",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
      },
      [
        h("line", { x1: "21", y1: "10", x2: "7", y2: "10" }),
        h("line", { x1: "21", y1: "6", x2: "3", y2: "6" }),
        h("line", { x1: "21", y1: "14", x2: "3", y2: "14" }),
        h("line", { x1: "21", y1: "18", x2: "7", y2: "18" }),
      ]
    );
  },
};

// Text alignment options
const textAlignments = [
  { value: "left", label: "Align Left", icon: AlignLeftIcon },
  { value: "center", label: "Align Center", icon: AlignCenterIcon },
  { value: "right", label: "Align Right", icon: AlignRightIcon },
];

/**
 * Get block type label
 */
function getBlockTypeLabel(blockType: string): string {
  const labels: Record<string, string> = {
    text: "Text",
    image: "Image",
    button: "Button",
    divider: "Divider",
  };
  return labels[blockType] || "Block";
}

/**
 * Update document properties
 */
function updateDocumentTitle() {
  documentStore.updateDocument({
    meta: {
      ...documentStore.document.meta,
      title: documentTitle.value,
    },
  });
}

function updateDocumentSubject() {
  documentStore.updateDocument({
    meta: {
      ...documentStore.document.meta,
      subject: documentSubject.value,
    },
  });
}

function updateDocumentPreheader() {
  documentStore.updateDocument({
    meta: {
      ...documentStore.document.meta,
      preheader: documentPreheader.value,
    },
  });
}

function updateDocumentBgColor() {
  documentStore.updateDocument({
    style: {
      ...documentStore.document.style,
      backgroundColor: documentBgColor.value,
    },
  });
}

function updateDocumentWidth() {
  documentStore.updateDocument({
    style: {
      ...documentStore.document.style,
      width: `${documentWidth.value}px`,
    },
  });
}

/**
 * Update row properties
 */
function updateRowStyle(property: string, value: string) {
  if (selectedElement.value?.type === "row") {
    const row = selectedElement.value as Row;
    documentStore.updateRow(row.id, {
      style: {
        ...row.style,
        [property]: value,
      },
    });
  }
}

function updateRowPadding() {
  const padding = `${rowPaddingTop.value}px ${rowPaddingRight.value}px ${rowPaddingBottom.value}px ${rowPaddingLeft.value}px`;
  updateRowStyle("padding", padding);
}

function updateRowBorder() {
  if (rowBorderStyle.value === "none") {
    updateRowStyle("border", "none");
  } else {
    const border = `${rowBorderWidth.value}px ${rowBorderStyle.value} ${rowBorderColor.value}`;
    updateRowStyle("border", border);
  }
}

/**
 * Column layout management functions
 */
function applyColumnPreset(preset: { widths: number[] }) {
  if (selectedElement.value?.type === "row") {
    const row = selectedElement.value as Row;
    const rowId = row.id;

    // Remove existing columns
    while (row.columns.length > 0) {
      documentStore.removeColumn(row.columns[0].id);
    }

    // Add new columns with preset widths (convert percentage to grid units)
    // Preset widths are percentages (e.g., [50, 50]), but addColumn expects grid units (1-12)
    preset.widths.forEach((widthPercentage: number) => {
      // Convert percentage to grid units: percentage / 100 * 12
      const gridWidth = Math.round((widthPercentage / 100) * 12);
      documentStore.addColumn(rowId, gridWidth);
    });

    // Ensure row stays selected after applying preset
    setTimeout(() => {
      documentStore.select("row", rowId);
    }, 0);
  }
}

function isCurrentPreset(preset: { widths: number[] }): boolean {
  if (selectedRowColumns.value.length !== preset.widths.length) {
    return false;
  }

  return selectedRowColumns.value.every((col: Column, index: number) => {
    const colWidth = parseFloat(col.width) || 100;
    const presetWidth = preset.widths[index];
    return Math.abs(colWidth - presetWidth) < 1;
  });
}

function addColumnToRow() {
  if (
    selectedElement.value?.type === "row" &&
    selectedRowColumns.value.length < 4
  ) {
    const row = selectedElement.value as Row;
    const rowId = row.id;
    const newWidth = 12 / (selectedRowColumns.value.length + 1);

    // Adjust existing column widths
    selectedRowColumns.value.forEach((col: Column) => {
      documentStore.updateColumn(rowId, col.id, {
        width: newWidth,
      });
    });

    // Add new column
    documentStore.addColumn(rowId, newWidth);

    // Ensure row stays selected
    setTimeout(() => {
      documentStore.select("row", rowId);
    }, 0);
  }
}

function removeLastColumn() {
  if (
    selectedElement.value?.type === "row" &&
    selectedRowColumns.value.length > 1
  ) {
    const row = selectedElement.value as Row;
    const rowId = row.id;
    const lastColumn =
      selectedRowColumns.value[selectedRowColumns.value.length - 1];

    // Remove the last column
    documentStore.removeColumn(lastColumn.id);

    // Redistribute widths among remaining columns
    const remainingColumns = selectedRowColumns.value.slice(0, -1);
    const newWidth = 12 / remainingColumns.length;

    remainingColumns.forEach((col: Column) => {
      documentStore.updateColumn(rowId, col.id, {
        width: newWidth,
      });
    });

    // Ensure row stays selected
    setTimeout(() => {
      documentStore.select("row", rowId);
    }, 0);
  }
}

function updateColumnGap() {
  if (selectedElement.value?.type === "row") {
    updateRowStyle("gap", `${columnGap.value}px`);
  }
}

/**
 * Update column properties
 */
function updateColumnWidth() {
  if (selectedElement.value?.type === "column") {
    const column = selectedElement.value as Column;
    documentStore.updateColumn(column.rowId, column.id, {
      width: columnWidth.value,
    });
  }
}

function updateColumnStyle(property: string, value: string) {
  if (selectedElement.value?.type === "column") {
    const column = selectedElement.value as Column;
    documentStore.updateColumn(column.rowId, column.id, {
      style: {
        ...column.style,
        [property]: value,
      },
    });
  }
}

function updateColumnPadding() {
  const padding = `${columnPaddingTop.value}px ${columnPaddingRight.value}px ${columnPaddingBottom.value}px ${columnPaddingLeft.value}px`;
  updateColumnStyle("padding", padding);
}

/**
 * Update block properties
 */
function updateBlockProperty(property: string, value: unknown) {
  if (selectedElement.value?.type === "block") {
    const block = selectedElement.value as Block;
    documentStore.updateBlock(block.columnId, block.id, {
      [property]: value,
    });
  }
}

function updateTextStyle(property: string, value: string) {
  if (selectedElement.value?.type === "block") {
    const block = selectedElement.value as Block;
    documentStore.updateBlock(block.id, {
      style: {
        ...block.style,
        [property]: value,
      },
    });
  }
}

function updateTextContent() {
  if (selectedElement.value?.type === "block") {
    const block = selectedElement.value as Block;
    documentStore.updateBlock(block.id, {
      html: textContent.value,
      plaintext: textContent.value.replace(/<[^>]*>/g, ""), // Strip HTML for plaintext
    });
  }
}

function toggleTextStyle(property: string, value: string) {
  if (selectedElement.value?.type === "block") {
    const block = selectedElement.value as Block;
    const currentValue = block.style?.[property] as string;
    const newValue =
      currentValue === value
        ? property === "fontStyle"
          ? "normal"
          : "none"
        : value;

    // Update the reactive variable
    if (property === "fontStyle") {
      textFontStyle.value = newValue;
    } else if (property === "textDecoration") {
      textTextDecoration.value = newValue;
    }

    updateTextStyle(property, newValue);
  }
}

function updateTextPadding() {
  const padding = `${textPaddingTop.value}px ${textPaddingRight.value}px ${textPaddingBottom.value}px ${textPaddingLeft.value}px`;
  updateTextStyle("padding", padding);
}

function updateImageStyle(property: string, value: string) {
  updateTextStyle(property, value);
}

function updateButtonStyle(property: string, value: string) {
  updateTextStyle(property, value);
}

function updateDividerStyle(property: string, value: string) {
  updateTextStyle(property, value);
}

/**
 * Initialize properties from selected element
 */
function initializeProperties() {
  if (!selectedElement.value) return;

  if (selectedElement.value.type === "document") {
    const doc = documentStore.document;
    documentTitle.value = doc.meta?.title || "";
    documentSubject.value = doc.meta?.subject || "";
    documentPreheader.value = doc.meta?.preheader || "";
    documentBgColor.value = (doc.style?.backgroundColor as string) || "#ffffff";
    documentWidth.value = parseInt(doc.style?.width as string) || 600;
  } else if (selectedElement.value.type === "row") {
    const row = selectedElement.value as Row;
    rowBgColor.value = (row.style?.backgroundColor as string) || "transparent";

    // Parse padding
    const padding = row.style?.padding as string;
    if (padding) {
      const paddingValues = padding.split(" ").map((v) => parseInt(v) || 0);
      rowPaddingTop.value = paddingValues[0] || 20;
      rowPaddingRight.value = paddingValues[1] || paddingValues[0] || 20;
      rowPaddingBottom.value = paddingValues[2] || paddingValues[0] || 20;
      rowPaddingLeft.value =
        paddingValues[3] || paddingValues[1] || paddingValues[0] || 20;
    }

    // Parse border
    const border = row.style?.border as string;
    if (border && border !== "none") {
      const borderParts = border.split(" ");
      rowBorderWidth.value = parseInt(borderParts[0]) || 1;
      rowBorderStyle.value = borderParts[1] || "solid";
      rowBorderColor.value = borderParts[2] || "#e5e7eb";
    } else {
      rowBorderStyle.value = "none";
    }
  } else if (selectedElement.value.type === "column") {
    const column = selectedElement.value as Column;
    columnWidth.value = parseInt(column.width) || 100;
    columnBgColor.value =
      (column.style?.backgroundColor as string) || "transparent";

    // Parse padding
    const padding = column.style?.padding as string;
    if (padding) {
      const paddingValues = padding.split(" ").map((v) => parseInt(v) || 0);
      columnPaddingTop.value = paddingValues[0] || 10;
      columnPaddingRight.value = paddingValues[1] || paddingValues[0] || 10;
      columnPaddingBottom.value = paddingValues[2] || paddingValues[0] || 10;
      columnPaddingLeft.value =
        paddingValues[3] || paddingValues[1] || paddingValues[0] || 10;
    }
  } else if (selectedElement.value.type === "block") {
    const block = selectedElement.value as Block;

    if (block.blockType === "text") {
      textContent.value = block.html || block.plaintext || "";
      textFontFamily.value =
        (block.style?.fontFamily as string) || "Arial, sans-serif";
      textFontSize.value = parseInt(block.style?.fontSize as string) || 16;
      textFontWeight.value = (block.style?.fontWeight as string) || "400";
      textFontStyle.value = (block.style?.fontStyle as string) || "normal";
      textTextDecoration.value =
        (block.style?.textDecoration as string) || "none";
      textLineHeight.value =
        parseFloat(block.style?.lineHeight as string) || 1.4;
      textColor.value = (block.style?.color as string) || "#000000";
      textAlign.value = (block.style?.textAlign as string) || "left";

      // Parse padding
      const padding = block.style?.padding as string;
      if (padding) {
        const paddingValues = padding.split(" ").map((v) => parseInt(v) || 0);
        textPaddingTop.value = paddingValues[0] || 8;
        textPaddingRight.value = paddingValues[1] || paddingValues[0] || 8;
        textPaddingBottom.value = paddingValues[2] || paddingValues[0] || 8;
        textPaddingLeft.value =
          paddingValues[3] || paddingValues[1] || paddingValues[0] || 8;
      }
    } else if (block.blockType === "image") {
      imageUrl.value = block.src || "";
      imageAlt.value = block.alt || "";
      imageLink.value = block.href || "";
      imageWidth.value = parseInt(block.style?.width as string) || 300;
      imageHeight.value = parseInt(block.style?.height as string) || 200;
    } else if (block.blockType === "button") {
      buttonText.value = block.text || "";
      buttonUrl.value = block.href || "";
      buttonBgColor.value =
        (block.style?.backgroundColor as string) || "#3b82f6";
      buttonTextColor.value = (block.style?.color as string) || "#ffffff";
      buttonBorderRadius.value =
        parseInt(block.style?.borderRadius as string) || 4;
    } else if (block.blockType === "divider") {
      dividerStyle.value = (block.style?.borderTopStyle as string) || "solid";
      dividerColor.value = (block.style?.borderTopColor as string) || "#e5e7eb";
      dividerThickness.value =
        parseInt(block.style?.borderTopWidth as string) || 1;
    }
  }
}

// Watch for selection changes
watch(
  selectedElement,
  () => {
    initializeProperties();
  },
  { immediate: true }
);

// Removed unused alignment icon components
</script>

<style scoped>
.properties-panel {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}

.no-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
  color: var(--muted);
}

.no-selection__icon {
  margin-bottom: 12px;
  opacity: 0.5;
}

.no-selection__title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--fg);
}

.no-selection__description {
  font-size: 14px;
  margin: 0;
  line-height: 1.4;
}

.properties-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  color: var(--fg);
}

.element-id {
  font-size: 10px;
  color: var(--muted);
  font-family: monospace;
  background-color: var(--border);
  padding: 2px 6px;
  border-radius: 3px;
}

.property-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.property-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.text-input,
.textarea-input,
.select-input,
.number-input {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background-color: var(--bg);
  color: var(--fg);
  font-size: 13px;
  transition: border-color 0.2s ease;
}

.text-input:focus,
.textarea-input:focus,
.select-input:focus,
.number-input:focus {
  outline: none;
  border-color: var(--accent);
}

.textarea-input {
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
}

.color-input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-input {
  width: 40px;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  background: none;
}

.color-text {
  flex: 1;
  font-family: monospace;
}

.dimension-input {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dimension-unit {
  font-size: 11px;
  color: var(--muted);
  min-width: 20px;
}

.padding-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.padding-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.padding-label {
  font-size: 10px;
  color: var(--muted);
  text-transform: uppercase;
}

.number-input.small {
  padding: 4px 8px;
  font-size: 12px;
}

.border-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.border-controls .select-input {
  flex: 1;
}

.border-controls .number-input {
  width: 60px;
}

.border-controls .color-input {
  width: 32px;
  height: 32px;
}

.width-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.width-slider {
  flex: 1;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.width-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--accent);
  border-radius: 50%;
  cursor: pointer;
}

.width-display {
  font-size: 12px;
  color: var(--muted);
  min-width: 40px;
  text-align: center;
  font-family: monospace;
}

.alignment-controls {
  display: flex;
  gap: 4px;
}

.align-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.align-btn:hover {
  background-color: var(--border);
  color: var(--fg);
}

.align-btn.active {
  background-color: var(--accent);
  color: white;
  border-color: var(--accent);
}

.style-controls {
  display: flex;
  gap: 4px;
}

.style-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.style-btn:hover {
  background-color: var(--border);
  color: var(--fg);
}

.style-btn.active {
  background-color: var(--accent);
  color: white;
  border-color: var(--accent);
}

.dimension-controls {
  display: flex;
  gap: 12px;
}

.dimension-controls .dimension-input {
  flex: 1;
}

.dimension-label {
  font-size: 10px;
  color: var(--muted);
  text-transform: uppercase;
  margin-bottom: 4px;
}

.color-row {
  display: flex;
  gap: 12px;
}

.color-row .color-input-group {
  flex: 1;
  flex-direction: column;
  align-items: stretch;
}

.color-label {
  font-size: 10px;
  color: var(--muted);
  text-transform: uppercase;
  margin-bottom: 4px;
}

.color-row .color-input {
  width: 100%;
  height: 32px;
}

/* Column Layout Controls */
.column-layout-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.layout-presets {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.preset-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 4px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 10px;
}

.preset-btn:hover {
  background-color: var(--border);
  color: var(--fg);
}

.preset-btn.active {
  background-color: var(--accent);
  color: white;
  border-color: var(--accent);
}

.preset-visual {
  display: flex;
  width: 40px;
  height: 20px;
  gap: 2px;
  border: 1px solid currentColor;
  border-radius: 2px;
  overflow: hidden;
}

.preset-column {
  background-color: currentColor;
  opacity: 0.3;
  min-width: 2px;
}

.preset-btn.active .preset-column {
  opacity: 0.8;
}

.preset-label {
  font-size: 9px;
  text-align: center;
  line-height: 1;
}

.column-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--fg);
  cursor: pointer;
  border-radius: 4px;
  font-size: 12px;
  transition: all 0.2s ease;
  flex: 1;
}

.action-btn:hover:not(:disabled) {
  background-color: var(--border);
}

.action-btn.danger {
  color: #dc2626;
  border-color: #fecaca;
}

.action-btn.danger:hover:not(:disabled) {
  background-color: #fef2f2;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.column-spacing {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spacing-label {
  font-size: 11px;
  color: var(--muted);
  min-width: 80px;
}

.spacing-unit {
  font-size: 11px;
  color: var(--muted);
  min-width: 20px;
}

/* Responsive design */
@media (max-width: 768px) {
  .properties-panel {
    padding: 12px;
  }

  .padding-controls {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .border-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }

  .dimension-controls {
    flex-direction: column;
    gap: 8px;
  }

  .color-row {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
