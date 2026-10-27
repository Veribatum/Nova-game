import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {World} from '../src/world.js';
import {freshState} from '../src/state.js';
const ctx={fillRect(){},fillText(){},clearRect(){},measureText(){return{width:10}}};
globalThis.document={createElement(){return {width:512,height:128,getContext(){return ctx;}};}};
const bank={catalog:{characters:{}},async prop(){return null;}};
function reachable(w,start){const queue=[[start.x,start.z]],seen=new Set([start.x+','+start.z]);for(let n=0;n<queue.length;n++){const [x,z]=queue[n];for(const [dx,dz]of [[0,1],[0,-1],[1,0],[-1,0]]){const a=x+dx,b=z+dz,k=a+','+b;if(seen.has(k)||!w.onFloor(a,b,.34)||w.blocked(a,b,.34))continue;seen.add(k);queue.push([a,b]);}}return queue;}
function canReachInteraction(w,points,i){return points.some(([x,z])=>Math.hypot(x-i.position.x,z-i.position.z)<i.radius-.05&&!w.lineBlocked(new T.Vector3(x,1,z),i.position.clone().setY(1)));}
for(const zone of ['ship','port','ufd','kharuun','wreck'])test(`${zone}: every objective, exit and interactable has a traversable route`,()=>{
 const world=new World(new T.Scene(),bank);const spawn=world.build(zone,freshState());assert.ok(world.onFloor(spawn.x,spawn.z));assert.equal(world.blocked(spawn.x,spawn.z),false,'spawn must not intersect scenery');const points=reachable(world,spawn);assert.ok(points.length>100);for(const i of world.interactables){if(i.kind==='bypass')continue;assert.ok(canReachInteraction(world,points,i),`Unreachable interaction ${i.id} at ${i.position.x},${i.position.z}`);}if(zone==='ufd'){world.openGate();const open=reachable(world,spawn);assert.ok(open.length>points.length,'maintenance bypass must actually open a playable route');}world.clear();
});
test('cover blocks projectiles and vision, and a low barrier leaves an elevated sight line',()=>{
 const w=new World(new T.Scene(),bank);w.wall(0,0,4,1,1.2);assert.notEqual(w.lineBlocked(new T.Vector3(0,1,3),new T.Vector3(0,1,-3)),false);assert.equal(w.lineBlocked(new T.Vector3(0,2,3),new T.Vector3(0,2,-3)),false);assert.equal(w.lineBlocked(new T.Vector3(4,1,3),new T.Vector3(4,1,-3)),false);assert.notEqual(w.lineBlocked(new T.Vector3(0,1,0),new T.Vector3(0,1,-3)),false,'a muzzle inside cover must not bypass it');
});
