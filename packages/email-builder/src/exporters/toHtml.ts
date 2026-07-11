/**
 * HTML Export Utility
 * Converts email document to HTML format optimized for email clients
 */

import type { EmailDocument, Row, Column, Block, TextBlock, ImageBlock, ButtonBlock, DividerBlock } from '../schema/document';

/**
 * HTML export options
 */
export interface HtmlExportOptions {
  includeDoctype?: boolean;
  includeHtmlWrapper?: boolean;
  includeMetaTags?: boolean;
  inlineStyles?: boolean;
  minifyOutput?: boolean;
  containerWidth?: number;
  backgroundColor?: string;
  fontFamily?: string;
  fontSize?: string;
  lineHeight?: string;
  textColor?: string;
  linkColor?: string;
  outlookCompatibility?: boolean;
  darkModeSupport?: boolean;
  gmailCompatibility?: boolean;
  appleSupportDarkMode?: boolean;
}

/**
 * Default export options
 */
const defaultOptions: Required<HtmlExportOptions> = {
  includeDoctype: true,
  includeHtmlWrapper: true,
  includeMetaTags: true,
  inlineStyles: true,
  minifyOutput: false,
  containerWidth: 600,
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '16px',
  lineHeight: '1.5',
  textColor: '#000000',
  linkColor: '#3b82f6',
  outlookCompatibility: true,
  darkModeSupport: false,
  gmailCompatibility: true,
  appleSupportDarkMode: false
};

/**
 * Convert email document to HTML
 */
export function toHtml(
  document: EmailDocument,
  options: Partial<HtmlExportOptions> = {}
): string {
  const opts = { ...defaultOptions, ...options };
  const meta = document.meta || {};
  const documentStyle = (document as { style?: Record<string, unknown> }).style || {};
  
  let html = '';
  
  // DOCTYPE
  if (opts.includeDoctype) {
    html += '<!DOCTYPE html>\n';
  }
  
  if (opts.includeHtmlWrapper) {
    // HTML opening tag
    html += `<html lang="${(meta as { language?: string }).language || 'en'}" dir="${(meta as { direction?: string }).direction || 'ltr'}">\n`;
    
    // Head section
    html += '<head>\n';
    
    if (opts.includeMetaTags) {
      html += '  <meta charset="utf-8">\n';
      html += '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
      html += '  <meta http-equiv="X-UA-Compatible" content="IE=edge">\n';
      html += '  <meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no">\n';
      html += '  <meta name="x-apple-disable-message-reformatting">\n';
      
      if ((meta as { title?: string }).title) {
        html += `  <title>${escapeHtml((meta as { title?: string }).title)}</title>\n`;
      }
      
      if ((meta as { subject?: string }).subject) {
        html += `  <meta name="subject" content="${escapeHtml((meta as { subject?: string }).subject)}">\n`;
      }
      
      if ((meta as { preheader?: string }).preheader) {
        html += `  <meta name="description" content="${escapeHtml((meta as { preheader?: string }).preheader)}">\n`;
      }
    }
    
    // Styles
    if (!opts.inlineStyles) {
      html += '  <style type="text/css">\n';
      html += generateCssStyles(opts);
      html += '  </style>\n';
    }
    
    html += '</head>\n';
    
    // Body opening
    const bodyStyle = opts.inlineStyles ? {
      margin: '0',
      padding: '0',
      backgroundColor: documentStyle.backgroundColor || opts.backgroundColor,
      fontFamily: opts.fontFamily,
      fontSize: opts.fontSize,
      lineHeight: opts.lineHeight,
      color: opts.textColor,
      '-webkit-text-size-adjust': '100%',
      '-ms-text-size-adjust': '100%'
    } : {};
    
    html += `<body${opts.inlineStyles ? ` style="${styleObjectToString(bodyStyle)}"` : ' class="email-body"'}>\n`;
    
    // Preheader (hidden text for email preview)
    if ((meta as { preheader?: string }).preheader) {
      html += `  <div style="display: none; max-height: 0; overflow: hidden;">${escapeHtml((meta as { preheader?: string }).preheader)}</div>\n`;
    }
  }
  
  // Main email content
  html += generateEmailContent(document, opts);
  
  if (opts.includeHtmlWrapper) {
    html += '</body>\n';
    html += '</html>';
  }
  
  // Minify if requested
  if (opts.minifyOutput) {
    html = minifyHtml(html);
  }
  
  return html;
}

/**
 * Generate email content HTML
 */
function generateEmailContent(document: EmailDocument, options: Required<HtmlExportOptions>): string {
  const documentStyle = (document as { style?: Record<string, unknown> }).style || {};
  
  // Main container
  const containerStyle = options.inlineStyles ? {
    width: '100%',
    maxWidth: `${options.containerWidth}px`,
    margin: '0 auto',
    backgroundColor: documentStyle.backgroundColor || options.backgroundColor
  } : {};
  
  let html = `  <div${options.inlineStyles ? ` style="${styleObjectToString(containerStyle)}"` : ' class="email-container"'}>\n`;
  
  // Outlook wrapper for better compatibility
  if (options.outlookCompatibility) {
    html += `    <!--[if mso | IE]>\n`;
    html += `    <table align="center" border="0" cellpadding="0" cellspacing="0" style="width:${options.containerWidth}px;" width="${options.containerWidth}">\n`;
    html += `      <tr>\n`;
    html += `        <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">\n`;
    html += `    <![endif]-->\n`;
  }
  
  // Generate rows
  html += generateRows(document.rows, options);
  
  // Close Outlook wrapper
  if (options.outlookCompatibility) {
    html += `    <!--[if mso | IE]>\n`;
    html += `        </td>\n`;
    html += `      </tr>\n`;
    html += `    </table>\n`;
    html += `    <![endif]-->\n`;
  }
  
  html += '  </div>\n';
  
  return html;
}

/**
 * Generate rows HTML
 */
function generateRows(rows: Row[], options: Required<HtmlExportOptions>): string {
  return rows.map(row => generateRow(row, options)).join('');
}

/**
 * Generate single row HTML
 */
function generateRow(row: Row, options: Required<HtmlExportOptions>): string {
  const rowStyle = row.style || {};
  
  // Row container styles
  const containerStyle = options.inlineStyles ? {
    width: '100%',
    backgroundColor: rowStyle.backgroundColor === 'transparent' ? 'rgba(0,0,0,0)' : (rowStyle.backgroundColor || 'rgba(0,0,0,0)'),
    padding: rowStyle.padding || '20px 0',
    margin: rowStyle.margin || '0',
    border: rowStyle.border || 'none',
    borderRadius: rowStyle.borderRadius || '0'
  } : {};
  
  let html = `    <div${options.inlineStyles ? ` style="${styleObjectToString(containerStyle)}"` : ' class="email-row"'}>\n`;
  
  // Outlook table wrapper
  if (options.outlookCompatibility) {
    html += `      <!--[if mso | IE]>\n`;
    html += `      <table align="center" border="0" cellpadding="0" cellspacing="0" style="width:100%;">\n`;
    html += `        <tr>\n`;
  }
  
  // Generate columns
  html += generateColumns(row.columns, options);
  
  // Close Outlook table wrapper
  if (options.outlookCompatibility) {
    html += `        </tr>\n`;
    html += `      </table>\n`;
    html += `      <![endif]-->\n`;
  }
  
  html += '    </div>\n';
  
  return html;
}

/**
 * Generate columns HTML
 */
function generateColumns(columns: Column[], options: Required<HtmlExportOptions>): string {
  return columns.map(column => generateColumn(column, options)).join('');
}

/**
 * Generate single column HTML
 */
function generateColumn(column: Column, options: Required<HtmlExportOptions>): string {
  const columnStyle = column.style || {};
  const width = column.width || '100%';
  
  // Column styles
  const containerStyle = options.inlineStyles ? {
    display: 'inline-block',
    width: width,
    maxWidth: width,
    verticalAlign: 'top',
    backgroundColor: columnStyle.backgroundColor === 'transparent' ? 'rgba(0,0,0,0)' : (columnStyle.backgroundColor || 'rgba(0,0,0,0)'),
    padding: columnStyle.padding || '10px',
    margin: columnStyle.margin || '0',
    border: columnStyle.border || 'none',
    borderRadius: columnStyle.borderRadius || '0',
    boxSizing: 'border-box'
  } : {};
  
  let html = '';
  
  // Outlook table cell
  if (options.outlookCompatibility) {
    const outlookWidth = typeof width === 'string' && width.indexOf('%') !== -1
      ? Math.round((parseFloat(width) / 100) * options.containerWidth)
      : typeof width === 'number' ? width : parseFloat(width as string);
    
    html += `          <!--[if mso | IE]>\n`;
    html += `          <td style="vertical-align:top;width:${outlookWidth}px;">\n`;
    html += `          <![endif]-->\n`;
  }
  
  html += `      <div${options.inlineStyles ? ` style="${styleObjectToString(containerStyle)}"` : ' class="email-column"'}>\n`;
  
  // Generate blocks
  html += generateBlocks(column.blocks, options);
  
  html += '      </div>\n';
  
  // Close Outlook table cell
  if (options.outlookCompatibility) {
    html += `          <!--[if mso | IE]>\n`;
    html += `          </td>\n`;
    html += `          <![endif]-->\n`;
  }
  
  return html;
}

/**
 * Generate blocks HTML
 */
function generateBlocks(blocks: Block[], options: Required<HtmlExportOptions>): string {
  return blocks.map(block => generateBlock(block, options)).join('');
}

/**
 * Generate single block HTML
 */
function generateBlock(block: Block, options: Required<HtmlExportOptions>): string {
  switch (block.type) {
    case 'text':
      return generateTextBlock(block as TextBlock, options);
    case 'image':
      return generateImageBlock(block as ImageBlock, options);
    case 'button':
      return generateButtonBlock(block as ButtonBlock, options);
    case 'divider':
      return generateDividerBlock(block as DividerBlock, options);
    default:
      return '        <div>Unsupported block type</div>\n';
  }
}

/**
 * Generate text block HTML
 */
function generateTextBlock(block: TextBlock, options: Required<HtmlExportOptions>): string {
  const blockStyle = block.style || {};
  
  const style = options.inlineStyles ? {
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
    wordBreak: 'break-word',
    '-webkit-text-size-adjust': '100%',
    '-ms-text-size-adjust': '100%'
  } : {};
  
  const content = sanitizeHtml(block.html || block.plaintext || '');
  
  return `        <div${options.inlineStyles ? ` style="${styleObjectToString(style)}"` : ' class="text-block"'}>${content}</div>\n`;
}

/**
 * Generate image block HTML
 */
function generateImageBlock(block: ImageBlock, options: Required<HtmlExportOptions>): string {
  const blockStyle = block.style || {};
  
  const style = options.inlineStyles ? {
    width: blockStyle.width || 'auto',
    height: blockStyle.height || 'auto',
    maxWidth: '100%',
    display: 'block',
    margin: blockStyle.margin || '0 auto 16px auto',
    padding: blockStyle.padding || '0',
    border: blockStyle.border || 'none',
    borderRadius: blockStyle.borderRadius || '0',
    objectFit: blockStyle.objectFit || 'cover',
    '-ms-interpolation-mode': 'bicubic'
  } : {};
  
  let html = `        <img src="${escapeHtml(block.src || '')}" alt="${escapeHtml(block.alt || '')}"${options.inlineStyles ? ` style="${styleObjectToString(style)}"` : ' class="image-block"'}>\n`;
  
  // Wrap in link if href is provided
  if (block.href) {
    const linkStyle = options.inlineStyles ? {
      textDecoration: 'none',
      display: 'block',
      color: options.linkColor
    } : {};
    
    html = `        <a href="${escapeHtml(block.href)}" target="_blank"${options.inlineStyles ? ` style="${styleObjectToString(linkStyle)}"` : ' class="image-link"'}>
${html}        </a>
`;
  }
  
  return html;
}

/**
 * Generate button block HTML
 */
function generateButtonBlock(block: ButtonBlock, options: Required<HtmlExportOptions>): string {
  const blockStyle = block.style || {};
  
  // Button container styles
  const containerStyle = options.inlineStyles ? {
    textAlign: blockStyle.textAlign || 'left',
    margin: blockStyle.margin || '0 0 16px 0'
  } : {};
  
  // Button styles
  const buttonStyle = options.inlineStyles ? {
    display: 'inline-block',
    backgroundColor: blockStyle.backgroundColor || '#3b82f6',
    color: blockStyle.color || '#ffffff',
    fontSize: blockStyle.fontSize || options.fontSize,
    fontFamily: blockStyle.fontFamily || options.fontFamily,
    fontWeight: blockStyle.fontWeight || '600',
    textDecoration: 'none',
    textAlign: 'center',
    padding: blockStyle.padding || '12px 24px',
    border: blockStyle.border || 'none',
    borderRadius: blockStyle.borderRadius || '4px',
    cursor: 'pointer',
    lineHeight: '1',
    '-webkit-text-size-adjust': '100%',
    'mso-padding-alt': '0px',
    'mso-text-raise': '0'
  } : {};
  
  let html = `        <div${options.inlineStyles ? ` style="${styleObjectToString(containerStyle)}"` : ' class="button-container"'}>\n`;
  
  // Outlook VML button for better compatibility
  if (options.outlookCompatibility) {
    html += `          <!--[if mso]>\n`;
    html += `          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(block.href || '#')}" style="height:40px;v-text-anchor:middle;width:200px;" arcsize="10%" stroke="f" fillcolor="${blockStyle.backgroundColor || '#3b82f6'}">\n`;
    html += `            <w:anchorlock/>\n`;
    html += `            <center style="color:${blockStyle.color || '#ffffff'};font-family:${options.fontFamily};font-size:${blockStyle.fontSize || options.fontSize};font-weight:${blockStyle.fontWeight || '600'};">\n`;
    html += `              ${escapeHtml(block.label || 'Click here')}\n`;
    html += `            </center>\n`;
    html += `          </v:roundrect>\n`;
    html += `          <![endif]-->\n`;
    html += `          <!--[if !mso]><!-->\n`;
  }
  
  html += `          <a href="${escapeHtml(block.href || '#')}" target="${block.target || '_blank'}"${options.inlineStyles ? ` style="${styleObjectToString(buttonStyle)}"` : ' class="button-block"'}>${escapeHtml(block.label || 'Click here')}</a>\n`;
  
  if (options.outlookCompatibility) {
    html += `          <!--<![endif]-->\n`;
  }
  
  html += '        </div>\n';
  
  return html;
}

/**
 * Generate divider block HTML
 */
function generateDividerBlock(block: DividerBlock, options: Required<HtmlExportOptions>): string {
  const blockStyle = block.style || {};
  
  const style = options.inlineStyles ? {
    width: blockStyle.width || '100%',
    height: '0',
    border: 'none',
    borderTop: `${blockStyle.borderTopWidth || '1px'} ${blockStyle.borderTopStyle || 'solid'} ${blockStyle.borderTopColor || '#e5e7eb'}`,
    margin: blockStyle.margin || '20px 0',
    padding: '0',
    fontSize: '0',
    lineHeight: '0'
  } : {};
  
  return `        <hr${options.inlineStyles ? ` style="${styleObjectToString(style)}"` : ' class="divider-block"'}>\n`;
}

/**
 * Generate CSS styles for non-inline mode
 */
function generateCssStyles(options: Required<HtmlExportOptions>): string {
  let css = `
    /* Email Reset */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    
    table, td {
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
    
    /* Base Styles */
    .email-body {
      margin: 0;
      padding: 0;
      background-color: ${options.backgroundColor};
      font-family: ${options.fontFamily};
      font-size: ${options.fontSize};
      line-height: ${options.lineHeight};
      color: ${options.textColor};
    }
    
    .email-container {
      width: 100%;
      max-width: ${options.containerWidth}px;
      margin: 0 auto;
    }
    
    .email-row {
      width: 100%;
    }
    
    .email-column {
      display: inline-block;
      vertical-align: top;
      box-sizing: border-box;
    }
    
    .text-block {
      word-break: break-word;
    }
    
    .image-block {
      max-width: 100%;
      display: block;
    }
    
    .button-block {
      display: inline-block;
      text-decoration: none;
      cursor: pointer;
    }
    
    .divider-block {
      border: none;
      font-size: 0;
      line-height: 0;
    }
  `;
  
  // Dark mode support
  if (options.darkModeSupport) {
    css += `
    @media (prefers-color-scheme: dark) {
      .email-body {
        background-color: #1f2937 !important;
        color: #f9fafb !important;
      }
      
      .text-block {
        color: #f9fafb !important;
      }
    }
    `;
  }
  
  // Mobile responsive
  css += `
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      
      .email-column {
        width: 100% !important;
        max-width: 100% !important;
        display: block !important;
      }
    }
  `;
  
  return css;
}

/**
 * Filter out undefined values from style object
 */
function filterStyleObject(style: Record<string, string | number | undefined>): Record<string, string | number> {
  const filtered: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(style)) {
    if (value !== undefined) {
      filtered[key] = value;
    }
  }
  return filtered;
}

/**
 * Convert style object to CSS string
 */
function styleObjectToString(style: Record<string, string | number | undefined>): string {
  const filteredStyle = filterStyleObject(style);
  const keys = Object.keys(filteredStyle);
  return keys
    .map(key => `${kebabCase(key)}: ${filteredStyle[key]}`)
    .join('; ');
}

/**
 * Convert camelCase to kebab-case
 */
function kebabCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Escape HTML characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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
 * Minify HTML output
 */
function minifyHtml(html: string): string {
  return html
    .replace(/\s+/g, ' ')
    .replace(/> </g, '><')
    .replace(/^\s+|\s+$/gm, '')
    .trim();
}

/**
 * Export email document as complete HTML file
 */
export function exportAsHtmlFile(
  document: EmailDocument,
  options: Partial<HtmlExportOptions> = {}
): string {
  return toHtml(document, {
    includeDoctype: true,
    includeHtmlWrapper: true,
    includeMetaTags: true,
    ...options
  });
}

/**
 * Export email document as HTML snippet (body content only)
 */
export function exportAsHtmlSnippet(
  document: EmailDocument,
  options: Partial<HtmlExportOptions> = {}
): string {
  return toHtml(document, {
    includeDoctype: false,
    includeHtmlWrapper: false,
    includeMetaTags: false,
    ...options
  });
}