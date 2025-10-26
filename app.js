/* CubeSat Orbit — PWA Python (Pyodide)
 * MIT 2025
 */
'use strict';

const elStatus = document.getElementById('status');
const elLog = document.getElementById('log');
const elRun = document.getElementById('run');
const elPlay = document.getElementById('play');
const elReset = document.getElementById('reset');
const elAlt = document.getElementById('alt');
const elEcc = document.getElementById('ecc');
const elDur = document.getElementById('dur');
const elDt = document.getElementById('dt');
const canvas = document.getElementById('view');
const ctx = canvas.getContext('2d');
const elInstall = document.getElementById('btnInstall');

let pyodide = null;
let orbit = []; // [{x,y,t}, ...] in km
let playing = false;
let tAnim = 0; // seconds
let lastTs = null;

// PWA install prompt
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  elInstall.hidden = false;
});
elInstall?.addEventListener('click', async ()=>{
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  elInstall.hidden = true;
});

// Service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
}

// Boot Pyodide
(async function boot(){
  try{
    elStatus.textContent = 'Scarico Pyodide…';
    pyodide = await loadPyodide();
    elStatus.textContent = 'Carico main.py…';
    const code = await fetch('./main.py').then(r=>r.text());
    pyodide.FS.writeFile('main.py', code);
    await pyodide.runPythonAsync(`import main`);
    elStatus.textContent = 'Pronto ✅';
    log('Pyodide pronto. Premi “Simula”.');
  }catch(e){
    elStatus.textContent = 'Errore: ' + e.message;
    log(e.stack||e.message);
  }
})();

function log(msg){
  elLog.textContent = (elLog.textContent+'\n'+msg).slice(-2000);
}

function km2pxScale(points, margin=30){
  // Find bounding box
  let minx=1e9,maxx=-1e9,miny=1e9,maxy=-1e9;
  for(const p of points){ minx=Math.min(minx,p.x); maxx=Math.max(maxx,p.x); miny=Math.min(miny,p.y); maxy=Math.max(maxy,p.y); }
  const w = canvas.width - 2*margin;
  const h = canvas.height - 2*margin;
  const sx = w / Math.max(1e-6, (maxx-minx));
  const sy = h / Math.max(1e-6, (maxy-miny));
  const s = Math.min(sx, sy);
  const ox = margin - minx*s;
  const oy = margin - miny*s;
  return {s, ox, oy, minx, maxx, miny, maxy};
}

function drawScene(timeSec){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if (!orbit.length){
    // Draw Earth disk default
    drawEarthDefault();
    return;
  }

  const {s, ox, oy} = km2pxScale(orbit, 40);

  // Draw Earth (R=6371 km) centered at origin. Transform center:
  const cx = 0*s + ox;
  const cy = 0*s + oy;
  ctx.beginPath();
  ctx.arc(cx, cy, 6371*s, 0, Math.PI*2);
  ctx.fillStyle = '#0e3a8a';
  ctx.fill();
  ctx.strokeStyle = '#1c2550';
  ctx.stroke();

  // Orbit path
  ctx.beginPath();
  for(let i=0;i<orbit.length;i++){
    const p = orbit[i];
    const x = p.x*s + ox;
    const y = p.y*s + oy;
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.strokeStyle = '#2dd4bf';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Satellite position at current time
  const totalT = orbit[orbit.length-1].t;
  const tt = ((timeSec % totalT) + totalT) % totalT;
  // Find index
  let j = 0;
  while (j<orbit.length-1 && orbit[j+1].t < tt) j++;
  const p = orbit[j];
  const sxp = p.x*s + ox;
  const syp = p.y*s + oy;
  ctx.beginPath();
  ctx.arc(sxp, syp, 6, 0, Math.PI*2);
  ctx.fillStyle = '#eaf1ff';
  ctx.fill();
  ctx.strokeStyle = '#93a4cc';
  ctx.stroke();
}

function drawEarthDefault(){
  // Center-ish disk
  ctx.save();
  ctx.translate(canvas.width/2, canvas.height/2);
  const r = Math.min(canvas.width, canvas.height)*0.25;
  ctx.beginPath();
  ctx.arc(0,0,r,0,Math.PI*2);
  ctx.fillStyle='#0e3a8a';
  ctx.fill();
  ctx.strokeStyle='#1c2550';
  ctx.stroke();
  ctx.restore();
}

async function simulate(){
  if(!pyodide){ log('Pyodide non inizializzato'); return; }
  const alt = Number(elAlt.value||500);
  const ecc = Math.min(0.9, Math.max(0, Number(elEcc.value||0)));
  const durMin = Number(elDur.value||96);
  const dt = Math.max(1, Number(elDt.value||20));
  try{
    elStatus.textContent = 'Calcolo orbita…';
    const code = `import main\nmain.propagate_from_perigee(${alt}, ${ecc}, ${int(durMin*60)}, ${int(dt)})`;
    const res = await pyodide.runPythonAsync(code);
    // res is a Python list of tuples -> converted to JS automatically
    orbit = res.map(r=>({x:r[0], y:r[1], t:r[2]}));
    elStatus.textContent = 'Pronto ✅';
    log(`Punti: ${orbit.length} | Periodo simulato: ${durMin} min`);
    tAnim = 0;
    drawScene(tAnim);
  }catch(e){
    elStatus.textContent = 'Errore: '+e.message;
    log(e.stack||e.message);
  }
}

elRun.addEventListener('click', simulate);
elReset.addEventListener('click', ()=>{ tAnim=0; drawScene(tAnim); });
elPlay.addEventListener('click', ()=>{ playing = !playing; });

function loop(ts){
  if(lastTs==null) lastTs = ts;
  const dt = (ts - lastTs)/1000;
  lastTs = ts;
  if (playing && orbit.length){
    tAnim += dt;
  }
  drawScene(tAnim);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
