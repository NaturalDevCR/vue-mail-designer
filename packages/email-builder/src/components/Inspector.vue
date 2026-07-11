<template>
  <div class="inspector">
    <!-- Inspector Header -->
    <div class="inspector__header">
      <div class="inspector__tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="ui.setRightPanelTab(tab.key)"
          :class="['inspector__tab', { active: ui.rightPanelTab === tab.key }]"
        >
          <component :is="tab.icon" />
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <button
        @click="ui.setRightPanelCollapsed(true)"
        class="inspector__close-btn"
        title="Close Inspector"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <!-- Inspector Content -->
    <div class="inspector__content">
      <!-- Properties Tab -->
      <div v-if="ui.rightPanelTab === 'properties'" class="inspector__panel">
        <PropertiesPanel />
      </div>

      <!-- Settings Tab -->
      <div v-if="ui.rightPanelTab === 'settings'" class="inspector__panel">
        <SettingsPanel />
      </div>

      <!-- Export Tab -->
      <div v-if="ui.rightPanelTab === 'export'" class="inspector__panel">
        <ExportPanel />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h } from "vue";
import { useUiStore } from "../stores/useUiStore";
import PropertiesPanel from "./inspector/PropertiesPanel.vue";
import SettingsPanel from "./inspector/SettingsPanel.vue";
import ExportPanel from "./inspector/ExportPanel.vue";

// Store
const ui = useUiStore();

// Tab icons as render function components (no runtime compilation needed)
const SettingsIcon = {
  render() {
    return h(
      "svg",
      {
        width: "16",
        height: "16",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
      },
      [
        h("circle", { cx: "12", cy: "12", r: "3" }),
        h("path", {
          d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z",
        }),
      ]
    );
  },
};

const ExportIcon = {
  render() {
    return h(
      "svg",
      {
        width: "16",
        height: "16",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
      },
      [
        h("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
        h("polyline", { points: "17,8 12,3 7,8" }),
        h("line", { x1: "12", y1: "3", x2: "12", y2: "15" }),
      ]
    );
  },
};

// Tab configuration
const tabs = [
  {
    key: "properties" as const,
    label: "Properties",
    icon: SettingsIcon,
  },
  {
    key: "settings" as const,
    label: "Settings",
    icon: SettingsIcon,
  },
  {
    key: "export" as const,
    label: "Export",
    icon: ExportIcon,
  },
];
</script>

<style scoped>
.inspector {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--panel);
}

.inspector__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  background-color: var(--panel);
}

.inspector__tabs {
  display: flex;
  gap: 4px;
}

.inspector__tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.inspector__tab:hover {
  background-color: var(--border);
  color: var(--fg);
}

.inspector__tab.active {
  background-color: var(--accent);
  color: white;
}

.inspector__close-btn {
  padding: 4px;
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.inspector__close-btn:hover {
  background-color: var(--border);
  color: var(--fg);
}

.inspector__content {
  flex: 1;
  overflow-y: auto;
}

.inspector__panel {
  height: 100%;
}

/* Responsive design */
@media (max-width: 768px) {
  .inspector__header {
    padding: 8px 12px;
  }

  .inspector__tab {
    padding: 4px 8px;
    font-size: 11px;
  }

  .inspector__tab span {
    display: none;
  }
}
</style>
