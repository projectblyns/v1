
const $=(s,e=document)=>e.querySelector(s),$$=(s,e=document)=>[...e.querySelectorAll(s)];
const S={name:'',pwHash:'',vol:8,z:10,off:false,ph:'power'};
let securityReady=Promise.resolve();
try{
  S.name=localStorage.getItem('mac_n')||'';
  S.pwHash=localStorage.getItem('blyns_password_hash')||'';
  const legacyPassword=localStorage.getItem('mac_p')||'';
  if(!S.pwHash&&legacyPassword){
    securityReady=window.BlynsSecurity.hashPassword(legacyPassword).then(hash=>{
      S.pwHash=hash;localStorage.setItem('blyns_password_hash',hash);localStorage.removeItem('mac_p');
    }).catch(error=>{console.warn('Password migration requires a secure browser context.',error);});
  }
}catch(e){console.warn('BlynsOS profile could not be loaded.',e)}
async function saveBlynsPassword(password){
  const hash=await window.BlynsSecurity.hashPassword(password);
  S.pwHash=hash;
  localStorage.setItem('blyns_password_hash',hash);
  localStorage.removeItem('mac_p');
  return hash;
}
async function verifyBlynsPassword(password){
  await securityReady.catch(()=>{});
  let storedHash='';
  let legacy='';
  try{
    storedHash=localStorage.getItem('blyns_password_hash')||S.pwHash||'';
    legacy=localStorage.getItem('mac_p')||'';
  }catch(error){console.warn('BlynsOS could not read account credentials.',error);}
  if(storedHash&&window.BlynsSecurity&&await window.BlynsSecurity.verifyPassword(password,storedHash)){
    S.pwHash=storedHash;
    return true;
  }
  // Compatibility for installations upgraded from the older local-password format.
  // The legacy value is immediately replaced with a salted hash after a successful sign-in.
  if(!storedHash&&legacy&&password===legacy){
    await saveBlynsPassword(password);
    return true;
  }
  return false;
}
let AC;function chime(){try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();const t=AC.currentTime;[174.6,261.6,349.2,440,523.3,698.5].forEach((f,i)=>{const o=AC.createOscillator(),g=AC.createGain();o.type=i%2?'triangle':'sine';o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.12*S.vol/8,t+.05);g.gain.exponentialRampToValueAtTime(.0001,t+2.6);o.connect(g).connect(AC.destination);o.start(t);o.stop(t+2.7)})}catch(e){}}
function show(id){S.ph=id;$$('.ph').forEach(p=>p.classList.toggle('on',p.id==id))}
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(e.t);e.t=setTimeout(()=>e.classList.remove('on'),2500)}
/* BOOT */
let started=false;
function boot(){
  const b=$('#boot');
  const hint=$('#hint');
  if(hint)hint.classList.add('is-hidden');
  $('#off').classList.remove('on');
  S.off=false;
  b.classList.remove('go');
  show('boot');
  void b.offsetWidth;
  b.classList.add('go');
  chime();
  setTimeout(()=>{
    securityReady.finally(()=>{
      if(S.name&&S.pwHash){lockInit();show('lock');}
      else if(typeof window.BlynsSetupStart==='function'){window.BlynsSetupStart();}
      else{console.error('BlynsOS Setup Assistant did not initialise.');show('setup');}
    });
  },3000);
}
function start(){if(started||S.off)return;started=true;boot()}
$('#power').addEventListener('click',start);
/* First-run setup is provided by the Stabilized Setup Assistant module below. */
/* LOCK */
function tick(){const d=new Date();$('#clock').textContent=d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit',hour12:false});$('#date').textContent=d.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'});$('#mt').textContent=d.toLocaleTimeString([],{weekday:'short',hour:'numeric',minute:'2-digit'})}
setInterval(tick,1000);tick();
function lockInit(){$('#lock').classList.remove('up');$('#lav').textContent=S.name[0].toUpperCase();$('#lnm').textContent=S.name;$('#pw').value='';setTimeout(()=>$('#pw').focus(),900)}
let unlockBusy=false;
async function attemptUnlock(){
  if(unlockBusy)return;
  const field=$('#pw'),error=$('#unlock-error');
  const password=field.value;
  if(!password){if(error)error.textContent='Enter your password to continue.';field.focus();return;}
  unlockBusy=true;field.disabled=true;if(error)error.textContent='';
  try{
    const valid=await verifyBlynsPassword(password);
    if(valid){
      S.ph='desk';
      $('#desk').classList.add('on');
      $('#lock').classList.add('up');
      if(error)error.textContent='';
      field.value='';
      field.blur();
      setTimeout(()=>$('#lock').classList.remove('on'),850);
      setTimeout(()=>{if(typeof restoreSavedWindows==='function')restoreSavedWindows();},900);
    }else{
      field.classList.remove('shake');void field.offsetWidth;field.classList.add('shake');field.value='';
      if(error)error.textContent='The password is not correct. Please try again.';
      field.focus();
    }
  }catch(err){
    if(error)error.textContent=err?.message||'Sign-in could not be completed. Reload and try again.';
    console.error('BlynsOS sign-in failed.',err);
  }finally{
    field.disabled=false;unlockBusy=false;
    if(S.ph==='lock'&&!field.value)field.focus();
  }
}
$('#pw').addEventListener('keydown',e=>{
  if(e.key==='Enter'){e.preventDefault();attemptUnlock();}
});
function logout(){$$('.win').forEach(w=>w.remove());for(const k in W)delete W[k];$$('.di').forEach(d=>d.classList.remove('on'));$('#lock').classList.add('on');lockInit();$('#desk').classList.remove('on');S.ph='lock'}
/* GLOBAL KEYS */
function hud(){const e=$('#hud');$('#hb').innerHTML=Array.from({length:16},(_,i)=>`<i class="${i<S.vol*2?'f':''}"></i>`).join('');$('#hi').textContent=S.vol?'🔊':'🔇';e.classList.add('on');clearTimeout(e.t);e.t=setTimeout(()=>e.classList.remove('on'),1400)}
addEventListener('keydown',e=>{
if(e.shiftKey&&(e.metaKey||e.ctrlKey)&&e.code=='Space'){e.preventDefault();if(S.ph!='desk')return;const s=$('#siri');s.classList.toggle('on');if(s.classList.contains('on')){$('#sq').value='';$('#sq').focus()}return}
if(e.key=='Escape')$('#siri').classList.remove('on');
const t=e.target.tagName;if(t=='INPUT'||t=='TEXTAREA'){return}
if(!started){start();return}
if(e.key=='0'){if(S.off){S.off=false;$('#off').classList.remove('on');started=true;boot()}else shutdown();return}
if(S.off)return;
if(e.key=='-'||e.key=='_'){S.vol=Math.max(0,S.vol-1);hud()}if(e.key=='+'||e.key=='='){S.vol=Math.min(8,S.vol+1);hud()}});
$('#sq').addEventListener('keydown',e=>{if(e.key=='Enter'&&e.target.value.trim()){const q=e.target.value;$('#siri').classList.remove('on');openApp('siri',q)}});
/* WINDOWS */
const W={};
const APPS={};
function app(id,n,i,c,r,sz){APPS[id]={n,i,c,r,sz:sz||[620,440]}}
function openApp(id,arg){if(W[id]){const w=W[id];w.classList.remove('min');w.style.transform='';focus(w);if(arg&&w.q)w.q(arg);return}
const a=APPS[id],n=Object.keys(W).length,w=document.createElement('div');w.className='win';w.dataset.id=id;
const [ww,wh]=a.sz,mw=Math.min(ww,innerWidth-20),mh=Math.min(wh,innerHeight-120);Object.assign(w.style,{width:mw+'px',height:mh+'px',left:Math.max(8,(innerWidth-mw)/2+(n%6)*28-70)+'px',top:(50+(n%6)*26)+'px',opacity:0,transform:'scale(.86) translateY(24px)'});
w.innerHTML=`<div class="tb"><div class="tl"><i></i><i></i><i></i></div><span>${a.n}</span></div><div class="body"><div class="spl"><u>${ico(id)}</u>${a.n}<i><b></b></i></div></div>`+['n','s','e','w','ne','nw','se','sw'].map(d=>`<div class="h" d="${d}"></div>`).join('');
$('#wins').appendChild(w);W[id]=w;requestAnimationFrame(()=>requestAnimationFrame(()=>{w.style.opacity=1;w.style.transform=''}));dI(id).classList.add('on');focus(w);
const [r,y,g]=$$('.tl i',w);r.onclick=()=>{w.classList.add('gone');setTimeout(()=>{w.remove();delete W[id];const e=dI(id);e.classList.remove('on');if(!PIN.includes(id))e.remove()},280)};
y.onclick=()=>minim(w);g.onclick=()=>{if(w.mx){Object.assign(w.style,w.mx);w.mx=null;w.classList.remove('is-fullscreen')}else{w.mx={left:w.style.left,top:w.style.top,width:w.style.width,height:w.style.height};Object.assign(w.style,{left:'0px',top:'0px',width:innerWidth+'px',height:innerHeight+'px'});w.classList.add('is-fullscreen')}syncFullBar();updateDesktopState273()};
w.onpointerdown=()=>focus(w);
$('.tb',w).onpointerdown=e=>{if(e.target.closest('.tl')||w.mx)return;const x=e.clientX-w.offsetLeft,y=e.clientY-w.offsetTop;w.classList.add('drag');const m=ev=>{w.style.left=ev.clientX-x+'px';w.style.top=Math.max(28,ev.clientY-y)+'px'};const u=()=>{w.classList.remove('drag');removeEventListener('pointermove',m);removeEventListener('pointerup',u)};addEventListener('pointermove',m);addEventListener('pointerup',u)};
$('.tb',w).ondblclick=()=>g.click();
$$('.h',w).forEach(h=>h.onpointerdown=e=>{e.stopPropagation();focus(w);const d=h.getAttribute('d'),X=e.clientX,Y=e.clientY,L=w.offsetLeft,T=w.offsetTop,WW=w.offsetWidth,HH=w.offsetHeight;w.classList.add('drag');
const m=ev=>{const dx=ev.clientX-X,dy=ev.clientY-Y;if(d.includes('e'))w.style.width=Math.max(260,WW+dx)+'px';if(d.includes('s'))w.style.height=Math.max(160,HH+dy)+'px';if(d.includes('w')&&WW-dx>260){w.style.width=WW-dx+'px';w.style.left=L+dx+'px'}if(d.includes('n')&&HH-dy>160){w.style.height=HH-dy+'px';w.style.top=T+dy+'px'}};
const u=()=>{w.classList.remove('drag');removeEventListener('pointermove',m);removeEventListener('pointerup',u)};addEventListener('pointermove',m);addEventListener('pointerup',u)});
const body=$('.body',w);if(body.isConnected){body.innerHTML='';try{a.r(body,w,arg)}catch(err){body.innerHTML='<div style="padding:24px;color:#b42318"><b>App could not open</b><p style="margin-top:8px;font-size:12px">'+String(err.message||err)+'</p></div>';console.error('App render failed:',id,err)}}}
function focus(w){w.style.zIndex=++S.z;$('#an').textContent=APPS[w.dataset.id].n}
function minim(w){const d=$(`.di[data-id=${w.dataset.id}]`).getBoundingClientRect(),r=w.getBoundingClientRect();w.style.transform=`translate(${d.left+d.width/2-r.left-r.width/2}px,${d.top-r.top-r.height/2}px) scale(.08)`;w.classList.add('min')}
/* DOCK */
const dk=$('#dock');
function dockBuild(){dk.innerHTML=Object.entries(APPS).map(([id,a])=>`<div class="di" data-id="${id}" data-n="${a.n}"><u style="background:linear-gradient(${a.c})">${a.i}</u></div>`).join('');
$$('.di').forEach(d=>d.onclick=()=>{d.animate([{transform:'translateY(0)'},{transform:'translateY(-18px)'},{transform:'translateY(0)'}],400);openApp(d.dataset.id)})}
dk.addEventListener('mousemove',e=>$$('.di',dk).forEach(d=>{const r=d.getBoundingClientRect(),dist=Math.abs(e.clientX-(r.left+r.width/2)),s=1+1.0*Math.exp(-dist*dist/(2*55*55));d.style.transform=`scale(${s})`;d.style.margin=`0 ${(s-1)*20}px`}));
dk.addEventListener('mouseleave',()=>$$('.di',dk).forEach(d=>{d.style.transform='';d.style.margin=''}));
/* APP HELPERS */
const H=(b,h)=>b.innerHTML=h;
const sideApp=(b,items,render,t)=>{H(b,`<div class="row"><div class="side">${items.map((x,i)=>`<div class="${i?'':'a'}">${x}</div>`).join('')}</div><div class="main"></div></div>`);const m=$('.main',b);const go=i=>{$$('.side div',b).forEach((d,j)=>d.classList.toggle('a',i==j));m.innerHTML=render(items[i],i,m)};$$('.side div',b).forEach((d,i)=>d.onclick=()=>go(i));go(0);return m};
/* APPS */
app('finder','Files','🙂','#5ac8fa,#0a63d8',b=>{sideApp(b,['Recents','Applications','Desktop','Documents','Downloads','iCloud Drive'],(n)=>`<h3 style="margin-bottom:10px">${n}</h3>`+['Report.pdf','Notes.txt','Photo.heic','Budget.numbers','Project'].map(f=>`<div class="tile"><u style="background:#e4e4ea">${f.includes('.')?'📄':'📁'}</u>${f}</div>`).join(''))});
app('safari','Safari','🧭','#4fc3ff,#0a84ff',(b)=>{
H(b,`<div class="bar"><button id="bk">‹</button><button id="fw">›</button><button id="rl">⟳</button><input id="ad" placeholder="Search or enter website name"><button id="nm">🔔 Notify Me</button><button id="ex" title="Open in new tab">↗</button></div><div style="flex:1;display:flex;flex-direction:column;position:relative" id="pg"></div>`);
const pg=$('#pg',b),ad=$('#ad',b);let hist=[],ix=-1;
const home=()=>{H(pg,'<div style="padding:20px;overflow:auto"><h3 style="color:#222">Favorites</h3>'+[['Example','example.com','🌐'],['Wikipedia','wikipedia.org','📚'],['MDN','developer.mozilla.org','🧩'],['OpenStreetMap','openstreetmap.org','🗺️'],['Anthropic','anthropic.com','✨']].map(([n,u,i])=>`<div class="tile" data-u="${u}" style="color:#333"><u style="background:#e8e8ee">${i}</u>${n}</div>`).join('')+'<p style="color:#888;font-size:12px;margin-top:12px">Some sites block embedding in frames; use ↗ to open those in a new tab.</p></div>');$$('.tile',pg).forEach(t=>t.onclick=()=>nav(t.dataset.u))};
const nav=(q,push=true)=>{q=q.trim();if(!q)return;let u=/^https?:\/\//.test(q)?q:/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(q)?'https://'+q:'https://en.wikipedia.org/w/index.php?search='+encodeURIComponent(q);ad.value=u;if(push){hist=hist.slice(0,ix+1);hist.push(u);ix++}H(pg,'<div class="spl" style="color:#666"><div class="sp" style="border-color:#ddd;border-top-color:#888"></div>Loading…</div>');setTimeout(()=>{H(pg,`<iframe src="${u}" referrerpolicy="no-referrer"></iframe>`)},400)};
ad.onkeydown=e=>{if(e.key=='Enter')nav(ad.value)};$('#bk',b).onclick=()=>{if(ix>0)nav(hist[--ix],false);else{ix=-1;ad.value='';home()}};$('#fw',b).onclick=()=>{if(ix<hist.length-1)nav(hist[++ix],false)};$('#rl',b).onclick=()=>{if(hist[ix])nav(hist[ix],false)};
let on=0;$('#nm',b).onclick=e=>{on=!on;e.target.textContent=on?'🔔 Tracking ✓':'🔔 Notify Me';toast(on?'You’ll be notified of changes to this page':'Notifications off')};$('#ex',b).onclick=()=>hist[ix]&&open(hist[ix],'_blank');home()},[760,500]);
app('siri','Siri','🌈','#bf5af2,#0a84ff',(b,w,arg)=>{
H(b,'<div class="chat" style="flex:1;display:flex;flex-direction:column;min-height:0"><div id="lg" style="flex:1;overflow:auto;padding:14px"></div><input id="si" placeholder="Ask Blyns Assistant…"><canvas id="cv" height="70" style="width:100%;background:#0b0b14"></canvas></div>');
const lg=$('#lg',b),add=(t,c)=>{lg.insertAdjacentHTML('beforeend',`<div class="msg ${c}">${t}</div>`);lg.scrollTop=1e9};
const ans=q=>{q=q.toLowerCase();if(/time/.test(q))return'It’s '+new Date().toLocaleTimeString();if(/date|day/.test(q))return'Today is '+new Date().toDateString();if(/hello|hi\b/.test(q))return'Hi '+S.name+'! How can I help?';if(/joke/.test(q))return'Why did the Blyns desktop feel calmer? It finally closed its extra windows.';if(/weather/.test(q))return'Live weather data is not connected. Open Navigator to check a current forecast.';if(/volume/.test(q))return'Volume is at '+S.vol*12.5+'%.';if(/open (\w+)/.test(q)){const m=q.match(/open (\w+)/)[1];if(APPS[m]){openApp(m);return'Opening '+APPS[m].n+'.'}}const c=q.replace(/x/g,'*').match(/^[\d+\-*\/.() ]+$/);if(c)try{return'That’s '+Function('return '+c[0])()}catch(e){}return'I can help with local time, date, volume, simple calculations and opening installed apps. Use Navigator for current information from the web.'};
const say=q=>{add(q,'me');setTimeout(()=>add(ans(q),'bot'),600)};w.q=say;add('Hi '+S.name+', I’m Blyns Assistant. Ask me anything.','bot');
$('#si',b).onkeydown=e=>{if(e.key=='Enter'&&e.target.value){say(e.target.value);e.target.value=''}};if(arg)say(arg);
const cv=$('#cv',b),x=cv.getContext('2d');cv.width=cv.clientWidth;let t=0;(function f(){if(!b.isConnected)return;t+=.05;x.clearRect(0,0,cv.width,70);[['#ff2d95',1],['#0a84ff',1.4],['#30d158',.8]].forEach(([c,k],j)=>{x.beginPath();x.strokeStyle=c;x.globalAlpha=.8;x.lineWidth=2.5;for(let i=0;i<=cv.width;i+=3){const y=35+Math.sin(i/(40*k)+t*(j+1))*Math.sin(i/cv.width*Math.PI)*22*Math.sin(t*k+j);i?x.lineTo(i,y):x.moveTo(i,y)}x.stroke()});requestAnimationFrame(f)})()},[420,520]);
app('messages','Messages','💬','#5be26b,#1db23a',b=>{H(b,'<div class="chat" style="flex:1;display:flex;flex-direction:column"><div style="padding:8px;text-align:center;font-size:12px;color:#888;background:#f0f0f3">To: Mom</div><div id="lg" style="flex:1;padding:12px;overflow:auto"><div class="msg bot">Did you eat yet? 🍜</div></div><input id="mi" placeholder="iMessage"></div>');const lg=$('#lg',b);$('#mi',b).onkeydown=e=>{if(e.key=='Enter'&&e.target.value){lg.insertAdjacentHTML('beforeend',`<div class="msg me">${e.target.value.replace(/</g,'&lt;')}</div>`);e.target.value='';setTimeout(()=>{lg.insertAdjacentHTML('beforeend','<div class="msg bot">Haha okay! ❤️</div>');lg.scrollTop=1e9},900)}}},[520,460]);
app('mail','Mail','✉️','#5ac8fa,#007aff',b=>{const M=[['Apple','Welcome to BlynsOS 27','Your Mac is ready. Explore Liquid Glass.'],['Mom','Dinner Sunday?','Come by around 6, I’m cooking.'],['GitHub','New sign-in','We noticed a new sign-in to your account.']];const m=sideApp(b,M.map(x=>x[0]),(n,i)=>`<h3>${M[i][1]}</h3><p style="color:#888;margin:6px 0 14px">From ${M[i][0]}</p><p>${M[i][2]}</p>`)},[640,420]);
app('maps','Maps','🗺️','#7be08a,#2a9d4a',b=>{H(b,'<div class="bar"><input placeholder="Search Maps"></div><svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" style="flex:1;background:#e9efdc"><path d="M0 300 Q200 220 360 320 T600 260 V400H0Z" fill="#a8d4f5"/><path d="M0 120 H600 M200 0 V400 M420 0 V400 M0 220 H600" stroke="#fff" stroke-width="9"/><path d="M60 40 L540 360" stroke="#f7d86a" stroke-width="7"/><circle cx="300" cy="170" r="9" fill="#ff3b30"/></svg>')});
app('photos','Photos','🌸','#ffd166,#ef476f',b=>{H(b,'<div class="main" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:6px">'+Array.from({length:18},(_,i)=>`<div class="ph2" style="height:110px;background:linear-gradient(${i*37}deg,hsl(${i*47},80%,60%),hsl(${i*47+60},80%,45%))"></div>`).join('')+'</div>')});
app('calendar','Calendar','📅','#fff,#ddd',b=>{const d=new Date(),f=new Date(d.getFullYear(),d.getMonth(),1).getDay(),n=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();let c='';for(let i=0;i<f;i++)c+='<div></div>';for(let i=1;i<=n;i++)c+=`<div style="padding:12px;border:1px solid #e5e5e8;${i==d.getDate()?'background:#ff3b30;color:#fff;border-radius:8px':''}">${i}</div>`;H(b,`<div class="main"><h2 style="color:#ff3b30">${d.toLocaleString([],{month:'long',year:'numeric'})}</h2><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-top:12px;text-align:center">${['S','M','T','W','T','F','S'].map(x=>`<b>${x}</b>`).join('')}${c}</div></div>`)},[520,460]);
app('notes','Notes','📝','#ffe066,#f4b400',b=>{const N=['Welcome','Ideas','Groceries'];const m=sideApp(b,N,(n)=>`<textarea style="width:100%;height:100%;border:0;outline:none;font-size:15px;resize:none;background:none;color:#222" placeholder="Start typing…">${n=='Welcome'?'Welcome to Notes on BlynsOS 1.0!':''}</textarea>`)});
app('reminders','Reminders','☑️','#fff,#ddd',b=>{H(b,'<div class="main"><h2 style="color:#0a84ff;margin-bottom:10px">Today</h2><div id="rl"></div><input class="in" id="ri" placeholder="New Reminder" style="width:100%;margin:10px 0"></div>');const add=t=>$('#rl',b).insertAdjacentHTML('beforeend',`<label style="display:block;padding:7px 0;border-bottom:1px solid #eee"><input type="checkbox"> ${t}</label>`);['Buy milk','Call Mom'].forEach(add);$('#ri',b).onkeydown=e=>{if(e.key=='Enter'&&e.target.value){add(e.target.value.replace(/</g,'&lt;'));e.target.value=''}}},[420,440]);
app('music','Music','🎵','#ff6b81,#fa233b',b=>{sideApp(b,['Listen Now','Browse','Radio','Library'],n=>`<h3>${n}</h3><div style="margin:12px 0">`+['Golden Hour','Night Drive','Lo-fi Loop','Sunrise'].map((s,i)=>`<div class="ml" onclick="toast('Playing ${s}')">▶ ${s} <span style="float:right;color:#999">3:${10+i*7}</span></div>`).join('')+'</div>')},[620,420]);
app('weather','Weather','⛅','#4facfe,#1a5fd0',b=>{H(b,`<div style="flex:1;background:linear-gradient(#3a7bd5,#00d2ff);color:#fff;padding:24px;text-align:center"><div>Labuan</div><div style="font-size:72px;font-weight:200">31°</div><div>Partly Cloudy</div><div style="display:flex;gap:10px;justify-content:center;margin-top:24px">${['Wed ⛅ 31','Thu 🌧️ 28','Fri ☀️ 32','Sat ⛅ 30'].map(x=>`<div style="background:rgba(255,255,255,.2);padding:10px;border-radius:12px">${x}°</div>`).join('')}</div></div>`)},[400,420]);
app('clock','Clock','🕒','#333,#000',b=>{H(b,'<div class="main" style="background:#111;color:#fff"><h3>World Clock</h3><div id="wc"></div></div>');const z=[['Labuan','Asia/Kuala_Lumpur'],['Cupertino','America/Los_Angeles'],['London','Europe/London'],['Tokyo','Asia/Tokyo']];const u=()=>{if(!b.isConnected)return;$('#wc',b).innerHTML=z.map(([n,t])=>`<div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #333"><span>${n}</span><span style="font-size:24px;font-weight:300">${new Date().toLocaleTimeString([],{timeZone:t,hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})}</span></div>`).join('');setTimeout(u,1000)};u()},[380,380]);
app('calc','Calculator','🧮','#ff9f0a,#c46f00',b=>{b.classList.add('calc');H(b,'<div class="dsp" id="d">0</div><div class="cg">'+['C','±','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','.','⌫','='].map(k=>`<button class="${'÷×−+='.includes(k)?'o':'0'==k||/\d|\./.test(k)?'':'f'}">${k}</button>`).join('')+'</div>');let e='';const d=$('#d',b);$$('button',b).forEach(k=>k.onclick=()=>{const v=k.textContent;if(v=='C')e='';else if(v=='⌫')e=e.slice(0,-1);else if(v=='=')try{e=String(+Function('return '+e.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-'))().toFixed(8))}catch(x){e=''}else if(v=='±')e=e.startsWith('-')?e.slice(1):'-'+e;else e+=v;d.textContent=e||'0'})},[300,460]);
app('terminal','Console','⌨️','#303641,#080b12',b=>{
H(b,'<div class="dark"><div id="o">BlynsOS local console · browser profile only\nType &quot;help&quot; to view available commands.</div><div>blyns&gt; <input id="t" autocomplete="off" spellcheck="false"></div></div>');
const o=$('#o',b),commands={
 help:'Available commands: help, date, whoami, ls, apps, version, clear, echo <text>',
 date:()=>new Date().toString(),
 whoami:()=>S.name||'User',
 ls:()=>['Desktop','Documents','Downloads'].map(n=>n+': '+((FS&&FS[n]||[]).length)+' item(s)').join('\n'),
 apps:()=>Object.values(APPS).map(a=>a.n).sort().join('\n'),
 version:'BlynsOS 1.0 Stabilized'
};
const input=$('#t',b);
input.onkeydown=e=>{
 if(e.key!=='Enter')return;
 const raw=input.value.trim();input.value='';
 if(!raw)return;
 if(raw==='clear'){o.textContent='BlynsOS local console · browser profile only\nType "help" to view available commands.';return;}
 let result;
 if(raw.startsWith('echo '))result=raw.slice(5);
 else {result=commands[raw];if(typeof result==='function')result=result();}
 if(result===undefined)result='Command not available in this local console.';
 o.insertAdjacentText('beforeend','\n\nblyns> '+raw+'\n'+String(result));o.style.whiteSpace='pre-wrap';
};
},[560,360]);
app('store','App Store','🅰️','#4fc3ff,#0a6cff',b=>{H(b,'<div class="main"><h2 style="margin-bottom:10px">Discover</h2>'+['Pages','Keynote','Xcode','Final Cut Pro'].map(a=>`<div class="ml" style="display:flex;justify-content:space-between;align-items:center">${a}<button class="pb st" style="padding:4px 16px;font-size:13px">Get</button></div>`).join('')+'</div>');$$('.st',b).forEach(x=>x.onclick=()=>{x.textContent='…';setTimeout(()=>x.textContent='Open',1200)})},[540,420]);
app('settings','Blyns Settings','⚙️','#9a9aa0,#55555a',b=>{
const sec=['Wi-Fi','Appearance','Sound','Users & Groups','About'];
sideApp(b,sec,(n,i,m)=>{if(n=='Wi-Fi')return'<h3>Wi-Fi</h3><p style="margin-top:10px">Connected to Golden Gate Home 📶</p>';
if(n=='Appearance'){setTimeout(()=>{const r=$('#lg',m),c=$('#hc',m);r.oninput=()=>{const v=+r.value;document.documentElement.style.setProperty('--blur',v*.6+'px');document.documentElement.style.setProperty('--g',(v/100*.6).toFixed(2))};c.onchange=()=>document.body.classList.toggle('hc',c.checked);c.checked=document.body.classList.contains('hc')});return'<h3>Appearance</h3><p style="margin:16px 0 6px">Liquid Glass transparency</p><input id="lg" type="range" min="0" max="100" value="50" style="width:100%"><p style="margin:18px 0"><label><input id="hc" type="checkbox"> High-contrast window borders</label></p>'}
if(n=='Sound'){setTimeout(()=>{$('#vs',m).oninput=e=>{S.vol=+e.target.value;hud()}});return`<h3>Sound</h3><p style="margin:16px 0 6px">Output volume</p><input id="vs" type="range" min="0" max="8" value="${S.vol}" style="width:100%">`}
if(n=='Users & Groups'){setTimeout(()=>$('#lo',m).onclick=logout);return`<h3>Users & Groups</h3><p style="margin:12px 0">${S.name} (Admin)</p><button class="pb" id="lo">🔒 Lock Screen / Log Out</button>`}
return'<h3>About BlynsOS</h3><p style="margin-top:10px">BlynsOS 1.0<br>Chip: Blyns Core<br>Memory: 32 GB</p><p style="margin-top:18px"><button class="pb" style="background:#ff3b30" id="fr">Erase All Content and Settings…</button></p>'+(setTimeout(()=>{const x=$('#fr',m);x&&(x.onclick=()=>ask('This erases your account, files and notes, then restarts Setup Assistant.','Erase',factory))}),'')},0)},[680,460]);
/* ===== 27.2 ===== */
document.body.insertAdjacentHTML('beforeend','<div id="am"></div><div id="lp"></div><div id="mc"></div><div id="dlg"></div>');
$('#desk').insertAdjacentHTML('afterbegin','<div id="ds"></div>');
$('#off').innerHTML='<div class="power-hint">0 to turn on</div>';
$('#off').onclick=()=>{if(S.off){S.off=false;$('#off').classList.remove('on');boot()}};
const PIN=['finder','launchpad','safari','siri','messages','mail','maps','photos','calendar','notes','reminders','music','store','terminal','settings'];
const CHG='Welcome to Notes on BlynsOS.\n\nYour notes are saved locally in this browser profile.';
const GL={
finder:'<rect width="50" height="100" fill="#fff" opacity=".28"/><path d="M33 34v16M67 34v16M27 66q23 16 46 0" stroke="#0b2447" stroke-width="5" stroke-linecap="round" fill="none"/>',
safari:'<circle cx="50" cy="50" r="38" fill="none" stroke="#fff" stroke-width="4"/><path d="M68 32L54 54 32 68 46 46Z" fill="#ff3b30"/><path d="M68 32L54 54 46 46Z" fill="#fff"/>',
siri:'<circle cx="50" cy="50" r="28" fill="#bf5af2"/><circle cx="44" cy="46" r="20" fill="#0a84ff" opacity=".9"/><circle cx="56" cy="56" r="16" fill="#ff2d95" opacity=".8"/><circle cx="50" cy="50" r="9" fill="#fff" opacity=".9"/>',
messages:'<ellipse cx="50" cy="46" rx="34" ry="27" fill="#fff"/><path d="M28 66L20 84 44 72Z" fill="#fff"/>',
mail:'<rect x="18" y="28" width="64" height="46" rx="7" fill="#fff"/><path d="M20 33L50 56 80 33" stroke="#0a84ff" stroke-width="5" fill="none"/>',
maps:'<path d="M0 70Q40 50 100 78V100H0Z" fill="#fff" opacity=".35"/><path d="M50 16a20 20 0 0 1 20 20c0 18-20 44-20 44S30 54 30 36a20 20 0 0 1 20-20z" fill="#ff3b30"/><circle cx="50" cy="36" r="8" fill="#fff"/>',
photos:'<rect width="100" height="100" fill="#fff"/><g opacity=".8"><circle cx="50" cy="33" r="17" fill="#ff9500"/><circle cx="67" cy="50" r="17" fill="#34c759"/><circle cx="50" cy="67" r="17" fill="#0a84ff"/><circle cx="33" cy="50" r="17" fill="#ff2d55"/></g>',
notes:'<rect width="100" height="100" fill="#fff"/><rect width="100" height="26" fill="#ffd60a"/><path d="M20 46h60M20 60h60M20 74h38" stroke="#d0d0d4" stroke-width="4"/>',
reminders:'<rect width="100" height="100" fill="#fff"/><circle cx="26" cy="28" r="7" fill="#ff3b30"/><circle cx="26" cy="52" r="7" fill="#ff9500"/><circle cx="26" cy="76" r="7" fill="#0a84ff"/><path d="M42 28h40M42 52h40M42 76h40" stroke="#ccc" stroke-width="4"/>',
music:'<path d="M40 70V34l30-8v36" stroke="#fff" stroke-width="6" fill="none"/><circle cx="33" cy="70" r="9" fill="#fff"/><circle cx="63" cy="62" r="9" fill="#fff"/>',
weather:'<circle cx="38" cy="38" r="16" fill="#ffd60a"/><path d="M26 74a14 14 0 0 1 4-27 18 18 0 0 1 34 4 12 12 0 0 1-2 23z" fill="#fff"/>',
clock:'<circle cx="50" cy="50" r="38" fill="#fff"/><path d="M50 50V26M50 50l16 8" stroke="#111" stroke-width="5" stroke-linecap="round"/><path d="M50 50L36 72" stroke="#ff9500" stroke-width="2"/>',
calc:'<rect x="22" y="18" width="56" height="18" rx="4" fill="#fff" opacity=".9"/><g fill="#fff"><circle cx="32" cy="54" r="7" opacity=".4"/><circle cx="50" cy="54" r="7" opacity=".4"/><circle cx="68" cy="54" r="7"/><circle cx="32" cy="74" r="7" opacity=".4"/><circle cx="50" cy="74" r="7" opacity=".4"/><circle cx="68" cy="74" r="7"/></g>',
terminal:'<path d="M24 34l18 14-18 14M48 68h28" stroke="#4cd964" stroke-width="7" fill="none" stroke-linecap="round"/>',
store:'<path d="M50 22L28 70M50 22l22 48M34 56h32" stroke="#fff" stroke-width="8" stroke-linecap="round" fill="none"/>',
settings:'<circle cx="50" cy="50" r="28" fill="none" stroke="#e4e4ea" stroke-width="12" stroke-dasharray="10 10.9"/><circle cx="50" cy="50" r="22" fill="#e4e4ea"/><circle cx="50" cy="50" r="9" fill="#6b6b72"/>',
launchpad:'<g fill="#fff"><rect x="22" y="22" width="16" height="16" rx="4" fill="#ff9500"/><rect x="42" y="22" width="16" height="16" rx="4" fill="#0a84ff"/><rect x="62" y="22" width="16" height="16" rx="4" fill="#34c759"/><rect x="22" y="42" width="16" height="16" rx="4" fill="#ff2d55"/><rect x="42" y="42" width="16" height="16" rx="4"/><rect x="62" y="42" width="16" height="16" rx="4" fill="#bf5af2"/><rect x="22" y="62" width="16" height="16" rx="4" fill="#ffd60a"/><rect x="42" y="62" width="16" height="16" rx="4" fill="#5ac8fa"/><rect x="62" y="62" width="16" height="16" rx="4" fill="#ff6b81"/></g>',
textedit:'<rect x="26" y="16" width="48" height="68" rx="4" fill="#fff" stroke="#ccc"/><path d="M34 34h32M34 46h32M34 58h20" stroke="#bbb" stroke-width="4"/><path d="M60 78l22-30 6 5-22 30-8 2z" fill="#ffb340"/>',
preview:'<rect x="16" y="24" width="68" height="52" rx="5" fill="#fff"/><circle cx="36" cy="42" r="7" fill="#ffb340"/><path d="M20 72l22-22 14 14 10-10 16 18z" fill="#34c759"/>'};
function ico(id){
 const a=APPS[id]||{};
 const src=a.icon||window.BlynsRegistry?.iconPath(id)||'../Assets/Icons/application.png';
 return `<img class="ic" src="${src}" alt="" draggable="false" onerror="this.onerror=null;this.src='../Assets/Icons/application.png'">`;
}
app('launchpad' ,'Launchpad','','#eef1f8,#8f9cc0',()=>{});
const dHTML=id=>`<div class="di" data-id="${id}" data-n="${APPS[id].n}"><u>${ico(id)}</u></div>`;
function wire(d){d.onclick=()=>{const id=d.dataset.id;if(id=='launchpad')return launchpad();d.animate([{transform:d.style.transform||'none'},{transform:'translateY(-22px)'},{transform:d.style.transform||'none'}],{duration:450,easing:'cubic-bezier(.3,1.5,.5,1)'});openApp(id)}}
function dockBuild(){dk.innerHTML=PIN.map(dHTML).join('');$$('.di',dk).forEach(wire)}
function dI(id){let e=$(`.di[data-id="${id}"]`);if(!e){dk.insertAdjacentHTML('beforeend',dHTML(id));e=dk.lastElementChild;wire(e)}return e}
const ld=(k,d)=>window.BlynsStorage.get(k,d),sv=(k,v)=>window.BlynsStorage.set(k,v);
const defFS=()=>({Desktop:[{n:'Welcome.txt',t:'txt',c:'Welcome to BlynsOS 1.0!\n\nDouble-click files to open them. Edit and press Save.'},{n:'Sunset.png',t:'img',c:'linear-gradient(160deg,#1b2a5e,#d9638f,#ffb86b)'}],Documents:[{n:'Todo.txt',t:'txt',c:'1. Mission Control (M)\n2. Stage Manager (S)\n3. Window snap (W)\n4. Launchpad (L)'},{n:'Aurora.png',t:'img',c:'linear-gradient(200deg,#0f2027,#2c9d8a,#9be15d)'}],Downloads:[{n:'Ocean.jpg',t:'img',c:'linear-gradient(180deg,#89f7fe,#0a5fb4)'}]});
let FS=ld('mac_fs',null)||defFS();
// Remove only the original gradient-image placeholders; keep files created by the user.
const seededPreviewImages=new Set([
  'Sunset.png|linear-gradient(160deg,#1b2a5e,#d9638f,#ffb86b)',
  'Aurora.png|linear-gradient(200deg,#0f2027,#2c9d8a,#9be15d)',
  'Ocean.jpg|linear-gradient(180deg,#89f7fe,#0a5fb4)'
]);
let removedSeedPreview=false;
Object.keys(FS||{}).forEach(folder=>{
  const before=Array.isArray(FS[folder])?FS[folder]:[];
  const after=before.filter(file=>!seededPreviewImages.has(`${file.n}|${file.c}`));
  if(after.length!==before.length){FS[folder]=after;removedSeedPreview=true;}
});
if(removedSeedPreview){try{sv('mac_fs',FS);}catch(error){console.warn('Could not clean old placeholder images.',error);}}
const fi=f=>f.t=='img'?`<div style="width:62px;height:46px;border-radius:5px;background:${f.c};border:2px solid #fff;box-shadow:0 1px 5px #0007"></div>`:'<svg width="46" height="58" viewBox="0 0 46 58"><path d="M2 2h30l12 12v42H2z" fill="#fff" stroke="#bbb"/><path d="M32 2v12h12" fill="#e5e5e5" stroke="#bbb"/><path d="M10 26h26M10 34h26M10 42h18" stroke="#bbb" stroke-width="3"/></svg>';
const esc=s=>s.replace(/</g,'&lt;');
function rd(){$('#ds').innerHTML=FS.Desktop.map((f,i)=>`<div class="tile" data-i="${i}" style="color:#fff;text-shadow:0 1px 3px #000">${fi(f)}<span>${esc(f.n)}</span></div>`).join('')}
$('#ds').ondblclick=e=>{const t=e.target.closest('.tile');if(t){if(t.dataset.app)openApp(t.dataset.app);else openFile(FS.Desktop[t.dataset.i])}};
const saveFS=()=>{sv('mac_fs',FS);rd()};
const openFile=f=>f.t=='img'?openApp('preview',f):openApp('textedit',f);
APPS.finder.r=(b,w)=>{let loc='Desktop',sel=null;H(b,'<div class="bar"><button id="nf">＋ New File</button><button id="dl">🗑 Delete</button><span id="pt" style="margin-left:auto;font-size:12px;color:#666"></span></div><div class="row"><div class="side"></div><div class="main"></div></div>');const L=['Applications','Desktop','Documents','Downloads'];
const rf=()=>{$('.side',b).innerHTML=L.map(x=>`<div class="${x==loc?'a':''}">${x=='Applications'?'🅰️':'📁'} ${x}</div>`).join('');$$('.side div',b).forEach((d,i)=>d.onclick=()=>{loc=L[i];sel=null;rf()});const m=$('.main',b);$('#pt',b).textContent=loc;
m.innerHTML=loc=='Applications'?Object.keys(APPS).filter(k=>k!='launchpad').map(k=>`<div class="tile" data-k="${k}"><u>${ico(k)}</u>${APPS[k].n}</div>`).join(''):(FS[loc].map((f,i)=>`<div class="tile" data-i="${i}">${fi(f)}<span>${esc(f.n)}</span></div>`).join('')||'<p style="color:#999">Folder is empty</p>');
$$('.tile',m).forEach(t=>{t.onclick=()=>{sel=t.dataset.i;$$('.tile',m).forEach(x=>x.style.background='');t.style.background='#cfe1ff';t.style.borderRadius='8px'};t.ondblclick=()=>t.dataset.k?openApp(t.dataset.k):openFile(FS[loc][t.dataset.i])})};
$('#nf',b).onclick=()=>{if(loc=='Applications')return;let n=1;while(FS[loc].some(f=>f.n=='Untitled '+n+'.txt'))n++;FS[loc].push({n:'Untitled '+n+'.txt',t:'txt',c:''});saveFS();rf()};
$('#dl',b).onclick=()=>{if(sel!=null&&loc!='Applications'){FS[loc].splice(sel,1);sel=null;saveFS();rf()}};rf()};APPS.finder.sz=[680,440];
app('textedit','TextEdit','','#fff,#e4e4ea',(b,w,f)=>{H(b,'<div class="bar"><b id="fn" style="font-size:13px;color:#333"></b><button id="sv" style="margin-left:auto">💾 Save</button></div><textarea style="flex:1;border:0;outline:none;padding:14px;font-size:15px;resize:none;color:#222;background:#fff"></textarea>');const ta=$('textarea',b);let cur;const set=x=>{cur=x||{n:'Untitled.txt',t:'txt',c:''};$('#fn',b).textContent=cur.n;ta.value=cur.c;$('.tb span',w).textContent='TextEdit — '+cur.n};w.q=set;set(f);
$('#sv',b).onclick=()=>{cur.c=ta.value;if(!Object.values(FS).some(a=>a.includes(cur)))FS.Documents.push(cur);saveFS();toast('Saved '+cur.n)}},[520,420]);
app('preview','Preview','','#6ac1ff,#3a6df0',(b,w,f)=>{H(b,'<div style="flex:1;display:flex;align-items:center;justify-content:center;background:#2b2b2e;overflow:auto"><div id="im" style="width:80%;height:80%;border-radius:6px;transition:transform .35s cubic-bezier(.3,1.3,.5,1)"></div></div><div class="bar"><span id="pn" style="font-size:12px"></span><input id="zm" type="range" min="40" max="200" value="100" style="margin-left:auto"></div>');const set=x=>{x=x||FS.Downloads[0]||{n:'Image',c:'#888'};$('#im',b).style.background=x.c;$('#pn',b).textContent=x.n;$('.tb span',w).textContent='Preview — '+x.n};w.q=set;set(f);$('#zm',b).oninput=e=>$('#im',b).style.transform=`scale(${e.target.value/100})`},[560,440]);
APPS.notes.r=b=>{let N=ld('mac_notes',null)||[{t:'Welcome',c:CHG}],i=0;if(N.length===1&&/^What.s new in 27\.1$/i.test(N[0].t||'')){N=[{t:'Welcome',c:CHG}];sv('mac_notes',N)};H(b,'<div class="bar"><button id="nn">＋ New</button><button id="nd">🗑 Delete</button></div><div class="row"><div class="side" style="width:190px"></div><div class="main" style="padding:0;display:flex"><textarea style="flex:1;border:0;outline:none;padding:16px;font-size:15px;line-height:1.5;resize:none;color:#222;background:#fff"></textarea></div></div>');
const ta=$('textarea',b),save=()=>sv('mac_notes',N),rl=()=>{$('.side',b).innerHTML=N.map((n,j)=>`<div class="${j==i?'a':''}"><b>${esc(n.t||'New Note')}</b></div>`).join('');$$('.side div',b).forEach((d,j)=>d.onclick=()=>{i=j;ta.value=N[i].c;rl()})};
ta.value=N[0].c;ta.oninput=()=>{N[i].c=ta.value;N[i].t=ta.value.split('\n')[0].slice(0,30);save();rl()};
$('#nn',b).onclick=()=>{N.unshift({t:'',c:''});i=0;ta.value='';save();rl();ta.focus()};$('#nd',b).onclick=()=>{N.splice(i,1);if(!N.length)N.push({t:'',c:''});i=0;ta.value=N[0].c;save();rl()};rl()};APPS.notes.sz=[720,480];
function ask(t,ok,fn){const d=$('#dlg');d.innerHTML=`<div class="dbx"><h3>${t}</h3><div><button class="pb" style="background:#666" id="dn">Cancel</button> <button class="pb" id="dy">${ok}</button></div></div>`;d.classList.add('on');$('#dn').onclick=()=>d.classList.remove('on');$('#dy').onclick=()=>{d.classList.remove('on');fn()}}
function menu(x,y,it){const m=$('#am');m.innerHTML=it.map((a,i)=>a?`<div data-i="${i}">${a[0]}</div>`:'<hr>').join('');m.style.left=Math.min(x,innerWidth-230)+'px';m.style.top=y+'px';m.classList.add('on');m.onclick=e=>{const i=e.target.dataset.i;if(i!=null){m.classList.remove('on');it[i][1]()}}}
addEventListener('pointerdown',e=>{if(!e.target.closest('#am,#ap'))$('#am').classList.remove('on')},true);
const clearWins=()=>{$$('.win').forEach(w=>w.remove());for(const k in W)delete W[k]};
function shutdown(){S.off=true;$('#off').classList.add('on');$$('.ph').forEach(p=>p.classList.remove('on'));clearWins();dockBuild()}
function restart(){shutdown();setTimeout(()=>{S.off=false;$('#off').classList.remove('on');boot()},1500)}
function factory(){try{['mac_n','mac_p','mac_fs','mac_notes'].forEach(k=>localStorage.removeItem(k))}catch(e){}S.name='';S.pwHash='';FS=defFS();rd();restart()}
$('#ap').innerHTML='<img class="blyns-menu-logo" src="https://i.postimg.cc/FHNw8SMW/Blyns-OS-Logo.jpg" alt="BlynsOS">';
$('#ap').onclick=()=>menu(8,28,[['About BlynsOS',()=>openApp('settings')],['Blyns Settings…',()=>openApp('settings')],['Blyns Store…',()=>openApp('store')],null,['Force Quit Front App',()=>{const w=topWin();w&&$('.tl i',w).click()}],null,['Lock Screen',logout],['Restart…',()=>ask('Are you sure you want to restart your computer now?','Restart',restart)],['Shut Down…',()=>ask('Are you sure you want to shut down your computer now?','Shut Down',shutdown)],null,['Erase All Content and Settings…',()=>ask('This erases your account, files and notes, then restarts Setup Assistant.','Erase',factory)],['Log Out '+S.name+'…',()=>ask('Log out '+S.name+'?','Log Out',logout)]]);
$('#desk').oncontextmenu=e=>{e.preventDefault();if(e.target.closest('.win'))return;menu(e.clientX,e.clientY,[['New Text File',()=>{FS.Desktop.push({n:'Untitled '+(FS.Desktop.length+1)+'.txt',t:'txt',c:''});saveFS()}],['App Library',launchpad],['Mission Control',mc],null,['Blyns Settings…',()=>openApp('settings')]])};
function launchpad(){const l=$('#lp');if(l.classList.contains('on')){l.classList.remove('on');return}l.innerHTML='<input class="lps" placeholder="Search"><div class="lpg">'+Object.keys(APPS).filter(k=>k!='launchpad').map((k,i)=>`<div class="lpi" data-k="${k}" style="animation-delay:${i*28}ms"><u>${ico(k)}</u><span>${APPS[k].n}</span></div>`).join('')+'</div>';l.classList.add('on');
$('.lps',l).oninput=e=>$$('.lpi',l).forEach(x=>x.style.display=x.textContent.toLowerCase().includes(e.target.value.toLowerCase())?'':'none');
l.onclick=e=>{const i=e.target.closest('.lpi');if(i||e.target==l||e.target.classList.contains('lpg')){l.classList.remove('on');i&&openApp(i.dataset.k)}}}
function mc(){const m=$('#mc');if(m.classList.contains('on'))return mcx();const ws=Object.values(W).filter(w=>!w.classList.contains('min'));if(!ws.length)return toast('No open windows');m.style.zIndex=S.z+5;m.classList.add('on');const n=ws.length,c=Math.ceil(Math.sqrt(n)),r=Math.ceil(n/c),cw=innerWidth/c,ch=(innerHeight-120)/r;
ws.forEach((w,i)=>{const s=Math.min(.9*cw/w.offsetWidth,.9*ch/w.offsetHeight,.7),cx=(i%c+.5)*cw,cy=70+(Math.floor(i/c)+.5)*ch;w.style.zIndex=S.z+10+i;w.classList.add('mcw');w.style.transform=`translate(${cx-w.offsetLeft-w.offsetWidth/2}px,${cy-w.offsetTop-w.offsetHeight/2}px) scale(${s})`})}
function mcx(w){$('#mc').classList.remove('on');Object.values(W).forEach(x=>{if(x.classList.contains('mcw')){x.classList.remove('mcw');x.style.transform='';x.style.zIndex=++S.z}});w&&focus(w)}
$('#wins').addEventListener('click',e=>{const w=e.target.closest('.mcw');if(w)mcx(w)},true);$('#mc').onclick=()=>mcx();
const topWin=()=>Object.values(W).filter(w=>!w.classList.contains('min')).sort((a,b)=>b.style.zIndex-a.style.zIndex)[0];
function snap(){const w=topWin();if(!w)return;const k=((w.sn||0)+1)%4;if(!w.sn)w.rc={left:w.style.left,top:w.style.top,width:w.style.width,height:w.style.height};w.sn=k;w.mx=null;const P=[0,[0,innerWidth/2],[innerWidth/2,innerWidth/2],[0,innerWidth]][k];if(!k)Object.assign(w.style,w.rc);else Object.assign(w.style,{left:P[0]+'px',width:P[1]+'px',top:'28px',height:innerHeight-28+'px'});toast(['Window restored','Snapped left','Snapped right','Full screen'][k])}
addEventListener('keydown',e=>{if(S.ph!='desk'||S.off||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.metaKey||e.ctrlKey||e.altKey)return;const k=e.key.toLowerCase();if(k==='m'){mc();e.preventDefault()}if(k==='s'){toggleStage();e.preventDefault()}if(k==='w'){snap();e.preventDefault()}if(k==='q'){toggleLastWindow();e.preventDefault()}if(k==='r'){forceQuitLastWindow();e.preventDefault()}if(k==='l'){launchpad();e.preventDefault()}if(k==='escape'){mcx();$('#lp').classList.remove('on')}});
function lockInit(){dockBuild();rd();$('#lock').classList.remove('up');$('#lav').textContent=S.name[0].toUpperCase();$('#lnm').textContent=S.name;$('#pw').value='';setTimeout(()=>$('#pw').focus(),900)}
dockBuild();rd();


/* ================= BlynsOS 1.0 ================= */
const RELEASE='BlynsOS 1.0 Stabilized';
const installKey='mac_installed_272';
let installed=(()=>{try{return JSON.parse(localStorage.getItem(installKey)||'[]')}catch(e){return []}})();
let wifiOn=true,bluetoothOn=true,stageOn=false,brightness=100;
let musicOn=false,musicTimer=null,musicStep=0,musicStartedAt=0,musicElapsed=0,musicCtx=null;
const installedApps={
  pages:{n:'Pages',i:'📄',c:'#58a8ee,#2766bd',sz:[650,470],r:b=>{H(b,'<div class="main"><h2 style="font-size:25px;margin-bottom:12px">Pages</h2><p style="color:#777">A clean space for your next document.</p><div contenteditable="true" style="margin:22px auto;background:#fff;box-shadow:0 3px 18px #0001;width:min(420px,95%);min-height:260px;padding:30px;outline:0">Start writing here…</div></div>')}} ,
  keynote:{n:'Keynote',i:'📊',c:'#f6bd65,#de743d',sz:[650,460],r:b=>H(b,'<div class="main"><h2 style="font-size:25px">Keynote</h2><p style="color:#777;margin:8px 0 18px">Presentation preview</p><div style="height:230px;border-radius:15px;background:linear-gradient(125deg,#244e73,#6e98ac,#e5c5a2);display:grid;place-items:center;color:white;font-size:30px;font-weight:650">Golden Gate</div><p style="margin-top:12px;color:#777">A simple local presentation canvas.</p></div>')},
  freeform:{n:'Freeform',i:'🗂️',c:'#e7a9e6,#8d6bd4',sz:[650,460],r:b=>H(b,'<div class="main"><h2>Freeform</h2><p style="color:#777;margin:7px 0 15px">Your infinite canvas</p><div contenteditable="true" style="min-height:280px;border:1px dashed #b9c1cf;border-radius:14px;padding:22px;background:linear-gradient(#fff,#fafbfe);outline:0">Click here and add your ideas…</div></div>')},
  weatherplus:{n:'Weather Plus',i:'☀️',c:'#8ac7f2,#397bbd',sz:[420,400],r:b=>H(b,'<div class="main" style="text-align:center;padding:28px"><p style="color:#78808b">Local demo forecast</p><div style="font-size:68px;font-weight:250;margin:15px">29°</div><h3>Partly cloudy</h3><p style="color:#777;margin-top:8px">A lightweight sample weather app</p></div>')}
};
Object.entries(installedApps).forEach(([id,a])=>{if(!APPS[id])app(id,a.n,a.i,a.c,(b)=>a.r(b),a.sz)});
function persistInstalled(){try{localStorage.setItem(installKey,JSON.stringify(installed))}catch(e){}}
function installedSet(){installed.forEach(id=>{if(APPS[id]&&!PIN.includes(id))PIN.push(id)})}
installedSet();
// Desktop app shortcuts are rendered beside the original file icons, not instead of them.
const originalRd=rd;
rd=function(){originalRd();const host=$('#ds');installed.forEach(id=>{const a=APPS[id];if(!a)return;host.insertAdjacentHTML('beforeend',`<div class="tile app-shortcut" data-app="${id}" style="color:#fff;text-shadow:0 1px 3px #000"><u style="width:58px;height:58px;display:flex;align-items:center;justify-content:center">${ico(id)}</u><span>${a.n}</span></div>`)})};

// Refresh original dock with installed applications while retaining the existing dock interaction.
const originalDockBuild=dockBuild;
dockBuild=function(){installedSet();originalDockBuild()};

// Setup and status bar clock formatting.
tick=function(){const d=new Date();$('#clock').textContent=d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false});$('#date').textContent=d.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'});$('#mt').textContent=d.toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'})+'  '+d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false})};
tick();

// Replace the demo store actions with a small local app catalogue.
APPS.store.r=(b)=>{
 const catalogue=[['pages','Documents','Documents and writing','📄'],['keynote','Slides','Presentations','📊'],['freeform','Canvas','Ideas and collaboration','✳'],['weatherplus','Forecast Plus','Simple weather dashboard','☀']];
 H(b,'<div class="main"><div style="display:flex;align-items:end;justify-content:space-between;margin-bottom:8px"><div><h2>Discover</h2><p style="color:#888;font-size:12px;margin-top:4px">Small apps made for this desktop</p></div><span style="font-size:11px;color:#999">LOCAL STORE</span></div><div id="store-list"></div></div>');
 const list=$('#store-list',b);
 const draw=()=>{list.innerHTML=catalogue.map(([id,n,desc,ic])=>`<div class="store-card"><div class="store-icon" style="background:linear-gradient(145deg,${installedApps[id].c})">${ic}</div><div class="store-meta"><b>${n}</b><small>${desc}</small></div><button class="store-install" data-install="${id}">${installed.includes(id)?'Open':'Install'}</button></div>`).join('');$$('[data-install]',list).forEach(btn=>btn.onclick=()=>{const id=btn.dataset.install;if(installed.includes(id)){openApp(id);return}btn.disabled=true;btn.textContent='Installing';setTimeout(()=>{if(!installed.includes(id))installed.push(id);persistInstalled();installedSet();dockBuild();rd();draw();toast(installedApps[id].n+' installed')},650)})};draw();
};

// Music: one original, locally synthesized sample tune. Audio begins only after Play is pressed.
function musicNote(freq){if(!musicCtx)return;const t=musicCtx.currentTime,o=musicCtx.createOscillator(),g=musicCtx.createGain();o.type='sine';o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.001,.065*S.vol/8),t+.035);g.gain.exponentialRampToValueAtTime(.0001,t+.39);o.connect(g).connect(musicCtx.destination);o.start(t);o.stop(t+.42)}
const melody=[392,440,523.25,659.25,587.33,523.25,440,392,349.23,392,440,523.25,440,392,329.63,392,440,523.25,587.33,523.25,440,392,349.23,329.63,392,440,523.25,440,392,349.23,329.63,293.66];
function musicPause(){musicOn=false;if(musicTimer){clearInterval(musicTimer);musicTimer=null}const p=$('#music-play');if(p)p.textContent='▶';}
function musicPlay(){try{musicCtx=musicCtx||new(window.AudioContext||window.webkitAudioContext)();musicCtx.resume();if(musicOn){musicPause();return}musicOn=true;musicStartedAt=Date.now();const p=$('#music-play');if(p)p.textContent='Ⅱ';const step=()=>{if(!musicOn)return;if(musicStep>=melody.length){musicPause();musicStep=0;musicElapsed=0;musicProgress();return}musicNote(melody[musicStep++]);musicProgress()};step();musicTimer=setInterval(step,480)}catch(e){toast('Audio is not available in this browser')}}
function musicProgress(){const bar=$('#music-fill');if(bar)bar.style.width=(musicStep/melody.length*100)+'%';const time=$('#music-time');if(time)time.textContent=Math.floor(musicStep*.48)+'s / 15s'}
APPS.music.r=(b)=>{H(b,'<div class="music-player"><div class="album-art">♫</div><h3>Golden Hour (Sample)</h3><p>Golden Gate Studio · Original instrumental</p><div class="music-progress"><i id="music-fill"></i></div><div style="width:min(300px,80%);display:flex;justify-content:flex-end;margin-top:5px;color:#92959d;font-size:10px"><span id="music-time">0s / 15s</span></div><div class="music-controls"><button class="secondary" id="music-reset">↺</button><button id="music-play">▶</button><button class="secondary" id="music-stop">■</button></div><p style="margin-top:18px">A short synthesized melody generated in your browser.</p></div>');musicPause();musicStep=0;musicProgress();$('#music-play',b).onclick=()=>musicPlay();$('#music-reset',b).onclick=()=>{musicPause();musicStep=0;musicProgress()};$('#music-stop',b).onclick=()=>{musicPause();musicStep=0;musicProgress()}};

// Settings has a fixed light appearance and a clear nested update path.
APPS.settings.r=(b)=>{
 let page='General';
 H(b,'<div class="row"><div class="side settings-nav" id="settings-nav"></div><div class="main settings-panel" id="settings-page"></div></div>');
 const nav=$('#settings-nav',b),main=$('#settings-page',b);
 const pages=['General','Wi-Fi','Bluetooth','Sound','Control Center','Users & Groups','About'];
 const row=(title,desc,action,label='Details')=>`<div class="settings-row"><div><b>${title}</b><small>${desc}</small></div><button class="settings-link" data-go="${action}">${label}</button></div>`;
 const draw=()=>{
  nav.innerHTML=pages.map(x=>`<div data-page="${x}" class="${x===page?'a':''}">${x}</div>`).join('');
  let html='';
  if(page==='General')html=`<h2>General</h2><p>Manage core BlynsOS preferences.</p>${row('Software Update','BlynsOS 1.0','Software Update','View')}${row('Storage','Local demo storage overview','Storage','View')}<div class="settings-row"><div><b>Appearance</b><small>BlynsOS light appearance is enabled</small></div><span style="color:#777;font-size:12px">Light</span></div>`;
  if(page==='Software Update')html=`<h2>Software Update</h2><p>BlynsOS 1.0 Stabilized is installed and up to date.</p><div class="app-hero" style="margin:18px 0"><div style="font-size:32px;font-weight:800;letter-spacing:-3px">B.</div><h3 style="margin-top:8px">BlynsOS 1.0</h3><p style="font-size:12px;margin-top:5px">Version 1.0 · Release Candidate</p><span style="display:inline-block;margin-top:12px;padding:5px 10px;border-radius:20px;background:#d9f4e4;color:#187a42;font-size:11px">Up to date</span></div>${row('Release information','Full list of new features, changes, removals and rebrands','Update Details','View Details')}<button class="settings-link" data-go="General" style="margin-top:12px">Back</button>`;
  if(page==='Update Details')html=`<h2>BlynsOS 1.0 Stabilized</h2><p>Complete release notes for this build.</p><div style="margin-top:18px;padding:16px;border-radius:13px;background:#fff;border:1px solid #e7e9ed;color:#30343b;line-height:1.65;font-size:13px"><h3 style="margin:4px 0 8px">New features and improvements</h3><ul style="padding-left:20px;margin-bottom:18px"><li>New BlynsOS identity and B-only menu-bar logo.</li><li>Full BlynsOS wordmark on the startup screen.</li><li>Files can be dragged to independent positions around the desktop; positions are remembered.</li><li>Files adds New Folder, New File, Edit, Rename, Open Selected, Select All, Move To and Delete actions.</li><li>Files supports nested folders and opening selected files or applications.</li><li>F opens Files from the desktop.</li><li>Ctrl + S opens Spotlight Search.</li><li>Stage Manager now lists open window titles without miniature app previews.</li><li>Power, restart and startup black screens hide the mouse pointer; only 0 powers on from the black screen.</li><li>Browser iframe handling is friendlier to Google Search and Google Sites pages where the destination site permits embedding.</li><li>Software Update now documents this release, including additions, removals and rebrands.</li><li>Existing window restore, Dock preferences, dark appearance, accent colours, wallpaper choices, Control Center and Spotlight features are retained.</li></ul><h3 style="margin:4px 0 8px">Files and desktop changes</h3><ul style="padding-left:20px;margin-bottom:18px"><li>Replaced the single right-side desktop stack with movable desktop icons.</li><li>Added folder navigation and multi-selection inside Files.</li><li>Added file editing and saving, folder creation, renaming and moving between Desktop, Documents and Downloads.</li><li>Only installed Store apps receive desktop shortcuts; uninstalled catalogue apps stay in Blyns Store.</li></ul><h3 style="margin:4px 0 8px">Rebranded apps</h3><ul style="padding-left:20px;margin-bottom:18px"><li>Finder → Files</li><li>Safari → Navigator</li><li>Siri → Blyns Assistant</li><li>Messages → Chatline</li><li>Mail → Inbox</li><li>Maps → Atlas</li><li>Photos → Gallery</li><li>Calendar → Daybook</li><li>Notes → Jotter</li><li>Reminders → Tasks</li><li>Music → Soundwave</li><li>Weather → Forecast</li><li>Clock → World Clock</li><li>Calculator → Math Desk</li><li>Terminal → Console</li><li>App Store → Blyns Store</li><li>System Settings → Blyns Settings</li><li>Launchpad → App Library</li><li>TextEdit → Writer</li><li>Preview → Image Viewer</li><li>Freeform → Canvas</li><li>Books → Reader</li><li>Contacts → People</li><li>Podcasts → Broadcasts</li><li>Home → Smart Home</li><li>Activity Monitor → System Monitor</li><li>Keynote → Slides</li><li>Pages → Documents</li><li>Weather Plus → Forecast Plus</li></ul><h3 style="margin:4px 0 8px">Removed or replaced</h3><ul style="padding-left:20px"><li>Removed the Apple logo from the menu bar and replaced it with the Blyns B logo.</li><li>Removed the app-thumbnail preview cards from Stage Manager.</li><li>Removed the single-column desktop icon stack.</li><li>Removed desktop shortcuts for apps that have not been installed.</li><li>Removed non-zero keyboard shortcuts from boot and shutdown screens; 0 is the sole power-on key there.</li><li>Removed the visible mouse pointer during boot, restart and shutdown black screens.</li><li>Replaced Apple/macOS product naming and app labels with BlynsOS branding and Blyns app names.</li></ul><p style="font-size:11px;margin-top:16px;color:#777">Build: BlynsOS 1.0 Stabilized · System, account and app improvements for your personal workspace.</p></div><button class="settings-link" data-go="Software Update" style="margin-top:14px">Back to Software Update</button>`;
  if(page==='Wi-Fi')html=`<h2>Wi-Fi</h2><p>Wireless connection controls</p><div class="settings-row"><div><b>Wi-Fi</b><small>${wifiOn?'On · Golden Gate Home (demo)':'Off'}</small></div><button class="settings-link" data-action="wifi">${wifiOn?'Turn Off':'Turn On'}</button></div>`;
  if(page==='Bluetooth')html=`<h2>Bluetooth</h2><p>Manage nearby Bluetooth devices</p><div class="settings-row"><div><b>Bluetooth</b><small>${bluetoothOn?'On':'Off'}</small></div><button class="settings-link" data-action="bluetooth">${bluetoothOn?'Turn Off':'Turn On'}</button></div>`;
  if(page==='Sound')html=`<h2>Sound</h2><p>Output volume</p><div class="cc-slider" style="margin-top:18px"><label><span>Volume</span><span id="settings-volume-label">${Math.round(S.vol/8*100)}%</span></label><input id="settings-volume" type="range" min="0" max="8" value="${S.vol}"></div>`;
  if(page==='Control Center')html=`<h2>Control Center</h2><p>Quick access to connectivity and system controls.</p><div class="settings-row"><div><b>Stage Manager</b><small>Show the recent windows strip</small></div><button class="settings-link" data-action="stage">${stageOn?'On':'Off'}</button></div><div class="settings-row"><div><b>Appearance</b><small>Light Mode only</small></div><b style="font-size:12px;color:#777">Light</b></div>`;
  if(page==='Users & Groups')html=`<h2>Users & Groups</h2><p style="margin:14px 0">${S.name} · Administrator</p><button class="settings-link" id="settings-logout">Lock Screen / Log Out</button>`;
  if(page==='About')html=`<h2>About BlynsOS</h2><div style="margin-top:16px;padding:17px;background:#fff;border:1px solid #e7e9ed;border-radius:13px"><h3>${RELEASE}</h3><p style="margin-top:7px">Chip: Blyns Core<br>Memory: 32 GB<br>Display: BlynsOS Desktop</p></div>`;
  if(page==='Storage')html=`<h2>Storage</h2><p>Account preferences, files and installed app states are saved in this browser profile.</p>`;
  main.innerHTML=html;
  $$('[data-page]',nav).forEach(x=>x.onclick=()=>{page=x.dataset.page;draw()});
  $$('[data-go]',main).forEach(x=>x.onclick=()=>{page=x.dataset.go;draw()});
  $$('[data-action]',main).forEach(x=>x.onclick=()=>{const a=x.dataset.action;if(a==='wifi')wifiOn=!wifiOn;if(a==='bluetooth')bluetoothOn=!bluetoothOn;if(a==='stage')toggleStage();draw();syncCC()});
  const vol=$('#settings-volume',main);if(vol)vol.oninput=()=>{S.vol=+vol.value;const label=$('#settings-volume-label',main);if(label)label.textContent=Math.round(S.vol/8*100)+'%';hud();syncCC()};
  const lo=$('#settings-logout',main);if(lo)lo.onclick=logout;
 };
 draw();
};

// Compact Control Center. Network switches are UI-state demos; no real network adapter is changed.
if(!$('#ccpanel'))document.body.insertAdjacentHTML('beforeend',`<div id="ccpanel"><div style="display:flex;justify-content:space-between;align-items:center;margin:1px 2px 12px"><b style="font-size:14px">Control Center</b><span style="font-size:10px;color:#858993">BlynsOS 1.0</span></div><div class="ccgrid"><button class="cc-tile" id="cc-wifi"><span class="cc-symbol">⌁</span><span><strong>Wi-Fi</strong><small id="cc-wifi-state">On</small></span></button><button class="cc-tile" id="cc-bt"><span class="cc-symbol">ᛒ</span><span><strong>Bluetooth</strong><small id="cc-bt-state">On</small></span></button><button class="cc-tile" id="cc-stage"><span class="cc-symbol">▣</span><span><strong>Stage Manager</strong><small id="cc-stage-state">Off</small></span></button><button class="cc-tile" id="cc-settings"><span class="cc-symbol">⚙</span><span><strong>Blyns Settings</strong><small>Open settings</small></span></button></div><div class="cc-slider"><label><span>Display brightness</span><span id="cc-bright-label">100%</span></label><input id="cc-bright" type="range" min="55" max="120" value="100"></div><div class="cc-slider"><label><span>Sound</span><span id="cc-vol-label">${Math.round(S.vol/8*100)}%</span></label><input id="cc-vol" type="range" min="0" max="8" value="${S.vol}"></div><div class="cc-foot"><span>Light appearance · ${RELEASE}</span><button id="cc-close">Done</button></div></div>`);
function syncCC(){const p=$('#ccpanel');if(!p)return;[['#cc-wifi',wifiOn,'#cc-wifi-state','On','Off'],['#cc-bt',bluetoothOn,'#cc-bt-state','On','Off'],['#cc-stage',stageOn,'#cc-stage-state','On','Off']].forEach(([sel,on,state,a,z])=>{$(sel).classList.toggle('on',on);$(state).textContent=on?a:z});$('#cc-bright').value=brightness;$('#cc-bright-label').textContent=brightness+'%';$('#cc-vol').value=S.vol;$('#cc-vol-label').textContent=Math.round(S.vol/8*100)+'%'}
function setBrightness(v){brightness=+v;document.documentElement.style.setProperty('--screen-dim',String(Math.max(0,(100-brightness)/100*.62)));$('#cc-bright-label').textContent=brightness+'%'}
function toggleStage(){stageOn=!stageOn;$('#desk').classList.toggle('stage-on',stageOn);if(stageOn){const w=topWin();w?stageFocus(w.dataset.id):renderStageRail()}else{$('#stage-rail')?.remove();$$('.win').forEach(w=>w.classList.remove('stage-hidden'));}syncCC()}
function stageFocus(id){Object.values(W).forEach(w=>w.classList.toggle('stage-hidden',w.dataset.id!==id));const w=W[id];if(w){w.classList.remove('min');focus(w)}renderStageRail(id)}
function renderStageRail(active){let rail=$('#stage-rail');if(!stageOn)return;if(!rail){$('#desk').insertAdjacentHTML('beforeend','<div id="stage-rail"></div>');rail=$('#stage-rail')}const items=Object.values(W).filter(w=>!w.classList.contains('gone'));rail.innerHTML=items.map(w=>{const id=w.dataset.id,a=APPS[id];return `<button class="stage-card ${active===id||(!active&&!w.classList.contains('stage-hidden'))?'active':''}" data-stage-id="${id}"><u>${ico(id)}</u>${a.n}</button>`}).join('')||'<span style="font-size:11px;color:#69717d;text-align:center">Open an app to add it here</span>';$$('[data-stage-id]',rail).forEach(btn=>btn.onclick=()=>stageFocus(btn.dataset.stageId))}
$('#ccbtn').onclick=e=>{e.stopPropagation();$('#ccpanel').classList.toggle('on');$('#ccbtn').classList.toggle('on',$('#ccpanel').classList.contains('on'));syncCC()};
$('#cc-close').onclick=()=>{$('#ccpanel').classList.remove('on');$('#ccbtn').classList.remove('on')};
$('#cc-wifi').onclick=()=>{wifiOn=!wifiOn;syncCC()};$('#cc-bt').onclick=()=>{bluetoothOn=!bluetoothOn;syncCC()};$('#cc-stage').onclick=toggleStage;$('#cc-settings').onclick=()=>{openApp('settings');$('#cc-close').click()};
$('#cc-bright').oninput=e=>setBrightness(e.target.value);$('#cc-vol').oninput=e=>{S.vol=+e.target.value;$('#cc-vol-label').textContent=Math.round(S.vol/8*100)+'%';hud()};
addEventListener('pointerdown',e=>{if(!e.target.closest('#ccpanel,#ccbtn')){$('#ccpanel').classList.remove('on');$('#ccbtn').classList.remove('on')}},true);
setBrightness(100);syncCC();

// Menus have working everyday actions and preserve the original Apple menu.
const menuItems={
 File:[['New Text File',()=>{FS.Desktop.push({n:'Untitled '+(FS.Desktop.length+1)+'.txt',t:'txt',c:''});saveFS()}],['Open Files',()=>openApp('finder')],['Open Blyns Store',()=>openApp('store')],null,['Close Front Window',()=>{const w=topWin();w&&$('.tl i',w).click()}]],
 Window:[['Mission Control',mc],['Minimize Front Window',()=>{const w=topWin();w&&minim(w)}],['Zoom Front Window',()=>{const w=topWin();if(w)$('.tl i:nth-child(3)',w).click()}],null,['Close All Windows (Minimize)',()=>Object.values(W).forEach(w=>{if(!w.classList.contains('min'))minim(w)})]],
 Work:[['Stage Manager',toggleStage],['Show All Windows',()=>{Object.values(W).forEach(w=>w.classList.remove('stage-hidden'));renderStageRail()}],['App Library',launchpad],['Mission Control',mc]],
 Settings:[['Blyns Settings…',()=>openApp('settings')],['Software Update…',()=>{openApp('settings');setTimeout(()=>{const el=$('#settings-nav [data-page="General"]');if(el)el.click();setTimeout(()=>{const a=$('#settings-page [data-go="Software Update"]');a&&a.click()},40)},60)}],['Control Center',()=>$('#ccbtn').click()],null,['Lock Screen',logout]]
};
$$('#mb .mbmenu').forEach(el=>el.onclick=e=>{e.stopPropagation();$$('#mb .mbmenu').forEach(x=>x.classList.toggle('active',x===el));const r=el.getBoundingClientRect();menu(r.left,r.bottom,menuItems[el.dataset.menu]||[])});
const oldMenuFn=menu;
// Clicking anywhere outside menus closes the active menu (original Apple menu still works).
addEventListener('pointerdown',e=>{if(!e.target.closest('#am,#ap,#mb .mbmenu')){$('#am').classList.remove('on');$$('#mb .mbmenu').forEach(x=>x.classList.remove('active'))}},true);

// Stage Manager shortcut: W. Existing E/S/L and volume shortcuts remain intact.
// W is reserved for window snapping in 27.3.

// When an app opens while Stage Manager is active, focus it as the current stage.
const openAppOriginal=openApp;
openApp=function(id,arg){openAppOriginal(id,arg);if(stageOn)setTimeout(()=>stageFocus(id),40)};
// Keep the Stage Manager strip fresh as windows close or open.
const stageObserver=new MutationObserver(()=>{if(stageOn)renderStageRail()});stageObserver.observe($('#wins'),{childList:true});

// Make sure the first unlocked desktop has updated dock and installed shortcuts.
const lockInit272=lockInit;
lockInit=function(){lockInit272();if(stageOn)renderStageRail();syncCC()};
dockBuild();rd();



/* ================= BlynsOS 1.0 final refinements ================= */

// Elegant Lock Screen clock and glass user panel.
if(!$('.lock-eyebrow'))$('#clock').insertAdjacentHTML('beforebegin','<div class="lock-eyebrow">GOLDEN GATE  ·  PERSONAL DESKTOP</div>');

// Save window geometry so Lock Screen and Restart can rebuild the same desktop.
const WINDOW_STATE_KEY='mac_2721_window_state';
let windowStateHold=false;
let lastUsedWindowId=null;
function saveWindowState(){
  if(windowStateHold)return;
  const windows=Object.values(W).map(w=>({
    id:w.dataset.id,
    left:w.style.left,
    top:w.style.top,
    width:w.style.width,
    height:w.style.height,
    z:+w.style.zIndex||0,
    min:w.classList.contains('min'),
    mx:w.mx||null,
    sn:w.sn||0,
    rc:w.rc||null
  }));
  const data={windows,active:lastUsedWindowId};
  try{localStorage.setItem(WINDOW_STATE_KEY,JSON.stringify(data))}catch(e){}
}
let windowSaveTimer=null;
function scheduleWindowSave(){
  clearTimeout(windowSaveTimer);
  windowSaveTimer=setTimeout(saveWindowState,220);
}
const focus2721=focus;
focus=function(w){
  focus2721(w);
  if(w&&w.dataset)lastUsedWindowId=w.dataset.id;
  scheduleWindowSave();
};
const minim2721=minim;
minim=function(w){minim2721(w);scheduleWindowSave()};
const snap2721=snap;
snap=function(){snap2721();scheduleWindowSave()};

function restoreSavedWindows(){
  let data;
  try{data=JSON.parse(localStorage.getItem(WINDOW_STATE_KEY)||'null')}catch(e){data=null}
  const list=data&&Array.isArray(data.windows)?data.windows:[];
  if(!list.length)return;
  windowStateHold=true;
  stageOn=false;
  $('#desk').classList.remove('stage-on');
  $('#stage-rail')?.remove();
  list.slice().sort((a,b)=>(a.z||0)-(b.z||0)).forEach(item=>{
    if(APPS[item.id]&&!W[item.id])openApp(item.id);
  });
  setTimeout(()=>{
    list.forEach(item=>{
      const w=W[item.id];if(!w)return;
      Object.assign(w.style,{
        left:item.left||'40px',top:item.top||'55px',
        width:item.width||'620px',height:item.height||'440px',
        transform:'',opacity:'1',zIndex:String(item.z||++S.z)
      });
      w.classList.remove('gone','stage-hidden','mcw','min');
      if(item.mx)w.mx=item.mx;else w.mx=null;
      if(item.sn)w.sn=item.sn;else w.sn=0;
      if(item.rc)w.rc=item.rc;else w.rc=null;
      if(item.min){
        w.classList.add('min');
        const dock=dI(item.id).getBoundingClientRect();
        const rect=w.getBoundingClientRect();
        w.style.transform=`translate(${dock.left+dock.width/2-rect.left-rect.width/2}px,${dock.top-rect.top-rect.height/2}px) scale(.08)`;
      }
    });
    lastUsedWindowId=data.active&&W[data.active]?data.active:(list[list.length-1]?.id||null);
    S.z=Math.max(S.z,...Object.values(W).map(w=>+w.style.zIndex||0));
    if(lastUsedWindowId&&W[lastUsedWindowId])$('#an').textContent=APPS[lastUsedWindowId].n;
    windowStateHold=false;
    saveWindowState();
  },1750);
}

// Capture the geometry before locking; the original lock flow can then close windows safely.
const logout2721=logout;
logout=function(){
  saveWindowState();
  windowStateHold=true;
  stageOn=false;
  $('#desk').classList.remove('stage-on');
  $('#stage-rail')?.remove();
  const result=logout2721();
  setTimeout(()=>{windowStateHold=false},550);
  return result;
};

// Rebuild windows only after the password has unlocked the desktop.
$('#pw').addEventListener('keydown',e=>{if(e.key==='Enter')setTimeout(()=>{if(S.ph==='desk')restoreSavedWindows();},980);});

// Preserve window state across power-off/restart, but keep Shutdown as a plain black screen.
$('#off').innerHTML='';
const shutdown2721=shutdown;
shutdown=function(){
  saveWindowState();
  windowStateHold=true;
  S.off=true;
  stageOn=false;
  $('#desk').classList.remove('stage-on');
  $('#stage-rail')?.remove();
  musicPause();
  $('#ccpanel')?.classList.remove('on');
  $('#off').innerHTML='';
  $$('.ph').forEach(p=>p.classList.remove('on'));
  $('#desk').classList.remove('on');
  $('#off').classList.add('on');
  clearWins();
  dockBuild();
  setTimeout(()=>{windowStateHold=false},550);
};
restart=function(){
  saveWindowState();
  shutdown();
  setTimeout(()=>{
    S.off=false;
    $('#off').classList.remove('on');
    boot();
  },1650);
};
const factory2721=factory;
factory=function(){
  windowStateHold=true;
  try{localStorage.removeItem(WINDOW_STATE_KEY)}catch(e){}
  factory2721();
  setTimeout(()=>{try{localStorage.removeItem(WINDOW_STATE_KEY)}catch(e){}windowStateHold=false},2200);
};
$('#off').onclick=()=>{
  if(S.off){S.off=false;$('#off').classList.remove('on');started=true;boot()}
};

// Better Stage Manager: each recent item is a miniature preview of the actual window.
renderStageRail=function(active){
  if(!stageOn)return;
  if(active===undefined)active=lastUsedWindowId||(topWin()&&topWin().dataset.id);
  let rail=$('#stage-rail');
  if(!rail){$('#desk').insertAdjacentHTML('beforeend','<div id="stage-rail"></div>');rail=$('#stage-rail')}
  const items=Object.values(W).filter(w=>!w.classList.contains('gone'))
    .sort((a,b)=>(+b.style.zIndex||0)-(+a.style.zIndex||0));
  rail.innerHTML=items.map(w=>{
    const id=w.dataset.id,a=APPS[id];
    const clone=w.cloneNode(true);
    clone.classList.remove('min','gone','stage-hidden','mcw','drag');
    clone.classList.add('stage-window-preview');
    clone.removeAttribute('id');
    clone.querySelectorAll('.h').forEach(x=>x.remove());
    clone.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));
    clone.querySelectorAll('input,textarea,button,select').forEach(x=>{x.disabled=true;x.removeAttribute('autofocus')});
    clone.querySelectorAll('*').forEach(x=>{x.style.pointerEvents='none'});
    const ww=Math.max(260,w.offsetWidth||620),hh=Math.max(160,w.offsetHeight||440);
    const scale=Math.min(158/ww,78/hh);
    Object.assign(clone.style,{
      position:'absolute',left:Math.max(0,(166-ww*scale)/2)+'px',top:Math.max(0,(86-hh*scale)/2)+'px',
      width:ww+'px',height:hh+'px',minWidth:'0',minHeight:'0',
      transform:`scale(${scale})`,transformOrigin:'top left',opacity:'1',zIndex:'1',
      boxShadow:'0 2px 8px #0003',transition:'none'
    });
    return `<div class="stage-card ${active===id?'active':''}" role="button" tabindex="0" data-stage-id="${id}"><div class="stage-preview">${clone.outerHTML}</div><span class="stage-card-label">${a.n}</span></div>`;
  }).join('')||'<span class="stage-empty">Open an app to add a window</span>';
  $$('[data-stage-id]',rail).forEach(btn=>btn.onclick=()=>stageFocus(btn.dataset.stageId));
};

// Make the last focused window the target for Q and R.
function getLastWindow(){
  if(lastUsedWindowId&&W[lastUsedWindowId]&&W[lastUsedWindowId].isConnected)return W[lastUsedWindowId];
  return topWin();
}
function toggleLastWindow(){
  const w=getLastWindow();
  if(!w)return toast('No open window');
  if(w.classList.contains('min')){
    w.classList.remove('min');w.style.transform='';
    Object.assign(w.style,{left:'0px',top:'28px',width:innerWidth+'px',height:(innerHeight-28)+'px'});
    w.mx=w.mx||null;focus(w);toast('Last window maximized');
  }else{
    minim(w);toast('Last window minimized');
  }
  scheduleWindowSave();
}
function forceQuitLastWindow(){
  const w=getLastWindow();
  if(!w)return toast('No open window');
  const id=w.dataset.id,name=APPS[id]?.n||id;
  if(id==='music')musicPause();
  w.remove();delete W[id];
  const d=$(`.di[data-id="${id}"]`);
  if(d){d.classList.remove('on');if(!PIN.includes(id))d.remove()}
  lastUsedWindowId=null;
  const next=topWin();
  if(next)focus(next);else $('#an').textContent='Files';
  if(stageOn)renderStageRail(next?.dataset.id);
  scheduleWindowSave();toast(name+' force quit');
}

// Files > Applications: select one, Select All, then open all selected apps.
APPS.finder.r=function(b,w){
  let loc='Desktop',sel=null;
  const selectedApps=new Set();
  H(b,'<div class="bar"><button id="nf">＋ New File</button><button id="dl">Delete</button><button id="fa" class="finder-app-action">Select All</button><button id="oa" class="finder-app-action" disabled>Open Selected (0)</button><span id="pt" style="margin-left:auto;font-size:12px;color:#666"></span></div><div class="row"><div class="side"></div><div class="main"></div></div>');
  const L=['Applications','Desktop','Documents','Downloads'];
  const refreshActions=()=>{
    const apps=loc==='Applications';
    $('#fa',b).style.display=apps?'inline-flex':'none';
    $('#oa',b).style.display=apps?'inline-flex':'none';
    $('#nf',b).disabled=apps;$('#dl',b).disabled=apps||sel==null;
    $('#oa',b).disabled=selectedApps.size===0;
    $('#oa',b).textContent=`Open Selected (${selectedApps.size})`;
    $('#fa',b).textContent=selectedApps.size===Object.keys(APPS).filter(k=>k!=='launchpad').length?'Deselect All':'Select All';
  };
  const openSelected=()=>{
    const ids=[...selectedApps].filter(id=>APPS[id]);
    if(!ids.length)return;
    ids.forEach((id,i)=>setTimeout(()=>openApp(id),i*125));
    toast(`Opening ${ids.length} applications`);
  };
  const rf=()=>{
    $('.side',b).innerHTML=L.map(x=>`<div class="${x===loc?'a':''}">${x==='Applications'?'Applications':'▰ '+x}</div>`).join('');
    $$('.side div',b).forEach((d,i)=>d.onclick=()=>{loc=L[i];sel=null;selectedApps.clear();rf()});
    const m=$('.main',b);$('#pt',b).textContent=loc;
    m.innerHTML=loc==='Applications'
      ?Object.keys(APPS).filter(k=>k!=='launchpad').map(k=>`<div class="tile finder-app ${selectedApps.has(k)?'selected':''}" data-k="${k}"><u>${ico(k)}</u><span>${APPS[k].n}</span></div>`).join('')
      :(FS[loc].map((f,i)=>`<div class="tile" data-i="${i}">${fi(f)}<span>${esc(f.n)}</span></div>`).join('')||'<p style="color:#999">Folder is empty</p>');
    $$('.tile',m).forEach(t=>{
      t.onclick=()=>{
        if(loc==='Applications'){
          const id=t.dataset.k;selectedApps.has(id)?selectedApps.delete(id):selectedApps.add(id);
          t.classList.toggle('selected',selectedApps.has(id));
        }else{sel=+t.dataset.i;$$('.tile',m).forEach(x=>x.classList.remove('selected'));t.classList.add('selected')}
        refreshActions();
      };
      t.ondblclick=()=>{
        if(loc==='Applications')openApp(t.dataset.k);
        else openFile(FS[loc][+t.dataset.i]);
      };
    });
    refreshActions();
  };
  $('#fa',b).onclick=()=>{
    const ids=Object.keys(APPS).filter(k=>k!=='launchpad');
    if(selectedApps.size===ids.length)selectedApps.clear();else ids.forEach(id=>selectedApps.add(id));
    rf();
  };
  $('#oa',b).onclick=openSelected;
  $('#nf',b).onclick=()=>{
    if(loc==='Applications')return;
    let n=1;while(FS[loc].some(f=>f.n==='Untitled '+n+'.txt'))n++;
    FS[loc].push({n:'Untitled '+n+'.txt',t:'txt',c:''});saveFS();rf();
  };
  $('#dl',b).onclick=()=>{
    if(sel!=null&&loc!=='Applications'){FS[loc].splice(sel,1);sel=null;saveFS();rf()}
  };
  rf();
};

// Animate Dock icons like an app launch bounce, including apps opened from Files.
const openAppFinalOriginal=openApp;
openApp=function(id,arg){
  openAppFinalOriginal(id,arg);
  const icon=dI(id);
  if(icon){icon.classList.remove('dancing');void icon.offsetWidth;icon.classList.add('dancing');setTimeout(()=>icon.classList.remove('dancing'),950)}
  if(stageOn)setTimeout(()=>stageFocus(id),50);
  scheduleWindowSave();
  setTimeout(scheduleWindowSave,1550);
};

// Save geometry after moving/resizing/minimizing/closing a window.
const windowSaveObserver=new MutationObserver(()=>{
  if(!windowStateHold&&S.ph==='desk')scheduleWindowSave();
});
windowSaveObserver.observe($('#wins'),{childList:true});
addEventListener('pointerup',()=>{if(S.ph==='desk')scheduleWindowSave()},true);
addEventListener('beforeunload',saveWindowState);

// Final appearance: a more refined glass clock, rounded typography and a proper preview rail.



/* ================= BlynsOS 1.0 functionality ================= */
const PREF_KEY_273='macos_273_preferences';
const DOCK_KEY_273='macos_273_dock_apps';
const defaults273={dark:true,accent:'#70a7ff',wallpaper:'golden',glass:72,dockSize:1,dockAutoHide:true,stageAutoHide:false,reduceMotion:false,notifications:true,clickOutside:false,wifiPreference:true,bluetoothPreference:true};
let prefs273=Object.assign({},defaults273,ld(PREF_KEY_273,{}));
try{const pins=JSON.parse(localStorage.getItem(DOCK_KEY_273)||'null');if(Array.isArray(pins)){PIN.splice(0,PIN.length,...pins.filter(id=>APPS[id]));}}catch(e){}
const savePrefs273=()=>sv(PREF_KEY_273,prefs273);
function applyPrefs273(){
 document.body.classList.toggle('dark-mode',!!prefs273.dark);
 document.documentElement.style.setProperty('--accent',prefs273.accent||'#70a7ff');
 document.documentElement.style.setProperty('--glass-level',String((prefs273.glass??72)/100));
 document.documentElement.style.setProperty('--dock-size',String(prefs273.dockSize||1));
 document.body.dataset.wallpaper=prefs273.wallpaper||'golden';
 if(prefs273.reduceMotion)document.documentElement.classList.add('reduce-motion');else document.documentElement.classList.remove('reduce-motion');
 updateDesktopState273();
}
applyPrefs273();

// Additional built-in lightweight apps.
app('freeform','Freeform','◩','#e8f1ff,#6c8fe8',(b)=>{
 H(b,'<div class="bar"><button id="ff-add">＋ Add Note</button><button id="ff-clear">Clear Board</button><span style="margin-left:auto;font-size:11px;color:#888">Canvas</span></div><div class="freeform-board" id="ff-board"><div class="free-note">Plan your next idea ✨</div><div class="free-note" style="background:#c9f3df;transform:rotate(1.5deg)">Golden Gate 27.3</div></div>');
 const board=$('#ff-board',b);$('#ff-add',b).onclick=()=>{const t=prompt('Write a note for your board:');if(t)board.insertAdjacentHTML('beforeend',`<div class="free-note">${String(t).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</div>`)};$('#ff-clear',b).onclick=()=>board.innerHTML='';
},[680,480]);
app('books','Books','▤','#d9b88f,#78543b',(b)=>{
 H(b,'<div class="main"><div class="app-hero"><div style="font-size:12px;opacity:.7">YOUR LIBRARY</div><h2 style="margin-top:8px">A little time to read.</h2><p style="font-size:12px;margin-top:6px">Your saved reading collection</p></div><h3 style="margin:18px 0 8px">Continue Reading</h3>'+[['The Art of Design','A short guide to thoughtful interfaces.'],['Beyond the Horizon','Notes on creativity and the future.'],['Quiet Systems','A calmer approach to technology.']].map(([t,d],i)=>`<div class="ml" style="display:flex;gap:12px;align-items:center"><div style="width:44px;height:58px;border-radius:4px;background:linear-gradient(145deg,hsl(${i*55+205} 38% 67%),hsl(${i*55+205} 34% 34%));box-shadow:2px 3px 7px #0002"></div><div><b>${t}</b><p style="font-size:11px;color:#888;margin-top:4px">${d}</p></div></div>`).join('')+'</div>');
},[540,460]);
app('contacts','Contacts','◉','#80b8e8,#315d9a',(b)=>{
 const people=[['Alex Morgan','alex@example.test','AM'],['Sofia Lee','sofia@example.test','SL'],['Daniel Tan','daniel@example.test','DT'],['Maya Chen','maya@example.test','MC']];
 H(b,'<div class="row"><div class="side" id="ct-list"></div><div class="main" id="ct-detail"><h2>Contacts</h2><p>Select a contact.</p></div></div>');
 const list=$('#ct-list',b),detail=$('#ct-detail',b);list.innerHTML=people.map((p,i)=>`<div data-i="${i}">${p[0]}</div>`).join('');$$('div[data-i]',list).forEach(x=>x.onclick=()=>{const p=people[+x.dataset.i];detail.innerHTML=`<div style="text-align:center;padding:28px"><div style="width:76px;height:76px;border-radius:50%;margin:auto;background:linear-gradient(135deg,#9bbbe0,#566e9a);display:grid;place-items:center;color:#fff;font-size:23px">${p[2]}</div><h2 style="margin-top:12px">${p[0]}</h2><p style="margin:7px 0 14px;color:#888">${p[1]}</p><button class="settings-link" onclick="toast('Contact details copied')">Share Contact</button></div>`;$$('div',list).forEach(d=>d.classList.toggle('a',d===x))});
},[580,420]);
app('podcasts','Podcasts','◖','#a78be8,#5641a4',(b)=>{
 H(b,'<div class="main"><div class="app-hero"><div style="font-size:12px">PODCASTS</div><h2 style="margin-top:8px">Ideas worth a moment.</h2><p style="font-size:12px;margin-top:6px">A sample listening shelf</p></div><div class="ml" style="margin-top:15px"><b>Designing Tomorrow</b><p style="color:#888;font-size:11px;margin-top:4px">Episode 01 · 18 min · Sample episode</p><button class="settings-link" id="pod-play" style="margin-top:10px">▶ Play preview</button><span id="pod-state" style="margin-left:9px;font-size:11px;color:#888">Ready</span></div><div class="ml"><b>Small Things, Big Ideas</b><p style="font-size:11px;color:#888;margin-top:4px">A sample episode description</p></div></div>');
 $('#pod-play',b).onclick=()=>{const playing=$('#pod-play',b).dataset.play!=='1';$('#pod-play',b).dataset.play=playing?'1':'0';$('#pod-play',b).textContent=playing?'Ⅱ Pause preview':'▶ Play preview';$('#pod-state',b).textContent=playing?'Preview playing':'Paused';toast(playing?'Playing sample preview':'Preview paused')};
},[520,420]);
app('home','Home','⌂','#e6b96c,#b46f32',(b)=>{
 H(b,'<div class="main"><h2>My Home</h2><p style="margin:6px 0 18px;color:#888">Demo accessories · Local controls only</p>'+['Living Room Light','Desk Lamp','Bedroom Light','Ambient Strip'].map((n,i)=>`<div class="settings-row"><div><b>${n}</b><small>Smart light · Simulated</small></div><button class="settings-link home-toggle" data-on="1">On</button></div>`).join('')+'</div>');
 $$('.home-toggle',b).forEach(x=>x.onclick=()=>{const on=x.dataset.on!=='1';x.dataset.on=on?'1':'0';x.textContent=on?'On':'Off';x.style.background=on?'#dceaff':'#eceef2'});
},[520,430]);
app('monitor','Activity Monitor','◫','#e1e6ec,#7b8796',(b)=>{
 H(b,'<div class="main"><h2>System Monitor</h2><p style="margin:6px 0 16px;color:#888">Illustrative browser simulator metrics</p><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">'+[['CPU','18%'],['Memory','6.4 GB'],['Energy','Low']].map(([a,v])=>`<div class="app-hero"><small>${a}</small><h2 style="margin-top:8px">${v}</h2></div>`).join('')+'</div><h3 style="margin:18px 0 8px">Processes</h3>'+['Window Server','Files','Navigator','Soundwave','Blyns Settings'].map((n,i)=>`<div class="ml" style="display:flex;justify-content:space-between"><span>${n}</span><span style="color:#888">${(i*3+2)+'.'+(i*7)}%</span></div>`).join('')+'</div>');
},[580,460]);
app('keynote','Keynote','▧','#e7a45a,#c45f3b',(b)=>{
 let slides=1;H(b,'<div class="bar"><button id="kn-add">＋ New Slide</button><button id="kn-present">Play Slideshow</button><span id="kn-count" style="margin-left:auto;font-size:11px;color:#888">1 slide</span></div><div class="main" id="kn-stage" style="display:grid;place-items:center;background:#e9ebef"><div style="width:min(92%,560px);aspect-ratio:16/9;background:linear-gradient(135deg,#233a58,#7188a9);border-radius:12px;box-shadow:0 12px 35px #0002;display:grid;place-items:center;text-align:center;color:#fff;padding:25px"><div><h1 id="kn-title">Golden Gate</h1><p style="margin-top:10px">A new presentation</p></div></div></div>');
 $('#kn-add',b).onclick=()=>{slides++;$('#kn-count',b).textContent=slides+' slides';$('#kn-title',b).textContent='Slide '+slides};$('#kn-present',b).onclick=()=>toast('Slideshow preview · '+slides+' slides');
},[640,480]);
GL.freeform='<path d="M25 28h50v46H25z" fill="#fff" opacity=".9"/><path d="M32 40h35M32 49h27M32 58h31" stroke="#6391d8" stroke-width="4" stroke-linecap="round"/>';
GL.books='<path d="M21 25q16-8 29 2v50q-13-10-29-2zM50 27q13-10 29-2v50q-16-6-29 2z" fill="#fff" stroke="#684b37" stroke-width="3"/>';
GL.contacts='<circle cx="50" cy="36" r="17" fill="#fff"/><path d="M19 82q2-27 31-27t31 27" fill="#fff"/>';
GL.podcasts='<circle cx="50" cy="50" r="33" fill="none" stroke="#fff" stroke-width="8"/><circle cx="50" cy="50" r="15" fill="#fff"/><path d="M50 65v20" stroke="#fff" stroke-width="8"/>';
GL.home='<path d="M13 49L50 18 87 49M23 44v38h54V44" stroke="#fff" stroke-width="8" fill="none" stroke-linejoin="round"/><rect x="43" y="59" width="15" height="23" fill="#fff"/>';
GL.monitor='<rect x="17" y="20" width="66" height="60" rx="8" fill="#fff"/><path d="M28 64l12-17 10 8 19-24" stroke="#4c8cbd" stroke-width="5" fill="none"/>';
GL.keynote='<rect x="16" y="21" width="68" height="58" rx="7" fill="#fff"/><path d="M26 65l17-23 11 12 10-14 10 25z" fill="#dc8658"/>';

// Restore instant window rendering: all app content appears without the old fake splash panel.
// Add Spotlight Search to the menu bar and keyboard.
if(!$('#spotlight'))document.body.insertAdjacentHTML('beforeend',`<div id="spotlight"><div class="sp-search"><svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.7"/><path d="m16 16 5 5"/></svg><input id="spotlight-input" autocomplete="off" placeholder="Search apps, files and settings"></div><div id="spotlight-results"></div><div class="sp-foot">Ctrl + S · Enter to open · ↑ ↓ to move · Esc to close</div></div>`);
let spotlightIndex273=0,spotlightResults273=[];
function spotlightRender273(){
 const q=$('#spotlight-input').value.trim().toLowerCase();const results=[];
 Object.keys(APPS).filter(id=>id!=='launchpad').forEach(id=>{const a=APPS[id];if(!q||a.n.toLowerCase().includes(q)||id.includes(q))results.push({type:'app',id,title:a.n,sub:'Application',icon:ico(id),score:q?(a.n.toLowerCase().startsWith(q)?0:1):2})});
 if(q){Object.entries(FS).forEach(([folder,files])=>files.forEach((f,i)=>{if(f.n.toLowerCase().includes(q))results.push({type:'file',folder,index:i,title:f.n,sub:folder+' · File',icon:fi(f),score:0})}));}
 results.sort((a,b)=>a.score-b.score||a.title.localeCompare(b.title));spotlightResults273=results.slice(0,8);spotlightIndex273=0;
 $('#spotlight-results').innerHTML=spotlightResults273.length?spotlightResults273.map((r,i)=>`<button class="sp-result ${i===0?'active':''}" data-i="${i}"><u>${r.icon}</u><span><b>${r.title}</b><small>${r.sub}</small></span></button>`).join(''):'<div class="sp-empty">No results found</div>';
 $$('.sp-result').forEach(x=>x.onclick=()=>spotlightOpenResult273(+x.dataset.i));
}
function spotlightOpenResult273(i){const r=spotlightResults273[i];if(!r)return;$('#spotlight').classList.remove('on');if(r.type==='app')openApp(r.id);else openFile(FS[r.folder][r.index]);}
function spotlightToggle273(force){const p=$('#spotlight');const on=force===undefined?!p.classList.contains('on'):!!force;p.classList.toggle('on',on);if(on){$('#spotlight-input').value='';spotlightRender273();setTimeout(()=>$('#spotlight-input').focus(),30)}else $('#spotlight-input').blur();}
$('#spotlightBtn').onclick=()=>spotlightToggle273();
$('#spotlight-input').oninput=spotlightRender273;
$('#spotlight-input').onkeydown=e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();spotlightIndex273=(spotlightIndex273+(e.key==='ArrowDown'?1:-1)+spotlightResults273.length)%Math.max(1,spotlightResults273.length);$$('.sp-result').forEach((x,i)=>x.classList.toggle('active',i===spotlightIndex273));}if(e.key==='Enter'){e.preventDefault();spotlightOpenResult273(spotlightIndex273)}if(e.key==='Escape')spotlightToggle273(false)};
addEventListener('keydown',e=>{
 if((e.metaKey||e.ctrlKey)&&e.code==='Space'&&!e.shiftKey&&S.ph==='desk'){e.preventDefault();e.stopImmediatePropagation();spotlightToggle273();return;}
 if(e.key==='Escape'&&$('#spotlight')?.classList.contains('on'))spotlightToggle273(false);
},true);

// Stage Manager has three miniature windows. The lower chevron expands the rest.
let stageExpanded273=false;
renderStageRail=function(active){
 if(!stageOn)return;
 const wins=Object.values(W).filter(w=>!w.classList.contains('gone')).sort((a,b)=>(+b.style.zIndex||0)-(+a.style.zIndex||0));
 let rail=$('#stage-rail');if(!rail){$('#desk').insertAdjacentHTML('beforeend','<div id="stage-rail"></div>');rail=$('#stage-rail')}
 const shown=stageExpanded273?wins:wins.slice(0,3);
 rail.innerHTML=shown.map(w=>{
   const id=w.dataset.id,a=APPS[id],clone=w.cloneNode(true);clone.classList.remove('min','gone','stage-hidden','mcw','drag','is-fullscreen');clone.classList.add('stage-window-preview');clone.removeAttribute('id');clone.querySelectorAll('.h').forEach(x=>x.remove());clone.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));clone.querySelectorAll('input,textarea,button,select').forEach(x=>x.disabled=true);clone.querySelectorAll('*').forEach(x=>x.style.pointerEvents='none');
   const ww=Math.max(260,w.offsetWidth||620),hh=Math.max(160,w.offsetHeight||440),scale=Math.min(144/ww,65/hh);
   Object.assign(clone.style,{position:'absolute',left:Math.max(0,(148-ww*scale)/2)+'px',top:Math.max(0,(65-hh*scale)/2)+'px',width:ww+'px',height:hh+'px',minWidth:'0',minHeight:'0',transform:`scale(${scale})`,transformOrigin:'top left',opacity:'1',zIndex:'1',transition:'none'});
   return `<button class="stage-card ${active===id?'active':''}" data-stage-id="${id}"><span class="stage-preview">${clone.outerHTML}</span><span class="stage-card-label">${a.n}</span></button>`;
 }).join('');
 if(wins.length>3)rail.insertAdjacentHTML('beforeend',`<button class="stage-more" id="stage-more" title="${stageExpanded273?'Show fewer windows':'Show more windows'}">${stageExpanded273?'⌃':'⌄'} <small style="font-size:10px;vertical-align:2px">${stageExpanded273?'Less':'More'}</small></button>`);
 $$('[data-stage-id]',rail).forEach(x=>x.onclick=()=>stageFocus(x.dataset.stageId));
 $('#stage-more')?.addEventListener('click',()=>{stageExpanded273=!stageExpanded273;renderStageRail(active)});
}
function toggleStage(){stageOn=!stageOn;stageExpanded273=false;$('#desk').classList.toggle('stage-on',stageOn);if(stageOn){const w=getLastWindow()||topWin();if(w)stageFocus(w.dataset.id);else renderStageRail()}else{$('#stage-rail')?.remove();Object.values(W).forEach(w=>w.classList.remove('stage-hidden'))}syncCC();updateDesktopState273()}
const stageFocusBase273=stageFocus;
stageFocus=function(id){stageFocusBase273(id);renderStageRail(id);updateDesktopState273()};

// Dock preferences: saved pins and an instant per-app add/remove list in Settings.
function saveDock273(){sv(DOCK_KEY_273,PIN.slice());}
function dockSetPin273(id,on){if(!APPS[id]||id==='finder'||id==='launchpad'||id==='settings')return;if(on&&!PIN.includes(id))PIN.push(id);if(!on){const i=PIN.indexOf(id);if(i>=0)PIN.splice(i,1);const icon=$(`.di[data-id="${id}"]`,dk);if(icon&&!W[id])icon.remove()}saveDock273();dockBuild();updateDesktopState273();}
// Add right-click Dock shortcut to pin/unpin any app.
const dockBuildBase273=dockBuild;
dockBuild=function(){dockBuildBase273();$$('.di',dk).forEach(d=>{d.oncontextmenu=e=>{e.preventDefault();const id=d.dataset.id;if(['finder','launchpad','settings'].includes(id))return toast('Core Dock app');dockSetPin273(id,!PIN.includes(id));toast(PIN.includes(id)?'Added to Dock':'Removed from Dock')}})};
dockBuild();

// Desktop auto-hide and fullscreen taskbar visibility.
function syncFullBar(){const full=Object.values(W).some(w=>!w.classList.contains('min')&&!w.classList.contains('gone')&&(w.classList.contains('is-fullscreen')||w.sn===3));$('#desk').classList.toggle('menu-hidden',full);}
function updateDesktopState273(){
 const desk=$('#desk');const active=Object.values(W).some(w=>!w.classList.contains('min')&&!w.classList.contains('gone'));
 desk.classList.toggle('has-open-windows',active);desk.classList.toggle('auto-dock-hide',!!prefs273.dockAutoHide);desk.classList.toggle('auto-stage-hide',!!prefs273.stageAutoHide);
 syncFullBar();
 if(stageOn)renderStageRail(getLastWindow()?.dataset.id);
}
addEventListener('pointermove',e=>{
 const desk=$('#desk');if(S.ph!=='desk')return;
 desk.classList.toggle('dock-peek',e.clientY>innerHeight-115);
 desk.classList.toggle('stage-peek',e.clientX<260);
});
addEventListener('pointerleave',()=>{$('#desk').classList.remove('dock-peek','stage-peek')});
const deskObserver273=new MutationObserver(()=>updateDesktopState273());
deskObserver273.observe($('#wins'),{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
const focus273base=focus;
focus=function(w){focus273base(w);updateDesktopState273()};
const minimize273base=minim;
minim=function(w){$('#desk').classList.add('dock-peek');minimize273base(w);updateDesktopState273();setTimeout(()=>{if(!$('#desk').matches(':hover'))$('#desk').classList.remove('dock-peek');updateDesktopState273()},850)};

// Q toggles the last-used window between Dock-minimized and fullscreen.
toggleLastWindow=function(){
 const w=getLastWindow();if(!w)return toast('No open window');
 if(w.classList.contains('min')){
   $('#desk').classList.add('dock-peek');
   w.classList.remove('min');w.style.transform='';
   if(!w.mx)w.mx={left:w.style.left,top:w.style.top,width:w.style.width,height:w.style.height};
   Object.assign(w.style,{left:'0px',top:'0px',width:innerWidth+'px',height:innerHeight+'px'});
   w.classList.add('is-fullscreen');focus(w);toast('Last window maximized');
 }else{minim(w);toast('Last window minimized')}
 syncFullBar();updateDesktopState273();scheduleWindowSave();
};

// Window snap (W): fullscreen flag is kept in sync with the hidden menu bar.
snap=function(){const w=topWin();if(!w)return;const k=((w.sn||0)+1)%4;if(!w.sn)w.rc={left:w.style.left,top:w.style.top,width:w.style.width,height:w.style.height};w.sn=k;w.mx=null;w.classList.toggle('is-fullscreen',k===3);const P=[0,[0,innerWidth/2],[innerWidth/2,innerWidth/2],[0,innerWidth]][k];if(!k){Object.assign(w.style,w.rc);w.classList.remove('is-fullscreen')}else Object.assign(w.style,{left:P[0]+'px',width:P[1]+'px',top:k===3?'0px':'28px',height:k===3?innerHeight+'px':innerHeight-28+'px'});syncFullBar();updateDesktopState273();toast(['Window restored','Snapped left','Snapped right','Full screen'][k]);scheduleWindowSave()}
// Restore fullscreen state when saved windows are recreated.
const restore273base=restoreSavedWindows;
restoreSavedWindows=function(){restore273base();setTimeout(()=>{Object.values(W).forEach(w=>{if(w.sn===3||w.mx){w.classList.add('is-fullscreen')} });syncFullBar();updateDesktopState273()},1850)};

// Menu bar Window actions minimize instead of closing or deleting windows.
if(typeof menuItems!=='undefined')menuItems.Window=[
 ['Mission Control',mc],['Minimize Front Window',()=>{const w=topWin();if(w)minim(w)}],['Close All Windows (Minimize)',()=>Object.values(W).forEach(w=>{if(!w.classList.contains('min'))minim(w)})],['Show All Windows',()=>{Object.values(W).forEach(w=>{w.classList.remove('min','stage-hidden');w.style.transform=''});updateDesktopState273()}],['Zoom Front Window',()=>{const w=topWin();if(w)$('.tl i:nth-child(3)',w).click()}]
];

// Blyns Settings: richer customization, persisted in this browser. Setup stays light.
APPS.settings.r=(b)=>{
 let page='General';
 H(b,'<div class="row"><div class="side settings-nav" id="settings-nav"></div><div class="main settings-panel" id="settings-page"></div></div>');
 const nav=$('#settings-nav',b),main=$('#settings-page',b);
 const pages=['General','Appearance','Desktop & Dock','Dock Apps','Control Center','Wi-Fi','Bluetooth','Sound','Notifications','Keyboard','Privacy','Users & Groups','About'];
 const row=(a,d,to,btn='Customize')=>`<div class="settings-row"><div><b>${a}</b><small>${d}</small></div><button class="settings-link" data-go="${to}">${btn}</button></div>`;
 const toggle=(label,desc,key)=>`<div class="settings-row"><div><b>${label}</b><small>${desc}</small></div><input class="settings-switch" type="checkbox" data-pref="${key}" ${prefs273[key]?'checked':''}></div>`;
 const draw=()=>{
  nav.innerHTML=pages.map(x=>`<div data-page="${x}" class="${x===page?'a':''}">${x}</div>`).join('');
  let html='';
  if(page==='General')html=`<h2>General</h2><p>System information and software preferences.</p>${row('Software Update','BlynsOS 1.0','Software Update','View')}${row('Storage','Local browser storage overview','Storage','View')}${row('About BlynsOS','Version, chip and memory','About','View')}`;
  if(page==='Software Update')html=`<h2>Software Update</h2><p>BlynsOS 1.0 Stabilized is installed and up to date.</p><div class="app-hero" style="margin:18px 0"><div style="font-size:32px;font-weight:800;letter-spacing:-3px">B.</div><h3 style="margin-top:8px">BlynsOS 1.0</h3><p style="font-size:12px;margin-top:5px">Version 1.0 · Release Candidate</p><span style="display:inline-block;margin-top:12px;padding:5px 10px;border-radius:20px;background:#d9f4e4;color:#187a42;font-size:11px">Up to date</span></div>${row('Release information','Full list of new features, changes, removals and rebrands','Update Details','View Details')}<button class="settings-link" data-go="General" style="margin-top:12px">Back</button>`;
  if(page==='Update Details')html=`<h2>BlynsOS 1.0 Stabilized</h2><p>Complete release notes for this build.</p><div style="margin-top:18px;padding:16px;border-radius:13px;background:#fff;border:1px solid #e7e9ed;color:#30343b;line-height:1.65;font-size:13px"><h3 style="margin:4px 0 8px">New features and improvements</h3><ul style="padding-left:20px;margin-bottom:18px"><li>New BlynsOS identity and B-only menu-bar logo.</li><li>Full BlynsOS wordmark on the startup screen.</li><li>Files can be dragged to independent positions around the desktop; positions are remembered.</li><li>Files adds New Folder, New File, Edit, Rename, Open Selected, Select All, Move To and Delete actions.</li><li>Files supports nested folders and opening selected files or applications.</li><li>F opens Files from the desktop.</li><li>Ctrl + S opens Spotlight Search.</li><li>Stage Manager now lists open window titles without miniature app previews.</li><li>Power, restart and startup black screens hide the mouse pointer; only 0 powers on from the black screen.</li><li>Browser iframe handling is friendlier to Google Search and Google Sites pages where the destination site permits embedding.</li><li>Software Update now documents this release, including additions, removals and rebrands.</li><li>Existing window restore, Dock preferences, dark appearance, accent colours, wallpaper choices, Control Center and Spotlight features are retained.</li></ul><h3 style="margin:4px 0 8px">Files and desktop changes</h3><ul style="padding-left:20px;margin-bottom:18px"><li>Replaced the single right-side desktop stack with movable desktop icons.</li><li>Added folder navigation and multi-selection inside Files.</li><li>Added file editing and saving, folder creation, renaming and moving between Desktop, Documents and Downloads.</li><li>Only installed Store apps receive desktop shortcuts; uninstalled catalogue apps stay in Blyns Store.</li></ul><h3 style="margin:4px 0 8px">Rebranded apps</h3><ul style="padding-left:20px;margin-bottom:18px"><li>Finder → Files</li><li>Safari → Navigator</li><li>Siri → Blyns Assistant</li><li>Messages → Chatline</li><li>Mail → Inbox</li><li>Maps → Atlas</li><li>Photos → Gallery</li><li>Calendar → Daybook</li><li>Notes → Jotter</li><li>Reminders → Tasks</li><li>Music → Soundwave</li><li>Weather → Forecast</li><li>Clock → World Clock</li><li>Calculator → Math Desk</li><li>Terminal → Console</li><li>App Store → Blyns Store</li><li>System Settings → Blyns Settings</li><li>Launchpad → App Library</li><li>TextEdit → Writer</li><li>Preview → Image Viewer</li><li>Freeform → Canvas</li><li>Books → Reader</li><li>Contacts → People</li><li>Podcasts → Broadcasts</li><li>Home → Smart Home</li><li>Activity Monitor → System Monitor</li><li>Keynote → Slides</li><li>Pages → Documents</li><li>Weather Plus → Forecast Plus</li></ul><h3 style="margin:4px 0 8px">Removed or replaced</h3><ul style="padding-left:20px"><li>Removed the Apple logo from the menu bar and replaced it with the Blyns B logo.</li><li>Removed the app-thumbnail preview cards from Stage Manager.</li><li>Removed the single-column desktop icon stack.</li><li>Removed desktop shortcuts for apps that have not been installed.</li><li>Removed non-zero keyboard shortcuts from boot and shutdown screens; 0 is the sole power-on key there.</li><li>Removed the visible mouse pointer during boot, restart and shutdown black screens.</li><li>Replaced Apple/macOS product naming and app labels with BlynsOS branding and Blyns app names.</li></ul><p style="font-size:11px;margin-top:16px;color:#777">Build: BlynsOS 1.0 Stabilized · System, account and app improvements for your personal workspace.</p></div><button class="settings-link" data-go="Software Update" style="margin-top:14px">Back to Software Update</button>`;
  if(page==='Appearance')html=`<h2>Appearance</h2><p>Personalize the visual style of Golden Gate.</p><div class="settings-row"><div><b>Appearance Mode</b><small>Choose a system appearance. Setup Assistant always stays light.</small></div><div class="settings-choice" style="margin:0"><button data-dark="0" class="${!prefs273.dark?'active':''}">Light</button><button data-dark="1" class="${prefs273.dark?'active':''}">Dark</button></div></div><h3 style="margin-top:18px;font-size:14px">Accent Colour</h3><div class="settings-choice">${[['#70a7ff','Blue'],['#b49aff','Purple'],['#65c9bb','Teal'],['#f0a45e','Orange'],['#f18bb4','Pink']].map(([c,n])=>`<button data-accent="${c}" class="${prefs273.accent===c?'active':''}"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${c};margin-right:5px"></span>${n}</button>`).join('')}</div><h3 style="margin-top:18px;font-size:14px">Wallpaper</h3><div class="settings-choice">${[['golden','Golden Gate'],['aurora','Aurora'],['ocean','Pacific'],['midnight','Midnight']].map(([v,n])=>`<button data-wall="${v}" class="${prefs273.wallpaper===v?'active':''}">${n}</button>`).join('')}</div><div style="margin-top:20px"><label style="display:flex;justify-content:space-between;font-size:12px"><b>Glass intensity</b><span id="glass-val">${prefs273.glass}%</span></label><input id="glass-range" type="range" min="15" max="100" value="${prefs273.glass}" style="width:100%;accent-color:var(--accent);margin-top:10px"></div><div style="margin-top:18px">${toggle('Reduce Motion','Reduce some desktop and dock animations','reduceMotion')}</div>`;
  if(page==='Desktop & Dock')html=`<h2>Desktop & Dock</h2><p>Control desktop visibility and Dock behaviour.</p>${toggle('Automatically hide Dock','Hide Dock while app windows are open; move pointer to bottom to reveal','dockAutoHide')}${toggle('Automatically hide Stage Manager','Hide Stage Manager previews; move pointer to left edge to reveal','stageAutoHide') }<div style="margin-top:18px"><label style="display:flex;justify-content:space-between;font-size:12px"><b>Dock icon size</b><span id="dock-size-value">${Math.round(prefs273.dockSize*46)} px</span></label><input id="dock-size-range" type="range" min="0.72" max="1.45" step="0.05" value="${prefs273.dockSize}" style="width:100%;accent-color:var(--accent);margin-top:10px"></div><div class="settings-row" style="margin-top:15px"><div><b>Desktop windows</b><small>${Object.keys(W).length} open or minimized app windows</small></div><button class="settings-link" id="show-all">Show All</button></div>`;
  if(page==='Dock Apps')html=`<h2>Dock Apps</h2><p>Choose which applications stay pinned in the Dock. Core apps remain available.</p><div class="settings-apps-list">${Object.keys(APPS).filter(id=>id!=='launchpad').map(id=>`<label class="settings-app-row"><u>${ico(id)}</u><span>${APPS[id].n}</span><input type="checkbox" data-pin="${id}" ${PIN.includes(id)?'checked':''} ${['finder','settings'].includes(id)?'disabled':''}></label>`).join('')}</div><p style="font-size:11px;margin-top:12px">You can also right-click a Dock icon to pin or unpin it.</p>`;
  if(page==='Control Center')html=`<h2>Control Center</h2><p>Connectivity and quick system controls.</p><div class="settings-row"><div><b>Stage Manager</b><small>Show up to three recent window previews</small></div><button class="settings-link" id="stage-settings">${stageOn?'Turn Off':'Turn On'}</button></div>${toggle('Wi-Fi','Demo connection toggle','wifiPreference')}${toggle('Bluetooth','Demo connection toggle','bluetoothPreference')}`;
  if(page==='Wi-Fi')html=`<h2>Wi-Fi</h2><p>Connectivity controls</p><div class="settings-row"><div><b>Wi-Fi</b><small>${wifiOn?'On · Golden Gate Home (demo)':'Off'}</small></div><button class="settings-link" id="wifi-toggle">${wifiOn?'Turn Off':'Turn On'}</button></div>`;
  if(page==='Bluetooth')html=`<h2>Bluetooth</h2><p>Nearby device connectivity</p><div class="settings-row"><div><b>Bluetooth</b><small>${bluetoothOn?'On':'Off'}</small></div><button class="settings-link" id="bt-toggle">${bluetoothOn?'Turn Off':'Turn On'}</button></div>`;
  if(page==='Sound')html=`<h2>Sound</h2><p>Output volume</p><div class="cc-slider" style="margin-top:18px"><label><span>Volume</span><span id="set-vol-label">${Math.round(S.vol/8*100)}%</span></label><input id="set-vol" type="range" min="0" max="8" value="${S.vol}" style="width:100%"></div><div class="settings-row" style="margin-top:15px"><div><b>Play interface sounds</b><small>Startup chime uses browser audio support</small></div><span style="font-size:12px;color:#888">Enabled</span></div>`;
  if(page==='Notifications')html=`<h2>Notifications</h2><p>Manage simulated system alerts.</p>${toggle('Allow Notifications','Show app and system toast messages','notifications')}`;
  if(page==='Keyboard')html=`<h2>Keyboard Shortcuts</h2><p>Quick desktop controls.</p>${[['F','Open Files'],['Ctrl + S','Spotlight Search'],['M','Mission Control'],['S','Stage Manager'],['W','Snap left / right / fullscreen'],['Q','Minimize / maximize last window'],['R','Force quit last active app'],['L','App Library'],['0','Power on from the black screen']].map(([k,v])=>`<div class="settings-row"><b style="font-size:12px">${k}</b><small>${v}</small></div>`).join('')}`;
  if(page==='Privacy')html=`<h2>Privacy</h2><p>Local simulator storage and browser permissions.</p><div class="settings-row"><div><b>Local Data</b><small>Account, notes, Dock pins and preferences are kept in this browser.</small></div><span style="font-size:11px;color:#888">On device</span></div><div class="settings-row"><div><b>Network access</b><small>Navigator can open web pages; some websites block embedding.</small></div><span style="font-size:11px;color:#888">Browser</span></div>`;
  if(page==='Users & Groups')html=`<h2>Users & Groups</h2><p style="margin:14px 0">${S.name} · Administrator</p><button class="settings-link" id="settings-logout">Lock Screen / Log Out</button>`;
  if(page==='About')html=`<h2>About BlynsOS</h2><div class="app-hero" style="margin-top:16px"><div style="font-size:30px;font-weight:800">B.</div><h3 style="margin-top:8px">BlynsOS 1.0</h3><p style="margin-top:6px">Chip: Blyns Core<br>Memory: 32 GB<br>Display: BlynsOS Desktop</p></div>`;
  if(page==='Storage')html=`<h2>Storage</h2><p>Files, notes and installed app preferences are stored locally by this browser.</p>`;
  main.innerHTML=html;
  $$('[data-page]',nav).forEach(x=>x.onclick=()=>{page=x.dataset.page;draw()});
  $$('[data-go]',main).forEach(x=>x.onclick=()=>{page=x.dataset.go;draw()});
  $$('[data-dark]',main).forEach(x=>x.onclick=()=>{prefs273.dark=x.dataset.dark==='1';savePrefs273();applyPrefs273();draw()});
  $$('[data-accent]',main).forEach(x=>x.onclick=()=>{prefs273.accent=x.dataset.accent;savePrefs273();applyPrefs273();draw()});
  $$('[data-wall]',main).forEach(x=>x.onclick=()=>{prefs273.wallpaper=x.dataset.wall;savePrefs273();applyPrefs273();draw()});
  $$('[data-pref]',main).forEach(x=>x.onchange=()=>{prefs273[x.dataset.pref]=x.checked;if(x.dataset.pref==='wifiPreference')wifiOn=x.checked;if(x.dataset.pref==='bluetoothPreference')bluetoothOn=x.checked;savePrefs273();applyPrefs273();syncCC()});
  $$('[data-pin]',main).forEach(x=>x.onchange=()=>{dockSetPin273(x.dataset.pin,x.checked);draw()});
  const glass=$('#glass-range',main);if(glass)glass.oninput=()=>{prefs273.glass=+glass.value;$('#glass-val',main).textContent=glass.value+'%';savePrefs273();document.documentElement.style.setProperty('--glass-level',String(+glass.value/100))};
  const dock=$('#dock-size-range',main);if(dock)dock.oninput=()=>{prefs273.dockSize=+dock.value;$('#dock-size-value',main).textContent=Math.round(prefs273.dockSize*46)+' px';savePrefs273();document.documentElement.style.setProperty('--dock-size',String(prefs273.dockSize))};
  const vol=$('#set-vol',main);if(vol)vol.oninput=()=>{S.vol=+vol.value;$('#set-vol-label',main).textContent=Math.round(S.vol/8*100)+'%';syncCC();hud()};
  $('#stage-settings',main)?.addEventListener('click',()=>{toggleStage();draw()});
  $('#wifi-toggle',main)?.addEventListener('click',()=>{wifiOn=!wifiOn;prefs273.wifiPreference=wifiOn;savePrefs273();draw();syncCC()});
  $('#bt-toggle',main)?.addEventListener('click',()=>{bluetoothOn=!bluetoothOn;prefs273.bluetoothPreference=bluetoothOn;savePrefs273();draw();syncCC()});
  $('#show-all',main)?.addEventListener('click',()=>{Object.values(W).forEach(w=>{w.classList.remove('min','stage-hidden');w.style.transform=''});updateDesktopState273()});
  $('#settings-logout',main)?.addEventListener('click',logout);
 };
 draw();
};

// Update the Control Center wording and persist settings state when toggles change.
$('#ccpanel').querySelector('.cc-foot span').textContent='Dark appearance · BlynsOS 1.0';
const ccStageOld=$('#cc-stage').onclick;
$('#cc-stage').onclick=()=>toggleStage();
$('#cc-wifi').onclick=()=>{wifiOn=!wifiOn;prefs273.wifiPreference=wifiOn;savePrefs273();syncCC()};
$('#cc-bt').onclick=()=>{bluetoothOn=!bluetoothOn;prefs273.bluetoothPreference=bluetoothOn;savePrefs273();syncCC()};

// Search is also available from a menu-bar icon; menu remains visible unless fullscreen.
function syncFullBar(){const full=Object.values(W).some(w=>!w.classList.contains('min')&&!w.classList.contains('gone')&&(w.classList.contains('is-fullscreen')||w.sn===3));$('#desk').classList.toggle('menu-hidden',full)}

// Refresh auto-hide state after app launch, minimize, close and maximize.
const oldOpenApp273=openApp;
openApp=function(id,arg){oldOpenApp273(id,arg);setTimeout(()=>{updateDesktopState273();if(stageOn)renderStageRail(id)},20)};
$('#wins').addEventListener('click',e=>{const w=e.target.closest('.win');if(w&&w.dataset.id){lastUsedWindowId=w.dataset.id;updateDesktopState273()}},true);

// Update release strings inside the existing status panel.
const ccTitle=$('#ccpanel').querySelector('div span');if(ccTitle)ccTitle.textContent='BlynsOS 1.0';
updateDesktopState273();syncCC();dockBuild();



/* ================= BlynsOS 1.0 Stabilized functional update ================= */
document.body.classList.add('black-screen');
const BLYNS_APP_NAMES={
 finder:'Files',safari:'Navigator',siri:'Blyns Assistant',messages:'Chatline',mail:'Inbox',maps:'Atlas',photos:'Gallery',calendar:'Daybook',notes:'Jotter',reminders:'Tasks',music:'Soundwave',weather:'Forecast',clock:'World Clock',calc:'Math Desk',terminal:'Console',store:'Blyns Store',settings:'Blyns Settings',launchpad:'App Library',textedit:'Writer',preview:'Image Viewer',freeform:'Canvas',books:'Reader',contacts:'People',podcasts:'Broadcasts',home:'Smart Home',monitor:'System Monitor',keynote:'Slides',pages:'Documents',weatherplus:'Forecast Plus'
};
Object.entries(BLYNS_APP_NAMES).forEach(([id,name])=>{if(APPS[id])APPS[id].n=name;if(typeof installedApps!=='undefined'&&installedApps[id])installedApps[id].n=name;});
$('#an').textContent='Files';
$('#ap').setAttribute('aria-label','BlynsOS menu');
$('#ap').innerHTML='<img class="blyns-menu-logo" src="https://i.postimg.cc/FHNw8SMW/Blyns-OS-Logo.jpg" alt="B">';

$('#off').innerHTML='<div class="power-hint">0 to turn on</div>';
$('#off').onclick=()=>{
  if(S.off){
    S.off=false;
    $('#off').classList.remove('on');
    started=true;
    boot();
  }
};
// During startup/shutdown, 0 is the keyboard power key.
// Keep pointer activation available as an accessible alternative to the 0 key.
const showBlynsBase=show;
show=function(id){showBlynsBase(id);document.body.classList.toggle('black-screen',id==='boot'||S.off);};
const bootBlynsBase=boot;
boot=function(){document.body.classList.add('black-screen');bootBlynsBase();};
const shutdownBlynsBase=shutdown;
shutdown=function(){shutdownBlynsBase();document.body.classList.add('black-screen');$('#off').classList.add('on');};
addEventListener('keydown',e=>{
  if(S.ph==='power'&&!started){e.preventDefault();e.stopImmediatePropagation();if(e.key==='0')start();return;}
  const black=S.ph==='boot'||S.off||$('#off').classList.contains('on');
  if(black){
    e.preventDefault();e.stopImmediatePropagation();
    if(e.key==='0'){
      if(S.off){S.off=false;$('#off').classList.remove('on');started=true;boot();}
      else if(!started)start();
    }
    return;
  }
  if(S.ph==='desk'&&e.ctrlKey&&!e.altKey&&e.key.toLowerCase()==='s'){
    e.preventDefault();e.stopImmediatePropagation();spotlightToggle273(true);return;
  }
  if(S.ph==='desk'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)&&e.key.toLowerCase()==='f'){
    e.preventDefault();e.stopImmediatePropagation();openApp('finder');
  }
},true);

// Store-only apps are kept out of desktop shortcuts, Finder's installed-app view and App Library until installed.
function isBlynsInstalled(id){return !Object.prototype.hasOwnProperty.call(installedApps,id)||installed.includes(id);}

// Free-position desktop icons. File coordinates live with the file; app coordinates use a separate local preference.
const BLYNS_DESKTOP_APP_POS='blyns_desktop_app_positions';
let blynsDesktopAppPos=ld(BLYNS_DESKTOP_APP_POS,{});
let blynsDesktopDrag=null,blynsLastDesktopDrag=0;
function blynsDefaultDesktopPos(i){const col=i%Math.max(1,Math.floor(Math.max(320,$('#ds').clientWidth)/108));const row=Math.floor(i/Math.max(1,Math.floor(Math.max(320,$('#ds').clientWidth)/108)));return{x:18+col*108,y:18+row*108};}
function blynsClampDesktopPos(x,y){const ds=$('#ds');return{x:Math.max(0,Math.min(+x||0,Math.max(0,ds.clientWidth-94))),y:Math.max(0,Math.min(+y||0,Math.max(0,ds.clientHeight-100)))};}
rd=function(){
  const host=$('#ds');if(!host)return;
  if(!Array.isArray(FS.Desktop))FS.Desktop=[];
  const fileHtml=FS.Desktop.map((f,i)=>{const p=blynsClampDesktopPos(Number.isFinite(f.x)?f.x:blynsDefaultDesktopPos(i).x,Number.isFinite(f.y)?f.y:blynsDefaultDesktopPos(i).y);return `<div class="tile desktop-icon" data-file-index="${i}" style="left:${p.x}px;top:${p.y}px;color:#fff"><u>${fi(f)}</u><span>${esc(f.n)}</span></div>`;}).join('');
  const appHtml=(installed||[]).filter(isBlynsInstalled).map((id,i)=>{const a=APPS[id];if(!a)return '';const d=blynsDesktopAppPos[id]||blynsDefaultDesktopPos(i+FS.Desktop.length+1);const p=blynsClampDesktopPos(d.x,d.y);return `<div class="tile desktop-icon app-shortcut" data-app="${id}" style="left:${p.x}px;top:${p.y}px;color:#fff"><u>${ico(id)}</u><span>${a.n}</span></div>`;}).join('');
  host.innerHTML=fileHtml+appHtml;
};
$('#ds').ondblclick=e=>{
  if(Date.now()-blynsLastDesktopDrag<350)return;
  const tile=e.target.closest('.desktop-icon');if(!tile)return;
  if(tile.dataset.app){if(isBlynsInstalled(tile.dataset.app))openApp(tile.dataset.app);return;}
  const f=FS.Desktop[+tile.dataset.fileIndex];if(f)openFile(f);
};
$('#ds').addEventListener('pointerdown',e=>{
  const tile=e.target.closest('.desktop-icon');if(!tile||e.button!==0)return;
  const r=tile.getBoundingClientRect(),area=$('#ds').getBoundingClientRect();
  blynsDesktopDrag={tile,startX:e.clientX,startY:e.clientY,offsetX:e.clientX-r.left,offsetY:e.clientY-r.top,area,moved:false};
  tile.setPointerCapture?.(e.pointerId);
});
$('#ds').addEventListener('pointermove',e=>{
  const d=blynsDesktopDrag;if(!d)return;
  const dx=e.clientX-d.startX,dy=e.clientY-d.startY;
  if(!d.moved&&Math.hypot(dx,dy)<4)return;
  d.moved=true;d.tile.classList.add('dragging');
  const p=blynsClampDesktopPos(e.clientX-d.area.left-d.offsetX,e.clientY-d.area.top-d.offsetY);
  d.tile.style.left=p.x+'px';d.tile.style.top=p.y+'px';
});
$('#ds').addEventListener('pointerup',()=>{
  const d=blynsDesktopDrag;if(!d)return;blynsDesktopDrag=null;d.tile.classList.remove('dragging');
  if(!d.moved)return;blynsLastDesktopDrag=Date.now();
  const p={x:parseFloat(d.tile.style.left)||0,y:parseFloat(d.tile.style.top)||0};
  if(d.tile.dataset.app){blynsDesktopAppPos[d.tile.dataset.app]=p;sv(BLYNS_DESKTOP_APP_POS,blynsDesktopAppPos);}
  else{const f=FS.Desktop[+d.tile.dataset.fileIndex];if(f){f.x=p.x;f.y=p.y;sv('mac_fs',FS);}}
});
addEventListener('resize',()=>{if(S.ph==='desk')rd();});

// Keep uninstalled Store apps out of app launch surfaces until the user installs them.
launchpad=function(){
  const l=$('#lp');if(l.classList.contains('on')){l.classList.remove('on');return;}
  const ids=Object.keys(APPS).filter(k=>k!=='launchpad'&&isBlynsInstalled(k));
  l.innerHTML='<input class="lps" placeholder="Search installed apps"><div class="lpg">'+ids.map((k,i)=>`<div class="lpi" data-k="${k}" style="animation-delay:${i*28}ms"><u>${ico(k)}</u><span>${APPS[k].n}</span></div>`).join('')+'</div>';
  l.classList.add('on');$('.lps',l).oninput=e=>$$('.lpi',l).forEach(x=>x.style.display=x.textContent.toLowerCase().includes(e.target.value.toLowerCase())?'':'none');
  l.onclick=e=>{const i=e.target.closest('.lpi');if(i||e.target===l||e.target.classList.contains('lpg')){l.classList.remove('on');if(i)openApp(i.dataset.k);}};
};
spotlightRender273=function(){
  const q=$('#spotlight-input').value.trim().toLowerCase(),results=[];
  Object.keys(APPS).filter(id=>id!=='launchpad'&&isBlynsInstalled(id)).forEach(id=>{const a=APPS[id];if(!q||a.n.toLowerCase().includes(q)||id.includes(q))results.push({type:'app',id,title:a.n,sub:'Installed application',icon:ico(id),score:q?(a.n.toLowerCase().startsWith(q)?0:1):2});});
  if(q)Object.entries(FS).forEach(([folder,files])=>files.forEach((f,i)=>{if((f.n||'').toLowerCase().includes(q))results.push({type:'file',folder,index:i,title:f.n,sub:folder+' · File',icon:fi(f),score:0});}));
  results.sort((a,b)=>a.score-b.score||a.title.localeCompare(b.title));spotlightResults273=results.slice(0,8);spotlightIndex273=0;
  $('#spotlight-results').innerHTML=spotlightResults273.length?spotlightResults273.map((r,i)=>`<button class="sp-result ${i===0?'active':''}" data-i="${i}"><u>${r.icon}</u><span><b>${r.title}</b><small>${r.sub}</small></span></button>`).join(''):'<div class="sp-empty">No results found</div>';
  $$('.sp-result').forEach(x=>x.onclick=()=>spotlightOpenResult273(+x.dataset.i));
};

// Stage Manager: a simple window list, no app screenshot or preview content.
renderStageRail=function(active){
  if(!stageOn)return;
  const wins=Object.values(W).filter(w=>!w.classList.contains('gone')).sort((a,b)=>(+b.style.zIndex||0)-(+a.style.zIndex||0));
  let rail=$('#stage-rail');if(!rail){$('#desk').insertAdjacentHTML('beforeend','<div id="stage-rail"></div>');rail=$('#stage-rail');}
  rail.innerHTML=wins.map(w=>{const id=w.dataset.id,rawTitle=$('.tb span',w)?.textContent||APPS[id]?.n||id,title=String(rawTitle).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');return `<button class="stage-card ${active===id?'active':''}" data-stage-id="${id}" title="${title.replace(/"/g,'&quot;')}"><span class="stage-window-mark">▱</span><span class="stage-card-label">${title}</span></button>`;}).join('')||'<span class="stage-empty">No open windows</span>';
  $$('[data-stage-id]',rail).forEach(x=>x.onclick=()=>stageFocus(x.dataset.stageId));
};

// Files: folders, multi-selection, edit, rename, open, delete and move actions.
APPS.finder.r=function(b,w){
  let loc='Desktop',stack=[],selected=new Set();
  const pathList=()=>stack.length?stack[stack.length-1].items:(FS[loc]||[]);
  const pathName=()=>[loc,...stack.map(x=>x.n)].join(' / ');
  const appIds=()=>Object.keys(APPS).filter(id=>id!=='launchpad'&&isBlynsInstalled(id));
  H(b,`<div class="bar" style="flex-wrap:wrap"><button id="f-up">↑ Back</button><button id="f-new-file">＋ File</button><button id="f-new-folder">＋ Folder</button><button id="f-edit">Edit</button><button id="f-rename">Rename</button><button id="f-open">Open Selected</button><button id="f-move">Move To ▾</button><button id="f-delete">Delete</button><button id="f-all">Select All</button><span id="f-path" style="margin-left:auto;font-size:11px;color:#666"></span></div><div class="row"><div class="side" id="f-side"></div><div class="main" id="f-main" style="display:flex;align-content:flex-start;flex-wrap:wrap;gap:2px"></div></div>`);
  const main=$('#f-main',b),side=$('#f-side',b);
  const clear=()=>selected.clear();
  const fileTile=(f,i)=>`<div class="tile finder-file ${selected.has(f)?'selected':''}" data-file-index="${i}"><u>${f.t==='folder'?'<span style="font-size:42px">📁</span>':fi(f)}</u><span>${esc(f.n)}</span></div>`;
  const actions=()=>{
    const files=[...selected],isApps=loc==='Applications';
    $('#f-edit',b).disabled=isApps||files.length!==1||files[0].t==='folder'||files[0].t==='img';
    $('#f-rename',b).disabled=isApps||files.length!==1;
    $('#f-delete',b).disabled=isApps||files.length===0;
    $('#f-move',b).disabled=isApps||files.length===0||stack.length>0;
    $('#f-open',b).disabled=files.length===0;
    $('#f-open',b).textContent=`Open Selected (${files.length})`;
    $('#f-all',b).textContent=(isApps?selected.size===appIds().length:selected.size===pathList().length)?'Deselect All':'Select All';
    $('#f-new-file',b).disabled=isApps;$('#f-new-folder',b).disabled=isApps;
  };
  const draw=()=>{
    side.innerHTML=['Applications','Desktop','Documents','Downloads'].map(x=>`<div class="${x===loc?'a':''}" data-location="${x}">${x==='Applications'?'▦':'📁'} ${x}</div>`).join('');
    $$('[data-location]',side).forEach(x=>x.onclick=()=>{loc=x.dataset.location;stack=[];clear();draw();});
    $('#f-path',b).textContent=pathName();$('#f-up',b).disabled=stack.length===0;
    if(loc==='Applications'){
      const ids=appIds();main.innerHTML=ids.map((id,i)=>`<div class="tile finder-file ${selected.has(id)?'selected':''}" data-app-id="${id}"><u>${ico(id)}</u><span>${APPS[id].n}</span></div>`).join('')||'<p style="color:#999">No installed applications</p>';
    }else{
      const list=pathList();main.innerHTML=list.map(fileTile).join('')||'<p style="color:#999;padding:14px">This folder is empty</p>';
    }
    $$('.finder-file',main).forEach(t=>t.onclick=()=>{
      if(loc==='Applications'){const id=t.dataset.appId;selected.has(id)?selected.delete(id):selected.add(id);t.classList.toggle('selected',selected.has(id));}
      else{const f=pathList()[+t.dataset.fileIndex];selected.has(f)?selected.delete(f):selected.add(f);t.classList.toggle('selected',selected.has(f));}
      actions();
    });
    $$('.finder-file',main).forEach(t=>t.ondblclick=()=>{
      if(loc==='Applications'){openApp(t.dataset.appId);return;}
      const f=pathList()[+t.dataset.fileIndex];if(!f)return;
      if(f.t==='folder'&&Array.isArray(f.items)){stack.push(f);clear();draw();}
      else openFile(f);
    });
    actions();
  };
  $('#f-up',b).onclick=()=>{if(stack.length){stack.pop();clear();draw();}};
  $('#f-new-file',b).onclick=()=>{if(loc==='Applications')return;const list=pathList();let n=1;while(list.some(f=>f.n==='Untitled '+n+'.txt'))n++;const f={n:'Untitled '+n+'.txt',t:'txt',c:''};list.push(f);clear();selected.add(f);sv('mac_fs',FS);draw();openApp('textedit',f);};
  $('#f-new-folder',b).onclick=()=>{if(loc==='Applications')return;const list=pathList();let n=1;while(list.some(f=>f.n==='New Folder'+(n>1?' '+n:'')))n++;const folder={n:'New Folder'+(n>1?' '+n:''),t:'folder',items:[]};list.push(folder);clear();selected.add(folder);sv('mac_fs',FS);draw();};
  $('#f-edit',b).onclick=()=>{const f=[...selected][0];if(f&&f.t!=='folder'&&f.t!=='img')openApp('textedit',f);};
  $('#f-rename',b).onclick=()=>{const f=[...selected][0];if(!f)return;const n=prompt('Enter a new name:',f.n);if(n&&n.trim()){f.n=n.trim().replace(/[\\/:*?"<>|]/g,'_');sv('mac_fs',FS);draw();}};
  $('#f-open',b).onclick=()=>{if(loc==='Applications'){[...selected].forEach((id,i)=>setTimeout(()=>openApp(id),i*110));return;}[...selected].forEach((f,i)=>setTimeout(()=>{if(f.t==='folder'){stack.push(f);clear();draw();}else openFile(f);},i*110));};
  $('#f-move',b).onclick=()=>{const choices=['Desktop','Documents','Downloads'].filter(x=>x!==loc);const dest=prompt('Move selected items to: '+choices.join(', '),choices[0]);if(!dest||!choices.includes(dest))return;const src=FS[loc],target=FS[dest];[...selected].forEach(f=>{const i=src.indexOf(f);if(i>=0){src.splice(i,1);target.push(f);}});clear();sv('mac_fs',FS);draw();rd();};
  $('#f-delete',b).onclick=()=>{if(loc==='Applications')return;const list=pathList();[...selected].forEach(f=>{const i=list.indexOf(f);if(i>=0)list.splice(i,1);});clear();sv('mac_fs',FS);draw();rd();};
  $('#f-all',b).onclick=()=>{const list=loc==='Applications'?appIds():pathList();if(selected.size===list.length)clear();else list.forEach(x=>selected.add(x));draw();};
  draw();
};

// Writer edits the selected file object in place, including files in newly created folders.
APPS.textedit.r=function(b,w,file){
  H(b,'<div class="bar"><b id="fn" style="font-size:13px;color:#333"></b><button id="sv" style="margin-left:auto">Save</button></div><textarea style="flex:1;border:0;outline:none;padding:14px;font-size:15px;resize:none;color:#222;background:#fff"></textarea>');
  const ta=$('textarea',b);let cur=null;
  const setFile=f=>{cur=f||{n:'Untitled.txt',t:'txt',c:''};$('#fn',b).textContent=cur.n;ta.value=cur.c||'';$('.tb span',w).textContent='Writer — '+cur.n;};
  w.q=setFile;setFile(file);
  const contains=(list)=>list.some(x=>x===cur||(x.t==='folder'&&Array.isArray(x.items)&&contains(x.items)));
  $('#sv',b).onclick=()=>{cur.c=ta.value;cur.t=cur.t||'txt';if(!Object.values(FS).some(list=>contains(list)))FS.Documents.push(cur);sv('mac_fs',FS);rd();toast('Saved '+cur.n);};
};

// Rebuild the desktop and Dock after the names/installation rules are applied.
dockBuild();rd();

// Navigator embeds Google Search in its iframe-friendly mode and loads Google Sites pages directly.
APPS.safari.r=function(b,w){
  H(b,`<div class="bar"><button id="nav-back">‹</button><button id="nav-forward">›</button><button id="nav-reload">⟳</button><input id="nav-address" placeholder="Search or enter website name"><button id="nav-go">Go</button><button id="nav-external">↗</button></div><div style="padding:6px 10px;font-size:10px;color:#707782;background:#f4f5f8" id="nav-note">Google Search and Google Sites can be embedded when the destination allows iframe access.</div><div id="nav-page" style="flex:1;display:flex;min-height:0;position:relative"></div>`);
  const page=$('#nav-page',b),address=$('#nav-address',b);let history=[],index=-1,current='';
  const makeUrl=q=>{q=q.trim();if(!q)return '';if(/^https?:\/\//i.test(q))return q;if(/^[\w.-]+\.[a-z]{2,}(:\d+)?(\/.*)?$/i.test(q))return 'https://'+q;return 'https://www.google.com/search?igu=1&q='+encodeURIComponent(q);};
  const visit=(q,push=true)=>{const url=makeUrl(q);if(!url)return;current=url;address.value=url;if(push){history=history.slice(0,index+1);history.push(url);index++;}page.innerHTML='<div class="spl" style="color:#666"><div class="sp"></div>Loading page…</div>';setTimeout(()=>{if(!page.isConnected)return;const frame=document.createElement('iframe');frame.title='Web page';frame.src=url;frame.referrerPolicy='strict-origin-when-cross-origin';frame.allow='fullscreen; clipboard-read; clipboard-write; geolocation; microphone; camera';frame.allowFullscreen=true;frame.style.cssText='flex:1;width:100%;height:100%;border:0;background:#fff';page.replaceChildren(frame);},120);};
  const home=()=>{page.innerHTML='<div style="padding:22px;overflow:auto;color:#242832"><h3>Quick Sites</h3><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:14px">'+[['Google Search','https://www.google.com/search?igu=1','G'],['Google Sites','https://sites.google.com/','S'],['Wikipedia','https://wikipedia.org','W'],['MDN','https://developer.mozilla.org','M']].map(([n,u,i])=>`<button data-url="${u}" style="border:1px solid #dce1e9;background:#fff;border-radius:10px;padding:12px 15px;color:#303744">${i} · ${n}</button>`).join('')+'</div><p style="font-size:11px;color:#858b95;margin-top:18px">Some sites set security rules that prevent iframe embedding. Use the ↗ button to open those sites in a new tab.</p></div>';$$('[data-url]',page).forEach(x=>x.onclick=()=>visit(x.dataset.url));};
  $('#nav-go',b).onclick=()=>visit(address.value);address.onkeydown=e=>{if(e.key==='Enter')visit(address.value);};
  $('#nav-back',b).onclick=()=>{if(index>0){index--;visit(history[index],false);}else home();};$('#nav-forward',b).onclick=()=>{if(index<history.length-1){index++;visit(history[index],false);}};$('#nav-reload',b).onclick=()=>{if(current)visit(current,false);};$('#nav-external',b).onclick=()=>{if(current)window.open(current,'_blank','noopener');};home();
};

// Rename the remaining visible menu labels and setup copy.
$$('#mb .mbmenu').forEach(x=>{if(x.dataset.menu==='Settings')x.textContent='Blyns';});
const blynsMenuItems=menuItems;
if(blynsMenuItems){
  if(blynsMenuItems.File)blynsMenuItems.File=blynsMenuItems.File.map(x=>x&&x[0]==='Open Files'?['Open Files',x[1]]:x);
  if(blynsMenuItems.Settings)blynsMenuItems.Settings=blynsMenuItems.Settings.map(x=>x&&x[0]==='Blyns Settings…'?['Blyns Settings…',x[1]]:x);
}
/* ================= end BlynsOS 1.0 Stabilized ================= */



/* ================= BlynsOS 1.0 Stabilized ================= */
(()=>{
  const V2='BlynsOS 1.0 Stabilized';
  const WORDMARK='https://i.postimg.cc/Dy8SsWjX/Blyns-OS-Logo.png';
  const B_MARK='https://i.postimg.cc/Pxv27fKS/Blyns-OS-Logo.png';
  const txt=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let avatarColor='#648fc5',avatarGlyph='initial';
  try{avatarColor=localStorage.getItem('blyns_avatar_color')||avatarColor;avatarGlyph=localStorage.getItem('blyns_avatar_glyph')||avatarGlyph;}catch(e){}
  const wallpaperOptions=[
    ['golden','Golden Gate','linear-gradient(145deg,#1b2a5e,#d9638f,#ffb86b)'],
    ['aurora','Aurora','linear-gradient(145deg,#091b32,#2c7779,#7d69ca)'],
    ['ocean','Pacific','linear-gradient(145deg,#c6efff,#4b9cc9,#092d51)'],
    ['midnight','Midnight','linear-gradient(145deg,#47516c,#171a2b,#080a11)'],
    ['dawn','Dawn','linear-gradient(145deg,#546a9b,#e59b9a,#f3c78d)'],
    ['forest','Forest','linear-gradient(145deg,#122d2a,#547e6c,#0c1d1e)'],
    ['lavender','Lavender','linear-gradient(145deg,#4d4b85,#9887bb,#d6a6bd)'],
    ['desert','Desert','linear-gradient(145deg,#805b53,#d89a70,#e7c59a)'],
    ['graphite','Graphite','linear-gradient(145deg,#555d68,#242932,#05070b)'],
    ['bloom','Bloom','linear-gradient(145deg,#494c85,#9a79b6,#e3a4b0)'],
    ...(window.BLYNS_WALLPAPERS||[]).map(w=>[w.id,w.name,`url(\"${w.src}\") center/cover`])
  ];
  const safePrefs=()=>{if(!prefs273||typeof prefs273!=='object')prefs273={};delete prefs273.wifiPreference;delete prefs273.bluetoothPreference;if(prefs273.focusMode===undefined)prefs273.focusMode=false;};
  safePrefs();

  // New transparent B-only artwork in the menu bar.
  $('#ap').innerHTML=`<img class="blyns-menu-logo" src="${B_MARK}" alt="BlynsOS">`;
  $('#ap').setAttribute('aria-label','BlynsOS menu');
  $('#ap .blyns-menu-logo').style.background='transparent';
  $('#desk').classList.add('v2-desktop');

  // Theme-aware Control Center, placed directly next to the clock in the menu bar.
  const cc=$('#ccpanel');
  cc.innerHTML=`
    <div class="cc-v2-head"><div><strong>Control Center</strong><small>${V2}</small></div><button id="cc-close" aria-label="Close Control Center">×</button></div>
    <div class="cc-v2-grid">
      <button class="cc-v2-tile" id="cc-theme"><span class="cc-symbol">◐</span><span><strong>Appearance</strong><small id="cc-theme-state">${prefs273.dark?'Dark':'Light'} mode</small></span></button>
      <button class="cc-v2-tile" id="cc-focus"><span class="cc-symbol">◉</span><span><strong>Focus</strong><small id="cc-focus-state">${prefs273.focusMode?'On':'Off'}</small></span></button>
      <button class="cc-v2-tile" id="cc-stage"><span class="cc-symbol">▣</span><span><strong>Stage Manager</strong><small id="cc-stage-state">${stageOn?'On':'Off'}</small></span></button>
      <button class="cc-v2-tile" id="cc-motion"><span class="cc-symbol">✧</span><span><strong>Reduce Motion</strong><small id="cc-motion-state">${prefs273.reduceMotion?'On':'Off'}</small></span></button>
      <button class="cc-v2-tile" id="cc-settings"><span class="cc-symbol">⚙</span><span><strong>Blyns Settings</strong><small>More controls</small></span></button>
      <button class="cc-v2-tile" id="cc-files"><span class="cc-symbol">▤</span><span><strong>Files</strong><small>Open workspace</small></span></button>
    </div>
    <div class="cc-v2-sliders">
      <div class="cc-v2-slider"><label><span>Brightness</span><span id="cc-bright-label">${brightness}%</span></label><input id="cc-bright" type="range" min="55" max="120" value="${brightness}"></div>
      <div class="cc-v2-slider"><label><span>Sound</span><span id="cc-vol-label">${Math.round(S.vol/8*100)}%</span></label><input id="cc-vol" type="range" min="0" max="8" value="${S.vol}"></div>
    </div>
    <div class="cc-v2-foot"><span>BlynsOS 1.0 Stabilized</span><button id="cc-done">Done</button></div>`;

  syncCC=function(){
    const p=$('#ccpanel');if(!p)return;
    const values=[['#cc-theme',!!prefs273.dark,'#cc-theme-state',prefs273.dark?'Dark mode':'Light mode'],['#cc-focus',!!prefs273.focusMode,'#cc-focus-state',prefs273.focusMode?'On':'Off'],['#cc-stage',!!stageOn,'#cc-stage-state',stageOn?'On':'Off'],['#cc-motion',!!prefs273.reduceMotion,'#cc-motion-state',prefs273.reduceMotion?'On':'Off']];
    values.forEach(([sel,on,label,value])=>{$(sel,p)?.classList.toggle('on',on);const node=$(label,p);if(node)node.textContent=value;});
    const bright=$('#cc-bright',p),bv=$('#cc-bright-label',p),vol=$('#cc-vol',p),vv=$('#cc-vol-label',p);
    if(bright)bright.value=brightness;if(bv)bv.textContent=brightness+'%';if(vol)vol.value=S.vol;if(vv)vv.textContent=Math.round(S.vol/8*100)+'%';
  };
  setBrightness=function(v){brightness=Math.max(55,Math.min(120,+v||100));document.documentElement.style.setProperty('--screen-dim',String(Math.max(0,(100-brightness)/100*.62)));const lab=$('#cc-bright-label');if(lab)lab.textContent=brightness+'%';};
  const closeCC=()=>{$('#ccpanel').classList.remove('on');$('#ccbtn').classList.remove('on');};
  $('#ccbtn').onclick=e=>{e.stopPropagation();$('#ccpanel').classList.toggle('on');$('#ccbtn').classList.toggle('on',$('#ccpanel').classList.contains('on'));syncCC()};
  $('#cc-close').onclick=closeCC;$('#cc-done').onclick=closeCC;
  $('#cc-theme').onclick=()=>{prefs273.dark=!prefs273.dark;savePrefs273();applyPrefs273();syncCC()};
  $('#cc-focus').onclick=()=>{prefs273.focusMode=!prefs273.focusMode;savePrefs273();syncCC();toast(prefs273.focusMode?'Focus is on':'Focus is off')};
  $('#cc-stage').onclick=()=>toggleStage();
  $('#cc-motion').onclick=()=>{prefs273.reduceMotion=!prefs273.reduceMotion;savePrefs273();applyPrefs273();syncCC()};
  $('#cc-settings').onclick=()=>{closeCC();openApp('settings');setTimeout(()=>{$$('#settings-nav [data-page]').find(x=>x.dataset.page==='Control Center')?.click()},90)};
  $('#cc-files').onclick=()=>{closeCC();openApp('finder')};
  $('#cc-bright').oninput=e=>setBrightness(e.target.value);
  $('#cc-vol').oninput=e=>{S.vol=+e.target.value;$('#cc-vol-label').textContent=Math.round(S.vol/8*100)+'%';hud()};
  addEventListener('pointerdown',e=>{if(!e.target.closest('#ccpanel,#ccbtn'))closeCC()},true);
  syncCC();
  const toastV2=toast;
  toast=function(message){if(prefs273.focusMode)return;toastV2(message)};

  // Remove fake connectivity settings from saved preferences and from the status bar.
  delete prefs273.wifiPreference;delete prefs273.bluetoothPreference;savePrefs273();

  // First-run Setup Assistant — uses the uploaded Setup screen structure and real local preferences.
  let setupDraft={region:'Malaysia',language:'ms',name:'',password:'',confirm:'',dark:false,wallpaper:'golden',accent:'#70a7ff',avatarColor:'#648fc5',avatarGlyph:'initial'};
  let setupStep=1,setupGreetings=['Hello','你好','Bonjour','Hola','こんにちは','안녕하세요','Selamat Datang'],setupGreetingTimer=null,setupPrepareTimer=null;
  const setupRegions=['Malaysia','Singapore','United States','United Kingdom','Japan','Germany','France','India','Australia','Indonesia','Brunei'];
  const setupPalette=[['#70a7ff','Blue'],['#b49aff','Purple'],['#65c9bb','Teal'],['#f0a45e','Orange'],['#f18bb4','Pink'],['#5dc3a5','Mint'],['#e0a2e8','Lilac']];
  const customWallpaperIds=new Set((window.BLYNS_WALLPAPERS||[]).map(w=>w.id));
  let installedWallpaperIds=ld('blyns_installed_wallpapers',[]);
  if(!Array.isArray(installedWallpaperIds))installedWallpaperIds=[];
  const saveInstalledWallpapers=()=>sv('blyns_installed_wallpapers',installedWallpaperIds);
  const setupSafe=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const setupCopy={
    ms:{step:'Langkah',continue:'Teruskan',back:'Kembali',start:'Mula',caption:'Satu permulaan baharu.',languageTitle:'Pilih bahasa anda',languageDesc:'Bahasa boleh diubah kemudian dalam tetapan.',nameTitle:'Siapa nama anda?',nameDesc:'Nama ini akan dipaparkan pada skrin kunci dan profil.',nameLabel:'Nama akaun',namePlaceholder:'Masukkan nama anda',passwordTitle:'Cipta kata laluan',passwordDesc:'Gunakan sekurang-kurangnya 8 aksara.',passwordLabel:'Kata laluan',passwordPlaceholder:'Cipta kata laluan',confirmTitle:'Sahkan kata laluan',confirmDesc:'Masukkan semula kata laluan yang sama.',confirmLabel:'Ulang kata laluan',confirmPlaceholder:'Masukkan semula kata laluan',themeTitle:'Pilih tema anda',themeDesc:'Pilih penampilan untuk ruang kerja anda.',wallTitle:'Pilih wallpaper',wallDesc:'Wallpaper ini digunakan pada desktop dan skrin kunci.',accentTitle:'Pilih warna aksen',accentDesc:'Warna ini digunakan pada kawalan dan pilihan sistem.',profileTitle:'Peribadikan profil',profileDesc:'Pilih warna dan simbol avatar anda.',prepareTitle:'Menyediakan ruang kerja',prepareDesc:'Profil dan pilihan anda sedang disimpan.',prepareStatus:'Menyimpan profil dan tetapan',errorName:'Sila masukkan nama akaun.',errorPassword:'Sila masukkan kata laluan.',errorShort:'Kata laluan mesti sekurang-kurangnya 8 aksara.',errorConfirm:'Sila sahkan kata laluan anda.',errorMismatch:'Kata laluan tidak sepadan.',languageMs:'Bahasa Melayu',languageEn:'English',themeLight:'Cerah',themeDark:'Gelap',avatarColor:'Warna avatar',avatarSymbol:'Simbol avatar',initial:'Huruf pertama nama',getStarted:'Selamat datang. Mari sediakan ruang kerja anda.'},
    en:{step:'Step',continue:'Continue',back:'Back',start:'Get Started',caption:'A beautiful new beginning.',languageTitle:'Choose your language',languageDesc:'You can change this later in Settings.',nameTitle:'What should we call you?',nameDesc:'This name appears on your lock screen and account profile.',nameLabel:'Account name',namePlaceholder:'Enter your name',passwordTitle:'Create a password',passwordDesc:'Use at least 8 characters.',passwordLabel:'Password',passwordPlaceholder:'Create a password',confirmTitle:'Confirm your password',confirmDesc:'Enter the same password again.',confirmLabel:'Confirm password',confirmPlaceholder:'Re-enter your password',themeTitle:'Choose your theme',themeDesc:'Choose the appearance for your workspace.',wallTitle:'Choose a wallpaper',wallDesc:'This wallpaper is used on your desktop and lock screen.',accentTitle:'Choose an accent colour',accentDesc:'This colour is used for system controls and selections.',profileTitle:'Personalize your profile',profileDesc:'Choose an avatar colour and symbol.',prepareTitle:'Preparing your workspace',prepareDesc:'Your profile and preferences are being saved.',prepareStatus:'Saving your profile and preferences',errorName:'Enter an account name to continue.',errorPassword:'Enter a password to continue.',errorShort:'Your password must contain at least 8 characters.',errorConfirm:'Confirm your password to continue.',errorMismatch:'The passwords do not match.',languageMs:'Bahasa Melayu',languageEn:'English',themeLight:'Light',themeDark:'Dark',avatarColor:'Avatar colour',avatarSymbol:'Avatar symbol',initial:'Account initial',getStarted:'Welcome. Let’s prepare your personal workspace.'}
  };
  const st=(key)=>setupCopy[setupDraft.language][key];
  const setupEl=(id)=>document.getElementById(id);
  function setupStart(){
    clearInterval(setupGreetingTimer);clearTimeout(setupPrepareTimer);
    setupDraft={region:'Malaysia',language:'ms',name:'',password:'',confirm:'',dark:false,wallpaper:'golden',accent:'#70a7ff',avatarColor:'#648fc5',avatarGlyph:'initial'};
    setupStep=1;show('setup');renderSetupStep();
  }
  function renderSetupStep(){
    clearInterval(setupGreetingTimer);clearTimeout(setupPrepareTimer);
    const content=setupEl('step-content'),counter=setupEl('step-counter'),track=setupEl('step-track-fill');
    const back=setupEl('back-button'),next=setupEl('continue-button'),error=setupEl('setup-error');
    if(!content||!counter||!track||!back||!next||!error){console.error('BlynsOS Setup markup is incomplete.');return;}
    counter.textContent=`${st('step')} ${setupStep} / 10`;
    track.style.width=`${setupStep*10}%`;
    error.textContent='';
    back.hidden=setupStep===1||setupStep===10;
    next.hidden=setupStep===10;
    back.textContent=st('back');
    next.innerHTML=`${setupStep===1?st('start'):st('continue')} <span aria-hidden="true">→</span>`;
    back.onclick=()=>{if(setupStep>1&&setupStep<10){setupStep--;renderSetupStep();}};
    next.onclick=nextSetupStep;
    const render=(html)=>{content.classList.remove('step-changing');content.innerHTML=html;void content.offsetWidth;content.classList.add('step-changing');};
    if(setupStep===1){
      render(`<div class="hello-stage"><div class="hello-orb" aria-hidden="true"></div><div><p class="hello-word" id="hello-word">${setupGreetings[0]}</p><p class="hello-caption">${st('caption')}</p></div></div><p class="step-description">${st('getStarted')}</p>`);
      let index=0;setupGreetingTimer=setInterval(()=>{const word=setupEl('hello-word');if(!word)return;index=(index+1)%setupGreetings.length;word.textContent=setupGreetings[index];word.style.animation='none';void word.offsetWidth;word.style.animation='hello-word-in 700ms cubic-bezier(.2,.8,.2,1) both';},1500);
      return;
    }
    if(setupStep===2){
      render(`<p class="step-eyebrow">${st('step')} 02</p><h1 class="step-title">${st('languageTitle')}</h1><p class="step-description">${st('languageDesc')}</p><div class="language-options" role="group" aria-label="Language"><button class="language-option ${setupDraft.language==='ms'?'selected':''}" type="button" data-language="ms"><span><span class="language-name">${st('languageMs')}</span><span class="language-native">Malaysia</span></span><span class="language-check" aria-hidden="true">✓</span></button><button class="language-option ${setupDraft.language==='en'?'selected':''}" type="button" data-language="en"><span><span class="language-name">${st('languageEn')}</span><span class="language-native">United Kingdom</span></span><span class="language-check" aria-hidden="true">✓</span></button></div>`);
      $$('[data-language]',content).forEach(button=>button.onclick=()=>{setupDraft.language=button.dataset.language;renderSetupStep();});return;
    }
    if(setupStep===3){
      render(`<p class="step-eyebrow">${st('step')} 03</p><h1 class="step-title">${st('nameTitle')}</h1><p class="step-description">${st('nameDesc')}</p><div class="setup-input-wrap"><label class="setup-label" for="setup-name">${st('nameLabel')}</label><input class="setup-input" id="setup-name" type="text" maxlength="28" autocomplete="name" placeholder="${st('namePlaceholder')}" value="${setupSafe(setupDraft.name)}"></div>`);
      setupEl('setup-name').addEventListener('input',e=>setupDraft.name=e.target.value);setupEl('setup-name').focus();return;
    }
    if(setupStep===4){
      render(`<p class="step-eyebrow">${st('step')} 04</p><h1 class="step-title">${st('passwordTitle')}</h1><p class="step-description">${st('passwordDesc')}</p><div class="setup-input-wrap"><label class="setup-label" for="setup-password">${st('passwordLabel')}</label><input class="setup-input" id="setup-password" type="password" autocomplete="new-password" placeholder="${st('passwordPlaceholder')}"></div>`);
      setupEl('setup-password').addEventListener('input',e=>setupDraft.password=e.target.value);setupEl('setup-password').focus();return;
    }
    if(setupStep===5){
      render(`<p class="step-eyebrow">${st('step')} 05</p><h1 class="step-title">${st('confirmTitle')}</h1><p class="step-description">${st('confirmDesc')}</p><div class="setup-input-wrap"><label class="setup-label" for="setup-confirm">${st('confirmLabel')}</label><input class="setup-input" id="setup-confirm" type="password" autocomplete="new-password" placeholder="${st('confirmPlaceholder')}"></div>`);
      setupEl('setup-confirm').addEventListener('input',e=>setupDraft.confirm=e.target.value);setupEl('setup-confirm').focus();return;
    }
    if(setupStep===6){
      render(`<p class="step-eyebrow">${st('step')} 06</p><h1 class="step-title">${st('themeTitle')}</h1><p class="step-description">${st('themeDesc')}</p><div class="setup-choice-grid"><button class="setup-choice ${!setupDraft.dark?'active':''}" type="button" data-theme="light">☀ &nbsp; ${st('themeLight')}</button><button class="setup-choice ${setupDraft.dark?'active':''}" type="button" data-theme="dark">◐ &nbsp; ${st('themeDark')}</button></div>`);
      $$('[data-theme]',content).forEach(button=>button.onclick=()=>{setupDraft.dark=button.dataset.theme==='dark';$$('[data-theme]',content).forEach(item=>item.classList.toggle('active',item===button));});return;
    }
    if(setupStep===7){
      const choices=wallpaperOptions.map(([id,name,preview])=>({id,name,preview}));
      render(`<p class="step-eyebrow">${st('step')} 07</p><h1 class="step-title">${st('wallTitle')}</h1><p class="step-description">${st('wallDesc')}</p><div class="setup-wall-grid">${choices.map(w=>`<button class="setup-wall-choice ${setupDraft.wallpaper===w.id?'active':''}" type="button" data-wallpaper="${setupSafe(w.id)}"><span class="setup-wall-preview" style="background:${w.preview}"></span><span>${setupSafe(w.name)}</span></button>`).join('')}</div>`);
      $$('[data-wallpaper]',content).forEach(button=>button.onclick=()=>{setupDraft.wallpaper=button.dataset.wallpaper;$$('[data-wallpaper]',content).forEach(item=>item.classList.toggle('active',item===button));});return;
    }
    if(setupStep===8){
      render(`<p class="step-eyebrow">${st('step')} 08</p><h1 class="step-title">${st('accentTitle')}</h1><p class="step-description">${st('accentDesc')}</p><div class="setup-color-row">${setupPalette.map(([color,label])=>`<button class="setup-color-choice ${setupDraft.accent===color?'active':''}" type="button" data-accent="${color}" title="${label}" style="background:${color}"></button>`).join('')}</div><label class="setup-label" for="setup-accent-custom">Custom colour</label><input id="setup-accent-custom" type="color" value="${setupDraft.accent}" style="width:70px;height:42px;border:0;background:transparent;cursor:pointer">`);
      $$('[data-accent]',content).forEach(button=>button.onclick=()=>{setupDraft.accent=button.dataset.accent;setupEl('setup-accent-custom').value=setupDraft.accent;$$('[data-accent]',content).forEach(item=>item.classList.toggle('active',item===button));});
      setupEl('setup-accent-custom').oninput=e=>{setupDraft.accent=e.target.value;$$('[data-accent]',content).forEach(item=>item.classList.toggle('active',item.dataset.accent===setupDraft.accent));};return;
    }
    if(setupStep===9){
      const glyphs=[['initial',st('initial')],['🙂','Smile'],['🌟','Star'],['🌙','Moon'],['💎','Gem'],['🌿','Leaf'],['🚀','Rocket']];
      const display=setupDraft.avatarGlyph==='initial'?(setupDraft.name||'B').slice(0,1).toUpperCase():setupDraft.avatarGlyph;
      render(`<p class="step-eyebrow">${st('step')} 09</p><h1 class="step-title">${st('profileTitle')}</h1><p class="step-description">${st('profileDesc')}</p><div class="setup-avatar-preview" id="setup-avatar-preview" style="background:${setupDraft.avatarColor}">${setupSafe(display)}</div><label class="setup-label" for="setup-avatar-color">${st('avatarColor')}</label><input id="setup-avatar-color" type="color" value="${setupDraft.avatarColor}" style="width:70px;height:42px;border:0;background:transparent;cursor:pointer"><label class="setup-label" for="setup-avatar-glyph">${st('avatarSymbol')}</label><select id="setup-avatar-glyph" class="setup-input">${glyphs.map(([value,label])=>`<option value="${setupSafe(value)}" ${setupDraft.avatarGlyph===value?'selected':''}>${setupSafe(label)}</option>`).join('')}</select>`);
      setupEl('setup-avatar-color').oninput=e=>{setupDraft.avatarColor=e.target.value;setupEl('setup-avatar-preview').style.background=e.target.value;};
      setupEl('setup-avatar-glyph').onchange=e=>{setupDraft.avatarGlyph=e.target.value;setupEl('setup-avatar-preview').textContent=e.target.value==='initial'?(setupDraft.name||'B').slice(0,1).toUpperCase():e.target.value;};return;
    }
    if(setupStep===10){
      render(`<div class="preparing-icon" aria-hidden="true"></div><h1 class="step-title">${st('prepareTitle')}</h1><p class="step-description">${st('prepareDesc')}</p><div class="preparing-track" aria-hidden="true"><div class="preparing-fill"></div></div><p class="step-description setup-prepare-status">${st('prepareStatus')}</p>`);
      back.hidden=true;next.hidden=true;setupPrepareTimer=setTimeout(finishStabilizedSetup,2300);return;
    }
  }
  async function nextSetupStep(){
    const error=setupEl('setup-error');if(error)error.textContent='';
    if(setupStep===2){/* The selected language is already stored by its option button. */}
    if(setupStep===3){setupDraft.name=setupEl('setup-name').value.trim();if(!setupDraft.name){error.textContent=st('errorName');setupEl('setup-name').focus();return;}}
    if(setupStep===4){setupDraft.password=setupEl('setup-password').value;if(!setupDraft.password){error.textContent=st('errorPassword');setupEl('setup-password').focus();return;}if(setupDraft.password.length<8){error.textContent=st('errorShort');setupEl('setup-password').focus();return;}}
    if(setupStep===5){setupDraft.confirm=setupEl('setup-confirm').value;if(!setupDraft.confirm){error.textContent=st('errorConfirm');setupEl('setup-confirm').focus();return;}if(setupDraft.confirm!==setupDraft.password){error.textContent=st('errorMismatch');setupEl('setup-confirm').focus();return;}}
    if(setupStep===8)setupDraft.accent=setupEl('setup-accent-custom').value;
    if(setupStep===9){setupDraft.avatarColor=setupEl('setup-avatar-color').value;setupDraft.avatarGlyph=setupEl('setup-avatar-glyph').value;}
    if(setupStep<10){setupStep++;renderSetupStep();}
  }
  async function finishStabilizedSetup(){
    try{
      await saveBlynsPassword(setupDraft.password);
      S.name=setupDraft.name.trim();
      avatarColor=setupDraft.avatarColor;avatarGlyph=setupDraft.avatarGlyph;
      prefs273.dark=setupDraft.dark;prefs273.wallpaper=setupDraft.wallpaper;prefs273.accent=setupDraft.accent;
      if(customWallpaperIds.has(setupDraft.wallpaper)&&!installedWallpaperIds.includes(setupDraft.wallpaper)){installedWallpaperIds.push(setupDraft.wallpaper);saveInstalledWallpapers();}
      localStorage.setItem('mac_n',S.name);
      localStorage.setItem('blyns_avatar_color',avatarColor);localStorage.setItem('blyns_avatar_glyph',avatarGlyph);
      localStorage.setItem('blyns_region',setupDraft.region);localStorage.setItem('blyns_language',setupDraft.language);
      savePrefs273();applyPrefs273();
      setupEl('welcome-hello').textContent=`${setupDraft.language==='ms'?'Selamat datang':'Welcome'}, ${S.name}`;
      setupEl('welcome-subtitle').textContent=setupDraft.language==='ms'?'Ruang kerja anda sedia digunakan':'Your workspace is ready';
      show('welcome');
      setTimeout(()=>{lockInit();show('lock');},2200);
    }catch(error){
      setupStep=4;renderSetupStep();const target=setupEl('setup-error');if(target)target.textContent=error.message||'Secure account setup could not be completed.';
    }
  }
  window.BlynsSetupStart=setupStart;
  function applyProfile(){
    const el=$('#lav');if(!el)return;
    const display=avatarGlyph==='initial'?(S.name||'B').trim().slice(0,1).toUpperCase():avatarGlyph;
    el.textContent=display;el.style.background=`linear-gradient(145deg,${avatarColor},color-mix(in srgb,${avatarColor} 60%,#17243a))`;el.style.color='#fff';el.style.border='1px solid #ffffff70';
  }
  lockInit=function(){dockBuild();rd();$('#lock').classList.remove('up');$('#lav').textContent=(S.name||'B').slice(0,1).toUpperCase();$('#lnm').textContent=S.name;$('#pw').value='';if($('#unlock-error'))$('#unlock-error').textContent='';applyProfile();setTimeout(()=>{if(S.ph==='lock'&&$('#lock').classList.contains('on'))$('#pw').focus();},900);};
  applyProfile();

  function applyProfile(){
    const el=$('#lav');if(!el)return;
    const display=avatarGlyph==='initial'?(S.name||'B').trim().slice(0,1).toUpperCase():avatarGlyph;
    el.textContent=display;el.style.background=`linear-gradient(145deg,${avatarColor},color-mix(in srgb,${avatarColor} 60%,#17243a))`;el.style.color='#fff';el.style.border='1px solid #ffffff70';
  }
  lockInit=function(){dockBuild();rd();$('#lock').classList.remove('up');$('#lav').textContent=(S.name||'B').slice(0,1).toUpperCase();$('#lnm').textContent=S.name;$('#pw').value='';applyProfile();setTimeout(()=>{if(S.ph==='lock'&&$('#lock').classList.contains('on'))$('#pw').focus();},900);};
  applyProfile();

  // Register optional app packages supplied from the Apps folder.
  (window.BLYNS_APP_PACKAGES||[]).forEach(pkg=>{
    if(!pkg||!pkg.id||typeof pkg.render!=='function'||APPS[pkg.id])return;
    const renderer=(container,win,args)=>pkg.render(container,{
      window:win,args,
      toast:(message)=>toast(message),
      storage:window.BlynsStorage,
      openApp:(id,arg)=>openApp(id,arg),
      onClose:(callback)=>{if(win)win.__blynsCleanup=callback;}
    });
    app(pkg.id,pkg.name,pkg.symbol||'◈',pkg.colors||'#7897c9,#3c5b91',renderer,pkg.size||[520,420]);
    APPS[pkg.id].icon=pkg.icon||window.BlynsRegistry.iconPath(pkg.id);
    installedApps[pkg.id]={n:pkg.name,i:pkg.symbol||'◈',c:pkg.colors||'#7897c9,#3c5b91',sz:pkg.size||[520,420],r:renderer};
  });
  const appCatalogMeta=new Map((window.BLYNS_APP_CATALOG||[]).map(item=>[item.id,item]));
  const wallpaperCatalog=window.BLYNS_WALLPAPERS||[];
  function getAppCatalog(){
    return Object.keys(installedApps).filter(id=>APPS[id]).map(id=>{
      const meta=appCatalogMeta.get(id)||window.BLYNS_APP_PACKAGES?.find(x=>x.id===id)||{};
      return {id,name:meta.name||APPS[id].n,description:meta.description||'A useful application for your workspace.',category:meta.category||'Apps',version:meta.version||'1.0.0'};
    });
  }
  function applyWallpaperChoice(id){
    prefs273.wallpaper=id;savePrefs273();applyPrefs273();
    const pack=wallpaperCatalog.find(w=>w.id===id);
    if(pack){document.body.classList.add('custom-wallpaper');document.documentElement.style.setProperty('--blyns-wallpaper-image',`url("${pack.src}")`);}
    else{document.body.classList.remove('custom-wallpaper');document.documentElement.style.removeProperty('--blyns-wallpaper-image');}
  }
  const baseApplyPrefsForWallpaper=applyPrefs273;
  applyPrefs273=function(){
    baseApplyPrefsForWallpaper();
    const pack=wallpaperCatalog.find(w=>w.id===prefs273.wallpaper);
    document.body.classList.toggle('custom-wallpaper',!!pack);
    if(pack)document.documentElement.style.setProperty('--blyns-wallpaper-image',`url("${pack.src}")`);
    else document.documentElement.style.removeProperty('--blyns-wallpaper-image');
  };
  // Make package wallpapers available to Setup and Appearance as well as the Store.
  wallpaperCatalog.forEach(w=>{if(!wallpaperOptions.some(item=>item[0]===w.id))wallpaperOptions.push([w.id,w.name,`url("${w.preview||w.src}") center/cover`]);});
  APPS.store.r=function(b){
    let tab='apps';
    const draw=()=>{
      const appRows=getAppCatalog().map(item=>{
        const meta=window.BLYNS_APP_PACKAGES?.find(x=>x.id===item.id);
        const icon=meta?.icon||window.BlynsRegistry.iconPath(item.id);
        const ready=installed.includes(item.id);
        return `<div class="store-card"><div class="store-icon"><img src="${icon}" alt=""></div><div class="store-meta"><b>${txt(item.name)}</b><small>${txt(item.description)} · ${txt(item.category)} · v${txt(item.version)}</small></div><button class="store-install" data-app-install="${item.id}">${ready?'Open':'Get'}</button></div>`;
      }).join('');
      const wallpaperRows=wallpaperCatalog.map(w=>{
        const ready=installedWallpaperIds.includes(w.id),active=prefs273.wallpaper===w.id;
        return `<div class="store-wallpaper"><img src="${w.preview||w.src}" alt="${txt(w.name)}"><div class="store-meta"><b>${txt(w.name)}</b><small>${txt(w.description||'Wallpaper for your desktop and lock screen.')}</small></div><button class="store-install" data-wall-install="${w.id}">${active?'Applied':ready?'Apply':'Get'}</button></div>`;
      }).join('');
      H(b,`<div class="main"><div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><div><h2>Blyns Store</h2><p style="color:#818895;font-size:12px;margin-top:4px">Applications and wallpapers</p></div><span style="font-size:11px;color:#8b929e">${tab==='apps'?getAppCatalog().length+' apps':wallpaperCatalog.length+' wallpapers'}</span></div><div class="store-tabs"><button data-store-tab="apps" class="${tab==='apps'?'active':''}">Apps</button><button data-store-tab="wallpapers" class="${tab==='wallpapers'?'active':''}">Wallpapers</button></div><div id="store-package-list">${tab==='apps'?(appRows||'<div class="store-empty-note">No applications are available yet.</div>'):(wallpaperRows||'<div class="store-empty-note">No wallpapers are available yet.</div>')}</div></div>`);
      $$('[data-store-tab]',b).forEach(btn=>btn.onclick=()=>{tab=btn.dataset.storeTab;draw();});
      $$('[data-app-install]',b).forEach(btn=>btn.onclick=()=>{
        const id=btn.dataset.appInstall;
        if(installed.includes(id)){openApp(id);return;}
        if(!APPS[id]){toast('This app package is not available.');return;}
        installed.push(id);persistInstalled();installedSet();dockBuild();rd();renderDesktop();draw();toast(APPS[id].n+' added to your apps.');
      });
      $$('[data-wall-install]',b).forEach(btn=>btn.onclick=()=>{
        const id=btn.dataset.wallInstall;
        if(!installedWallpaperIds.includes(id)){installedWallpaperIds.push(id);saveInstalledWallpapers();}
        applyWallpaperChoice(id);draw();toast('Wallpaper applied.');
      });
    };
    draw();
  };

  // Store app candidates are not surfaced until the user has installed them.
  const isInstalledV1=isBlynsInstalled;
  isBlynsInstalled=function(id){return !APPS[id]?.__transient&&isInstalledV1(id)};

  // Full grid desktop. Existing icon coordinates are snapped to the nearest cell.
  const desktopAppKey='blyns_v2_desktop_apps';
  let desktopApps=ld(desktopAppKey,Array.isArray(installed)?installed.slice():[]).filter(id=>APPS[id]&&isBlynsInstalled(id));
  let selectedDesktop=null,desktopDrag=null,lastDesktopDrag=0;
  const dsOld=$('#ds');
  const dsNew=dsOld.cloneNode(false);
  dsOld.replaceWith(dsNew); // also removes the earlier free-drag pointer handlers
  const cellW=106,cellH=112,iconW=88,iconH=96;
  function gridCols(){return Math.max(1,Math.floor(Math.max(320,dsNew.clientWidth-20)/cellW));}
  function cellFromXY(x,y){const cols=gridCols();return {col:Math.max(0,Math.round((x-10)/cellW)),row:Math.max(0,Math.round((y-8)/cellH)),cols};}
  function gridXY(col,row){const cols=gridCols();return {x:Math.min(Math.max(0,cols-1),col)*cellW+10,y:Math.max(0,row)*cellH+8};}
  function cellOccupied(col,row,exclude){const pos=gridXY(col,row);return [...$$('.desktop-icon',dsNew)].some(t=>t!==exclude&&parseFloat(t.style.left)===pos.x&&parseFloat(t.style.top)===pos.y);}
  function nearestFree(col,row,exclude){let r={col,row};for(let ring=0;ring<20;ring++){for(let dy=-ring;dy<=ring;dy++)for(let dx=-ring;dx<=ring;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==ring)continue;const c=Math.max(0,Math.min(gridCols()-1,col+dx)),rr=Math.max(0,row+dy);if(!cellOccupied(c,rr,exclude))return {col:c,row:rr};}}return r;}
  function defaultCell(i){const cols=gridCols();return {col:i%cols,row:Math.floor(i/cols)};}
  function renderDesktop(){
    if(!Array.isArray(FS.Desktop))FS.Desktop=[];
    const usedCells=new Set();
    const pickCell=(col,row)=>{const cols=gridCols();for(let ring=0;ring<40;ring++){for(let dy=-ring;dy<=ring;dy++)for(let dx=-ring;dx<=ring;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==ring)continue;const c=Math.max(0,Math.min(cols-1,col+dx)),r=Math.max(0,row+dy),key=c+':'+r;if(!usedCells.has(key)){usedCells.add(key);return {col:c,row:r};}}}return {col,row};};
    const files=FS.Desktop.map((f,i)=>{
      const has=Number.isFinite(f.x)&&Number.isFinite(f.y),old=has?cellFromXY(f.x,f.y):defaultCell(i),cell=pickCell(old.col,old.row),p=gridXY(cell.col,cell.row);f.x=p.x;f.y=p.y;
      return `<div class="tile desktop-icon ${selectedDesktop?.type==='file'&&selectedDesktop.index===i?'selected':''}" data-file-index="${i}" style="left:${p.x}px;top:${p.y}px;color:#fff"><u>${fi(f)}</u><span>${txt(f.n)}</span></div>`;
    }).join('');
    let appHtml='';
    desktopApps=desktopApps.filter(id=>APPS[id]&&isBlynsInstalled(id));
    appHtml=desktopApps.map((id,i)=>{const saved=blynsDesktopAppPos[id],cell=saved?cellFromXY(saved.x,saved.y):defaultCell(FS.Desktop.length+i),free=pickCell(cell.col,cell.row),p=gridXY(free.col,free.row);return `<div class="tile desktop-icon app-shortcut ${selectedDesktop?.type==='app'&&selectedDesktop.id===id?'selected':''}" data-app="${id}" style="left:${p.x}px;top:${p.y}px;color:#fff"><u>${ico(id)}</u><span>${txt(APPS[id].n)}</span></div>`;}).join('');
    dsNew.innerHTML=files+appHtml;sv('mac_fs',FS);sv(desktopAppKey,desktopApps);
  }
  rd=renderDesktop;
  function saveDesktopPosition(tile){
    const cell=nearestFree(cellFromXY(parseFloat(tile.style.left)||0,parseFloat(tile.style.top)||0).col,cellFromXY(parseFloat(tile.style.left)||0,parseFloat(tile.style.top)||0).row,tile),p=gridXY(cell.col,cell.row);
    tile.style.left=p.x+'px';tile.style.top=p.y+'px';
    if(tile.dataset.app){blynsDesktopAppPos[tile.dataset.app]=p;sv(BLYNS_DESKTOP_APP_POS,blynsDesktopAppPos);}
    else{const f=FS.Desktop[+tile.dataset.fileIndex];if(f){f.x=p.x;f.y=p.y;sv('mac_fs',FS);}}
  }
  dsNew.addEventListener('pointerdown',e=>{
    const tile=e.target.closest('.desktop-icon');if(!tile||e.button!==0)return;
    selectedDesktop=tile.dataset.app?{type:'app',id:tile.dataset.app}:{type:'file',index:+tile.dataset.fileIndex};
    $$('.desktop-icon',dsNew).forEach(x=>x.classList.toggle('selected',x===tile));
    const r=tile.getBoundingClientRect(),area=dsNew.getBoundingClientRect();
    desktopDrag={tile,startX:e.clientX,startY:e.clientY,offsetX:e.clientX-r.left,offsetY:e.clientY-r.top,area,moved:false};
    try{tile.setPointerCapture(e.pointerId)}catch(err){}
  });
  dsNew.addEventListener('pointermove',e=>{
    const d=desktopDrag;if(!d)return;
    if(!d.moved&&Math.hypot(e.clientX-d.startX,e.clientY-d.startY)<4)return;
    d.moved=true;d.tile.classList.add('dragging');
    const rawX=e.clientX-d.area.left-d.offsetX,rawY=e.clientY-d.area.top-d.offsetY,cell=cellFromXY(rawX,rawY),free=nearestFree(cell.col,cell.row,d.tile),p=gridXY(free.col,free.row);
    d.tile.style.left=p.x+'px';d.tile.style.top=p.y+'px';
  });
  dsNew.addEventListener('pointerup',()=>{const d=desktopDrag;if(!d)return;desktopDrag=null;d.tile.classList.remove('dragging');if(d.moved){lastDesktopDrag=Date.now();saveDesktopPosition(d.tile);}});
  dsNew.ondblclick=e=>{
    if(Date.now()-lastDesktopDrag<350)return;const tile=e.target.closest('.desktop-icon');if(!tile)return;
    if(tile.dataset.app){if(isBlynsInstalled(tile.dataset.app))openApp(tile.dataset.app);return;}
    const f=FS.Desktop[+tile.dataset.fileIndex];if(f){if(f.t==='folder'&&Array.isArray(f.items))openApp('finder');else openFile(f);}
  };
  function removeDesktopSelection(){
    if(!selectedDesktop)return;
    if(selectedDesktop.type==='app'){desktopApps=desktopApps.filter(id=>id!==selectedDesktop.id);sv(desktopAppKey,desktopApps);delete blynsDesktopAppPos[selectedDesktop.id];sv(BLYNS_DESKTOP_APP_POS,blynsDesktopAppPos);}
    else{const f=FS.Desktop[selectedDesktop.index];if(f){FS.Desktop.splice(selectedDesktop.index,1);}}
    selectedDesktop=null;sv('mac_fs',FS);renderDesktop();toast('Removed from desktop');
  }
  function addDesktopApp(){
    const choices=Object.keys(APPS).filter(id=>id!=='launchpad'&&!APPS[id].__transient&&isBlynsInstalled(id)&&!desktopApps.includes(id));
    if(!choices.length)return toast('All installed apps already have desktop shortcuts');
    const answer=prompt('Enter an installed app name or ID:\n'+choices.map(id=>`${APPS[id].n} (${id})`).join('\n'));
    if(!answer)return;const id=choices.find(k=>k===answer.trim().toLowerCase()||APPS[k].n.toLowerCase()===answer.trim().toLowerCase());
    if(!id)return toast('Installed app not found');desktopApps.push(id);sv(desktopAppKey,desktopApps);renderDesktop();toast(APPS[id].n+' shortcut added');
  }
  function desktopContext(e){
    e.preventDefault();const tile=e.target.closest('.desktop-icon');if(tile){selectedDesktop=tile.dataset.app?{type:'app',id:tile.dataset.app}:{type:'file',index:+tile.dataset.fileIndex};$$('.desktop-icon',dsNew).forEach(x=>x.classList.toggle('selected',x===tile));}
    menu(e.clientX,e.clientY,[
      ['New Text File',()=>{let n=1;while(FS.Desktop.some(x=>x.n==='Untitled '+n+'.txt'))n++;FS.Desktop.push({n:'Untitled '+n+'.txt',t:'txt',c:''});sv('mac_fs',FS);renderDesktop();openFile(FS.Desktop.at(-1));}],
      ['New Folder',()=>{let n=1;while(FS.Desktop.some(x=>x.n==='New Folder'+(n>1?' '+n:'')))n++;FS.Desktop.push({n:'New Folder'+(n>1?' '+n:''),t:'folder',items:[]});sv('mac_fs',FS);renderDesktop();}],
      ['Add App Shortcut…',addDesktopApp],
      ['Remove Selected from Desktop',removeDesktopSelection],
      ['Arrange by Grid',()=>{FS.Desktop.forEach((f,i)=>{const p=gridXY(defaultCell(i).col,defaultCell(i).row);f.x=p.x;f.y=p.y});desktopApps.forEach((id,i)=>{const p=gridXY(defaultCell(FS.Desktop.length+i).col,defaultCell(FS.Desktop.length+i).row);blynsDesktopAppPos[id]=p});sv('mac_fs',FS);sv(BLYNS_DESKTOP_APP_POS,blynsDesktopAppPos);renderDesktop();}],
      null,['App Library',launchpad],['Blyns Settings…',()=>openApp('settings')]
    ]);
  }
  $('#desk').oncontextmenu=desktopContext;
  addEventListener('keydown',e=>{
    if(S.ph!=='desk'||S.off||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.isContentEditable)return;
    if((e.key==='Delete'||e.key==='Backspace')&&selectedDesktop){e.preventDefault();removeDesktopSelection();}
  });
  addEventListener('resize',()=>{if(S.ph==='desk')renderDesktop();});
  renderDesktop();

  // Cleaner Stage Manager with live mini window content, short subnames, and a 3-item fold.
  let stageExpanded=false;
  function previewMarkup(w){
    const clone=w.cloneNode(true);clone.classList.remove('min','gone','stage-hidden','mcw','drag','is-fullscreen');clone.classList.add('stage-window-preview');clone.removeAttribute('id');
    clone.querySelectorAll('.h').forEach(x=>x.remove());clone.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));
    clone.querySelectorAll('iframe').forEach(frame=>{const box=document.createElement('div');box.style.cssText='padding:8px;color:#647084;font-size:9px;background:linear-gradient(135deg,#e7eef7,#f9fbff);width:100%;height:100%;display:flex;align-items:center;justify-content:center';box.textContent='Web page preview';frame.replaceWith(box)});
    clone.querySelectorAll('input,textarea,button,select').forEach(x=>{x.disabled=true;x.removeAttribute('autofocus')});clone.querySelectorAll('*').forEach(x=>{x.style.pointerEvents='none'});
    const ww=Math.max(260,w.offsetWidth||620),hh=Math.max(160,w.offsetHeight||440),scale=Math.min(174/ww,76/hh);
    Object.assign(clone.style,{position:'absolute',left:Math.max(0,(174-ww*scale)/2)+'px',top:Math.max(0,(76-hh*scale)/2)+'px',width:ww+'px',height:hh+'px',minWidth:'0',minHeight:'0',transform:`scale(${scale})`,transformOrigin:'top left',opacity:'1',zIndex:'1',transition:'none'});
    return clone.outerHTML;
  }
  function stageSubname(id,title){
    const clean=String(title||'').replace(/^Navigator\s*[—-]\s*/,'').trim();
    if(clean&&clean!==APPS[id]?.n)return clean;
    if(id==='finder')return 'Desktop & documents';if(id==='settings')return 'System preferences';if(id==='safari'||id.startsWith('navigator_window_'))return 'Tabbed browsing';if(id==='textedit')return 'Document editor';if(id==='store')return 'App catalogue';return 'App window';
  }
  renderStageRail=function(active){
    if(!stageOn)return;let rail=$('#stage-rail');if(!rail){$('#desk').insertAdjacentHTML('beforeend','<div id="stage-rail"></div>');rail=$('#stage-rail');}
    const wins=Object.values(W).filter(w=>!w.classList.contains('gone')).sort((a,b)=>(+b.style.zIndex||0)-(+a.style.zIndex||0));
    const visible=stageExpanded?wins:wins.slice(0,3);
    rail.innerHTML=visible.map(w=>{
      const id=w.dataset.id,base=id.startsWith('navigator_window_')?'safari':id,a=APPS[id]||APPS[base],title=$('.tb span',w)?.textContent||a?.n||id,sub=stageSubname(base,title);
      return `<div class="stage-card ${active===id||(!active&&w===topWin())?'active':''}" data-stage-id="${txt(id)}" title="${txt(title)}" role="button" tabindex="0"><div class="stage-preview">${previewMarkup(w)}</div><span class="stage-card-label">${txt(title)}</span><span class="stage-card-subname">${txt(sub)}</span></div>`;
    }).join('')+(wins.length>3?`<button class="stage-more" id="stage-expand" title="${stageExpanded?'Show fewer apps':'View more apps'}" aria-label="${stageExpanded?'Show fewer apps':'View more apps'}">${stageExpanded?'⌃':'⌄'}</button>`:'')||'<span class="stage-empty">No open windows</span>';
    $$('[data-stage-id]',rail).forEach(btn=>{btn.onclick=()=>stageFocus(btn.dataset.stageId);btn.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();stageFocus(btn.dataset.stageId)}}});
    $('#stage-expand',rail)?.addEventListener('click',()=>{stageExpanded=!stageExpanded;renderStageRail(active)});
  };
  const toggleStageV2=toggleStage;
  toggleStage=function(){const old=stageOn;toggleStageV2();stageExpanded=false;if(stageOn)renderStageRail(topWin()?.dataset.id);syncCC()};
  const stageFocusV2=stageFocus;
  stageFocus=function(id){stageFocusV2(id);renderStageRail(id)};
  const openAppV2Base=openApp;
  // More than one Navigator window can be open at once.
  let navigatorWindowCount=1;
  function newNavigatorWindow(){
    navigatorWindowCount++;const id='navigator_window_'+navigatorWindowCount,base=APPS.safari;
    APPS[id]={...base,n:'Navigator '+navigatorWindowCount,__transient:true};GL[id]=GL.safari;
    openApp(id);
  }

  // Navigator: tabs, history, configurable search provider, settings and separate windows.
  function navigatorRenderer(b,w){
    let engine='google',homeUrl='https://www.google.com/',tabs=[newTab()],active=0;
    try{engine=localStorage.getItem('blyns_nav_engine')||engine;homeUrl=localStorage.getItem('blyns_nav_home')||homeUrl}catch(e){}
    function newTab(){return {title:'New Tab',url:'',history:[],index:-1};}
    H(b,`<div class="navigator-app"><div class="nav-tabs" id="nav-tabs"></div><div class="nav-toolbar"><button id="nav-back" title="Back">‹</button><button id="nav-forward" title="Forward">›</button><button id="nav-reload" title="Reload">⟳</button><input id="nav-address" placeholder="Search or enter a website"><button id="nav-go">Go</button><button id="nav-settings-toggle" title="Browser settings">⚙</button></div><div class="nav-settings" id="nav-settings"><label>Search engine<select id="nav-engine"><option value="google">Google</option><option value="bing">Bing</option><option value="duckduckgo">DuckDuckGo</option></select></label><label>Home page<input id="nav-home" type="url" value="${txt(homeUrl)}"></label><p style="font-size:10px;color:#858d98;margin-top:6px">Websites may block iframe embedding. Open in a new browser tab/window using the external-link action in the page view.</p><button id="nav-save-settings" class="settings-link" style="margin-top:8px">Save browser settings</button></div><div class="nav-page" id="nav-page"></div></div>`);
    const tabsEl=$('#nav-tabs',b),page=$('#nav-page',b),address=$('#nav-address',b),settings=$('#nav-settings',b);
    const tab=()=>tabs[active];
    const searchUrl=q=>engine==='bing'?'https://www.bing.com/search?q='+encodeURIComponent(q):engine==='duckduckgo'?'https://duckduckgo.com/?q='+encodeURIComponent(q):'https://www.google.com/search?igu=1&q='+encodeURIComponent(q);
    const makeUrl=q=>{q=String(q||'').trim();if(!q)return '';if(/^https?:\/\//i.test(q))return q;if(/^[\w.-]+\.[a-z]{2,}(:\d+)?(\/.*)?$/i.test(q))return 'https://'+q;return searchUrl(q)};
    function drawTabs(){
      tabsEl.innerHTML=tabs.map((t,i)=>`<button class="nav-tab ${i===active?'active':''}" data-tab="${i}"><span>${txt(t.title||'New Tab')}</span><span class="nav-tab-close" data-close-tab="${i}" title="Close tab">×</span></button>`).join('')+`<button class="nav-tab-action" id="nav-add-tab" title="New tab">＋</button><button class="nav-tab-action" id="nav-new-window" title="New Navigator window">▢</button>`;
      $$('[data-tab]',tabsEl).forEach(btn=>btn.onclick=e=>{if(e.target.closest('[data-close-tab]'))return;active=+btn.dataset.tab;drawTabs();renderCurrent()});
      $$('[data-close-tab]',tabsEl).forEach(btn=>btn.onclick=e=>{e.stopPropagation();closeTab(+btn.dataset.closeTab)});
      $('#nav-add-tab',tabsEl).onclick=()=>addTab();$('#nav-new-window',tabsEl).onclick=()=>newNavigatorWindow();
    }
    function addTab(url){tabs.push(newTab());active=tabs.length-1;drawTabs();if(url)visit(url);else home();}
    function closeTab(i){if(tabs.length===1){tabs[0]=newTab();active=0;drawTabs();home();return;}tabs.splice(i,1);active=Math.min(active,tabs.length-1);drawTabs();renderCurrent();}
    function home(){const t=tab();t.url='';t.title='New Tab';address.value='';page.innerHTML=`<div class="nav-home"><h2>Welcome to Navigator</h2><p>Your browser workspace. Open a new tab or search the web from the address bar.</p><div class="nav-home-grid"><button data-url="${homeUrl}"><span>⌂</span><span><b>Home</b><small>Configured start page</small></span></button><button data-url="https://www.google.com/search?igu=1"><span>G</span><span><b>Google Search</b><small>Search the web</small></span></button><button data-url="https://sites.google.com/"><span>S</span><span><b>Google Sites</b><small>Sites and pages</small></span></button><button data-url="https://wikipedia.org"><span>W</span><span><b>Wikipedia</b><small>Reference library</small></span></button><button data-url="https://developer.mozilla.org"><span>M</span><span><b>MDN</b><small>Web documentation</small></span></button><button id="nav-home-external"><span>↗</span><span><b>Open home externally</b><small>New browser tab</small></span></button></div><p>Some destinations set security headers that prevent iframe embedding. Navigator cannot override those site policies.</p></div>`;
      $$('[data-url]',page).forEach(x=>x.onclick=()=>visit(x.dataset.url));$('#nav-home-external',page).onclick=()=>window.open(homeUrl,'_blank','noopener');drawTabs();
    }
    function visit(q,push=true){const url=makeUrl(q);if(!url)return;const t=tab();t.url=url;t.title=url.replace(/^https?:\/\//,'').split('/')[0].slice(0,24)||'Web page';if(push){t.history=t.history.slice(0,t.index+1);t.history.push(url);t.index++;}address.value=url;drawTabs();page.innerHTML='<div class="spl" style="color:#666"><div class="sp"></div>Loading page…</div>';setTimeout(()=>{if(!page.isConnected||tabs[active]!==t)return;const frame=document.createElement('iframe');frame.title='Navigator web page';frame.src=url;frame.referrerPolicy='strict-origin-when-cross-origin';frame.allow='fullscreen; clipboard-read; clipboard-write';frame.allowFullscreen=true;page.replaceChildren(frame);const external=document.createElement('button');external.textContent='↗ Open externally';external.style.cssText='position:absolute;right:12px;top:12px;z-index:2;border:1px solid #ccd3df;background:#ffffffdf;border-radius:9px;padding:7px 10px;color:#243044;cursor:pointer';external.onclick=()=>window.open(url,'_blank','noopener');page.appendChild(external);},90);
    }
    function renderCurrent(){if(tab().url){address.value=tab().url;visit(tab().url,false)}else home();}
    $('#nav-go',b).onclick=()=>visit(address.value);address.onkeydown=e=>{if(e.key==='Enter')visit(address.value)};
    $('#nav-back',b).onclick=()=>{const t=tab();if(t.index>0){t.index--;visit(t.history[t.index],false)}else home()};
    $('#nav-forward',b).onclick=()=>{const t=tab();if(t.index<t.history.length-1){t.index++;visit(t.history[t.index],false)}};
    $('#nav-reload',b).onclick=()=>{if(tab().url)visit(tab().url,false);else home()};
    $('#nav-settings-toggle',b).onclick=()=>settings.classList.toggle('on');
    $('#nav-engine',b).value=engine;$('#nav-home',b).value=homeUrl;
    $('#nav-save-settings',b).onclick=()=>{engine=$('#nav-engine',b).value;homeUrl=$('#nav-home',b).value.trim()||'https://www.google.com/';try{localStorage.setItem('blyns_nav_engine',engine);localStorage.setItem('blyns_nav_home',homeUrl)}catch(e){}settings.classList.remove('on');toast('Navigator settings saved')};
    w.__blynsEsc=()=>{if(tabs.length>1){closeTab(active);return true;}return false;};
    drawTabs();home();
  }
  APPS.safari.n='Navigator';APPS.safari.r=navigatorRenderer;
  Object.keys(APPS).filter(id=>id.startsWith('navigator_window_')).forEach(id=>{APPS[id].r=navigatorRenderer});

  // Expand everyday apps with persistent local workflows rather than static mock screens.
  APPS.calendar.r=function(b){
    let month=new Date(new Date().getFullYear(),new Date().getMonth(),1),selected=new Date();
    const key=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
    const load=()=>{try{return JSON.parse(localStorage.getItem('blyns_daybook_events')||'{}')}catch(e){return {}}};
    let events=load();
    H(b,`<div class="bar"><button id="day-prev">‹</button><button id="day-today">Today</button><button id="day-next">›</button><b id="day-month" style="margin-left:8px;color:#303744"></b><button id="day-add" style="margin-left:auto">＋ Event</button></div><div class="main" style="padding:12px"><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;font-size:11px;color:#7b8491;margin-bottom:6px">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(x=>`<b>${x}</b>`).join('')}</div><div id="day-grid" style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px"></div><div style="margin-top:14px;padding-top:12px;border-top:1px solid #e4e7ec"><b id="day-selected" style="font-size:13px"></b><div id="day-events" style="margin-top:8px"></div><div style="display:flex;gap:7px;margin-top:9px"><input id="day-new-event" placeholder="Add an event for this date" style="flex:1;min-width:0;padding:8px 10px;border:1px solid #d5dae2;border-radius:8px;background:#fff;color:#222"><button id="day-save-event" class="settings-link">Add</button></div></div></div>`);
    const save=()=>{try{localStorage.setItem('blyns_daybook_events',JSON.stringify(events))}catch(e){}};
    function draw(){
      $('#day-month',b).textContent=month.toLocaleDateString([],{month:'long',year:'numeric'});
      const start=month.getDay(),days=new Date(month.getFullYear(),month.getMonth()+1,0).getDate(),today=key(new Date());let cells='';
      for(let i=0;i<start;i++)cells+='<span></span>';
      for(let day=1;day<=days;day++){const d=new Date(month.getFullYear(),month.getMonth(),day),k=key(d),has=(events[k]||[]).length>0;cells+=`<button data-day="${k}" style="position:relative;min-height:37px;border:1px solid ${k===key(selected)?'var(--accent)':'#e5e8ee'};border-radius:8px;background:${k===today?'#e7f1ff':'#ffffffb8'};color:#2b3340;font-size:12px;cursor:pointer;${k===key(selected)?'box-shadow:0 0 0 2px #0a84ff22':''}">${day}${has?'<i style="display:block;width:4px;height:4px;margin:2px auto 0;border-radius:50%;background:#0a84ff"></i>':''}</button>`;}
      $('#day-grid',b).innerHTML=cells;$$('[data-day]',b).forEach(x=>x.onclick=()=>{selected=new Date(x.dataset.day+'T12:00:00');drawEvents();draw()});drawEvents();
    }
    function drawEvents(){const k=key(selected),list=events[k]||[];$('#day-selected',b).textContent=selected.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric',year:'numeric'});$('#day-events',b).innerHTML=list.map((ev,i)=>`<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #eceef2;font-size:12px"><span style="width:7px;height:7px;border-radius:50%;background:var(--accent)"></span><span style="flex:1">${txt(ev)}</span><button data-event-remove="${i}" style="border:0;background:transparent;color:#a1a7b1;cursor:pointer">×</button></div>`).join('')||'<p style="font-size:11px;color:#9299a4">No events for this day.</p>';
      $$('[data-event-remove]',b).forEach(x=>x.onclick=()=>{list.splice(+x.dataset.eventRemove,1);if(!list.length)delete events[k];save();draw()});
    }
    $('#day-prev',b).onclick=()=>{month=new Date(month.getFullYear(),month.getMonth()-1,1);draw()};$('#day-next',b).onclick=()=>{month=new Date(month.getFullYear(),month.getMonth()+1,1);draw()};$('#day-today',b).onclick=()=>{month=new Date(new Date().getFullYear(),new Date().getMonth(),1);selected=new Date();draw()};
    const add=()=>{const value=$('#day-new-event',b).value.trim();if(!value)return;const k=key(selected);(events[k]||(events[k]=[])).push(value);$('#day-new-event',b).value='';save();draw()};$('#day-save-event',b).onclick=add;$('#day-new-event',b).onkeydown=e=>{if(e.key==='Enter')add()};$('#day-add',b).onclick=()=>$('#day-new-event',b).focus();draw();
  };
  APPS.reminders.r=function(b){
    let tasks=[];try{tasks=JSON.parse(localStorage.getItem('blyns_tasks')||'[]')}catch(e){}
    H(b,`<div class="bar"><b>My Tasks</b><span style="margin-left:auto;font-size:11px;color:#858d99" id="tasks-count"></span></div><div class="main"><form id="tasks-form" style="display:flex;gap:7px;margin-bottom:12px"><input id="tasks-input" placeholder="Add a task" style="flex:1;min-width:0;padding:9px 11px;border:1px solid #d7dce4;border-radius:9px;background:#fff;color:#222"><button class="settings-link">Add</button></form><div id="tasks-list"></div><button id="tasks-clear" class="settings-link" style="margin-top:13px">Clear completed</button></div>`);
    const save=()=>{try{localStorage.setItem('blyns_tasks',JSON.stringify(tasks))}catch(e){}};
    const draw=()=>{$('#tasks-count',b).textContent=tasks.filter(x=>!x.done).length+' remaining';$('#tasks-list',b).innerHTML=tasks.map((t,i)=>`<div style="display:flex;align-items:center;gap:9px;padding:10px 2px;border-bottom:1px solid #e8ebf0;font-size:13px"><input type="checkbox" data-task-check="${i}" ${t.done?'checked':''} style="accent-color:var(--accent)"><span style="flex:1;${t.done?'text-decoration:line-through;color:#999':''}">${txt(t.text)}</span><button data-task-remove="${i}" style="border:0;background:transparent;color:#9aa1ac;cursor:pointer">×</button></div>`).join('')||'<p style="padding:14px;color:#9299a4;font-size:12px">No tasks yet. Add your first task above.</p>';
      $$('[data-task-check]',b).forEach(x=>x.onchange=()=>{tasks[+x.dataset.taskCheck].done=x.checked;save();draw()});$$('[data-task-remove]',b).forEach(x=>x.onclick=()=>{tasks.splice(+x.dataset.taskRemove,1);save();draw()});};
    $('#tasks-form',b).onsubmit=e=>{e.preventDefault();const v=$('#tasks-input',b).value.trim();if(!v)return;tasks.push({text:v,done:false});$('#tasks-input',b).value='';save();draw()};$('#tasks-clear',b).onclick=()=>{tasks=tasks.filter(x=>!x.done);save();draw()};draw();
  };
  APPS.maps.r=function(b){
    H(b,`<div class="bar"><input id="atlas-search" placeholder="Search a place or address" style="flex:1;min-width:0;padding:8px 10px;border:1px solid #d7dce4;border-radius:8px;background:#fff;color:#222"><button id="atlas-go">Search</button><button id="atlas-external">↗</button></div><div id="atlas-map" style="flex:1;min-height:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(145deg,#e6eee3,#c8d8d0);color:#56665c;text-align:center;padding:22px"><div><div style="font-size:34px">⌖</div><b>Atlas</b><p style="font-size:11px;margin-top:7px">Search for a place to load a map view.</p></div></div>`);
    const input=$('#atlas-search',b),area=$('#atlas-map',b);let current='';const go=()=>{const q=input.value.trim();if(!q)return;current='https://www.google.com/maps?q='+encodeURIComponent(q)+'&output=embed';area.innerHTML='<div class="spl" style="color:#687384"><div class="sp"></div>Loading map…</div>';setTimeout(()=>{if(!area.isConnected)return;const f=document.createElement('iframe');f.src=current;f.title='Atlas map';f.style.cssText='width:100%;height:100%;min-height:260px;border:0;background:#fff';area.replaceChildren(f)},80)};
    $('#atlas-go',b).onclick=go;input.onkeydown=e=>{if(e.key==='Enter')go()};$('#atlas-external',b).onclick=()=>{if(current)window.open(current.replace('&output=embed',''),'_blank','noopener');else toast('Search for a place first')};
  };
  APPS.photos.r=function(b){
    const images=Object.entries(FS).flatMap(([folder,list])=>(list||[]).map(f=>({...f,folder}))).filter(f=>f.t==='img');
    H(b,`<div class="bar"><b>Gallery</b><span style="margin-left:auto;font-size:11px;color:#87909d">${images.length} image file(s)</span><button id="gallery-files">Open Files</button></div><div class="main" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));align-content:start;gap:10px">${images.map((f,i)=>`<button data-gallery-image="${i}" style="padding:7px;border:1px solid #e2e7ee;border-radius:11px;background:#fff;color:#303744;cursor:pointer;text-align:left"><span style="display:block;height:86px;border-radius:7px;background:${/^[#a-zA-Z0-9(),.%\s-]+$/.test(f.c||'')?f.c:'linear-gradient(145deg,#91a8d0,#d69bb8)'}"></span><b style="display:block;font-size:11px;margin-top:7px;overflow:hidden;text-overflow:ellipsis">${txt(f.n)}</b><small style="color:#8b929e;font-size:9px">${txt(f.folder)}</small></button>`).join('')||'<div style="grid-column:1/-1;padding:28px;text-align:center;color:#8a929f"><div style="font-size:30px">▧</div><b style="display:block;margin-top:9px">Your gallery is empty</b><p style="font-size:11px;margin-top:6px">Add image files in Files to see them here.</p></div>'}</div>`);
    $('#gallery-files',b).onclick=()=>openApp('finder');$$('[data-gallery-image]',b).forEach(x=>x.onclick=()=>openFile(images[+x.dataset.galleryImage]));
  };
  APPS.messages.r=function(b){
    let history=[];try{history=JSON.parse(localStorage.getItem('blyns_chat_history')||'[]')}catch(e){}
    H(b,`<div class="chat" style="flex:1;display:flex;flex-direction:column;min-height:0"><div style="padding:9px;text-align:center;background:#f0f2f6;color:#7b8491;font-size:11px">Local message log · saved in this browser; not delivered externally</div><div id="chatline-log" style="flex:1;min-height:0;overflow:auto;padding:12px"></div><form id="chatline-form" style="display:flex;gap:7px;padding:8px;border-top:1px solid #e4e7ed"><input id="chatline-input" placeholder="Write a message…" style="flex:1;min-width:0;border:1px solid #d7dce4;border-radius:18px;padding:9px 13px;background:#fff;color:#222"><button class="settings-link">Save</button></form></div>`);
    const log=$('#chatline-log',b),save=()=>{try{localStorage.setItem('blyns_chat_history',JSON.stringify(history))}catch(e){}};
    const draw=()=>{log.innerHTML=history.map(m=>`<div class="msg ${m.from==='me'?'me':'bot'}">${txt(m.text)}</div>`).join('')||'<p style="font-size:11px;color:#9299a4;text-align:center">Start a conversation.</p>';log.scrollTop=log.scrollHeight};
    $('#chatline-form',b).onsubmit=e=>{e.preventDefault();const q=$('#chatline-input',b).value.trim();if(!q)return;history.push({from:'me',text:q});$('#chatline-input',b).value='';save();draw()};draw();
  };
  APPS.mail.r=function(b){
    let drafts=[];try{drafts=JSON.parse(localStorage.getItem('blyns_mail_drafts')||'[]')}catch(e){}
    const samples=[];
    H(b,`<div class="bar"><button id="inbox-new">＋ Compose</button><input id="inbox-search" placeholder="Search messages" style="margin-left:auto;max-width:190px"></div><div class="row"><div class="side" id="inbox-list" style="width:175px"></div><div class="main" id="inbox-read"><h3>Inbox</h3><p style="color:#8b929e;margin-top:6px;font-size:12px">Select a message or create a local draft.</p></div></div>`);
    const list=$('#inbox-list',b),read=$('#inbox-read',b);function draw(){list.innerHTML=(samples.length?samples.map((m,i)=>`<div class="ml" data-inbox="${i}"><b>${m[0]}</b><div style="margin-top:3px">${m[1]}</div></div>`).join(''):'<p style="padding:12px;color:#8b929e;font-size:11px">No mail account is connected. You can create and save local drafts here.</p>')+drafts.map((d,i)=>`<div class="ml" data-draft="${i}"><b>Draft</b><div>${txt(d.subject||'(No subject)')}</div></div>`).join('');$$('[data-inbox]',list).forEach(x=>x.onclick=()=>{const m=samples[+x.dataset.inbox];read.innerHTML=`<h3>${m[1]}</h3><p style="color:#858d97;font-size:11px;margin:8px 0 16px">From ${m[0]}</p><p>${m[2]}</p>`});$$('[data-draft]',list).forEach(x=>x.onclick=()=>showDraft(+x.dataset.draft));}
    function compose(){read.innerHTML=`<h3>New Draft</h3><label style="display:block;margin-top:12px;font-size:11px">To<input id="draft-to" style="display:block;width:100%;padding:8px;margin-top:4px;border:1px solid #d7dce4;border-radius:7px;color:#222;background:#fff"></label><label style="display:block;margin-top:9px;font-size:11px">Subject<input id="draft-subject" style="display:block;width:100%;padding:8px;margin-top:4px;border:1px solid #d7dce4;border-radius:7px;color:#222;background:#fff"></label><textarea id="draft-body" placeholder="Write your message…" style="width:100%;height:150px;margin-top:10px;padding:10px;border:1px solid #d7dce4;border-radius:8px;color:#222;background:#fff"></textarea><button id="draft-save" class="settings-link" style="margin-top:9px">Save draft</button><p style="font-size:10px;color:#8b929e;margin-top:8px">Drafts are stored locally. Sending email requires a connected mail service.</p>`;$('#draft-save',read).onclick=()=>{drafts.push({to:$('#draft-to',read).value,subject:$('#draft-subject',read).value,body:$('#draft-body',read).value});try{localStorage.setItem('blyns_mail_drafts',JSON.stringify(drafts))}catch(e){}draw();toast('Draft saved')};}
    function showDraft(i){const d=drafts[i];compose();$('#draft-to',read).value=d.to||'';$('#draft-subject',read).value=d.subject||'';$('#draft-body',read).value=d.body||'';}
    $('#inbox-new',b).onclick=compose;$('#inbox-search',b).oninput=e=>$$('.ml',list).forEach(x=>x.style.display=x.textContent.toLowerCase().includes(e.target.value.toLowerCase())?'':'none');draw();
  };

  // Functional account management and a new complete settings centre.
  APPS.settings.r=function(b){
    let page='General';
    H(b,'<div class="row"><div class="side settings-nav" id="settings-nav"></div><div class="main settings-panel" id="settings-page"></div></div>');
    const nav=$('#settings-nav',b),main=$('#settings-page',b);
    const pages=['General','Software Update','Appearance','Desktop & Dock','Dock Apps','Control Center','Sound','Keyboard','Privacy','Accounts','Storage','About','Erase All Content'];
    const row=(label,desc,to,btn='View')=>`<div class="settings-row"><div><b>${label}</b><small>${desc}</small></div><button class="settings-link" data-go="${to}">${btn}</button></div>`;
    const prefToggle=(label,desc,key)=>`<div class="settings-row"><div><b>${label}</b><small>${desc}</small></div><input class="settings-switch" type="checkbox" data-pref="${key}" ${prefs273[key]?'checked':''}></div>`;
    const releaseNotes=`
      <h3>New in BlynsOS 1.0 Stabilized</h3>
      <ul style="padding-left:19px;margin:8px 0 18px">
        <li>Combined the Major Update 2.0 desktop experience with the Setup Assistant design.</li>
        <li>Added a ten-stage first-run setup for region, language, account, theme, wallpaper, accent colour and avatar.</li>
        <li>Added PBKDF2-SHA-256 password hashing with a unique random salt for each account.</li>
        <li>Added a replaceable PNG icon system and a local wallpaper catalogue.</li>
        <li>Reintroduced Blyns Store with separate Apps and Wallpapers sections and local installation state.</li>
        <li>Separated Core, Systems, Apps and Assets into independent project folders.</li>
      </ul>
      <h3>Desktop and system features</h3>
      <ul style="padding-left:19px;margin:8px 0 18px">
        <li>Retains Files, Navigator, Blyns Assistant, Atlas, Gallery, Daybook, Jotter, Tasks, Soundwave, World Clock, Math Desk, Console and Blyns Settings.</li>
        <li>Retains window management, Dock, App Library, Spotlight, Control Center, Stage Manager and desktop shortcuts.</li>
        <li>Chatline keeps a local message log and Inbox keeps local drafts; neither claims to send or receive external messages without a connected service. Settings include Appearance, wallpaper, accent colour, Dock preferences, accounts, storage and reset options.</li>
      </ul>
      <p style="font-size:11px;color:#777;margin-top:14px">BlynsOS 1.0 Stabilized · Your account, apps and personal settings are stored in this browser profile.</p>`;
    const draw=()=>{
      nav.innerHTML=pages.map(x=>`<div data-page="${x}" class="${x===page?'a':''}">${x}</div>`).join('');let html='';
      if(page==='General')html=`<h2>General</h2><p>System identity and update settings.</p>${row('Software Update',V2,'Software Update','View')}${row('Storage','Local browser data and file overview','Storage')}${row('Accounts','Manage your profile and sign-in details','Accounts')}${row('Control Center','Quick system controls','Control Center')}`;
      if(page==='Software Update')html=`<h2>Software Update</h2><p>${V2} is installed.</p><div class="app-hero" style="margin:18px 0;text-align:center"><img src="${WORDMARK}" alt="BlynsOS" style="display:block;width:min(230px,85%);height:78px;object-fit:contain;margin:0 auto 12px"><h3>${V2}</h3><p style="font-size:12px;margin-top:5px">Version 1.0 · Major Update</p><span style="display:inline-block;margin-top:12px;padding:5px 10px;border-radius:20px;background:#d9f4e4;color:#187a42;font-size:11px">Installed</span></div>${row('Update Details','Full additions, removed features, fixes and rebrands','Update Details','View Details')}`;
      if(page==='Update Details')html=`<h2>${V2}</h2><p>Complete release notes for this build.</p><div class="v2-section" style="margin-top:16px;color:inherit;line-height:1.65;font-size:12px">${releaseNotes}</div><button class="settings-link" data-go="Software Update" style="margin-top:12px">Back to Software Update</button>`;
      if(page==='Appearance')html=`<h2>Appearance</h2><p>Choose your colour mode, accent and desktop background.</p><div class="settings-row"><div><b>Appearance</b><small>Light or dark appearance across BlynsOS.</small></div><div class="settings-choice" style="margin:0"><button data-dark="0" class="${!prefs273.dark?'active':''}">Light</button><button data-dark="1" class="${prefs273.dark?'active':''}">Dark</button></div></div><h3 style="margin:17px 0 6px;font-size:14px">Accent colour</h3><div class="settings-choice">${[['#70a7ff','Blue'],['#b49aff','Purple'],['#65c9bb','Teal'],['#f0a45e','Orange'],['#f18bb4','Pink'],['#5dc3a5','Mint'],['#e0a2e8','Lilac']].map(([c,n])=>`<button data-accent="${c}" class="${prefs273.accent===c?'active':''}"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${c};margin-right:5px"></span>${n}</button>`).join('')}</div><h3 style="margin:17px 0 7px;font-size:14px">Wallpaper</h3><div class="settings-choice">${wallpaperOptions.map(([id,n,g])=>`<button class="v2-wallpaper-choice ${prefs273.wallpaper===id?'active':''}" data-wall="${id}"><span class="v2-wallpaper-preview" style="display:block;background:${g}"></span>${n}</button>`).join('')}</div><div style="margin-top:18px"><label style="display:flex;justify-content:space-between;font-size:12px"><b>Glass intensity</b><span id="glass-val">${prefs273.glass}%</span></label><input id="glass-range" type="range" min="15" max="100" value="${prefs273.glass}" style="width:100%;accent-color:var(--accent);margin-top:8px"></div><div style="margin-top:14px">${prefToggle('Reduce Motion','Reduce window, Dock and interface transitions','reduceMotion')}</div>`;
      if(page==='Desktop & Dock')html=`<h2>Desktop & Dock</h2><p>Manage the desktop workspace and Dock behaviour.</p>${prefToggle('Automatically hide Dock','Hide Dock while app windows are open','dockAutoHide')}${prefToggle('Automatically hide Stage Manager','Hide the preview rail until the pointer reaches the left edge','stageAutoHide')}<div style="margin-top:17px"><label style="display:flex;justify-content:space-between;font-size:12px"><b>Dock icon size</b><span id="dock-size-value">${Math.round(prefs273.dockSize*46)} px</span></label><input id="dock-size-range" type="range" min="0.72" max="1.45" step="0.05" value="${prefs273.dockSize}" style="width:100%;accent-color:var(--accent);margin-top:8px"></div><div class="settings-row" style="margin-top:14px"><div><b>Desktop shortcuts</b><small>${desktopApps.length} app shortcuts on the desktop. Right-click the desktop to add or remove them.</small></div><button class="settings-link" id="desktop-shortcuts">Manage</button></div>`;
      if(page==='Dock Apps')html=`<h2>Dock Apps</h2><p>Choose installed apps to keep pinned in the Dock.</p><div class="settings-apps-list">${Object.keys(APPS).filter(id=>id!=='launchpad'&&!APPS[id].__transient&&isBlynsInstalled(id)).map(id=>`<label class="settings-app-row"><u>${ico(id)}</u><span>${txt(APPS[id].n)}</span><input type="checkbox" data-pin="${id}" ${PIN.includes(id)?'checked':''} ${['finder','settings'].includes(id)?'disabled':''}></label>`).join('')}</div>`;
      if(page==='Control Center')html=`<h2>Control Center</h2><p>Manage the BlynsOS interface and quick system controls.</p>${prefToggle('Focus mode','Suppress toast notifications while enabled','focusMode')}${prefToggle('Reduce Motion','Reduce interface animations','reduceMotion')}${prefToggle('Automatically hide Dock','Hide the Dock when windows are open','dockAutoHide')}<div class="settings-row"><div><b>Stage Manager</b><small>${stageOn?'Currently on':'Currently off'} · Preview open windows</small></div><button class="settings-link" id="stage-settings">${stageOn?'Turn Off':'Turn On'}</button></div><div class="settings-row"><div><b>Brightness</b><small>Adjust display brightness</small></div><input id="settings-brightness" type="range" min="55" max="120" value="${brightness}" style="max-width:130px"></div>`;
      if(page==='Sound')html=`<h2>Sound</h2><p>Adjust BlynsOS interface and sample-app audio.</p><div class="cc-v2-slider" style="margin-top:16px"><label><span>Output volume</span><span id="set-vol-label">${Math.round(S.vol/8*100)}%</span></label><input id="set-vol" type="range" min="0" max="8" value="${S.vol}" style="width:100%"></div><div class="settings-row" style="margin-top:14px"><div><b>Startup sound</b><small>Browser-generated startup chime</small></div><span style="font-size:11px;color:#888">Available</span></div>`;
      if(page==='Keyboard')html=`<h2>Keyboard Shortcuts</h2><p>Shortcuts are active on the desktop when a text field is not focused.</p>${[['F','Open Files'],['Ctrl + S','Open Spotlight Search'],['C','Open Control Center'],['Esc','Dismiss overlay or close active app'],['M','Mission Control'],['S','Stage Manager'],['W','Snap active window'],['Q','Minimize or restore active window'],['R','Force quit active app'],['L','App Library'],['0','Power on from black screen']].map(([key,desc])=>`<div class="settings-row"><b style="font-size:12px;min-width:80px">${key}</b><small>${desc}</small></div>`).join('')}`;
      if(page==='Privacy')html=`<h2>Privacy</h2><p>Manage local account data and browser permissions.</p><div class="settings-row"><div><b>Account and preferences</b><small>Saved in this browser's local storage; they do not create a device-level account.</small></div><span style="font-size:11px;color:#828a96">Local</span></div><div class="settings-row"><div><b>Navigator websites</b><small>Websites can restrict iframe embedding and external access.</small></div><span style="font-size:11px;color:#828a96">Browser policy</span></div><div class="settings-row"><div><b>Physical device controls</b><small>System preferences are saved to this browser profile.</small></div><span style="font-size:11px;color:#828a96">Not connected</span></div>`;
      if(page==='Accounts')html=`<h2>Account Management</h2><p>Update your local BlynsOS profile and lock-screen appearance.</p><div class="v2-section" style="display:flex;align-items:center;gap:14px"><div class="v2-profile-avatar" id="v2-profile-preview" style="background:${avatarColor}">${avatarGlyph==='initial'?txt((S.name||'B').slice(0,1).toUpperCase()):txt(avatarGlyph)}</div><div><b>${txt(S.name||'User')}</b><small style="display:block;color:#808894;margin-top:3px">Local administrator account</small></div></div><label style="display:block;margin-top:15px;font-size:12px;font-weight:650">Account name<input id="account-name" value="${txt(S.name)}" maxlength="28" style="display:block;width:100%;margin-top:6px;padding:9px;border:1px solid #d5dbe4;border-radius:9px;background:#fff;color:#222"></label><label style="display:block;margin-top:12px;font-size:12px;font-weight:650">New password <span style="font-weight:400;color:#858c97">(leave blank to keep current)</span><input id="account-password" type="password" placeholder="Enter a new password" style="display:block;width:100%;margin-top:6px;padding:9px;border:1px solid #d5dbe4;border-radius:9px;background:#fff;color:#222"></label><div style="display:flex;align-items:center;gap:12px;margin-top:14px"><label style="font-size:12px;font-weight:650">Avatar colour</label><input id="account-avatar-color" type="color" value="${avatarColor}" style="width:50px;height:36px;padding:2px;border:1px solid #ccd3de;border-radius:8px"></div><label style="display:block;margin-top:12px;font-size:12px;font-weight:650">Avatar symbol<select id="account-avatar-glyph" style="display:block;width:100%;margin-top:6px;padding:9px;border:1px solid #d5dbe4;border-radius:9px;background:#fff;color:#222"><option value="initial">Account initial</option><option value="🙂">🙂 Smile</option><option value="🌟">🌟 Star</option><option value="🌙">🌙 Moon</option><option value="💎">💎 Gem</option><option value="🌿">🌿 Leaf</option><option value="🚀">🚀 Rocket</option></select></label><button id="account-save" class="settings-link" style="margin-top:16px">Save account changes</button><button id="account-lock" class="settings-link" style="margin:10px 0 0">Lock screen / log out</button><p style="font-size:10px;color:#858c97;margin-top:12px">Your password is stored as a salted PBKDF2 hash in this browser profile.</p>`;
      if(page==='Storage')html=`<h2>Storage</h2><p>Files and app information kept in this browser.</p><div class="settings-row"><div><b>Desktop files</b><small>${FS.Desktop.length} item(s)</small></div></div><div class="settings-row"><div><b>Documents</b><small>${FS.Documents.length} item(s)</small></div></div><div class="settings-row"><div><b>Downloads</b><small>${FS.Downloads.length} item(s)</small></div></div><div class="settings-row"><div><b>Installed Store apps</b><small>${installed.length} installed extra app(s)</small></div></div>`;
      if(page==='About')html=`<h2>About BlynsOS</h2><div class="app-hero" style="margin-top:16px;text-align:center"><img src="${WORDMARK}" alt="BlynsOS" style="width:min(210px,80%);height:70px;object-fit:contain"><h3 style="margin-top:8px">Version 1.0</h3><p style="margin-top:6px">Stabilized Release</p></div><p style="margin-top:14px;color:#777">BlynsOS brings your apps, files and personal settings together in one desktop workspace.</p>`;
      if(page==='Erase All Content')html=`<h2>Erase All Content and Settings</h2><p>This resets BlynsOS to its first-run defaults.</p><div class="v2-section"><b>This will remove</b><ul style="padding:10px 0 0 19px;line-height:1.8;font-size:12px"><li>Account name, password and avatar</li><li>Desktop files, documents, downloads and notes</li><li>Installed optional apps and saved Dock pins</li><li>Appearance, wallpaper, browser and window preferences</li><li>Desktop app shortcuts and saved window positions</li></ul></div><button id="erase-now" class="settings-link" style="margin-top:14px;background:#ffe6e6;color:#b42318">Erase All Content and Restart Setup</button>`;
      main.innerHTML=html;
      $$('[data-page]',nav).forEach(x=>x.onclick=()=>{page=x.dataset.page;draw()});$$('[data-go]',main).forEach(x=>x.onclick=()=>{page=x.dataset.go;draw()});
      $$('[data-dark]',main).forEach(x=>x.onclick=()=>{prefs273.dark=x.dataset.dark==='1';savePrefs273();applyPrefs273();draw();syncCC()});
      $$('[data-accent]',main).forEach(x=>x.onclick=()=>{prefs273.accent=x.dataset.accent;savePrefs273();applyPrefs273();draw()});
      $$('[data-wall]',main).forEach(x=>x.onclick=()=>{prefs273.wallpaper=x.dataset.wall;savePrefs273();applyPrefs273();draw()});
      $$('[data-pref]',main).forEach(x=>x.onchange=()=>{prefs273[x.dataset.pref]=x.checked;savePrefs273();applyPrefs273();if(x.dataset.pref==='reduceMotion')syncCC();syncCC()});
      $$('[data-pin]',main).forEach(x=>x.onchange=()=>{dockSetPin273(x.dataset.pin,x.checked);draw()});
      const glass=$('#glass-range',main);if(glass)glass.oninput=()=>{prefs273.glass=+glass.value;$('#glass-val',main).textContent=glass.value+'%';savePrefs273();document.documentElement.style.setProperty('--glass-level',String(+glass.value/100))};
      const dock=$('#dock-size-range',main);if(dock)dock.oninput=()=>{prefs273.dockSize=+dock.value;$('#dock-size-value',main).textContent=Math.round(prefs273.dockSize*46)+' px';savePrefs273();document.documentElement.style.setProperty('--dock-size',String(prefs273.dockSize))};
      const vol=$('#set-vol',main);if(vol)vol.oninput=()=>{S.vol=+vol.value;$('#set-vol-label',main).textContent=Math.round(S.vol/8*100)+'%';syncCC();hud()};
      const bright=$('#settings-brightness',main);if(bright)bright.oninput=()=>{setBrightness(bright.value);syncCC()};
      $('#stage-settings',main)?.addEventListener('click',()=>{toggleStage();draw()});
      $('#desktop-shortcuts',main)?.addEventListener('click',()=>{toast('Right-click an empty desktop area to add or remove shortcuts')});
      $('#account-avatar-glyph',main)?.addEventListener('change',e=>{const p=$('#v2-profile-preview',main);p.textContent=e.target.value==='initial'?(S.name||'B').slice(0,1).toUpperCase():e.target.value});
      $('#account-avatar-color',main)?.addEventListener('input',e=>{$('#v2-profile-preview',main).style.background=e.target.value});
      $('#account-save',main)?.addEventListener('click',async()=>{
        const name=$('#account-name',main).value.trim(),pw=$('#account-password',main).value;
        if(!name){toast('Account name cannot be empty');return;}
        if(pw&&pw.length<8){toast('Use at least 8 characters for the new password.');return;}
        try{
          if(pw)await saveBlynsPassword(pw);
          S.name=name;avatarColor=$('#account-avatar-color',main).value;avatarGlyph=$('#account-avatar-glyph',main).value;
          localStorage.setItem('mac_n',S.name);localStorage.setItem('blyns_avatar_color',avatarColor);localStorage.setItem('blyns_avatar_glyph',avatarGlyph);
          localStorage.removeItem('mac_p');applyProfile();$('#lnm').textContent=S.name;toast('Account updated');draw();
        }catch(error){toast(error.message||'Account could not be saved.');}
      });
      $('#account-avatar-glyph',main) && ($('#account-avatar-glyph',main).value=avatarGlyph);
      $('#account-lock',main)?.addEventListener('click',logout);
      $('#erase-now',main)?.addEventListener('click',()=>ask('Erase all BlynsOS data in this browser and restart the first-run setup? This cannot be undone.','Erase',factory));
    };
    draw();
  };

  // Complete factory erase. Defaults include an empty desktop and no optional installs.
  factory=function(){
    windowStateHold=true;
    const keys=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&(/^(mac_|macos_|blyns_|navigator_)/i.test(k)))keys.push(k);}keys.forEach(k=>localStorage.removeItem(k));}catch(e){}
    S.name='';S.pwHash='';S.off=false;stageOn=false;brightness=100;stageExpanded=false;lastUsedWindowId=null;
    installed=[];try{persistInstalled()}catch(e){}
    FS={Desktop:[],Documents:[],Downloads:[]};sv('mac_fs',FS);sv('mac_notes',[]);
    desktopApps=[];sv('blyns_v2_desktop_apps',desktopApps);blynsDesktopAppPos={};sv(BLYNS_DESKTOP_APP_POS,blynsDesktopAppPos);
    prefs273=Object.assign({},defaults273,{wallpaper:'golden',dark:false,focusMode:false});savePrefs273();applyPrefs273();
    avatarColor='#648fc5';avatarGlyph='initial';
    try{PIN.splice(0,PIN.length,'finder','launchpad','safari','siri','messages','mail','maps','photos','calendar','notes','reminders','music','store','terminal','settings');saveDock273();}catch(e){}
    selectedDesktop=null;renderDesktop();clearWins();closeCC();$('#lp').classList.remove('on');$('#mc').classList.remove('on');$('#spotlight')?.classList.remove('on');$('#am').classList.remove('on');
    restart();
  };

  // Escape dismisses the topmost transient surface first, then exits the active app/window.
  function closeTopWindow(){const w=topWin();if(!w)return false;if(typeof w.__blynsEsc==='function'&&w.__blynsEsc())return true;const close=$('.tl i:nth-child(1)',w);if(close){close.click();return true;}return false;}
  function exitCurrent(){
    if($('#dlg').classList.contains('on')){$('#dlg').classList.remove('on');return true;}
    if($('#ccpanel').classList.contains('on')){closeCC();return true;}
    if($('#spotlight')?.classList.contains('on')){spotlightToggle273(false);return true;}
    if($('#siri').classList.contains('on')){$('#siri').classList.remove('on');return true;}
    if($('#lp').classList.contains('on')){$('#lp').classList.remove('on');return true;}
    if($('#mc').classList.contains('on')){mcx();return true;}
    if($('#am').classList.contains('on')){$('#am').classList.remove('on');return true;}
    if(stageOn){toggleStage();return true;}
    return closeTopWindow();
  }
  addEventListener('keydown',e=>{
    const black=S.ph==='boot'||S.off||$('#off').classList.contains('on');if(black)return;
    if(S.ph!=='desk')return;
    const typing=/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.isContentEditable;
    if(e.key==='Escape'){
      e.preventDefault();e.stopImmediatePropagation();
      exitCurrent();
      return;
    }
    if(typing||e.metaKey||e.ctrlKey||e.altKey||e.shiftKey)return;
    if(e.key.toLowerCase()==='c'){e.preventDefault();e.stopImmediatePropagation();if(!$('#ccpanel').classList.contains('on'))$('#ccbtn').click();else closeCC();}
  },true);

  // Blur the lock-screen password field after a successful unlock so desktop shortcuts respond immediately.
  $('#pw').addEventListener('keydown',e=>{if(e.key==='Enter')setTimeout(()=>{if(S.ph==='desk')e.target.blur();},0)});

  // Hide unfinished sample/prototype apps until real implementations or service integrations are supplied.
  const deferredSampleApps273=['weather','weatherplus','home','monitor','podcasts','books','contacts','keynote','pages'];
  deferredSampleApps273.forEach(id=>{delete APPS[id];delete installedApps[id];});
  for(const id of deferredSampleApps273){const pinIndex=PIN.indexOf(id);if(pinIndex!==-1)PIN.splice(pinIndex,1);}
  installed=installed.filter(id=>!deferredSampleApps273.includes(id));
  persistInstalled();
  desktopApps=desktopApps.filter(id=>!deferredSampleApps273.includes(id));
  sv(desktopAppKey,desktopApps);

  // Final version strings and refreshed desktop/system surfaces.
  const ccVersion=$('#ccpanel .cc-v2-head small');if(ccVersion)ccVersion.textContent=V2;
  if($('.lock-eyebrow'))$('.lock-eyebrow').textContent='BLYNSOS  ·  PERSONAL DESKTOP';
  dockBuild();renderDesktop();syncCC();
  // Make the boot wordmark and menu mark use their separate intended assets.
  const bootLogo=$('#boot .boot-logo');if(bootLogo){bootLogo.alt='BlynsOS';}
})();
/* ================= end BlynsOS 1.0 Stabilized ================= */

