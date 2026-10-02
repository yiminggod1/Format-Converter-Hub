const $=s=>document.querySelector(s);
const fileInput=$("#compressFiles"),dropzone=$("#compressDrop"),quality=$("#compressQuality"),qualityValue=$("#compressQualityValue"),format=$("#compressFormat"),maxWidth=$("#compressWidth"),maxHeight=$("#compressHeight"),status=$("#compressStatus"),queue=$("#compressQueue");
quality.addEventListener("input",()=>qualityValue.textContent=Math.round(Number(quality.value)*100)+"%");
dropzone.addEventListener("click",()=>fileInput.click());dropzone.setAttribute("role","button");dropzone.tabIndex=0;dropzone.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();fileInput.click()}});
dropzone.addEventListener("dragover",e=>{e.preventDefault();dropzone.classList.add("is-dragging")});
dropzone.addEventListener("dragleave",()=>dropzone.classList.remove("is-dragging"));
dropzone.addEventListener("drop",e=>{e.preventDefault();dropzone.classList.remove("is-dragging");if(e.dataTransfer.files.length)compressFiles([...e.dataTransfer.files])});
fileInput.addEventListener("change",e=>{if(e.target.files.length)compressFiles([...e.target.files]);fileInput.value=""});
function base(n){return n.replace(/\.[^.]+$/,"")}
function extFor(mime){return mime==="image/png"?"png":mime==="image/webp"?"webp":"jpg"}
function outputMime(source,target){if(target!=="auto")return {"jpg":"image/jpeg","png":"image/png","webp":"image/webp"}[target];if(source==="image/png")return "image/png";if(source==="image/webp")return "image/webp";return "image/jpeg"}
function dl(blob,name){const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1200)}
function imgFromBlob(blob){return new Promise((resolve,reject)=>{const u=URL.createObjectURL(blob),i=new Image();i.onload=()=>{URL.revokeObjectURL(u);resolve(i)};i.onerror=()=>{URL.revokeObjectURL(u);reject(new Error("Image could not be decoded."))};i.src=u})}
async function decode(file){
  if(file.type==="image/tiff"||/\.tiff?$/i.test(file.name)){
    if(!window.UTIF)throw new Error("TIFF decoder did not load.");
    const b=await file.arrayBuffer(),ifds=UTIF.decode(b);if(!ifds.length)throw new Error("No TIFF image found.");
    if(ifds[0].width*ifds[0].height>40000000)throw new Error("This TIFF is too large to process safely in a browser.");UTIF.decodeImage(b,ifds[0]);const rgba=UTIF.toRGBA8(ifds[0]),c=document.createElement("canvas");c.width=ifds[0].width;c.height=ifds[0].height;c.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(rgba),c.width,c.height));return imgFromBlob(await new Promise((res,rej)=>c.toBlob(x=>x?res(x):rej(new Error("Could not decode TIFF.")),"image/png")));
  }
  if(/\.(heic|heif)$/i.test(file.name)){
    if(!window.heic2any)throw new Error("HEIC decoder did not load.");
    const out=await window.heic2any({blob:file,toType:"image/png",quality:1});return imgFromBlob(Array.isArray(out)?out[0]:out);
  }
  return imgFromBlob(file)
}
async function one(file){
  const img=await decode(file),w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;if(w*h>50000000)throw new Error("This image is too large to process safely in a browser.");const mw=Math.max(1,Number(maxWidth.value)||w),mh=Math.max(1,Number(maxHeight.value)||h),scale=Math.min(1,mw/w,mh/h),ow=Math.max(1,Math.round(w*scale)),oh=Math.max(1,Math.round(h*scale)),c=document.createElement("canvas");c.width=ow;c.height=oh;
  const ctx=c.getContext("2d");const mime=outputMime(file.type,format.value);if(mime==="image/jpeg"){ctx.fillStyle="#fff";ctx.fillRect(0,0,ow,oh)}ctx.drawImage(img,0,0,ow,oh);
  const q=Number(quality.value),blob=await new Promise((res,rej)=>c.toBlob(x=>x?res(x):rej(new Error("Browser could not encode the image.")),mime,q));
  const outName=base(file.name)+"-compressed."+extFor(mime);return {before:file.size,after:blob.size,name:outName,blob}
}
function humanSize(bytes){
  if(bytes<1024)return bytes+" B";let n=bytes/1024;const u=["KB","MB","GB"];let i=0;while(n>=1024&&i<u.length-1){n/=1024;i++}return (n<10?n.toFixed(1):Math.round(n))+" "+u[i];
}
async function ensureZip(){
  if(window.JSZip)return window.JSZip;if(window.__zipPromise)return window.__zipPromise;
  window.__zipPromise=new Promise((resolve,reject)=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";s.onload=()=>window.JSZip?resolve(window.JSZip):reject(new Error("ZIP library did not initialize."));s.onerror=()=>reject(new Error("Could not load the ZIP library."));document.head.appendChild(s)});return window.__zipPromise;
}
async function compressFiles(files){
  if(!files.length){status.textContent="Choose at least one image.";return}
  if(files.length>20){status.textContent="Please compress up to 20 images at a time.";return}
  const tooLarge=files.find(f=>f.size>100*1024*1024);if(tooLarge){status.textContent=tooLarge.name+" is larger than the 100 MB per-file limit.";return}
  queue.innerHTML="";status.textContent="Compressing "+files.length+" file"+(files.length>1?"s":"")+"…";
  files.forEach(f=>{const e=document.createElement("div");e.className="queue-item";const n=document.createElement("span");n.textContent=f.name;n.title=f.name;const res=document.createElement("span");res.className="result";res.textContent=humanSize(f.size);e.append(n,res);queue.appendChild(e)});
  let saved=0,done=0;const items=[...queue.children],outputs=[];
  for(let i=0;i<files.length;i++){try{const x=await one(files[i]);saved+=Math.max(0,x.before-x.after);done++;outputs.push(x);items[i].classList.add("done");items[i].querySelector(".result").textContent=x.after<x.before?Math.round((1-x.after/x.before)*100)+"% smaller":"No size reduction"}catch(e){items[i].classList.add("error");items[i].querySelector(".result").textContent=e.message}}
  if(outputs.length===1){
    dl(outputs[0].blob,outputs[0].name);
  }else if(outputs.length>1){
    try{
      const Zip=await ensureZip(),zip=new Zip(),used=new Set();
      outputs.forEach(out=>{let name=out.name,baseName=name,ext="";const dot=name.lastIndexOf(".");if(dot>0){baseName=name.slice(0,dot);ext=name.slice(dot)}let n=2;while(used.has(name)){name=baseName+" ("+n+")"+ext;n++}used.add(name);zip.file(name,out.blob)});
      const archive=await zip.generateAsync({type:"blob"});dl(archive,"compressed-images.zip");
    }catch(e){outputs.forEach(out=>dl(out.blob,out.name))}
  }
  status.textContent=done+" of "+files.length+" compressed. Total bytes saved: "+humanSize(saved)+(outputs.length>1?" — results bundled as ZIP.":".");
}