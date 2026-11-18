// Pruebas de "Avísame cuando llegue" y de pasar "por revisar" a dañadas (Firebase simulado, sin internet).
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const RAIZ=path.join(__dirname,'..');const MOCK=path.join(__dirname,'mock');
const OWNER=JSON.parse(fs.readFileSync(path.join(RAIZ,'fuente','config.json'),'utf8')).ownerEmail;
const URL='http://localhost:8767/';const OUT=path.join(__dirname,'capturas');fs.mkdirSync(OUT,{recursive:true});
const R=[];const log=(k,ok,msg)=>{R.push({k,ok,msg});console.log((ok?'OK   ':'FALLA')+' '+k+' — '+msg)};
async function page(b,{user,state,ls}={}){const ctx=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block',acceptDownloads:true});
  for(const m of ['app','auth','firestore'])await ctx.route('https://www.gstatic.com/firebasejs/10.12.2/firebase-'+m+'.js',r=>r.fulfill({path:path.join(MOCK,(m==='firestore'?'fs':m)+'.js'),contentType:'text/javascript'}));
  const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
  await p.addInitScript(([o,u,s,l])=>{window.__owner=o;if(u!=='__default')window.__user=u;window.__S=s||{};for(const k in (l||{}))localStorage.setItem(k,JSON.stringify(l[k]))},[OWNER,user===undefined?'__default':user,state,ls]);
  return p}
(async()=>{const b=await chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME}:{});
  const data=JSON.parse(fs.readFileSync(path.join(RAIZ,'data.json')));const pnA=data.parts[10].pn,pnB=data.parts.find(p=>p.pn!==pnA&&!p.y).pn;
  const base={'carros/A1':{code:'A1',year:'2018',ver:'',color:'NH731P',def:'revisar',vin:''},'carros/A4':{code:'A4',year:'2018',ver:'',color:'NH731P',def:'falta',vin:''},
    'estado/A4':{m:{[pnA]:{s:'quitada',n:1},[pnB]:{s:'revisar',n:0}}},'config/negocio':{nombre:'Prueba'},'publico/inventario':{v:3,cars:[{code:'A1'}],items:[],xs:[]},
    'esperas/e1':{pn:pnA,es:'Pieza A',name:'Carlos',tel:'6141234567',email:'c@x.com',date:'2026-11-17T10:00:00Z'},
    'esperas/e2':{pn:pnB,es:'Pieza B',name:'Ana',tel:'6147654321',email:'',date:'2026-11-17T11:00:00Z'}};
  // 1) app: tarjeta de clientes esperando y de por revisar
  let p=await page(b,{state:JSON.parse(JSON.stringify(base))});await p.goto(URL+'index.html?entrar');await p.waitForTimeout(2500);
  await p.click('#menu-btn');await p.waitForTimeout(400);
  const txt=await p.textContent('#sheet');
  log('esperas-menu',/Clientes esperando piezas \(2\)/.test(txt)&&/1 ya las tienes/.test(txt),'el menú muestra 2 esperando y 1 que ya tienes');
  log('rev-conteo',/Marcar las \d+ como dañadas/.test(txt),(txt.match(/Tienes \d+ piezas por revisar[^.]*/)||['no aparece'])[0]);
  await p.screenshot({path:path.join(OUT,'menu-esperas.png'),fullPage:true});
  // 2) pasar a dañadas: primer toque pide confirmar, el segundo descarga respaldo y cambia
  await p.click('[data-rev2mala]');await p.waitForTimeout(300);let S=await p.evaluate(()=>window.__S);
  log('rev-confirma',S['estado/A4'].m[pnB].s==='revisar','el primer toque no cambia nada');
  const [dl]=await Promise.all([p.waitForEvent('download',{timeout:5000}).catch(()=>null),p.click('[data-rev2mala]')]);await p.waitForTimeout(1200);
  S=await p.evaluate(()=>window.__S);const A1m=(S['estado/A1']||{}).m||{};const nMalaA1=Object.values(A1m).filter(v=>v.s==='mala').length;
  log('rev-respaldo',!!dl,dl?'se descargó '+dl.suggestedFilename():'no hubo respaldo');
  log('rev-a-mala',S['estado/A4'].m[pnB].s==='mala'&&S['estado/A4'].m[pnA].s==='quitada'&&nMalaA1>100&&S['carros/A1'].def==='mala',`A4: revisar→${S['estado/A4'].m[pnB].s}, disponible sigue ${S['estado/A4'].m[pnA].s}; A1: ${nMalaA1} dañadas, def=${S['carros/A1'].def}`);
  await p.waitForTimeout(4500);S=await p.evaluate(()=>window.__S);const inv=S['publico/inventario'];
  log('tienda-sin-rev',(inv.rev||[]).length===0&&inv.items.length===1,`publicadas ${inv.items.length}, por confirmar ${(inv.rev||[]).length}`);
  // 3) ficha: "La tengo" pasa una dañada a disponible y al carrito
  await p.evaluate(()=>document.querySelector('[data-close]')&&document.querySelector('[data-close]').click());
  await p.click('#menu-btn');await p.waitForTimeout(300);await p.click(`[data-esppn="${pnB}"]`);await p.waitForTimeout(400);
  const fichaTxt=await p.textContent('#sheet');log('ficha-esperan',/1 cliente espera esta pieza/.test(fichaTxt),'la ficha muestra quién espera');
  await p.screenshot({path:path.join(OUT,'ficha-latengo.png'),fullPage:true});
  await p.click('[data-tengo="A4"]');await p.waitForTimeout(500);S=await p.evaluate(()=>window.__S);const cart=await p.evaluate(()=>JSON.parse(localStorage.getItem('comanda')||'[]'));
  log('la-tengo',S['estado/A4'].m[pnB].s==='quitada'&&cart.some(l=>l.pn===pnB&&l.car==='A4'),`estado ${S['estado/A4'].m[pnB].s}, en carrito ${cart.length}`);
  log('app-sin-errores',!p.errs.length,p.errs.join(' | ')||'sin errores');
  // 4) tienda: pieza sin existencia → avísame
  const t=await page(b,{user:null,state:{'publico/inventario':{v:3,wa:'6140000000',cars:[{code:'A4',year:'2018',ver:'',color:'',foto:'',n:1}],items:[JSON.stringify([pnA,900,1,'A4','','Usado',0,0])],xs:[],rev:[pnB]}}});
  await t.goto(URL+'tienda.html');await t.waitForTimeout(2500);
  await t.evaluate(pn=>{const x=document.createElement('button');x.dataset.det=pn;x.hidden=true;document.body.appendChild(x);x.click()},pnB);await t.waitForTimeout(500);
  const has=await t.$('[data-avisa]');
  log('tienda-avisa-boton',!!has,has?'la pieza sin existencia trae “Avísame cuando llegue” (aunque venga en rev viejo)':'no aparece el botón');
  if(has){await t.click('[data-avisa]');await t.waitForTimeout(200);const e1=await t.textContent('#av-st');
    await t.fill('#av-n','Luis');await t.fill('#av-t','614 111 2233');await t.fill('#av-e','luis@gmail.com');await t.screenshot({path:path.join(OUT,'tienda-avisame.png'),fullPage:true});
    await t.click('[data-avisa]');await t.waitForTimeout(600);const S2=await t.evaluate(()=>window.__S);const es=Object.entries(S2).filter(([k])=>k.startsWith('esperas/')).map(([,v])=>v);
    log('tienda-avisa-valida',/nombre/.test(e1),'sin datos pide el nombre');
    log('tienda-avisa-guarda',es.length===1&&es[0].tel==='6141112233'&&es[0].pn===pnB&&Object.keys(es[0]).sort().join()==='date,email,es,name,pn,tel',JSON.stringify(es[0]||{}));
    log('tienda-avisa-listo',/Ya te vamos a avisar/.test(await t.textContent('body')),'muestra que ya quedó');}
  log('tienda-sin-errores',!t.errs.length,t.errs.join(' | ')||'sin errores');
  await b.close();const f=R.filter(r=>!r.ok);console.log(f.length?f.length+' fallas':'Todo bien');process.exit(f.length?1:0)})();
