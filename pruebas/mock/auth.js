let cb=null;export const getAuth=()=>({});
export const onAuthStateChanged=(a,f)=>{cb=f;setTimeout(()=>f(window.__user===undefined?{uid:'u1',email:window.__owner||'dueno@ejemplo.com'}:window.__user),50)};
export const signInWithEmailAndPassword=async()=>{};export const createUserWithEmailAndPassword=async(a,e)=>({user:{uid:'emp'+Date.now(),email:e}});
export const sendPasswordResetEmail=async()=>{};export const signOut=async()=>{};
export const updatePassword=async()=>{};
