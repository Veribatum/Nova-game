import {cp,mkdir,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),out=resolve(root,'dist');
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
for(const file of ['index.html','style.css','icon.svg','src','assets','vendor'])await cp(resolve(root,file),resolve(out,file),{recursive:true});
console.log('BLACKGLASS static build ready: dist/');
