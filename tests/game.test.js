import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {Game} from '../src/game.js';
import {UI} from '../src/ui.js';
import {World} from '../src/world.js';
import {makeHumanoid} from '../src/actors.js';
import {freshState} from '../src/state.js';
const ctx={fillRect(){},fillText(){}};
const elements=new Map();
globalThis.matchMedia=()=>({matches:false});
globalThis.document={body:{classList:{add(){},remove(){},toggle(){}}},createElement(){return {getContext(){return ctx;}};},getElementById(id){if(!elements.has(id))elements.set(id,{hidden:false,style:{},querySelector(){return null;},classList:{remove(){},toggle(){}}});return elements.get(id);}};
globalThis.localStorage={getItem(){return null;},setItem(){}};
const bank={catalog:{characters:{}},async prop(){return null;}};
function game(){const g=new Game();g.state=freshState();g.state.started=true;g.player=new T.Group();g.actor=makeHumanoid('human',0x556677,true);g.player.add(g.actor.root);g.scene=new T.Scene();g.scene.add(g.player);g.camera=new T.PerspectiveCamera(58,1.5,.1,800);g.flash=new T.PointLight();g.world=new World(g.scene,bank);g.ui={panel:null,menu:{hidden:false},toast(){},say(){},hit(){},briefing(){this.panel='brief';},close(){this.panel=null;},open(which){this.panel=which;},shell(){},result(r){this.lastResult=r;this.panel='result';},dead(){this.panel='dead';}};g.ui.app=g;g.ui.settle=UI.prototype.settle;return g;}
function walkTo(g,id){
 const goal=g.world.interactables.find(i=>i.id===id);assert.ok(goal);const start=[Math.round(g.player.position.x),Math.round(g.player.position.z)],queue=[start],seen=new Map([[start.join(','),null]]);let found;
 for(let n=0;n<queue.length;n++){const [x,z]=queue[n];if(Math.hypot(x-goal.position.x,z-goal.position.z)<goal.radius-.45&&!g.world.lineBlocked(new T.Vector3(x,1,z),goal.position.clone().setY(1))){found=[x,z];break;}for(const[dx,dz]of[[0,-1],[1,0],[-1,0],[0,1]]){const a=x+dx,b=z+dz,k=[a,b].join(',');if(seen.has(k)||!g.world.onFloor(a,b,.34)||g.world.blocked(a,b,.34))continue;seen.set(k,[x,z]);queue.push([a,b]);}}
 assert.ok(found,'path to '+id);const path=[];for(let p=found;p;p=seen.get(p.join(',')))path.push(p);path.reverse();
 for(const[x,z]of path){let n=0;while(Math.hypot(g.player.position.x-x,g.player.position.z-z)>.003){assert.ok(n++<100,`movement stalled toward ${id}: ${x},${z} from ${g.player.position.x},${g.player.position.z}`);const dx=x-g.player.position.x,dz=z-g.player.position.z,d=Math.hypot(dx,dz);g.yaw=Math.atan2(-dx,-dz);g.keys.add('KeyW');g.updatePlayer(Math.min(.025,d/3.1));}g.keys.clear();}
 assert.equal(g.world.nearest(g.player.position)?.id,id,'context action must select intended interaction');
}
test('the real movement and interaction controller completes both chapters and pays once',async()=>{
 const g=game();g.loadZone('ship');g.accept('audit');g.ui.close();g.loadZone('ufd');walkTo(g,'checkpoint');g.interact();assert.equal(g.state.contracts.audit.stage,1);walkTo(g,'archive');g.interact();assert.equal(g.ui.panel,'archive');g.secureArchive(true);assert.equal(g.state.contracts.audit.stage,2);walkTo(g,'extraction');await g.interact();assert.equal(g.state.zone,'ship');assert.equal(g.state.contracts.audit.status,'recovered');walkTo(g,'nav');g.interact();g.deliver();assert.equal(g.state.credits,1150);assert.equal(g.ui.lastResult.id,'audit');g.deliver();assert.equal(g.state.credits,1150);
 g.ui.close();g.accept('regulator');g.ui.close();g.loadZone('kharuun');walkTo(g,'regulator');g.interact();assert.equal(g.state.contracts.regulator.stage,2);walkTo(g,'extraction');await g.interact();walkTo(g,'nav');g.interact();assert.equal(g.ui.panel,'decision');g.deliver('settlement');assert.equal(g.state.credits,2250);assert.equal(g.state.reputation.kharuun,2);
});
test('reload ends, consumes reserve once, and permits another shot',()=>{
 const g=game();g.loadZone('ufd');g.state.ammo.pistol=0;g.state.reserve.pistol=20;g.reload();for(let i=0;i<70;i++)g.updatePlayer(.025);assert.equal(g.reloading,0);assert.equal(g.state.ammo.pistol,12);assert.equal(g.state.reserve.pistol,8);g.shoot();assert.equal(g.state.ammo.pistol,11);
});
test('a completed medkit is consumed once and cloak depletes then recharges',()=>{
 const g=game();g.loadZone('ufd');g.state.health=20;g.heal();for(let i=0;i<100;i++)g.updatePlayer(.025);assert.equal(g.healing,0);assert.equal(g.state.medkits,2);assert.equal(g.state.health,80);g.cloaked=true;g.state.energy=1;for(let i=0;i<20;i++)g.updatePlayer(.025);assert.equal(g.cloaked,false);assert.ok(g.state.energy>0);
});
test('actual shooting hits exposed hostiles, cover blocks damage, and kills create persistent loot',()=>{
 const g=game();g.world.clear();g.world.zone='ufd';g.state.zone='ufd';g.world.floor(0,-10,30,50);g.player.position.set(0,0,0);g.camera.position.set(.5,2,5);g.camera.lookAt(0,1.2,-20);g.camera.updateMatrixWorld();g.yaw=0;const e=g.world.enemy('test','guard',0,-10);g.shoot();assert.equal(e.health,46);g.shotCooldown=0;g.world.wall(0,-5,6,1,3);g.shoot();assert.equal(e.health,46,'cover must prevent a hit');g.world.colliders=[];for(let i=0;i<2;i++){g.shotCooldown=0;g.shoot();}assert.equal(e.dead,true);assert.ok(g.state.defeated.includes('ufd:test'));assert.ok(g.world.interactables.some(i=>i.kind==='loot'));
});
test('enemy perception and ranged attacks respect cloak and cover',()=>{
 const g=game();g.world.clear();g.world.zone='ufd';g.state.zone='ufd';g.world.floor(0,-10,30,50);g.player.position.set(0,0,0);const e=g.world.enemy('test','guard',0,-10);e.actor.root.rotation.y=0;e.cooldown=0;g.cloaked=true;g.enemyAI(.6);assert.equal(e.alert,0);assert.equal(g.state.health,100);g.cloaked=false;g.enemyAI(.6);assert.ok(e.alert>.78);assert.equal(g.state.health,94);g.world.wall(0,-5,6,1,3);e.cooldown=0;g.enemyAI(.6);assert.equal(g.state.health,94);
});
