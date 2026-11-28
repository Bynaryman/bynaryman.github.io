const paths = {
  link: '<path d="m10 14 4-4m-6 2-2 2a3.5 3.5 0 0 0 5 5l3-3m-4-8 3-3a3.5 3.5 0 0 1 5 5l-2 2"/>',
  dice: '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01" stroke-width="3.3"/>',
  theme: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none"/>',
  loupe: '<circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6" stroke-width="2.5"/>',
  folder: '<path d="M3 8V5.5A1.5 1.5 0 0 1 4.5 4H10l2 3h7a2 2 0 0 1 2 2v2M3 9h17.5l-2 10H5Z"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4"/>',
  cube: '<path d="m12 3 9 5v9l-9 5-9-5V8zm-9 5 9 5 9-5m-9 5v9"/>',
  viewport: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><path d="m12 7 5 3v5l-5 3-5-3v-5z"/>',
  swatches: '<rect x="3" y="5" width="13" height="15" rx="2"/><path d="M8 5V3h11a2 2 0 0 1 2 2v12h-3M6 15h7"/>',
  sliders:
    '<path d="M3 6h8m4 0h6M3 12h2m4 0h12M3 18h10m4 0h4"/><circle cx="13" cy="6" r="2"/><circle cx="7" cy="12" r="2"/><circle cx="15" cy="18" r="2"/>',
  orbit: '<circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="11" ry="5.5" transform="rotate(-33 12 12)"/>',
  hand: '<path d="M7 12V6a1.5 1.5 0 0 1 3 0v5-7a1.5 1.5 0 0 1 3 0v7-6a1.5 1.5 0 0 1 3 0v6-4a1.5 1.5 0 0 1 3 0v7c0 5-3 8-7 8-3 0-5-2-7-5l-3-5a1.5 1.5 0 0 1 2.5-1.5L7 13Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  fit: '<path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5"/><circle cx="12" cy="12" r="2"/>',
  grid: '<path d="m3 12 9-8 9 8-9 8zm3-3 9 8m-6-11 9 8m-12 1 9-8m-6 11 9-8"/>',
  rays: '<path d="m3 20 8-8 3 2 7-11m-9 2 1-3m4 7 4-1M5 16l-2 1"/><circle cx="11" cy="12" r="2"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
  off: '<path d="m3 3 18 18M9 5.5q6-2.5 13 6.5-1 2-3 4M6 7Q3 9 2 12q8 11 15 5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  reset: '<path d="M4 4v6h6M4.5 10a8 8 0 1 1 0 5"/>',
};
export function icon(name) {
  return (
    '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">' +
    (paths[name] || "") +
    "</svg>"
  );
}
document.querySelectorAll("[data-icon]").forEach((el) => {
  el.innerHTML = icon(el.dataset.icon);
});
