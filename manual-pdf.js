(function(root){
  'use strict';
  // The PDF images the exact HTML/CSS used by the on-screen manual-letter preview.
  // Rendering takes place entirely on the device; no physician data is sent to a server.
  const enc=new TextEncoder();
  const bytes=s=>enc.encode(s);
  function imageBytes(dataUrl){
    const binary=atob(dataUrl.split(',')[1]),out=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)out[i]=binary.charCodeAt(i);
    return out;
  }
  function pdfFromJpegs(images){
    if(!images.length)throw new Error('El lote no contiene hojas.');
    const objects=[null],add=value=>(objects.push(value),objects.length-1);
    const catalog=add(null),pages=add(null),pageRefs=[];
    for(const image of images){
      const jpeg=imageBytes(image.dataUrl),imageId=add([bytes(`<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`),jpeg,bytes('\nendstream')]);
      const content=bytes('q 612 0 0 792 0 0 cm /Im0 Do Q\n'),contents=add([bytes(`<< /Length ${content.length} >>\nstream\n`),content,bytes('endstream')]);
      pageRefs.push(add(bytes(`<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 612 792] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contents} 0 R >>`)));
    }
    objects[catalog]=bytes(`<< /Type /Catalog /Pages ${pages} 0 R >>`);
    objects[pages]=bytes(`<< /Type /Pages /Kids [${pageRefs.map(x=>x+' 0 R').join(' ')}] /Count ${pageRefs.length} >>`);
    const chunks=[],offsets=[0];let length=0;
    const push=x=>{chunks.push(x);length+=x.length};
    push(bytes('%PDF-1.4\n'));
    for(let i=1;i<objects.length;i++){
      offsets[i]=length;push(bytes(`${i} 0 obj\n`));
      for(const part of Array.isArray(objects[i])?objects[i]:[objects[i]])push(part);
      push(bytes('\nendobj\n'));
    }
    const start=length;
    push(bytes(`xref\n0 ${objects.length}\n0000000000 65535 f \n`));
    for(let i=1;i<objects.length;i++)push(bytes(String(offsets[i]).padStart(10,'0')+' 00000 n \n'));
    push(bytes(`trailer\n<< /Size ${objects.length} /Root ${catalog} 0 R >>\nstartxref\n${start}\n%%EOF`));
    return new Blob(chunks,{type:'application/pdf'});
  }
  function loadImage(src){
    return new Promise((resolve,reject)=>{
      const img=new Image();
      img.onload=()=>resolve(img);
      img.onerror=()=>reject(new Error('Safari no pudo capturar el diseño original. Prueba abrir esta app en Safari.'));
      img.src=src;
    });
  }
  async function capturePage(html,css,scale){
    const width=816,height=1056;
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:816px;height:1056px;background:#fff;overflow:hidden"><style>${css.replace(/<\/style/gi,'<\\/style')}</style>${html}</div></foreignObject></svg>`;
    const image=await loadImage('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg));
    const canvas=document.createElement('canvas');canvas.width=width*scale;canvas.height=height*scale;
    const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('No se pudo crear la hoja PDF.');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
    // A WebKit failure can silently create a white image. Never deliver that as a prescription.
    const pixel=ctx.getImageData(3*scale,50*scale,1,1).data;
    if(pixel[0]>245&&pixel[1]>245&&pixel[2]>245)throw new Error('Safari no capturó los colores del talonario; no se creó un PDF distinto al original.');
    const dataUrl=canvas.toDataURL('image/jpeg',.95);
    canvas.width=canvas.height=0;
    return {dataUrl,width:width*scale,height:height*scale};
  }
  async function build({pagesHtml,cssUrl='styles.css',scale=2}){
    if(!Array.isArray(pagesHtml)||!pagesHtml.length||pagesHtml.length>50)throw new Error('Número de hojas inválido.');
    const response=await fetch(cssUrl,{cache:'force-cache'});
    if(!response.ok)throw new Error('No se pudo cargar el estilo de la receta sin conexión.');
    const css=await response.text(),images=[];
    for(const html of pagesHtml)images.push(await capturePage(html,css,scale));
    return pdfFromJpegs(images);
  }
  root.ClinovyraManualPDF=Object.freeze({build,pdfFromJpegs});
})(window);
