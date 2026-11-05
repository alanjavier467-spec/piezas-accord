// ---- buscador tolerante (lo comparten la app y la tienda; build_repo.py lo pega en las dos) ----
// Sinónimos (fuente/sinonimos.json) + plural/singular + una letra de diferencia. Todo en el teléfono, sin internet.
// En sinonimos.json, una palabra con ">" adelante es "solo de ida": al buscarla se busca el grupo, pero el grupo no la busca a ella
// ("stop" encuentra calaveras, pero "calavera" no trae topes "stopper").
const SINON=__SINONIMOS__;
function mkBuscador(norm,textos){
  const G=new Map();const FRASES=[];
  (SINON.grupos||[]).forEach(g=>{const all=g.map(w=>norm(w).trim()).filter(Boolean);const ns=[...new Set(all.filter(w=>!w.startsWith('>')))];
    all.map(w=>w.replace(/^>/,'')).forEach(w=>{G.set(w,[...new Set((G.get(w)||[]).concat(ns))]);if(w.includes(' '))FRASES.push(w)})});
  FRASES.sort((a,b)=>b.length-a.length);
  const VOC=new Set();textos.forEach(t=>norm(t).split(/[^a-z0-9ñ]+/).forEach(w=>{if(w.length>=3&&!/^\d+$/.test(w))VOC.add(w)}));G.forEach((v,k)=>{if(!k.includes(' '))VOC.add(k)});
  const VL=[...VOC];
  // distancia de Damerau-Levenshtein con tope (sale en cuanto pasa de max)
  function dist(a,b,max){if(Math.abs(a.length-b.length)>max)return max+1;let p2=null,p=Array.from({length:b.length+1},(_,j)=>j);
    for(let i=1;i<=a.length;i++){const c=[i];let lo=i;for(let j=1;j<=b.length;j++){let v=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));
      if(p2&&i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])v=Math.min(v,p2[j-2]+1);c.push(v);if(v<lo)lo=v}if(lo>max)return max+1;p2=p;p=c}return p[b.length]}
  const sing=w=>w.length>4&&w.endsWith('es')?[w.slice(0,-2),w.slice(0,-1)]:w.length>3&&w.endsWith('s')?[w.slice(0,-1)]:[];
  // separa la búsqueda en unidades (frases conocidas como "luz trasera" cuentan como una)
  function unidades(nq){let r=' '+nq+' ';const u=[];for(const f of FRASES){if(r.includes(' '+f+' ')){u.push(f);r=r.split(' '+f+' ').join(' ')}}
    return u.concat(r.split(/\s+/).filter(Boolean))}
  // devuelve {grupos:[[alternativas por unidad]], corr:{palabra:corrección}}
  function expandir(q){const nq=norm(q).trim();const corr={};
    // palabras cortas (4 letras o menos) cuentan solo como palabra completa: "mat" no encuentra "matrícula" ni "rin" encuentra "spring"
    const W=y=>y.length<=4?' '+y+' ':' '+y;
    const grupos=unidades(nq).map(w=>{const alts=new Set([w.length<=4&&G.has(w)?W(w):w,...sing(w).map(x=>x.length<=4?W(x):x)]);[w,...sing(w)].forEach(x=>(G.get(x)||[]).forEach(y=>alts.add(W(y))));
      if(w.length>=5&&!/\d/.test(w)&&!G.has(w)&&!VOC.has(w)&&!sing(w).some(x=>VOC.has(x))){const max=w.length>=8?2:1;let best=null,bd=max+1;
        for(const v of VL){if(Math.abs(v.length-w.length)>max||v[0]!==w[0]&&v[1]!==w[1])continue;const d=dist(w,v,max);if(d<bd){bd=d;best=v;if(d===1&&max===1)break}}
        if(best){corr[w]=best;alts.add(W(best));(G.get(best)||[]).forEach(y=>alts.add(W(y)))}}
      return [...alts]});
    return {grupos,corr}}
  // ¿el texto (ya normalizado) cumple todas las unidades?
  const KC=new Map();const pad=k=>{let v=KC.get(k);if(v===undefined){v=' '+k.replace(/[^a-z0-9ñ]+/g,' ')+' ';KC.set(k,v)}return v};
  const cumple=(key,grupos)=>{const k=pad(key);return grupos.every(alts=>alts.some(a=>k.includes(a)))};
  return {expandir,cumple}}
