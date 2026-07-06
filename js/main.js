"use strict";
/* ---------------- event wiring & bootstrap ---------------- */

/* numeric / range inputs */
function num(id, key, min, max){
  $(id).addEventListener("input", e=>{
    const v=parseFloat(e.target.value);
    if(isNaN(v)||v<min||v>max) return;
    state[key]=v;
    if(id==="customW"||id==="customH") state.sel={type:"custom"};
    setOut(id);
    save(); renderAll();
  });
}
/* artwork width/height — coupled when the aspect ratio is locked */
const ART_MIN=5, ART_MAX=120;
function artInput(id, key, other, otherKey){
  $(id).addEventListener("input", e=>{
    let v=parseFloat(e.target.value);
    if(isNaN(v)||v<ART_MIN||v>ART_MAX) return;
    state[key]=v;
    if(state.lockRatio && state.artRatio>0){
      // key==="artW" → other height = v*ratio ; key==="artH" → other width = v/ratio
      let ov = key==="artW" ? v*state.artRatio : v/state.artRatio;
      ov = clamp(Math.round(ov*10)/10, ART_MIN, ART_MAX);
      state[otherKey]=ov;
      $(other).value=ov; setOut(other);
    }
    setOut(id);
    save(); renderAll();
  });
}
artInput("artW","artW","artH","artH");
artInput("artH","artH","artW","artW");
$("lockRatio").addEventListener("change",e=>{
  state.lockRatio=e.target.checked;
  if(state.lockRatio) state.artRatio=state.artH/state.artW;   // capture current ratio
  save(); renderInputs();
});
num("marginTarget","marginTarget",0,20); num("moulding","moulding",0.5,8);
num("depthIn","depth",0.5,8);
num("customW","customW",10,200); num("customH","customH",10,200);
$("optical").addEventListener("change",e=>{ state.optical=e.target.checked; save(); renderAll(); });
$("customRow").addEventListener("click",()=>{ state.sel={type:"custom"}; save(); renderAll(); });
$("frCustom").addEventListener("input",e=>{ state.frameColor=e.target.value; save(); renderAll(); });
$("ppCustom").addEventListener("input",e=>{ state.ppColor=e.target.value; save(); renderAll(); });

/* upload */
$("uploadBtn").onclick=()=>$("fileInput").click();
$("fileInput").addEventListener("change",e=>{ if(e.target.files[0]) loadFile(e.target.files[0]); e.target.value=""; });
$("clearImg").onclick=()=>{ imgData=null; try{localStorage.removeItem("fs-image");}catch(e){} renderAll(); };
$("matchRatio").onclick=()=>{
  state.artH = clamp(Math.round(state.artW*imgRatio*2)/2, ART_MIN, ART_MAX);
  if(state.lockRatio) state.artRatio=state.artH/state.artW;
  save(); renderInputs(); renderAll();
};

/* 3D rotate: drag anywhere on the stage */
const stage=$("stage");
let dragging=null;
stage.addEventListener("pointerdown",e=>{
  if(e.button!==0) return;
  dragging={x:e.clientX, y:e.clientY, rx:rot.x, ry:rot.y};
  $("frameBox").classList.add("grabbing");
});
window.addEventListener("pointermove",e=>{
  if(!dragging) return;
  rot.y = clamp(dragging.ry + (e.clientX-dragging.x)*.2, -40, 40);
  rot.x = clamp(dragging.rx - (e.clientY-dragging.y)*.2, -28, 28);
  applyRot();
});
window.addEventListener("pointerup",()=>{ dragging=null; $("frameBox").classList.remove("grabbing"); });
stage.addEventListener("dblclick",()=>{ rot={x:0,y:0}; zoom=0.85; applyRot(); renderPreview(); });

/* scroll/pinch to zoom the 3D preview */
stage.addEventListener("wheel",e=>{
  e.preventDefault();
  zoom = clamp(zoom - e.deltaY*0.0015, 0.4, 2);
  renderPreview();
}, {passive:false});

/* drag & drop: listen on the whole window so a drop is never missed, and
   always preventDefault so a stray drop never navigates the tab away to
   the raw image file (stage-only listeners let that happen whenever the
   file landed a few pixels outside the stage element, e.g. over the panel) */
let dragDepth = 0;
window.addEventListener("dragenter",e=>{
  e.preventDefault();
  dragDepth++;
  stage.classList.add("drag");
});
window.addEventListener("dragover",e=>{ e.preventDefault(); });
window.addEventListener("dragleave",e=>{
  dragDepth = Math.max(0, dragDepth-1);
  if(dragDepth===0) stage.classList.remove("drag");
});
window.addEventListener("drop",e=>{
  e.preventDefault();
  dragDepth = 0;
  stage.classList.remove("drag");
  const f=[...(e.dataTransfer ? e.dataTransfer.files : [])].find(f=>f.type.startsWith("image/"));
  if(f) loadFile(f);
});

function loadFile(file){
  const rd=new FileReader();
  rd.onload=()=>{
    const img=new Image();
    img.onload=()=>{
      imgRatio = img.height/img.width;
      // downscale for localStorage
      const MAX=1600, sc=Math.min(1, MAX/Math.max(img.width,img.height));
      const cv=document.createElement("canvas");
      cv.width=Math.round(img.width*sc); cv.height=Math.round(img.height*sc);
      cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height);
      imgData = cv.toDataURL(file.type==="image/png" ? "image/png" : "image/jpeg", .87);
      try{ localStorage.setItem("fs-image", imgData); }catch(e){ /* too big for storage — keep in memory */ }
      // adopt the image's aspect ratio, keeping current width
      state.artH = clamp(Math.round(state.artW*imgRatio*2)/2, ART_MIN, ART_MAX);
      if(state.lockRatio) state.artRatio=state.artH/state.artW;
      save(); renderInputs(); renderAll();
    };
    img.src=rd.result;
  };
  rd.readAsDataURL(file);
}

/* ---- bootstrap ---- */
new ResizeObserver(()=>renderPreview()).observe(stage);
renderInputs(); renderAll();
