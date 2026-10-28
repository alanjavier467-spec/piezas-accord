// Prueba rápida sin internet: abre la app (como dueño) y la tienda (como cliente)
// usando versiones falsas de Firebase (carpeta mock/). Toma capturas en pruebas/capturas/.
// Requisitos: Node 18+ y Playwright  (npm i -D playwright && npx playwright install chromium)
// Uso, desde la raíz:  python3 fuente/build_repo.py  &&  python3 -m http.server 8767 &  node pruebas/prueba.js
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const RAIZ=path.join(__dirname,'..'),OUT=path.join(__dirname,'capturas');fs.mkdirSync(OUT,{recursive:true});
const OWNER=JSON.parse(fs.readFileSync(path.join(RAIZ,'fuente','config.json'),'utf8')).ownerEmail;
const URL='http://localhost:8767/';
(async()=>{const b=await chromium.launch();const errs=[];
  const ctx=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  for(const m of ['app','auth','firestore'])await ctx.route('https://www.gstatic.com/firebasejs/10.12.2/firebase-'+m+'.js',r=>r.fulfill({path:path.join(__dirname,'mock',(m==='firestore'?'fs':m)+'.js'),contentType:'text/javascript'}));
  // 1) la app como dueño
  const a=await ctx.newPage();a.on('pageerror',e=>errs.push('app: '+e.message));
  await a.addInitScript(o=>{window.__owner=o},OWNER);
  await a.goto(URL+'index.html?entrar');await a.waitForTimeout(2500);await a.screenshot({path:path.join(OUT,'app.png')});
  // 2) la tienda como visitante, con un inventario de ejemplo
  const t=await ctx.newPage();t.on('pageerror',e=>errs.push('tienda: '+e.message));
  await t.addInitScript(()=>{window.__user=null;window.__S={'publico/inventario':{v:3,wa:'6140000000',
    cars:[{code:'A1',year:'2018',ver:'Sport 1.5T',color:'Rojo',foto:'',n:1}],
    items:[JSON.stringify(['33100-TVA-A01',6800,1,'A1','','Usado',1])],xs:[]}}});
  await t.goto(URL+'tienda.html');await t.waitForTimeout(2500);await t.screenshot({path:path.join(OUT,'tienda.png')});
  console.log(errs.length?'Errores:\n'+errs.join('\n'):'Sin errores. Capturas en pruebas/capturas/');
  await b.close();process.exit(errs.length?1:0)})();
