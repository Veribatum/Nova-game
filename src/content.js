export const BUILD = '0.1.0 · FRONTIER';
export const ZONES = {
  ship:{name:'Rapscallion',subtitle:'Independent mercenary vessel',tag:'HOME DECK',color:'#72d9cd',description:'A questionable registration. An excellent view. A bridge, a workshop, crew to talk to, and a bunk that almost passes inspection.'},
  port:{name:'Wayfarer Anchorage',subtitle:'Free port · outer trade lanes',tag:'NEUTRAL SPACE',color:'#eac585',description:'Cargo brokers, quiet signal specialists, loud mechanics, and people who would prefer you stopped asking questions. Find work and purchase equipment.'},
  ufd:{name:'Kestrel Logistics',subtitle:'UFD power & cargo installation',tag:'RESTRICTED',color:'#6cbcdf',description:'An isolated audit archive beside the power core. Maintenance access provides a quieter route past the checkpoint.'},
  kharuun:{name:'Ember Reach',subtitle:'Kharuun industrial outpost',tag:'CONTESTED',color:'#eea16e',description:'Raiders have taken a thermal regulator from an outlying Kharuun settlement. Recover the physical unit. Their contractor wants it back intact.'},
  wreck:{name:'Peregrine Drift',subtitle:'Derelict survey vessel',tag:'SALVAGE CLAIM',color:'#b3a3df',description:'A dead ship, three live power cells, and a scavenger patrol that considers paperwork optional.'},
};
export const CONTRACTS = {
  audit:{id:'audit',title:'Paper Trail',zone:'ufd',kind:'RECOVERY · CHAPTER 01',pay:800,xp:180,client:'Aster Freight Mutual',description:'A freight insurer needs proof of a cargo seizure. Retrieve an authenticated export from the UFD’s isolated archive, then extract. Keep the reactor running.',briefing:'The audit archive is off the core chamber, beyond the security checkpoint and cooling hall. Take the main aisle or use the maintenance passage to the east. Return to the marked extraction airlock with the export.',objectives:['Reach the security checkpoint','Retrieve the cargo authorization from the archive','Return to the extraction airlock'],completion:'The authenticated export proves an unauthorized seizure. Aster pays in full. A routine receipt copy stays aboard Rapscallion.',note:'An external authorization bypassed the cargo review. Unusual, but not proof of a conspiracy.'},
  regulator:{id:'regulator',title:'Borrowed Fire',zone:'kharuun',kind:'PHYSICAL RECOVERY · CHAPTER 02',pay:1100,xp:240,client:'Ember Reach settlement engineer',requires:'audit',description:'A settlement engineer has lost a thermal regulator to an armed raider crew. Recover it from their refinery. A private buyer at the port offers more money for the same hardware.',briefing:'Follow the cooling conduits to the refinery vault. A heavy and two rifle troops protect the regulator. Retrieve it, then decide who receives it aboard Rapscallion. The settlement needs its heating restored.',objectives:['Reach the raider refinery','Recover the thermal regulator','Extract with the regulator'],completion:'The recovered regulator is secure. Your delivery decision will determine who benefits.',note:'The raiders received unusually clean transit clearance for stolen industrial equipment.'},
  salvage:{id:'salvage',title:'Dead Air',zone:'wreck',kind:'SALVAGE · OPTIONAL',pay:500,xp:110,client:'Wayfarer salvage cooperative',repeatable:true,description:'Recover three intact power cells from the Peregrine survey wreck. Scavenger drones are still active.',briefing:'Search the cargo deck, sensor lab, and aft engineering bay for three power cells. The bow airlock is your extraction point. Sensor interference makes the wreck feel worse than it is. Probably.',objectives:['Recover three intact power cells','Return to the extraction airlock'],completion:'The cooperative accepts the cells. For once, nobody makes the deal complicated.'},
};
export const WEAPONS = {
  pistol:{name:'Kestrel P12',short:'P12 · SIDEARM',capacity:12,damage:34,interval:.32,spread:.024,description:'Precise semi-automatic sidearm. Compact, dependable, paid for.'},
  rifle:{name:'Morrow AR24',short:'AR24 · RIFLE',capacity:24,damage:27,interval:.12,spread:.045,description:'Automatic rifle with a larger magazine. Hold FIRE for sustained fire.'},
};
export const GEAR = [
  {id:'rifle',name:'Morrow AR24',type:'PRIMARY WEAPON',price:550,description:'Unlock the automatic rifle and switch between two weapons.'},
  {id:'armor',name:'Composite lining',type:'COMBAT',price:400,description:'Increase maximum health by 25. Restore health on purchase.'},
  {id:'capacitor',name:'Extended cloak cell',type:'INFILTRATION',price:450,description:'Cloak drains 35% more slowly.'},
  {id:'bypass',name:'Service transponder',type:'ESPIONAGE',price:350,description:'Open the maintenance security bypass without raising an alarm.'},
  {id:'medkit',name:'Field medkit',type:'CONSUMABLE',price:75,repeatable:true,description:'Restore 60 health. Carry up to five. Use H or MED in the field.'},
];
export const PERKS = [
  {id:'combat',name:'Steady hands',path:'COMBAT',description:'Deal 20% more weapon damage per rank. Three ranks.'},
  {id:'stealth',name:'Quiet professional',path:'INFILTRATION',description:'Reduce enemy detection range by 12% per rank. Three ranks.'},
  {id:'tech',name:'Systems specialist',path:'ESPIONAGE',description:'Recharge cloak 25% faster per rank. Three ranks.'},
];
export const DOSSIERS = {
  captain:{title:'Captain Nova',tag:'PERSONNEL',text:'Human. Independent mercenary captain. Red hair, loose morals, a functioning conscience, and an impressive ability to make expensive people angry. Her edge comes from technology, preparation, and occasionally being faster than the consequences.'},
  rapscallion:{title:'The Rapscallion',tag:'VESSEL',text:'Home, transport, workshop, and evidence locker. The mismatched panels are deliberate. The cable insulation is less deliberate. Your ship carries a receipt copy of completed contracts so clients cannot conveniently forget what they paid for.'},
  vyraen:{title:'The Vyraen',tag:'SPECIES',text:'Tall, deliberate signal specialists from Nythra. Pale skin, dark reflective eyes, and a culture that treats knowledge as a matter of listening carefully. Their navigation and sensor expertise makes them valuable far beyond their own space. “Patterns travel farther than we do.”'},
  kharuun:{title:'The Kharuun',tag:'SPECIES',text:'A bone-armored people whose Ascended members dominate political and military life. Their technology pairs powerful inherited systems with rough repairs. Outsiders often mistake cultural authority for biological inevitability. Nova has not yet learned the full story behind Ascension.'},
  keshar:{title:'Keshar integration work',tag:'FIELD NOTES',text:'Keshar specialists have a reputation for making incompatible technologies operate together. Their salvage knowledge and their relationship with Relic Keepers matter more than the label on the original manufacturer’s case.'},
  audit:{title:'Cargo authorization 7C-19',tag:'RECOVERED EVIDENCE',text:'A valid seizure record with an unusual external override. Ordinary explanation: an authorized exception. Unresolved detail: the normal cargo review was bypassed. The receipt is evidence of a transaction, not an answer to a larger mystery.'},
  regulator:{title:'Industrial transit clearance',tag:'RECOVERED EVIDENCE',text:'The stolen regulator travelled under clearance from the same external administrative office seen in the Kestrel cargo record. Shared suppliers and paperwork exist. This overlap is worth keeping; it does not yet establish coordinated manipulation.'},
  wreck:{title:'Peregrine final survey',tag:'SURVEY LOG',text:'The last sensor sweep flagged a missing return inside an otherwise coherent field. The log calls it calibration drift. No crew testimony survives here to explain it. An unexplained reading should remain unexplained until independent evidence says more.'},
};
export const NPCS = {
  navigator:{name:'Ilyra',role:'Vyraen navigator',species:'vyraen',color:0x719fba,opening:'The port is quiet, by its standards. Which means the machinery is screaming and three people are lying about their cargo.'},
  engineer:{name:'Rook',role:'Keshar integration specialist',species:'keshar',color:0xca9c62,opening:'I persuaded the port coupling to talk to the ship coupling. They hate each other. Honestly, that’s most of engineering.'},
  broker:{name:'Mara Venn',role:'Contract broker',species:'human',color:0x883e42,opening:'Captain. I have honest work, discreet work, and work where those two categories are having a difficult relationship.'},
  trader:{name:'Vex',role:'Quartermaster',species:'human',color:0x578d8c,opening:'You break it, I sell you a better one. That’s the most stable relationship on this station.'},
  listener:{name:'Sael',role:'Vyraen surveyor',species:'vyraen',color:0x879fba,opening:'There are routes on old charts that no longer appear in current surveys. Most are clerical errors. I keep the old charts.'},
  buyer:{name:'Hale',role:'Independent acquisitions',species:'human',color:0x6a586b,opening:'If you find an industrial thermal regulator, I have a buyer. Better money than a settlement engineer can offer. Think about it.'},
};
