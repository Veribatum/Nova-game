import * as T from '../vendor/three.module.js';
import { mergeGeometries } from '../vendor/BufferGeometryUtils.js';
import { makeHumanoid, makeDrone } from './actors.js?v=2';
import { NPCS } from './content.js?v=2';
import {compileLayout,FACILITY,SHIP,WRECK,REFINERY,PORT_DOCK} from './architecture.js?v=2';
const TAU=Math.PI*2;
const G={box:new T.BoxGeometry(1,1,1),cylinder:new T.CylinderGeometry(1,1,1,16),sphere:new T.SphereGeometry(1,20,14),rock:new T.DodecahedronGeometry(1,0),torus:new T.TorusGeometry(1,.025,6,40)};
const V=new T.Vector3();
function seeded(seed){let v=seed;return()=>{v=(v*1664525+1013904223)>>>0;return v/4294967296;};}
export class World{
  constructor(scene,bank){this.scene=scene;this.bank=bank;this.materials=new Map();this.group=new T.Group();scene.add(this.group);this.textures=[];this.floors=[];this.colliders=[];this.interactables=[];this.enemies=[];this.npcs=[];this.ambient=[];this.labels=[];this.staticMeshes=[];this.bounds={x:60,z:100};this.spawn={x:0,z:10,yaw:0};this.seed=seeded(721);this.visit=0;this.rooms=[];this.portals=[];this.ceilings=[];this.structuralWalls=[];this.localLights=[];this.transientMaterials=[];}
  material(color,metal=.45,rough=.65,emissive=0){const key=[color,metal,rough,emissive].join(':');if(!this.materials.has(key))this.materials.set(key,new T.MeshStandardMaterial({color,metalness:metal,roughness:rough,emissive,emissiveIntensity:emissive?1:0}));return this.materials.get(key);}
  mesh(geometry,color,x,y,z,sx=1,sy=1,sz=1,opts={}){const m=typeof color==='number'?this.material(color,opts.metal??.45,opts.rough??.65,opts.glow??0):color;const mesh=new T.Mesh(geometry,m);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=opts.shadow!==false;mesh.receiveShadow=true;this.group.add(mesh);if(!opts.dynamic)this.staticMeshes.push(mesh);return mesh;}
  box(x,y,z,w,h,d,c=0x24333d,opts={}){const b=this.mesh(G.box,c,x,y,z,w,h,d,opts);if(opts.solid)this.colliders.push({x:x-w/2,z:z-d/2,w,d,height:h,maxY:y+h/2,minY:y-h/2});return b;}
  wall(x,z,w,d,h=3.8,c=0x263842){const m=this.box(x,h/2,z,w,h,d,c,{solid:true});this.box(x,.23,z,w+.03,.12,d+.03,0x101d26);this.box(x,h-.2,z,w+.04,.08,d+.04,0x425965);return m;}
  floor(x,z,w,d,c=0x25353c){this.floors.push({x:x-w/2,z:z-d/2,w,d,c});this.box(x,-.19,z,w,.36,d,c,{shadow:false});for(let a=x-w/2+4;a<x+w/2;a+=4)this.box(a,.003,z,.022,.009,d,0x14262e,{shadow:false});for(let b=z-d/2+4;b<z+d/2;b+=4)this.box(x,.004,b,w,.009,.022,0x14262e,{shadow:false});}
  strip(x,z,w,d,color=0x83dacc,y=.025){return this.box(x,y,z,w,.025,d,this.material(color,.3,.4,color),{shadow:false});}
  cylinder(x,y,z,r,h,c=0x607780,opts={}){const m=this.mesh(G.cylinder,c,x,y,z,r,h,r,opts);if(opts.solid)this.colliders.push({x:x-r,z:z-r,w:r*2,d:r*2,height:h,maxY:y+h/2,minY:y-h/2});return m;}
  light(x,y,z,color=0x79c3c4,intensity=8,distance=14){const l=new T.PointLight(color,intensity,distance,2);l.position.set(x,y,z);this.group.add(l);this.localLights.push(l);return l;}
  sign(text,x,y,z,width=4,color='#bce4da',rotation=0){
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#08161de8';ctx.fillRect(0,0,768,128);ctx.fillStyle=color;ctx.font='500 48px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,384,65,730);ctx.fillStyle=color+'66';ctx.fillRect(24,115,720,2);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;this.textures.push(texture);const mat=new T.MeshBasicMaterial({map:texture,transparent:true,side:T.FrontSide,depthWrite:false});const m=new T.Mesh(new T.PlaneGeometry(width,width/6),mat);m.position.set(x,y,z);m.rotation.y=rotation;this.group.add(m);this.labels.push(m);return m;
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
  architecture(plan) {
    const layout = compileLayout(plan);
    this.rooms.push(...layout.rooms);
    this.portals.push(...layout.portals);
    this.structuralWalls.push(...layout.walls);
    for (const room of layout.rooms) {
      this.floor(room.x, room.z, room.w, room.d, room.floor);
      this.ceiling(room);
    }
    for (const wall of layout.walls) {
      const horizontal = wall.axis === 'x', length = wall.end - wall.start;
      const x = horizontal ? (wall.start + wall.end) / 2 : wall.line;
      const z = horizontal ? wall.line : (wall.start + wall.end) / 2;
      const width = horizontal ? length : .6, depth = horizontal ? .6 : length;
      this.box(x, (wall.minY + wall.maxY) / 2, z, width,
        wall.maxY - wall.minY, depth, wall.color, {solid:true});
      if (wall.minY === 0) {
        this.box(x, .15, z, width + .025, .24, depth + .025, 0x152932);
        this.box(x, 1.02, z, width + .04, .06, depth + .04, 0x688086);
      }
    }
    for (const portal of layout.portals) this.fittedPortal(portal, layout.rooms);
    return layout;
  }
  ceiling(room) {
    const h = room.height;
    const roof = this.box(room.x, h + .18, room.z, room.w, .36, room.d,
      this.material(0x25323a, .25, .85));
    roof.userData.batchRole = 'roof';
    const collider = {x:room.minX,z:room.minZ,w:room.w,d:room.d,
      minY:h,maxY:h+.36,height:.36,blocksMovement:false,ceiling:true};
    this.colliders.push(collider);
    this.ceilings.push({...collider,room:room.id});
    for (let z=room.minZ+3; z<room.maxZ-1; z+=6) {
      this.box(room.x,h-.16,z,room.w,.28,.32,0x415660);
      const fixtureWidth=Math.min(room.w-1.2,5.5);
      this.box(room.x,h-.32,z,fixtureWidth,.12,.55,0x142b34);
      this.box(room.x,h-.39,z,fixtureWidth-.3,.025,.34,
        this.material(0xc9e4d8,.2,.45,0xc9e4d8),{shadow:false});
    }
    const count=room.d>25?2:1;
    for(let i=0;i<count;i++) {
      const z=room.z+(i-(count-1)/2)*Math.min(14,room.d*.45);
      this.light(room.x,h-.7,z,this.zone==='wreck'?0x9bb8c8:this.zone==='ship'?0xd8d1b0:0xb8d8dd,
        room.height>7?95:55,Math.max(16,Math.min(27,room.w+8)));
    }
  }
  fittedPortal(portal,rooms) {
    const {x,z,width,height,base,axis}=portal, yaw=axis==='x'?0:Math.PI/2;
    const root=new T.Group();root.position.set(x,0,z);root.rotation.y=yaw;this.group.add(root);
    const attach=(px,py,pz,w,h,d,color,solid=false,dynamic=false)=>{
      const m=this.box(px,py,pz,w,h,d,color,{dynamic});
      this.group.remove(m);root.add(m);
      if(solid){
        const wx=x+(axis==='x'?px:pz),wz=z+(axis==='x'?pz:-px);
        this.colliders.push({x:wx-(axis==='x'?w:d)/2,z:wz-(axis==='x'?d:w)/2,
          w:axis==='x'?w:d,d:axis==='x'?d:w,minY:py-h/2,maxY:py+h/2,height:h,portal:portal.id});
      }
      return m;
    };
    const color=portal.color||0x8bd7ce;
    if(portal.window){
      for(const sign of [-1,1])attach(sign*(width/2-.06),base+height/2,0,.12,height,.64,0x71878b);
      attach(0,base+.05,0,width,.1,.64,0x71878b);
      attach(0,base+height-.05,0,width,.1,.64,0x71878b);
      const glass=new T.MeshStandardMaterial({color:0x82b4c7,metalness:.25,roughness:.2,
        transparent:true,opacity:.16,side:T.DoubleSide,depthWrite:false});
      this.transientMaterials.push(glass);
      attach(0,base+height/2,0,width-.2,height-.1,.08,glass);
      this.colliders.push({x:x-(axis==='x'?width:.18)/2,z:z-(axis==='x'?.18:width)/2,
        w:axis==='x'?width:.18,d:axis==='x'?.18:width,minY:base,maxY:base+height,height,seeThrough:true,portal:portal.id});
      for(let at=-width/2+3;at<width/2-1;at+=3)attach(at,base+height/2,0,.12,height,.15,0x5c7782);
      return;
    }
    for(const sign of [-1,1]) {
      attach(sign*(width/2-.08),height/2,0,.16,height,.7,0x84989b,true);
      attach(sign*(width/2-.13),height/2,.365,.035,height-.25,.025,
        this.material(color,.3,.4,color));
      attach(sign*(width/2-.13),height/2,-.365,.035,height-.25,.025,
        this.material(color,.3,.4,color));
    }
    attach(0,height-.1,0,width,.2,.7,0x84989b,true);
    this.strip(x,z,axis==='x'?width:.12,axis==='x'?.12:width,color);
    if(portal.closed){
      const panels=[];
      for(const sign of [-1,1]) {
        const panel=attach(sign*width/4,(height-.2)/2,0,width/2-.02,height-.2,.18,0x354d58,false,true);
        panels.push(panel);
        const stripe=new T.Mesh(G.box,this.material(color,.3,.4,color));stripe.scale.set(width*.27,.055,.025);stripe.position.set(0,0,.11);panel.add(stripe);
      }
      const collider={x:x-(axis==='x'?width:.24)/2,z:z-(axis==='x'?.24:width)/2,
        w:axis==='x'?width:.24,d:axis==='x'?.24:width,minY:0,maxY:height,height,gate:!!portal.gate,portal:portal.id};
      this.colliders.push(collider);
      if(portal.gate)this.gate={panels,collider,open:false,width};
    }
    const a=rooms.find(r=>r.id===portal.a), b=rooms.find(r=>r.id===portal.b);
    const facingA=axis==='x'?a.z>z:a.x>x;
    const frontName=portal.label||(facingA?b?.name:a?.name)||a.name;
    const backName=portal.label||(facingA?a?.name:b?.name)||a.name;
    const available=Math.min(a.height,b?.height??a.height)-height;
    const headerY=height+available/2, textWidth=Math.min(6,width+1.3,(available-.12)*6);
    // Each face has its own front-facing text; lettering never mirrors through a sign.
    this.sign(frontName.toUpperCase(),x+(axis==='z'?.34:0),headerY,z+(axis==='x'?.34:0),textWidth,'#c6ded6',yaw);
    this.sign(backName.toUpperCase(),x-(axis==='z'?.34:0),headerY,z-(axis==='x'?.34:0),textWidth,'#c6ded6',yaw+Math.PI);
  }
  illuminate(position) {
    const nearby=[...this.localLights].sort((a,b)=>a.position.distanceToSquared(position)-b.position.distanceToSquared(position)).slice(0,8);
    for(const light of this.localLights)light.visible=nearby.includes(light);
  }
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
  clear(){this.visit++;for(const n of this.npcs)n.actor.dispose?.();for(const e of this.enemies)e.actor.dispose?.();for(const tx of this.textures)tx.dispose();for(const m of this.transientMaterials)m.dispose();for(const m of this.labels){m.material?.dispose();m.geometry?.dispose();}for(const m of this.merged||[]){m.geometry.dispose();}for(const m of this.skyResources||[]){m.geometry.dispose();m.material.dispose();}this.scene.remove(this.group);this.group=new T.Group();this.scene.add(this.group);this.textures=[];this.labels=[];this.floors=[];this.colliders=[];this.interactables=[];this.enemies=[];this.npcs=[];this.ambient=[];this.staticMeshes=[];this.merged=[];this.seed=seeded(721);this.rooms=[];this.portals=[];this.ceilings=[];this.structuralWalls=[];this.localLights=[];this.transientMaterials=[];this.gate=null;}
  optimize() {
    this.group.updateMatrixWorld(true);
    const bins=new Map();
    for(const mesh of this.staticMeshes) {
      if(!mesh.parent)continue;
      const role=mesh.userData.batchRole||'structure';
      if(!bins.has(mesh.material))bins.set(mesh.material,new Map());
      const roles=bins.get(mesh.material);
      if(!roles.has(role))roles.set(role,[]);
      const source=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
      const baked=source.index?source.toNonIndexed():source;
      if(baked!==source)source.dispose();
      roles.get(role).push(baked);mesh.removeFromParent();
    }
    for(const [material,roles]of bins)for(const [role,geos]of roles) {
      const merged=mergeGeometries(geos);for(const g of geos)g.dispose();
      if(!merged)continue;
      const m=new T.Mesh(merged,material);m.castShadow=true;m.receiveShadow=true;
      m.userData.batchRole=role;this.group.add(m);this.merged.push(m);
    }
    this.staticMeshes=[];
  }
  build(zone,state){this.clear();this.zone=zone;this.scene.background=new T.Color(zone==='kharuun'?0x20191b:0x050e19);this.scene.fog=new T.FogExp2(zone==='kharuun'?0x6a5144:0x091b29,zone==='port'?.0045:zone==='kharuun'?.005:.006);this.sky(zone==='kharuun');this[zone]();this.optimize();for(const e of this.enemies)if(state.defeated.includes(e.id)){e.dead=true;e.actor.root.visible=false;this.pickup('loot-'+e.id,e.actor.root.position.x,e.actor.root.position.z,'loot');}for(const i of this.interactables)if(state.collected.includes(i.id)){i.data.group&&(i.data.group.visible=false);i.taken=true;}return this.spawn;}
  ship() {
    this.spawn={x:0,z:10,yaw:0};
    this.architecture(SHIP);
    this.strip(-3.2,3,.06,35,0xa4bfad);this.strip(3.2,3,.06,35,0xa4bfad);
    this.terminal(0,-21,'NAVIGATION','nav','navigation');
    this.sign('RAPSCALLION / BRIDGE',0,3.5,-27.64,12,'#d5d4b4');
    this.terminal(8,1,'WORKSHOP','workshop','shop');this.addNPC('engineer',8,-4,-.6);
    this.box(10,.5,8,6,1,2,0x404c49,{solid:true});
    for(let i=0;i<3;i++)this.crate(7+i*2,13,1.3,i%2?0x6c6554:0x3b575c);
    this.sign('ROOK’S QUESTIONABLE REPAIRS',9,2.5,21.64,8,'#c9ad79',Math.PI);
    this.bench(-9,4);this.bench(-9,10,Math.PI);
    this.cylinder(-9,.55,7,1.1,1.1,0x3d5356,{solid:true});
    this.strip(-9,7,1.6,.1,0xc8ab7b,1.12);
    this.addNPC('navigator',-4,-22,1.1);this.terminal(-9,-6,'CREW LOG','codex','codex');
    this.box(-10,.32,16,5,.65,2.6,0x263843,{solid:true});
    this.box(-10,.72,16,4.7,.25,2.3,0x6b6f65);
    this.interact('bunk','rest','Rest & resupply',-7.3,16,{},3);
    this.interact('airlock','travel','Disembark · Wayfarer Anchorage',0,19,{zone:'port'},3);
    for(const x of [-7,7]){
      this.box(x,.55,-24,2.4,1.1,1.3,0x243d47,{solid:true});
      this.box(x,1.13,-24,2.2,.06,1.05,this.material(0x5e9ba9,.4,.5,0x274e59));
    }
    this.bulkheads([[-14.15,-5,Math.PI/2,6],[14.15,-5,Math.PI/2,6],[-14.15,13,Math.PI/2,6],[14.15,13,Math.PI/2,6]]);
    this.spaceship(-70,22,-150,2.5);this.spaceship(80,12,-100,1.5);
  }
  port(){
    this.spawn={x:0,z:36,yaw:0};this.floor(0,-7,104,104,0x293c43);
    for(const s of [-1,1]){this.wall(s*52,-7,.5,104,1.15,0x435c65);this.strip(s*51,-7,.09,103,0x8bd2cb,1.2);for(let z=-53;z<45;z+=10){this.wall(s*49,z,.6,.6,7.5,0x40565e);this.box(s*47,7.3,z,4,.2,.7,0x5b7077);this.strip(s*47,z,2.5,.1,0xf1ca87,7.15);}}
    this.wall(0,-59,104,.6,1.2);this.wall(-29,45,46,.6,1.2);this.wall(29,45,46,.6,1.2);this.strip(-9,-7,.09,95,0x7bb4ae);this.strip(9,-7,.09,95,0x7bb4ae);for(let z=-52;z<40;z+=6)this.strip(0,z,.13,1.2,0x77958f);
    const shops=[[-30,-8,'THE EXCHANGE',0x62564a], [30,-8,'VEX / OUTFITTERS',0x31555e],[-30,-38,'LOW ORBIT / CANTEEN',0x684b46],[30,-38,'LISTENER’S GALLERY',0x424e67],[-30,23,'CARGO & CLAIMS',0x54564a],[30,23,'DOCK SERVICES',0x3d5256]];
    for(const [x,z,name,c]of shops){const s=Math.sign(x);this.box(x,3,z,22,6,19,c,{solid:true});this.box(x,6.25,z,23,.5,20,0x192e38);for(let k=0;k<4;k++)this.box(x-s*11.05,3.3,z-6+k*4,.08,2,2.8,this.material(0x91a69a,.4,.4,0x394c48));this.sign(name,x-s*11.1,5.2,z,12,'#e4c78a',-s*Math.PI/2);this.box(x-s*13,1,z,3,2,6,0x20343c,{solid:true});this.strip(x-s*14.6,z,.1,5.7,0xb9cbbb,1.8);this.box(x-s*12,5.6,z,4,.25,11,0x263c47);for(const zz of [-8,8])this.cylinder(x-s*14,2.6,z+zz,.12,5.2,0x5d7074);}
    this.addNPC('broker',-14,-8,Math.PI/2,null,true);this.addNPC('trader',14,-8,-Math.PI/2,null,true);this.addNPC('listener',14,-38,-Math.PI/2);this.addNPC('buyer',-14,-38,Math.PI/2);
    this.cylinder(0,.3,-24,4,.6,0x3b535b,{solid:true});this.cylinder(0,1.5,-24,1.2,2.8,0x1c323d,{solid:true});this.mesh(G.sphere,this.material(0x70c7c0,.2,.35,0x407f7e),0,3.4,-24,1.1,1.1,1.1,{dynamic:true});const ring=this.mesh(G.torus,this.material(0x92e1cf,.3,.4,0x92e1cf),0,3.4,-24,2.2,2.2,2.2,{dynamic:true});ring.rotation.x=.6;this.ambient.push({type:'holo',mesh:ring});this.sign('WAYFARER ANCHORAGE',0,7,-58.5,25,'#e4d8ad');this.sign('FREE PORT / NO QUESTIONS WORTH ASKING',0,4.7,-58,15,'#97b8b3');
    for(let i=0;i<15;i++){const side=i%2?-1:1,sp=['human','human','vyraen','kharuun','keshar'][i%5],z=32-i*5.5,x=side*(10+this.seed()*4);this.addNPC(sp,x,z,Math.PI,[[side*10,z-7],[side*10,z+7]],i%3===0);}
    for(const [x,z]of [[-12,12],[12,12],[-12,-27],[12,-48]])this.bench(x,z,Math.sign(x)*Math.PI/2);
    for(let i=0;i<12;i++)this.crate((i%2?-1:1)*(38+this.seed()*7),-53+this.seed()*93,1.2+this.seed()*1.2,i%2?0x7b6951:0x435b61);
    for(const s of [-1,1]){this.spaceship(s*40,9,43,1.4,0x455866);for(let i=0;i<9;i++){const h=18+this.seed()*50;this.box(s*(75+this.seed()*55),h/2,-110+i*25,14+this.seed()*15,h,15+this.seed()*10,0x142d3c);for(let j=4;j<h;j+=6)this.strip(s*(75+i*2),-110+i*25,12,.08,0x729ca9,j);}}
    this.architecture(PORT_DOCK);this.interact('return-ship','travel','Board Rapscallion',0,41,{zone:'ship'},3.6);this.sign('DOCK 07 / RAPSCALLION',0,3.8,44.64,8,'#c9c8aa',Math.PI);
    this.terminal(0,25,'CONTRACT EXCHANGE','port-board','board');this.pickup('dock-cache',-43,32);
    this.light(0,7,-24,0x82c7e2,28,26);this.light(-14,4,-8,0xe3b570,20,17);this.light(14,4,-8,0x87dfd3,20,17);this.light(0,5,25,0x9fdad0,22,23);
    for(let i=0;i<5;i++){const ship=this.spaceship(-150+i*60,35+i*5,-145, .35+i*.05,0x6c7473);this.ambient.push({type:'ship',mesh:ship,speed:2+i,origin:ship.position.x});}
  }
  ufd() {
    this.spawn={x:0,z:30,yaw:0};
    this.architecture(FACILITY);
    // Cargo is divided into readable lanes. The office flank stays behind solid cover.
    for(const [x,z,size,color]of [
      [-8,19,3,0x716d58],[-10,15,2.4,0x627369],[7,20,3,0x756e58],
      [9,15,2.2,0x596f73],[-8,9,2.2,0x6b796e],[8,-2,2.6,0x5e6f72],
      [-8,-5,2.6,0x687264],[5,-22,1.5,0x566873],[-19,-14,1.4,0x625f51],
      [24,-18,1.4,0x756d52],[-18,-85,2.6,0x677368],[-18,-71,2.4,0x5a6d76],
    ])this.crate(x,z,size,color);
    this.box(0,.66,15,4,1.32,1.2,0x526773,{solid:true});
    this.box(-21,.65,2,5,1.3,1.5,0x3c5660,{solid:true});
    this.box(-24.5,1.4,-4,1.2,2.8,3.2,0x3b5058,{solid:true});
    this.box(0,.65,-16,6,1.3,1.4,0x415d69,{solid:true});
    this.terminal(-5,-18,'SECURITY ACCESS','checkpoint','checkpoint');
    this.terminal(26,9,'SERVICE TRANSPONDER','bypass','bypass',{},0xe4bd6d);
    this.box(26,.65,-8,3.2,1.3,1.2,0x526267,{solid:true});
    this.pipe(29,-10,27,'z',0x758e90,.18,1.7);
    this.pipe(-21.2,-18,12,'z',0x748b8d,.16,1.7);
    this.strip(0,21,.08,9,0x8bd5cc);this.strip(-5,8,.08,9,0x8bd5cc);
    this.strip(0,-8,.08,9,0x8bd5cc);this.strip(17,-43,.08,23,0x8bd5cc);
    this.strip(26,15,.07,16,0xe0b87e);this.strip(-18,-18,.07,12,0xe0b87e);
    this.sign('STAFF ACCESS / QUIET ROUTE',-25.64,2.7,3,5,'#ddc69a',Math.PI/2);
    // Twin process lines shield the perimeter paths from the central patrol aisle.
    for(const x of [10,24]) {
      this.cylinder(x,1.8,-42,2.6,3.6,0x839ba0,{solid:true});
      this.cylinder(x,3.65,-42,2.65,.18,0x345562);
      this.pipe(x,-42,18,'z',0x8aa2a4,.33,2.6);
      for(const z of [-50,-34])this.cylinder(x,1.1,z,1,2.2,0x708a8e,{solid:true});
    }
    // The core is a tall enclosed chamber. The archive is its own sealed room.
    this.cylinder(-6,2.5,-78,4.2,5,0x2e4856,{solid:true});
    this.cylinder(-6,5.35,-78,3.4,.7,0x8aa7aa);
    this.cylinder(-6,2.7,-78,3.45,4.8,this.material(0x6cdbdf,.3,.25,0x3e949d));
    for(const y of [1,2.5,4,5.8]) {
      const ring=this.mesh(G.torus,this.material(0xb7d5c8,.7,.4,0x477d7d),-6,y,-78,4.5,4.5,4.5,{dynamic:true});
      ring.rotation.x=Math.PI/2;this.ambient.push({type:'core',mesh:ring,sign:y%2?1:-1});
    }
    for(const x of [-14,2])this.pipe(x,-78,21,'z',0x82989a,.32,.65);
    this.box(-6,7.8,-78,9,.45,9,0x375462);
    for(const x of [-10,-2])this.box(x,7,-78,.3,3.5,.3,0x59737e);
    this.terminal(27,-83,'ISOLATED AUDIT ARCHIVE','archive','archive');
    for(const z of [-84,-80,-76]) {
      this.box(31.8,1.65,z,1.25,3.3,2.6,0x354c59,{solid:true});
      for(const y of [.7,1.4,2.1,2.8])this.box(31.1,y,z,.06,.08,1.9,this.material(0x83c0bb,.4,.5,0x416864));
    }
    this.sign('CORE 03 / KEEP ONLINE',-6,5.5,-91.64,18,'#abd9d9');
    this.interact('extraction','extract','Extraction airlock',0,31,{},3);
    this.pickup('cargo-cache',-11,22);this.pickup('cooling-cache',28,-53);this.pickup('core-cache',-22,-88);
    this.enemy('cargo-01','guard',6,12,[[6,12],[6,24],[-3,24],[-3,12]]);
    this.enemy('loading-01','guard',6,-3,[[6,-3],[-5,-3]]);
    this.enemy('security-drone','drone',5,-19,[[5,-19],[5,-14]]);
    this.enemy('cooling-01','guard',17,-38,[[17,-38],[17,-52]]);
    this.enemy('core-01','guard',10,-78,[[10,-78],[10,-88],[-17,-88]]);
    this.enemy('core-drone','drone',-19,-69,[[-19,-69],[-19,-83]]);
    this.light(-6,6.3,-78,0x70cfe3,80,28);
    this.bulkheads([[-13.65,17,Math.PI/2,6],[29.65,-40,Math.PI/2,7],[-26.65,-78,Math.PI/2,8]]);
  }
  kharuun() {
    this.spawn={x:0,z:38,yaw:0};this.floor(0,-14,108,116,0x68594a);
    this.architecture(REFINERY);
    const random=seeded(193);
    for(let i=0;i<80;i++) {
      const side=i%2?-1:1,x=side*(36+random()*35),z=-87+random()*150,size=3+random()*8;
      const rock=this.mesh(G.rock,0x6a5b4f,x,size*.45-1,z,size,size*.9,size*.8);
      rock.rotation.set(random(),random(),random());
      if(Math.abs(x)<53)this.colliders.push({x:x-size*.65,z:z-size*.65,w:size*1.3,d:size*1.3,maxY:size,minY:0,height:size});
    }
    for(const side of [-1,1]) {
      this.pipe(side*7,-6,57,'z',0x607b7d,.25,.35);
      this.strip(side*7,-6,.06,57,0xd69c6a,.67);
      // Intentional waist-high approach cover, rather than unattached doorframes.
      this.wall(side*12,8,7,1,1.25,0x73674f);
      this.wall(side*15,-10,7,1,1.25,0x73674f);
    }
    for(const x of [-12,12])for(const z of [-34,-47]) {
      this.cylinder(x,2,z,2,4,0x778888,{solid:true});
      this.cylinder(x,4.1,z,2.2,.25,0x31474b);
      this.cylinder(x,2,z,2.1,.22,this.material(0xdd9560,.2,.5,0xa4522a));
      this.pipe(x,z,7,'z',0x92a5a1,.2,3.2);
    }
    for(const [x,z]of [[-10,18],[9,13],[-9,-5],[-8,-30],[8,-39],[-23,9],[-23,-28]])this.crate(x,z,2.1,0x76654f);
    this.box(0,.5,-62,5,1,2.4,0x46504d,{solid:true});
    this.cylinder(0,1.7,-62,.75,2.1,0x8c9994,{dynamic:true});
    const glow=this.cylinder(0,1.75,-62,.79,.17,this.material(0xe3b668,.3,.3,0xe3b668),{dynamic:true});
    this.ambient.push({type:'core',mesh:glow,sign:1});
    this.interact('regulator','regulator','Recover thermal regulator',0,-60.1,{},3.2);
    this.terminal(-12,-62,'TRANSIT MANIFEST','kharuun-log','intel',{dossier:'regulator'},0xe2ac71);
    this.interact('extraction','extract','Return to Rapscallion',0,40,{},3.5);
    this.pickup('approach-cache',-24,22);this.pickup('refinery-cache',12,-61);
    this.enemy('patrol-01','kharuun',-5,13,[[-5,13],[-5,-8],[5,-8]]);
    this.enemy('patrol-02','kharuun',12,-3,[[12,-3],[20,-3]]);
    this.enemy('gate-01','kharuun',-8,-27,[[-8,-27],[8,-27]]);
    this.enemy('heavy-01','heavy',0,-43,[[0,-43],[0,-51]]);
    this.enemy('vault-01','kharuun',4,-59,[[4,-59],[-4,-59]]);
    this.spaceship(0,3,56,1.25,0x53666d);
  }
  wreck() {
    this.spawn={x:0,z:20,yaw:0};this.architecture(WRECK);
    this.strip(-3.15,-31,.065,38,0xbfa28a);this.strip(3.15,-31,.065,38,0x8eb6ba);
    for(const [x,z,size]of [[-6,7,2.8],[6,-5,2],[-10,-28,2],[10,-39,2.2],[-6,-58,2.2],[6,-70,2.2],[-22,-9,2.2],[21,-39,2]])
      this.crate(x,z,size,0x5a676b);
    for(const x of [-11,11])this.pipe(x,-66,20,'z',0x72838e,.25,2.4);
    this.box(-11,.65,-35,6,1.3,1.4,0x3d555f,{solid:true});
    this.box(20,1.4,-24,3.8,2.8,1.3,0x3e4d5d,{solid:true});
    this.pickup('cell-01',-20,-2,'cell');this.pickup('cell-02',20,-32,'cell');this.pickup('cell-03',0,-70,'cell');
    this.terminal(20,-43,'FINAL SURVEY','survey-log','intel',{dossier:'wreck'},0xb8a4d9);
    this.pickup('supply-01',-22,5);this.interact('extraction','extract','Return to Rapscallion',0,21,{},3);
    this.enemy('drone-01','drone',0,-7,[[0,-7],[0,-20]]);
    this.enemy('drone-02','drone',16,-33,[[16,-33],[21,-33]]);
    this.enemy('scavenger-01','guard',-10,-24,[[-10,-24],[-10,-32]]);
    this.enemy('drone-03','drone',0,-62,[[0,-62],[0,-73]]);
  }
  openGate(){if(!this.gate||this.gate.open)return;this.gate.open=true;this.gate.collider.disabled=true;for(let i=0;i<this.gate.panels.length;i++)this.gate.panels[i].position.x=(i===0?-1:1)*(this.gate.width*.75+.08);}
  onFloor(x,z,r=.32){return [[0,0],[r,0],[-r,0],[0,r],[0,-r]].every(([dx,dz])=>this.floors.some(f=>x+dx>=f.x&&x+dx<=f.x+f.w&&z+dz>=f.z&&z+dz<=f.z+f.d));}
  blocked(x,z,r=.35){return this.colliders.some(c=>!c.disabled&&c.blocksMovement!==false&&(c.minY??0)<1.85&&(c.maxY??3)>0&&x>c.x-r&&x<c.x+c.w+r&&z>c.z-r&&z<c.z+c.d+r);}
  move(position,dx,dz,r=.35){const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.25));for(let i=0;i<steps;i++){const x=position.x+dx/steps,z=position.z+dz/steps;if(this.onFloor(x,position.z,r)&&!this.blocked(x,position.z,r))position.x=x;if(this.onFloor(position.x,z,r)&&!this.blocked(position.x,z,r))position.z=z;}}
  lineBlocked(a,b,pad=0,ignoreGlass=false){
    const dx=b.x-a.x,dz=b.z-a.z,dy=(b.y||0)-(a.y||0);let nearest=Infinity;
    for(const c of this.colliders){if(c.disabled||(ignoreGlass&&c.seeThrough))continue;let t0=0,t1=1;const bounds=[[a.x,dx,c.x-pad,c.x+c.w+pad],[a.z,dz,c.z-pad,c.z+c.d+pad],[a.y||0,dy,c.minY??0,c.maxY??3]];let hit=true;for(const [v,d,min,max]of bounds){if(Math.abs(d)<1e-7){if(v<min||v>max){hit=false;break;}}else{let near=(min-v)/d,far=(max-v)/d;if(near>far)[near,far]=[far,near];t0=Math.max(t0,near);t1=Math.min(t1,far);if(t0>t1){hit=false;break;}}}if(hit&&t1>0&&t0<.995)nearest=Math.min(nearest,Math.max(.00001,t0));
    }return Number.isFinite(nearest)?nearest:false;
  }
  cameraLimit(start,end){let nearest=1;const dx=end.x-start.x,dz=end.z-start.z,dy=end.y-start.y;for(const c of this.colliders){if(c.disabled)continue;let t0=0,t1=1,hit=true;for(const[v,d,min,max]of [[start.x,dx,c.x-.18,c.x+c.w+.18],[start.z,dz,c.z-.18,c.z+c.d+.18],[start.y,dy,(c.minY??0)-.18,(c.maxY??4)+.18]]){if(Math.abs(d)<1e-7){if(v<min||v>max){hit=false;break;}}else{let a=(min-v)/d,b=(max-v)/d;if(a>b)[a,b]=[b,a];t0=Math.max(t0,a);t1=Math.min(t1,b);if(t0>t1){hit=false;break;}}}if(hit&&t0>=0&&t0<nearest)nearest=t0;}return Math.max(.015,nearest-.025);}
  nearest(position){let best=null,distance=Infinity;for(const i of this.interactables){if(i.taken)continue;if(i.npc)i.position.copy(i.npc.actor.root.position);const d=i.position.distanceTo(position);if(d<i.radius&&d<distance){const a=position.clone().setY(1),b=i.position.clone().setY(1);if(this.lineBlocked(a,b))continue;best=i;distance=d;}}return best;}
  objective(state){const c=state.contracts[state.active];if(this.zone==='ship')return this.interactables.find(i=>i.id==='nav');if(this.zone==='port')return this.interactables.find(i=>i.id==='return-ship');if(!c)return this.interactables.find(i=>i.id==='extraction');if(state.active==='audit'){return this.interactables.find(i=>i.id===(c.stage>=2?'extraction':c.stage===0?'checkpoint':'archive'));}if(state.active==='regulator')return this.interactables.find(i=>i.id===(c.stage>=2?'extraction':'regulator'));if(state.active==='salvage'){if(c.cells>=3)return this.interactables.find(i=>i.id==='extraction');return this.interactables.find(i=>i.kind==='cell'&&!i.taken);}return null;}
  update(dt,time,viewer){if(viewer)this.illuminate(viewer);for(const a of this.ambient){if(a.type==='core')a.mesh.rotation.y+=dt*.4*(a.sign||1);if(a.type==='holo'){a.mesh.rotation.y+=dt*.3;a.mesh.rotation.z+=dt*.1;}if(a.type==='pickup')a.mesh.position.y=a.base+Math.sin(time*2)*.1;if(a.type==='planet')a.mesh.rotation.y+=dt*.005;if(a.type==='ship'){a.mesh.position.x+=dt*a.speed;if(a.mesh.position.x>190)a.mesh.position.x=-190;}}
    for(const n of this.npcs){let moving=false;if(n.route){const target=n.route[n.target||0],dx=target[0]-n.actor.root.position.x,dz=target[1]-n.actor.root.position.z,d=Math.hypot(dx,dz);if(d<.35)n.target=(n.target||0)+1>=n.route.length?0:n.target+1;else{this.move(n.actor.root.position,dx/d*dt*.7,dz/d*dt*.7,.25);n.actor.root.rotation.y=Math.atan2(dx,dz);moving=true;}}n.actor.update(dt,time+n.phase,moving,'walk');if(n.label)n.label.position.set(n.actor.root.position.x,n.actor.height+.36,n.actor.root.position.z);}
  }
}
