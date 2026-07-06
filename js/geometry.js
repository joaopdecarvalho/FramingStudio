"use strict";
/* ---------------- frame-fit computation ---------------- */

function evalSize(w,h){
  const mx=(w-state.artW)/2, my=(h-state.artH)/2;
  if(mx<0||my<0) return null;
  const d=state.marginTarget;
  return { mx, my, score: Math.abs(mx-d)+Math.abs(my-d)+0.6*Math.abs(mx-my) };
}
function candidates(){
  const out=[];
  SHOP.forEach(([a,b],i)=>{
    const orients = a===b ? [[a,b,0]] : [[a,b,0],[b,a,1]];
    let best=null;
    for(const [w,h,rot] of orients){
      const e=evalSize(w,h);
      if(e && (!best || e.score<best.score)) best={i,w,h,rot,...e};
    }
    out.push(best || {i, w:a, h:b, rot:0, dead:true});
  });
  return out;
}
function resolveFrame(){
  const cands = candidates();
  const valid = cands.filter(c=>!c.dead).sort((x,y)=>x.score-y.score);
  const best = valid[0] || null;
  let sel = state.sel, cur = null;

  if(sel.type==="shop"){
    cur = cands.find(c=>c.i===sel.i);
    if(!cur || cur.dead) { sel={type:"auto"}; state.sel=sel; cur=null; }
    else if(sel.rot!==undefined && SHOP[sel.i][0]!==SHOP[sel.i][1]){
      const w=sel.rot? SHOP[sel.i][1]:SHOP[sel.i][0], h=sel.rot? SHOP[sel.i][0]:SHOP[sel.i][1];
      const e=evalSize(w,h);
      if(e) cur={i:sel.i,w,h,rot:sel.rot,...e};
    }
  }
  if(sel.type==="auto") cur = best;
  if(sel.type==="custom"){
    const e = evalSize(state.customW, state.customH);
    cur = { custom:true, w:state.customW, h:state.customH, ...(e||{dead:true, mx:(state.customW-state.artW)/2, my:(state.customH-state.artH)/2}) };
  }

  // a standard passe-partout only makes sense while the frame matches its
  // outer size — revert to custom cut when the frame changes underneath it
  if(state.pp.type==="shop"){
    const [ow,oh]=ppOriented(state.pp.i, state.pp.rot);
    if(!cur || cur.dead || Math.abs(ow-cur.w)>0.05 || Math.abs(oh-cur.h)>0.05)
      state.pp={type:"custom"};
  }
  return {cur, best, cands, valid};
}

/* ---------------- passe-partout geometry ---------------- */

const PP_MIN_WIN = 2;    // smallest sensible window (cm)
const PP_OVERLAP = 0.3;  // art tucked behind the window per side (cm)

function ppOriented(i, rot){
  const [a,b,wa,wb]=PP_SHOP[i];
  return rot ? [b,a,wb,wa] : [a,b,wa,wb];
}
/* best orientation of a standard passe-partout for the current artwork */
function ppFitInfo(i){
  const [a,b,wa,wb]=PP_SHOP[i];
  const orients = (a===b && wa===wb) ? [0] : [0,1];
  let best=null;
  for(const rot of orients){
    const [ow,oh,ww,wh]=ppOriented(i,rot);
    const fitsSheet = state.artW<=ow+0.05 && state.artH<=oh+0.05;   // art fits behind the sheet
    const covers    = state.artW>=ww-0.05 && state.artH>=wh-0.05;   // art fully covers the window
    const crop = Math.max(0,state.artW-ww) + Math.max(0,state.artH-wh);
    const c = {rot, ow, oh, ww, wh, ok:fitsSheet&&covers, fitsSheet, covers, crop};
    if(!best || (c.ok&&!best.ok) || (c.ok===best.ok && c.crop<best.crop)) best=c;
  }
  return best;
}
function shopIndexFor(w,h){
  return SHOP.findIndex(([a,b])=>(a===w&&b===h)||(a===h&&b===w));
}

/* window size + margins of the mat for the current frame & passe-partout.
   crop = how much of the artwork the mat overlaps; gap = window larger than art. */
function matGeom(cur){
  if(!cur) return null;
  if(state.pp.type==="shop"){
    const [ow,oh,ww,wh]=ppOriented(state.pp.i, state.pp.rot);
    const mx=(ow-ww)/2, my=(oh-wh)/2;
    return { mode:"shop", winW:ww, winH:wh, left:mx, right:mx, top:my, bottom:my,
             cropX:Math.max(0,state.artW-ww), cropY:Math.max(0,state.artH-wh),
             gapX:Math.max(0,ww-state.artW), gapY:Math.max(0,wh-state.artH) };
  }
  // custom cut: the window matches the artwork; asking for a margin wider than
  // the natural (frame−art)/2 shrinks the window so the mat overlaps the art
  const natX=Math.max(0,(cur.w-state.artW)/2), natY=Math.max(0,(cur.h-state.artH)/2);
  const d=state.marginTarget;
  const mx=clamp(d, natX, Math.max(natX,(cur.w-PP_MIN_WIN)/2));
  const my=clamp(d, natY, Math.max(natY,(cur.h-PP_MIN_WIN)/2));
  const winW=cur.w-2*mx, winH=cur.h-2*my;
  let top=my, bottom=my;
  if(state.optical && my>0){ top=2*my*0.45; bottom=2*my*0.55; }
  return { mode:"custom", winW, winH, left:mx, right:mx, top, bottom, natX, natY,
           cropX:Math.max(0,state.artW-winW), cropY:Math.max(0,state.artH-winH),
           gapX:0, gapY:0 };
}
