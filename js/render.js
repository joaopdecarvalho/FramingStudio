"use strict";
/* ---------------- rendering: preview + panel ---------------- */

/* ---- 3D preview ---- */
function applyRot(){
  $("frameBox").style.transform = `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`;
}
function renderPreview(){
  const {cur} = resolveFrame();
  const scene=$("scene"), front=$("frameFront"), mat=$("mat"), hole=$("artHole"), stage=$("stage");
  $("artImg").src = imgData || PLACEHOLDER;

  if(!cur){ scene.style.display="none"; $("dims").textContent="No shop frame fits this artwork."; return; }
  scene.style.display="block";

  const m = margins(cur);
  const outerW = cur.w + 2*state.moulding, outerH = cur.h + 2*state.moulding;
  const r = stage.getBoundingClientRect();
  const s = Math.min((r.width-140)/outerW, (r.height-210)/outerH) * zoom;
  const dpx = state.depth*s;
  const fc = state.frameColor;

  scene.style.width  = outerW*s+"px";
  scene.style.height = outerH*s+"px";
  applyRot();

  front.style.borderWidth = state.moulding*s+"px";
  front.style.borderTopColor    = shade(fc, 14);
  front.style.borderLeftColor   = shade(fc, 5);
  front.style.borderRightColor  = shade(fc, -8);
  front.style.borderBottomColor = shade(fc, -16);

  // extruded side faces (extend backward from the front plane)
  const face=(id,css)=>Object.assign($(id).style,css);
  face("fLeft",  {left:"0", top:"0", width:dpx+"px", height:"100%",
    transformOrigin:"left center", transform:"rotateY(90deg)", backgroundColor:shade(fc,-12)});
  face("fRight", {left:"100%", top:"0", width:dpx+"px", height:"100%",
    transformOrigin:"left center", transform:"rotateY(90deg)", backgroundColor:shade(fc,-25)});
  face("fTop",   {left:"0", top:"0", width:"100%", height:dpx+"px",
    transformOrigin:"center top", transform:"rotateX(-90deg)", backgroundColor:shade(fc,10)});
  face("fBottom",{left:"0", top:"100%", width:"100%", height:dpx+"px",
    transformOrigin:"center top", transform:"rotateX(-90deg)", backgroundColor:shade(fc,-35)});

  // ---- wood grain on timber frames -----------------------------------
  const isWood = WOOD_HEX.has(fc.toLowerCase());
  const mw = state.moulding*s;                        // moulding width in px
  const faceGrain = {fLeft:woodV, fRight:woodV, fTop:woodH, fBottom:woodH};
  for(const id in faceGrain){
    const st=$(id).style;
    st.backgroundImage = isWood ? faceGrain[id] : "none";
    st.backgroundBlendMode = isWood ? "soft-light" : "normal";
    st.backgroundRepeat = "repeat";
  }
  // front rails, mitred at the corners so the grain turns like a real frame
  const rail=(id,shadePct,img,box,clip)=>{
    const st=$(id).style;
    if(!isWood){ st.display="none"; return; }
    Object.assign(st, box);
    st.display="block";
    st.clipPath = clip;
    st.backgroundColor = shade(fc,shadePct);
    st.backgroundImage = img;
  };
  rail("wTop",    14, woodH, {left:"0",top:"0",right:"auto",bottom:"auto",width:"100%",height:mw+"px"},
       `polygon(0 0, 100% 0, calc(100% - ${mw}px) 100%, ${mw}px 100%)`);
  rail("wBottom",-16, woodH, {left:"0",bottom:"0",top:"auto",right:"auto",width:"100%",height:mw+"px"},
       `polygon(${mw}px 0, calc(100% - ${mw}px) 0, 100% 100%, 0 100%)`);
  rail("wLeft",    5, woodV, {left:"0",top:"0",right:"auto",bottom:"auto",width:mw+"px",height:"100%"},
       `polygon(0 0, 100% ${mw}px, 100% calc(100% - ${mw}px), 0 100%)`);
  rail("wRight",  -8, woodV, {right:"0",top:"0",left:"auto",bottom:"auto",width:mw+"px",height:"100%"},
       `polygon(0 ${mw}px, 100% 0, 100% 100%, 0 calc(100% - ${mw}px))`);

  mat.style.background = state.ppColor;
  mat.style.boxShadow  = `inset 0 ${Math.max(1,.12*s)}px ${Math.max(3,.5*s)}px rgba(0,0,0,.28)`;
  mat.style.transform  = `translateZ(${-.35*s}px)`;   // mat sits behind the glass plane

  hole.style.left   = m.left*s+"px";
  hole.style.top    = m.top*s+"px";
  hole.style.width  = state.artW*s+"px";
  hole.style.height = state.artH*s+"px";
  hole.style.boxShadow = `0 0 0 ${Math.max(1.5,.12*s)}px #fbf8ef`;   // bevel edge

  const dims=$("dims");
  const rotNote = cur.rot ? " (rotated)" : "";
  dims.innerHTML =
    `Frame <b>${fmt(cur.w)} × ${fmt(cur.h)} cm</b>${rotNote} &nbsp;·&nbsp; outer ≈ ${fmt(outerW)} × ${fmt(outerH)} cm<br>` +
    `Art <b>${fmt(state.artW)} × ${fmt(state.artH)} cm</b> &nbsp;·&nbsp; margins ${fmt(m.left)} sides / ${fmt(m.top)} top / ${fmt(m.bottom)} bottom cm`;

  const w=$("warnStage");
  if(cur.dead) w.textContent="⚠ Artwork is larger than this frame.";
  else if((m.left>0&&m.left<1.5)||(m.top>0&&m.top<1.5)) w.textContent="Margins under 1.5 cm can look cramped.";
  else w.textContent="";
}

/* ---- panel: shop frame list ---- */
function renderList(){
  const {cur,best,cands,valid} = resolveFrame();
  const host=$("frameList"); host.innerHTML="";

  // auto row
  const auto=document.createElement("button");
  auto.className="fr-row"+(state.sel.type==="auto"?" active":"");
  auto.innerHTML = `<div class="fr-ico">✨</div><div class="fr-main"><b>Auto — best match</b>
    <small>${best? `picks ${fmt(best.w)} × ${fmt(best.h)} cm` : "no frame fits"}</small></div>`;
  auto.onclick=()=>{ state.sel={type:"auto"}; save(); renderAll(); };
  host.appendChild(auto);

  const ordered=[...valid, ...cands.filter(c=>c.dead)];
  for(const c of ordered){
    const row=document.createElement("button");
    const active = state.sel.type==="shop" && state.sel.i===c.i;
    row.className="fr-row"+(active?" active":"")+(c.dead?" dead":"");
    const iw = c.w>=c.h?22:22*c.w/c.h, ih = c.h>=c.w?22:22*c.h/c.w;
    let badge="";
    if(c.dead) badge=`<span class="badge dead">too small</span>`;
    else if(best && c.i===best.i) badge=`<span class="badge">Best match</span>`;
    else if(best && c.score<=best.score+2) badge=`<span class="badge good">Good match</span>`;
    const sub = c.dead ? "artwork doesn't fit"
      : `margins ${fmt(c.mx)} / ${fmt(c.my)} cm${c.rot?" · rotated":""}`;
    row.innerHTML = `<div class="fr-ico"><div style="width:${iw}px;height:${ih}px"></div></div>
      <div class="fr-main"><b>${SHOP_LABEL(c.i)}</b><small>${sub}</small></div>${badge}`;
    if(!c.dead) row.onclick=()=>{ state.sel={type:"shop",i:c.i,rot:c.rot}; save(); renderAll(); };
    host.appendChild(row);
  }
  $("customRow").classList.toggle("active", state.sel.type==="custom");
  $("idealHint").textContent =
    `Ideal frame for these margins: ${fmt(state.artW+2*state.marginTarget)} × ${fmt(state.artH+2*state.marginTarget)} cm.`;
}

/* ---- panel: "what to buy" summary ---- */
function renderSummary(){
  const {cur,best} = resolveFrame();
  const el=$("summaryBody");
  if(!cur || cur.dead){
    el.innerHTML = `<div class="big">No fitting frame ${cur?"— custom size too small":""}</div>
      <ul><li>Largest shop frame is 70 × 100 cm. Reduce artwork size or margins.</li></ul>`;
    return;
  }
  const m=margins(cur);
  const noPP = m.left===0 && m.top===0 && m.bottom===0;
  const name = cur.custom ? `${fmt(cur.w)} × ${fmt(cur.h)} cm (custom)` : `${SHOP_LABEL(cur.i)} cm`;
  const orient = cur.w===cur.h ? "square" : (cur.w<cur.h ? "portrait" : "landscape");
  const ov=0.3; // window overlap per side so the art doesn't fall through
  const winW=Math.max(1,state.artW-2*ov), winH=Math.max(1,state.artH-2*ov);
  el.innerHTML = `
    <div class="big">${name} — ${orient}${cur.rot?" (turn the frame)":""}</div>
    <ul>
      <li>Frame outer size ≈ <b>${fmt(cur.w+2*state.moulding)} × ${fmt(cur.h+2*state.moulding)} cm</b></li>
      ${noPP
        ? `<li><b>No passe-partout</b> — the artwork fills the frame exactly.</li>`
        : `<li>Passe-partout sheet: <b>${fmt(cur.w)} × ${fmt(cur.h)} cm</b></li>
           <li>Window (bevel cut): <b>${fmt(winW)} × ${fmt(winH)} cm</b> <small>(0.3 cm overlap/side)</small></li>
           <li>Margins: <b>${fmt(m.left)}</b> sides · <b>${fmt(m.top)}</b> top · <b>${fmt(m.bottom)}</b> bottom cm</li>`}
    </ul>
    ${best && !cur.custom && cur.i!==best.i ? `<div class="note">Tip: the best match for your target margin is ${SHOP_LABEL(best.i)} cm.</div>`:""}
    ${Math.abs(m.left-m.top)>2.5 && !noPP ? `<div class="note">Side and top margins differ by ${fmt(Math.abs(m.left-m.top))} cm — fine if intentional, or try another size for a more even border.</div>`:""}`;
}

/* ---- panel: colour swatches ---- */
function renderSwatches(){
  const build=(hostId, colors, key, customId)=>{
    const host=$(hostId); host.innerHTML="";
    for(const [name,hex] of colors){
      const b=document.createElement("button");
      b.className="sw"+(state[key].toLowerCase()===hex?" active":"");
      b.innerHTML=`<div class="dot" style="background:${hex}"></div><span>${name}</span>`;
      if(WOOD_HEX.has(hex.toLowerCase())){
        const d=b.querySelector(".dot");
        d.style.backgroundImage=woodH;
        d.style.backgroundBlendMode="soft-light";
        d.style.backgroundSize="42px 11px";
        d.style.backgroundRepeat="repeat";
      }
      b.onclick=()=>{ state[key]=hex; save(); renderAll(); };
      host.appendChild(b);
    }
    $(customId).value = /^#[0-9a-f]{6}$/i.test(state[key]) ? state[key] : "#888888";
  };
  build("frSwatches", FRAME_COLORS, "frameColor", "frCustom");
  build("ppSwatches", PP_COLORS, "ppColor", "ppCustom");
}

/* ---- panel: slider readouts & fills ---- */
const SLIDER_IDS = ["artW","artH","marginTarget","moulding","depthIn","customW","customH"];
function fillTrack(el){
  const mn=parseFloat(el.min), mx=parseFloat(el.max), v=parseFloat(el.value);
  const pct=Math.max(0,Math.min(100,((v-mn)/(mx-mn))*100));
  el.style.setProperty("--fill", pct+"%");
}
function setOut(id){
  const el=$(id); if(!el) return;
  const out=$(id+"Out");
  if(out) out.textContent = fmt(parseFloat(el.value))+" cm";
  fillTrack(el);
}
function renderInputs(){
  $("artW").value=state.artW; $("artH").value=state.artH;
  $("marginTarget").value=state.marginTarget; $("optical").checked=state.optical;
  $("moulding").value=state.moulding; $("depthIn").value=state.depth;
  $("customW").value=state.customW; $("customH").value=state.customH;
  $("lockRatio").checked=state.lockRatio;
  $("lockRow").classList.toggle("on", state.lockRatio);
  $("lockRatioText").textContent = state.lockRatio && state.artRatio>0
    ? `(${fmt(1)} : ${fmt(state.artRatio)})` : "";
  SLIDER_IDS.forEach(setOut);
}

/* artwork size presets (A5–A1) */
function renderPresets(){
  const host=$("artPresets"); if(!host) return;
  host.innerHTML="";
  for(const [name,w,h] of ART_PRESETS){
    const active = Math.abs(state.artW-w)<0.05 && Math.abs(state.artH-h)<0.05;
    const b=document.createElement("button");
    b.className="preset"+(active?" active":"");
    b.innerHTML=`<b>${name}</b><small>${fmt(w)}×${fmt(h)}</small>`;
    b.title=`${fmt(w)} × ${fmt(h)} cm`;
    b.onclick=()=>{
      state.artW=w; state.artH=h;
      if(state.lockRatio) state.artRatio=h/w;   // keep the lock in step with the new shape
      save(); renderInputs(); renderAll();
    };
    host.appendChild(b);
  }
}

function renderAll(){ renderPresets(); renderSwatches(); renderList(); renderSummary(); renderPreview(); }
