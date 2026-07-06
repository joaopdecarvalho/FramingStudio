"use strict";
/* ---------------- app state & persistence ---------------- */

let state = {
  artW:30, artH:40, lockRatio:false, marginTarget:5, optical:false, moulding:2, depth:2.5,
  ppColor:"#fdfdfb", frameColor:"#c89f6b",
  sel:{type:"auto"},                 // {type:'auto'} | {type:'shop',i,rot} | {type:'custom'}
  customW:40, customH:50,
};
let rot = {x:0, y:0};                // 3D view angle (deg), not persisted
let zoom = 0.85;                     // 3D view zoom, not persisted
let imgData = null;                  // data URI of uploaded artwork
let imgRatio = 800/600;              // h/w of uploaded image

try{ Object.assign(state, JSON.parse(localStorage.getItem("fs-settings")||"{}")); }catch(e){}
try{ const s=localStorage.getItem("fs-image"); if(s){ imgData=s; } }catch(e){}

function save(){
  localStorage.setItem("fs-settings", JSON.stringify(state));
}

// keep older saved settings within the slider ranges
(function clampState(){
  const B={artW:[5,120],artH:[5,120],marginTarget:[0,20],moulding:[0.5,8],depth:[0.5,8],customW:[10,200],customH:[10,200]};
  for(const k in B) state[k]=Math.min(B[k][1],Math.max(B[k][0],state[k]));
})();
