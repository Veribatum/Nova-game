import {Game} from './game.js?v=2';
const game=new Game();
window.addEventListener('error',e=>{game.issues.push(e.message);console.error('BLACKGLASS:',e.message);});
window.addEventListener('unhandledrejection',e=>{game.issues.push(String(e.reason?.message||e.reason));});
game.init().catch(e=>{console.error(e);document.getElementById('loadText').textContent='Unable to start: '+e.message;document.querySelector('.loadtrack').hidden=true;});
