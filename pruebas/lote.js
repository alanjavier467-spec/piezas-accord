// Prueba: un lote ya subido no debe volver a subirse desde otro teléfono ni revivir piezas vendidas.
// Uso: python3 fuente/build_repo.py && python3 -m http.server 8767 &  node pruebas/lote.js
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const L=JSON.parse(fs.readFileSync(path.join(__dirname,'..','lote.json')));const e=(L.estado||[])[0];
if(!e){console.log('lote.json no trae estados; nada que probar');process.exit(0)}
(async()=>{const b=await chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME}:{});
  const c=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  for(const m of ['app','auth','firestore'])await c.route('https://www.gstatic.com/firebasejs/10.12.2/firebase-'+m+'.js',r=>r.fulfill({path:path.join(__dirname,'mock',(m==='firestore'?'fs':m)+'.js'),contentType:'text/javascript'}));
  const p=await c.newPage();const S={'config/negocio':{nombre:'Prueba'}};
  for(const k of new Set(L.estado.map(x=>x.car)))S['carros/'+k]={code:k,year:'2018',def:'falta'};
  S['estado/'+e.car]={m:{[e.pn]:{s:'vendida',n:0}}};
  const OWNER=JSON.parse(fs.readFileSync(path.join(__dirname,'..','fuente','config.json'),'utf8')).ownerEmail;
  await p.addInitScript(([o,s])=>{window.__owner=o;window.__S=s},[OWNER,S]);
  await p.goto('http://localhost:8767/index.html?entrar');await p.waitForTimeout(2500);
  await p.click('#menu-btn');await p.waitForTimeout(3000); // la tarjeta del lote se arma después de leer lote.json
  const btn=await p.$('[data-lote]');
  if(btn){await p.click('[data-lote]');await p.waitForTimeout(200);await p.click('[data-lote]');await p.waitForTimeout(2500)}
  const fin=(await p.evaluate(()=>window.__S))['estado/'+e.car].m[e.pn];
  const ok=fin.s==='vendida';
  console.log((ok?'OK   ':'FALLA')+` lote-repetido — tarjeta visible: ${!!btn}; ${e.car} ${e.pn}: vendida → ${JSON.stringify(fin)}`);
  await b.close();process.exit(ok?0:1)})();
