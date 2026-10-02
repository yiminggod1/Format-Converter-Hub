const formats=["JPG","PNG","WEBP","GIF","BMP","TIFF","SVG","AVIF","ICO","HEIC","PDF","JSON","CSV","TSV","XML","YAML","TXT","MD","HTML","WAV","MP3","OGG","M4A","MP4","WEBM","MOV"];
const popular=[
  ["HEIC","JPG","Convert HEIC photos to widely supported JPG images."],
  ["WEBP","JPG","Turn modern web images into JPG files for broader compatibility."],
  ["PNG","WEBP","Reduce image size for the web."],
  ["JPG","PNG","Convert JPG images to lossless PNG."],
  ["SVG","PNG","Rasterize vector artwork into PNG."],
  ["AVIF","JPG","Convert AVIF images to broadly supported JPG files."],
  ["JPG","PDF","Turn JPG images into shareable PDF documents."],
  ["PNG","PDF","Combine PNG images into PDF documents."],
  ["PDF","JPG","Render PDF pages as JPG images for previews and sharing."],
  ["PDF","PNG","Render PDF pages as lossless PNG images."],
  ["TIFF","JPG","Convert TIFF images to widely supported JPG files."],
  ["JSON","CSV","Turn structured JSON data into spreadsheet-ready CSV."],
  ["CSV","JSON","Convert tabular CSV data into structured JSON."]
];

var from=null;
var to=null;
var $=function(selector){return document.querySelector(selector);};

var fromBtn=$("#fromFormat");
var toBtn=$("#toFormat");
var fromMenu=$("#fromMenu");
var toMenu=$("#toMenu");
var fileInput=$("#fileInput");
var selectFile=$("#selectFile");
var status=$("#status");
var dropzone=$("#dropzone");
var queue=$("#queue");
var quality=$("#quality");
var qualityValue=$("#qualityValue");
var fitWhite=$("#fitWhite");
var maxWidth=$("#maxWidth");
var maxHeight=$("#maxHeight");
var combinePdf=$("#combinePdf");

function buildMenu(menu,button,setter){
  menu.innerHTML=formats.map(function(format){
    return '<button type="button" data-format="'+format+'">'+format+"</button>";
  }).join("");
  menu.addEventListener("click",function(event){
    var item=event.target.closest("button");
    if(!item||item.disabled)return;
    setter(item.dataset.format);
    menu.classList.remove("open");
  });
  button.addEventListener("click",function(){
    fromMenu.classList.remove("open");
    toMenu.classList.remove("open");
    menu.classList.toggle("open");
  });
}

buildMenu(fromMenu,fromBtn,function(format){
  from=format;
  fromBtn.innerHTML=format+" <span>⌄</span>";
  refresh();
});

buildMenu(toMenu,toBtn,function(format){
  to=format;
  toBtn.innerHTML=format+" <span>⌄</span>";
  refresh();
});

document.addEventListener("click",function(event){
  if(!event.target.closest(".format-pick")){
    fromMenu.classList.remove("open");
    toMenu.classList.remove("open");
  }
});

if(quality){
  quality.addEventListener("input",function(){
    if(qualityValue)qualityValue.value=Math.round(Number(quality.value)*100)+"%";
  });
}

var swapControl=document.querySelector(".swap");
if(swapControl){
  swapControl.setAttribute("role","button");
  swapControl.tabIndex=0;
  swapControl.title="Swap formats";
  swapControl.addEventListener("click",function(){swapFormats();});
  swapControl.addEventListener("keydown",function(event){if(event.key==="Enter"||event.key===" "){event.preventDefault();swapFormats();}});
}
function swapFormats(){
  if(!from||!to)return;
  if(!supported(to,from)){
    if(status)status.textContent="The reverse conversion is not available yet.";
    return;
  }
  var oldFrom=from;from=to;to=oldFrom;
  if(fromBtn)fromBtn.innerHTML=from+" <span>⌄</span>";
  if(toBtn)toBtn.innerHTML=to+" <span>⌄</span>";
  refresh();
}

function isImageFormat(format){
  return ["JPG","PNG","WEBP","GIF","BMP","TIFF","AVIF","HEIC","SVG"].indexOf(format)>=0;
}

function supported(source,target){
  if(!source||!target||source===target)return false;
  if(isImageFormat(source)&&["JPG","PNG","WEBP"].indexOf(target)>=0)return true;
  if(source==="PDF"&&["JPG","PNG","WEBP"].indexOf(target)>=0)return true;
  if(isImageFormat(source)&&target==="PDF")return true;
  return (source==="JSON"&&target==="CSV")||(source==="CSV"&&target==="JSON");
}

function refresh(){
  var ready=from&&to&&supported(from,to);
  if(selectFile)selectFile.disabled=!ready;
  if(fromMenu)fromMenu.querySelectorAll("button").forEach(function(button){
    button.disabled=!!to&&!supported(button.dataset.format,to);
  });
  if(toMenu)toMenu.querySelectorAll("button").forEach(function(button){
    button.disabled=!!from&&!supported(from,button.dataset.format);
  });
  if(fileInput){
    var accepts={
      JPG:"image/jpeg,.jpg,.jpeg",
      PNG:"image/png,.png",
      WEBP:"image/webp,.webp",
      GIF:"image/gif,.gif",
      BMP:"image/bmp,.bmp",
      TIFF:"image/tiff,.tif,.tiff",
      AVIF:"image/avif,.avif",
      HEIC:"image/heic,.heic,.heif",
      SVG:"image/svg+xml,.svg",
      PDF:"application/pdf,.pdf",
      JSON:"application/json,.json",
      CSV:"text/csv,.csv"
    };
    fileInput.accept=from?(accepts[from]||""):"";
  }
  if(!status)return;
  if(from&&to){
    if(from===to)status.textContent="Choose two different formats.";
    else if(ready)status.textContent=from+" → "+to+" is ready. Choose one or more files to begin.";
    else status.textContent=from+" → "+to+" is not available yet. Choose an enabled route or change the target format.";
  }else if(from){
    status.textContent=from+" selected. Now choose a compatible output format.";
  }else if(to){
    status.textContent=to+" selected. Now choose a compatible source format.";
  }else{
    status.textContent="";
  }
}

if(selectFile){
  selectFile.addEventListener("click",function(){
    if(fileInput)fileInput.click();
  });
}
if(dropzone){
  dropzone.addEventListener("click",function(){
    if(selectFile&&!selectFile.disabled&&fileInput)fileInput.click();
  });
  dropzone.setAttribute("role","button");
  dropzone.tabIndex=0;
  dropzone.addEventListener("keydown",function(event){
    if((event.key==="Enter"||event.key===" ")&&selectFile&&!selectFile.disabled&&fileInput){
      event.preventDefault();
      fileInput.click();
    }
  });
  dropzone.addEventListener("dragover",function(event){
    event.preventDefault();
    dropzone.classList.add("is-dragging");
  });
  dropzone.addEventListener("dragleave",function(){
    dropzone.classList.remove("is-dragging");
  });
  dropzone.addEventListener("drop",function(event){
    event.preventDefault();
    dropzone.classList.remove("is-dragging");
    if(!selectFile||selectFile.disabled)return;
    if(event.dataTransfer&&event.dataTransfer.files&&event.dataTransfer.files.length){
      convertFiles(Array.from(event.dataTransfer.files));
    }
  });
}

if(fileInput){
  fileInput.addEventListener("change",function(event){
    if(event.target.files&&event.target.files.length)convertFiles(Array.from(event.target.files));
    fileInput.value="";
  });
}

document.addEventListener("paste",function(event){
  if(!selectFile||selectFile.disabled)return;
  var items=event.clipboardData&&event.clipboardData.items?Array.from(event.clipboardData.items):[];
  var imageFiles=items.filter(function(item){return item.kind==="file"&&item.type.indexOf("image/")===0;}).map(function(item){return item.getAsFile();}).filter(Boolean);
  if(imageFiles.length){event.preventDefault();convertFiles(imageFiles);if(status)status.textContent="Pasted "+imageFiles.length+" image"+(imageFiles.length===1?"":"s")+" from clipboard."}
});

function fileBase(name){
  return name.replace(/\.[^.]+$/,"");
}

function outputName(file,extension){
  return fileBase(file.name)+"."+extension.toLowerCase();
}

function download(blob,name){
  var url=URL.createObjectURL(blob);
  var link=document.createElement("a");
  link.href=url;
  link.download=name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(function(){URL.revokeObjectURL(url);},1500);
}

function blobToImage(blob){
  return new Promise(function(resolve,reject){
    var url=URL.createObjectURL(blob);
    var image=new Image();
    image.onload=function(){
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror=function(){
      URL.revokeObjectURL(url);
      reject(new Error("Image could not be decoded by this browser."));
    };
    image.src=url;
  });
}

function canvasBlob(canvas,mime,q){
  return new Promise(function(resolve,reject){
    canvas.toBlob(function(blob){
      if(blob)resolve(blob);
      else reject(new Error("This browser could not encode the requested format."));
    },mime,q);
  });
}

function loadHeic(){
  if(typeof window.heic2any==="function")return Promise.resolve(window.heic2any);
  return Promise.reject(new Error("The HEIC decoder did not load. Refresh the page and try again."));
}

function heicToImage(file){
  return loadHeic().then(function(heic2any){
    return heic2any({blob:file,toType:"image/png",quality:1});
  }).then(function(converted){
    return blobToImage(Array.isArray(converted)?converted[0]:converted);
  });
}

function tiffToImage(file){
  if(!window.UTIF)throw new Error("The TIFF decoder did not load. Refresh the page and try again.");
  return file.arrayBuffer().then(function(buffer){
    var ifds=UTIF.decode(buffer);
    if(!ifds.length)throw new Error("No image was found in this TIFF file.");
    var width=ifds[0].width;
    var height=ifds[0].height;
    if(width*height>40000000)throw new Error("This TIFF is too large to process safely in a browser.");
    UTIF.decodeImage(buffer,ifds[0]);
    var rgba=UTIF.toRGBA8(ifds[0]);
    var canvas=document.createElement("canvas");
    canvas.width=width;
    canvas.height=height;
    var context=canvas.getContext("2d");
    context.putImageData(new ImageData(new Uint8ClampedArray(rgba),width,height));
    return canvasBlob(canvas,"image/png",1);
  }).then(blobToImage);
}

function pdfjs(){
  if(window.pdfjsLib)return Promise.resolve(window.pdfjsLib);
  if(window.__pdfjsPromise)return window.__pdfjsPromise;
  window.__pdfjsPromise=import("https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/build/pdf.min.mjs").then(function(module){
    module.GlobalWorkerOptions.workerSrc="https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/build/pdf.worker.min.mjs";
    window.pdfjsLib=module;
    return module;
  });
  return window.__pdfjsPromise;
}

async function pdfToImage(file,target){
  var pdf=await (await pdfjs()).getDocument({data:await file.arrayBuffer()}).promise;
  if(pdf.numPages>30)throw new Error("For browser safety, PDFs are limited to 30 pages per batch.");
  var results=[];
  for(var pageNumber=1;pageNumber<=pdf.numPages;pageNumber++){
    if(status)status.textContent="Rendering PDF page "+pageNumber+" of "+pdf.numPages+"…";
    var page=await pdf.getPage(pageNumber);
    var baseViewport=page.getViewport({scale:1});
    var widthLimit=maxWidth&&Number(maxWidth.value)>0?Math.min(3000,Number(maxWidth.value)):3000;
    var heightLimit=maxHeight&&Number(maxHeight.value)>0?Math.min(3000,Number(maxHeight.value)):3000;
    var renderScale=Math.min(1.5,widthLimit/baseViewport.width,heightLimit/baseViewport.height);
    var viewport=page.getViewport({scale:Math.max(.25,renderScale)});
    var canvas=document.createElement("canvas");
    canvas.width=Math.ceil(viewport.width);
    canvas.height=Math.ceil(viewport.height);
    await page.render({canvasContext:canvas.getContext("2d"),viewport:viewport}).promise;
    var mime=target==="PNG"?"image/png":target==="WEBP"?"image/webp":"image/jpeg";
    var blob=await canvasBlob(canvas,mime,quality?Number(quality.value):0.92);
    results.push({blob:blob,name:fileBase(file.name)+"-page-"+pageNumber+"."+target.toLowerCase()});
    canvas.width=1;
    canvas.height=1;
  }
  return results;
}

function svgToImage(file){
  return file.text().then(function(source){
    if(!/^\s*<svg[\s>]/i.test(source))throw new Error("Invalid SVG file.");
    return blobToImage(new Blob([source],{type:"image/svg+xml"}));
  });
}

function decodeImage(file){
  if(from==="HEIC")return heicToImage(file);
  if(from==="SVG")return svgToImage(file);
  if(from==="TIFF")return tiffToImage(file);
  return blobToImage(file);
}

async function imageConvert(file,target){
  var image=await decodeImage(file);
  var width=image.naturalWidth||image.width;
  var height=image.naturalHeight||image.height;
  if(!width||!height)throw new Error("The image has no usable dimensions.");
  if(width*height>50000000)throw new Error("This image is too large to process safely in a browser.");
  var widthLimit=maxWidth&&Number(maxWidth.value)>0?Math.min(12000,Number(maxWidth.value)):width;
  var heightLimit=maxHeight&&Number(maxHeight.value)>0?Math.min(12000,Number(maxHeight.value)):height;
  var scale=Math.min(1,widthLimit/width,heightLimit/height);
  var outputWidth=Math.max(1,Math.round(width*scale));
  var outputHeight=Math.max(1,Math.round(height*scale));
  var canvas=document.createElement("canvas");
  canvas.width=outputWidth;
  canvas.height=outputHeight;
  var context=canvas.getContext("2d",{alpha:true});
  if(target==="JPG"&&(!fitWhite||fitWhite.checked)){
    context.fillStyle="#fff";
    context.fillRect(0,0,outputWidth,outputHeight);
  }
  context.drawImage(image,0,0,outputWidth,outputHeight);
  var mime={JPG:"image/jpeg",PNG:"image/png",WEBP:"image/webp"}[target];
  var q=quality?Math.min(1,Math.max(.01,Number(quality.value))):.92;
  var blob=await canvasBlob(canvas,mime,q);
  return {blob:blob,name:outputName(file,target),width:outputWidth,height:outputHeight};
}

async function imageToPdf(files){
  if(!window.jspdf||!window.jspdf.jsPDF)throw new Error("The PDF engine did not load. Refresh the page and try again.");
  if(!Array.isArray(files))files=[files];
  if(files.length>10)throw new Error("Combine up to 10 images into one PDF at a time.");
  var pdf=null;
  for(var index=0;index<files.length;index++){
    var image=await decodeImage(files[index]);
    var width=image.naturalWidth||image.width;
    var height=image.naturalHeight||image.height;
    if(!width||!height)throw new Error("One of the images has no usable dimensions.");
    if(width*height>50000000)throw new Error(files[index].name+" is too large to place in a PDF safely.");
    var orientation=width>height?"landscape":"portrait";
    if(!pdf)pdf=new window.jspdf.jsPDF({orientation:orientation,unit:"mm",format:"a4"});
    else pdf.addPage("a4",orientation);
    var pageWidth=pdf.internal.pageSize.getWidth();
    var pageHeight=pdf.internal.pageSize.getHeight();
    var margin=10;
    var ratio=width/height;
    var drawWidth=pageWidth-margin*2;
    var drawHeight=drawWidth/ratio;
    if(drawHeight>pageHeight-margin*2){
      drawHeight=pageHeight-margin*2;
      drawWidth=drawHeight*ratio;
    }
    var canvas=document.createElement("canvas");
    canvas.width=Math.min(width,2400);
    canvas.height=Math.max(1,Math.round(canvas.width/ratio));
    var context=canvas.getContext("2d");
    context.fillStyle="#fff";
    context.fillRect(0,0,canvas.width,canvas.height);
    context.drawImage(image,0,0,canvas.width,canvas.height);
    var q=quality?Number(quality.value):.92;
    pdf.addImage(canvas.toDataURL("image/jpeg",q),"JPEG",(pageWidth-drawWidth)/2,(pageHeight-drawHeight)/2,drawWidth,drawHeight);
    if(status)status.textContent="Building PDF page "+(index+1)+" of "+files.length+"…";
  }
  return {blob:pdf.output("blob"),name:fileBase(files[0].name)+(files.length>1?"-combined.pdf":".pdf")};
}

async function jsonToCsv(file){
  var data=JSON.parse(await file.text());
  var rows=Array.isArray(data)?data:[data];
  if(!rows.length)throw new Error("JSON contains no records.");
  var keys=[];
  rows.forEach(function(object){
    if(object&&typeof object==="object"){
      Object.keys(object).forEach(function(key){
        if(keys.indexOf(key)<0)keys.push(key);
      });
    }
  });
  if(!keys.length)throw new Error("JSON must contain one or more object fields.");
  function escapeCsv(value){
    var text=String(value==null?"":typeof value==="object"?JSON.stringify(value):value);
    return '"'+text.replace(/"/g,'""')+'"';
  }
  var csv=[keys.map(escapeCsv).join(","),rows.map(function(object){
    return keys.map(function(key){return escapeCsv(object?object[key]:"");}).join(",");
  }).join("\n")].join("\r\n");
  return {blob:new Blob([csv],{type:"text/csv;charset=utf-8"}),name:outputName(file,"CSV")};
}

function parseCsv(source){
  var rows=[];
  var row=[];
  var cell="";
  var quoted=false;
  source=source.replace(/^\uFEFF/,"");
  for(var i=0;i<source.length;i++){
    var character=source[i];
    var next=source[i+1];
    if(quoted){
      if(character==='"'&&next==='"'){
        cell+='"';
        i++;
      }else if(character==='"'){
        quoted=false;
      }else{
        cell+=character;
      }
    }else if(character==='"'&&cell===""){
      quoted=true;
    }else if(character===","){
      row.push(cell);
      cell="";
    }else if(character==="\n"){
      row.push(cell);
      rows.push(row);
      row=[];
      cell="";
    }else if(character!=="\r"){
      cell+=character;
    }
  }
  row.push(cell);
  if(row.length>1||row[0]!=="")rows.push(row);
  return rows;
}

async function csvToJson(file){
  var rows=parseCsv(await file.text());
  if(rows.length<2)throw new Error("CSV needs a header row and at least one data row.");
  var headers=rows[0].map(function(header){return header.trim();});
  if(headers.some(function(header){return !header;}))throw new Error("CSV contains an empty header.");
  var data=rows.slice(1).filter(function(record){return record.some(function(value){return value!=="";});}).map(function(record){
    var object={};
    headers.forEach(function(header,index){object[header]=record[index]||"";});
    return object;
  });
  return {blob:new Blob([JSON.stringify(data,null,2)],{type:"application/json;charset=utf-8"}),name:outputName(file,"JSON")};
}

async function convertOne(file,item){
  try{
    if(isImageFormat(from)&&["JPG","PNG","WEBP"].indexOf(to)>=0){
      var imageOutput=await imageConvert(file,to);
      item.className="queue-item done";
      item.querySelector(".result").textContent="Converted ✓ "+imageOutput.width+"×"+imageOutput.height;
      return [imageOutput];
    }
    if(from==="PDF"&&["JPG","PNG","WEBP"].indexOf(to)>=0){
      var pageOutputs=await pdfToImage(file,to);
      item.className="queue-item done";
      item.querySelector(".result").textContent="Converted "+pageOutputs.length+" page"+(pageOutputs.length===1?"":"s")+" ✓";
      return pageOutputs;
    }
    if(isImageFormat(from)&&to==="PDF"){
      var singlePdf=await imageToPdf([file]);
      item.className="queue-item done";
      item.querySelector(".result").textContent="PDF ready ✓";
      return [singlePdf];
    }
    if(from==="JSON"&&to==="CSV"){
      var csvOutput=await jsonToCsv(file);
      item.className="queue-item done";
      item.querySelector(".result").textContent="Converted ✓";
      return [csvOutput];
    }
    if(from==="CSV"&&to==="JSON"){
      var jsonOutput=await csvToJson(file);
      item.className="queue-item done";
      item.querySelector(".result").textContent="Converted ✓";
      return [jsonOutput];
    }
    throw new Error("This conversion route is not enabled yet.");
  }catch(error){
    item.className="queue-item error";
    item.querySelector(".result").textContent=error.message||"Conversion failed.";
    return [];
  }
}


function ensureZip(){
  if(window.JSZip)return Promise.resolve(window.JSZip);
  if(window.__zipPromise)return window.__zipPromise;
  window.__zipPromise=new Promise(function(resolve,reject){
    var script=document.createElement("script");
    script.src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
    script.onload=function(){window.JSZip?resolve(window.JSZip):reject(new Error("ZIP library did not initialize."));};
    script.onerror=function(){reject(new Error("Could not load the ZIP library."));};
    document.head.appendChild(script);
  });
  return window.__zipPromise;
}

async function deliverOutputs(outputs){
  if(!outputs.length)return;
  if(outputs.length===1){
    download(outputs[0].blob,outputs[0].name);
    return;
  }
  try{
    var Zip=await ensureZip();
    var zip=new Zip();
    var used=new Set();
    outputs.forEach(function(output){
      var name=output.name;
      var baseName=name;
      var extension="";
      var dot=name.lastIndexOf(".");
      if(dot>0){
        baseName=name.slice(0,dot);
        extension=name.slice(dot);
      }
      var counter=2;
      while(used.has(name)){
        name=baseName+" ("+counter+")"+extension;
        counter++;
      }
      used.add(name);
      zip.file(name,output.blob);
    });
    var archive=await zip.generateAsync({type:"blob"});
    download(archive,"format-converter-results.zip");
  }catch(error){
    outputs.forEach(function(output){download(output.blob,output.name);});
  }
}

function humanSize(bytes){
  if(bytes<1024)return bytes+" B";
  var units=["KB","MB","GB"];
  var value=bytes/1024;
  var index=0;
  while(value>=1024&&index<units.length-1){
    value/=1024;
    index++;
  }
  return (value<10?value.toFixed(1):Math.round(value))+" "+units[index];
}

function renderQueueItem(file){
  var item=document.createElement("div");
  item.className="queue-item";
  var name=document.createElement("span");
  name.title=file.name;
  name.textContent=file.name;
  var result=document.createElement("span");
  result.className="result";
  result.textContent=humanSize(file.size);
  item.append(name,result);
  return item;
}

function validateFiles(files){
  var maxFiles=20;
  var maxSize=100*1024*1024;
  if(!files.length)throw new Error("Choose at least one file.");
  if(files.length>maxFiles)throw new Error("Please convert up to 20 files at a time.");
  var tooLarge=files.find(function(file){return file.size>maxSize;});
  if(tooLarge)throw new Error(tooLarge.name+" is larger than the 100 MB per-file limit.");
  return files.filter(function(file){return file&&file.size>=0;});
}

async function convertFiles(files){
  if(!from||!to||!supported(from,to))return;
  var safeFiles;
  try{
    safeFiles=validateFiles(files);
  }catch(error){
    if(status)status.textContent=error.message;
    return;
  }
  if(queue)queue.innerHTML="";
  safeFiles.forEach(function(file){
    if(queue)queue.appendChild(renderQueueItem(file));
  });
  var items=queue?Array.from(queue.children):[];
  var outputs=[];
  if(isImageFormat(from)&&to==="PDF"&&combinePdf&&safeFiles.length>1){
    try{
      items.forEach(function(item){item.querySelector(".result").textContent="Queued";});
      status.textContent="Combining "+safeFiles.length+" images into one PDF…";
      var combined=await imageToPdf(safeFiles);
      outputs=[combined];
      items.forEach(function(item){item.className="queue-item done";item.querySelector(".result").textContent="Added to PDF ✓";});
    }catch(error){
      items.forEach(function(item){item.className="queue-item error";item.querySelector(".result").textContent=error.message||"PDF creation failed.";});
    }
  }else{
    if(status)status.textContent="Converting "+safeFiles.length+" file"+(safeFiles.length>1?"s":"")+"…";
    for(var i=0;i<safeFiles.length;i++){
      items[i].querySelector(".result").textContent="Working…";
      var produced=await convertOne(safeFiles[i],items[i]);
      outputs.push.apply(outputs,produced);
    }
  }
  await deliverOutputs(outputs);
  var successful=items.filter(function(item){return item.classList.contains("done");}).length;
  if(status){
    if(outputs.length>1){
      status.textContent="Finished — "+successful+" file"+(successful===1?"":"s")+" processed, "+outputs.length+" outputs bundled as ZIP.";
    }else if(isImageFormat(from)&&to==="PDF"&&combinePdf&&safeFiles.length>1){
      status.textContent="Finished — "+safeFiles.length+" images combined into one PDF.";
    }else{
      status.textContent="Finished — "+successful+" of "+safeFiles.length+" file"+(safeFiles.length>1?"s":"")+" converted.";
    }
  }
}


window.pick=function(source,target){
  from=source;
  to=target;
  if(fromBtn)fromBtn.innerHTML=source+" <span>⌄</span>";
  if(toBtn)toBtn.innerHTML=target+" <span>⌄</span>";
  refresh();
  var targetElement=$("#converter")||$("#tool");
  if(targetElement)targetElement.scrollIntoView({behavior:"smooth"});
};

var routeSlug={
  "HEIC-JPG":"heic-to-jpg.html",
  "HEIC-PNG":"heic-to-png.html",
  "WEBP-JPG":"webp-to-jpg.html",
  "WEBP-PNG":"webp-to-png.html",
  "PNG-WEBP":"png-to-webp.html",
  "JPG-WEBP":"jpg-to-webp.html",
  "JPG-PNG":"jpg-to-png.html",
  "SVG-PNG":"svg-to-png.html",
  "AVIF-JPG":"avif-to-jpg.html",
  "JSON-CSV":"json-to-csv.html",
  "CSV-JSON":"csv-to-json.html",
  "JPG-PDF":"jpg-to-pdf.html",
  "PNG-PDF":"png-to-pdf.html",
  "PDF-JPG":"pdf-to-jpg.html",
  "PDF-PNG":"pdf-to-png.html",
  "TIFF-JPG":"tiff-to-jpg.html"
};

var availableFormats=new Set(["JPG","PNG","WEBP","GIF","BMP","TIFF","SVG","AVIF","HEIC","PDF","JSON","CSV"]);

if($("#popularGrid")){
  $("#popularGrid").innerHTML=popular.map(function(item){
    var key=item[0]+"-"+item[1];
    var slug=routeSlug[key];
    var href=slug||"#converter";
    var handler=slug ? "" : ' onclick="pick(\''+item[0]+'\',\''+item[1]+'\')"';
    return '<a class="tool-card" href="'+href+'"'+handler+'>'+
      '<div class="tool-icon"><span>'+item[0]+'</span><i>→</i><span>'+item[1]+'</span></div>'+
      '<h3>'+item[0]+' to '+item[1]+'</h3>'+
      '<p>'+item[2]+'</p>'+
      '<small class="tool-cap">'+(slug?"DEDICATED TOOL":"WORKING ROUTE")+"</small>"+
      "</a>";
  }).join("");
}

if($("#formatGrid")){
  $("#formatGrid").innerHTML=formats.map(function(format){
    var available=availableFormats.has(format);
    return '<div class="format-pill"><b>'+format+'</b><span class="'+(available?"available":"roadmap")+'">'+(available?"AVAILABLE":"ROADMAP")+"</span></div>";
  }).join("");
}

refresh();
