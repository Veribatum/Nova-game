import * as T from '../vendor/three.module.js';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { clone as cloneSkeleton } from '../vendor/SkeletonUtils.js';

const geo={sphere:new T.SphereGeometry(1,12,8),capsule:new T.CapsuleGeometry(1,1,4,8),box:new T.BoxGeometry(1,1,1)};
const materialCache=new Map();
function mat(color,metalness=.2,roughness=.65){const key=`${color}:${metalness}:${roughness}`;if(!materialCache.has(key))materialCache.set(key,new T.MeshStandardMaterial({color,metalness,roughness}));return materialCache.get(key);}
function part(root,g,m,x,y,z,sx,sy,sz){const a=new T.Mesh(g,m);a.position.set(x,y,z);a.scale.set(sx,sy,sz);a.castShadow=true;a.receiveShadow=true;root.add(a);return a;}
export function makeHumanoid(species='human',color=0x647e84,female=false){
  const root=new T.Group(),skin=mat(species==='vyraen'?0xb0c5c6:species==='kharuun'?0x9f8a70:species==='keshar'?0x9c7461:0xba8d78),suit=mat(color,.35,.6),dark=mat(0x132129,.4,.6),trim=mat(0x9daaa2,.7,.4);
  const tall=species==='vyraen'?1.17:species==='keshar'?.85:species==='kharuun'?1.15:1;
  const wide=species==='vyraen'?.79:species==='kharuun'?1.35:1;
  const body=new T.Group();root.add(body);body.scale.set(wide,tall,wide);
  const torsoPts=[new T.Vector2(.17,.81),new T.Vector2(.22,.91),new T.Vector2(female?.16:.21,1.09),new T.Vector2(.22,1.28),new T.Vector2(.25,1.38),new T.Vector2(.14,1.45)];
  const torso=part(body,new T.LatheGeometry(torsoPts,12),suit,0,0,0,1,1,.72);
  part(body,geo.sphere,dark,0,.85,0,.22,.18,.15);part(body,geo.box,trim,0,.98,.137,.36,.045,.05);
  if(female){for(const side of [-1,1])part(body,geo.sphere,suit,side*.093,1.28,.09,.105,.1,.09);}
  part(body,geo.capsule,skin,0,1.49,0,.073,.09,.073);
  const head=part(body,geo.sphere,skin,0,1.65,0,species==='vyraen'?.145:.14,species==='vyraen'?.215:.18,.145);
  if(species==='vyraen'){
    for(const side of [-1,1])part(body,geo.sphere,mat(0x050d15,.3,.2),side*.065,1.68,.12,.058,.061,.022);
    const crest=part(body,geo.sphere,skin,0,1.82,-.06,.12,.17,.18);crest.rotation.x=-.5;
  }else if(species==='kharuun'){
    for(const side of [-1,1]){part(body,geo.sphere,mat(0xd5c9b0,.1,.85),side*.14,1.71,-.02,.08,.14,.11);part(body,geo.sphere,mat(0xe5ab62,.3,.3),side*.063,1.66,.139,.024,.015,.01);}
    part(body,geo.box,skin,0,1.58,.12,.16,.06,.08);
  }else{
    part(body,geo.sphere,mat(female?0x4e2429:0x292624),0,1.78,-.022,.148,.09,.15);
    for(const side of [-1,1])part(body,geo.sphere,mat(0x182e35),side*.055,1.68,.132,.021,.012,.009);
    if(female)part(body,geo.sphere,mat(0x4e2429),0,1.62,-.105,.15,.22,.075);
  }
  const limbs=[];
  for(const side of [-1,1]){
    const arm=new T.Group();arm.position.set(side*.285,1.35,0);body.add(arm);arm.rotation.z=side*.08;
    part(arm,geo.capsule,suit,0,-.12,0,.075,.13,.075);part(arm,geo.sphere,suit,0,0,0,.11,.105,.1);
    part(arm,geo.capsule,dark,0,-.37,.015,.062,.115,.062);part(arm,geo.sphere,skin,0,-.55,.02,.062,.08,.052);
    const leg=new T.Group();leg.position.set(side*.115,.83,0);body.add(leg);
    part(leg,geo.capsule,suit,0,-.17,0,.09,.17,.085);part(leg,geo.capsule,dark,0,-.52,.01,.073,.15,.073);part(leg,geo.box,dark,0,-.77,.05,.15,.12,.27);
    part(leg,geo.sphere,trim,0,-.4,.072,.07,.08,.04);limbs.push({arm,leg,side});
  }
  part(body,geo.box,dark,0,1.2,-.17,.28,.36,.12);
  const stripe=part(body,geo.box,mat(species==='kharuun'?0xe7974a:0x87e4d0),0,1.31,.18,.075,.017,.01);
  return {root,body,head,torso,limbs,height:1.85*tall,procedural:true,update(dt,time,moving){for(const l of limbs){const swing=moving?Math.sin(time*7+l.side*Math.PI*.5)*.55:Math.sin(time*1.5+l.side)*.025;l.leg.rotation.x=swing;l.arm.rotation.x=-swing*.65;}body.position.y=Math.sin(time*(moving?14:1.5))*(moving?.025:.005);}};
}
export function makeDrone(heavy=false){
  const root=new T.Group(),body=new T.Group();root.add(body);
  part(body,geo.sphere,mat(heavy?0x755c57:0x465e69,.7,.35),0,1.45,0,heavy?.7:.4,heavy?.47:.28,heavy?.53:.4);
  part(body,geo.box,mat(0x101b24),0,1.47,.32,.5,.12,.1);
  const eye=part(body,geo.sphere,new T.MeshBasicMaterial({color:0xff795f}),0,1.47,.39,.13,.055,.035);
  for(const s of [-1,1]){part(body,geo.box,mat(0x1c2d35),s*.43,1.4,0,.28,.14,.6);part(body,geo.box,mat(0x9ba6a4,.8),s*.45,1.35,.31,.08,.08,.35);}
  return {root,body,height:1.9,procedural:true,drone:true,eye,update(dt,time){body.position.y=Math.sin(time*2.5)*.12;body.rotation.z=Math.sin(time*1.7)*.04;}};
}
export function makeWeapon(rifle=false){
  const root=new T.Group();part(root,geo.box,mat(0x15242c,.8,.35),0,.025,-.12,rifle?.095:.07,rifle?.11:.09,rifle?.5:.21);
  part(root,geo.box,mat(0x6c7d82,.85,.3),0,.065,rifle?-.37:-.23,.05,.04,rifle?.22:.1);
  const grip=part(root,geo.box,mat(0x242a2e),0,-.07,rifle?.015:-.075,.055,.13,.07);grip.rotation.x=-.25;
  if(rifle){part(root,geo.box,mat(0x192329),0,-.09,-.1,.055,.14,.08);part(root,geo.box,mat(0x607375),0,.12,-.11,.055,.055,.12);}
  return root;
}
function safeClips(clips){return clips.map(source=>{const clip=source.clone();for(const tr of clip.tracks){if(/Hips\.position$/.test(tr.name)){for(let i=0;i<tr.values.length;i+=3){tr.values[i]=tr.values[0];tr.values[i+1]=tr.values[1];}}}return clip;});}
export class AssetBank{
  constructor(){this.loader=new GLTFLoader();this.cache=new Map();this.catalog=null;}
  async init(){const response=await fetch('./assets/catalog.json');if(!response.ok)throw Error('Asset catalog missing');this.catalog=await response.json();}
  async gltf(url){if(!this.cache.has(url))this.cache.set(url,this.loader.loadAsync(url).catch(e=>{this.cache.delete(url);throw e;}));return this.cache.get(url);}
  async character(key='nova',armed=true){
    const entry=this.catalog.characters[key];if(!entry?.url)return null;
    const gltf=await this.gltf(entry.url),model=cloneSkeleton(gltf.scene),root=new T.Group();root.add(model);
    model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
    const mixer=new T.AnimationMixer(model),clips=safeClips(gltf.animations),actions={};
    for(const [name,clipName] of Object.entries(entry.animations||{})){const clip=clips.find(c=>c.name===clipName);if(clip)actions[name]=mixer.clipAction(clip);}
    for(const [mode,pattern] of Object.entries({idle:/^(idle|standing)(\b|[_ .])/i,walk:/walk/i,run:/run|jog/i,crouchIdle:/crouch.*idle/i,crouchWalk:/crouch.*walk/i})){if(!actions[mode]){const found=clips.find(c=>pattern.test(c.name)&&(!['walk','idle'].includes(mode)||!/crouch/i.test(c.name)));if(found)actions[mode]=mixer.clipAction(found);}}
    let current='idle';if(actions.idle){actions.idle.play();mixer.update(.001);}
    model.updateMatrixWorld(true);const box=new T.Box3().setFromObject(model,true),size=box.getSize(new T.Vector3());
    const height=entry.height||1.82;root.scale.setScalar(height/(size.y||1.82));model.position.y-=box.min.y;model.position.x-=(box.min.x+box.max.x)/2;model.position.z-=(box.min.z+box.max.z)/2;
    model.rotation.y+=entry.rotationY||0;
    const weapon=makeWeapon(),rifle=makeWeapon(true);root.add(weapon,rifle);rifle.visible=false;
    const hand=model.getObjectByName('mixamorigRightHand')||model.getObjectByName('mixamorig:RightHand')||model.getObjectByName('RightHand');
    const tmp=new T.Vector3();let cloak=false,viewFade=1;
    const mats=[];model.traverse(o=>{if(o.isMesh){o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();for(const m of [o.material].flat()){mats.push({m,opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite});}}});
    const applyOpacity=()=>{for(const x of mats){const transparent=x.transparent||cloak||viewFade<.99;if(x.m.transparent!==transparent){x.m.transparent=transparent;x.m.needsUpdate=true;}x.m.opacity=x.opacity*(cloak?.24:1)*viewFade;x.m.depthWrite=x.depthWrite&&!cloak&&viewFade>.99;}};
    return {root,model,mixer,actions,height,procedural:false,current,hand,weapon,rifle,
      dispose(){mixer.stopAllAction();mixer.uncacheRoot(model);for(const x of mats)x.m.dispose();model.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.dispose();});},
      setCloak(on){if(cloak===on)return;cloak=on;applyOpacity();},
      setViewFade(value){if(Math.abs(value-viewFade)<.01)return;viewFade=value;applyOpacity();},
      update(dt,time,moving,mode='walk',yaw=0,weaponId='pistol'){
        const desired=moving?(mode==='crouch'?'crouchWalk':mode==='run'?'run':'walk'):(mode==='crouch'?'crouchIdle':'idle');
        if(desired!==current&&actions[desired]){const next=actions[desired];next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();actions[current]?.fadeOut(.18);next.fadeIn(.18);current=desired;this.current=desired;}
        mixer.update(dt);root.updateMatrixWorld(true);
        weapon.visible=armed&&weaponId==='pistol';rifle.visible=armed&&weaponId==='rifle';const gun=weaponId==='pistol'?weapon:rifle;
        if(hand){hand.getWorldPosition(tmp);root.worldToLocal(tmp);gun.position.copy(tmp);gun.rotation.set(0,yaw-root.rotation.y,0);gun.scale.setScalar(1/root.scale.x);}
        else{gun.position.set(.25,1.05,-.25);}
      },
    };
  }
  async prop(key){const e=this.catalog.props[key];if(!e?.url)return null;const gltf=await this.gltf(e.url);return {root:gltf.scene.clone(true),...e};}
}
