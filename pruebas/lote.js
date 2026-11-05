// Prueba: un lote ya subido no debe volver a subirse desde otro teléfono ni revivir piezas vendidas.
// Uso: python3 fuente/build_repo.py && python3 -m http.server 8767 &  node pruebas/lote.js
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
// usa lote.json si trae algo; si está vacío, un lote de ejemplo (con una foto) servido solo dentro de la prueba
let L=JSON.parse(fs.readFileSync(path.join(__dirname,'..','lote.json')));
if(!(L.estado||[]).length)L={id:'prueba-lote',titulo:'Lote de prueba',estado:[{car:'A1',pn:'35560-TVA-A21',s:'quitada',n:1}],fotos:[{id:'f-prueba',pn:'35560-TVA-A21',thumb:'data:image/gif;base64,R0lGODlhAQABAAAAACw=',full:'data:image/gif;base64,R0lGODlhAQABAAAAACw='}]};
const e=L.estado[0];
(async()=>{const b=await chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME}:{});
  const c=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  for(const m of ['app','auth','firestore'])await c.route('https://www.gstatic.com/firebasejs/10.12.2/firebase-'+m+'.js',r=>r.fulfill({path:path.join(__dirname,'mock',(m==='firestore'?'fs':m)+'.js'),contentType:'text/javascript'}));
  await c.route('**/lote.json*',r=>r.fulfill({body:JSON.stringify(L),contentType:'application/json'}));
  const p=await c.newPage();const S={'config/negocio':{nombre:'Prueba'}};
  for(const k of new Set(L.estado.map(x=>x.car)))S['carros/'+k]={code:k,year:'2018',def:'falta'};
  S['estado/'+e.car]={m:{[e.pn]:{s:'vendida',n:0}}};
  const OWNER=JSON.parse(fs.readFileSync(path.join(__dirname,'..','fuente','config.json'),'utf8')).ownerEmail;
  await p.addInitScript(([o,s])=>{window.__owner=o;window.__S=s},[OWNER,S]);
  await p.goto('http://localhost:8767/index.html?entrar');await p.waitForTimeout(2500);
  await p.click('#menu-btn');await p.waitForTimeout(3000); // la tarjeta del lote se arma después de leer lote.json
  const btn=await p.$('[data-lote]');
  if(btn){await p.click('[data-lote]');await p.waitForTimeout(200);await p.click('[data-lote]');await p.waitForTimeout(2500)}
  const S2=await p.evaluate(()=>window.__S);const fin=S2['estado/'+e.car].m[e.pn];const fid=(L.fotos||[])[0]&&L.fotos[0].id;
  const enIdx=!fid||!!((S2['indice/fotos']||{}).m||{})[fid];const anotado=!!((S2['config/lotes']||{}).hechos||{})[L.id];
  const ok=fin.s==='vendida'&&enIdx&&anotado;
  console.log((ok?'OK   ':'FALLA')+` lote-repetido — ${e.car} ${e.pn}: vendida → ${JSON.stringify(fin)}; foto del lote en la lista de fotos: ${enIdx}; lote anotado en Firestore: ${anotado}`);
  await b.close();process.exit(ok?0:1)})();
