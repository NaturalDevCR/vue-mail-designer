<template>
  <div class="vmd-props" @click.stop>
    <div class="vmd-props-header">
      <h3>{{ title }}</h3>
      <div class="vmd-toolbar-group">
        <button type="button" class="vmd-mini-btn" :title="t('props.duplicate')" data-action="props-duplicate" @click="duplicate"><span class="vmd-ico" v-html="ICONS.duplicate" /></button>
        <button type="button" class="vmd-mini-btn vmd-mini-btn--danger" :title="t('props.delete')" data-action="props-delete" @click="remove"><span class="vmd-ico" v-html="ICONS.trash" /></button>
        <button type="button" class="vmd-mini-btn" :title="t('common.close')" data-action="props-close" @click="store.select(null)"><span class="vmd-ico" v-html="ICONS.close" /></button>
      </div>
    </div>

    <!-- Bloque seleccionado -->
    <template v-if="block">
      <template v-if="block.type === 'heading'">
        <div class="vmd-props-section-title">{{ t('props.text') }}</div>
        <TextField :label="t('props.text')" :model-value="block.text" @update:model-value="upd({ text: $event })" />
        <SelectField :label="t('props.level')" :model-value="String(block.level)" :options="HEADING_LEVEL_OPTIONS" @update:model-value="upd({ level: Number($event) })" />
        <SelectField :label="t('props.font')" :model-value="block.fontFamily ?? ''" :options="FONT_OPTIONS" @update:model-value="updFont" />
        <SelectField :label="t('props.fontWeight')" :model-value="block.fontWeight" :options="FONT_WEIGHT_OPTIONS" @update:model-value="upd({ fontWeight: $event as 'normal' | 'bold' })" />
        <NumberField :label="t('props.size')" :model-value="block.style.fontSize" :min="10" :max="72" @update:model-value="upd({ style: { fontSize: $event } })" />
        <ColorField :label="t('props.color')" :model-value="block.style.color" @update:model-value="upd({ style: { color: $event } })" />
        <AlignField :label="t('props.alignment')" :model-value="block.style.align" @update:model-value="upd({ style: { align: $event } })" />
        <NumberField :label="t('props.lineHeight')" :model-value="block.style.lineHeight" :min="0.8" :max="3" :step="0.1" @update:model-value="upd({ style: { lineHeight: $event } })" />
        <NumberField :label="t('props.letterSpacing')" :model-value="block.style.letterSpacing" :min="-2" :max="10" :step="0.5" @update:model-value="upd({ style: { letterSpacing: $event } })" />
        <div class="vmd-props-section-title">{{ t('props.general') }}</div>
        <PaddingField :label="t('props.padding')" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'text'">
        <div class="vmd-props-section-title">{{ t('props.text') }}</div>
        <div class="vmd-field">
          <span class="vmd-field-label">{{ t('props.content') }}</span>
          <RichTextEditor :model-value="block.html" @update:model-value="upd({ html: $event })" />
        </div>
        <SelectField :label="t('props.font')" :model-value="block.fontFamily ?? ''" :options="FONT_OPTIONS" @update:model-value="updFont" />
        <ColorField :label="t('props.color')" :model-value="block.style.color" @update:model-value="upd({ style: { color: $event } })" />
        <AlignField :label="t('props.alignment')" :model-value="block.style.align" @update:model-value="upd({ style: { align: $event } })" />
        <NumberField :label="t('props.size')" :model-value="block.style.fontSize" :min="10" :max="40" @update:model-value="upd({ style: { fontSize: $event } })" />
        <NumberField :label="t('props.lineHeight')" :model-value="block.style.lineHeight" :min="1" :max="3" :step="0.1" @update:model-value="upd({ style: { lineHeight: $event } })" />
        <NumberField :label="t('props.letterSpacing')" :model-value="block.style.letterSpacing" :min="-2" :max="10" :step="0.5" @update:model-value="upd({ style: { letterSpacing: $event } })" />
        <div class="vmd-props-section-title">{{ t('props.links') }}</div>
        <CheckboxField :label="t('props.inheritBodyLinkStyles')" :model-value="textLinkInheritsBody" @update:model-value="toggleTextLinkInherit" />
        <template v-if="!textLinkInheritsBody">
          <ColorField :label="t('props.linkColor')" :model-value="block.linkColor ?? '#3b82f6'" @update:model-value="upd({ linkColor: $event })" />
          <CheckboxField :label="t('props.underline')" :model-value="block.linkUnderline ?? true" @update:model-value="upd({ linkUnderline: $event })" />
        </template>
        <div class="vmd-props-section-title">{{ t('props.general') }}</div>
        <PaddingField :label="t('props.padding')" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'image'">
        <div class="vmd-props-section-title">{{ t('palette.image') }}</div>
        <div v-if="options.uploadImage" class="vmd-field">
          <span class="vmd-field-label">{{ t('props.uploadImage') }}</span>
          <div class="vmd-upload-row">
            <button type="button" class="vmd-btn" :disabled="uploading" @click="fileInput?.click()">
              <span class="vmd-ico" v-html="ICONS.upload" />{{ uploading ? t('common.uploading') : t('props.chooseFile') }}
            </button>
            <span class="vmd-upload-filename">{{ uploadFileName ?? t('props.noFileSelected') }}</span>
          </div>
          <input ref="fileInput" type="file" accept="image/*" class="vmd-visually-hidden" @change="onUpload" />
        </div>
        <button
          v-if="options.uploadImage && block.src"
          type="button"
          class="vmd-mini-btn vmd-mini-btn--text"
          data-action="crop-image"
          @click="ui.imageEditorBlockId = block.id"
        >
          {{ t('image.crop') }}
        </button>
        <TextField :label="t('props.url')" :model-value="block.src" @update:model-value="upd({ src: $event })" />
        <CheckboxField :label="t('props.autoWidth')" :model-value="block.widthAuto" @update:model-value="upd({ widthAuto: $event })" />
        <NumberField v-if="!block.widthAuto" :label="t('props.widthPercent')" :model-value="block.widthPct" :min="10" :max="100" @update:model-value="upd({ widthPct: $event })" />
        <AlignField :label="t('props.alignment')" :model-value="block.align" @update:model-value="upd({ align: $event })" />
        <TextField :label="t('props.altText')" :model-value="block.alt" @update:model-value="upd({ alt: $event })" />
        <div class="vmd-props-section-title">{{ t('props.action') }}</div>
        <TextField :label="t('props.linkOptional')" :model-value="block.href ?? ''" @update:model-value="upd({ href: $event })" />
        <SelectField v-if="block.href" :label="t('props.destination')" :model-value="block.target" :options="TARGET_OPTIONS" @update:model-value="upd({ target: $event as '_blank' | '_self' })" />
        <div class="vmd-props-section-title">{{ t('props.general') }}</div>
        <PaddingField :label="t('props.padding')" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'button'">
        <div class="vmd-props-section-title">{{ t('props.action') }}</div>
        <TextField :label="t('props.text')" data-field="label" :model-value="block.label" @update:model-value="upd({ label: $event })" />
        <TextField :label="t('rte.link')" :model-value="block.href" @update:model-value="upd({ href: $event })" />
        <SelectField :label="t('props.destination')" :model-value="block.target" :options="TARGET_OPTIONS" @update:model-value="upd({ target: $event as '_blank' | '_self' })" />
        <div class="vmd-props-section-title">{{ t('props.buttonOptions') }}</div>
        <ColorField :label="t('props.background')" :model-value="block.style.backgroundColor" @update:model-value="upd({ style: { backgroundColor: $event } })" />
        <ColorField :label="t('props.text')" :model-value="block.style.color" @update:model-value="upd({ style: { color: $event } })" />
        <CheckboxField :label="t('props.autoWidth')" :model-value="block.widthPct == null" @update:model-value="toggleButtonAutoWidth" />
        <NumberField v-if="block.widthPct != null" :label="t('props.widthPercent')" :model-value="block.widthPct" :min="10" :max="100" @update:model-value="upd({ widthPct: $event })" />
        <NumberField :label="t('props.fontSize')" :model-value="block.style.fontSize" :min="10" :max="32" @update:model-value="upd({ style: { fontSize: $event } })" />
        <NumberField :label="t('props.lineHeight')" :model-value="block.style.lineHeight" :min="0.8" :max="3" :step="0.1" @update:model-value="upd({ style: { lineHeight: $event } })" />
        <NumberField :label="t('props.letterSpacing')" :model-value="block.style.letterSpacing" :min="-2" :max="10" :step="0.5" @update:model-value="upd({ style: { letterSpacing: $event } })" />
        <div class="vmd-props-section-title">{{ t('props.spacing') }}</div>
        <AlignField :label="t('props.alignment')" :model-value="block.align" @update:model-value="upd({ align: $event })" />
        <NumberField :label="t('props.horizontalPadding')" :model-value="block.style.innerPaddingX" :min="0" :max="80" @update:model-value="upd({ style: { innerPaddingX: $event } })" />
        <NumberField :label="t('props.verticalPadding')" :model-value="block.style.innerPaddingY" :min="0" :max="60" @update:model-value="upd({ style: { innerPaddingY: $event } })" />
        <div class="vmd-props-subtitle">{{ t('props.border') }}</div>
        <NumberField :label="t('props.borderThickness')" :model-value="buttonBorder.width" :min="0" :max="12" @update:model-value="setButtonBorder({ width: $event })" />
        <SelectField :label="t('props.borderStyle')" :model-value="buttonBorder.style" :options="BORDER_STYLE_OPTIONS" @update:model-value="setButtonBorder({ style: $event as Border['style'] })" />
        <ColorField :label="t('props.color')" :model-value="buttonBorder.color" @update:model-value="setButtonBorder({ color: $event })" />
        <NumberField :label="t('props.borderRadius')" :model-value="block.style.borderRadius" :min="0" :max="40" @update:model-value="upd({ style: { borderRadius: $event } })" />
        <div class="vmd-props-section-title">{{ t('props.general') }}</div>
        <PaddingField :label="t('props.containerPadding')" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'divider'">
        <div class="vmd-props-section-title">{{ t('props.line') }}</div>
        <NumberField :label="t('props.widthPercent')" :model-value="block.style.widthPct" :min="10" :max="100" @update:model-value="upd({ style: { widthPct: $event } })" />
        <SelectField :label="t('props.lineStyle')" :model-value="block.style.lineStyle" :options="LINE_STYLE_OPTIONS" @update:model-value="upd({ style: { lineStyle: $event as 'solid' | 'dashed' | 'dotted' } })" />
        <NumberField :label="t('props.borderThickness')" :model-value="block.style.thickness" :min="1" :max="10" @update:model-value="upd({ style: { thickness: $event } })" />
        <ColorField :label="t('props.color')" :model-value="block.style.color" @update:model-value="upd({ style: { color: $event } })" />
        <AlignField :label="t('props.alignment')" :model-value="block.style.align" @update:model-value="upd({ style: { align: $event } })" />
        <div class="vmd-props-section-title">{{ t('props.general') }}</div>
        <PaddingField :label="t('props.padding')" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'spacer'">
        <NumberField :label="t('props.height')" :model-value="block.height" :min="4" :max="200" @update:model-value="upd({ height: $event })" />
        <div class="vmd-props-section-title">{{ t('props.general') }}</div>
        <PaddingField :label="t('props.padding')" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'social'">
        <div v-for="(n, i) in block.networks" :key="i" class="vmd-social-row">
          <SelectField :label="`${t('props.network')} ${i + 1}`" :model-value="n.kind" :options="NETWORK_OPTIONS" @update:model-value="setNetwork(i, { kind: $event as SocialNetworkKind })" />
          <TextField :label="t('props.url')" :model-value="n.url" @update:model-value="setNetwork(i, { url: $event })" />
          <button type="button" class="vmd-mini-btn vmd-mini-btn--danger" @click="removeNetwork(i)"><span class="vmd-ico" v-html="ICONS.trash" /></button>
        </div>
        <button type="button" class="vmd-btn" @click="addNetwork">{{ t('props.addNetwork') }}</button>
        <div class="vmd-props-section-title">{{ t('props.icons') }}</div>
        <SelectField :label="t('props.iconShape')" :model-value="block.iconShape" :options="ICON_SHAPE_OPTIONS" @update:model-value="upd({ iconShape: $event as 'circle' | 'square' | 'rounded' })" />
        <AlignField :label="t('props.alignment')" :model-value="block.align" @update:model-value="upd({ align: $event })" />
        <NumberField :label="t('props.iconSize')" :model-value="block.iconSize" :min="16" :max="64" @update:model-value="upd({ iconSize: $event })" />
        <NumberField :label="t('props.spacing')" :model-value="block.spacing" :min="0" :max="32" @update:model-value="upd({ spacing: $event })" />
        <div class="vmd-props-section-title">{{ t('props.general') }}</div>
        <PaddingField :label="t('props.padding')" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'menu'">
        <div v-for="(it, i) in block.items" :key="i" class="vmd-social-row">
          <TextField :label="t('props.itemLabel')" :model-value="it.label" @update:model-value="setMenuItem(i, { label: $event })" />
          <TextField :label="t('props.url')" :model-value="it.href" @update:model-value="setMenuItem(i, { href: $event })" />
          <button type="button" class="vmd-mini-btn vmd-mini-btn--danger" @click="removeMenuItem(i)"><span class="vmd-ico" v-html="ICONS.trash" /></button>
        </div>
        <button type="button" class="vmd-btn" @click="addMenuItem">{{ t('props.addItem') }}</button>
        <div class="vmd-props-section-title">{{ t('props.styles') }}</div>
        <SelectField :label="t('props.font')" :model-value="block.fontFamily ?? ''" :options="FONT_OPTIONS" @update:model-value="updFont" />
        <SelectField :label="t('props.fontWeight')" :model-value="block.fontWeight" :options="FONT_WEIGHT_OPTIONS" @update:model-value="upd({ fontWeight: $event as 'normal' | 'bold' })" />
        <NumberField :label="t('props.fontSize')" :model-value="block.style.fontSize" :min="10" :max="32" @update:model-value="upd({ style: { fontSize: $event } })" />
        <NumberField :label="t('props.letterSpacing')" :model-value="block.style.letterSpacing" :min="-2" :max="10" :step="0.5" @update:model-value="upd({ style: { letterSpacing: $event } })" />
        <ColorField :label="t('props.textColor')" :model-value="block.style.color" @update:model-value="upd({ style: { color: $event } })" />
        <ColorField :label="t('props.linkColor')" :model-value="block.linkColor ?? block.style.color" @update:model-value="upd({ linkColor: $event })" />
        <AlignField :label="t('props.alignment')" :model-value="block.align" @update:model-value="upd({ align: $event })" />
        <SelectField :label="t('props.layoutDirection')" :model-value="block.layout" :options="MENU_LAYOUT_OPTIONS" @update:model-value="upd({ layout: $event as 'horizontal' | 'vertical' })" />
        <TextField :label="t('props.separator')" :model-value="block.separator" @update:model-value="upd({ separator: $event })" />
        <PaddingField :label="t('props.itemPadding')" :model-value="block.style.itemPadding" @update:model-value="upd({ style: { itemPadding: $event } })" />
        <div class="vmd-props-section-title">{{ t('props.general') }}</div>
        <PaddingField :label="t('props.containerPadding')" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'html'">
        <label class="vmd-field">
          <span class="vmd-field-label">{{ t('props.htmlCode') }}</span>
          <textarea class="vmd-field-input vmd-field-code" rows="8" :value="block.code" @input="upd({ code: ($event.target as HTMLTextAreaElement).value })" />
        </label>
        <div class="vmd-props-section-title">{{ t('props.general') }}</div>
        <PaddingField :label="t('props.padding')" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'video'">
        <TextField :label="t('props.videoUrl')" :model-value="block.videoUrl" @update:model-value="upd({ videoUrl: $event })" />
        <TextField :label="t('props.thumbnailUrl')" :model-value="block.thumbnailUrl" @update:model-value="upd({ thumbnailUrl: $event })" />
        <TextField :label="t('props.altText')" :model-value="block.alt" @update:model-value="upd({ alt: $event })" />
        <NumberField :label="t('props.widthPercent')" :model-value="block.widthPct" :min="10" :max="100" @update:model-value="upd({ widthPct: $event })" />
        <div class="vmd-props-section-title">{{ t('props.general') }}</div>
        <PaddingField :label="t('props.padding')" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'table'">
        <CheckboxField :label="t('props.headerRow')" :model-value="block.headerRow" @update:model-value="upd({ headerRow: $event })" />
        <CheckboxField :label="t('props.stripedRows')" :model-value="block.stripedRows" @update:model-value="upd({ stripedRows: $event })" />
        <div class="vmd-table-toolbar">
          <button type="button" class="vmd-btn" @click="addTableRow">{{ t('props.addRow') }}</button>
          <button type="button" class="vmd-btn" @click="removeLastTableRow">{{ t('props.removeRow') }}</button>
          <button type="button" class="vmd-btn" @click="addTableColumn">{{ t('props.addColumn') }}</button>
          <button type="button" class="vmd-btn" @click="removeLastTableColumn">{{ t('props.removeColumn') }}</button>
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
        <div class="vmd-props-section-title">{{ t('props.border') }}</div>
        <ColorField :label="t('props.borderColor')" :model-value="block.style.borderColor" @update:model-value="upd({ style: { borderColor: $event } })" />
        <NumberField :label="t('props.tableBorderThickness')" :model-value="block.style.borderWidth" :min="0" :max="8" @update:model-value="upd({ style: { borderWidth: $event } })" />
        <div class="vmd-props-section-title">{{ t('props.header') }}</div>
        <ColorField :label="t('props.background')" :model-value="block.style.headerBackground" @update:model-value="upd({ style: { headerBackground: $event } })" />
        <ColorField :label="t('props.textColor')" :model-value="block.style.headerColor ?? block.style.color" @update:model-value="upd({ style: { headerColor: $event } })" />
        <div class="vmd-props-section-title">{{ t('props.content') }}</div>
        <ColorField :label="t('props.textColor')" :model-value="block.style.color" @update:model-value="upd({ style: { color: $event } })" />
        <NumberField :label="t('props.fontSize')" :model-value="block.style.fontSize" :min="10" :max="32" @update:model-value="upd({ style: { fontSize: $event } })" />
        <NumberField :label="t('props.cellPadding')" :model-value="block.style.cellPadding" :min="0" :max="32" @update:model-value="upd({ style: { cellPadding: $event } })" />
        <div class="vmd-props-section-title">{{ t('props.general') }}</div>
        <PaddingField :label="t('props.padding')" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'gallery'">
        <div v-for="(img, i) in block.images" :key="i" class="vmd-social-row">
          <TextField :label="t('props.url')" :model-value="img.src" @update:model-value="setGalleryImage(i, { src: $event })" />
          <TextField :label="t('props.altText')" :model-value="img.alt" @update:model-value="setGalleryImage(i, { alt: $event })" />
          <TextField :label="t('props.linkOptional')" :model-value="img.href ?? ''" @update:model-value="setGalleryImage(i, { href: $event })" />
          <button type="button" class="vmd-mini-btn vmd-mini-btn--danger" @click="removeGalleryImage(i)"><span class="vmd-ico" v-html="ICONS.trash" /></button>
        </div>
        <button type="button" class="vmd-btn" @click="addGalleryImage">{{ t('props.addImage') }}</button>
        <SelectField :label="t('props.columns')" :model-value="String(block.columns)" :options="[{label:'2',value:'2'},{label:'3',value:'3'},{label:'4',value:'4'}]" @update:model-value="upd({ columns: Number($event) })" />
        <NumberField :label="t('props.spacing')" :model-value="block.gap" :min="0" :max="32" @update:model-value="upd({ gap: $event })" />
        <PaddingField :label="t('props.padding')" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'timer'">
        <DateTimeField :label="t('props.deadline')" :model-value="block.endDate" @update:model-value="upd({ endDate: $event })" />
        <TextField :label="t('props.imageUrl')" :model-value="block.imageUrl" @update:model-value="upd({ imageUrl: $event })" />
        <TextField :label="t('props.altText')" :model-value="block.alt" @update:model-value="upd({ alt: $event })" />
        <NumberField :label="t('props.widthPercent')" :model-value="block.widthPct" :min="10" :max="100" @update:model-value="upd({ widthPct: $event })" />
        <PaddingField :label="t('props.padding')" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
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
        <div class="vmd-props-section-title">{{ t('props.general') }}</div>
        <PaddingField :label="t('props.padding')" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <div class="vmd-props-section-title">{{ t('props.visibility') }}</div>
      <CheckboxField :label="t('props.hideDesktop')" :model-value="!!block.hideDesktop" @update:model-value="upd({ hideDesktop: $event })" />
      <CheckboxField :label="t('props.hideMobile')" :model-value="!!block.hideMobile" @update:model-value="upd({ hideMobile: $event })" />
    </template>

    <!-- Fila seleccionada -->
    <template v-else-if="row">
      <div class="vmd-props-section-title">{{ t('props.layout') }}</div>
      <div class="vmd-layout-picker">
        <button
          v-for="l in ROW_LAYOUTS"
          :key="l.key"
          type="button"
          class="vmd-layout-opt"
          :class="{ 'vmd-active': isActiveLayout(l.widths) }"
          :title="columnLayoutTitle(l.widths.length)"
          @click="store.setRowColumns(row.id, l.widths)"
        >
          <span v-for="(w, i) in l.widths" :key="i" class="vmd-layout-opt-cell" :style="{ flex: w }" />
        </button>
      </div>

      <div class="vmd-props-section-title">{{ t('props.columnProperties') }}</div>
      <div class="vmd-col-tabs">
        <button
          v-for="(col, i) in row.columns"
          :key="col.id"
          type="button"
          class="vmd-col-tab"
          :class="{ 'vmd-active': activeColIdx === i }"
          @click="activeColIdx = i"
        >{{ t('props.column') }} {{ i + 1 }}</button>
      </div>
      <template v-if="activeColumn">
        <ColorField :label="t('props.background')" :model-value="activeColumn.style.backgroundColor" @update:model-value="store.updateColumn(activeColumn!.id, { style: { backgroundColor: $event } })" />
        <PaddingField :label="t('props.padding')" :model-value="activeColumn.style.padding" @update:model-value="store.updateColumn(activeColumn!.id, { style: { padding: $event } })" />
        <NumberField :label="t('props.borderRadius')" :model-value="activeColumn.style.borderRadius ?? 0" :min="0" :max="32" @update:model-value="store.updateColumn(activeColumn!.id, { style: { borderRadius: $event } })" />
        <div class="vmd-props-subtitle">{{ t('props.border') }}</div>
        <NumberField :label="t('props.borderThickness')" :model-value="activeColumnBorder.width" :min="0" :max="12" @update:model-value="setColumnBorder({ width: $event })" />
        <SelectField :label="t('props.borderStyle')" :model-value="activeColumnBorder.style" :options="BORDER_STYLE_OPTIONS" @update:model-value="setColumnBorder({ style: $event as Border['style'] })" />
        <ColorField :label="t('props.color')" :model-value="activeColumnBorder.color" @update:model-value="setColumnBorder({ color: $event })" />
      </template>

      <div class="vmd-props-section-title">{{ t('props.rowProperties') }}</div>
      <ColorField :label="t('props.background')" :model-value="row.style.backgroundColor" @update:model-value="store.updateRowStyle(row.id, { backgroundColor: $event })" />
      <ColorField :label="t('props.contentBackground')" :model-value="row.style.contentBackgroundColor" @update:model-value="store.updateRowStyle(row.id, { contentBackgroundColor: $event })" />
      <NumberField :label="t('props.borderRadius')" :model-value="row.style.borderRadius" :min="0" :max="32" @update:model-value="store.updateRowStyle(row.id, { borderRadius: $event })" />
      <PaddingField :label="t('props.padding')" :model-value="row.style.padding" @update:model-value="store.updateRowStyle(row.id, { padding: $event })" />

      <div class="vmd-props-subtitle">{{ t('props.backgroundImage') }}</div>
      <TextField :label="t('props.url')" :model-value="row.style.backgroundImage?.url ?? ''" @update:model-value="setRowBgImage({ url: $event })" />
      <template v-if="row.style.backgroundImage?.url">
        <SelectField :label="t('props.repeat')" :model-value="row.style.backgroundImage?.repeat ?? 'no-repeat'" :options="BG_REPEAT_OPTIONS" @update:model-value="setRowBgImage({ repeat: $event as RowBackgroundImage['repeat'] })" />
        <SelectField :label="t('props.size')" :model-value="row.style.backgroundImage?.size ?? 'auto'" :options="BG_SIZE_OPTIONS" @update:model-value="setRowBgImage({ size: $event as RowBackgroundImage['size'] })" />
        <TextField :label="t('props.position')" :model-value="row.style.backgroundImage?.position ?? 'center'" @update:model-value="setRowBgImage({ position: $event })" />
        <div class="vmd-field">
          <span class="vmd-field-label">{{ t('props.containerWidth') }}</span>
          <div class="vmd-align-group">
            <button type="button" class="vmd-mini-btn vmd-mini-btn--text" :class="{ 'vmd-active': !row.style.backgroundImage?.fullWidth }" @click="setRowBgImage({ fullWidth: false })">{{ t('props.contentWidthOption') }}</button>
            <button type="button" class="vmd-mini-btn vmd-mini-btn--text" :class="{ 'vmd-active': row.style.backgroundImage?.fullWidth }" @click="setRowBgImage({ fullWidth: true })">{{ t('props.fullWidth') }}</button>
          </div>
        </div>
      </template>

      <div class="vmd-props-section-title">{{ t('props.responsiveDesign') }}</div>
      <CheckboxField :label="t('props.hideDesktop')" :model-value="!!row.hideDesktop" @update:model-value="store.updateRow(row.id, { hideDesktop: $event })" />
      <CheckboxField :label="t('props.hideMobile')" :model-value="!!row.hideMobile" @update:model-value="store.updateRow(row.id, { hideMobile: $event })" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { DEFAULT_FONTS } from '../fonts'
import { useI18n } from '../i18n/useI18n'
import { useBuilderOptions } from '../options'
import type { Border, Row, SocialNetworkKind } from '../schema'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { useUiStore } from '../store/ui'
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
const ui = useUiStore(useBuilderPinia())
const { t } = useI18n()
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
const BORDER_STYLE_OPTIONS = computed(() => [
  { label: t('props.borderSolid'), value: 'solid' },
  { label: t('props.borderDashed'), value: 'dashed' },
  { label: t('props.borderDotted'), value: 'dotted' },
])
const LINE_STYLE_OPTIONS = BORDER_STYLE_OPTIONS
const HEADING_LEVEL_OPTIONS = [
  { label: 'H1', value: '1' },
  { label: 'H2', value: '2' },
  { label: 'H3', value: '3' },
  { label: 'H4', value: '4' },
]
const FONT_WEIGHT_OPTIONS = computed(() => [
  { label: t('body.fontWeightRegular'), value: 'normal' },
  { label: t('body.fontWeightBold'), value: 'bold' },
])
const TARGET_OPTIONS = computed(() => [
  { label: t('props.newTab'), value: '_blank' },
  { label: t('props.sameTab'), value: '_self' },
])
const ICON_SHAPE_OPTIONS = computed(() => [
  { label: t('props.iconShapeCircle'), value: 'circle' },
  { label: t('props.iconShapeSquare'), value: 'square' },
  { label: t('props.iconShapeRounded'), value: 'rounded' },
])
const MENU_LAYOUT_OPTIONS = computed(() => [
  { label: t('props.layoutHorizontal'), value: 'horizontal' },
  { label: t('props.layoutVertical'), value: 'vertical' },
])

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

const TYPE_LABELS = computed<Record<string, string>>(() => ({
  heading: t('palette.heading'),
  text: t('palette.text'),
  image: t('palette.image'),
  button: t('palette.button'),
  divider: t('palette.divider'),
  spacer: t('palette.spacer'),
  social: t('palette.social'),
  menu: t('palette.menu'),
  html: t('palette.html'),
  video: t('palette.video'),
  table: t('palette.table'),
  gallery: t('palette.gallery'),
  timer: t('palette.timer'),
  row: t('props.row'),
}))

const FONT_OPTIONS = computed(() => {
  const fonts = options.fonts ?? DEFAULT_FONTS
  const opts = [{ label: t('props.inheritFont'), value: '' }, ...fonts.map((f) => ({ label: f.label, value: f.value }))]
  // conserva visible una fuente ya guardada que no esté en la lista (p. ej. 'Arial' de docs viejos)
  const b = block.value
  const current = b?.type === 'heading' || b?.type === 'text' || b?.type === 'menu' ? b.fontFamily : undefined
  if (current && !opts.some((o) => o.value === current)) opts.push({ label: t('body.currentFont'), value: current })
  return opts
})

const BG_REPEAT_OPTIONS = computed(() => [
  { label: t('body.noRepeat'), value: 'no-repeat' },
  { label: t('body.repeat'), value: 'repeat' },
  { label: t('body.repeatHorizontal'), value: 'repeat-x' },
  { label: t('body.repeatVertical'), value: 'repeat-y' },
])

const BG_SIZE_OPTIONS = computed(() => [
  { label: t('body.auto'), value: 'auto' },
  { label: t('body.cover'), value: 'cover' },
  { label: t('body.contain'), value: 'contain' },
])

const title = computed(() => {
  const b = block.value
  if (b) {
    if (b.type === 'custom') {
      return options.customBlocks?.find((d) => d.type === b.customType)?.label ?? b.customType
    }
    return TYPE_LABELS.value[b.type] ?? b.type
  }
  if (row.value) return TYPE_LABELS.value.row
  return ''
})

function columnLayoutTitle(count: number): string {
  return `${count} ${count === 1 ? t('props.columnSingular') : t('props.columnPlural')}`
}

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
