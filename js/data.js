"use strict";
/* ---------------- static data & procedural textures ---------------- */

const SHOP = [[24,30],[25,25],[30,30],[30,40],[40,40],[40,50],[50,60],[50,70],[59.4,84.1],[60,60],[60,80],[70,100]];

/* standard artwork sizes (cm), portrait W×H — presets for the artwork sliders */
const ART_PRESETS = [
  ["A5", 14.8, 21],
  ["A4", 21, 29.7],
  ["A3", 29.7, 42],
  ["A2", 42, 59.4],
  ["A1", 59.4, 84.1],
];
const SHOP_LABEL = i => (SHOP[i][0]===59.4 ? "59.4 × 84.1 (DIN A1)" : `${SHOP[i][0]} × ${SHOP[i][1]}`);

/* standard passe-partouts sold pre-cut: [outerW, outerH, windowW, windowH] (cm).
   Outer sizes match the shop frames; edit to mirror your local shop's catalogue. */
const PP_SHOP = [
  [24,30, 13,18],
  [24,30, 15,20],
  [30,30, 20,20],
  [30,40, 20,30],
  [30,40, 21,29.7],
  [40,40, 30,30],
  [40,50, 30,40],
  [50,60, 40,50],
  [50,70, 30,45],
  [50,70, 40,60],
  [59.4,84.1, 42,59.4],
  [60,60, 40,40],
  [60,80, 40,60],
  [60,80, 50,70],
  [70,100, 50,70],
];

const FRAME_COLORS = [
  ["Natural Oak","#c89f6b"],["White Oak","#e9e3d5"],["Dark Oak","#5b4634"],["Black Oak","#2e2a26"],
  ["Black Alu","#1c1c1e"],["White","#f4f2ee"],["Gold","#c9a254"],["Silver","#c0c0c4"],
  ["Light Blue","#aec6d4"],["Purple","#b9a7d9"],["Burgundy","#6e2b3a"],["Red","#d64541"],
  ["Orange","#e8743b"],["Yellow","#e9b949"],["Light Green","#7fbf9e"],["Green","#2f6b4f"],
];
const PP_COLORS = [
  ["White","#fdfdfb"],["Cream","#f5eedc"],["Light Grey","#d9d9d6"],["Dark Grey","#5a5a58"],
  ["Black","#1f1f1f"],["Navy","#2e4763"],["Sage","#a8b8a0"],["Dusty Pink","#d8b4b0"],
];

/* frames whose colour names read as real timber get a procedural wood grain */
const WOOD_HEX = new Set(
  FRAME_COLORS.filter(([n])=>/oak|walnut|wood|pine|teak|maple|beech|mahogany/i.test(n))
              .map(([,h])=>h.toLowerCase())
);
/* Multi-layered procedural wood grain composited entirely within SVG filters
   (no CSS mix-blend-mode — reliable when used as a CSS background-image).
   Three noise layers blended together: coarse grain, fine striations, micro-texture. */
function woodNoise(horizontal){
  const grain  = horizontal ? "0.008 0.18"  : "0.18 0.008";   // main grain lines
  const striae = horizontal ? "0.025 0.55"  : "0.55 0.025";   // fine striations
  const micro  = horizontal ? "0.11 2.2"    : "2.2 0.11";     // micro-texture across grain
  // High-res 800×800 canvas so the texture stays crisp even when zoomed in
  const svg =
  `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800'>
    <filter id='w' x='0' y='0' width='100%' height='100%'>
      <!-- Coarse grain -->
      <feTurbulence type='fractalNoise' baseFrequency='${grain}' numOctaves='5' seed='7' stitchTiles='stitch' result='t1'/>
      <feColorMatrix in='t1' type='saturate' values='0' result='gray1'/>
      <feComponentTransfer in='gray1' result='grain'>
        <feFuncR type='linear' slope='0.55' intercept='0.22'/>
        <feFuncG type='linear' slope='0.55' intercept='0.22'/>
        <feFuncB type='linear' slope='0.55' intercept='0.22'/>
      </feComponentTransfer>
      <!-- Fine striations (dark lines between grain bands) -->
      <feTurbulence type='fractalNoise' baseFrequency='${striae}' numOctaves='4' seed='19' stitchTiles='stitch' result='t2'/>
      <feColorMatrix in='t2' type='saturate' values='0' result='gray2'/>
      <feComponentTransfer in='gray2' result='striae'>
        <feFuncR type='linear' slope='0.30' intercept='0.35'/>
        <feFuncG type='linear' slope='0.30' intercept='0.35'/>
        <feFuncB type='linear' slope='0.30' intercept='0.35'/>
      </feComponentTransfer>
      <!-- Micro-texture (surface roughness) -->
      <feTurbulence type='fractalNoise' baseFrequency='${micro}' numOctaves='3' seed='31' stitchTiles='stitch' result='t3'/>
      <feColorMatrix in='t3' type='saturate' values='0' result='gray3'/>
      <feComponentTransfer in='gray3' result='texture'>
        <feFuncR type='linear' slope='0.16' intercept='0.42'/>
        <feFuncG type='linear' slope='0.16' intercept='0.42'/>
        <feFuncB type='linear' slope='0.16' intercept='0.42'/>
      </feComponentTransfer>
      <!-- Composite: multiply striae over grain, then overlay texture -->
      <feBlend in='grain' in2='striae' mode='multiply' result='layered'/>
      <feBlend in='texture' in2='layered' mode='soft-light' result='wood'/>
      <!-- Subtle warm tint modulated by the grain -->
      <feColorMatrix in='grain' type='matrix' result='tint'
        values='0 0 0 0 0.96
                0 0 0 0 0.78
                0 0 0 0 0.52
                0 0 0 0.12 0'/>
      <feBlend in='wood' in2='tint' mode='screen'/>
    </filter>
    <rect width='800' height='800' filter='url(#w)'/>
  </svg>`;
  return "url(\"data:image/svg+xml;utf8," + encodeURIComponent(svg) + "\")";
}
const woodH = woodNoise(true);   // grain runs horizontally (top/bottom rails)
const woodV = woodNoise(false);  // grain runs vertically   (left/right stiles)

const PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent(
`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 800'>
  <rect width='600' height='800' fill='#e9e1d2'/>
  <circle cx='300' cy='240' r='95' fill='#2e4763'/>
  <path d='M110 660 L110 420 A190 190 0 0 1 490 420 L490 660 Z' fill='#c96f4a'/>
  <path d='M150 520 q75 -40 150 0 t150 0' stroke='#f0e7d6' stroke-width='7' fill='none'/>
  <path d='M150 580 q75 -40 150 0 t150 0' stroke='#f0e7d6' stroke-width='7' fill='none'/>
  <rect x='110' y='660' width='380' height='22' fill='#22222a'/>
</svg>`);
