// Reproduce el cobro del 7-nov: piezas de carro cambiadas a "Quitada", piezas nuevas de bodega y concepto libre.
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');const {spawn}=require('child_process');
const RAIZ=path.join(__dirname,'..');const MOCK=path.join(__dirname,'mock');
const OWNER=JSON.parse(fs.readFileSync(path.join(RAIZ,'fuente','config.json'),'utf8')).ownerEmail;
const URL='http://localhost:8768/';
(async()=>{const srv=spawn('python3',['-m','http.server','8768'],{cwd:RAIZ,stdio:'ignore'});await new Promise(r=>setTimeout(r,800));
  const b=await chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME}:{});let fallas=0;
  const data=JSON.parse(fs.readFileSync(path.join(RAIZ,'data.json')));const pn=data.parts.find(p=>/faro/i.test(p.es)).pn;const pn2=data.parts.find(p=>/calavera/i.test(p.es)).pn;
  async function caso(nombre,{state,cart,extra,check}){const ctx=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
    for(const m of ['app','auth','firestore'])await ctx.route('https://www.gstatic.com/firebasejs/10.12.2/firebase-'+m+'.js',r=>r.fulfill({path:path.join(MOCK,(m==='firestore'?'fs':m)+'.js'),contentType:'text/javascript'}));
    const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
    await p.addInitScript(([o,s,c,x])=>{window.__owner=o;window.__S=s;localStorage.setItem('comanda',JSON.stringify(c));Object.assign(window,x||{})},[OWNER,state,cart,extra]);
    await p.goto(URL+'index.html?entrar');await p.waitForTimeout(2000);if(errs.length)console.log("JS:",errs);await p.click('[data-tab="carrito"]',{timeout:5000});await p.waitForTimeout(400);
    const r=await check(p);await p.screenshot({path:path.join(__dirname,'capturas',nombre+'.png'),fullPage:true});
    const ok=r.ok&&!errs.length;if(!ok)fallas++;console.log((ok?'OK   ':'FALLA')+' '+nombre+' — '+r.msg+(errs.length?' | errores JS: '+errs.join(' | '):''));await ctx.close()}
  const base={'carros/A1':{code:'A1',year:'2018',ver:'',color:'NH731P',def:'revisar',vin:''},'carros/A2':{code:'A2',year:'2019',ver:'',color:'NH731P',def:'esta',vin:''},'config/negocio':{nombre:'Prueba'},'publico/inventario':{v:3,cars:[{code:'A1'}],items:[],xs:[]},
    'estado/A1':{m:{[pn]:{s:'quitada',n:1}}},
    'extras/X1':{name:'Faro nuevo bodega',qty:2,status:'disponible',price:900,date:'2026-11-06'}};
  const cart=[{pn,es:'Faro',car:'A1',qty:1,price:'1500',lista:'1500'},{pn:pn2,es:'Calavera',car:'A2',qty:1,price:'800',lista:'800'},{pn:'',xid:'X1',es:'Faro nuevo bodega',car:'',qty:1,price:900,lista:900},{pn:'',es:'Mano de obra',car:'',qty:1,price:'600'}];
  fs.mkdirSync(path.join(__dirname,'capturas'),{recursive:true});
  await caso('cobro-mixto',{state:JSON.parse(JSON.stringify(base)),cart,check:async p=>{await p.fill('#cliq','Cliente Con Honda negro');await p.waitForTimeout(500);await p.click('[data-checkout]');await p.waitForTimeout(1200);
    const S=await p.evaluate(()=>window.__S);const v=Object.keys(S).filter(k=>k.startsWith('ventas/'));const msg=await p.evaluate(()=>{const e=document.querySelector('#co-status');return e?e.textContent:''});
    return {ok:v.length===1,msg:v.length?'venta guardada; faro A1 → '+JSON.stringify(S['estado/A1'].m[pn])+'; bodega X1 → '+JSON.stringify({q:S['extras/X1'].qty,s:S['extras/X1'].status}):'NO se guardó: "'+msg+'"'}}});

  // la confirmación con el servidor falla por una razón rara: la venta no se pierde y queda anotado el motivo
  await caso('cobro-error-raro',{state:JSON.parse(JSON.stringify(base)),cart,extra:{__txError:'internal'},check:async p=>{await p.click('[data-checkout]');await p.waitForTimeout(1200);
    const S=await p.evaluate(()=>window.__S);const v=Object.keys(S).filter(k=>k.startsWith('ventas/'));return {ok:v.length===1&&/internal/.test(S[v[0]].txErr||''),msg:v.length?'venta guardada; motivo anotado: '+S[v[0]].txErr:'no se guardó'}}});
  // pieza "Por revisar": se avisa en el carrito y se arregla ahí mismo
  const st3=JSON.parse(JSON.stringify(base));delete st3['estado/A1'];
  await caso('pendiente-en-carrito',{state:st3,cart:[cart[0]],check:async p=>{const aviso=await p.evaluate(()=>(document.querySelector('.lwarn')||{}).textContent||'');await p.locator('.ticket').screenshot({path:path.join(__dirname,'capturas','aviso-pendiente.png')});
    await p.click('[data-fixst]');await p.waitForTimeout(400);const aviso2=await p.evaluate(()=>!!document.querySelector('.lwarn'));await p.click('[data-checkout]');await p.waitForTimeout(1200);
    const S=await p.evaluate(()=>window.__S);const v=Object.keys(S).filter(k=>k.startsWith('ventas/'));return {ok:/Por revisar/.test(aviso)&&!aviso2&&v.length===1,msg:'aviso: "'+aviso+'" → tras marcar Quitada: '+(aviso2?'sigue':'desaparece')+'; venta '+(v.length?'guardada':'NO guardada')}}});
  // nuevo cliente desde el carrito, con color y versión, y se le suman puntos
  await caso('nuevo-cliente',{state:JSON.parse(JSON.stringify(base)),cart:[cart[2]],check:async p=>{await p.fill('#cliq','Cliente Con Honda negro');await p.waitForTimeout(500);await p.click('[data-newcli]');
    await p.fill('#nc-tel','6141234567');await p.selectOption('#nc-color','NH731P');await p.selectOption('#nc-ver','18');await p.fill('#nc-desc','Sport, pidió faro');await p.locator('#nc-name').scrollIntoViewIfNeeded();await p.locator('#nc-name').locator('xpath=../..').screenshot({path:path.join(__dirname,'capturas','form-nuevo-cliente.png')});await p.click('[data-savecli]');await p.waitForTimeout(500);
    const elegido=await p.evaluate(()=>(document.querySelector('[data-unpickcli]')||{}).parentElement?.textContent||'');await p.click('[data-checkout]');await p.waitForTimeout(1200);
    const S=await p.evaluate(()=>window.__S);const ck=Object.keys(S).find(k=>k.startsWith('clientes/'));const v=Object.keys(S).filter(k=>k.startsWith('ventas/'));const c=ck?S[ck]:{};
    return {ok:c.name==='Cliente Con Honda negro'&&c.color==='NH731P'&&c.ver==='18'&&v.length===1&&S[v[0]].cliId===ck.split('/')[1],msg:'cliente '+JSON.stringify({name:c.name,tel:c.tel,color:c.color,ver:c.ver,puntos:c.puntos})+' · en pantalla: '+elegido.replace(/\s+/g,' ').slice(0,90)}}});
  await b.close();srv.kill();process.exit(fallas?1:0)})();
