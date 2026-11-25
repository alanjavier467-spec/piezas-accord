// Prueba: la lista de fotos (indice/fotos) NO se debe vaciar al volver a abrir la app (Firebase simulado, sin internet).
// Antes, al abrir la app después de subir fotos, se guardaba "m:{}" y Firestore borraba toda la lista: las fotos dejaban de verse.
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const RAIZ=path.join(__dirname,'..');const MOCK=path.join(__dirname,'mock');
const OWNER=JSON.parse(fs.readFileSync(path.join(RAIZ,'fuente','config.json'),'utf8')).ownerEmail;
const URL='http://localhost:8767/';
const R=[];const log=(k,ok,msg)=>{R.push({k,ok,msg});console.log((ok?'OK   ':'FALLA')+' '+k+' — '+msg)};
async function abrir(b,state){const ctx=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  for(const m of ['app','auth','firestore'])await ctx.route('https://www.gstatic.com/firebasejs/10.12.2/firebase-'+m+'.js',r=>r.fulfill({path:path.join(MOCK,(m==='firestore'?'fs':m)+'.js'),contentType:'text/javascript'}));
  const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
  await p.addInitScript(([o,s])=>{window.__owner=o;window.__S=s},[OWNER,state]);await p.goto(URL+'index.html?entrar');await p.waitForTimeout(3000);return p}
const foto=(pn,date)=>({pn,thumb:'data:image/gif;base64,R0lGODlhAQABAAAAACw=',cond:'',nota:'',car:'',date,by:'u1',byName:'Alan'});
const meta=f=>({pn:f.pn,cond:'',nota:'',car:'',date:f.date,by:'u1',byName:'Alan'});
(async()=>{const b=await chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME}:{});
  const data=JSON.parse(fs.readFileSync(path.join(RAIZ,'data.json')));const pn=data.parts[10].pn;
  const f1=foto(pn,'2026-11-20T10:00:00.000Z'),f2=foto(pn,'2026-11-21T10:00:00.000Z'),f3=foto('X:x1','2026-11-24T10:00:00.000Z');
  const reciente=new Date().toISOString(),vieja='2026-11-01T00:00:00.000Z';
  const base={'carros/A1':{code:'A1',year:'2018',color:'NH731P',def:'esta'},'extras/x1':{name:'Pieza agregada',num:'',car:'A1',qty:1,status:'disponible',price:500,date:f3.date,by:'u1'},
    'fotos/f1':f1,'fotos/f2':f2,'fotos/f3':f3,'publico/inventario':{v:3,cars:[{code:'A1'}],items:[],xs:[]}};
  // 1) caso de Alan: subió una foto (ya está en la lista) y vuelve a abrir la app el mismo día
  let st=Object.assign(JSON.parse(JSON.stringify(base)),{'indice/fotos':{v:1,ult:f2.date,rev:reciente,m:{f1:meta(f1),f2:meta(f2),f3:meta(f3)}}});
  let p=await abrir(b,st);let S=await p.evaluate(()=>window.__S);let n=Object.keys((S['indice/fotos']||{}).m||{}).length;
  log('reabrir-misma-lista',n===3,'fotos en la lista después de volver a abrir: '+n+' (deben ser 3)');
  log('reabrir-ult',S['indice/fotos'].ult===f3.date,'la última fecha avanzó a '+S['indice/fotos'].ult);
  log('sin-errores-1',!p.errs.length,p.errs.join(' | ')||'sin errores');
  // 2) revisión completa de cada 24 h sin nada que cambiar: tampoco debe vaciarla
  st=Object.assign(JSON.parse(JSON.stringify(base)),{'indice/fotos':{v:1,ult:f3.date,rev:vieja,m:{f1:meta(f1),f2:meta(f2),f3:meta(f3)}}});
  p=await abrir(b,st);S=await p.evaluate(()=>window.__S);n=Object.keys((S['indice/fotos']||{}).m||{}).length;
  log('revision-24h',n===3&&S['indice/fotos'].rev!==vieja,'fotos en la lista tras la revisión completa: '+n);
  // 3) lista vacía (como está hoy): el dueño la rehace sola al abrir
  st=Object.assign(JSON.parse(JSON.stringify(base)),{'indice/fotos':{v:1,ult:f3.date,rev:reciente,m:{}}});
  p=await abrir(b,st);S=await p.evaluate(()=>window.__S);n=Object.keys((S['indice/fotos']||{}).m||{}).length;
  log('rehace-lista',n===3,'fotos recuperadas en la lista: '+n);
  await p.waitForTimeout(4500);S=await p.evaluate(()=>window.__S);const inv=S['publico/inventario'];
  const xs=(inv.xs||[]).map(a=>JSON.parse(a));log('tienda-recupera',xs.some(a=>a[6]==='f3'),'la pieza agregada vuelve a tener su foto en la tienda');
  log('sin-errores-3',!p.errs.length,p.errs.join(' | ')||'sin errores');
  await b.close();const f=R.filter(r=>!r.ok);console.log(f.length?f.length+' fallas':'Todo bien');process.exit(f.length?1:0)})();
