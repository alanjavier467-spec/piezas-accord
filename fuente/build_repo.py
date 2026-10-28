"""Arma la página publicable a partir de fuente/.
Uso (desde la raíz del repositorio):  python3 fuente/build_repo.py
Lee fuente/config.json (copia de config.example.json con tus datos de Firebase)."""
import json,time,sys,os
F='fuente/'
if not os.path.exists(F+'config.json'):
    sys.exit('Falta fuente/config.json: copia fuente/config.example.json como config.json y llena tus datos de Firebase.')
C=json.load(open(F+'config.json',encoding='utf-8'));CFG=C['firebase'];OWNER=C['ownerEmail']
V=time.strftime('%Y%m%d-%H%M')
css=open(F+'app.css',encoding='utf-8').read()+open(F+'extra.css',encoding='utf-8').read()
def fill(t):return t.replace('__CSS__',css).replace('__FBCONFIG__',json.dumps(CFG)).replace('__VERSION__',V).replace('__OWNER_EMAIL__',OWNER)
open('index.html','w',encoding='utf-8').write(fill(open(F+'index.tpl.html',encoding='utf-8').read()))
open('tienda.html','w',encoding='utf-8').write(fill(open(F+'tienda.tpl.html',encoding='utf-8').read()))
open('sw.js','w').write(open(F+'sw.js').read().replace('__VERSION__',V))
open('firestore.rules','w',encoding='utf-8').write(open(F+'firestore.rules',encoding='utf-8').read().replace('__OWNER_EMAIL__',OWNER))
json.dump({'v':V},open('version.json','w'))
print(V)
