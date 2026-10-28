import json,time,sys
V=time.strftime('%Y%m%d-%H%M')
CFG={"apiKey":"AIzaSyDzuZ87H9TLq6RHyDx0Vd_K_ancv7EguhI","authDomain":"piezas-accord.firebaseapp.com","projectId":"piezas-accord","storageBucket":"piezas-accord.firebasestorage.app","messagingSenderId":"543559376331","appId":"1:543559376331:web:bb32ea7e32bf5078b12a4e"}
F='fuente/'
css=open(F+'app.css',encoding='utf-8').read()+open(F+'extra.css',encoding='utf-8').read()
h=open(F+'index.tpl.html',encoding='utf-8').read().replace('__CSS__',css).replace('__FBCONFIG__',json.dumps(CFG)).replace('__VERSION__',V)
open('index.html','w',encoding='utf-8').write(h)
open('sw.js','w').write(open(F+'sw.js').read().replace('__VERSION__',V))
open('tienda.html','w',encoding='utf-8').write(open(F+'tienda.tpl.html',encoding='utf-8').read().replace('__CSS__',css).replace('__FBCONFIG__',json.dumps(CFG)))
json.dump({'v':V},open('version.json','w'))
print(V)
