import json,shutil,os,time
V=time.strftime('%Y%m%d-%H%M')
CFG={"apiKey":"AIzaSyDzuZ87H9TLq6RHyDx0Vd_K_ancv7EguhI","authDomain":"piezas-accord.firebaseapp.com","projectId":"piezas-accord","storageBucket":"piezas-accord.firebasestorage.app","messagingSenderId":"543559376331","appId":"1:543559376331:web:bb32ea7e32bf5078b12a4e"}
css=open('app.css',encoding='utf-8').read()+open('extra.css',encoding='utf-8').read()
h=open('index.tpl.html',encoding='utf-8').read().replace('__CSS__',css).replace('__FBCONFIG__',json.dumps(CFG)).replace('__VERSION__',V)
os.makedirs('public',exist_ok=True)
open('public/index.html','w',encoding='utf-8').write(h)
open('public/sw.js','w').write(open('sw.js').read().replace('__VERSION__',V))
for f in ['manifest.webmanifest','icon-192.png','icon-512.png']: shutil.copy(f,'public/'+f)
shutil.copy('/home/claude/app/data.json','public/data.json')
for sub in ['p','d']:
    if os.path.exists('public/'+sub): shutil.rmtree('public/'+sub)
    shutil.copytree('/home/claude/app/out/'+sub,'public/'+sub)
open('public/.nojekyll','w').write('')
t=open('tienda.tpl.html',encoding='utf-8').read().replace('__CSS__',css).replace('__FBCONFIG__',json.dumps(CFG))
open('public/tienda.html','w',encoding='utf-8').write(t)
print(V)
