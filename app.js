const formats=["JPG","PNG","WEBP","GIF","BMP","TIFF","SVG","AVIF","ICO","HEIC","PDF","JSON","CSV","TSV","XML","YAML","TXT","MD","HTML","WAV","MP3","OGG","M4A","MP4","WEBM","MOV"];
const popular=[["HEIC","JPG","Convert HEIC photos to widely supported JPG images."],["WEBP","JPG","Turn modern web images into JPG files for broader compatibility."],["PNG","WEBP","Reduce image size for the web."],["JPG","PNG","Convert JPG images to lossless PNG."],["SVG","PNG","Rasterize vector artwork into PNG."],["AVIF","JPG","Convert AVIF images to broadly supported JPG files."],["JPG","PDF","Turn JPG images into shareable PDF documents."],["PNG","PDF","Combine PNG images into PDF documents."],["PDF","JPG","Render PDF pages as JPG images for previews and sharing."],["PDF","PNG","Render PDF pages as lossless PNG images."],["TIFF","JPG","Convert TIFF images to widely supported JPG files."],["SVG","PNG","Turn scalable vector artwork into a standard PNG image."],["JSON","CSV","Turn structured JSON data into spreadsheet-ready CSV."],["CSV","JSON","Convert tabular CSV data into structured JSON."]];
let from=null,to=null;
const $=s=>document.querySelector(s);
const fromBtn=$("#fromFormat"),toBtn=$("#toFormat"),fromMenu=$("#fromMenu"),toMenu=$("#toMenu"),fileInput=$("#fileInput"),selectFile=$("#selectFile"),status=$("#status"),dropzone=$("#dropzone"),queue=$("#queue"),quality=$("#quality"),qualityValue=$("#qualityValue"),fitWhite=$("#fitWhite"),maxWidth=$("#maxWidth"),maxHeight=$("#maxHeight");

function buildMenu(menu,btn,setter){
  menu.innerHTML=formats.map(f=>`<button type="button" data-format="${f}">${f}</button>`).join("");
  menu.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;setter(b.dataset.format);menu.classList.remove("open")});
  btn.addEventListener("click",()=>{fromMenu.classList.remove("open");toMenu.classList.remove("open");menu.classList.toggle("open")});
}
buildMenu(fromMenu,fromBtn,f=>{from=f;fromBtn.innerHTML=`${f} <span>⌄</span>`;refresh()});
buildMenu(toMenu,toBtn,f=>{to=f;toBtn.innerHTML=`${f} <span>⌄</span>`;refresh()});
document.addEventListener("click",e=>{if(!e.target.closest(".format-pick")){fromMenu.classList.remove("open");toMenu.classList.remove("open")}});
if(quality) quality.addEventListener("input",()=>{if(qualityValue)qualityValue.value=`${Math.round(Number(quality.value)*100)}%`});

function isImageFormat(f){return ["JPG","PNG","WEBP","GIF","BMP","TIFF","AVIF","HEIC","SVG"].includes(f)}
function supported(from,to){
  if(from===to)return false;
  if(isImageFormat(from)&&["JPG","PNG","WEBP"].includes(to))return true;
  if(from==="PDF"&&["JPG","PNG","WEBP"].includes(to))return true;
  if(isImageFormat(from)&&to==="PDF")return true;
  return [["JSON","CSV"],["CSV","JSON"]].some(x=>x[0]===from&&x[1]===to);
}
function refresh(){
  const ready=from&&to&&supported(from,to);
  selectFile.disabled=!ready;
  fromMenu.querySelectorAll("button").forEach(btn=>{btn.disabled=!!to&&!supported(btn.dataset.format,to)});
  toMenu.querySelectorAll("button").forEach(btn=>{btn.disabled=!!from&&!supported(from,btn.dataset.format)});
  fileInput.accept=from?({JPG:"image/jpeg,.jpg,.jpeg",PNG:"image/png,.png",WEBP:"image/webp,.webp",GIF:"image/gif,.gif",BMP:"image/bmp,.bmp",TIFF:"image/tiff,.tif,.tiff",AVIF:"image/avif,.avif",HEIC:"image/heic,.heic,.heif",SVG:"image/svg+xml,.svg",PDF:"application/pdf,.pdf",JSON:"application/json,.json",CSV:"text/csv,.csv"}[from]||""):"";
  if(from&&to){
    if(from===to)status.textContent="Choose two different formats.";
    else if(ready)status.textContent=from+" → "+to+" is ready. Choose one or more files to begin.";
    else status.textContent=from+" → "+to+" is not available yet. Choose an enabled route or change the target format.";
  }else if(from&&!to)status.textContent=from+" selected. Now choose a compatible output format.";
  else if(to&&!from)status.textContent=to+" selected. Now choose a compatible source format.";
  else status.textContent="";
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
async function tiffToImage(file){
  if(!window.UTIF)throw new Error("The TIFF decoder did not load. Refresh the page and try again.");
  const buffer=await file.arrayBuffer(),ifds=UTIF.decode(buffer);
  if(!ifds.length)throw new Error("No image was found in this TIFF file.");
  UTIF.decodeImage(buffer,ifds[0]);
  const rgba=UTIF.toRGBA8(ifds[0]),w=ifds[0].width,h=ifds[0].height;
  const c=document.createElement("canvas");c.width=w;c.height=h;
  const ctx=c.getContext("2d");ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba),w,h));
  return blobToImage(await canvasBlob(c,"image/png",1));
}
async function pdfjs(){
  if(window.pdfjsLib)return window.pdfjsLib;
  if(!window.__pdfjsPromise)window.__pdfjsPromise=import("https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/build/pdf.min.mjs").then(m=>{
    m.GlobalWorkerOptions.workerSrc="https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/build/pdf.worker.min.mjs";
    window.pdfjsLib=m;return m;
  });
  return window.__pdfjsPromise;
}
async function pdfToImage(file,target){
  const pdf=await (await pdfjs()).getDocument({data:await file.arrayBuffer()}).promise;
  if(pdf.numPages>30)throw new Error("For browser safety, PDFs are limited to 30 pages per batch.");
  const results=[];
  for(let p=1;p<=pdf.numPages;p++){
    if(status)status.textContent=`Rendering PDF page ${p} of ${pdf.numPages}…`;
    const page=await pdf.getPage(p),baseViewport=page.getViewport({scale:1});
    const mw=maxWidth&&Number(maxWidth.value)>0?Math.min(3000,Number(maxWidth.value)):3000;
    const mh=maxHeight&&Number(maxHeight.value)>0?Math.min(3000,Number(maxHeight.value)):3000;
    const renderScale=Math.min(1.5,mw/baseViewport.width,mh/baseViewport.height);
    const viewport=page.getViewport({scale:Math.max(.25,renderScale)});
    const c=document.createElement("canvas");c.width=Math.ceil(viewport.width);c.height=Math.ceil(viewport.height);
    await page.render({canvasContext:c.getContext("2d"),viewport}).promise;
    const mime=target==="PNG"?"image/png":target==="WEBP"?"image/webp":"image/jpeg";
    const blob=await canvasBlob(c,mime,quality?Number(quality.value):0.92);
    results.push({blob,name:`${fileBase(file.name)}-page-${p}.${target.toLowerCase()}`});
    c.width=1;c.height=1;
  }
  return results;
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
  if(from==="TIFF")return tiffToImage(file);
  return blobToImage(file);
}
async function imageConvert(file,target){
  const img=await decodeImage(file);
  const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;
  if(!w||!h)throw new Error("The image has no usable dimensions.");
  const mw=maxWidth&&Number(maxWidth.value)>0?Math.min(12000,Number(maxWidth.value)):w;
  const mh=maxHeight&&Number(maxHeight.value)>0?Math.min(12000,Number(maxHeight.value)):h;
  const scale=Math.min(1,mw/w,mh/h);
  const outW=Math.max(1,Math.round(w*scale)),outH=Math.max(1,Math.round(h*scale));
  const c=document.createElement("canvas");c.width=outW;c.height=outH;
  const ctx=c.getContext("2d",{alpha:true});
  if(target==="JPG"&&(!fitWhite||fitWhite.checked)){ctx.fillStyle="#fff";ctx.fillRect(0,0,outW,outH)}
  ctx.drawImage(img,0,0,outW,outH);
  const mime={JPG:"image/jpeg",PNG:"image/png",WEBP:"image/webp"}[target];
  const q=quality?Math.min(1,Math.max(0.01,Number(quality.value))):0.92;
  const blob=await canvasBlob(c,mime,q);
  return {blob,name:outputName(file,target),width:outW,height:outH};
}
async function imageToPdf(file){
  if(!window.jspdf||!window.jspdf.jsPDF)throw new Error("The PDF engine did not load. Refresh the page and try again.");
  const img=await decodeImage(file);const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;
  const pdf=new window.jspdf.jsPDF({orientation:w>h?"landscape":"portrait",unit:"mm",format:"a4"});
  const pageW=pdf.internal.pageSize.getWidth(),pageH=pdf.internal.pageSize.getHeight(),margin=10,ratio=w/h;
  let drawW=pageW-margin*2,drawH=drawW/ratio;
  if(drawH>pageH-margin*2){drawH=pageH-margin*2;drawW=drawH*ratio}
  const c=document.createElement("canvas");c.width=Math.min(w,2400);c.height=Math.max(1,Math.round(c.width/ratio));
  const ctx=c.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,0,0,c.width,c.height);
  const x=(pageW-drawW)/2,y=(pageH-drawH)/2;
  pdf.addImage(c.toDataURL("image/jpeg",quality?Number(quality.value):0.92),"JPEG",x,y,drawW,drawH);
  return {blob:pdf.output("blob"),name:outputName(file,"PDF")};
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
    if(isImageFormat(from)&&["JPG","PNG","WEBP"].includes(to)){
      const out=await imageConvert(file,to);item.className="queue-item done";item.querySelector(".result").textContent="Converted ✓";return [out];
    }
    if(from==="PDF"&&["JPG","PNG","WEBP"].includes(to)){
      const outs=await pdfToImage(file,to);item.className="queue-item done";item.querySelector(".result").textContent=`Converted ${outs.length} page${outs.length===1?"":"s"} ✓`;return outs;
    }
    if(isImageFormat(from)&&to==="PDF"){
      const out=await imageToPdf(file);item.className="queue-item done";item.querySelector(".result").textContent="Converted ✓";return [out];
    }
    if(from==="JSON"&&to==="CSV"){
      const out=await jsonToCsv(file);item.className="queue-item done";item.querySelector(".result").textContent="Converted ✓";return [out];
    }
    if(from==="CSV"&&to==="JSON"){
      const out=await csvToJson(file);item.className="queue-item done";item.querySelector(".result").textContent="Converted ✓";return [out];
    }
    throw new Error("This conversion route is not enabled yet.");
  }catch(err){
    item.className="queue-item error";item.querySelector(".result").textContent=err.message||"Conversion failed.";return [];
  }
}
function ensureZip(){
  if(window.JSZip)return Promise.resolve(window.JSZip);
  if(window.__zipPromise)return window.__zipPromise;
  window.__zipPromise=new Promise((resolve,reject)=>{
    const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";s.onload=()=>window.JSZip?resolve(window.JSZip):reject(new Error("ZIP library did not initialize."));s.onerror=()=>reject(new Error("Could not load the ZIP library."));
    document.head.appendChild(s);
  });
  return window.__zipPromise;
}
async function deliverOutputs(outputs){
  if(!outputs.length)return;
  if(outputs.length===1){download(outputs[0].blob,outputs[0].name);return}
  try{
    const Zip=await ensureZip(),zip=new Zip(),used=new Set();
    outputs.forEach(out=>{
      let name=out.name,base=name,ext="";
      const dot=name.lastIndexOf(".");
      if(dot>0){base=name.slice(0,dot);ext=name.slice(dot)}
      let n=2;while(used.has(name))name=base+" ("+n+++ ")"+ext;
      used.add(name);zip.file(name,out.blob);
    });
    const archive=await zip.generateAsync({type:"blob"});
    download(archive,"format-converter-results.zip");
  }catch(err){
    outputs.forEach(out=>download(out.blob,out.name));
  }
}
function humanSize(bytes){
  if(bytes<1024)return bytes+" B";
  const units=["KB","MB","GB"];let n=bytes/1024,i=0;
  while(n>=1024&&i<units.length-1){n/=1024;i++}
  return (n<10?n.toFixed(1):Math.round(n))+" "+units[i];
}
function renderQueueItem(file){
  const item=document.createElement("div");item.className="queue-item";
  const name=document.createElement("span");name.title=file.name;name.textContent=file.name;
  const result=document.createElement("span");result.className="result";result.textContent=humanSize(file.size);
  item.append(name,result);return item;
}
function validateFiles(files){
  const maxFiles=20,maxSize=100*1024*1024;
  if(!files.length)throw new Error("Choose at least one file.");
  if(files.length>maxFiles)throw new Error("Please convert up to 20 files at a time.");
  const tooLarge=files.find(f=>f.size>maxSize);
  if(tooLarge)throw new Error(tooLarge.name+" is larger than the 100 MB per-file limit.");
  return files.filter(f=>f&&f.size>=0);
}
async function convertFiles(files){
  if(!from||!to||!supported(from,to))return;
  let safeFiles;
  try{safeFiles=validateFiles(files)}catch(err){status.textContent=err.message;return}
  queue.innerHTML="";
  safeFiles.forEach(file=>queue.appendChild(renderQueueItem(file)));
  const items=[...queue.children],outputs=[];
  status.textContent=`Converting ${safeFiles.length} file${safeFiles.length>1?"s":""}…`;
  for(let i=0;i<safeFiles.length;i++){
    items[i].querySelector(".result").textContent="Working…";
    const produced=await convertOne(safeFiles[i],items[i]);outputs.push(...produced);
  }
  await deliverOutputs(outputs);
  const ok=items.filter(x=>x.classList.contains("done")).length;
  status.textContent=outputs.length>1
    ?`Finished — ${ok} file${ok===1?"":"s"} processed, ${outputs.length} outputs bundled as ZIP.`
    :`Finished — ${ok} of ${safeFiles.length} file${safeFiles.length>1?"s":""} converted.`;
}
window.pick=function(a,b){from=a;to=b;fromBtn.innerHTML=`${a} <span>⌄</span>`;toBtn.innerHTML=`${b} <span>⌄</span>`;refresh();const target=$("#converter")||$("#tool");if(target)target.scrollIntoView({behavior:"smooth"})};
const routeSlug={"HEIC-JPG":"heic-to-jpg.html","HEIC-PNG":"heic-to-png.html","WEBP-JPG":"webp-to-jpg.html","WEBP-PNG":"webp-to-png.html","PNG-WEBP":"png-to-webp.html","JPG-WEBP":"jpg-to-webp.html","JPG-PNG":"jpg-to-png.html","SVG-PNG":"svg-to-png.html","AVIF-JPG":"avif-to-jpg.html","JSON-CSV":"json-to-csv.html","CSV-JSON":"csv-to-json.html","JPG-PDF":"jpg-to-pdf.html","PNG-PDF":"png-to-pdf.html","PDF-JPG":"pdf-to-jpg.html","PDF-PNG":"pdf-to-png.html","TIFF-JPG":"tiff-to-jpg.html"};
$("#popularGrid").innerHTML=popular.map(item=>{const slug=routeSlug[item[0]+"-"+item[1]];return '<a class="tool-card" href="'+(slug||"#converter")+'"'+(slug?"":' onclick="pick(\''+item[0]+'\',\''+item[1]+'\')"' )+'>' + '<div class="tool-icon"><span>'+item[0]+'</span><i>→</i><span>'+item[1]+'</span></div><h3>'+item[0]+' to '+item[1]+'</h3><p>'+item[2]+'</p><small class="tool-cap">'+(slug?"DEDICATED TOOL":"WORKING ROUTE")+'</small></a>'}).join("");
$("#formatGrid").innerHTML=formats.map(f=>`<div class="format-pill"><b>${f}</b><span>${isImageFormat(f)?"IMAGE":"FORMAT"}</span></div>`).join("");
refresh();