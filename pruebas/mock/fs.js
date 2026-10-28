const S=window.__S=window.__S||{};const subs=[];const deepMerge=(a,b)=>{for(const k in b){if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==='object')deepMerge(a[k],b[k]);else a[k]=b[k]}return a};
const notify=()=>subs.forEach(f=>f());
export const initializeFirestore=()=>({});export const persistentLocalCache=()=>({});export const persistentMultipleTabManager=()=>({});
export const collection=(fs,p)=>({kind:'col',path:p});
export const doc=(a,b,c)=>{const p=a.kind==='col'?a.path+'/'+(b||Math.random().toString(36).slice(2)):b+'/'+c;return {kind:'doc',path:p,id:p.split('/')[1]}};
export const getDocs=async q=>({docs:Object.entries(S).filter(([k])=>k.startsWith(q.path+'/')).map(([k,v])=>({id:k.split('/')[1],data:()=>v}))});
export const where=(f,o,v)=>({w:[f,v]});export const orderBy=()=>({});export const limit=()=>({});
export const query=(c,...cs)=>({kind:'col',path:c.path,cs});
export const onSnapshot=(q,f)=>{if(q.kind==='doc'){const run=()=>f({exists:()=>!!S[q.path],data:()=>S[q.path],id:q.id});subs.push(run);setTimeout(run,10);return ()=>{}}const run=()=>{let docs=Object.entries(S).filter(([k])=>k.startsWith(q.path+'/')&&k.split('/').length===2).map(([k,v])=>({id:k.split('/')[1],data:()=>v}));(q.cs||[]).forEach(c=>{if(c.w)docs=docs.filter(d=>d.data()[c.w[0]]===c.w[1])});f({docs})};subs.push(run);setTimeout(run,10);return ()=>{}};
export const setDoc=async(r,d,o)=>{S[r.path]=o&&o.merge?deepMerge(JSON.parse(JSON.stringify(S[r.path]||{})),JSON.parse(JSON.stringify(d))):JSON.parse(JSON.stringify(d));notify()};
export const addDoc=async(c,d)=>{const r=doc(c);await setDoc(r,d);return r};
export const deleteDoc=async r=>{delete S[r.path];notify()};
export const getDoc=async r=>({exists:()=>!!S[r.path],data:()=>S[r.path]});
export const writeBatch=()=>{const ops=[];return {set:(r,d,o)=>ops.push(()=>setDoc(r,d,o)),delete:r=>ops.push(()=>deleteDoc(r)),commit:async()=>{for(const o of ops)await o()}}};
export const serverTimestamp=()=>null;

export const getFirestore=()=>({});
export const increment=n=>n;
