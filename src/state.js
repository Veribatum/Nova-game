import { CONTRACTS, GEAR, WEAPONS, DOSSIERS } from './content.js?v=2';
export const SAVE_KEY='blackglass.frontier.save.v1';
export function freshState(){return {version:1,started:false,zone:'ship',position:null,yaw:0,credits:350,level:1,xp:0,points:0,health:100,energy:100,medkits:3,weapon:'pistol',ammo:{pistol:12,rifle:24},reserve:{pistol:72,rifle:120},gear:[],perks:{combat:0,stealth:0,tech:0},active:null,contracts:{},salvageRuns:0,reputation:{frontier:0,ufd:0,kharuun:0},dossiers:['captain','rapscallion'],collected:[],defeated:[],settings:{sound:true,sensitivity:1,quality:'auto'},playTime:0};}
export function maxHealth(s){return 100+(s.gear.includes('armor')?25:0);}
export function xpThreshold(s){return 100+s.level*80;}
export function addXP(s,n){s.xp+=n;let levels=0;while(s.xp>=xpThreshold(s)&&s.level<50){s.xp-=xpThreshold(s);s.level++;s.points++;levels++;}return levels;}
export function sanitizeSave(raw){
  if(!raw||raw.version!==1||!['ship','port','ufd','kharuun','wreck'].includes(raw.zone))throw Error('This is not a BLACKGLASS Frontier save.');
  const s=freshState();
  for(const k of ['credits','level','xp','points','health','energy','medkits','salvageRuns','playTime'])if(Number.isFinite(raw[k]))s[k]=Math.max(0,Math.min(raw[k],k==='level'?50:k==='medkits'?5:1e7));
  s.level=Math.max(1,Math.floor(s.level));s.started=!!raw.started;s.zone=raw.zone;
  s.gear=Array.isArray(raw.gear)?[...new Set(raw.gear.filter(x=>GEAR.some(g=>g.id===x)&&x!=='medkit'))]:[];
  s.weapon=raw.weapon==='rifle'&&s.gear.includes('rifle')?'rifle':'pistol';
  s.health=Math.min(s.health,maxHealth(s));s.energy=Math.min(s.energy,100);
  for(const k of ['pistol','rifle']){s.ammo[k]=Math.min(WEAPONS[k].capacity,Math.max(0,Math.floor(Number(raw.ammo?.[k])||0)));s.reserve[k]=Math.min(999,Math.max(0,Math.floor(Number(raw.reserve?.[k])||0)));}
  for(const k of ['combat','stealth','tech'])s.perks[k]=Math.min(3,Math.max(0,Math.floor(Number(raw.perks?.[k])||0)));
  for(const k of Object.keys(s.reputation))s.reputation[k]=Math.max(-100,Math.min(100,Number(raw.reputation?.[k])||0));
  for(const k of Object.keys(CONTRACTS)){const c=raw.contracts?.[k];if(c&&['active','recovered','complete'].includes(c.status)){s.contracts[k]={status:c.status,stage:Math.max(0,Math.min(3,Math.floor(Number(c.stage)||0))),cells:Math.max(0,Math.min(3,Math.floor(Number(c.cells)||0))),decision:['settlement','buyer',null].includes(c.decision)?c.decision:null,inspected:!!c.inspected};}}
  if(CONTRACTS[raw.active]&&['active','recovered'].includes(s.contracts[raw.active]?.status))s.active=raw.active;
  if(raw.position&&[raw.position.x,raw.position.z].every(x=>Number.isFinite(x)&&Math.abs(x)<180))s.position={x:raw.position.x,z:raw.position.z};
  s.yaw=Number.isFinite(raw.yaw)?raw.yaw:0;
  for(const k of ['collected','defeated'])s[k]=Array.isArray(raw[k])?[...new Set(raw[k].filter(x=>typeof x==='string'&&x.length<80))].slice(0,2000):[];
  s.dossiers=[...new Set(['captain','rapscallion',...(Array.isArray(raw.dossiers)?raw.dossiers.filter(x=>DOSSIERS[x]):[])])];
  s.settings={sound:raw.settings?.sound!==false,sensitivity:Math.max(.4,Math.min(2,Number(raw.settings?.sensitivity)||1)),quality:['auto','low','high'].includes(raw.settings?.quality)?raw.settings.quality:'auto'};
  return s;
}
export function loadState(storage){try{storage??=globalThis.localStorage;const t=storage?.getItem(SAVE_KEY);return t?sanitizeSave(JSON.parse(t)):null;}catch{return null;}}
export function saveState(s,storage){try{storage??=globalThis.localStorage;storage?.setItem(SAVE_KEY,JSON.stringify(s));return true;}catch{return false;}}
export function canAccept(s,id){const c=CONTRACTS[id];return !!c&&!s.active&&(!c.requires||s.contracts[c.requires]?.status==='complete')&&(s.contracts[id]?.status!=='complete'||!!c.repeatable);}
export function acceptContract(s,id){if(!canAccept(s,id))return false;s.active=id;s.contracts[id]={status:'active',stage:0,cells:0,decision:null,inspected:false};if(id==='salvage'){s.salvageRuns++;s.collected=s.collected.filter(x=>!x.startsWith('wreck:'));s.defeated=s.defeated.filter(x=>!x.startsWith('wreck:'));}return true;}
export function recoverObjective(s,id){const c=s.contracts[id];if(s.active!==id||c?.status!=='active')return false;c.stage=id==='salvage'?1:2;return true;}
export function collectCell(s,key){if(s.active!=='salvage'||s.contracts.salvage?.status!=='active'||s.collected.includes(key))return false;s.collected.push(key);s.contracts.salvage.cells=Math.min(3,s.contracts.salvage.cells+1);if(s.contracts.salvage.cells===3)s.contracts.salvage.stage=1;return true;}
export function extractContract(s){const c=s.contracts[s.active];if(!c||c.status!=='active')return false;const ready=s.active==='salvage'?c.cells>=3:c.stage>=2;if(!ready)return false;c.status='recovered';return true;}
export function deliverContract(s,decision='settlement'){
  const id=s.active,c=s.contracts[id],def=CONTRACTS[id];if(!def||c?.status!=='recovered')return null;
  if(id==='regulator'&&!['settlement','buyer'].includes(decision))return null;
  let pay=def.pay;if(id==='regulator'){c.decision=decision;if(decision==='buyer'){pay+=500;s.reputation.kharuun-=2;s.reputation.frontier--;}else{s.reputation.kharuun+=2;s.reputation.frontier++;}}else s.reputation.frontier++;
  s.credits+=pay;const levels=addXP(s,def.xp);c.status='complete';s.active=null;
  if(id==='audit'&&!s.dossiers.includes('audit'))s.dossiers.push('audit');
  if(id==='regulator'&&!s.dossiers.includes('regulator'))s.dossiers.push('regulator');
  return {id,pay,xp:def.xp,levels,decision:c.decision};
}
export function buyGear(s,id){const g=GEAR.find(g=>g.id===id);if(!g||s.credits<g.price||(!g.repeatable&&s.gear.includes(id))||(id==='medkit'&&s.medkits>=5))return false;s.credits-=g.price;if(id==='medkit')s.medkits++;else{s.gear.push(id);if(id==='armor')s.health=maxHealth(s);}return true;}
export function buyPerk(s,id){if(!Object.hasOwn(s.perks,id)||s.points<1||s.perks[id]>=3)return false;s.points--;s.perks[id]++;return true;}
export function restock(s){s.health=maxHealth(s);s.energy=100;s.medkits=Math.max(s.medkits,3);s.ammo={pistol:12,rifle:24};s.reserve={pistol:72,rifle:120};}
export function objectiveText(s){
  if(!s.active)return s.contracts.audit?.status==='complete'?'Choose your next contract at the bridge or the Anchorage.':'Use the bridge navigation table. Choose Paper Trail to start.';
  const c=s.contracts[s.active],def=CONTRACTS[s.active];
  if(c.status==='recovered')return 'Deliver the contract at Rapscallion’s navigation table.';
  if(s.zone!==def.zone)return `Travel to ${def.zone==='ufd'?'Kestrel Logistics':def.zone==='kharuun'?'Ember Reach':'Peregrine Drift'} from the bridge.`;
  if(s.active==='salvage')return c.cells<3?`Recover intact power cells · ${c.cells}/3`:'Return to the extraction airlock.';
  return def.objectives[Math.min(c.stage,2)];
}
