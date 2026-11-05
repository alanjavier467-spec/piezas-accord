// Pruebas de auditoría con Firebase simulado (sin internet, sin tocar producción).
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const RAIZ=path.join(__dirname,'..');const MOCK=path.join(__dirname,'mock');
const OWNER=JSON.parse(fs.readFileSync(path.join(RAIZ,'fuente','config.json'),'utf8')).ownerEmail;
const URL='http://localhost:8767/';const OUT=path.join(__dirname,'capturas');fs.mkdirSync(OUT,{recursive:true});
const R=[];const log=(k,ok,msg)=>{R.push({k,ok,msg});console.log((ok?'OK   ':'FALLA')+' '+k+' — '+msg)};
async function page(b,{user,state,ls,extra}={}){const ctx=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  for(const m of ['app','auth','firestore'])await ctx.route('https://www.gstatic.com/firebasejs/10.12.2/firebase-'+m+'.js',r=>r.fulfill({path:path.join(MOCK,(m==='firestore'?'fs':m)+'.js'),contentType:'text/javascript'}));
  const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
  await p.addInitScript(([o,u,s,l,x])=>{window.__owner=o;if(u!=='__default')window.__user=u;window.__S=s||{};Object.assign(window,x||{});for(const k in (l||{}))localStorage.setItem(k,JSON.stringify(l[k]))},[OWNER,user===undefined?'__default':user,state,ls,extra]);
  return p}
const PN='33500-TVA-A01'; // cualquiera del catálogo; se valida abajo
(async()=>{const b=await chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME}:{});
  const data=JSON.parse(fs.readFileSync(path.join(RAIZ,'data.json')));const has=pn=>data.parts.some(p=>p.pn===pn);
  const pn=has(PN)?PN:data.parts.find(p=>/faro|calavera|luz/i.test(p.es)).pn;
  const base={'carros/A1':{code:'A1',year:'2018',ver:'',color:'NH731P',def:'falta',vin:''},'config/negocio':{nombre:'Prueba'},'publico/inventario':{v:3,cars:[{code:'A1'}],items:[],xs:[]}};

  // 1) Carga como dueño
  let p=await page(b,{state:JSON.parse(JSON.stringify(base))});await p.goto(URL+'index.html?entrar');await p.waitForTimeout(2500);
  log('carga-dueño',!p.errs.length,p.errs.length?p.errs.join(' | '):'la app abre sin errores de JavaScript');
  // 2) Buscador
  const Q=['calavera','luz trasera','stop','tail light','calabera','faro','fraro','headlight','defensa','facia','fascia','parachoques','bumper','espejo','retrovisor','33100','33100TVA','tva a01','rin','undefined','salpicadera','cofre','cajuela','tapete','bocina','claxon','estereo','radio'];
  const res={};for(const q of Q){await p.fill('#q',q);await p.waitForTimeout(350);res[q]=await p.evaluate(()=>{const h=[...document.querySelectorAll('#view .hint')].map(e=>e.textContent).find(t=>/resultado/.test(t));return h?parseInt(h):0})}
  fs.writeFileSync(path.join(OUT,'busquedas.json'),JSON.stringify(res,null,1));
  const deben=['calavera','calabera','fraro','facia','estereo','retrovisor','luz trasera','tail light','tapete','bocina'];const sin=deben.filter(q=>!res[q]);
  log('buscador',!sin.length&&res.calavera<=20&&res.tapete<=30,sin.length?'sin resultados: '+sin.join(', '):JSON.stringify(res))
  await p.context().close();

  // 3) Venta de una pieza que otro ya vendió (carrito viejo en el teléfono)
  const st={...JSON.parse(JSON.stringify(base)),'estado/A1':{m:{[pn]:{s:'vendida',n:0}}}};
  p=await page(b,{state:st,ls:{comanda:[{pn,es:'Pieza de prueba',car:'A1',qty:1,price:500}]}});
  await p.goto(URL+'index.html?entrar');await p.waitForTimeout(2000);await p.click('[data-tab="carrito"]');await p.waitForTimeout(400);await p.click('[data-checkout]');await p.waitForTimeout(800);
  let S=await p.evaluate(()=>window.__S);let ventas=Object.keys(S).filter(k=>k.startsWith('ventas/'));
  log('doble-venta',ventas.length===0,ventas.length?`se registró una venta de ${pn} aunque ya estaba "vendida" con 0 piezas (estado final: ${JSON.stringify(S['estado/A1'].m[pn])})`:'la app bloqueó la venta');
  await p.screenshot({path:path.join(OUT,'doble-venta.png')});await p.context().close();

  // 4) Vender 3 cuando solo hay 1
  const st2={...JSON.parse(JSON.stringify(base)),'estado/A1':{m:{[pn]:{s:'quitada',n:1,u:'T-1'}}}};
  p=await page(b,{state:st2,ls:{comanda:[{pn,es:'Pieza de prueba',car:'A1',qty:3,price:500}]}});
  await p.goto(URL+'index.html?entrar');await p.waitForTimeout(2000);await p.click('[data-tab="carrito"]');await p.waitForTimeout(400);await p.click('[data-checkout]');await p.waitForTimeout(800);
  S=await p.evaluate(()=>window.__S);ventas=Object.entries(S).filter(([k])=>k.startsWith('ventas/'));
  log('sobreventa',!(ventas.length&&ventas[0][1].items[0].qty>1),ventas.length?`venta de ${ventas[0][1].items[0].qty} piezas con solo 1 en existencia; estado final ${JSON.stringify(S['estado/A1'].m[pn])}`:'bloqueada');
  await p.context().close();

  // 5) Vendedor: precio por línea vs tope de 10 %
  const emp={uid:'e1',email:'u123@usuarios.piezas-accord.app'};
  const st3={...JSON.parse(JSON.stringify(base)),'users/e1':{name:'Vendedor',role:'empleado',active:true},'estado/A1':{m:{[pn]:{s:'quitada',n:1}}},['precios/'+pn]:{price:5000}};
  p=await page(b,{user:emp,state:st3,ls:{comanda:[{pn,es:'Pieza de prueba',car:'A1',qty:1,price:5000}]}});
  await p.goto(URL+'index.html?entrar');await p.waitForTimeout(2000);await p.click('[data-tab="carrito"]');await p.waitForTimeout(400);
  const canEdit=await p.$('[data-lp="0"]');if(canEdit){await p.fill('[data-lp="0"]','1000');await p.dispatchEvent('[data-lp="0"]','change');await p.waitForTimeout(300)}
  await p.click('[data-checkout]');await p.waitForTimeout(800);S=await p.evaluate(()=>window.__S);ventas=Object.entries(S).filter(([k])=>k.startsWith('ventas/'));
  const v=ventas[0]&&ventas[0][1];log('vendedor-precio',!(v&&v.total<4500),v?`el vendedor cobró ${v.total} por una pieza de lista 5000 (campo de precio visible: ${!!canEdit})`:'sin venta');
  await p.context().close();

  // 6) Tienda: carga y conteo de disponibles con carro "def: esta"
  p=await page(b,{user:null,state:{'publico/inventario':{v:3,wa:'6140000000',cars:[{code:'A1',year:'2018',ver:'',color:'',foto:'',n:1}],items:[JSON.stringify([pn,500,1,'A1','','Usado',0])],xs:[],rev:[]}}});
  await p.goto(URL+'tienda.html');await p.waitForTimeout(2500);log('tienda',!p.errs.length,p.errs.length?p.errs.join(' | '):'la tienda abre sin errores');
  await p.screenshot({path:path.join(OUT,'tienda.png'),fullPage:false});await p.context().close();

  // 7) Publicación de la tienda con un carro con "def: esta" (todas las piezas del catálogo)
  const st4={...JSON.parse(JSON.stringify(base)),'carros/A1':{code:'A1',year:'2018',def:'esta',color:'NH731P'}};
  p=await page(b,{state:st4});await p.goto(URL+'index.html?entrar');await p.waitForTimeout(6500);
  S=await p.evaluate(()=>window.__S);const inv=S['publico/inventario'];const sz=Buffer.byteLength(JSON.stringify(inv||{}));
  const enc=(inv.items||[]).filter(x=>JSON.parse(x)[7]===1).length;
  log('publico-def-esta',enc===(inv.items||[]).length&&sz<900*1024,`con 1 carro "todo en el carro" se publican ${(inv.items||[]).length} piezas, ${enc} marcadas "En el carro"; documento ≈ ${Math.round(sz/1024)} KB (límite 1024 KB)`);
  await p.context().close();

  // 8) Otro teléfono ya la vendió (el servidor dice vendida; este teléfono todavía no se entera)
  const st5={...JSON.parse(JSON.stringify(base)),'estado/A1':{m:{[pn]:{s:'quitada',n:1}}}};
  p=await page(b,{state:st5,ls:{comanda:[{pn,es:'Pieza de prueba',car:'A1',qty:1,price:500}]},extra:{__SRV:{'estado/A1':{m:{[pn]:{s:'vendida',n:0}}}}}});
  await p.goto(URL+'index.html?entrar');await p.waitForTimeout(2000);await p.click('[data-tab="carrito"]');await p.waitForTimeout(400);await p.click('[data-checkout]');await p.waitForTimeout(800);
  S=await p.evaluate(()=>window.__S);ventas=Object.keys(S).filter(k=>k.startsWith('ventas/'));
  log('venta-simultanea',ventas.length===0,ventas.length?'se cobró aunque el servidor ya la tenía vendida':'bloqueada: '+await p.textContent('#co-status'));
  await p.context().close();

  // 9) Cancelar una venta: no se borra, se marca y la pieza regresa como estaba
  const st6={...JSON.parse(JSON.stringify(base)),'estado/A1':{m:{[pn]:{s:'quitada',n:1,u:'T-2'}}}};
  p=await page(b,{state:st6,ls:{comanda:[{pn,es:'Pieza de prueba',car:'A1',qty:1,price:500}]}});
  await p.goto(URL+'index.html?entrar');await p.waitForTimeout(2000);await p.click('[data-tab="carrito"]');await p.waitForTimeout(400);await p.click('[data-checkout]');await p.waitForTimeout(900);
  await p.click('[data-close]').catch(()=>{});await p.waitForTimeout(300);await p.click('[data-delsale]');await p.waitForTimeout(150);await p.click('[data-delsale]');await p.waitForTimeout(900);
  S=await p.evaluate(()=>window.__S);ventas=Object.entries(S).filter(([k])=>k.startsWith('ventas/'));const est=S['estado/A1'].m[pn];const mv=Object.keys(S).filter(k=>k.startsWith('movimientos/')).length;
  log('cancelar-venta',ventas.length===1&&ventas[0][1].cancelada===true&&est.s==='quitada'&&est.n===1&&mv>=2,`venta guardada como cancelada: ${!!(ventas[0]&&ventas[0][1].cancelada)}; pieza: ${JSON.stringify(est)}; movimientos: ${mv}`);
  await p.context().close();

  // 10) Vendedor con PIN viejo de 4: debe cambiarlo antes de trabajar; no descarga la lista de clientes
  const st7={...JSON.parse(JSON.stringify(base)),'users/e1':{name:'Vendedor',role:'empleado',active:true},'clientes/c1':{user:'pepe',name:'Pepe',tel:'6141112233'},'clientes/c2':{user:'ana',name:'Ana',tel:'6149998877'}};
  p=await page(b,{user:emp,state:st7,ls:{comanda:[{pn:'',es:'Mano de obra',car:'',qty:1,price:100}]}});await p.addInitScript(()=>{if(!sessionStorage.getItem('ya')){sessionStorage.setItem('ya','1');sessionStorage.setItem('pin4','1')}});
  await p.goto(URL+'index.html?entrar');await p.waitForTimeout(2000);
  const pide=await p.$('#pin-new');log('pin-viejo',!!pide,pide?'pide cambiar el PIN a 6 números antes de trabajar':'no pidió cambio de PIN');
  await p.evaluate(()=>sessionStorage.setItem('pin4',''));await p.reload();await p.waitForTimeout(2000);
  await p.click('[data-tab="carrito"]');await p.waitForTimeout(300);
  const cl0=await p.evaluate(()=>document.body.innerText.includes('Ana'));
  await p.fill('#cliq','614 999 8877');await p.waitForTimeout(900);const cl1=await p.evaluate(()=>document.body.innerText.includes('Ana'));
  log('clientes-privados',!cl0&&cl1,`lista completa visible: ${cl0}; encuentra a la clienta por teléfono: ${cl1}`);
  await p.context().close();

  // 11) Teléfono con datos viejos de la caché: no debe publicar la tienda
  p=await page(b,{state:JSON.parse(JSON.stringify(st4)),extra:{__fromCache:true}});await p.goto(URL+'index.html?entrar');await p.waitForTimeout(6500);
  S=await p.evaluate(()=>window.__S);log('tienda-cache',(S['publico/inventario'].items||[]).length===0,`piezas publicadas desde la caché: ${(S['publico/inventario'].items||[]).length}`);
  await p.context().close();

  // 12) Tienda: pieza que sigue montada y sin revisar sale "En el carro", no "Disponible"
  p=await page(b,{user:null,state:{'publico/inventario':{v:3,wa:'6140000000',cars:[{code:'A1',year:'2018',ver:'',color:'',foto:'',n:1}],items:[JSON.stringify([pn,500,1,'A1','','',0,1])],xs:[],rev:[]}}});
  await p.goto(URL+'tienda.html#buscar');await p.waitForTimeout(2500);
  const txt=await p.evaluate(()=>document.body.innerText);log('tienda-en-carro',/En el carro/.test(txt),/En el carro/.test(txt)?'la tienda dice "En el carro" para piezas sin desmontar':'no aparece la etiqueta');
  await p.context().close();

  // 13) Apartar una pieza: deja de estar disponible y guarda para quién y hasta cuándo
  const st8={...JSON.parse(JSON.stringify(base)),'estado/A1':{m:{[pn]:{s:'quitada',n:1,u:'T-1'}}}};
  p=await page(b,{state:st8});const resp=['Juan 6141234567','24'];p.on('dialog',d=>d.accept(resp.shift()));
  await p.goto(URL+'index.html?entrar');await p.waitForTimeout(2000);await p.fill('#q',pn);await p.waitForTimeout(500);await p.click('[data-open]');await p.waitForTimeout(600);
  await p.click('.carrow details summary');await p.click('[data-setst="apartada"]');await p.waitForTimeout(600);
  S=await p.evaluate(()=>window.__S);const ap=S['estado/A1'].m[pn];const btnAdd=await p.$('[data-add]');
  log('apartar',ap.s==='apartada'&&ap.ap&&ap.ap.q.startsWith('Juan')&&ap.n===1&&!btnAdd,`estado: ${JSON.stringify({s:ap.s,n:ap.n,q:ap.ap&&ap.ap.q})}; botón de carrito visible: ${!!btnAdd}`);
  await p.context().close();

  // 14) Accord 2021: el faro (cambió con el facelift) no se publica como disponible sin revisarlo
  const st9={...JSON.parse(JSON.stringify(base)),'carros/A1':{code:'A1',year:'2021',def:'esta',color:'NH731P'}};
  p=await page(b,{state:st9});await p.goto(URL+'index.html?entrar');await p.waitForTimeout(6500);
  S=await p.evaluate(()=>window.__S);const its=(S['publico/inventario'].items||[]).map(x=>JSON.parse(x)[0]);
  log('accord-2021',!its.includes('33100-TVA-A01')&&(S['publico/inventario'].rev||[]).includes('33100-TVA-A01'),`faro 33100-TVA-A01 publicado como disponible: ${its.includes('33100-TVA-A01')}; como "por confirmar": ${(S['publico/inventario'].rev||[]).includes('33100-TVA-A01')}`);
  await p.context().close();

  // 15) Buscador de la tienda tolerante a errores
  p=await page(b,{user:null,state:{'publico/inventario':{v:3,wa:'6140000000',cars:[{code:'A1',year:'2018'}],items:[],xs:[],rev:[]}}});
  await p.goto(URL+'tienda.html#catalogo');await p.waitForTimeout(2500);const tq=await p.$('#q');
  if(tq){await p.fill('#q','calabera');await p.waitForTimeout(900)}const tt=await p.evaluate(()=>document.body.innerText);
  log('tienda-buscador',!!tq&&/Calavera derecha/i.test(tt),tq?(/Calavera derecha/i.test(tt)?'"calabera" encuentra la calavera en la tienda':'no encontró la calavera'):'no hallé el buscador de la tienda');
  await p.context().close();

  fs.writeFileSync(path.join(OUT,'resultados.json'),JSON.stringify(R,null,1));await b.close()})().catch(e=>{console.error(e);process.exit(1)});
