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
/* fractalNoise stretched along one axis reads as long timber grain; blended
   (soft-light) over the frame colour so it works for any oak shade */
function woodNoise(horizontal){
  const bf = horizontal ? "0.011 0.13" : "0.13 0.011";
  const svg =
  `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'>
    <filter id='w'>
      <feTurbulence type='fractalNoise' baseFrequency='${bf}' numOctaves='4' seed='11' stitchTiles='stitch'/>
      <feColorMatrix type='saturate' values='0'/>
      <feComponentTransfer>
        <feFuncR type='linear' slope='0.7' intercept='0.15'/>
        <feFuncG type='linear' slope='0.7' intercept='0.15'/>
        <feFuncB type='linear' slope='0.7' intercept='0.15'/>
        <feFuncA type='linear' slope='0' intercept='1'/>
      </feComponentTransfer>
    </filter>
    <rect width='300' height='300' filter='url(#w)'/>
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
