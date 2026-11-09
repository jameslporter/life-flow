// Life flow icon artwork as SVG strings. Run render.js to export the PNGs.
const C = {
  bgTop: '#3A7F70',
  bgBottom: '#22524A',
  morning: '#F0B357',
  work: '#7DAEE6',
  evening: '#B9A6F0',
  check: '#FFFFFF',
};

// One checklist row: a circle on the left and a wave that flows to the right.
function row(y, color, checked, mono) {
  const fill = mono ? '#fff' : color;
  const cx = 300, r = 54;
  let x0 = 392, w = 372, amp = 20;
  const seg = w / 4;
  let d = `M${x0},${y}`;
  for (let i = 0; i < 4; i++) {
    const sx = x0 + seg * i;
    const dir = i % 2 === 0 ? -1 : 1;
    d += ` C${sx + seg * 0.36},${y + dir * amp} ${sx + seg * 0.64},${y + dir * amp} ${sx + seg},${y}`;
  }
  const wave = `<path d="${d}" fill="none" stroke="${fill}" stroke-width="40" stroke-linecap="round"/>`;
  if (!checked) {
    return `<circle cx="${cx}" cy="${y}" r="${r - 14}" fill="none" stroke="${fill}" stroke-width="26"/>${wave}`;
  }
  const check = `M${cx - 24},${y + 1} L${cx - 7},${y + 19} L${cx + 26},${y - 18}`;
  if (mono) {
    return `<mask id="m${y}"><rect width="1024" height="1024" fill="#fff"/><path d="${check}" fill="none" stroke="#000" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/></mask>
      <circle cx="${cx}" cy="${y}" r="${r}" fill="#fff" mask="url(#m${y})"/>${wave}`;
  }
  return `<circle cx="${cx}" cy="${y}" r="${r}" fill="${fill}"/>
    <path d="${check}" fill="none" stroke="${C.check}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>${wave}`;
}

// The glyph, centered on 512,512. scale grows or shrinks it for each use.
function glyph(scale = 1, mono = false) {
  const t = `translate(512 512) scale(${scale}) translate(-515 -512)`;
  return `<g transform="${t}">
    ${row(360, C.morning, true, mono)}
    ${row(512, C.work, true, mono)}
    ${row(664, C.evening, false, mono)}
  </g>`;
}

function background() {
  return `<defs><linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
    <stop offset="0" stop-color="${C.bgTop}"/><stop offset="1" stop-color="${C.bgBottom}"/>
  </linearGradient></defs><rect width="1024" height="1024" fill="url(#bg)"/>`;
}

const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${body}</svg>`;

module.exports = {
  C,
  glyph,
  // Full square icon (iOS, Play Store 512). Store masks the corners itself.
  icon: () => svg(background() + glyph(1.25)),
  // Android adaptive layers: glyph kept inside the 66% safe zone.
  foreground: () => svg(glyph(1.0)),
  background: () => svg(background()),
  monochrome: () => svg(glyph(1.0, true)),
  splash: () => svg(glyph(1.25)),
};
