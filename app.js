const formats=["JPG","PNG","WEBP","GIF","BMP","TIFF","SVG","AVIF","ICO","HEIC","JSON","CSV","TSV","XML","YAML","TXT","MD","HTML","WAV","MP3","OGG","M4A","MP4","WEBM","MOV"];
const popular=[["HEIC","JPG","Convert HEIC photos to widely supported JPG images."],["WEBP","JPG","Turn modern web images into JPG files for broader compatibility."],["PNG","WEBP","Reduce image size for the web."],["JPG","PNG","Convert JPG images to lossless PNG."],["SVG","PNG","Rasterize vector artwork into PNG."],["AVIF","JPG","Convert AVIF images to broadly supported JPG files."],["SVG","PNG","Turn scalable vector artwork into a standard PNG image."],["JSON","CSV","Turn structured JSON data into spreadsheet-ready CSV."],["CSV","JSON","Convert tabular CSV data into structured JSON."]];
let from=null,to=null;
const $=s=>document.querySelector(s);
const fromBtn=$("#fromFormat"),toBtn=$("#toFormat"),fromMenu=$("#fromMenu"),toMenu=$("#toMenu"),fileInput=$("#fileInput"),selectFile=$("#selectFile"),status=$("#status"),dropzone=$("#dropzone"),queue=$("#queue"),quality=$("#quality"),qualityValue=$("#qualityValue"),fitWhite=$("#fitWhite");

function buildMenu(menu,btn,setter){
  menu.innerHTML=formats.map(f=>`<button type="button" data-format="${f}">${f}</button>`).join("");
  menu.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;setter(b.dataset.format);menu.classList.remove("open")});
  btn.addEventListener("click",()=>{fromMenu.classList.remove("open");toMenu.classList.remove("open");menu.classList.toggle("open")});
}
buildMenu(fromMenu,fromBtn,f=>{from=f;fromBtn.innerHTML=`${f} <span>⌄</span>`;refresh()});
buildMenu(toMenu,toBtn,f=>{to=f;toBtn.innerHTML=`${f} <span>⌄</span>`;refresh()});
document.addEventListener("click",e=>{if(!e.target.closest(".format-pick")){fromMenu.classList.remove("open");toMenu.classList.remove("open")}});
quality.addEventListener("input",()=>qualityValue.value=`${Math.round(Number(quality.value)*100)}%`);

function isImageFormat(f){return ["JPG","PNG","WEBP","GIF","BMP","AVIF","HEIC","SVG"].includes(f)}
function supported(from,to){
  if(from===to)return false;
  if(isImageFormat(from)&&["JPG","PNG","WEBP"].includes(to))return true;
  return [["JSON","CSV"],["CSV","JSON"]].some(x=>x[0]===from&&x[1]===to);
}
function refresh(){
  const ready=from&&to&&supported(from,to);
  selectFile.disabled=!ready;
  fileInput.accept=from?({JPG:"image/jpeg,.jpg,.jpeg",PNG:"image/png,.png",WEBP:"image/webp,.webp",GIF:"image/gif,.gif",BMP:"image/bmp,.bmp",AVIF:"image/avif,.avif",HEIC:"image/heic,.heic,.heif",SVG:"image/svg+xml,.svg",JSON:"application/json,.json",CSV:"text/csv,.csv"}[from]||""):("");
  if(from&&to){
    if(from===to)status.textContent="Choose two different formats.";
    else if(ready)status.textContent=`${from} → ${to} is ready. Choose one or more files to begin.`;
    else status.textContent=`${from} → ${to} is on the roadmap. Choose a highlighted route for a working conversion.`;
  }else status.textContent="";
}
selectFile.addEventListener("click",()=>fileInput.click());
dropzone.addEventListener("click",()=>{if(!selectFile.disabled)fileInput.click()});
dropzone.addEventListener("dragover",e=>{e.preventDefault();dropzone.style.borderColor="var(--accent)"});
dropzone.addEventListener("dragleave",()=>dropzone.style.borderColor="");
dropzone.addEventListener("drop",e=>{e.preventDefault();dropzone.style.borderColor="";if(!selectFile.disabled&&e.dataTransfer.files.length)convertFiles([...e.dataTransfer.files])});
fileInput.addEventListener("change",e=>{if(e.target.files.length)convertFiles([...e.target.files]);fileInput.value=""});

function fileBase(name){return name.replace(/\.[^.]+$/,"")}
function outputName(file,ext){return `${fileBase(file.name)}.${ext.toLowerCase()}`}
function download(blob,name){
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function blobToImage(blob){
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(blob),img=new Image();
    img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("Image could not be decoded by this browser."))};
    img.src=url;
  });
}
function canvasBlob(canvas,mime,q){
  return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("This browser could not encode the requested format.")),mime,q));
}
async function loadHeic(){
  if(typeof window.heic2any==="function")return window.heic2any;
  throw new Error("The HEIC decoder did not load. Refresh the page and try again.");
}
async function heicToImage(file){
  const heic2any=await loadHeic();
  const converted=await heic2any({blob:file,toType:"image/png",quality:1});
  return blobToImage(Array.isArray(converted)?converted[0]:converted);
}
async function svgToImage(file){
  const text=await file.text();
  if(!/^\s*<svg[\s>]/i.test(text))throw new Error("Invalid SVG file.");
  const blob=new Blob([text],{type:"image/svg+xml"});
  return blobToImage(blob);
}
async function decodeImage(file){
  if(from==="HEIC")return heicToImage(file);
  if(from==="SVG")return svgToImage(file);
  return blobToImage(file);
}
async function imageConvert(file,target){
  const img=await decodeImage(file);
  const c=document.createElement("canvas"),w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;
  if(!w||!h)throw new Error("The image has no usable dimensions.");
  c.width=w;c.height=h;
  const ctx=c.getContext("2d",{alpha:true});
  if(target==="JPG"&&fitWhite.checked){ctx.fillStyle="#fff";ctx.fillRect(0,0,w,h)}
  ctx.drawImage(img,0,0,w,h);
  const mime={JPG:"image/jpeg",PNG:"image/png",WEBP:"image/webp"}[target];
  const blob=await canvasBlob(c,mime,Number(quality.value));
  return {blob,name:outputName(file,target)};
}
async function jsonToCsv(file){
  const data=JSON.parse(await file.text());
  const rows=Array.isArray(data)?data:[data];
  if(!rows.length)return {blob:new Blob([""],{type:"text/csv"}),name:outputName(file,"CSV")};
  const keys=[];rows.forEach(o=>Object.keys(o&&typeof o==="object"?o:{}).forEach(k=>{if(!keys.includes(k))keys.push(k)}));
  if(!keys.length)throw new Error("JSON must contain one or more object fields.");
  const esc=v=>`"${String(v==null?"":typeof v==="object"?JSON.stringify(v):v).replace(/"/g,'""')}"`;
  const csv=[keys.map(esc).join(","),...rows.map(o=>keys.map(k=>esc(o?o[k]:"")).join(","))].join("\r\n");
  return {blob:new Blob([csv],{type:"text/csv;charset=utf-8"}),name:outputName(file,"CSV")};
}
function parseCsv(text){
  const rows=[];let row=[],cell="",quoted=false;
  text=text.replace(/^\uFEFF/,"");
  for(let i=0;i<text.length;i++){const ch=text[i],next=text[i+1];
    if(quoted){if(ch==='"'&&next==='"'){cell+='"';i++}else if(ch==='"')quoted=false;else cell+=ch}
    else if(ch==='"'&&cell==="")quoted=true;
    else if(ch===","){row.push(cell);cell=""}
    else if(ch==="\n"){row.push(cell);rows.push(row);row=[];cell=""}
    else if(ch!=="\r")cell+=ch;
  }
  row.push(cell);if(row.length>1||row[0]!=="")rows.push(row);
  return rows;
}
async function csvToJson(file){
  const rows=parseCsv(await file.text());
  if(rows.length<2)throw new Error("CSV needs a header row and at least one data row.");
  const headers=rows[0].map(h=>h.trim());
  if(headers.some(h=>!h))throw new Error("CSV contains an empty header.");
  const data=rows.slice(1).filter(r=>r.some(v=>v!=="")).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??""])));
  return {blob:new Blob([JSON.stringify(data,null,2)],{type:"application/json;charset=utf-8"}),name:outputName(file,"JSON")};
}
async function convertOne(file,item){
  try{
    if(isImageFormat(from)&&["JPG","PNG","WEBP"].includes(to)){const out=await imageConvert(file,to);download(out.blob,out.name);item.className="queue-item done";item.querySelector(".result").textContent="Converted ✓";return}
    if(from==="JSON"&&to==="CSV"){const out=await jsonToCsv(file);download(out.blob,out.name);item.className="queue-item done";item.querySelector(".result").textContent="Converted ✓";return}
    if(from==="CSV"&&to==="JSON"){const out=await csvToJson(file);download(out.blob,out.name);item.className="queue-item done";item.querySelector(".result").textContent="Converted ✓";return}
    throw new Error("This conversion route is not enabled yet.");
  }catch(err){item.className="queue-item error";item.querySelector(".result").textContent=err.message||"Conversion failed."}
}
async function convertFiles(files){
  if(!from||!to||!supported(from,to))return;
  queue.innerHTML="";
  files.forEach(file=>{const item=document.createElement("div");item.className="queue-item";item.innerHTML=`<span title="${file.name}">${file.name}</span><span class="result">Waiting…</span>`;queue.appendChild(item)});
  const items=[...queue.children];status.textContent=`Converting ${files.length} file${files.length>1?"s":""}…`;
  for(let i=0;i<files.length;i++){await convertOne(files[i],items[i])}
  const ok=items.filter(x=>x.classList.contains("done")).length;
  status.textContent=`Finished — ${ok} of ${files.length} file${files.length>1?"s":""} converted.`;
}
window.pick=function(a,b){from=a;to=b;fromBtn.innerHTML=`${a} <span>⌄</span>`;toBtn.innerHTML=`${b} <span>⌄</span>`;refresh();$("#converter").scrollIntoView({behavior:"smooth"})};
$("#popularGrid").innerHTML=popular.map(item=>`<a class="tool-card" href="#converter" onclick="pick('${item[0]}','${item[1]}')"><div class="tool-icon"><span>${item[0]}</span><i>→</i><span>${item[1]}</span></div><h3>${item[0]} to ${item[1]}</h3><p>${item[2]}</p><small class="tool-cap">WORKING ROUTE</small></a>`).join("");
$("#formatGrid").innerHTML=formats.map(f=>`<div class="format-pill"><b>${f}</b><span>${isImageFormat(f)?"IMAGE":"FORMAT"}</span></div>`).join("");
refresh();