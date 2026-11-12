/* BlynsOS Setup Assistant — independent first-run module. */
(() => {
  'use strict';
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const greetings = ['Hello','你好','Bonjour','Hola','こんにちは','안녕하세요','Selamat Datang'];
  const palette = [
    ['#70a7ff','Blue'],['#b49aff','Purple'],['#65c9bb','Teal'],
    ['#f0a45e','Orange'],['#f18bb4','Pink'],['#5dc3a5','Mint'],['#e0a2e8','Lilac']
  ];
  const wallpapers = [
    {id:'golden',name:'Golden',preview:'linear-gradient(145deg,#1b2a5e,#d9638f,#ffb86b)'},
    {id:'aurora',name:'Aurora',preview:'linear-gradient(145deg,#091b32,#2c7779,#7d69ca)'},
    {id:'ocean',name:'Ocean',preview:'linear-gradient(145deg,#c6efff,#4b9cc9,#092d51)'},
    {id:'midnight',name:'Midnight',preview:'linear-gradient(145deg,#47516c,#171a2b,#080a11)'},
    {id:'dawn',name:'Dawn',preview:'linear-gradient(145deg,#546a9b,#e59b9a,#f3c78d)'},
    {id:'forest',name:'Forest',preview:'linear-gradient(145deg,#122d2a,#547e6c,#0c1d1e)'},
    {id:'lavender',name:'Lavender',preview:'linear-gradient(145deg,#4d4b85,#9887bb,#d6a6bd)'},
    {id:'desert',name:'Desert',preview:'linear-gradient(145deg,#805b53,#d89a70,#e7c59a)'},
    {id:'graphite',name:'Graphite',preview:'linear-gradient(145deg,#555d68,#242932,#05070b)'},
    {id:'bloom',name:'Bloom',preview:'linear-gradient(145deg,#494c85,#9a79b6,#e3a4b0)'}
  ];
  const copy = {
    ms: {
      step:'Langkah',start:'Mula',continue:'Teruskan',back:'Kembali',caption:'Satu permulaan baharu.',
      ready:'Selamat datang. Mari sediakan ruang kerja anda.',
      langTitle:'Pilih bahasa anda',langDesc:'Bahasa boleh diubah kemudian dalam tetapan.',
      regionTitle:'Pilih rantau anda',regionDesc:'Ini membantu menetapkan pilihan setempat.',
      nameTitle:'Siapa nama anda?',nameDesc:'Nama ini dipaparkan pada skrin kunci dan profil.',
      nameLabel:'Nama akaun',namePlaceholder:'Masukkan nama anda',
      passTitle:'Cipta kata laluan',passDesc:'Gunakan sekurang-kurangnya 8 aksara.',
      passLabel:'Kata laluan',passPlaceholder:'Cipta kata laluan',
      confirmTitle:'Sahkan kata laluan',confirmDesc:'Masukkan kata laluan yang sama sekali lagi.',
      confirmLabel:'Sahkan kata laluan',confirmPlaceholder:'Masukkan semula kata laluan',
      themeTitle:'Pilih tema',themeDesc:'Anda boleh mengubahnya kemudian.',
      wallpaperTitle:'Pilih wallpaper',wallpaperDesc:'Wallpaper digunakan pada desktop dan skrin kunci.',
      personalTitle:'Peribadikan profil',personalDesc:'Pilih warna aksen dan avatar.',
      accentLabel:'Warna aksen',avatarLabel:'Simbol avatar',
      prepareTitle:'Menyediakan ruang kerja',prepareDesc:'Profil dan tetapan anda sedang disimpan.',
      errorRequired:'Sila lengkapkan ruangan ini.',errorShort:'Kata laluan mesti sekurang-kurangnya 8 aksara.',
      errorMismatch:'Kata laluan tidak sepadan.',languageMs:'Bahasa Melayu',languageEn:'English',
      light:'Cerah',dark:'Gelap',initial:'Huruf pertama nama'
    },
    en: {
      step:'Step',start:'Get Started',continue:'Continue',back:'Back',caption:'A beautiful new beginning.',
      ready:'Welcome. Let’s prepare your workspace.',
      langTitle:'Choose your language',langDesc:'You can change this later in Settings.',
      regionTitle:'Choose your region',regionDesc:'This helps set your local preferences.',
      nameTitle:'What should we call you?',nameDesc:'This name appears on your lock screen and profile.',
      nameLabel:'Account name',namePlaceholder:'Enter your name',
      passTitle:'Create a password',passDesc:'Use at least 8 characters.',
      passLabel:'Password',passPlaceholder:'Create a password',
      confirmTitle:'Confirm your password',confirmDesc:'Enter the same password again.',
      confirmLabel:'Confirm password',confirmPlaceholder:'Re-enter your password',
      themeTitle:'Choose your theme',themeDesc:'You can change it later.',
      wallpaperTitle:'Choose a wallpaper',wallpaperDesc:'This wallpaper is used on your desktop and lock screen.',
      personalTitle:'Personalize your profile',personalDesc:'Choose an accent colour and avatar.',
      accentLabel:'Accent colour',avatarLabel:'Avatar symbol',
      prepareTitle:'Preparing your workspace',prepareDesc:'Your profile and preferences are being saved.',
      errorRequired:'Please complete this field.',errorShort:'Your password must contain at least 8 characters.',
      errorMismatch:'The passwords do not match.',languageMs:'Bahasa Melayu',languageEn:'English',
      light:'Light',dark:'Dark',initial:'Account initial'
    }
  };
  const safe = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));

  let root=null, step=1, draft=null, greetingTimer=0, prepareTimer=0;
  const regions=['Malaysia','Singapore','Brunei','Indonesia','Australia','Japan','United Kingdom','United States','Germany','France'];
  const t = key => copy[draft.language][key];
  const defaults = () => ({
    region:'Malaysia',language:'ms',name:'',password:'',confirm:'',
    dark:false,wallpaper:'golden',accent:'#70a7ff',
    avatarColor:'#648fc5',avatarGlyph:'initial'
  });

  function ensureShell() {
    root = document.getElementById('setup-root');
    if (!root) {
      const host=document.getElementById('setup');
      if (!host) throw new Error('Setup host was not found.');
      host.innerHTML=`
        <div class="setup-wallpaper" aria-hidden="true"></div>
        <div class="setup-shade" aria-hidden="true"></div>
        <section class="setup-card" aria-live="polite">
          <div class="setup-topline">
            <span class="setup-brand">BLYNS OS <span>1.1</span></span>
            <span class="step-counter" id="step-counter">1 / 10</span>
          </div>
          <div class="step-track" aria-hidden="true"><div class="step-track-fill" id="step-track-fill"></div></div>
          <div id="step-content" class="step-content"></div>
          <div class="setup-footer">
            <button id="back-button" class="back-button" type="button" hidden>Back</button>
            <button id="continue-button" class="continue-button" type="button">Continue <span aria-hidden="true">→</span></button>
          </div>
          <p class="setup-error" id="setup-error" role="alert"></p>
        </section>`;
      root=host;
    }
    if (!$('#step-content',root)) {
      root.innerHTML=`
        <section class="setup-card" aria-live="polite">
          <div class="setup-topline"><span class="setup-brand">BLYNS OS <span>1.1</span></span><span class="step-counter" id="step-counter">1 / 10</span></div>
          <div class="step-track"><div class="step-track-fill" id="step-track-fill"></div></div>
          <div id="step-content" class="step-content"></div>
          <div class="setup-footer"><button id="back-button" class="back-button" type="button" hidden>Back</button><button id="continue-button" class="continue-button" type="button">Continue <span>→</span></button></div>
          <p class="setup-error" id="setup-error" role="alert"></p>
        </section>`;
    }
  }

  function start() {
    window.clearInterval(greetingTimer);
    window.clearTimeout(prepareTimer);
    ensureShell();
    draft=defaults();step=1;render();
  }

  function render(markup) {
    window.clearInterval(greetingTimer);
    const content=$('#step-content',root);
    const counter=$('#step-counter',root);
    const track=$('#step-track-fill',root);
    const back=$('#back-button',root);
    const next=$('#continue-button',root);
    const error=$('#setup-error',root);
    if(!content||!counter||!track||!back||!next||!error) {
      throw new Error('Setup markup is incomplete.');
    }
    counter.textContent=`${t('step')} ${step} / 10`;
    track.style.width=`${step*10}%`;
    error.textContent='';
    back.hidden=step===1||step===10;
    next.hidden=step===10;
    back.textContent=t('back');
    next.innerHTML=`${step===1?t('start'):t('continue')} <span aria-hidden="true">→</span>`;
    back.onclick=()=>{if(step>1&&step<10){step--;drawStep();}};
    next.onclick=nextStep;
    content.classList.remove('step-changing');
    if(markup!==undefined)content.innerHTML=markup;
    void content.offsetWidth;
    content.classList.add('step-changing');
  }

  function drawStep() {
    render('');
    const content=$('#step-content',root);
    if(step===1) {
      render(`<div class="hello-stage"><div class="hello-orb" aria-hidden="true"></div><div><p class="hello-word" id="hello-word">${greetings[0]}</p><p class="hello-caption">${t('caption')}</p></div></div><p class="step-description">${t('ready')}</p>`);
      let ix=0;
      greetingTimer=window.setInterval(()=>{
        const word=$('#hello-word',root);if(!word)return;
        ix=(ix+1)%greetings.length;word.textContent=greetings[ix];
        word.style.animation='none';void word.offsetWidth;word.style.animation='';
      },1500);
      return;
    }
    if(step===2) {
      render(`<p class="step-eyebrow">${t('step')} 02</p><h1 class="step-title">${t('langTitle')}</h1><p class="step-description">${t('langDesc')}</p><div class="language-options" role="group"><button class="language-option ${draft.language==='ms'?'selected':''}" data-language="ms" type="button"><span><span class="language-name">${t('languageMs')}</span><span class="language-native">Malaysia</span></span><span class="language-check">✓</span></button><button class="language-option ${draft.language==='en'?'selected':''}" data-language="en" type="button"><span><span class="language-name">English</span><span class="language-native">International</span></span><span class="language-check">✓</span></button></div>`);
      $$('[data-language]',content).forEach(btn=>btn.onclick=()=>{draft.language=btn.dataset.language;drawStep();});
      return;
    }
    if(step===3) {
      render(`<p class="step-eyebrow">${t('step')} 03</p><h1 class="step-title">${t('regionTitle')}</h1><p class="step-description">${t('regionDesc')}</p><div class="setup-input-wrap"><label class="setup-label" for="setup-region">Region</label><select class="setup-input" id="setup-region">${regions.map(r=>`<option ${r===draft.region?'selected':''}>${r}</option>`).join('')}</select></div>`);
      $('#setup-region',root).onchange=e=>draft.region=e.target.value;
      return;
    }
    if(step===4) {
      render(`<p class="step-eyebrow">${t('step')} 04</p><h1 class="step-title">${t('nameTitle')}</h1><p class="step-description">${t('nameDesc')}</p><div class="setup-input-wrap"><label class="setup-label" for="setup-name">${t('nameLabel')}</label><input class="setup-input" id="setup-name" maxlength="28" autocomplete="name" placeholder="${t('namePlaceholder')}" value="${safe(draft.name)}"></div>`);
      $('#setup-name',root).oninput=e=>draft.name=e.target.value;
      $('#setup-name',root).focus();return;
    }
    if(step===5) {
      render(`<p class="step-eyebrow">${t('step')} 05</p><h1 class="step-title">${t('passTitle')}</h1><p class="step-description">${t('passDesc')}</p><div class="setup-input-wrap"><label class="setup-label" for="setup-password">${t('passLabel')}</label><input class="setup-input" id="setup-password" type="password" autocomplete="new-password" placeholder="${t('passPlaceholder')}"></div>`);
      $('#setup-password',root).oninput=e=>draft.password=e.target.value;
      $('#setup-password',root).focus();return;
    }
    if(step===6) {
      render(`<p class="step-eyebrow">${t('step')} 06</p><h1 class="step-title">${t('confirmTitle')}</h1><p class="step-description">${t('confirmDesc')}</p><div class="setup-input-wrap"><label class="setup-label" for="setup-confirm">${t('confirmLabel')}</label><input class="setup-input" id="setup-confirm" type="password" autocomplete="new-password" placeholder="${t('confirmPlaceholder')||'Re-enter your password'}"></div>`);
      $('#setup-confirm',root).oninput=e=>draft.confirm=e.target.value;
      $('#setup-confirm',root).focus();return;
    }
    if(step===7) {
      render(`<p class="step-eyebrow">${t('step')} 07</p><h1 class="step-title">${t('themeTitle')}</h1><p class="step-description">${t('themeDesc')}</p><div class="setup-choice-grid"><button class="setup-choice ${!draft.dark?'active':''}" data-theme="light" type="button">☀ &nbsp; ${t('light')}</button><button class="setup-choice ${draft.dark?'active':''}" data-theme="dark" type="button">◐ &nbsp; ${t('dark')}</button></div>`);
      $$('[data-theme]',content).forEach(btn=>btn.onclick=()=>{draft.dark=btn.dataset.theme==='dark';$$('[data-theme]',content).forEach(x=>x.classList.toggle('active',x===btn));});
      return;
    }
    if(step===8) {
      const extra=(window.BLYNS_WALLPAPERS||[]).map(w=>({id:w.id,name:w.name,preview:`url("${w.preview||w.src}") center/cover`}));
      const options=[...wallpapers,...extra.filter(w=>!wallpapers.some(x=>x.id===w.id))];
      render(`<p class="step-eyebrow">${t('step')} 08</p><h1 class="step-title">${t('wallpaperTitle')}</h1><p class="step-description">${t('wallpaperDesc')}</p><div class="setup-wall-grid">${options.map(w=>`<button class="setup-wall-choice ${draft.wallpaper===w.id?'active':''}" data-wallpaper="${safe(w.id)}" type="button"><span class="setup-wall-preview" style="display:block;height:72px;border-radius:9px;background:${safe(w.preview)}"></span><span>${safe(w.name)}</span></button>`).join('')}</div>`);
      $$('[data-wallpaper]',content).forEach(btn=>btn.onclick=()=>{draft.wallpaper=btn.dataset.wallpaper;$$('[data-wallpaper]',content).forEach(x=>x.classList.toggle('active',x===btn));});
      return;
    }
    if(step===9) {
      const glyphs=[['initial',t('initial')],['🙂','Smile'],['🌟','Star'],['🌙','Moon'],['💎','Gem'],['🌿','Leaf'],['🚀','Rocket']];
      const display=draft.avatarGlyph==='initial'?(draft.name||'B').slice(0,1).toUpperCase():draft.avatarGlyph;
      render(`<p class="step-eyebrow">${t('step')} 09</p><h1 class="step-title">${t('personalTitle')}</h1><p class="step-description">${t('personalDesc')}</p><div class="setup-avatar-preview" id="setup-avatar-preview" style="background:${draft.avatarColor}">${safe(display)}</div><label class="setup-label" for="setup-avatar-color">${t('accentLabel')}</label><div class="setup-color-row">${palette.map(([c,n])=>`<button class="setup-color-choice ${draft.accent===c?'active':''}" data-accent="${c}" title="${n}" style="background:${c}" type="button"></button>`).join('')}</div><input id="setup-avatar-color" type="color" value="${draft.avatarColor}" style="width:70px;height:38px;border:0;background:transparent"><label class="setup-label" for="setup-avatar-glyph">${t('avatarLabel')}</label><select id="setup-avatar-glyph" class="setup-input">${glyphs.map(([v,n])=>`<option value="${safe(v)}" ${draft.avatarGlyph===v?'selected':''}>${safe(n)}</option>`).join('')}</select>`);
      $$('[data-accent]',content).forEach(btn=>btn.onclick=()=>{draft.accent=btn.dataset.accent;draft.avatarColor=btn.dataset.accent;$('#setup-avatar-color',root).value=btn.dataset.accent;$$('[data-accent]',content).forEach(x=>x.classList.toggle('active',x===btn));$('#setup-avatar-preview',root).style.background=btn.dataset.accent;});
      $('#setup-avatar-color',root).oninput=e=>{draft.avatarColor=e.target.value;draft.accent=e.target.value;$('#setup-avatar-preview',root).style.background=e.target.value;};
      $('#setup-avatar-glyph',root).onchange=e=>{draft.avatarGlyph=e.target.value;$('#setup-avatar-preview',root).textContent=e.target.value==='initial'?(draft.name||'B').slice(0,1).toUpperCase():e.target.value;};
      return;
    }
    if(step===10) {
      render(`<div class="preparing-icon" aria-hidden="true"></div><h1 class="step-title">${t('prepareTitle')}</h1><p class="step-description">${t('prepareDesc')}</p><div class="preparing-track"><div class="preparing-fill"></div></div>`);
      $('#back-button',root).hidden=true;$('#continue-button',root).hidden=true;
      prepareTimer=window.setTimeout(finish,2300);
    }
  }

  async function nextStep() {
    const error=$('#setup-error',root);error.textContent='';
    if(step===4){draft.name=$('#setup-name',root).value.trim();if(!draft.name){error.textContent=t('errorRequired');$('#setup-name',root).focus();return;}}
    if(step===5){draft.password=$('#setup-password',root).value;if(draft.password.length<8){error.textContent=t('errorShort');$('#setup-password',root).focus();return;}}
    if(step===6){draft.confirm=$('#setup-confirm',root).value;if(draft.confirm!==draft.password){error.textContent=t('errorMismatch');$('#setup-confirm',root).focus();return;}}
    if(step<10){step++;drawStep();}
  }

  async function finish() {
    try {
      if(!window.BlynsSecurity?.hashPassword)throw new Error('Secure password service is unavailable.');
      const passwordHash=await window.BlynsSecurity.hashPassword(draft.password);
      const profile={
        name:draft.name.trim(),passwordHash,region:draft.region,language:draft.language,
        dark:draft.dark,wallpaper:draft.wallpaper,accent:draft.accent,
        avatarColor:draft.avatarColor,avatarGlyph:draft.avatarGlyph,timeFormat:'24'
      };
      const previous=JSON.parse(localStorage.getItem('macos_273_preferences')||'{}');
      localStorage.setItem('mac_n',profile.name);
      localStorage.setItem('blyns_password_hash',passwordHash);
      localStorage.removeItem('mac_p');
      localStorage.setItem('blyns_avatar_color',profile.avatarColor);
      localStorage.setItem('blyns_avatar_glyph',profile.avatarGlyph);
      localStorage.setItem('blyns_region',profile.region);
      localStorage.setItem('blyns_language',profile.language);
      localStorage.setItem('macos_273_preferences',JSON.stringify({
        ...previous,dark:profile.dark,wallpaper:profile.wallpaper,accent:profile.accent,timeFormat:'24'
      }));
      if(typeof window.BlynsSetupComplete==='function') {
        window.BlynsSetupComplete(profile);
      } else {
        const card=$('.setup-card',root);
        if(card)card.innerHTML=`<h1 class="step-title">${profile.language==='ms'?'Selesai':'All set'}</h1><p class="step-description">${profile.language==='ms'?'Profil anda telah disimpan.':'Your profile has been saved.'}</p>`;
      }
    } catch(error) {
      const target=$('#setup-error',root);
      if(target)target.textContent=error.message||'Setup could not be completed.';
      $('#back-button',root).hidden=false;
      $('#continue-button',root).hidden=false;
      step=5;drawStep();
    }
  }

  window.BlynsSetup=Object.freeze({start});
  window.BlynsSetupStart=start;

  if(document.body.dataset.standalone==='true') {
    document.addEventListener('DOMContentLoaded',start,{once:true});
  }
})();
