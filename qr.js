/* Minimal offline QR encoder for Rx Offline V2.
   Fixed QR Version 10, error correction L, mask 0, byte mode, up to 271 UTF-8 bytes. */
(function(){
  'use strict';
  function gfMul(x,y){let z=0;for(let i=0;i<8;i++){if(y&1)z^=x;y>>=1;const carry=x&0x80;x=(x<<1)&255;if(carry)x^=0x1d;}return z;}
  function rsDivisor(deg){const out=new Array(deg).fill(0);out[deg-1]=1;let root=1;for(let k=0;k<deg;k++){for(let j=0;j<deg;j++){out[j]=gfMul(out[j],root);if(j+1<deg)out[j]^=out[j+1];}root=gfMul(root,2);}return out;}
  function rsRemainder(data,div){let out=new Array(div.length).fill(0);for(const b of data){const factor=b^out[0];out=out.slice(1);out.push(0);for(let i=0;i<div.length;i++)out[i]^=gfMul(div[i],factor);}return out;}
  function appendBits(bits,val,len){for(let i=len-1;i>=0;i--)bits.push((val>>>i)&1);}
  function bitLength(n){let b=0;while(n){b++;n>>>=1;}return b;}
  function bch(value,generator,shift){let d=value<<shift;const gl=bitLength(generator);while(bitLength(d)>=gl)d^=generator<<(bitLength(d)-gl);return (value<<shift)|d;}
  function matrixFor(text){
    const bytes=Array.from(new TextEncoder().encode(text));
    if(bytes.length>271)throw new Error('El contenido del QR excede 271 bytes.');
    const bits=[];appendBits(bits,0b0100,4);appendBits(bits,bytes.length,16);bytes.forEach(b=>appendBits(bits,b,8));
    const dataCodewords=274,maxBits=dataCodewords*8;for(let i=0;i<Math.min(4,maxBits-bits.length);i++)bits.push(0);while(bits.length%8)bits.push(0);
    const data=[];for(let i=0;i<bits.length;i+=8){let v=0;for(let j=0;j<8;j++)v=(v<<1)|(bits[i+j]||0);data.push(v);}let pi=0;while(data.length<dataCodewords)data.push((pi++%2===0)?0xec:0x11);
    const specs=[[86,68],[86,68],[87,69],[87,69]],blocks=[];let pos=0;
    for(const [total,count] of specs){const d=data.slice(pos,pos+count);pos+=count;blocks.push({data:d,ecc:rsRemainder(d,rsDivisor(total-count))});}
    const code=[];const maxData=Math.max(...blocks.map(b=>b.data.length));for(let i=0;i<maxData;i++)for(const b of blocks)if(i<b.data.length)code.push(b.data[i]);const maxEcc=Math.max(...blocks.map(b=>b.ecc.length));for(let i=0;i<maxEcc;i++)for(const b of blocks)if(i<b.ecc.length)code.push(b.ecc[i]);
    const size=57,m=Array.from({length:size},()=>Array(size).fill(null));
    const finder=(row,col)=>{for(let r=-1;r<=7;r++){const rr=row+r;if(rr<0||rr>=size)continue;for(let c=-1;c<=7;c++){const cc=col+c;if(cc<0||cc>=size)continue;m[rr][cc]=((r>=0&&r<=6&&(c===0||c===6))||(c>=0&&c<=6&&(r===0||r===6))||(r>=2&&r<=4&&c>=2&&c<=4));}}};
    finder(0,0);finder(size-7,0);finder(0,size-7);
    for(const row of [6,28,50])for(const col of [6,28,50]){if(m[row][col]!==null)continue;for(let r=-2;r<=2;r++)for(let c=-2;c<=2;c++)m[row+r][col+c]=(r===-2||r===2||c===-2||c===2||(r===0&&c===0));}
    for(let r=8;r<size-8;r++)if(m[r][6]===null)m[r][6]=(r%2===0);for(let c=8;c<size-8;c++)if(m[6][c]===null)m[6][c]=(c%2===0);
    const fmt=bch((1<<3)|0,0x537,10)^0x5412;
    for(let i=0;i<15;i++){const mod=((fmt>>>i)&1)===1;if(i<6)m[i][8]=mod;else if(i<8)m[i+1][8]=mod;else m[size-15+i][8]=mod;}
    for(let i=0;i<15;i++){const mod=((fmt>>>i)&1)===1;if(i<8)m[8][size-i-1]=mod;else if(i<9)m[8][15-i]=mod;else m[8][14-i]=mod;}m[size-8][8]=true;
    const vb=bch(10,0x1f25,12);for(let i=0;i<18;i++){const mod=((vb>>>i)&1)===1,a=size-11+(i%3),b=Math.floor(i/3);m[b][a]=mod;m[a][b]=mod;}
    let byteIndex=0,bitIndex=7,row=size-1,inc=-1;for(let col=size-1;col>0;col-=2){if(col<=6)col--;while(true){for(const c of [col,col-1])if(m[row][c]===null){let dark=false;if(byteIndex<code.length)dark=((code[byteIndex]>>>bitIndex)&1)===1;if((row+c)%2===0)dark=!dark;m[row][c]=dark;bitIndex--;if(bitIndex<0){byteIndex++;bitIndex=7;}}row+=inc;if(row<0||row>=size){row-=inc;inc=-inc;break;}}}
    return m;
  }
  function svg(text,opts={}){const m=matrixFor(text),border=opts.border??4,size=m.length+border*2;let path='';for(let r=0;r<m.length;r++)for(let c=0;c<m.length;c++)if(m[r][c])path+=`M${c+border},${r+border}h1v1h-1z`;return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="Código QR" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;}
  window.RxQR={svg,matrixFor};
})();
