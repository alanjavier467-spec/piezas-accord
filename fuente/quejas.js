// ---- Buzón de quejas y sugerencias (compartido por la tienda y la app) ----
// Botón flotante 💬 abajo a la izquierda. Cualquiera (cliente, visitante, vendedor o dueño) deja su queja,
// sugerencia o falla de la página. Se guarda en la colección "quejas"; solo los dueños/creadores la leen.
// Se arma con Quejas.init({fs,addDoc,collection,donde:'tienda'|'app',quien:()=>({rol,nombre,tel,uid}),seccion:()=>'…',wa:()=>'614…',abrirBuzon:fn|null})
const Quejas=(()=>{
  const TIPOS=[['falla','🐞','Falla de la página','Un error, algo que no funciona o se ve mal'],['trabo','⏳','Se trabó o no carga','Se quedó pensando, no abre o no guarda'],['sugerencia','💡','Sugerencia o mejora','Una idea para que la página sea mejor'],['queja','😠','Queja de pieza o servicio','No quedaste a gusto con una pieza, el trato o la entrega'],['otro','💬','Otra cosa','Lo que quieras decirnos']];
  const ERR=[];const addErr=m=>{m=String(m||'').slice(0,180);if(m&&ERR[ERR.length-1]!==m){ERR.push(m);if(ERR.length>4)ERR.shift()}};
  window.addEventListener('error',e=>addErr((e.message||'error')+(e.filename?' @'+String(e.filename).split('/').pop()+':'+e.lineno:'')));
  window.addEventListener('unhandledrejection',e=>addErr('promesa: '+((e.reason&&(e.reason.code||e.reason.message))||e.reason)));
  const h=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const LSg=(k,d)=>{try{const v=localStorage.getItem('qz_'+k);return v==null?d:JSON.parse(v)}catch(e){return d}};const LSs=(k,v)=>{try{localStorage.setItem('qz_'+k,JSON.stringify(v))}catch(e){}};
  let O=null,fab=null,box=null,tipo='';
  const css=`.qz-fab{position:fixed;left:14px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:35;display:flex;align-items:center;gap:6px;border:0;border-radius:999px;background:#15191B;color:#fff;font:600 14px/1 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:11px 14px;box-shadow:0 6px 18px rgba(0,0,0,.28);cursor:pointer}
.qz-fab .qz-ic{font-size:18px;line-height:1}.qz-fab .qz-n{background:#c8102e;color:#fff;border-radius:999px;min-width:20px;height:20px;display:inline-grid;place-items:center;font-size:12px;padding:0 5px}
.qz-fab.qz-up{bottom:calc(84px + env(safe-area-inset-bottom,0px))}
@media (max-width:420px){.qz-fab .qz-tx{display:none}.qz-fab{padding:12px}}
.qz-ov{position:fixed;inset:0;z-index:90;background:rgba(10,14,16,.55);display:flex;align-items:flex-end;justify-content:center;font:16px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#15191B}
@media (min-width:600px){.qz-ov{align-items:center}}
.qz-p{background:#fff;width:100%;max-width:520px;max-height:92vh;overflow:auto;border-radius:18px 18px 0 0;padding:18px 18px calc(18px + env(safe-area-inset-bottom,0px));box-sizing:border-box;display:grid;gap:12px}
@media (min-width:600px){.qz-p{border-radius:18px}}
.qz-hd{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.qz-hd h2{margin:0;font-size:21px}.qz-hd p{margin:4px 0 0;color:#5B6569;font-size:14px}
.qz-x{border:0;background:#ECEEEC;border-radius:999px;width:36px;height:36px;font-size:20px;cursor:pointer;flex:none}
.qz-ts{display:grid;gap:8px}.qz-t{display:flex;gap:10px;align-items:center;text-align:left;border:2px solid #D2D8D6;background:#fff;border-radius:12px;padding:10px 12px;cursor:pointer;font:inherit;color:inherit}
.qz-t b{display:block;font-size:15px}.qz-t small{color:#5B6569;font-size:13px}.qz-t .qz-e{font-size:22px}.qz-t[aria-pressed="true"]{border-color:#15191B;background:#F4F6F5;box-shadow:inset 0 0 0 1px #15191B}
.qz-f{display:grid;gap:5px;font-size:14px;font-weight:600}.qz-f input,.qz-f textarea{font:inherit;font-weight:400;border:1.5px solid #D2D8D6;border-radius:10px;padding:10px 12px;width:100%;box-sizing:border-box}.qz-f textarea{min-height:110px;resize:vertical}
.qz-two{display:grid;grid-template-columns:1fr 1fr;gap:10px}.qz-hint{color:#5B6569;font-size:13px;margin:0}
.qz-go{border:0;border-radius:12px;background:#15191B;color:#fff;font:700 16px system-ui,sans-serif;padding:14px;cursor:pointer}.qz-go:disabled{opacity:.6}
.qz-alt{display:block;text-align:center;border:1.5px solid #D2D8D6;border-radius:12px;padding:11px;color:#15191B;text-decoration:none;font-weight:600;font-size:15px;background:#fff;cursor:pointer}
.qz-st{font-size:14px;color:#b42318;min-height:1em}.qz-ok{text-align:center;padding:10px 0;display:grid;gap:10px}.qz-ok .qz-big{font-size:46px}`;
  function init(o){O=o;if(fab)return;const s=document.createElement('style');s.textContent=css;document.head.appendChild(s);
    fab=document.createElement('button');fab.type='button';fab.className='qz-fab';fab.id='qz-fab';fab.setAttribute('aria-label','Quejas y sugerencias');
    fab.innerHTML='<span class="qz-ic">💬</span><span class="qz-tx">Quejas y sugerencias</span><span class="qz-n" hidden></span>';
    fab.addEventListener('click',()=>{if(O.abrirBuzon&&O.abrirBuzon())return;abrir()});document.body.appendChild(fab);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&box)cerrar()})}
  // cnt: nuevas sin leer (solo dueños); up: subir el botón para no tapar otro botón flotante
  function pinta({cnt,up,ocultar}={}){if(!fab)return;const n=fab.querySelector('.qz-n');n.hidden=!cnt;n.textContent=cnt>99?'99+':String(cnt||0);fab.classList.toggle('qz-up',!!up);fab.hidden=!!ocultar}
  function cerrar(){if(box){box.remove();box=null;document.body.style.overflow=document.body.dataset.qzov||''}}
  function abrir(pre){const q=O.quien?O.quien():{};tipo=pre||tipo||'';if(box){box.remove();box=null}else document.body.dataset.qzov=document.body.style.overflow||'';
    document.body.style.overflow='hidden';
    box=document.createElement('div');box.className='qz-ov';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Quejas y sugerencias');
    const wa=O.wa?String(O.wa()||'').replace(/\D/g,''):'';
    box.innerHTML=`<div class="qz-p"><div class="qz-hd"><div><h2>💬 Quejas y sugerencias</h2><p>Cuéntanos lo que sea: una falla, algo que se trabó, una idea o algo que no te gustó. Lo leemos todo.</p></div><button class="qz-x" data-qzx aria-label="Cerrar">×</button></div>
     <div class="qz-ts" role="group" aria-label="¿Qué nos quieres decir?">${TIPOS.map(([k,e,t,d])=>`<button type="button" class="qz-t" data-qzt="${k}" aria-pressed="${tipo===k}"><span class="qz-e">${e}</span><span><b>${t}</b><small>${d}</small></span></button>`).join('')}</div>
     <label class="qz-f">Cuéntanos qué pasó<textarea id="qz-tx" maxlength="1000" placeholder="Ej. Le di a “Agregar a mi cotización” y no hizo nada. / Me gustaría que tuvieran…">${h(LSg('borrador',''))}</textarea></label>
     <div class="qz-two"><label class="qz-f">Tu nombre <span class="qz-hint">(opcional)</span><input id="qz-n" maxlength="60" autocomplete="name" value="${h(q.nombre||LSg('n',''))}"></label>
     <label class="qz-f">Tu WhatsApp <span class="qz-hint">(opcional)</span><input id="qz-w" inputmode="tel" maxlength="20" autocomplete="tel" value="${h(q.tel||LSg('w',''))}" placeholder="10 números"></label></div>
     <p class="qz-hint">Si nos dejas tu WhatsApp te contestamos cuando lo revisemos. Junto con tu mensaje se manda en qué parte de la página estabas y qué teléfono o navegador usas, para encontrar la falla más rápido.</p>
     <button class="qz-go" data-qzgo>Enviar</button><div class="qz-st" id="qz-st" aria-live="polite"></div>
     ${wa?`<a class="qz-alt" target="_blank" rel="noopener" href="https://wa.me/52${wa.slice(-10)}?text=${encodeURIComponent('Hola, les escribo de la página de Yonke Chihuahua.')}">¿Es urgente? Escríbenos por WhatsApp</a>`:''}</div>`;
    box.addEventListener('click',e=>{if(e.target===box){cerrar();return}const t=e.target.closest('button');if(!t)return;
      if('qzx' in t.dataset){cerrar();return}
      if(t.dataset.qzt){tipo=t.dataset.qzt;box.querySelectorAll('[data-qzt]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.qzt===tipo));return}
      if('qzgo' in t.dataset){enviar(t);return}
      if('qzotra' in t.dataset){tipo='';abrir();return}});
    box.querySelector('#qz-tx').addEventListener('input',e=>LSs('borrador',e.target.value));
    document.body.appendChild(box);if(!tipo)box.querySelector('[data-qzt]').focus();else box.querySelector('#qz-tx').focus()}
  async function enviar(btn){const st=box.querySelector('#qz-st');const tx=box.querySelector('#qz-tx').value.trim(),nombre=box.querySelector('#qz-n').value.trim(),tel=box.querySelector('#qz-w').value.replace(/\D/g,'').slice(-10);
    st.style.color='#b42318';
    if(!tipo){st.textContent='Elige qué nos quieres decir (arriba).';return}
    if(tx.length<3){st.textContent='Escribe qué pasó, aunque sea poquito.';return}
    if(tel&&tel.length!==10){st.textContent='Tu WhatsApp debe tener 10 números (o déjalo vacío).';return}
    const ult=LSg('ult',0);if(Date.now()-ult<20000){st.textContent='Espera unos segundos antes de mandar otra.';return}
    const q=O.quien?O.quien():{};
    const d={tipo,texto:tx.slice(0,1000),nombre:nombre.slice(0,60),tel,donde:O.donde,rol:String(q.rol||'visitante').slice(0,20),seccion:String(O.seccion?O.seccion():location.hash||'').slice(0,80),
      equipo:String(navigator.userAgent||'').slice(0,200)+' · '+innerWidth+'x'+innerHeight,ver:String(O.ver||'').slice(0,20),err:ERR.join(' | ').slice(0,600),uid:String(q.uid||''),date:new Date().toISOString()};
    btn.disabled=true;st.style.color='#5B6569';st.textContent='Enviando…';
    const p=O.addDoc(O.collection(O.fs,'quejas'),d);
    const r=await Promise.race([p.then(()=>'ok',e=>e),new Promise(r=>setTimeout(()=>r('lento'),9000))]);
    if(r!=='ok'&&r!=='lento'){btn.disabled=false;st.style.color='#b42318';st.textContent='No se pudo mandar. Revisa tu señal e inténtalo otra vez.';console.warn(r);return}
    LSs('ult',Date.now());LSs('borrador','');if(nombre)LSs('n',nombre);if(tel)LSs('w',tel);tipo='';
    box.querySelector('.qz-p').innerHTML=`<div class="qz-ok"><div class="qz-big">🙌</div><h2 style="margin:0">¡Gracias! Ya nos llegó</h2>
      <p class="qz-hint" style="font-size:15px">${r==='lento'?'Tu señal está lenta: se termina de mandar sola en cuanto tengas internet (no cierres la página). ':''}Lo vamos a revisar${tel?' y te escribimos a tu WhatsApp':''}.</p>
      <button class="qz-go" data-qzx>Listo</button><button class="qz-alt" data-qzotra>Mandar otra</button></div>`}
  return {init,abrir,cerrar,pinta,TIPOS}})();
