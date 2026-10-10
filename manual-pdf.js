(function(root){
  'use strict';
  // Self-contained vector PDF. Nothing is uploaded: the document is built in memory.
  const SEP='https://cedulaprofesional.sep.gob.mx/cedula/presidencia/indexAvanzada.action';
  function pdfText(value){return String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7e]/g,'?').replace(/[\\()]/g,'\\$&')}
  function color(hex){const c=String(hex||'#173a5e').replace('#','');return [0,2,4].map(i=>(parseInt(c.slice(i,i+2),16)/255).toFixed(3)).join(' ')}
  function build({folios,profile={},theme={}}){
    if(!Array.isArray(folios)||!folios.length||folios.length>100||folios.some(f=>!/^RM-[A-Z0-9-]{8,48}$/.test(f)))throw new Error('Folios del lote no válidos.');
    const pageStreams=[],primary=color(theme.primary),secondary=color(theme.secondary),qr=root.RxQR.matrixFor(SEP);
    function page(pair,index,total){
      const ops=[];
      const rect=(x,y,w,h,fill)=>ops.push(`${fill} rg ${x} ${y} ${w} ${h} re f`);
      const line=(x,y,x2,y2,stroke='.73 .79 .82',width=.6)=>ops.push(`${stroke} RG ${width} w ${x} ${y} m ${x2} ${y2} l S`);
      const label=(value,x,y,size=8,bold=false,ink='.16 .24 .28')=>ops.push(`BT /${bold?'B':'R'} ${size} Tf ${ink} rg 1 0 0 1 ${x} ${y} Tm (${pdfText(value).slice(0,160)}) Tj ET`);
      const field=(name,x,y,width)=>{label(name.toUpperCase(),x+5,y+13,5.2,true,primary);line(x+5,y+8,x+width-5,y+8)};
      pair.forEach((folio,k)=>{
        if(!folio)return;
        const bottom=k===0?396:0;
        rect(0,bottom,6,396,primary);rect(6,bottom+390,606,6,secondary);
        label('CLINOVYRA  /  RECETA MEDICA MANUAL',22,bottom+364,9,true,primary);
        label(profile.name||'Medico',22,bottom+341,14,true);
        label(profile.role||'Medicina General',22,bottom+327,8);
        label(`Cedula profesional: ${profile.license||'—'}`,22,bottom+315,7);
        if(profile.university)label(profile.university,22,bottom+304,6.5);
        if(profile.address)label(profile.address,22,bottom+293,6.5);
        label('FOLIO',418,bottom+350,6,true,primary);
        label(folio.slice(0,20),418,bottom+339,6.4,true,primary);
        label(folio.slice(20),418,bottom+329,6.4,true,primary);
        label('FECHA: ____ / ____ / ______',418,bottom+313,7);
        line(22,bottom+285,590,bottom+285,primary,1);
        field('Paciente',22,bottom+257,270);field('F. nacimiento',298,bottom+257,100);field('Edad',404,bottom+257,52);field('Sexo',462,bottom+257,52);field('Peso',520,bottom+257,70);
        field('Alergias',22,bottom+224,270);field('TA',298,bottom+224,54);field('FC',356,bottom+224,54);field('FR',414,bottom+224,54);field('Temp',472,bottom+224,54);field('SpO2',530,bottom+224,60);
        label('Rx   INDICACIONES / PRESCRIPCION',22,bottom+199,8,true,primary);
        for(let i=0;i<6;i++)line(22,bottom+178-i*25,477,bottom+178-i*25);
        const module=1.25,qrX=512,qrY=bottom+105;
        rect(qrX-5,qrY-5,(qr.length+8)*module+10,(qr.length+8)*module+10,'1 1 1');
        for(let y=0;y<qr.length;y++)for(let x=0;x<qr.length;x++)if(qr[y][x])rect(qrX+x*module,qrY+(qr.length-1-y)*module,module,module,'0 0 0');
        label('Verificar cedula',511,bottom+90,5.5,true,primary);
        line(492,bottom+49,590,bottom+49,'.25 .31 .35',.8);
        label('FIRMA DEL MEDICO',503,bottom+38,6,true,primary);
        label(`ORIGINAL  /  ${folio}`,22,bottom+17,5.5,true,primary);
      });
      line(12,396,600,396,secondary,.5);
      label(`Hoja ${index} de ${total}  /  Corte por la mitad`,246,391,5.5);
      return ops.join('\n')+'\n';
    }
    const total=Math.ceil(folios.length/2);
    for(let i=0;i<total;i++)pageStreams.push(page(folios.slice(i*2,i*2+2),i+1,total));
    const objects=[null],add=x=>(objects.push(x),objects.length-1);
    const catalog=add(''),pages=add(''),regular=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'),bold=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
    const refs=[];
    for(const stream of pageStreams){const bytes=new TextEncoder().encode(stream),contents=add(`<< /Length ${bytes.length} >>\nstream\n${stream}endstream`),p=add(`<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /R ${regular} 0 R /B ${bold} 0 R >> >> /Contents ${contents} 0 R >>`);refs.push(p)}
    objects[catalog]=`<< /Type /Catalog /Pages ${pages} 0 R >>`;
    objects[pages]=`<< /Type /Pages /Kids [${refs.map(r=>`${r} 0 R`).join(' ')}] /Count ${refs.length} >>`;
    let body='%PDF-1.4\n',offsets=[0];
    for(let i=1;i<objects.length;i++){offsets[i]=new TextEncoder().encode(body).length;body+=`${i} 0 obj\n${objects[i]}\nendobj\n`}
    const start=new TextEncoder().encode(body).length;
    body+=`xref\n0 ${objects.length}\n0000000000 65535 f \n${offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size ${objects.length} /Root ${catalog} 0 R >>\nstartxref\n${start}\n%%EOF`;
    return new Blob([body],{type:'application/pdf'});
  }
  root.ClinovyraManualPDF=Object.freeze({build});
})(window);
