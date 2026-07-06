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
  return {cur, best, cands, valid};
}
function margins(cur){
  if(!cur) return null;
  const mx=Math.max(0,(cur.w-state.artW)/2), tv=Math.max(0,cur.h-state.artH);
  let top=tv/2, bottom=tv/2;
  if(state.optical && tv>0){ top=tv*0.45; bottom=tv*0.55; }
  return {left:mx,right:mx,top,bottom};
}
