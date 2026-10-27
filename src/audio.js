export class AudioEngine{
  constructor(enabled){this.enabled=enabled;this.ctx=null;this.timer=0;this.beat=0;this.stepTimer=0;}
  init(){if(!this.ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;this.ctx=new C();this.master=this.ctx.createGain();this.master.gain.value=.13;this.master.connect(this.ctx.destination);}if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});}
  tone(freq,duration=.2,type='sine',volume=.2,slide=0){if(!this.ctx||!this.enabled())return;const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,slide),t+duration);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.03);o.onended=()=>{o.disconnect();g.disconnect();};}
  noise(duration=.15,volume=.15,cutoff=1200){if(!this.ctx||!this.enabled())return;const len=Math.floor(this.ctx.sampleRate*duration),buffer=this.ctx.createBuffer(1,len,this.ctx.sampleRate),d=buffer.getChannelData(0);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);const src=this.ctx.createBufferSource(),g=this.ctx.createGain(),filter=this.ctx.createBiquadFilter();src.buffer=buffer;filter.type='lowpass';filter.frequency.value=cutoff;g.gain.value=volume;src.connect(filter);filter.connect(g);g.connect(this.master);src.start();src.onended=()=>{src.disconnect();filter.disconnect();g.disconnect();};}
  ui(){this.tone(640,.07,'sine',.13,850);}
  shoot(rifle=false){this.tone(rifle?115:155,.13,'sawtooth',.32,42);this.noise(.1,.5,rifle?1800:2400);}
  reload(){this.noise(.12,.3,3500);this.tone(210,.1,'triangle',.12,90);}
  hit(){this.tone(900,.08,'sine',.18,400);}
  hurt(){this.noise(.25,.4,500);}
  pickup(){this.tone(440,.15,'sine',.2);this.tone(660,.35,'sine',.17);}
  cloak(){this.tone(350,.7,'sine',.23,90);}
  step(){this.noise(.07,.07,500);}
  update(dt,zone){if(!this.ctx)return;this.master.gain.setTargetAtTime(this.enabled()?.13:0,this.ctx.currentTime,.2);this.timer-=dt;if(this.timer<=0){this.timer=1.8;const notes=zone==='kharuun'?[55,65.41,73.42,58.27]:[55,65.41,82.41,73.42];const root=notes[Math.floor(this.beat/8)%notes.length];this.tone(root,3.4,'sine',.08);this.tone(root*1.5,2.7,'triangle',.025);if(this.beat%2===0)this.tone(root*[4,6,5,3][this.beat%4],1.8,'sine',.035);this.beat++;}}
}
