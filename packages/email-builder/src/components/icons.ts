const svg = (inner: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`

export const ICONS: Record<string, string> = {
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
  tabContent: svg('<rect x="4" y="4" width="7" height="7" rx="1.5"/><circle cx="16.5" cy="7.5" r="3.5"/><path d="m5 20 3-5 3 5zM14 15h6v5h-6z"/>'),
  tabBlocks: svg('<rect x="4" y="5" width="16" height="5" rx="1"/><rect x="4" y="14" width="7" height="5" rx="1"/><rect x="13" y="14" width="7" height="5" rx="1"/>'),
  tabBody: svg('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16M9 9v11"/>'),
  tabImages: svg('<rect x="3" y="6" width="14" height="11" rx="2"/><path d="m5 15 3-3 2 2 3-3 2 2"/><path d="M19 8h2v11H8v-2"/>'),
}
