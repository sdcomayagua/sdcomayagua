/* Gamer Comayagua Matrix Edition: decoración, no modifica carrito ni ventas */
(()=>{"use strict";const init=()=>{
 if(!document.body||document.body.dataset.page!=="productos")return;
 const hero=document.querySelector(".store-intro");if(!hero||hero.querySelector(".mx-rain"))return;
 const rain=document.createElement("div");rain.className="mx-rain";rain.setAttribute("aria-hidden","true");
 const parts=["010101001011010","1001010011101001","001010110101010","111001000110101","010111001010101","01001110010111"];
 for(let i=0;i<17;i++){const el=document.createElement("span");el.textContent=(parts[i%parts.length]+parts[(i+2)%parts.length]).repeat(3);el.style.left=(i*6.1)+"%";el.style.setProperty("--mx-duration",(12+i%7*2)+"s");el.style.setProperty("--mx-delay",(-i*1.6)+"s");rain.append(el)}
 hero.prepend(rain);
};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init()})();
