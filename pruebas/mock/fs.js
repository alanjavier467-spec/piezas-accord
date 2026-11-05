const S=window.__S=window.__S||{};const subs=[];const DEL='__borrar_campo__';const deepMerge=(a,b)=>{for(const k in b){if(b[k]===DEL)delete a[k];else if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==='object')deepMerge(a[k],b[k]);else a[k]=b[k]}return a};
export const deleteField=()=>DEL;
// cuenta lecturas de documentos sueltos (para comprobar que las fotos se bajan solo al verse)
window.__reads=window.__reads||{};const cnt=p=>{const c=p.split('/')[0];window.__reads[c]=(window.__reads[c]||0)+1};
const notify=()=>subs.forEach(f=>f());
export const initializeFirestore=()=>({});export const persistentLocalCache=()=>({});export const persistentMultipleTabManager=()=>({});
export const collection=(fs,p)=>({kind:'col',path:p});
export const doc=(a,b,c)=>{const p=a.kind==='col'?a.path+'/'+(b||Math.random().toString(36).slice(2)):b+'/'+c;return {kind:'doc',path:p,id:p.split('/')[1]}};
export const getDocs=async q=>{window.__queries=(window.__queries||[]).concat(q.path);let docs=Object.entries(S).filter(([k])=>k.startsWith(q.path+'/')&&k.split('/').length===2).map(([k,v])=>({id:k.split('/')[1],data:()=>v}));(q.cs||[]).forEach(c=>{if(c.w)docs=docs.filter(d=>pasa(d.data(),c.w))});return {docs}};
const OPS={'==':(a,b)=>a===b,'>':(a,b)=>a>b,'>=':(a,b)=>a>=b,'<':(a,b)=>a<b,'<=':(a,b)=>a<=b};
export const where=(f,o,v)=>({w:[f,v,o]});const pasa=(d,w)=>(OPS[w[2]]||OPS['=='])(d[w[0]],w[1]);export const orderBy=()=>({});export const limit=()=>({});
export const query=(c,...cs)=>({kind:'col',path:c.path,cs});
// metadata: window.__fromCache=true simula datos viejos de la caché del teléfono
const meta=()=>({fromCache:!!window.__fromCache,hasPendingWrites:false});
export const onSnapshot=(q,f,g)=>{if(f&&typeof f==='object')f=g;if(q.kind==='doc'){const run=()=>f({exists:()=>!!S[q.path],data:()=>S[q.path],id:q.id,metadata:meta()});subs.push(run);setTimeout(run,10);return ()=>{}}const run=()=>{let docs=Object.entries(S).filter(([k])=>k.startsWith(q.path+'/')&&k.split('/').length===2).map(([k,v])=>({id:k.split('/')[1],data:()=>v}));(q.cs||[]).forEach(c=>{if(c.w)docs=docs.filter(d=>pasa(d.data(),c.w))});f({docs,metadata:meta()})};subs.push(run);setTimeout(run,10);return ()=>{}};
export const setDoc=async(r,d,o)=>{S[r.path]=o&&o.merge?deepMerge(JSON.parse(JSON.stringify(S[r.path]||{})),JSON.parse(JSON.stringify(d))):JSON.parse(JSON.stringify(d));notify()};
export const addDoc=async(c,d)=>{const r=doc(c);await setDoc(r,d);return r};
export const deleteDoc=async r=>{delete S[r.path];notify()};
export const getDoc=async r=>{cnt(r.path);return {exists:()=>!!S[r.path],data:()=>S[r.path],id:r.id}};
export const getDocFromCache=async r=>{throw new Error('no está en la caché')};
export const writeBatch=()=>{const ops=[];return {set:(r,d,o)=>ops.push(()=>setDoc(r,d,o)),delete:r=>ops.push(()=>deleteDoc(r)),commit:async()=>{for(const o of ops)await o()}}};
export const serverTimestamp=()=>null;
// transacción: lee del "servidor" (window.__SRV si existe, si no lo mismo que el teléfono)
export const runTransaction=async(fs,fn)=>{if(window.__txError){const e=new Error('sin red');e.code=window.__txError;throw e}const ops=[];const tx={get:async r=>{const v=(window.__SRV&&r.path in window.__SRV)?window.__SRV[r.path]:S[r.path];return {exists:()=>!!v,data:()=>v,id:r.id}},set:(r,d,o)=>{ops.push(()=>setDoc(r,d,o));return tx},update:(r,d)=>{ops.push(()=>setDoc(r,d,{merge:true}));return tx},delete:r=>{ops.push(()=>deleteDoc(r));return tx}};const res=await fn(tx);for(const o of ops)await o();return res};

export const getFirestore=()=>({});
export const increment=n=>n;
