// Pruebas del buzón de quejas y sugerencias (Firebase simulado, sin internet).
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const RAIZ=path.join(__dirname,'..');const MOCK=path.join(__dirname,'mock');
const OWNER=JSON.parse(fs.readFileSync(path.join(RAIZ,'fuente','config.json'),'utf8')).ownerEmail;
const URL='http://localhost:8767/';const OUT=path.join(__dirname,'capturas');fs.mkdirSync(OUT,{recursive:true});
const R=[];const log=(k,ok,msg)=>{R.push({k,ok,msg});console.log((ok?'OK   ':'FALLA')+' '+k+' — '+msg)};
async function page(b,{user,state,ls,w=390,h=844}={}){const ctx=await b.newContext({viewport:{width:w,height:h},serviceWorkers:'block'});
  for(const m of ['app','auth','firestore'])await ctx.route('https://www.gstatic.com/firebasejs/10.12.2/firebase-'+m+'.js',r=>r.fulfill({path:path.join(MOCK,(m==='firestore'?'fs':m)+'.js'),contentType:'text/javascript'}));
  const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
  await p.addInitScript(([o,u,s,l])=>{window.__owner=o;if(u!=='__default')window.__user=u;window.__S=s||{};for(const k in (l||{}))localStorage.setItem(k,JSON.stringify(l[k]))},[OWNER,user===undefined?'__default':user,state,ls]);
  return p}
const quejas=S=>Object.entries(S).filter(([k])=>k.startsWith('quejas/')).map(([k,v])=>Object.assign({id:k.split('/')[1]},v));
const KEYS='date,donde,equipo,err,nombre,rol,seccion,tel,texto,tipo,uid,ver';
(async()=>{const b=await chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME}:{});
  const inv={'publico/inventario':{v:3,wa:'6140000000',cars:[{code:'A4',year:'2018',ver:'',color:'',foto:'',n:1}],items:[],xs:[]}};
  // 1) tienda, visitante: botón, validación y envío
  let t=await page(b,{user:null,state:JSON.parse(JSON.stringify(inv))});await t.goto(URL+'tienda.html');await t.waitForTimeout(2000);
  const fab=await t.$('#qz-fab');log('tienda-boton',!!fab&&await fab.isVisible(),'el botón 💬 se ve en la tienda');
  await t.click('#qz-fab');await t.waitForTimeout(200);await t.click('[data-qzgo]');log('valida-tipo',/Elige/.test(await t.textContent('#qz-st')),'sin tipo pide elegirlo');
  await t.click('[data-qzt="falla"]');await t.click('[data-qzgo]');log('valida-texto',/Escribe/.test(await t.textContent('#qz-st')),'sin texto pide escribir');
  await t.fill('#qz-tx','Le doy a agregar a mi cotización y no hace nada');await t.fill('#qz-n','Luis');await t.fill('#qz-w','614 11');await t.click('[data-qzgo]');
  log('valida-tel',/10 números/.test(await t.textContent('#qz-st')),'WhatsApp incompleto se rechaza');
  await t.fill('#qz-w','614 111 2233');await t.screenshot({path:path.join(OUT,'quejas-tienda-form.png')});
  await t.click('[data-qzgo]');await t.waitForTimeout(500);let S=await t.evaluate(()=>window.__S);let q=quejas(S);
  log('tienda-guarda',q.length===1&&q[0].tipo==='falla'&&q[0].tel==='6141112233'&&q[0].donde==='tienda'&&q[0].rol==='visitante'&&q[0].uid===''&&Object.keys(q[0]).filter(k=>k!=='id').sort().join()===KEYS,JSON.stringify(q[0]||{}).slice(0,220));
  log('tienda-gracias',/Gracias/.test(await t.textContent('.qz-ov')),'muestra el gracias');await t.screenshot({path:path.join(OUT,'quejas-tienda-gracias.png')});
  await t.click('[data-qzotra]');await t.click('[data-qzt="sugerencia"]');await t.fill('#qz-tx','Otra más');await t.click('[data-qzgo]');await t.waitForTimeout(300);
  log('anti-repeticion',/Espera/.test(await t.textContent('#qz-st'))&&quejas(await t.evaluate(()=>window.__S)).length===1,'no deja mandar dos seguidas');
  log('tienda-sin-errores',!t.errs.length,t.errs.join(' | ')||'sin errores');
  // 2) app, vendedor: manda desde la app
  const vend={uid:'v1',email:'v1@usuarios.piezas-accord.app'};
  let v=await page(b,{user:vend,state:Object.assign({'users/v1':{name:'Pepe',user:'pepe',active:true,role:'empleado'},'carros/A1':{code:'A1',year:'2018',color:'NH731P',def:'esta'}},JSON.parse(JSON.stringify(inv)))});
  await v.goto(URL+'index.html?entrar');await v.waitForTimeout(2500);
  await v.click('#qz-fab');await v.waitForTimeout(200);await v.click('[data-qzt="trabo"]');await v.fill('#qz-tx','Se trabó al cobrar');await v.click('[data-qzgo]');await v.waitForTimeout(500);
  q=quejas(await v.evaluate(()=>window.__S));
  log('app-vendedor',q.length===1&&q[0].rol==='vendedor'&&q[0].nombre==='Pepe'&&q[0].donde==='app'&&q[0].uid==='v1'&&/pestaña/.test(q[0].seccion),JSON.stringify(q[0]||{}).slice(0,200));
  log('app-vendedor-sin-errores',!v.errs.length,v.errs.join(' | ')||'sin errores');
  // 3) app, dueño: contador, buzón, resuelta y borrar
  const st=Object.assign({'carros/A1':{code:'A1',year:'2018',color:'NH731P',def:'esta'},
    'quejas/q1':{tipo:'queja',texto:'La calavera venía rayada',nombre:'Carlos',tel:'6141234567',donde:'tienda',rol:'cliente',seccion:'#inicio',equipo:'iPhone',ver:'x',err:'',uid:'c1',date:'2026-11-24T10:00:00Z'},
    'quejas/q2':{tipo:'sugerencia',texto:'Pongan más fotos',nombre:'',tel:'',donde:'tienda',rol:'visitante',seccion:'#inicio',equipo:'Android',ver:'x',err:'TypeError: x',uid:'',date:'2026-11-24T11:00:00Z'}},JSON.parse(JSON.stringify(inv)));
  let o=await page(b,{state:st});await o.goto(URL+'index.html?entrar');await o.waitForTimeout(2500);
  log('dueno-contador',(await o.textContent('#qz-fab .qz-n'))==='2','el botón muestra 2 nuevas');
  await o.click('#qz-fab');await o.waitForTimeout(300);let tx=await o.textContent('#sheet');
  log('dueno-buzon',/Quejas y sugerencias/.test(tx)&&/La calavera venía rayada/.test(tx)&&/Pongan más fotos/.test(tx)&&!!(await o.$('a[href*="wa.me/526141234567"]')),'el buzón lista las 2 con botón de WhatsApp');
  await o.screenshot({path:path.join(OUT,'quejas-buzon.png'),fullPage:true});
  await o.click('[data-qzok="q1"]');await o.waitForTimeout(300);S=await o.evaluate(()=>window.__S);
  log('dueno-resuelta',S['quejas/q1'].resuelta===true&&(await o.textContent('#qz-fab .qz-n'))==='1','marca resuelta y baja el contador');
  await o.click('[data-qzdel="q2"]');await o.waitForTimeout(100);S=await o.evaluate(()=>window.__S);const sigue=!!S['quejas/q2'];
  await o.click('[data-qzdel="q2"]');await o.waitForTimeout(300);S=await o.evaluate(()=>window.__S);
  log('dueno-borrar',sigue&&!S['quejas/q2'],'borrar pide confirmar y luego borra');
  await o.click('[data-close]');await o.waitForTimeout(300);await o.click('#menu-btn');await o.waitForTimeout(300);
  log('dueno-menu',!!(await o.$('[data-qzopen]')),'el menú trae el acceso al buzón');
  log('dueno-sin-errores',!o.errs.length,o.errs.join(' | ')||'sin errores');
  // 4) login (sin sesión): el botón también sale
  let l=await page(b,{user:null,state:{}});await l.goto(URL+'index.html?entrar');await l.waitForTimeout(1500);
  log('login-boton',await l.isVisible('#qz-fab'),'el botón sale en la pantalla de entrar');
  // 5) computadora: no tapa nada y se ve con texto
  let c=await page(b,{user:null,state:JSON.parse(JSON.stringify(inv)),w:1280,h:800});await c.goto(URL+'tienda.html');await c.waitForTimeout(1500);await c.screenshot({path:path.join(OUT,'quejas-tienda-pc.png')});
  log('pc-texto',await c.isVisible('#qz-fab .qz-tx'),'en computadora dice “Quejas y sugerencias”');
  await b.close();const f=R.filter(r=>!r.ok);console.log(f.length?f.length+' fallas':'Todo bien');process.exit(f.length?1:0)})();
