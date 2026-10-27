import * as T from '../vendor/three.module.js';
import { mergeGeometries } from '../vendor/BufferGeometryUtils.js';
import { makeHumanoid, makeDrone } from './actors.js';
import { NPCS } from './content.js';
const TAU=Math.PI*2;
const G={box:new T.BoxGeometry(1,1,1),cylinder:new T.CylinderGeometry(1,1,1,16),sphere:new T.SphereGeometry(1,20,14),rock:new T.DodecahedronGeometry(1,0),torus:new T.TorusGeometry(1,.025,6,40)};
const V=new T.Vector3();
function seeded(seed){let v=seed;return()=>{v=(v*1664525+1013904223)>>>0;return v/4294967296;};}
export class World{
  constructor(scene,bank){this.scene=scene;this.bank=bank;this.materials=new Map();this.group=new T.Group();scene.add(this.group);this.textures=[];this.floors=[];this.colliders=[];this.interactables=[];this.enemies=[];this.npcs=[];this.ambient=[];this.labels=[];this.staticMeshes=[];this.bounds={x:60,z:100};this.spawn={x:0,z:10,yaw:0};this.seed=seeded(721);this.visit=0;}
  material(color,metal=.45,rough=.65,emissive=0){const key=[color,metal,rough,emissive].join(':');if(!this.materials.has(key))this.materials.set(key,new T.MeshStandardMaterial({color,metalness:metal,roughness:rough,emissive,emissiveIntensity:emissive?1:0}));return this.materials.get(key);}
  mesh(geometry,color,x,y,z,sx=1,sy=1,sz=1,opts={}){const m=typeof color==='number'?this.material(color,opts.metal??.45,opts.rough??.65,opts.glow??0):color;const mesh=new T.Mesh(geometry,m);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=opts.shadow!==false;mesh.receiveShadow=true;this.group.add(mesh);if(!opts.dynamic)this.staticMeshes.push(mesh);return mesh;}
  box(x,y,z,w,h,d,c=0x24333d,opts={}){const b=this.mesh(G.box,c,x,y,z,w,h,d,opts);if(opts.solid)this.colliders.push({x:x-w/2,z:z-d/2,w,d,height:h,maxY:y+h/2,minY:y-h/2});return b;}
  wall(x,z,w,d,h=3.8,c=0x263842){const m=this.box(x,h/2,z,w,h,d,c,{solid:true});this.box(x,.23,z,w+.03,.12,d+.03,0x101d26);this.box(x,h-.2,z,w+.04,.08,d+.04,0x425965);return m;}
  floor(x,z,w,d,c=0x25353c){this.floors.push({x:x-w/2,z:z-d/2,w,d,c});this.box(x,-.19,z,w,.36,d,c,{shadow:false});for(let a=x-w/2+4;a<x+w/2;a+=4)this.box(a,.003,z,.022,.009,d,0x14262e,{shadow:false});for(let b=z-d/2+4;b<z+d/2;b+=4)this.box(x,.004,b,w,.009,.022,0x14262e,{shadow:false});}
  strip(x,z,w,d,color=0x83dacc,y=.025){return this.box(x,y,z,w,.025,d,this.material(color,.3,.4,color),{shadow:false});}
  cylinder(x,y,z,r,h,c=0x607780,opts={}){const m=this.mesh(G.cylinder,c,x,y,z,r,h,r,opts);if(opts.solid)this.colliders.push({x:x-r,z:z-r,w:r*2,d:r*2,height:h,maxY:y+h/2,minY:y-h/2});return m;}
  light(x,y,z,color=0x79c3c4,intensity=8,distance=14){const l=new T.PointLight(color,intensity,distance,2);l.position.set(x,y,z);this.group.add(l);return l;}
  sign(text,x,y,z,width=4,color='#bce4da',rotation=0){
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#08161de8';ctx.fillRect(0,0,768,128);ctx.fillStyle=color;ctx.font='500 48px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,384,65,730);ctx.fillStyle=color+'66';ctx.fillRect(24,115,720,2);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;this.textures.push(texture);const mat=new T.MeshBasicMaterial({map:texture,transparent:true,side:T.DoubleSide,depthWrite:false});const m=new T.Mesh(new T.PlaneGeometry(width,width/6),mat);m.position.set(x,y,z);m.rotation.y=rotation;this.group.add(m);this.labels.push(m);return m;
  }
  label(text,x,y,z,color='#e2d9ba',scale=2.5){const c=document.createElement('canvas');c.width=512;c.height=80;const ctx=c.getContext('2d');ctx.font='500 26px monospace';ctx.textAlign='center';ctx.fillStyle='#071116c9';ctx.fillRect(0,0,512,80);ctx.fillStyle=color;ctx.fillText(text,256,47,490);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;this.textures.push(tx);const m=new T.SpriteMaterial({map:tx,transparent:true,depthTest:false});const s=new T.Sprite(m);s.position.set(x,y,z);s.scale.set(scale,scale*.156,1);this.group.add(s);this.labels.push(s);return s;}
  interact(id,kind,label,x,z,data={},radius=2.65){const a={id,kind,label,position:new T.Vector3(x,0,z),data,radius};this.interactables.push(a);return a;}
  terminal(x,z,label,id,kind='terminal',data={},color=0x70d1cd){
    this.box(x,.48,z,1.4,.96,.8,0x1a2e39,{solid:true});const screen=this.box(x,1.08,z-.08,1.25,.63,.065,this.material(color,.2,.3,color),{dynamic:true});screen.rotation.x=-.28;
    for(let i=0;i<4;i++)this.box(x-.47+i*.29,1.09,z-.035,.16,.025,.02,0x152e34);
    this.strip(x,z+.43,1.2,.05,color);this.sign(label,x,1.7,z,2.2);const a=this.interact(id,kind,label,x,z+.8,data);a.mesh=screen;return a;
  }
  crate(x,z,size=1.6,color=0x5c5b49){this.box(x,size/2,z,size,size,size*.8,color,{solid:true});this.box(x,size*.5,z+size*.41,size*.8,size*.8,.05,0x273a42);for(const s of [-1,1]){this.box(x+s*size*.38,size*.5,z,size*.1,size+.05,size*.85,0x7a8173);this.box(x,size*.5+s*size*.33,z,size+.04,size*.08,size*.85,0x273941);}this.strip(x,z+size*.43,size*.38,.025,0xcea969,size*.66);}
  pipe(x,z,length,axis='z',color=0x758b8d,r=.18,y=.5){const p=this.cylinder(x,y,z,r,length,color);p.rotation[axis==='z'?'x':'z']=Math.PI/2;for(let a=-length/2;a<=length/2;a+=3){const ring=this.mesh(G.torus,0x314550,x+(axis==='x'?a:0),y,z+(axis==='z'?a:0),r*1.25,r*1.25,r*1.25);ring.rotation.y=axis==='x'?Math.PI/2:0;}}
  arch(x,z,w=12,color=0x354d56){for(const s of [-1,1])this.wall(x+s*w/2,z,.6,.85,4.8,color);this.box(x,4.55,z,w+.6,.5,.85,color);this.strip(x,z,w-.8,.09,0x8fd2ce,4.24);}
  bench(x,z,rot=0){const group=new T.Group();for(const [px,py,pz,w,h,d,c] of [[0,.5,0,3,.22,.8,0x41565c],[0,.9,-.3,3,.8,.12,0x293e46],[-1,.2,0,.15,.5,.6,0x1a2a32],[1,.2,0,.15,.5,.6,0x1a2a32]]){const m=this.box(px,py,pz,w,h,d,c);this.group.remove(m);group.add(m);}group.position.set(x,0,z);group.rotation.y=rot;this.group.add(group);this.colliders.push({x:x-1.5,z:z-.5,w:3,d:1,maxY:1.3,minY:0,height:1.3});}
  door(x,z,w=3,rot=0,color=0x77c9b8){const g=new T.Group();const frame=(a,b,c,d,e,f,m)=>{const o=this.box(a,b,c,d,e,f,m);this.group.remove(o);g.add(o);};frame(-w/2,1.75,0,.25,3.5,.45,0x506670);frame(w/2,1.75,0,.25,3.5,.45,0x506670);frame(0,3.45,0,w,.25,.45,0x506670);g.position.set(x,0,z);g.rotation.y=rot;this.group.add(g);this.strip(x,z,w,.12,color);return g;}
  addNPC(key,x,z,yaw=Math.PI,route=null,female=false){const def=NPCS[key],a=makeHumanoid(def?.species||key,def?.color||0x62737b,female);a.root.position.set(x,0,z);a.root.rotation.y=yaw;this.group.add(a.root);const npc={key,actor:a,x,z,yaw,route,phase:this.seed()*10};this.npcs.push(npc);if(def){const i=this.interact('npc:'+key,'npc',def.name+' · '+def.role,x,z,{key},2.8);i.npc=npc;npc.label=this.label(def.name,x,a.height+.36,z,'#b7d0c5',2);}
    const entry=this.bank.catalog?.characters[def?.species||key];if(entry?.url){const visit=this.visit;this.bank.character(def?.species||key,false).then(model=>{if(!model)return;if(visit!==this.visit){model.dispose?.();return;}this.group.remove(npc.actor.root);model.root.position.copy(npc.actor.root.position);model.root.rotation.copy(npc.actor.root.rotation);npc.actor=model;this.group.add(model.root);}).catch(()=>{});}
    return npc;
  }
  enemy(id,type,x,z,patrol=[]){const actor=type==='drone'?makeDrone():makeHumanoid(type==='heavy'||type==='kharuun'?'kharuun':'human',type==='heavy'?0x956343:type==='kharuun'?0x70614e:0x4d6e80);actor.root.position.set(x,0,z);actor.root.rotation.y=Math.PI;this.group.add(actor.root);const e={id:`${this.zone}:${id}`,type,actor,home:new T.Vector3(x,0,z),patrol:patrol.map(p=>new T.Vector3(p[0],0,p[1])),point:0,health:type==='heavy'?170:type==='kharuun'?105:type==='drone'?65:80,maxHealth:type==='heavy'?170:type==='kharuun'?105:type==='drone'?65:80,alert:0,cooldown:1+this.seed(),lastSeen:null,searchTime:0,dead:false,phase:this.seed()*10};this.enemies.push(e);const assetKey=type==='heavy'&&this.bank.catalog?.characters.kharuunHeavy?'kharuunHeavy':type==='heavy'||type==='kharuun'?'kharuun':type==='guard'?'human':null;
    if(assetKey&&this.bank.catalog?.characters[assetKey]?.url){const visit=this.visit;this.bank.character(assetKey,true).then(model=>{if(!model)return;if(visit!==this.visit){model.dispose?.();return;}model.root.position.copy(e.actor.root.position);model.root.rotation.copy(e.actor.root.rotation);model.root.visible=!e.dead;this.group.remove(e.actor.root);e.actor=model;this.group.add(model.root);}).catch(()=>{});}return e;}
  pickup(id,x,z,type='cache'){const g=new T.Group();const box=this.box(0,.45,0,.75,.9,.55,0x3a555d,{dynamic:true});this.group.remove(box);g.add(box);const glow=this.mesh(G.sphere,this.material(0x94ead1,.2,.3,0x94ead1),0,.49,0,.13,.23,.13,{dynamic:true});this.group.remove(glow);g.add(glow);g.position.set(x,0,z);this.group.add(g);this.ambient.push({type:'pickup',mesh:glow,base:.49,group:g});const a=this.interact(`${this.zone}:${id}`,type,type==='cell'?'Intact power cell':'Supply cache',x,z,{group:g});return a;}
  sky(kharuun=false){
    const random=seeded(120);const pos=new Float32Array(1200*3);for(let i=0;i<1200;i++){const th=random()*TAU,ph=Math.acos(2*random()-1),r=280+random()*120;pos[i*3]=Math.sin(ph)*Math.cos(th)*r;pos[i*3+1]=Math.abs(Math.cos(ph))*r-20;pos[i*3+2]=Math.sin(ph)*Math.sin(th)*r;}
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));const stars=new T.Points(geo,new T.PointsMaterial({color:0xa5c5d3,size:.45,sizeAttenuation:true,fog:false}));this.group.add(stars);this.skyResources=[stars];
    const planetMat=new T.MeshStandardMaterial({color:kharuun?0x9b6246:0x3c8297,roughness:1,metalness:0,emissive:kharuun?0x3d1b12:0x102b3b,emissiveIntensity:.5,fog:false});const planet=new T.Mesh(new T.SphereGeometry(1,48,32),planetMat);planet.position.set(kharuun?-100:110,100,-190);planet.scale.setScalar(kharuun?44:66);this.group.add(planet);this.ambient.push({type:'planet',mesh:planet});
    const cloud=new T.Mesh(new T.SphereGeometry(1,40,24),new T.MeshBasicMaterial({color:kharuun?0xd0a07a:0xb0dce5,transparent:true,opacity:.13,wireframe:true,fog:false}));cloud.position.copy(planet.position);cloud.scale.setScalar(kharuun?44.8:66.4);cloud.rotation.z=.3;this.group.add(cloud);
    const ring=new T.Mesh(new T.RingGeometry(kharuun?61:85,kharuun?72:117,100),new T.MeshBasicMaterial({color:kharuun?0xb68866:0x7c9b9d,transparent:true,opacity:.3,side:T.DoubleSide,depthWrite:false,fog:false}));ring.position.copy(planet.position);ring.rotation.set(1.18,.12,.3);this.group.add(ring);
    this.skyResources.push(planet,cloud,ring);
  }
  spaceship(x,y,z,scale=1,color=0x3e5863){
    const g=new T.Group();const add=(a,b,c,w,h,d,col)=>{const m=this.box(a,b,c,w,h,d,col);this.group.remove(m);g.add(m);return m;};
    add(0,0,0,3.7,1.3,10,color);add(0,.6,-3,2.7,.8,3,0x173744);add(0,.85,-3,2.45,.16,2.5,this.material(0x6fa9ba,.6,.2,0x294e62));for(const s of [-1,1]){const wing=add(s*3,-.1,1,3.4,.3,5.2,color);wing.rotation.y=s*.19;add(s*2.4,0,3.4,1.4,1.4,3,0x223741);const thruster=add(s*2.4,0,5.02,.8,.7,.1,this.material(0x7bd2db,.1,.2,0x7bd2db));}add(0,-.8,2,2.5,.5,3.8,0x253c46);g.position.set(x,y,z);g.scale.setScalar(scale);this.group.add(g);return g;
  }
  async bulkheads(placements){const visit=this.visit;try{const prop=await this.bank.prop('bulkhead');if(!prop||visit!==this.visit)return;const raw=prop.root,bb=new T.Box3().setFromObject(raw),sz=bb.getSize(V);for(const [x,z,rot=0,w=4] of placements){const shell=new T.Group(),m=raw.clone(true);m.position.sub(bb.getCenter(new T.Vector3()));m.position.y+=sz.y/2;shell.add(m);shell.scale.set(w/(sz.x||1),3.8/(sz.y||1),.5/(sz.z||1));shell.position.set(x,0,z);shell.rotation.y=rot;this.group.add(shell);}}catch(e){console.warn('Optional bulkhead asset:',e.message);}}
  clear(){this.visit++;for(const n of this.npcs)n.actor.dispose?.();for(const e of this.enemies)e.actor.dispose?.();for(const tx of this.textures)tx.dispose();for(const m of this.labels){m.material?.dispose();m.geometry?.dispose();}for(const m of this.merged||[]){m.geometry.dispose();}for(const m of this.skyResources||[]){m.geometry.dispose();m.material.dispose();}this.scene.remove(this.group);this.group=new T.Group();this.scene.add(this.group);this.textures=[];this.labels=[];this.floors=[];this.colliders=[];this.interactables=[];this.enemies=[];this.npcs=[];this.ambient=[];this.staticMeshes=[];this.merged=[];this.seed=seeded(721);}
  optimize(){this.group.updateMatrixWorld(true);const bins=new Map();for(const mesh of this.staticMeshes){if(!mesh.parent)continue;const key=mesh.material;if(!bins.has(key))bins.set(key,[]);const g=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);bins.get(key).push(g.index?g.toNonIndexed():g);mesh.removeFromParent();}for(const [material,geos]of bins){const merged=mergeGeometries(geos);for(const g of geos)g.dispose();if(!merged)continue;const m=new T.Mesh(merged,material);m.castShadow=true;m.receiveShadow=true;this.group.add(m);this.merged.push(m);}this.staticMeshes=[];}
  build(zone,state){this.clear();this.zone=zone;this.scene.background=new T.Color(zone==='kharuun'?0x20191b:0x050e19);this.scene.fog=new T.FogExp2(zone==='kharuun'?0x6a5144:0x091b29,zone==='port'?.0045:zone==='kharuun'?.005:.006);this.sky(zone==='kharuun');this[zone]();this.optimize();for(const e of this.enemies)if(state.defeated.includes(e.id)){e.dead=true;e.actor.root.visible=false;this.pickup('loot-'+e.id,e.actor.root.position.x,e.actor.root.position.z,'loot');}for(const i of this.interactables)if(state.collected.includes(i.id)){i.data.group&&(i.data.group.visible=false);i.taken=true;}return this.spawn;}
  ship(){
    this.spawn={x:0,z:10,yaw:0};this.floor(0,3,29,38,0x263c44);this.floor(0,-22,20,14,0x34434a);
    for(const s of [-1,1]){this.wall(s*14.5,3,.55,38);this.wall(s*10,-22,.55,14);this.wall(s*12.2,-15.2,4.5,.6);this.strip(s*3.6,2,.055,35,0x638a86);this.strip(s*9.7,-22,.06,13,0x80d5ca);}
    this.wall(0,22,29,.5);this.wall(0,-29,20,.4,1.1,0x293c48);for(const x of [-9,-4,4,9])this.box(x,2.4,-29,.22,3.5,.3,0x71838a);this.box(0,4.2,-29,20,.3,.4,0x3b5361);
    for(const z of [-12,-3,7,17])this.arch(0,z,28,0x31454e);
    for(const s of [-1,1]){this.wall(s*4,12,.3,16,2.6);this.wall(s*4,-8,.3,8,2.6);this.door(s*4,2,3.4,Math.PI/2);}
    this.terminal(0,-21,'NAVIGATION','nav','navigation');this.sign('RAPSCALLION / BRIDGE',0,3.5,-28.7,12,'#d5d4b4');
    this.terminal(8,1,'WORKSHOP','workshop','shop');this.addNPC('engineer',8,-4,-.6);this.box(10,.5,8,6,1,2,0x404c49,{solid:true});for(let i=0;i<3;i++)this.crate(7+i*2,13,1.3,i%2?0x6c6554:0x3b575c);
    this.sign('ROOK’S QUESTIONABLE REPAIRS',9,2.5,17,8,'#c9ad79',Math.PI);
    this.bench(-9,4);this.bench(-9,10,Math.PI);this.cylinder(-9,.55,7,1.1,1.1,0x3d5356,{solid:true});this.strip(-9,7,1.6,.1,0xc8ab7b,1.12);
    this.addNPC('navigator',-4,-22,1.1);this.terminal(-9,-6,'CREW LOG','codex','codex');
    this.box(-10,.32,16,5,.65,2.6,0x263843,{solid:true});this.box(-10,.72,16,4.7,.25,2.3,0x6b6f65);this.interact('bunk','rest','Rest & resupply',-7.3,16,{},3);
    this.door(0,21.5,4);this.interact('airlock','travel','Disembark · Wayfarer Anchorage',0,19,{zone:'port'},3);
    this.sign('01 / CREW',-7,2.8,1,3,'#b5c7bc');this.sign('02 / ENGINEERING',7,2.8,1,4,'#b5c7bc');
    this.light(0,3.8,-20,0x8fc8db,28,22);this.light(-9,3,7,0xe7bc78,16,16);this.light(9,3,0,0x86d7c9,18,17);this.light(0,3.5,15,0xc9dcce,15,17);
    this.bulkheads([[-14.4,-5,Math.PI/2,6],[14.4,-5,Math.PI/2,6],[-14.4,13,Math.PI/2,6],[14.4,13,Math.PI/2,6]]);
    this.spaceship(-70,22,-150,2.5);this.spaceship(80,12,-100,1.5);
  }
  port(){
    this.spawn={x:0,z:36,yaw:0};this.floor(0,-7,104,104,0x293c43);
    for(const s of [-1,1]){this.wall(s*52,-7,.5,104,1.15,0x435c65);this.strip(s*51,-7,.09,103,0x8bd2cb,1.2);for(let z=-53;z<45;z+=10){this.wall(s*49,z,.6,.6,7.5,0x40565e);this.box(s*47,7.3,z,4,.2,.7,0x5b7077);this.strip(s*47,z,2.5,.1,0xf1ca87,7.15);}}
    this.wall(0,-59,104,.6,1.2);this.wall(0,45,104,.6,1.2);this.strip(-9,-7,.09,95,0x7bb4ae);this.strip(9,-7,.09,95,0x7bb4ae);for(let z=-52;z<40;z+=6)this.strip(0,z,.13,1.2,0x77958f);
    const shops=[[-30,-8,'THE EXCHANGE',0x62564a], [30,-8,'VEX / OUTFITTERS',0x31555e],[-30,-38,'LOW ORBIT / CANTEEN',0x684b46],[30,-38,'LISTENER’S GALLERY',0x424e67],[-30,23,'CARGO & CLAIMS',0x54564a],[30,23,'DOCK SERVICES',0x3d5256]];
    for(const [x,z,name,c]of shops){const s=Math.sign(x);this.box(x,3,z,22,6,19,c,{solid:true});this.box(x,6.25,z,23,.5,20,0x192e38);for(let k=0;k<4;k++)this.box(x-s*11.05,3.3,z-6+k*4,.08,2,2.8,this.material(0x91a69a,.4,.4,0x394c48));this.sign(name,x-s*11.1,5.2,z,12,'#e4c78a',-s*Math.PI/2);this.box(x-s*13,1,z,3,2,6,0x20343c,{solid:true});this.strip(x-s*14.6,z,.1,5.7,0xb9cbbb,1.8);this.box(x-s*12,5.6,z,4,.25,11,0x263c47);for(const zz of [-8,8])this.cylinder(x-s*14,2.6,z+zz,.12,5.2,0x5d7074);}
    this.addNPC('broker',-14,-8,Math.PI/2,null,true);this.addNPC('trader',14,-8,-Math.PI/2,null,true);this.addNPC('listener',14,-38,-Math.PI/2);this.addNPC('buyer',-14,-38,Math.PI/2);
    this.cylinder(0,.3,-24,4,.6,0x3b535b,{solid:true});this.cylinder(0,1.5,-24,1.2,2.8,0x1c323d,{solid:true});this.mesh(G.sphere,this.material(0x70c7c0,.2,.35,0x407f7e),0,3.4,-24,1.1,1.1,1.1,{dynamic:true});const ring=this.mesh(G.torus,this.material(0x92e1cf,.3,.4,0x92e1cf),0,3.4,-24,2.2,2.2,2.2,{dynamic:true});ring.rotation.x=.6;this.ambient.push({type:'holo',mesh:ring});this.sign('WAYFARER ANCHORAGE',0,7,-58.5,25,'#e4d8ad');this.sign('FREE PORT / NO QUESTIONS WORTH ASKING',0,4.7,-58,15,'#97b8b3');
    for(let i=0;i<15;i++){const side=i%2?-1:1,sp=['human','human','vyraen','kharuun','keshar'][i%5],z=32-i*5.5,x=side*(10+this.seed()*4);this.addNPC(sp,x,z,Math.PI,[[side*10,z-7],[side*10,z+7]],i%3===0);}
    for(const [x,z]of [[-12,12],[12,12],[-12,-27],[12,-48]])this.bench(x,z,Math.sign(x)*Math.PI/2);
    for(let i=0;i<12;i++)this.crate((i%2?-1:1)*(38+this.seed()*7),-53+this.seed()*93,1.2+this.seed()*1.2,i%2?0x7b6951:0x435b61);
    for(const s of [-1,1]){this.spaceship(s*40,9,43,1.4,0x455866);for(let i=0;i<9;i++){const h=18+this.seed()*50;this.box(s*(75+this.seed()*55),h/2,-110+i*25,14+this.seed()*15,h,15+this.seed()*10,0x142d3c);for(let j=4;j<h;j+=6)this.strip(s*(75+i*2),-110+i*25,12,.08,0x729ca9,j);}}
    this.door(0,43,5);this.interact('return-ship','travel','Board Rapscallion',0,41,{zone:'ship'},3.6);this.sign('DOCK 07 / RAPSCALLION',0,4,41,12,'#c9c8aa',Math.PI);
    this.terminal(0,25,'CONTRACT EXCHANGE','port-board','board');this.pickup('dock-cache',-43,32);
    this.light(0,7,-24,0x82c7e2,28,26);this.light(-14,4,-8,0xe3b570,20,17);this.light(14,4,-8,0x87dfd3,20,17);this.light(0,5,25,0x9fdad0,22,23);
    for(let i=0;i<5;i++){const ship=this.spaceship(-150+i*60,35+i*5,-145, .35+i*.05,0x6c7473);this.ambient.push({type:'ship',mesh:ship,speed:2+i,origin:ship.position.x});}
  }
  ufd(){
    this.spawn={x:0,z:29,yaw:0};this.floor(0,20,32,28);this.floor(0,-3,32,18);this.floor(0,-20,28,16);this.floor(17,-30,12,12);this.floor(17,-46,28,26,0x32474c);this.floor(17,-60,10,8);this.floor(0,-79,54,34,0x263d45);this.floor(21,2,10,62,0x273b42);
    this.wall(0,34,32,.5);this.wall(-16,10,.5,48);this.wall(-14,-20,.5,16);this.wall(16,27,.5,14);this.wall(18,8,.4,18);this.wall(26,2,.5,62);this.wall(16,-7,.5,10);
    this.wall(-8,-12,12,.5);this.wall(9,-12,10,.5);this.door(0,-12,4);this.wall(0,-28,22,.5);this.wall(11,-32,.5,8);this.wall(23,-28,.5,8);
    this.wall(3,-46,.5,26);this.wall(31,-46,.5,26);this.wall(7,-59,8,.5);this.wall(27,-59,8,.5);this.wall(17,-33,7,.5,1.3);this.door(17,-59,6);
    this.wall(-27,-79,.6,34,5.4);this.wall(27,-79,.6,34,5.4);this.wall(0,-96,54,.6,5.4);this.wall(-8,-62,38,.6,4.5);this.wall(25,-62,4,.6,4.5);this.door(17,-62,6);
    for(const z of [27,11,-4,-21])this.arch(0,z,29);for(const z of [-36,-46,-55])this.arch(17,z,27);this.arch(0,-72,53);this.arch(0,-89,53);
    this.strip(0,13,.07,37,0x98c9c3);this.strip(10,-20,.07,13,0xe2b474);this.strip(17,-46,.07,21,0x94d5d0);this.strip(17,-66,.07,8,0x92d4c9);
    for(const [x,z,s,c]of [[-9,22,3,0x6d6850],[-11,25,2,0x58645c],[9,17,2.8,0x6d6850],[10,23,2,0x596e71],[-8,7,2.5,0x627475],[8,-2,2,0x5d614d],[-8,-5,2,0x737262],[7,-22,1.5,0x4d5c66],[21,-71,2,0x5f6b6c],[-17,-84,3,0x5e6859],[-18,-73,2.5,0x525f68]])this.crate(x,z,s,c);
    this.terminal(-5,-18,'SECURITY ACCESS','checkpoint','checkpoint');this.sign('UFD / SECURITY',0,3.9,-12.4,12,'#b3d5dc');this.sign('MAINTENANCE →',14,2.8,6,5,'#d8b77c');this.terminal(22,-9,'SERVICE BYPASS','bypass','bypass',{},0xe4bd6d);
    const gate=this.box(22,1.65,-14,7.5,3.3,.45,0x3f5259,{dynamic:true});const gateCollider={x:18.2,z:-14.3,w:7.6,d:.6,maxY:3.3,minY:0,height:3.3,gate:true};this.colliders.push(gateCollider);this.gate={mesh:gate,collider:gateCollider,open:false};
    for(const x of [8,26]){this.cylinder(x,1.6,-46,2.8,3.2,0x7e9397,{solid:true});this.cylinder(x,3.25,-46,2.7,.18,0x314e5a);this.pipe(x,-46,16,'z',0x7c969a,.35,2.2);for(const zz of [-52,-40])this.cylinder(x+2,1.1,zz,1,2.2,0x627c81,{solid:true});}
    this.sign('THERMAL EXCHANGE / CORE ACCESS',17,4.1,-58,17,'#c2d9d0');
    this.cylinder(-5,2.4,-79,4.2,4.8,0x263e4a,{solid:true});this.cylinder(-5,5.2,-79,3.3,.8,0x6e9298);this.cylinder(-5,2.8,-79,3.4,4.7,this.material(0x6cdbdf,.3,.25,0x3e949d));
    for(const y of [1,2.5,4,5.8]){const ring=this.mesh(G.torus,this.material(0xb7d5c8,.7,.4,0x477d7d),-5,y,-79,4.5,4.5,4.5,{dynamic:true});ring.rotation.x=Math.PI/2;this.ambient.push({type:'core',mesh:ring,sign:y%2?1:-1});}
    for(const x of [-13,3])this.pipe(x,-79,24,'z',0x82989a,.32,.65);
    this.wall(14,-87,.35,10,3.1);this.wall(14,-73,.35,4,3.1);this.wall(20,-90,13,.35,3.1);this.wall(20,-71,13,.35,3.1);this.door(14,-79,3.5,Math.PI/2);this.terminal(22,-82,'ISOLATED AUDIT ARCHIVE','archive','archive');
    this.sign('CORE 03 / DO NOT INTERRUPT',-5,6.6,-91,22,'#abd9d9');this.sign('LOCAL AUDIT →',19,3.8,-70,8,'#e6ca94');
    this.door(0,32,4);this.interact('extraction','extract','Extraction airlock',0,31,{},3);this.sign('← RAPSCALLION / EXFIL',0,3,33,10,'#b8dcc6',Math.PI);
    this.pickup('cargo-cache',-11,15);this.pickup('cooling-cache',27,-55);this.pickup('core-cache',-20,-91);
    this.enemy('cargo-01','guard',-4,15,[[-4,15],[-4,3],[5,3],[5,15]]);this.enemy('loading-01','guard',6,-6,[[6,-6],[-6,-6]]);this.enemy('security-drone','drone',5,-22,[[5,-22],[-4,-22]]);this.enemy('cooling-01','guard',18,-43,[[18,-43],[18,-54]]);this.enemy('core-01','guard',9,-77,[[9,-77],[9,-90],[-15,-90]]);this.enemy('core-drone','drone',-18,-69,[[-18,-69],[-18,-86]]);
    this.light(0,4,17,0x91bcd6,24,24);this.light(0,4,-18,0xe4b578,22,19);this.light(17,4,-45,0x93c7c7,25,25);this.light(-5,5,-79,0x64d6f0,40,40);this.light(22,3,-82,0xd8c78a,13,13);
    this.bulkheads([[-15.7,17,Math.PI/2,7],[-15.7,7,Math.PI/2,7],[30.7,-46,Math.PI/2,8],[-26.6,-79,Math.PI/2,8]]);
  }
  kharuun(){
    this.spawn={x:0,z:38,yaw:0};this.floor(0,-14,108,116,0x68594a);
    const random=seeded(193);for(let i=0;i<80;i++){const side=i%2?-1:1,x=side*(36+random()*35),z=-87+random()*150,sz=3+random()*8;const rock=this.mesh(G.rock,0x6a5b4f,x,sz*.45-1,z,sz,sz*.9,sz*.8);rock.rotation.set(random(),random(),random());if(Math.abs(x)<53)this.colliders.push({x:x-sz*.65,z:z-sz*.65,w:sz*1.3,d:sz*1.3,maxY:sz,minY:0,height:sz});}
    for(const s of [-1,1]){this.pipe(s*7,-9,83,'z',0x4e6a6e,.25,.35);this.strip(s*7,-9,.06,83,0xd69c6a,.67);this.wall(s*17,-44,1.2,41,5.2,0x574e45);this.wall(s*11,-23,12,1.2,4.3,0x605749);this.door(s*8,-8,4,0,0xe1b177);}
    this.floor(0,-44,33,42,0x4f5249);this.wall(0,-65,34,1.2,5.2,0x574e45);this.door(0,-23,8,0,0xe2b379);this.sign('EMBER REACH / REFINERY',0,5.2,-23,17,'#e6c68f');
    for(const x of [-14,14])for(const z of [-36,-58]){this.cylinder(x,2,z,2,4,0x657577,{solid:true});this.cylinder(x,4.1,z,2.2,.25,0x273a3c);this.cylinder(x,2,z,2.1,.22,this.material(0xdd9560,.2,.5,0xa4522a));this.pipe(x,z+2,6,'z',0x92a5a1,.2,3.2);}
    for(const [x,z]of [[-10,14],[9,6],[-9,-10],[-8,-32],[8,-39],[-7,-52],[6,-59],[19,25],[-23,-3]])this.crate(x,z,2.1,0x76654f);
    for(let i=0;i<8;i++){const z=24-i*11;this.mesh(G.rock,0x89725d,(i%2?-1:1)*23,2,z,3.5,3,2.5);}
    this.box(0,.5,-55,5,1,3,0x393f3e,{solid:true});this.cylinder(0,1.7,-55,.75,2.1,0x8c9994,{dynamic:true});const glow=this.cylinder(0,1.75,-55,.79,.17,this.material(0xe3b668,.3,.3,0xe3b668),{dynamic:true});this.ambient.push({type:'core',mesh:glow,sign:1});this.interact('regulator','regulator','Recover thermal regulator',0,-53.2,{},3.2);
    this.terminal(-10,-60,'TRANSIT MANIFEST','kharuun-log','intel',{dossier:'regulator'},0xe2ac71);this.door(0,41,4,0,0x90d9c6);this.interact('extraction','extract','Return to Rapscallion',0,40,{},3.5);this.sign('EXTRACTION / DOCK 03',0,3.4,41,11,'#cbd6b7',Math.PI);
    this.pickup('approach-cache',-24,22);this.pickup('refinery-cache',12,-49);this.enemy('patrol-01','kharuun',-5,12,[[-5,12],[-5,-8],[5,-8]]);this.enemy('patrol-02','kharuun',12,-3,[[12,-3],[20,8]]);this.enemy('gate-01','kharuun',-8,-28,[[-8,-28],[8,-28]]);this.enemy('heavy-01','heavy',0,-43,[[0,-43],[0,-53]]);this.enemy('vault-01','kharuun',8,-57,[[8,-57],[8,-42]]);
    this.light(0,6,-47,0xe2a65f,40,35);this.light(0,4,30,0x88cccb,18,22);this.light(-16,4,-12,0xeaa965,25,25);
  }
  wreck(){
    this.spawn={x:0,z:20,yaw:0};this.floor(0,-28,26,104,0x303740);this.floor(-19,-5,18,26,0x333c41);this.floor(19,-33,18,30,0x2d3943);
    this.wall(-13,22,.6,4);this.wall(13,6,.6,30,4.3);this.wall(-13,-43,.6,75,4.3);this.wall(13,-66,.6,28,4.3);this.wall(0,24,26,.6);this.wall(0,-80,26,.6);
    this.wall(-28,-5,.6,26);this.wall(-19,8,18,.6);this.wall(-19,-18,18,.6);this.wall(28,-33,.6,30);this.wall(19,-18,18,.6);this.wall(19,-48,18,.6);
    for(const z of [17,0,-20,-43,-65,-76])this.arch(0,z,25,0x3b4853);
    this.strip(8,-26,.06,96,0xbd8b70);this.strip(-8,-26,.06,96,0x6f969e);this.sign('PEREGRINE / SURVEY OPERATIONS',0,3.8,22.8,16,'#b0b2c9');
    for(const [x,z,s]of [[-6,7,2.8],[6,-10,2],[-6,-23,2.5],[6,-39,2.8],[-6,-52,2.2],[6,-68,2.2],[-22,-9,2.5],[22,-39,2.5]])this.crate(x,z,s,0x535e61);
    for(const z of [-31,-57]){this.pipe(-11,z,14,'z',0x606d78,.25,2);this.pipe(11,z,14,'z',0x606d78,.25,2);}
    this.pickup('cell-01',-20,-2,'cell');this.pickup('cell-02',20,-32,'cell');this.pickup('cell-03',0,-70,'cell');this.terminal(20,-44,'FINAL SURVEY','survey-log','intel',{dossier:'wreck'},0xb8a4d9);this.pickup('supply-01',-22,5);
    this.door(0,23,4);this.interact('extraction','extract','Return to Rapscallion',0,21,{},3);
    this.enemy('drone-01','drone',0,-7,[[0,-7],[0,-22]]);this.enemy('drone-02','drone',16,-33,[[16,-33],[23,-33]]);this.enemy('scavenger-01','guard',-5,-42,[[-5,-42],[5,-42]]);this.enemy('drone-03','drone',0,-62,[[0,-62],[0,-73]]);
    this.light(0,4,12,0x80afb8,21,23);this.light(-19,3,-5,0xb290cf,14,22);this.light(19,3,-33,0xd4a970,14,23);this.light(0,4,-65,0x7996cc,22,24);
  }
  openGate(){if(!this.gate||this.gate.open)return;this.gate.open=true;this.gate.collider.disabled=true;this.gate.mesh.position.y=4.4;}
  onFloor(x,z,r=.32){return [[0,0],[r,0],[-r,0],[0,r],[0,-r]].every(([dx,dz])=>this.floors.some(f=>x+dx>=f.x&&x+dx<=f.x+f.w&&z+dz>=f.z&&z+dz<=f.z+f.d));}
  blocked(x,z,r=.35){return this.colliders.some(c=>!c.disabled&&x>c.x-r&&x<c.x+c.w+r&&z>c.z-r&&z<c.z+c.d+r);}
  move(position,dx,dz,r=.35){const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.25));for(let i=0;i<steps;i++){const x=position.x+dx/steps,z=position.z+dz/steps;if(this.onFloor(x,position.z,r)&&!this.blocked(x,position.z,r))position.x=x;if(this.onFloor(position.x,z,r)&&!this.blocked(position.x,z,r))position.z=z;}}
  lineBlocked(a,b,pad=0){
    const dx=b.x-a.x,dz=b.z-a.z,dy=(b.y||0)-(a.y||0);let nearest=Infinity;
    for(const c of this.colliders){if(c.disabled)continue;let t0=0,t1=1;const bounds=[[a.x,dx,c.x-pad,c.x+c.w+pad],[a.z,dz,c.z-pad,c.z+c.d+pad],[a.y||0,dy,c.minY??0,c.maxY??3]];let hit=true;for(const [v,d,min,max]of bounds){if(Math.abs(d)<1e-7){if(v<min||v>max){hit=false;break;}}else{let near=(min-v)/d,far=(max-v)/d;if(near>far)[near,far]=[far,near];t0=Math.max(t0,near);t1=Math.min(t1,far);if(t0>t1){hit=false;break;}}}if(hit&&t1>0&&t0<.995)nearest=Math.min(nearest,Math.max(.00001,t0));
    }return Number.isFinite(nearest)?nearest:false;
  }
  cameraLimit(start,end){let nearest=1;const dx=end.x-start.x,dz=end.z-start.z,dy=end.y-start.y;for(const c of this.colliders){if(c.disabled)continue;let t0=0,t1=1,hit=true;for(const[v,d,min,max]of [[start.x,dx,c.x-.18,c.x+c.w+.18],[start.z,dz,c.z-.18,c.z+c.d+.18],[start.y,dy,(c.minY??0)-.18,(c.maxY??4)+.18]]){if(Math.abs(d)<1e-7){if(v<min||v>max){hit=false;break;}}else{let a=(min-v)/d,b=(max-v)/d;if(a>b)[a,b]=[b,a];t0=Math.max(t0,a);t1=Math.min(t1,b);if(t0>t1){hit=false;break;}}}if(hit&&t0>=0&&t0<nearest)nearest=t0;}return Math.max(.22,nearest-.04);}
  nearest(position){let best=null,distance=Infinity;for(const i of this.interactables){if(i.taken)continue;if(i.npc)i.position.copy(i.npc.actor.root.position);const d=i.position.distanceTo(position);if(d<i.radius&&d<distance){const a=position.clone().setY(1),b=i.position.clone().setY(1);if(this.lineBlocked(a,b))continue;best=i;distance=d;}}return best;}
  objective(state){const c=state.contracts[state.active];if(this.zone==='ship')return this.interactables.find(i=>i.id==='nav');if(this.zone==='port')return this.interactables.find(i=>i.id==='return-ship');if(!c)return this.interactables.find(i=>i.id==='extraction');if(state.active==='audit'){return this.interactables.find(i=>i.id===(c.stage>=2?'extraction':c.stage===0?'checkpoint':'archive'));}if(state.active==='regulator')return this.interactables.find(i=>i.id===(c.stage>=2?'extraction':'regulator'));if(state.active==='salvage'){if(c.cells>=3)return this.interactables.find(i=>i.id==='extraction');return this.interactables.find(i=>i.kind==='cell'&&!i.taken);}return null;}
  update(dt,time){for(const a of this.ambient){if(a.type==='core')a.mesh.rotation.y+=dt*.4*(a.sign||1);if(a.type==='holo'){a.mesh.rotation.y+=dt*.3;a.mesh.rotation.z+=dt*.1;}if(a.type==='pickup')a.mesh.position.y=a.base+Math.sin(time*2)*.1;if(a.type==='planet')a.mesh.rotation.y+=dt*.005;if(a.type==='ship'){a.mesh.position.x+=dt*a.speed;if(a.mesh.position.x>190)a.mesh.position.x=-190;}}
    for(const n of this.npcs){let moving=false;if(n.route){const target=n.route[n.target||0],dx=target[0]-n.actor.root.position.x,dz=target[1]-n.actor.root.position.z,d=Math.hypot(dx,dz);if(d<.35)n.target=(n.target||0)+1>=n.route.length?0:n.target+1;else{this.move(n.actor.root.position,dx/d*dt*.7,dz/d*dt*.7,.25);n.actor.root.rotation.y=Math.atan2(dx,dz);moving=true;}}n.actor.update(dt,time+n.phase,moving,'walk');if(n.label)n.label.position.set(n.actor.root.position.x,n.actor.height+.36,n.actor.root.position.z);}
  }
}
