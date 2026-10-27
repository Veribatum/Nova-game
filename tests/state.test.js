import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,acceptContract,recoverObjective,extractContract,deliverContract,collectCell,buyGear,buyPerk,sanitizeSave,restock,saveState,loadState,canAccept,maxHealth} from '../src/state.js';
const complete=(s,id,decision)=>{assert.equal(acceptContract(s,id),true);assert.equal(recoverObjective(s,id),true);assert.equal(extractContract(s),true);return deliverContract(s,decision);};
test('the two chapter loop awards payment once, unlocks progression, and preserves choices',()=>{
 const s=freshState();assert.equal(acceptContract(s,'regulator'),false);assert.equal(extractContract(s),false);assert.equal(acceptContract(s,'audit'),true);assert.equal(acceptContract(s,'salvage'),false);assert.equal(deliverContract(s),null);assert.equal(extractContract(s),false);
 recoverObjective(s,'audit');assert.equal(extractContract(s),true);const r=deliverContract(s);assert.equal(r.pay,800);assert.equal(s.credits,1150);assert.equal(s.level,2);assert.equal(s.points,1);assert.equal(deliverContract(s),null);assert.equal(s.credits,1150);
 assert.equal(buyGear(s,'rifle'),true);assert.equal(buyGear(s,'rifle'),false);assert.equal(s.credits,600);assert.equal(buyPerk(s,'combat'),true);assert.equal(buyPerk(s,'combat'),false);
 const next=complete(s,'regulator','settlement');assert.equal(next.pay,1100);assert.equal(s.reputation.kharuun,2);assert.ok(s.dossiers.includes('regulator'));assert.equal(canAccept(s,'audit'),false);assert.equal(s.active,null);
});
test('selling the regulator changes money and standing without falsifying the original contract',()=>{
 const s=freshState();complete(s,'audit');const before=s.credits;const r=complete(s,'regulator','buyer');assert.equal(r.pay,1600);assert.equal(s.credits-before,1600);assert.equal(s.reputation.kharuun,-2);assert.equal(s.contracts.regulator.decision,'buyer');
});
test('salvage requires three unique cells and repeat runs reset only the wreck',()=>{
 const s=freshState();s.collected=['port:dock-cache'];s.defeated=['ufd:cargo-01','wreck:drone-01'];assert.equal(acceptContract(s,'salvage'),true);assert.deepEqual(s.defeated,['ufd:cargo-01']);assert.equal(collectCell(s,'wreck:cell-01'),true);assert.equal(collectCell(s,'wreck:cell-01'),false);assert.equal(extractContract(s),false);collectCell(s,'wreck:cell-02');collectCell(s,'wreck:cell-03');assert.equal(extractContract(s),true);deliverContract(s);assert.equal(acceptContract(s,'salvage'),true);assert.equal(s.contracts.salvage.cells,0);assert.deepEqual(s.collected,['port:dock-cache']);assert.equal(s.salvageRuns,2);
});
test('save roundtrip resumes a recovered deliverable and every purchased capability',()=>{
 const s=freshState();s.started=true;complete(s,'audit');buyGear(s,'armor');buyGear(s,'bypass');acceptContract(s,'regulator');recoverObjective(s,'regulator');extractContract(s);s.zone='ship';s.position={x:2,z:-19};s.yaw=.6;s.health=22;s.ammo.pistol=2;s.reserve.pistol=8;s.defeated.push('kharuun:heavy-01');
 const storage={value:'',setItem(k,v){this.value=v;},getItem(){return this.value;}};assert.equal(saveState(s,storage),true);const saved=loadState(storage);assert.deepEqual(saved,s);const result=deliverContract(saved,'settlement');assert.equal(result.pay,1100);restock(saved);assert.equal(saved.health,125);assert.equal(saved.ammo.pistol,12);assert.equal(saved.medkits,3);
});
test('invalid imports and inaccessible storage fail without corrupting a captain',()=>{
 assert.throws(()=>sanitizeSave({version:20}));const s=freshState();s.credits=Infinity;s.gear=['made-up','armor','armor'];s.medkits=999;s.perks.combat=-90;s.position={x:1e9,z:0};s.ammo.pistol=-80;const clean=sanitizeSave(s);assert.equal(clean.credits,350);assert.equal(clean.medkits,5);assert.deepEqual(clean.gear,['armor']);assert.equal(clean.position,null);assert.equal(clean.ammo.pistol,0);assert.equal(clean.perks.combat,0);
 const storage={setItem(){throw Error('no storage');},getItem(){throw Error('no storage');}};assert.equal(saveState(freshState(),storage),false);assert.equal(loadState(storage),null);
});
test('inventory constraints do not charge for duplicate or unavailable purchases',()=>{
 const s=freshState();s.credits=10000;assert.equal(buyGear(s,'armor'),true);const c=s.credits;assert.equal(buyGear(s,'armor'),false);assert.equal(s.credits,c);assert.equal(maxHealth(s),125);for(let i=0;i<3;i++)buyGear(s,'medkit');assert.equal(s.medkits,5);const after=s.credits;assert.equal(buyGear(s,'medkit'),false);assert.equal(s.credits,after);assert.equal(buyGear(s,'unknown'),false);
});
