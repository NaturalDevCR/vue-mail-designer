<template>
  <div class="vmd-props" @click.stop>
    <div class="vmd-props-header">
      <h3>{{ title }}</h3>
      <div class="vmd-toolbar-group">
        <button type="button" class="vmd-mini-btn" title="Duplicar" data-action="props-duplicate" @click="duplicate"><span class="vmd-ico" v-html="ICONS.duplicate" /></button>
        <button type="button" class="vmd-mini-btn vmd-mini-btn--danger" title="Eliminar" data-action="props-delete" @click="remove"><span class="vmd-ico" v-html="ICONS.trash" /></button>
        <button type="button" class="vmd-mini-btn" title="Cerrar" data-action="props-close" @click="store.select(null)"><span class="vmd-ico" v-html="ICONS.close" /></button>
      </div>
    </div>

    <!-- Bloque seleccionado -->
    <template v-if="block">
      <template v-if="block.type === 'heading'">
        <div class="vmd-props-section-title">Texto</div>
        <TextField label="Texto" :model-value="block.text" @update:model-value="upd({ text: $event })" />
        <SelectField label="Nivel" :model-value="String(block.level)" :options="HEADING_LEVEL_OPTIONS" @update:model-value="upd({ level: Number($event) })" />
        <SelectField label="Fuente" :model-value="block.fontFamily ?? ''" :options="FONT_OPTIONS" @update:model-value="updFont" />
        <SelectField label="Peso de fuente" :model-value="block.fontWeight" :options="FONT_WEIGHT_OPTIONS" @update:model-value="upd({ fontWeight: $event as 'normal' | 'bold' })" />
        <NumberField label="Tamaño" :model-value="block.style.fontSize" :min="10" :max="72" @update:model-value="upd({ style: { fontSize: $event } })" />
        <ColorField label="Color" :model-value="block.style.color" @update:model-value="upd({ style: { color: $event } })" />
        <AlignField label="Alineación" :model-value="block.style.align" @update:model-value="upd({ style: { align: $event } })" />
        <NumberField label="Interlineado" :model-value="block.style.lineHeight" :min="0.8" :max="3" :step="0.1" @update:model-value="upd({ style: { lineHeight: $event } })" />
        <NumberField label="Espaciado entre letras" :model-value="block.style.letterSpacing" :min="-2" :max="10" :step="0.5" @update:model-value="upd({ style: { letterSpacing: $event } })" />
        <div class="vmd-props-section-title">General</div>
        <PaddingField label="Padding" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'text'">
        <div class="vmd-props-section-title">Texto</div>
        <div class="vmd-field">
          <span class="vmd-field-label">Contenido</span>
          <RichTextEditor :model-value="block.html" @update:model-value="upd({ html: $event })" />
        </div>
        <SelectField label="Fuente" :model-value="block.fontFamily ?? ''" :options="FONT_OPTIONS" @update:model-value="updFont" />
        <ColorField label="Color" :model-value="block.style.color" @update:model-value="upd({ style: { color: $event } })" />
        <NumberField label="Tamaño" :model-value="block.style.fontSize" :min="10" :max="40" @update:model-value="upd({ style: { fontSize: $event } })" />
        <NumberField label="Interlineado" :model-value="block.style.lineHeight" :min="1" :max="3" :step="0.1" @update:model-value="upd({ style: { lineHeight: $event } })" />
        <NumberField label="Espaciado entre letras" :model-value="block.style.letterSpacing" :min="-2" :max="10" :step="0.5" @update:model-value="upd({ style: { letterSpacing: $event } })" />
        <div class="vmd-props-section-title">Links</div>
        <CheckboxField label="Heredar estilos del body" :model-value="textLinkInheritsBody" @update:model-value="toggleTextLinkInherit" />
        <template v-if="!textLinkInheritsBody">
          <ColorField label="Color de link" :model-value="block.linkColor ?? '#3b82f6'" @update:model-value="upd({ linkColor: $event })" />
          <CheckboxField label="Subrayado" :model-value="block.linkUnderline ?? true" @update:model-value="upd({ linkUnderline: $event })" />
        </template>
        <div class="vmd-props-section-title">General</div>
        <PaddingField label="Padding" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'image'">
        <div class="vmd-props-section-title">Imagen</div>
        <div v-if="options.uploadImage" class="vmd-field">
          <span class="vmd-field-label">Subir imagen</span>
          <div class="vmd-upload-row">
            <button type="button" class="vmd-btn" :disabled="uploading" @click="fileInput?.click()">
              <span class="vmd-ico" v-html="ICONS.upload" />{{ uploading ? 'Subiendo…' : 'Elegir archivo' }}
            </button>
            <span class="vmd-upload-filename">{{ uploadFileName ?? 'Ningún archivo seleccionado' }}</span>
          </div>
          <input ref="fileInput" type="file" accept="image/*" class="vmd-visually-hidden" @change="onUpload" />
        </div>
        <TextField label="URL" :model-value="block.src" @update:model-value="upd({ src: $event })" />
        <CheckboxField label="Ancho automático" :model-value="block.widthAuto" @update:model-value="upd({ widthAuto: $event })" />
        <NumberField v-if="!block.widthAuto" label="Ancho %" :model-value="block.widthPct" :min="10" :max="100" @update:model-value="upd({ widthPct: $event })" />
        <AlignField label="Alineación" :model-value="block.align" @update:model-value="upd({ align: $event })" />
        <TextField label="Texto alternativo" :model-value="block.alt" @update:model-value="upd({ alt: $event })" />
        <div class="vmd-props-section-title">Acción</div>
        <TextField label="Enlace (opcional)" :model-value="block.href ?? ''" @update:model-value="upd({ href: $event })" />
        <SelectField v-if="block.href" label="Destino" :model-value="block.target" :options="TARGET_OPTIONS" @update:model-value="upd({ target: $event as '_blank' | '_self' })" />
        <div class="vmd-props-section-title">General</div>
        <PaddingField label="Padding" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'button'">
        <div class="vmd-props-section-title">Acción</div>
        <TextField label="Texto" data-field="label" :model-value="block.label" @update:model-value="upd({ label: $event })" />
        <TextField label="Enlace" :model-value="block.href" @update:model-value="upd({ href: $event })" />
        <SelectField label="Destino" :model-value="block.target" :options="TARGET_OPTIONS" @update:model-value="upd({ target: $event as '_blank' | '_self' })" />
        <div class="vmd-props-section-title">Opciones del botón</div>
        <ColorField label="Fondo" :model-value="block.style.backgroundColor" @update:model-value="upd({ style: { backgroundColor: $event } })" />
        <ColorField label="Texto" :model-value="block.style.color" @update:model-value="upd({ style: { color: $event } })" />
        <CheckboxField label="Ancho automático" :model-value="block.widthPct == null" @update:model-value="toggleButtonAutoWidth" />
        <NumberField v-if="block.widthPct != null" label="Ancho %" :model-value="block.widthPct" :min="10" :max="100" @update:model-value="upd({ widthPct: $event })" />
        <NumberField label="Tamaño fuente" :model-value="block.style.fontSize" :min="10" :max="32" @update:model-value="upd({ style: { fontSize: $event } })" />
        <NumberField label="Interlineado" :model-value="block.style.lineHeight" :min="0.8" :max="3" :step="0.1" @update:model-value="upd({ style: { lineHeight: $event } })" />
        <NumberField label="Espaciado entre letras" :model-value="block.style.letterSpacing" :min="-2" :max="10" :step="0.5" @update:model-value="upd({ style: { letterSpacing: $event } })" />
        <div class="vmd-props-section-title">Espaciado</div>
        <AlignField label="Alineación" :model-value="block.align" @update:model-value="upd({ align: $event })" />
        <NumberField label="Padding horizontal" :model-value="block.style.innerPaddingX" :min="0" :max="80" @update:model-value="upd({ style: { innerPaddingX: $event } })" />
        <NumberField label="Padding vertical" :model-value="block.style.innerPaddingY" :min="0" :max="60" @update:model-value="upd({ style: { innerPaddingY: $event } })" />
        <div class="vmd-props-subtitle">Borde</div>
        <NumberField label="Grosor" :model-value="buttonBorder.width" :min="0" :max="12" @update:model-value="setButtonBorder({ width: $event })" />
        <SelectField label="Estilo" :model-value="buttonBorder.style" :options="BORDER_STYLE_OPTIONS" @update:model-value="setButtonBorder({ style: $event as Border['style'] })" />
        <ColorField label="Color" :model-value="buttonBorder.color" @update:model-value="setButtonBorder({ color: $event })" />
        <NumberField label="Radio borde" :model-value="block.style.borderRadius" :min="0" :max="40" @update:model-value="upd({ style: { borderRadius: $event } })" />
        <div class="vmd-props-section-title">General</div>
        <PaddingField label="Padding del contenedor" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'divider'">
        <div class="vmd-props-section-title">Línea</div>
        <NumberField label="Ancho %" :model-value="block.style.widthPct" :min="10" :max="100" @update:model-value="upd({ style: { widthPct: $event } })" />
        <SelectField label="Estilo de línea" :model-value="block.style.lineStyle" :options="LINE_STYLE_OPTIONS" @update:model-value="upd({ style: { lineStyle: $event as 'solid' | 'dashed' | 'dotted' } })" />
        <NumberField label="Grosor" :model-value="block.style.thickness" :min="1" :max="10" @update:model-value="upd({ style: { thickness: $event } })" />
        <ColorField label="Color" :model-value="block.style.color" @update:model-value="upd({ style: { color: $event } })" />
        <AlignField label="Alineación" :model-value="block.style.align" @update:model-value="upd({ style: { align: $event } })" />
        <div class="vmd-props-section-title">General</div>
        <PaddingField label="Padding" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'spacer'">
        <NumberField label="Altura" :model-value="block.height" :min="4" :max="200" @update:model-value="upd({ height: $event })" />
      </template>

      <template v-else-if="block.type === 'social'">
        <div v-for="(n, i) in block.networks" :key="i" class="vmd-social-row">
          <SelectField :label="'Red ' + (i + 1)" :model-value="n.kind" :options="NETWORK_OPTIONS" @update:model-value="setNetwork(i, { kind: $event as SocialNetworkKind })" />
          <TextField label="URL" :model-value="n.url" @update:model-value="setNetwork(i, { url: $event })" />
          <button type="button" class="vmd-mini-btn vmd-mini-btn--danger" @click="removeNetwork(i)"><span class="vmd-ico" v-html="ICONS.trash" /></button>
        </div>
        <button type="button" class="vmd-btn" @click="addNetwork">+ Agregar red</button>
        <div class="vmd-props-section-title">Íconos</div>
        <SelectField label="Forma de ícono" :model-value="block.iconShape" :options="ICON_SHAPE_OPTIONS" @update:model-value="upd({ iconShape: $event as 'circle' | 'square' | 'rounded' })" />
        <AlignField label="Alineación" :model-value="block.align" @update:model-value="upd({ align: $event })" />
        <NumberField label="Tamaño ícono" :model-value="block.iconSize" :min="16" :max="64" @update:model-value="upd({ iconSize: $event })" />
        <NumberField label="Espaciado" :model-value="block.spacing" :min="0" :max="32" @update:model-value="upd({ spacing: $event })" />
        <div class="vmd-props-section-title">General</div>
        <PaddingField label="Padding" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'menu'">
        <div v-for="(it, i) in block.items" :key="i" class="vmd-social-row">
          <TextField label="Etiqueta" :model-value="it.label" @update:model-value="setMenuItem(i, { label: $event })" />
          <TextField label="URL" :model-value="it.href" @update:model-value="setMenuItem(i, { href: $event })" />
          <button type="button" class="vmd-mini-btn vmd-mini-btn--danger" @click="removeMenuItem(i)"><span class="vmd-ico" v-html="ICONS.trash" /></button>
        </div>
        <button type="button" class="vmd-btn" @click="addMenuItem">+ Agregar ítem</button>
        <div class="vmd-props-section-title">Estilos</div>
        <SelectField label="Fuente" :model-value="block.fontFamily ?? ''" :options="FONT_OPTIONS" @update:model-value="updFont" />
        <SelectField label="Peso de fuente" :model-value="block.fontWeight" :options="FONT_WEIGHT_OPTIONS" @update:model-value="upd({ fontWeight: $event as 'normal' | 'bold' })" />
        <NumberField label="Tamaño fuente" :model-value="block.style.fontSize" :min="10" :max="32" @update:model-value="upd({ style: { fontSize: $event } })" />
        <NumberField label="Espaciado entre letras" :model-value="block.style.letterSpacing" :min="-2" :max="10" :step="0.5" @update:model-value="upd({ style: { letterSpacing: $event } })" />
        <ColorField label="Color de texto" :model-value="block.style.color" @update:model-value="upd({ style: { color: $event } })" />
        <ColorField label="Color de link" :model-value="block.linkColor ?? block.style.color" @update:model-value="upd({ linkColor: $event })" />
        <AlignField label="Alineación" :model-value="block.align" @update:model-value="upd({ align: $event })" />
        <SelectField label="Layout" :model-value="block.layout" :options="MENU_LAYOUT_OPTIONS" @update:model-value="upd({ layout: $event as 'horizontal' | 'vertical' })" />
        <TextField label="Separador" :model-value="block.separator" @update:model-value="upd({ separator: $event })" />
        <PaddingField label="Padding de ítem" :model-value="block.style.itemPadding" @update:model-value="upd({ style: { itemPadding: $event } })" />
        <div class="vmd-props-section-title">General</div>
        <PaddingField label="Padding del contenedor" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'html'">
        <label class="vmd-field">
          <span class="vmd-field-label">Código HTML</span>
          <textarea class="vmd-field-input vmd-field-code" rows="8" :value="block.code" @input="upd({ code: ($event.target as HTMLTextAreaElement).value })" />
        </label>
        <div class="vmd-props-section-title">General</div>
        <PaddingField label="Padding" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'video'">
        <TextField label="URL del video" :model-value="block.videoUrl" @update:model-value="upd({ videoUrl: $event })" />
        <TextField label="URL de miniatura" :model-value="block.thumbnailUrl" @update:model-value="upd({ thumbnailUrl: $event })" />
        <TextField label="Texto alternativo" :model-value="block.alt" @update:model-value="upd({ alt: $event })" />
        <NumberField label="Ancho %" :model-value="block.widthPct" :min="10" :max="100" @update:model-value="upd({ widthPct: $event })" />
        <div class="vmd-props-section-title">General</div>
        <PaddingField label="Padding" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'table'">
        <CheckboxField label="Fila de encabezado" :model-value="block.headerRow" @update:model-value="upd({ headerRow: $event })" />
        <CheckboxField label="Filas alternadas" :model-value="block.stripedRows" @update:model-value="upd({ stripedRows: $event })" />
        <div class="vmd-table-toolbar">
          <button type="button" class="vmd-btn" @click="addTableRow">+ Fila</button>
          <button type="button" class="vmd-btn" @click="removeLastTableRow">− Fila</button>
          <button type="button" class="vmd-btn" @click="addTableColumn">+ Columna</button>
          <button type="button" class="vmd-btn" @click="removeLastTableColumn">− Columna</button>
        </div>
        <div class="vmd-table-grid">
          <div v-for="(tRow, r) in block.rows" :key="r" class="vmd-table-grid-row">
            <textarea
              v-for="(cell, c) in tRow"
              :key="c"
              class="vmd-field-input vmd-table-cell-input"
              rows="2"
              :data-cell="`${r}-${c}`"
              :value="cell"
              @input="setTableCell(r, c, ($event.target as HTMLTextAreaElement).value)"
            />
          </div>
        </div>
        <div class="vmd-props-section-title">Borde</div>
        <ColorField label="Color de borde" :model-value="block.style.borderColor" @update:model-value="upd({ style: { borderColor: $event } })" />
        <NumberField label="Grosor de borde" :model-value="block.style.borderWidth" :min="0" :max="8" @update:model-value="upd({ style: { borderWidth: $event } })" />
        <div class="vmd-props-section-title">Encabezado</div>
        <ColorField label="Fondo" :model-value="block.style.headerBackground" @update:model-value="upd({ style: { headerBackground: $event } })" />
        <ColorField label="Color de texto" :model-value="block.style.headerColor ?? block.style.color" @update:model-value="upd({ style: { headerColor: $event } })" />
        <div class="vmd-props-section-title">Contenido</div>
        <ColorField label="Color de texto" :model-value="block.style.color" @update:model-value="upd({ style: { color: $event } })" />
        <NumberField label="Tamaño fuente" :model-value="block.style.fontSize" :min="10" :max="32" @update:model-value="upd({ style: { fontSize: $event } })" />
        <NumberField label="Padding de celda" :model-value="block.style.cellPadding" :min="0" :max="32" @update:model-value="upd({ style: { cellPadding: $event } })" />
        <div class="vmd-props-section-title">General</div>
        <PaddingField label="Padding" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'gallery'">
        <div v-for="(img, i) in block.images" :key="i" class="vmd-social-row">
          <TextField label="URL" :model-value="img.src" @update:model-value="setGalleryImage(i, { src: $event })" />
          <TextField label="Alt" :model-value="img.alt" @update:model-value="setGalleryImage(i, { alt: $event })" />
          <TextField label="Enlace (opcional)" :model-value="img.href ?? ''" @update:model-value="setGalleryImage(i, { href: $event })" />
          <button type="button" class="vmd-mini-btn vmd-mini-btn--danger" @click="removeGalleryImage(i)"><span class="vmd-ico" v-html="ICONS.trash" /></button>
        </div>
        <button type="button" class="vmd-btn" @click="addGalleryImage">+ Agregar imagen</button>
        <SelectField label="Columnas" :model-value="String(block.columns)" :options="[{label:'2',value:'2'},{label:'3',value:'3'},{label:'4',value:'4'}]" @update:model-value="upd({ columns: Number($event) })" />
        <NumberField label="Espaciado" :model-value="block.gap" :min="0" :max="32" @update:model-value="upd({ gap: $event })" />
        <PaddingField label="Padding" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'timer'">
        <DateTimeField label="Fecha y hora límite" :model-value="block.endDate" @update:model-value="upd({ endDate: $event })" />
        <TextField label="URL de imagen" :model-value="block.imageUrl" @update:model-value="upd({ imageUrl: $event })" />
        <TextField label="Texto alternativo" :model-value="block.alt" @update:model-value="upd({ alt: $event })" />
        <NumberField label="Ancho %" :model-value="block.widthPct" :min="10" :max="100" @update:model-value="upd({ widthPct: $event })" />
        <PaddingField label="Padding" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'custom'">
        <template v-for="field in customFields" :key="field.key">
          <ColorField v-if="field.type === 'color'" :label="field.label" :model-value="String(block.data[field.key] ?? '#000000')" @update:model-value="updData(field.key, $event)" />
          <NumberField v-else-if="field.type === 'number'" :label="field.label" :model-value="Number(block.data[field.key] ?? 0)" @update:model-value="updData(field.key, $event)" />
          <label v-else-if="field.type === 'textarea'" class="vmd-field">
            <span class="vmd-field-label">{{ field.label }}</span>
            <textarea class="vmd-field-input vmd-field-code" rows="4" :value="String(block.data[field.key] ?? '')" @input="updData(field.key, ($event.target as HTMLTextAreaElement).value)" />
          </label>
          <TextField v-else :label="field.label" :model-value="String(block.data[field.key] ?? '')" @update:model-value="updData(field.key, $event)" />
        </template>
      </template>

      <div class="vmd-props-section-title">Visibilidad</div>
      <CheckboxField label="Ocultar en escritorio" :model-value="!!block.hideDesktop" @update:model-value="upd({ hideDesktop: $event })" />
      <CheckboxField label="Ocultar en móvil" :model-value="!!block.hideMobile" @update:model-value="upd({ hideMobile: $event })" />
    </template>

    <!-- Fila seleccionada -->
    <template v-else-if="row">
      <div class="vmd-props-section-title">Estructura de columnas</div>
      <div class="vmd-layout-picker">
        <button
          v-for="l in ROW_LAYOUTS"
          :key="l.key"
          type="button"
          class="vmd-layout-opt"
          :class="{ 'vmd-active': isActiveLayout(l.widths) }"
          :title="String(l.widths.length) + (l.widths.length === 1 ? ' columna' : ' columnas')"
          @click="store.setRowColumns(row.id, l.widths)"
        >
          <span v-for="(w, i) in l.widths" :key="i" class="vmd-layout-opt-cell" :style="{ flex: w }" />
        </button>
      </div>

      <div class="vmd-props-section-title">Propiedades de columna</div>
      <div class="vmd-col-tabs">
        <button
          v-for="(col, i) in row.columns"
          :key="col.id"
          type="button"
          class="vmd-col-tab"
          :class="{ 'vmd-active': activeColIdx === i }"
          @click="activeColIdx = i"
        >Columna {{ i + 1 }}</button>
      </div>
      <template v-if="activeColumn">
        <ColorField label="Fondo" :model-value="activeColumn.style.backgroundColor" @update:model-value="store.updateColumn(activeColumn!.id, { style: { backgroundColor: $event } })" />
        <PaddingField label="Padding" :model-value="activeColumn.style.padding" @update:model-value="store.updateColumn(activeColumn!.id, { style: { padding: $event } })" />
        <NumberField label="Radio borde" :model-value="activeColumn.style.borderRadius ?? 0" :min="0" :max="32" @update:model-value="store.updateColumn(activeColumn!.id, { style: { borderRadius: $event } })" />
        <div class="vmd-props-subtitle">Borde</div>
        <NumberField label="Grosor" :model-value="activeColumnBorder.width" :min="0" :max="12" @update:model-value="setColumnBorder({ width: $event })" />
        <SelectField label="Estilo" :model-value="activeColumnBorder.style" :options="BORDER_STYLE_OPTIONS" @update:model-value="setColumnBorder({ style: $event as Border['style'] })" />
        <ColorField label="Color" :model-value="activeColumnBorder.color" @update:model-value="setColumnBorder({ color: $event })" />
      </template>

      <div class="vmd-props-section-title">Propiedades de fila</div>
      <ColorField label="Fondo" :model-value="row.style.backgroundColor" @update:model-value="store.updateRowStyle(row.id, { backgroundColor: $event })" />
      <ColorField label="Fondo del contenido" :model-value="row.style.contentBackgroundColor" @update:model-value="store.updateRowStyle(row.id, { contentBackgroundColor: $event })" />
      <NumberField label="Radio borde" :model-value="row.style.borderRadius" :min="0" :max="32" @update:model-value="store.updateRowStyle(row.id, { borderRadius: $event })" />
      <PaddingField label="Padding" :model-value="row.style.padding" @update:model-value="store.updateRowStyle(row.id, { padding: $event })" />

      <div class="vmd-props-subtitle">Imagen de fondo</div>
      <TextField label="URL" :model-value="row.style.backgroundImage?.url ?? ''" @update:model-value="setRowBgImage({ url: $event })" />
      <template v-if="row.style.backgroundImage?.url">
        <SelectField label="Repetición" :model-value="row.style.backgroundImage?.repeat ?? 'no-repeat'" :options="BG_REPEAT_OPTIONS" @update:model-value="setRowBgImage({ repeat: $event as RowBackgroundImage['repeat'] })" />
        <SelectField label="Tamaño" :model-value="row.style.backgroundImage?.size ?? 'auto'" :options="BG_SIZE_OPTIONS" @update:model-value="setRowBgImage({ size: $event as RowBackgroundImage['size'] })" />
        <TextField label="Posición" :model-value="row.style.backgroundImage?.position ?? 'center'" @update:model-value="setRowBgImage({ position: $event })" />
        <div class="vmd-field">
          <span class="vmd-field-label">Ancho del contenedor</span>
          <div class="vmd-align-group">
            <button type="button" class="vmd-mini-btn vmd-mini-btn--text" :class="{ 'vmd-active': !row.style.backgroundImage?.fullWidth }" @click="setRowBgImage({ fullWidth: false })">Contenido</button>
            <button type="button" class="vmd-mini-btn vmd-mini-btn--text" :class="{ 'vmd-active': row.style.backgroundImage?.fullWidth }" @click="setRowBgImage({ fullWidth: true })">Ancho completo</button>
          </div>
        </div>
      </template>

      <div class="vmd-props-section-title">Diseño responsivo</div>
      <CheckboxField label="Ocultar en escritorio" :model-value="!!row.hideDesktop" @update:model-value="store.updateRow(row.id, { hideDesktop: $event })" />
      <CheckboxField label="Ocultar en móvil" :model-value="!!row.hideMobile" @update:model-value="store.updateRow(row.id, { hideMobile: $event })" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { DEFAULT_FONTS } from '../fonts'
import { useBuilderOptions } from '../options'
import type { Border, Row, SocialNetworkKind } from '../schema'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { ICONS } from './icons'
import { ROW_LAYOUTS } from './palette-items'
import RichTextEditor from './RichTextEditor.vue'
import AlignField from './fields/AlignField.vue'
import CheckboxField from './fields/CheckboxField.vue'
import ColorField from './fields/ColorField.vue'
import DateTimeField from './fields/DateTimeField.vue'
import NumberField from './fields/NumberField.vue'
import PaddingField from './fields/PaddingField.vue'
import SelectField from './fields/SelectField.vue'
import TextField from './fields/TextField.vue'

type RowBackgroundImage = NonNullable<Row['style']['backgroundImage']>

const store = useDocumentStore(useBuilderPinia())
const options = useBuilderOptions()
const fileInput = ref<HTMLInputElement | null>(null)
const uploadFileName = ref<string | null>(null)
const block = computed(() => store.selectedBlock)
const row = computed(() => store.selectedRow)
const uploading = ref(false)

const activeColIdx = ref(0)
watch(
  () => row.value?.id,
  () => { activeColIdx.value = 0 },
)
const activeColumn = computed(() => {
  const cols = row.value?.columns
  if (!cols || cols.length === 0) return null
  return cols[Math.min(activeColIdx.value, cols.length - 1)]
})
const DEFAULT_BORDER: Border = { width: 0, style: 'solid', color: '#000000' }
const activeColumnBorder = computed<Border>(() => activeColumn.value?.style.border ?? DEFAULT_BORDER)
function setColumnBorder(patch: Partial<Border>) {
  if (!activeColumn.value) return
  store.updateColumn(activeColumn.value.id, { style: { border: { ...activeColumnBorder.value, ...patch } } })
}
const BORDER_STYLE_OPTIONS = [
  { label: 'Sólido', value: 'solid' },
  { label: 'Discontinuo', value: 'dashed' },
  { label: 'Punteado', value: 'dotted' },
]
const LINE_STYLE_OPTIONS = BORDER_STYLE_OPTIONS
const HEADING_LEVEL_OPTIONS = [
  { label: 'H1', value: '1' },
  { label: 'H2', value: '2' },
  { label: 'H3', value: '3' },
  { label: 'H4', value: '4' },
]
const FONT_WEIGHT_OPTIONS = [
  { label: 'Regular', value: 'normal' },
  { label: 'Negrita', value: 'bold' },
]
const TARGET_OPTIONS = [
  { label: 'Nueva pestaña', value: '_blank' },
  { label: 'Misma pestaña', value: '_self' },
]
const ICON_SHAPE_OPTIONS = [
  { label: 'Círculo', value: 'circle' },
  { label: 'Cuadrado', value: 'square' },
  { label: 'Redondeado', value: 'rounded' },
]
const MENU_LAYOUT_OPTIONS = [
  { label: 'Horizontal', value: 'horizontal' },
  { label: 'Vertical', value: 'vertical' },
]

const DEFAULT_BUTTON_BORDER: Border = { width: 0, style: 'solid', color: '#000000' }
const buttonBorder = computed<Border>(() => (block.value?.type === 'button' ? (block.value.style.border ?? DEFAULT_BUTTON_BORDER) : DEFAULT_BUTTON_BORDER))
function setButtonBorder(patch: Partial<Border>) {
  if (block.value?.type !== 'button') return
  upd({ style: { border: { ...buttonBorder.value, ...patch } } })
}
function toggleButtonAutoWidth(auto: boolean) {
  if (block.value?.type !== 'button') return
  upd({ widthPct: auto ? undefined : 100 })
}

const textLinkInheritsBody = computed(() => {
  if (block.value?.type !== 'text') return true
  return block.value.linkColor === undefined && block.value.linkUnderline === undefined
})
function toggleTextLinkInherit(inherit: boolean) {
  if (block.value?.type !== 'text') return
  upd(inherit ? { linkColor: undefined, linkUnderline: undefined } : { linkColor: '#3b82f6', linkUnderline: true })
}

const TYPE_LABELS: Record<string, string> = {
  heading: 'Título',
  text: 'Texto',
  image: 'Imagen',
  button: 'Botón',
  divider: 'Divisor',
  spacer: 'Espacio',
  social: 'Redes',
  menu: 'Menú',
  html: 'HTML',
  video: 'Video',
  table: 'Tabla',
  gallery: 'Galería',
  timer: 'Timer',
  row: 'Fila',
}

const FONT_OPTIONS = computed(() => {
  const fonts = options.fonts ?? DEFAULT_FONTS
  const opts = [{ label: 'Heredar', value: '' }, ...fonts.map((f) => ({ label: f.label, value: f.value }))]
  // conserva visible una fuente ya guardada que no esté en la lista (p. ej. 'Arial' de docs viejos)
  const b = block.value
  const current = b?.type === 'heading' || b?.type === 'text' || b?.type === 'menu' ? b.fontFamily : undefined
  if (current && !opts.some((o) => o.value === current)) opts.push({ label: 'Actual', value: current })
  return opts
})

const BG_REPEAT_OPTIONS = [
  { label: 'Sin repetir', value: 'no-repeat' },
  { label: 'Repetir', value: 'repeat' },
  { label: 'Repetir horizontal', value: 'repeat-x' },
  { label: 'Repetir vertical', value: 'repeat-y' },
]

const BG_SIZE_OPTIONS = [
  { label: 'Auto', value: 'auto' },
  { label: 'Cubrir', value: 'cover' },
  { label: 'Contener', value: 'contain' },
]

const title = computed(() => {
  const b = block.value
  if (b) {
    if (b.type === 'custom') {
      return options.customBlocks?.find((d) => d.type === b.customType)?.label ?? b.customType
    }
    return TYPE_LABELS[b.type] ?? b.type
  }
  if (row.value) return TYPE_LABELS.row
  return ''
})

function duplicate() {
  const sel = store.selection
  if (!sel) return
  if (sel.kind === 'block') store.duplicateBlock(sel.id)
  else store.duplicateRow(sel.id)
}

function remove() {
  const sel = store.selection
  if (!sel) return
  if (sel.kind === 'block') store.removeBlock(sel.id)
  else store.removeRow(sel.id)
}

const NETWORK_OPTIONS = [
  'facebook', 'instagram', 'x', 'linkedin', 'youtube', 'tiktok', 'whatsapp', 'web',
].map((v) => ({ label: v, value: v }))

function upd(patch: Record<string, unknown>) {
  if (block.value) store.updateBlock(block.value.id, patch)
}

const customFields = computed(() => {
  const b = block.value
  if (b?.type !== 'custom') return []
  return options.customBlocks?.find((d) => d.type === b.customType)?.fields ?? []
})

function updData(key: string, value: unknown) {
  const b = block.value
  if (b?.type !== 'custom') return
  upd({ data: { ...b.data, [key]: value } })
}

async function onUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !options.uploadImage || !block.value) return
  uploadFileName.value = file.name
  const id = block.value.id
  uploading.value = true
  try {
    const url = await options.uploadImage(file)
    store.updateBlock(id, { src: url })
  } finally {
    uploading.value = false
    input.value = ''
  }
}

function setNetwork(i: number, patch: Partial<{ kind: SocialNetworkKind; url: string }>) {
  if (block.value?.type !== 'social') return
  const networks = block.value.networks.map((n, j) => (j === i ? { ...n, ...patch } : n))
  upd({ networks })
}
function addNetwork() {
  if (block.value?.type !== 'social') return
  upd({ networks: [...block.value.networks, { kind: 'web', url: 'https://' }] })
}
function removeNetwork(i: number) {
  if (block.value?.type !== 'social') return
  upd({ networks: block.value.networks.filter((_, j) => j !== i) })
}

function setMenuItem(i: number, patch: Partial<{ label: string; href: string }>) {
  if (block.value?.type !== 'menu') return
  upd({ items: block.value.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) })
}
function addMenuItem() {
  if (block.value?.type !== 'menu') return
  upd({ items: [...block.value.items, { label: 'Nuevo', href: 'https://' }] })
}
function removeMenuItem(i: number) {
  if (block.value?.type !== 'menu') return
  upd({ items: block.value.items.filter((_, j) => j !== i) })
}

function updFont(value: string) {
  upd({ fontFamily: value === '' ? undefined : value })
}

function setTableCell(r: number, c: number, value: string) {
  if (block.value?.type !== 'table') return
  const rows = block.value.rows.map((tRow, ri) => (ri === r ? tRow.map((cell, ci) => (ci === c ? value : cell)) : tRow))
  upd({ rows })
}
function addTableRow() {
  if (block.value?.type !== 'table') return
  const cols = block.value.rows[0]?.length ?? 1
  upd({ rows: [...block.value.rows, Array(cols).fill('')] })
}
function removeLastTableRow() {
  if (block.value?.type !== 'table') return
  if (block.value.rows.length <= 1) return
  upd({ rows: block.value.rows.slice(0, -1) })
}
function addTableColumn() {
  if (block.value?.type !== 'table') return
  upd({ rows: block.value.rows.map((tRow) => [...tRow, '']) })
}
function removeLastTableColumn() {
  if (block.value?.type !== 'table') return
  if ((block.value.rows[0]?.length ?? 0) <= 1) return
  upd({ rows: block.value.rows.map((tRow) => tRow.slice(0, -1)) })
}

function setGalleryImage(i: number, patch: Partial<{ src: string; alt: string; href: string }>) {
  if (block.value?.type !== 'gallery') return
  upd({ images: block.value.images.map((img, j) => (j === i ? { ...img, ...patch } : img)) })
}
function addGalleryImage() {
  if (block.value?.type !== 'gallery') return
  upd({ images: [...block.value.images, { src: '', alt: '' }] })
}
function removeGalleryImage(i: number) {
  if (block.value?.type !== 'gallery') return
  upd({ images: block.value.images.filter((_, j) => j !== i) })
}

function isActiveLayout(widths: number[]): boolean {
  const cols = row.value?.columns
  if (!cols || cols.length !== widths.length) return false
  return cols.every((c, i) => c.widthPct === widths[i])
}

function setRowBgImage(patch: Partial<RowBackgroundImage>) {
  if (!row.value) return
  const current: RowBackgroundImage = row.value.style.backgroundImage ?? {
    url: '', repeat: 'no-repeat', size: 'auto', position: 'center', fullWidth: false,
  }
  store.updateRowStyle(row.value.id, { backgroundImage: { ...current, ...patch } })
}
</script>
