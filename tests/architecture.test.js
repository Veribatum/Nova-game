import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {compileLayout,FACILITY,SHIP,WRECK,REFINERY,PORT_DOCK} from '../src/architecture.js';
import {World} from '../src/world.js';
import {freshState} from '../src/state.js';
const context={fillRect(){},fillText(){}};
globalThis.document={createElement(){return{width:768,height:128,getContext(){return context;}};}};
const bank={catalog:{characters:{}},async prop(){return null;}};
const make=zone=>{const w=new World(new T.Scene(),bank);w.build(zone,freshState());w.group.updateMatrixWorld(true);return w;};
function flood(w){const start=w.spawn,queue=[[start.x,start.z]],seen=new Set([start.x+','+start.z]);for(let n=0;n<queue.length;n++){const[x,z]=queue[n];for(const[dx,dz]of[[0,1],[0,-1],[1,0],[-1,0]]){const a=x+dx,b=z+dz,key=a+','+b;if(seen.has(key)||!w.onFloor(a,b,.34)||w.blocked(a,b,.34))continue;seen.add(key);queue.push([a,b]);}}return queue;}
function reaches(points,x,z){return points.some(([a,b])=>Math.hypot(a-x,b-z)<1.4);}
function seal(w,id){const p=w.portals.find(p=>p.id===id);w.colliders.push({x:p.x-(p.axis==='x'?p.width:.6)/2,z:p.z-(p.axis==='x'?.6:p.width)/2,w:p.axis==='x'?p.width:.6,d:p.axis==='x'?.6:p.width,minY:0,maxY:p.height});}
for(const plan of [FACILITY,SHIP,WRECK,REFINERY,PORT_DOCK])test(`${plan.name}: every doorway is cut from a shared wall with a full header`,()=>{
 const layout=compileLayout(plan);for(const p of layout.portals){assert.ok(p.start<p.end);if(p.b){const a=layout.rooms.find(r=>r.id===p.a),b=layout.rooms.find(r=>r.id===p.b);assert.ok(p.axis==='x'?[a.minZ,a.maxZ].includes(p.line)&&[b.minZ,b.maxZ].includes(p.line):[a.minX,a.maxX].includes(p.line)&&[b.minX,b.maxX].includes(p.line));}assert.ok(layout.walls.some(s=>s.axis===p.axis&&s.line===p.line&&s.start<=p.at&&s.end>=p.at&&s.minY===p.base+p.height),'header at '+p.id);}
});
for(const zone of ['ship','ufd','wreck','kharuun','port'])test(`${zone}: actual roof triangles cover every room and door openings remain physically clear`,()=>{
 const w=make(zone),roofs=w.merged.filter(m=>m.userData.batchRole==='roof');assert.ok(roofs.length);
 for(const room of w.rooms)for(const dx of [-.25,0,.25])for(const dz of [-.25,0,.25]){
  const ray=new T.Raycaster(new T.Vector3(room.x+room.w*dx,1.9,room.z+room.d*dz),new T.Vector3(0,1,0),0,15);
  const hits=ray.intersectObjects(roofs);assert.ok(hits.length,'unroofed space in '+room.id);assert.ok(Math.abs(hits[0].point.y-room.height)<.01,'roof height in '+room.id);
 }
 for(const p of w.portals){if(p.closed||p.window)continue;const a=new T.Vector3(p.x+(p.axis==='z'?.7:0),1.6,p.z+(p.axis==='x'?.7:0)),b=new T.Vector3(p.x-(p.axis==='z'?.7:0),1.6,p.z-(p.axis==='x'?.7:0));assert.equal(w.lineBlocked(a,b),false,'blocked door '+p.id);}
});
test('facility staff passage and maintenance bypass are independent alternatives to the front checkpoint',()=>{
 const w=make('ufd');seal(w,'loading-security');let points=flood(w);assert.ok(reaches(points,-5,-18),'staff passage must reach rear of security');seal(w,'relay-security');points=flood(w);assert.equal(reaches(points,-5,-18),false,'closed maintenance gate must separate the remaining route');w.openGate();points=flood(w);assert.ok(reaches(points,27,-82),'open bypass must reach the archive');assert.ok(reaches(points,-5,-18),'bypass must also reconnect at cooling');
});
test('sliding maintenance panels retract into the adjacent walls and do not leave an invisible barrier',()=>{
 const w=make('ufd'),p=w.portals.find(p=>p.gate),a=new T.Vector3(p.x,1.6,p.z+.8),b=new T.Vector3(p.x,1.6,p.z-.8);
 assert.notEqual(w.lineBlocked(a,b),false);assert.ok(w.gate.panels.every(panel=>panel.parent));w.openGate();w.group.updateMatrixWorld(true);assert.equal(w.lineBlocked(a,b),false);
 const ray=new T.Raycaster(a,b.clone().sub(a).normalize(),0,1.6);assert.equal(ray.intersectObjects(w.gate.panels,true).length,0);
});
test('indoor camera stays under low roofs and inside walls when looking upward',()=>{
 const w=make('ufd');for(const room of w.rooms){const pivot=new T.Vector3(room.x,1.45,room.z);for(let i=0;i<8;i++){const angle=i*Math.PI/4,end=pivot.clone().add(new T.Vector3(Math.sin(angle)*5.2,4.94,Math.cos(angle)*5.2)),camera=pivot.clone().lerp(end,w.cameraLimit(pivot,end));assert.ok(camera.y<room.height-.1,'camera above roof of '+room.id);}}
 const pivot=new T.Vector3(13.34,1.45,16),end=new T.Vector3(18.5,2.8,16),camera=pivot.clone().lerp(end,w.cameraLimit(pivot,end));assert.ok(camera.x<13.7,'camera crossed the cargo wall');
});
test('inspection glass blocks bodies and gunfire while allowing visual detection',()=>{
 const w=make('ufd'),p=w.portals.find(p=>p.window),a=new T.Vector3(p.x-.8,1.8,p.z),b=new T.Vector3(p.x+.8,1.8,p.z);
 assert.notEqual(w.lineBlocked(a,b),false);assert.equal(w.lineBlocked(a,b,0,true),false);assert.equal(w.blocked(p.x,p.z,.01),true);
});
test('invalid room adjacency is rejected before a floating door can be built',()=>{
 assert.throws(()=>compileLayout({rooms:[{id:'a',x:0,z:0,w:8,d:8},{id:'b',x:20,z:0,w:8,d:8}],portals:[{id:'bad',a:'a',b:'b',width:3}]}),/share a wall/);
 assert.throws(()=>compileLayout({rooms:[{id:'a',x:0,z:0,w:8,d:8},{id:'b',x:4,z:0,w:8,d:8}],portals:[]}),/Overlapping rooms/);
});
