// Set de íconos propio (clean-room). Todos comparten el mismo lenguaje visual:
// trazo de 1.7, esquinas redondeadas, viewBox 24. Se colorean con `currentColor`.

const svg = (inner: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`

export const ICONS: Record<string, string> = {
  // --- bloques ---
  heading: svg('<path d="M6 4v16M18 4v16M6 12h12"/>'),
  text: svg('<path d="M4 6h16M4 10h16M4 14h10"/>'),
  image: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m5 17 4-4 3 3 4-4 3 3"/>'),
  button: svg('<rect x="3" y="8" width="18" height="8" rx="4"/><path d="M8 12h8"/>'),
  divider: svg('<path d="M4 12h16M8 6h8M8 18h8"/>'),
  spacer: svg('<path d="M12 4v4m0 8v4M8 8l4-4 4 4M8 16l4 4 4-4"/>'),
  social: svg('<circle cx="6" cy="12" r="2.5"/><circle cx="17" cy="6" r="2.5"/><circle cx="17" cy="18" r="2.5"/><path d="m8.2 10.8 6.6-3.6M8.2 13.2l6.6 3.6"/>'),
  menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  html: svg('<path d="m9 8-4 4 4 4M15 8l4 4-4 4"/>'),
  video: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/>'),
  table: svg('<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 10h18M3 16h18M9 4v16M15 4v16"/>'),
  gallery: svg('<rect x="3" y="3" width="8" height="8" rx="1.2"/><rect x="13" y="3" width="8" height="8" rx="1.2"/><rect x="3" y="13" width="8" height="8" rx="1.2"/><rect x="13" y="13" width="8" height="8" rx="1.2"/>'),
  timer: svg('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>'),
  custom: svg('<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z"/>'),

  // --- tabs del riel ---
  tabContent: svg('<rect x="4" y="4" width="7" height="7" rx="1.5"/><circle cx="16.5" cy="7.5" r="3.5"/><path d="m5 20 3-5 3 5zM14 15h6v5h-6z"/>'),
  tabBlocks: svg('<rect x="4" y="5" width="16" height="5" rx="1"/><rect x="4" y="14" width="7" height="5" rx="1"/><rect x="13" y="14" width="7" height="5" rx="1"/>'),
  tabBody: svg('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16M9 9v11"/>'),
  tabImages: svg('<rect x="3" y="6" width="14" height="11" rx="2"/><path d="m5 15 3-3 2 2 3-3 2 2"/><path d="M19 8h2v11H8v-2"/>'),
  tabMedia: svg('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>'),

  // --- acciones ---
  undo: svg('<path d="M9 7 4 12l5 5M4 12h11a5 5 0 0 1 0 10h-3"/>'),
  redo: svg('<path d="m15 7 5 5-5 5M20 12H9a5 5 0 0 0 0 10h3"/>'),
  desktop: svg('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'),
  tablet: svg('<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M11 18h2"/>'),
  mobile: svg('<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>'),
  preview: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  move: svg('<path d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/>'),
  settings: svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>'),
  duplicate: svg('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'),
  trash: svg('<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M10 11v6M14 11v6"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>'),
  moon: svg('<path d="M20 14a8 8 0 1 1-9.5-9.8A6 6 0 0 0 20 14z"/>'),
  chevronDown: svg('<path d="m6 9 6 6 6-6"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  check: svg('<path d="M5 13l4 4L19 7"/>'),
  upload: svg('<path d="M12 16V4M7 9l5-5 5 5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>'),
  play: svg('<circle cx="12" cy="12" r="9"/><path d="m10 9 5 3-5 3z" fill="currentColor" stroke="none"/>'),

  // --- editor de texto ---
  bold: svg('<path d="M7 5h6.5a3.5 3.5 0 0 1 0 7H7zM7 12h7.5a3.5 3.5 0 0 1 0 7H7z"/>'),
  italic: svg('<path d="M15 5h-4M13 19H9M14 5l-4 14"/>'),
  underline: svg('<path d="M7 5v6a5 5 0 0 0 10 0V5M5 21h14"/>'),
  strike: svg('<path d="M5 12h14M8 8a4 4 0 0 1 8 0M8 16a4 4 0 0 0 8 0"/>'),
  listBullet: svg('<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>'),
  listOrdered: svg('<path d="M10 6h10M10 12h10M10 18h10M4 5v4M4 5H3M4 9H3M3 15h2l-2 3h2"/>'),
  alignLeft: svg('<path d="M4 6h16M4 12h10M4 18h13"/>'),
  alignCenter: svg('<path d="M4 6h16M7 12h10M6 18h12"/>'),
  alignRight: svg('<path d="M4 6h16M10 12h10M7 18h13"/>'),
  link: svg('<path d="M9 15l6-6M10.5 6.5 12 5a4 4 0 0 1 6 6l-1.5 1.5M13.5 17.5 12 19a4 4 0 0 1-6-6l1.5-1.5"/>'),
  unlink: svg('<path d="M9.5 14.5 8 16a4 4 0 0 1-6-6l1.5-1.5M14.5 9.5 16 8a4 4 0 0 1 6 6l-1.5 1.5M4 4l16 16"/>'),
  textColor: svg('<path d="M6 17 12 4l6 13M8.5 13h7"/><rect x="5" y="20" width="14" height="1.5" rx="0.75" fill="currentColor" stroke="none"/>'),
  highlight: svg('<path d="M13 4 20 11l-8 8-4 1-2-2 1-4z"/><path d="M4 21h6"/>'),
  clearFormat: svg('<path d="M8 6h12M9 6l-2 12M13 6l-1 6M4 20l6-6"/>'),
  variable: svg('<path d="M8 4C5 8 5 16 8 20M16 4c3 4 3 12 0 16M9.5 9l5 6M14.5 9l-5 6"/>'),
}
