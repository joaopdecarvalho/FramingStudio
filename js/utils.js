"use strict";
/* ---------------- small shared helpers ---------------- */

const $ = id => document.getElementById(id);
const fmt = n => (Math.round(n*10)/10).toFixed(1).replace(/\.0$/,"");
const clamp = (v,a,b) => Math.min(b,Math.max(a,v));

/* mix a hex colour toward white (pct>0) or black (pct<0) */
function shade(hex,pct){
  const n=parseInt(hex.slice(1),16), t=pct>0?255:0, p=Math.abs(pct)/100;
  const r=(n>>16)&255, g=(n>>8)&255, b=n&255;
  const c=v=>Math.round(v+(t-v)*p);
  return `rgb(${c(r)},${c(g)},${c(b)})`;
}
