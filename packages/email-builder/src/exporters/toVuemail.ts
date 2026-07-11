/**
 * Vue Email Export Utility
 * Converts email document to Vue Email format for rendering
 */

import type { EmailDocument, Row, Column, Block, TextBlock, ImageBlock, ButtonBlock, DividerBlock } from '../schema/document';

/**
 * Vue Email component interface
 */
export interface VuemailComponent {
  type: string;
  props?: Record<string, unknown>;
  children?: (VuemailComponent | string)[];
}

/**
 * Export options for Vue Email
 */
export interface VuemailExportOptions {
  includeContainer?: boolean;
  containerWidth?: number;
  backgroundColor?: string;
  fontFamily?: string;
  fontSize?: string;
  lineHeight?: string;
  textColor?: string;
  linkColor?: string;
  minifyOutput?: boolean;
  includeMetaTags?: boolean;
  outlookCompatibility?: boolean;
  darkModeSupport?: boolean;
}

/**
 * Default export options
 */
const defaultOptions: Required<VuemailExportOptions> = {
  includeContainer: true,
  containerWidth: 600,
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '16px',
  lineHeight: '1.5',
  textColor: '#000000',
  linkColor: '#3b82f6',
  minifyOutput: false,
  includeMetaTags: true,
  outlookCompatibility: true,
  darkModeSupport: false
};

/**
 * Convert email document to Vue Email format
 */
export function toVuemail(
  document: EmailDocument,
  options: Partial<VuemailExportOptions> = {}
): VuemailComponent {
  const opts = { ...defaultOptions, ...options };
  
  // Extract document metadata
  const meta = document.meta || {};
  const documentStyle = (document as { style?: Record<string, unknown> }).style || {};
  
  // Build the email structure
  const emailComponent: VuemailComponent = {
    type: 'Html',
    props: {
      lang: (meta as { language?: string }).language || 'en',
      dir: (meta as { direction?: string }).direction || 'ltr'
    },
    children: [
      // Head section
      {
        type: 'Head',
        children: [
          ...(opts.includeMetaTags ? [
            {
              type: 'Meta',
              props: {
                charset: 'utf-8'
              }
            },
            {
              type: 'Meta',
              props: {
                name: 'viewport',
                content: 'width=device-width, initial-scale=1.0'
              }
            },
            {
              type: 'Meta',
              props: {
                'http-equiv': 'X-UA-Compatible',
                content: 'IE=edge'
              }
            },
            ...((meta as { title?: string }).title ? [{
              type: 'Title',
              children: [(meta as { title?: string }).title]
            }] : [])
          ] : []),
          
          // Outlook compatibility
          ...(opts.outlookCompatibility ? [{
            type: 'Style',
            children: [`
              /* Outlook-specific styles */
              .outlook-group-fix {
                width: 100% !important;
              }
              
              /* Reset styles for Outlook */
              table {
                border-collapse: collapse;
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
              }
              
              img {
                -ms-interpolation-mode: bicubic;
                border: 0;
                height: auto;
                line-height: 100%;
                outline: none;
                text-decoration: none;
              }
            `]
          }] : []),
          
          // Dark mode support
          ...(opts.darkModeSupport ? [{
            type: 'Style',
            children: [`
              @media (prefers-color-scheme: dark) {
                .dark-mode-bg { background-color: #1f2937 !important; }
                .dark-mode-text { color: #f9fafb !important; }
                .dark-mode-border { border-color: #374151 !important; }
              }
            `]
          }] : [])
        ]
      },
      
      // Body section
      {
        type: 'Body',
        props: {
          style: {
            margin: '0',
            padding: '0',
            backgroundColor: documentStyle.backgroundColor || opts.backgroundColor,
            fontFamily: opts.fontFamily,
            fontSize: opts.fontSize,
            lineHeight: opts.lineHeight,
            color: opts.textColor,
            '-webkit-text-size-adjust': '100%',
            '-ms-text-size-adjust': '100%'
          }
        },
        children: [
          ...(opts.includeContainer ? [
            {
              type: 'Container',
              props: {
                style: {
                  maxWidth: `${opts.containerWidth}px`,
                  margin: '0 auto',
                  backgroundColor: documentStyle.backgroundColor || opts.backgroundColor
                }
              },
              children: convertRows(document.rows, opts)
            }
          ] : convertRows(document.rows, opts))
        ]
      }
    ]
  };
  
  return emailComponent;
}

/**
 * Convert rows to Vue Email components
 */
function convertRows(rows: Row[], options: Required<VuemailExportOptions>): VuemailComponent[] {
  return rows.map(row => convertRow(row, options));
}

/**
 * Convert a single row to Vue Email component
 */
function convertRow(row: Row, options: Required<VuemailExportOptions>): VuemailComponent {
  const rowStyle = row.style || {};
  
  return {
    type: 'Section',
    props: {
      style: {
        width: '100%',
        backgroundColor: rowStyle.backgroundColor === 'transparent' ? 'rgba(0,0,0,0)' : (rowStyle.backgroundColor || 'rgba(0,0,0,0)'),
        padding: rowStyle.padding || '20px 0',
        margin: rowStyle.margin || '0',
        border: rowStyle.border || 'none',
        borderRadius: rowStyle.borderRadius || '0',
        ...getOutlookStyles(options.outlookCompatibility)
      }
    },
    children: [
      {
        type: 'Row',
        props: {
          style: {
            width: '100%'
          }
        },
        children: convertColumns(row.columns, options)
      }
    ]
  };
}

/**
 * Convert columns to Vue Email components
 */
function convertColumns(columns: Column[], options: Required<VuemailExportOptions>): VuemailComponent[] {
  return columns.map(column => convertColumn(column, options));
}

/**
 * Convert a single column to Vue Email component
 */
function convertColumn(column: Column, options: Required<VuemailExportOptions>): VuemailComponent {
  const columnStyle = column.style || {};
  const width = column.width || '100%';
  
  return {
    type: 'Column',
    props: {
      style: {
        width: width,
        backgroundColor: columnStyle.backgroundColor === 'transparent' ? 'rgba(0,0,0,0)' : (columnStyle.backgroundColor || 'rgba(0,0,0,0)'),
        padding: columnStyle.padding || '10px',
        margin: columnStyle.margin || '0',
        border: columnStyle.border || 'none',
        borderRadius: columnStyle.borderRadius || '0',
        verticalAlign: 'top',
        ...getOutlookStyles(options.outlookCompatibility)
      }
    },
    children: convertBlocks(column.blocks, options)
  };
}

/**
 * Convert blocks to Vue Email components
 */
function convertBlocks(blocks: Block[], options: Required<VuemailExportOptions>): VuemailComponent[] {
  return blocks.map(block => convertBlock(block, options));
}

/**
 * Convert a single block to Vue Email component
 */
function convertBlock(block: Block, options: Required<VuemailExportOptions>): VuemailComponent {
  switch (block.type) {
    case 'text':
      return convertTextBlock(block as TextBlock, options);
    case 'image':
      return convertImageBlock(block as ImageBlock, options);
    case 'button':
      return convertButtonBlock(block as ButtonBlock, options);
    case 'divider':
      return convertDividerBlock(block as DividerBlock, options);
    default:
      return {
        type: 'Text',
        children: ['Unsupported block type']
      };
  }
}

/**
 * Convert text block to Vue Email component
 */
function convertTextBlock(block: TextBlock, options: Required<VuemailExportOptions>): VuemailComponent {
  const blockStyle = block.style || {};
  
  return {
    type: 'Text',
    props: {
      style: {
        fontSize: blockStyle.fontSize || options.fontSize,
        fontFamily: blockStyle.fontFamily || options.fontFamily,
        fontWeight: blockStyle.fontWeight || 'normal',
        lineHeight: blockStyle.lineHeight || options.lineHeight,
        color: blockStyle.color || options.textColor,
        textAlign: blockStyle.textAlign || 'left',
        margin: blockStyle.margin || '0 0 16px 0',
        padding: blockStyle.padding || '0',
        textDecoration: blockStyle.textDecoration || 'none',
        letterSpacing: blockStyle.letterSpacing || 'normal',
        ...getOutlookStyles(options.outlookCompatibility)
      }
    },
    children: [sanitizeHtml(block.html || block.plaintext || '')]
  };
}

/**
 * Convert image block to Vue Email component
 */
function convertImageBlock(block: ImageBlock, options: Required<VuemailExportOptions>): VuemailComponent {
  const blockStyle = block.style || {};
  const imageComponent: VuemailComponent = {
    type: 'Img',
    props: {
      src: block.src || '',
      alt: block.alt || '',
      style: {
        width: blockStyle.width || 'auto',
        height: blockStyle.height || 'auto',
        maxWidth: '100%',
        display: 'block',
        margin: blockStyle.margin || '0 auto 16px auto',
        padding: blockStyle.padding || '0',
        border: blockStyle.border || 'none',
        borderRadius: blockStyle.borderRadius || '0',
        objectFit: blockStyle.objectFit || 'cover',
        ...getOutlookStyles(options.outlookCompatibility)
      }
    }
  };
  
  // Wrap in link if href is provided
  if (block.href) {
    return {
      type: 'Link',
      props: {
        href: block.href,
        target: '_blank',
        style: {
          textDecoration: 'none',
          display: 'block'
        }
      },
      children: [imageComponent]
    };
  }
  
  return imageComponent;
}

/**
 * Convert button block to Vue Email component
 */
function convertButtonBlock(block: ButtonBlock, options: Required<VuemailExportOptions>): VuemailComponent {
  const blockStyle = block.style || {};
  
  return {
    type: 'Button',
    props: {
      href: block.href || '#',
      target: block.target || '_blank',
      style: {
        backgroundColor: blockStyle.backgroundColor || '#3b82f6',
        color: blockStyle.color || '#ffffff',
        fontSize: blockStyle.fontSize || options.fontSize,
        fontFamily: blockStyle.fontFamily || options.fontFamily,
        fontWeight: blockStyle.fontWeight || '600',
        textDecoration: 'none',
        textAlign: 'center',
        display: 'inline-block',
        padding: blockStyle.padding || '12px 24px',
        margin: blockStyle.margin || '0 0 16px 0',
        border: blockStyle.border || 'none',
        borderRadius: blockStyle.borderRadius || '4px',
        cursor: 'pointer',
        lineHeight: '1',
        '-webkit-text-size-adjust': '100%',
        ...getOutlookStyles(options.outlookCompatibility)
      }
    },
    children: [block.label || 'Click here']
  };
}

/**
 * Convert divider block to Vue Email component
 */
function convertDividerBlock(block: DividerBlock, options: Required<VuemailExportOptions>): VuemailComponent {
  const blockStyle = block.style || {};
  
  return {
    type: 'Hr',
    props: {
      style: {
        width: blockStyle.width || '100%',
        height: '0',
        border: 'none',
        borderTop: `${blockStyle.borderTopWidth || '1px'} ${blockStyle.borderTopStyle || 'solid'} ${blockStyle.borderTopColor || '#e5e7eb'}`,
        margin: blockStyle.margin || '20px 0',
        padding: '0',
        ...getOutlookStyles(options.outlookCompatibility)
      }
    }
  };
}

/**
 * Get Outlook-specific styles
 */
function getOutlookStyles(outlookCompatibility: boolean): Record<string, string> {
  if (!outlookCompatibility) return {};
  
  return {
    'mso-line-height-rule': 'exactly',
    'mso-text-raise': '0'
  };
}

/**
 * Sanitize HTML content
 */
function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '')
    .trim();
}

/**
 * Convert Vue Email component to JSON string
 */
export function vuemailToJson(
  component: VuemailComponent,
  pretty: boolean = true
): string {
  return JSON.stringify(component, null, pretty ? 2 : 0);
}

/**
 * Convert Vue Email component to Vue template string
 */
export function vuemailToTemplate(component: VuemailComponent): string {
  return componentToTemplate(component, 0);
}

/**
 * Recursively convert component to template string
 */
function componentToTemplate(component: VuemailComponent, depth: number = 0): string {
  const indent = Array(depth + 1).join('  ');
  const tagName = component.type;
  
  // Handle self-closing tags
  const selfClosingTags = ['Meta', 'Img', 'Hr', 'Link'];
  const isSelfClosing = selfClosingTags.indexOf(tagName) !== -1 && !component.children?.length;
  
  // Build props string
  let propsString = '';
  if (component.props) {
    const propKeys = Object.keys(component.props);
    const propEntries = propKeys.map(key => [key, component.props![key]]);
    if (propEntries.length > 0) {
      propsString = propEntries
        .map(([key, value]) => {
          if (typeof value === 'object') {
            return `:${key}="${JSON.stringify(value).replace(/"/g, "'")}"`;
          }
          return `${key}="${String(value).replace(/"/g, '&quot;')}"`;
        })
        .join(' ');
      propsString = ' ' + propsString;
    }
  }
  
  // Handle self-closing tags
  if (isSelfClosing) {
    return `${indent}<${tagName}${propsString} />`;
  }
  
  // Handle tags with children
  let childrenString = '';
  if (component.children && component.children.length > 0) {
    const childStrings = component.children.map(child => {
      if (typeof child === 'string') {
        return child.indexOf('\n') !== -1 
          ? child.split('\n').map(line => `${indent}  ${line.trim()}`).join('\n')
          : `${indent}  ${child}`;
      }
      return componentToTemplate(child, depth + 1);
    });
    childrenString = '\n' + childStrings.join('\n') + '\n' + indent;
  }
  
  return `${indent}<${tagName}${propsString}>${childrenString}</${tagName}>`;
}

/**
 * Export email document as Vue Email template file
 */
export function exportAsVueEmailTemplate(
  document: EmailDocument,
  options: Partial<VuemailExportOptions> = {}
): string {
  const component = toVuemail(document, options);
  const template = vuemailToTemplate(component);
  
  return `<template>
${template}
</template>

<script setup lang="ts">
// Vue Email template generated from Vue Mail Designer
// Document: ${(document.meta as { title?: string })?.title || 'Untitled'}
// Generated: ${new Date().toISOString()}
</script>`;
}