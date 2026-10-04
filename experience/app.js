import { ui, projects, workStories, articles, LINKS, chapters, personalContent } from './content.js?v=single-studio-3';
import { mountResume } from './resume-view.js?v=single-studio-3';
import { mountTabsDemo } from './tabs-demo.js?v=single-studio-3';
import { mountRfidDemo } from './rfid-demo.js?v=single-studio-3';
import { buildProjectLibrary, findProjectItem } from './project-library.js?v=single-studio-3';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const storage={get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v)}catch{}},remove(k){try{localStorage.removeItem(k)}catch{}}};
const query=new URLSearchParams(location.search);
let state={lang:query.get('lang')==='ar'?'ar':query.get('lang')==='en'?'en':storage.get('moaaz-lang')==='ar'?'ar':'en',view:'room',quick:false,step:2};
let world=null, worldLoading=null, worldUnavailable=false, entered=false, opening=false;
let routing=false, screenReturnTo=null;
let activeId=null,lastTrigger=null,demo=null,returnToQuick=false,returnScene=null;
let score=0,charging=false,chargeStart=0,chargeFrame=0,shotBusy=false,lastShotResult=null,toastTimer;
let unboxing={phase:'idle',remaining:[],opened:[]};
let motionOff=matchMedia('(prefers-reduced-motion:reduce)').matches;
const stops=chapters.map(c=>c.id),panels=new Map();
let roomMoved=false;const roomHelp=document.createElement('p');roomHelp.id='room-controls-hint';roomHelp.hidden=true;document.body.append(roomHelp);const roomRole=document.createElement('p');roomRole.id='room-role';roomRole.hidden=true;document.body.append(roomRole);
const t=()=>ui[state.lang];
const resizeWorld=()=>window.dispatchEvent(new Event('resize'));
const workIndex=()=>chapters.findIndex(c=>c.id==='work');
const subjectChapter=id=>['tabs','haweshly','tourism','rfid','art','articles'].includes(id)?1:['work','macbook','kyc-bike'].includes(id)?2:['personal','fishing','basketball'].includes(id)?3:id==='future'?4:0;
function writeRoute(id,push=true){
 const u=new URL(location.href);u.searchParams.set('lang',state.lang);u.searchParams.set('view','room');u.hash=id||'studio';
 const data={subject:id||null,view:'room',returnTo:screenReturnTo};
 const next=u.pathname+u.search+u.hash;try{history[push&&next!==location.pathname+location.search+location.hash?'pushState':'replaceState'](data,'',next)}catch{}
}
function glyph(name) {
  const paths = {
    windows:
      '<rect x="3" y="5" width="25" height="20" rx="2"/><path d="M3 10h25M17 10v15M3 20h14"/>',
    coins:
      '<ellipse cx="16" cy="22" rx="10" ry="4"/><path d="M6 17v5M26 17v5"/><ellipse cx="16" cy="17" rx="10" ry="4"/><ellipse cx="16" cy="10" rx="8" ry="3"/><path d="M8 5v5M24 5v5"/><ellipse cx="16" cy="5" rx="8" ry="3"/>',
    globe:
      '<circle cx="16" cy="16" r="12"/><ellipse cx="16" cy="16" rx="5" ry="12"/><path d="M4 16h24M6 10h20M6 22h20"/>',
    circuit:
      '<rect x="9" y="9" width="14" height="14" rx="2"/><path d="M12 3v6M20 3v6M12 23v6M20 23v6M3 12h6M3 20h6M23 12h6M23 20h6M13 13h6v6h-6z"/>',
    frame:
      '<rect x="3" y="3" width="26" height="26" rx="2"/><path d="m6 24 7-8 5 5 5-7 3 10M6 7h20v18H6z"/><circle cx="13" cy="11" r="2"/>',
    notebook:
      '<path d="M6 3h22v26H6zM10 3v26M3 8h6M3 15h6M3 23h6M15 10h8M15 15h8M15 20h5"/>',
    person:
      '<circle cx="16" cy="10" r="6"/><path d="M5 29v-3a11 11 0 0 1 22 0v3"/>',
    hoop: '<path d="M3 3h26v15H3zM12 10h8M7 18h19M9 20l3 9h11l2-9M14 20l2 9M20 20l-2 9M10 24h14"/>',
    menu: '<path d="M5 9h22M5 16h22M5 23h22"/>',
    room: '<path d="m4 13 12-9 12 9v16H4zM12 29V18h8v11"/>',
    canvas:
      '<rect x="2" y="6" width="11" height="17"/><rect x="18" y="3" width="12" height="10"/><rect x="18" y="19" width="12" height="10"/>',
    story: '<path d="M4 6q8-4 12 0 7-4 12 0v22q-6-4-12 0-7-4-12 0zM16 6v22"/>',
  };
  return `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${paths[name] || paths.windows}</svg>`;
}
const link = (l) =>
  `<a href="${safe(l.url)}" target="_blank" rel="noopener">${safe(l.label[state.lang])} ↗</a>`;
function toast(text) {
  $("#toast").textContent = text;
  $("#toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("#toast").hidden = true), 3200);
}
function localise(){
 const c=t();roomRole.textContent=c.role;
 roomHelp.textContent=matchMedia('(pointer:coarse)').matches?(state.lang==='ar'?'اسحب عشان تبص · كبّر بصباعين · دوس على حاجة تلفت نظرك':'Drag to look · pinch to zoom · tap what catches your eye'):(state.lang==='ar'?'اسحب عشان تبص · قرّب · دوس على حاجة تلفت نظرك':'Drag to look · scroll to zoom · pick what catches your eye');
 document.documentElement.lang=state.lang==='ar'?'ar-EG':'en';document.documentElement.dir=state.lang==='ar'?'rtl':'ltr';
 $$('[data-ui]').forEach(e=>e.textContent=c[e.dataset.ui]||e.dataset.ui);
 $('#lang').textContent=c.language;$('#dialog-lang').textContent=c.language;
 $('#brand').setAttribute('aria-label',state.lang==='ar'?'معاذ أكرم، الأستوديو':'Moaaz Akram, home');
 $('#lang').lang=$('#dialog-lang').lang=state.lang==='ar'?'en':'ar';$('#menu-button').setAttribute('aria-label',c.explore);
 $('#menu').setAttribute('aria-label',state.lang==='ar'?'استكشف الأستوديو':'Explore studio');
 $('#skip').textContent=c.reading||c.quick;$('#world').setAttribute('aria-label',c.hint);
 $('#motion-button').textContent=motionOff?c.motionOff:c.motionOn;$('#motion-button').setAttribute('aria-pressed',String(!motionOff));
 $('#dialog-close').setAttribute('aria-label',c.returnToRoom||c.close);$('#shot-power').setAttribute('aria-label',c.power);
 $('#intro-title').innerHTML=`${safe(c.intro)} <span>${safe(c.intro2)}</span>`;$('#intro-sub').textContent=c.sub;$('#intro-role').textContent=c.role;
 document.title=state.lang==='ar'?'معاذ أكرم — الأستوديو':'Moaaz Akram — the studio';
 $('#try-mac').textContent=state.lang==='ar'?'شوف شغلي على الماك':'See my work on the Mac';
 $('#canonical').href='https://xtcpanda.github.io/'+(state.lang==='ar'?'?lang=ar':'');
 resumeView.setLanguage(state.lang);resumeView.setView('room');world?.setLanguage(state.lang);
 renderMenu();renderUnboxing();if(state.quick)renderQuick();if(activeId&&$('#project-dialog').open)renderPanel(activeId,true);if(activeId==='basketball')renderHoop();
}
function renderMenu(){
 const entries=state.lang==='ar'?[['work','الشغل'],['projects','المشاريع والأفكار'],['articles','الكتابة'],['resume','السيرة الذاتية'],['about','عنّي'],['books','القراءة'],['personal','برّه الشغل'],['future','حاجات نفسي فيها'],['fishing','استراحة صيد'],['basketball','الباسكت']]:[['work','Work'],['projects','Projects & Ideas'],['articles','Writing'],['resume','Résumé'],['about','About'],['books','Reading'],['personal','Beyond work'],['future','Someday'],['fishing','Fishing'],['basketball','Basketball']];
 $('#menu-stations').innerHTML=entries.map(([id,title])=>`<button data-station="${id}">${glyph(projects[id]?.icon||'notebook')}<span>${safe(title)}</span></button>`).join('');
 $('#view-switch').hidden=true;$('#view-switch').replaceChildren();
}
function menu(open){const wasOpen=!$('#menu').hidden;$('#menu').hidden=!open;$('#menu-button').setAttribute('aria-expanded',String(open));if(open)$('#menu-stations button')?.focus();else if(wasOpen)$('#menu-button').focus({preventScroll:true});updateSurfaces();}
function updateSurfaces(){
 const reading=$('#project-dialog').open,blocked=Boolean(document.querySelector('.resume-view[open]'))||!$('#menu').hidden;
 roomHelp.hidden=roomMoved||state.quick||Boolean(activeId);roomRole.hidden=state.quick||!activeId;
 document.body.dataset.context=String(reading);document.body.dataset.entered=String(entered&&!state.quick);document.body.dataset.view='room';
 $('#world-status').hidden=state.quick||!!world||worldUnavailable;
 $('#intro').hidden=state.quick||Boolean(activeId);document.body.dataset.screen=String(Boolean(world?.isScreenOpen?.()));
 $('#comic-opening').hidden=true;$('#illustrated-story').hidden=true;$('#canvas-board').hidden=true;
 $('#world').hidden=state.quick;$('#quick-page').hidden=!state.quick;$('#world-nav').hidden=true;$('#story-controls').hidden=true;$('#living-actions').hidden=true;
 resumeView.setView('room');for(const [id,p]of panels)p.demo?.setActive?.(reading&&id===activeId&&!blocked);
 world?.setActive?.(!state.quick&&!blocked&&!reading);resizeWorld();
}
function closePanel({restore=true,route=true}={}){
 const back=returnToQuick;returnToQuick=false;const origin=returnScene;returnScene=null;demo=null;activeId=null;
 $('#project-dialog').close();$('#hoop-hud').hidden=true;$('#unboxing-hud').hidden=true;$('#world').classList.remove('is-focused');stopCharge(false);
 if(restore&&origin){state.step=origin.step;if(world&&origin.pose)world.restorePose?.(origin.pose);}
 if(back&&restore){state.quick=true;renderQuick();}
 world?.setMode('explore');updateSurfaces();
 if(route)writeRoute(state.quick?'reading':null);
 if(lastTrigger?.isConnected&&lastTrigger.getBoundingClientRect().width)lastTrigger.focus({preventScroll:true});
}
const aliasSubject=id=>({canvas:'projects',board:'projects',make:'projects',writing:'articles','kyc-bike':'work',comic:'studio','comic-home':'studio'}[id]||id);
const isMacSubject=id=>['macbook','mac-resume','projects','ideas','books','tabs-demo','haweshly-demo','rfid-demo'].includes(id)||Boolean(findProjectItem(id,state.lang))||Boolean(projects[id]&&!['basketball','fishing'].includes(id));
async function navigate(raw,trigger=null,{push=true,returnTo=null}={}){
 const id=aliasSubject(raw);if(id==='studio'){await home({push});return;}
 if(id.startsWith('shipment-')){world?.act(id);return;}
 if(id==='resume'){menu(false);resumeView.open();writeRoute('resume',push);return;}
 if(!state.quick&&!worldUnavailable){
  const w=await initWorld();if(w){
   menu(false);opening=false;entered=true;$('#project-dialog').close();$('#hoop-hud').hidden=true;
   if(id==='fishing'||id==='play'){w.openScreen('arcade');activeId='fishing';}
   else if(id==='basketball'){if(w.isScreenOpen())w.closeScreen();returnScene={pose:w.getPose(),step:state.step};w.focus('basketball');activeId='basketball';renderHoop();$('#hoop-hud').hidden=false;}
   else if(isMacSubject(id)){w.openScreen('macbook',id==='macbook'&&!routing?undefined:id==='articles'?'writing':id==='mac-resume'?'resume':id,returnTo);activeId=id;screenReturnTo=returnTo;}
   else return;
   updateSurfaces();if(!routing)writeRoute(activeId,push);return;
  }
 }
 if(id==='macbook'||id==='projects'||id==='ideas'){quick();return;}
 const fallbackId=id.replace(/-demo$/,'');if(!projects[fallbackId]&&!findProjectItem(fallbackId,state.lang)&&fallbackId!=='books')return;
 menu(false);lastTrigger=trigger||document.activeElement;returnToQuick=true;activeId=fallbackId;state.quick=true;renderQuick();renderPanel(fallbackId,false);if(!$('#project-dialog').open)$('#project-dialog').show();$('#dialog-title').focus({preventScroll:true});updateSurfaces();if(!routing)writeRoute(id,push);
}
async function setView(view,persist=true,{push=true}={}){
 if(view==='canvas'){await navigate('projects',null,{push});return;}
 await home({push});
}
async function home({push=true}={}){
 menu(false);if($('#home-dialog').open)$('#home-dialog').close();resumeView.close();closePanel({restore:false,route:false});
 if(world?.isScreenOpen())world.closeScreen();state.view='room';state.step=workIndex();state.quick=false;entered=true;opening=false;activeId=null;screenReturnTo=null;
 const w=await initWorld();if(w)w.home();else{state.quick=true;renderQuick();}updateSurfaces();writeRoute(state.quick?'reading':null,push);storage.set('moaaz-view','room');
}
function quick(){menu(false);if(world?.isScreenOpen())world.closeScreen();closePanel({restore:false,route:false});opening=false;state.quick=true;renderQuick();updateSurfaces();if(!routing)writeRoute('reading');$('#quick-title').focus();}
async function enterRoom(){await home();}
async function showChapter(index=state.step,{push=true}={}){const id=chapters[Math.max(0,Math.min(stops.length-1,index))].station;await navigate(id,null,{push});}
function renderUnboxing(){const c=t();$('#unboxing-title').textContent=projects.work[state.lang].title;$('#unboxing-status').textContent=unboxing.phase==='complete'?c.unboxingComplete:unboxing.phase==='unpacking'?c.unboxingBusy:c.unboxingReady;$('#unboxing-start').hidden=unboxing.phase!=='idle';$('#unboxing-replay').hidden=unboxing.phase!=='complete';const keys={'shipment-computer':'unpackComputer','shipment-monitors':'unpackMonitors','shipment-accessories':'unpackAccessories'};$('#unboxing-actions').innerHTML=unboxing.remaining.map(id=>`<button class="quiet" data-unpack="${id}" ${unboxing.phase==='unpacking'?'disabled':''}>${safe(c[keys[id]])}</button>`).join('');$('#unboxing-close').setAttribute('aria-label',c.close);}
function personalSections(id){const keys=id==='future'?['ambitions','travel','ideas']:['books','media','food'];return keys.filter(k=>personalContent[k]).map(k=>{const p=personalContent[k],d=p[state.lang];return `<section class="reading-personal"><h3>${safe(d.title)}</h3><p>${safe(d.body)}</p>${p.items.map(i=>`<p><strong>${safe(i[state.lang].title)}</strong> — ${safe(i[state.lang].body)}</p>`).join('')}${p.links.map(link).join(' ')}</section>`}).join('');}
function renderPanel(id, preserve) {
  const c=t(), item=findProjectItem(id,state.lang), p=projects[id], host=$("#dialog-content");
  if(id==='books'||(!p&&item)){
   const d=id==='books'?personalContent.books[state.lang]:item;
   $("#dialog-title").textContent=d.title;
   for(const [key,panel]of panels)panel.node.hidden=key!==id;
   let cached=panels.get(id);if(!cached){const node=document.createElement('div');host.append(node);cached={node,demo:null};panels.set(id,cached);}cached.node.hidden=false;const readingHost=cached.node;
   if(id==='books'){const section=personalContent.books;readingHost.innerHTML=`<p>${safe(d.body)}</p>${section.items.map(i=>`<h3>${safe(i[state.lang].title)}</h3><p>${safe(i[state.lang].body)}</p>`).join('')}${section.links.map(link).join(' ')}`;}
   else readingHost.innerHTML=`<p class="project-meta">${safe(item.status)}</p><p>${safe(item.description)}</p>${item.href?`<a href="${safe(item.href)}" target="_blank" rel="noopener">${state.lang==='ar'?'شوف المصدر الأصلي':'See the original source'}</a>`:''}`;
   return;
  }
  if(!p)return;const d=p[state.lang];
  $("#dialog-title").textContent=d.title;
  for (const [key, panel] of panels) panel.node.hidden=key !== id;
  let cached=panels.get(id);
  if (cached) {
    cached.node.hidden=false; demo=cached.demo;
    const q=sel=>cached.node.querySelector(sel);
    if(id==="about" || id==="work") { renderAbout(cached.node,p,d); return; }
    if(id==="personal" || id==="future") { cached.node.innerHTML=`<span class="project-meta">${safe(d.tag)}</span><p>${safe(d.body)}</p>${personalSections(id)}`;return; }
    for(const key of ["status","short","body","next","detail"]) {
      const el=q(`[data-panel="panel-${key}"]`); if(el) el.textContent=key === "status" ? d.tag : d[key];
    }
    q('[data-panel="context-label"]').textContent=c.read;
    q('[data-panel="panel-links"]').innerHTML=p.links.map(link).join("");
    demo?.setLanguage(state.lang);
    const finance=q("#haweshly-frame");
    if(finance) {finance.title=d.title;finance.contentWindow?.postMessage({type:"haweshly-language",lang:state.lang},location.origin);}
    const art=q('[data-panel="art-image"]');
    if(art) {
      art.alt=id === "tourism" ? (state.lang === "ar" ? "الواجهات الأولية الأصلية من ٢٠٢٠" : "Original 2020 interface wireframes") : (state.lang === "ar" ? "رسمة Love on the Go الشخصية" : "Love on the Go personal illustration");
      q('[data-panel="art-zoom-label"]').textContent=state.lang === "ar" ? "بص على التفاصيل" : "Look closer";
    }
    if(id==="articles") [...cached.node.querySelectorAll(".article-tile span")].forEach((el,i)=>el.textContent=articles[i][state.lang]+" ↗");
    return;
  }
  const node=document.createElement("div");node.className="retained-panel";node.dataset.project=id;host.append(node);
  cached={node,demo:null}; panels.set(id,cached);demo=null;
  const q=sel=>node.querySelector(sel);
  if(id==="about" || id==="work") {renderAbout(node,p,d);return;}
  if(id==="personal" || id==="future") {node.innerHTML=`<span class="project-meta">${safe(d.tag)}</span><p>${safe(d.body)}</p>${personalSections(id)}`;return;}
  node.innerHTML=`<span data-panel="panel-status" class="project-meta">${safe(d.tag)}</span><div class="project-intro"><div><h3 data-panel="panel-short">${safe(d.short)}</h3></div>${id === "tabs" ? `<img src="${p.image}" alt="TABS" width="62" height="62">` : ""}</div><div data-panel="tool-area"></div><div class="project-context"><details><summary data-panel="context-label">${c.read}</summary><p data-panel="panel-body">${safe(d.body)}</p><p data-panel="panel-next">${safe(d.next)}</p><p data-panel="panel-detail">${safe(d.detail)}</p></details><div data-panel="panel-links" class="project-links">${p.links.map(link).join("")}</div></div>`;
  const area=q('[data-panel="tool-area"]');
  if(id==="fishing") { import("./fishing-demo.js?v=single-studio-3").then(({mountFishingDemo})=>{cached.demo=mountFishingDemo(area,{lang:state.lang});cached.demo.setActive?.(activeId===id&&$("#project-dialog").open);}); }
  else if(id==="basketball") area.innerHTML=`<p>${safe(t().fallback)}</p>`;
  else if(id==="tabs") demo=mountTabsDemo(area,{lang:state.lang});
  else if(id==="rfid") demo=mountRfidDemo(area,{lang:state.lang});
  else if(id==="haweshly") area.innerHTML=`<iframe id="haweshly-frame" class="demo-frame" title="${safe(d.title)}" src="projects/haweshly/?lang=${state.lang}" loading="eager"></iframe>`;
  else if(id==="art" || id==="tourism") {
    area.innerHTML=`<div class="art-viewer"><img data-panel="art-image" src="${p.image}" alt="${safe(id === "tourism" ? (state.lang === "ar" ? "الواجهات الأولية الأصلية من ٢٠٢٠" : "Original 2020 interface wireframes") : state.lang === "ar" ? "رسمة Love on the Go الشخصية" : "Love on the Go personal illustration")}"></div><label class="zoom-control"><span data-panel="art-zoom-label">${state.lang === "ar" ? "بص على التفاصيل" : "Look closer"}</span> <input data-panel="art-zoom" type="range" min="100" max="250" value="100" step="10"><output data-panel="art-zoom-output">100%</output></label>`;
    q('[data-panel="art-zoom"]').addEventListener("input",e=> {const n=Number(e.target.value);q('[data-panel="art-image"]').style.width=`${n}%`;q('[data-panel="art-image"]').style.flexShrink="0";q('[data-panel="art-zoom-output"]').textContent=`${n}%`;});
  } else if(id==="articles") area.innerHTML=`<div class="article-gallery">${articles.map(a=>`<a class="article-tile" href="${a.url}" target="_blank" rel="noopener"><img src="${a.image}" alt="${safe(a[state.lang])}" width="300" height="200" loading="lazy"><span>${safe(a[state.lang])} ↗</span></a>`).join("")}</div>`;
  cached.demo=demo;
}
function renderAbout(node,p,d) {
  node.innerHTML=`<div class="about-grid text-about"><div><span class="project-meta">${safe(d.tag)}</span><h3>${safe(d.short)}</h3><p>${safe(d.body)}</p><p>${safe(d.next)}</p><div class="project-links">${p.links.map(link).join("")}</div></div></div><div class="work-stories">${(p===projects.work ? workStories[state.lang] : []).map(w=>`<section><h3>${safe(w.title)}</h3><p>${safe(w.body)}</p></section>`).join("")}</div>`;
}

function renderQuick() {
  const c = t();
  $("#quick-title").textContent = c.quickTitle;
  $("#quick-lead").textContent = c.quickIntro;
  $("#quick-grid").innerHTML = Object.entries(projects).filter(([id])=>id!=='kyc-bike')
    .map(
      ([id, p]) =>
        `<article class="quick-card" id="quick-${id}">${glyph(p.icon)}<h2>${safe(p[state.lang].title)}</h2><p>${safe(p[state.lang].tag)}</p><p>${safe(p[state.lang].body)}</p><button class="quiet" data-station="${id}">${c.open} ↗</button></article>`,
    )
    .join("");
  $("#quick-grid").innerHTML+=buildProjectLibrary(state.lang).filter(i=>!projects[i.id]&&i.area==='projects').map(i=>`<article class="quick-card"><h2>${safe(i.title)}</h2><p>${safe(i.status)}</p><p>${safe(i.description)}</p><a href="${safe(i.href)}" target="_blank" rel="noopener">${state.lang==='ar'?'الشغل الأصلي على Behance':'Original work on Behance'}</a></article>`).join('');
  $("#quick-work").innerHTML =
    `${Object.values(personalContent).map(p => `<section class="reading-personal"><h2>${safe(p[state.lang].title)}</h2><p>${safe(p[state.lang].body)}</p><p>${safe(p[state.lang].next)}</p>${p.items.map(i => `<p><strong>${safe(i[state.lang].title)}</strong> — ${safe(i[state.lang].body)}</p>`).join("")}<div class="project-links">${p.links.map(link).join("")}</div></section>`).join("")}<div class="work-stories">${workStories[state.lang].map((w) => `<section><h3>${safe(w.title)}</h3><p>${safe(w.body)}</p></section>`).join("")}</div><div class="quick-links"><a href="${LINKS.linkedin}" target="_blank" rel="noopener">${c.connect} ↗</a><a href="${LINKS.behance}" target="_blank" rel="noopener">Behance ↗</a><a href="${LINKS.github}" target="_blank" rel="noopener">GitHub ↗</a></div>`;
}
function renderHoop() {
  const c = t();
  $("#shot-result").textContent =
    shotBusy || lastShotResult === null
      ? ""
      : lastShotResult
        ? c.scored
        : c.missed;
  $("#hoop-title").textContent = projects.basketball[state.lang].title;
  $("#shot-button").textContent = shotBusy ? c.busy : c.shot;
  $("#hoop-help").textContent = c.shotKeys;
  $("#hoop-work").textContent = projects.basketball[state.lang].body;
  $("#hoop-score").textContent = `${c.score}: ${score}`;
  $("#hoop-links").innerHTML = projects.basketball.links.map(link).join("");
  $("#hoop-close").setAttribute("aria-label", c.close);
  $("#shot-aim-label").textContent =
    state.lang === "ar" ? "أو اختار القوة" : "Or set the power";
  $("#take-shot").textContent = state.lang === "ar" ? "ارمي" : "Shoot";
  $("#take-shot").disabled = shotBusy;
}
function startCharge(e) {
  if (shotBusy || !world || charging) return;
  e?.preventDefault();
  charging = true;
  chargeStart = performance.now();
  if (e?.pointerId !== undefined) {
    try {
      $("#shot-button").setPointerCapture(e.pointerId);
    } catch {}
  }
  const tick = () => {
    if (!charging) return;
    const p = Math.min(1, (performance.now() - chargeStart) / 1350);
    $("#power-fill").style.width = `${p * 100}%`;
    $("#shot-power").setAttribute("aria-valuenow", String(Math.round(p * 100)));
    chargeFrame = requestAnimationFrame(tick);
  };
  tick();
}
function stopCharge(shoot = true) {
  if (!charging) return;
  const p = Math.min(1, (performance.now() - chargeStart) / 1350);
  charging = false;
  cancelAnimationFrame(chargeFrame);
  if (shoot && world) {
    shotBusy = world.shoot(p) !== false;
    $("#shot-button").disabled = shotBusy;
    renderHoop();
  }
}
function updateLanguage(){state.lang=state.lang==='en'?'ar':'en';storage.set('moaaz-lang',state.lang);localise();writeRoute(state.quick?'reading':activeId,false);}
const resumeView=mountResume(document.body,{lang:state.lang,view:state.view,onOpen:()=>updateSurfaces(),onClose:()=>{updateSurfaces();if(!routing)writeRoute(state.quick?'reading':activeId,false);}});
$('#resume-link').onclick=e=>{e.preventDefault();navigate('resume');};
$('#menu-button').onclick=()=>menu($('#menu').hidden);$('#lang').onclick=updateLanguage;$('#dialog-lang').onclick=updateLanguage;
$('#brand').onclick=home;$('#home-button').onclick=home;$('#quick-button').onclick=quick;$('#intro-quick').onclick=quick;$('#try-mac').onclick=()=>navigate('work');$('#skip-opening').onclick=enterRoom;
$('#chapter-open').onclick=()=>navigate(chapters[state.step].station);$('#dialog-close').onclick=()=>closePanel();$('#hoop-close').onclick=()=>closePanel();$('#unboxing-close').onclick=()=>{$('#unboxing-hud').hidden=true;};
$('#unboxing-start').onclick=()=>world?.startUnboxing();$('#unboxing-replay').onclick=()=>world?.replayUnboxing();$('#unboxing-actions').onclick=e=>{const b=e.target.closest('[data-unpack]');if(b)world?.unpack(b.dataset.unpack);};
$('#home-close').onclick=()=>$('#home-dialog').close();$('#home-dialog').onclick=()=>{};
$('#restart-button').onclick=async()=>{storage.remove('moaaz-view');await home();state.step=workIndex();world?.home();try{history.replaceState(null,'',location.pathname+'?lang='+state.lang+'&view=room')}catch{}};
$('#motion-button').onclick=()=>{motionOff=!motionOff;world?.setReducedMotion?.(motionOff);localise();};$('#credits-button').onclick=()=>toast(t().creditsBody);
$('#tidy-canvas').onclick=()=>{};$('#skip').onclick=e=>{e.preventDefault();quick();};
$('#take-shot').onclick=()=>{if(shotBusy||!world)return;shotBusy=world.shoot(Number($('#shot-aim').value)/100)!==false;$('#shot-button').disabled=shotBusy;renderHoop();};
$('#shot-button').addEventListener('pointerdown',startCharge);$('#shot-button').addEventListener('pointerup',()=>stopCharge(true));$('#shot-button').addEventListener('pointercancel',()=>stopCharge(false));$('#shot-button').addEventListener('lostpointercapture',()=>stopCharge(false));
$('#story-next').onclick=()=>showChapter((state.step+1)%stops.length);$('#story-prev').onclick=()=>showChapter((state.step-1+stops.length)%stops.length);
// The Room wheel belongs to camera zoom; it never chooses a chapter.
document.addEventListener('click',e=>{const b=e.target.closest('[data-station]');if(b)navigate(b.dataset.station,b);if(!e.target.closest('#menu,#menu-button')&&!$('#menu').hidden)menu(false);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!e.defaultPrevented){if(document.querySelector('.resume-view[open]'))return;menu(false);if(world?.isScreenOpen()){world.backScreen();return;}if(activeId)closePanel();}if(activeId==='basketball'&&e.target===$('#shot-button')&&e.code==='Space'&&!e.repeat)startCharge(e);});document.addEventListener('keyup',e=>{if(e.code==='Space')stopCharge(true);});
async function route(){
 routing=true;try{
  const raw=location.hash.slice(1),params=new URLSearchParams(location.search),lang=params.get('lang');
  let id=aliasSubject(({experience:'work',contact:'about',illustration:'art',main:'projects'}[raw]||raw));
  if(!id&&params.get('view')==='canvas')id='projects';
  if(!id||id.startsWith('chapter-'))id=id.startsWith('chapter-')?(chapters.find(ch=>ch.id===id.slice(8))?.station||'studio'):'studio';
  resumeView.close();$('#project-dialog').close();
  if(['en','ar'].includes(lang)&&lang!==state.lang){state.lang=lang;storage.set('moaaz-lang',lang);localise();}
  if(id==='reading'){quick();return;}
  if(id==='studio'){if(world?.isScreenOpen())world.closeScreen();activeId=null;state.quick=false;const mounted=await initWorld();state.quick=!mounted;if(!mounted)renderQuick();updateSurfaces();writeRoute(mounted?null:'reading',false);return;}
  state.quick=false;await navigate(id,null,{push:false,returnTo:history.state?.returnTo||null});updateSurfaces();writeRoute(activeId||id,false);
 }finally{routing=false;}
}
window.addEventListener('popstate',route);window.addEventListener('hashchange',()=>{const expected=state.quick?'reading':activeId||'studio';if(aliasSubject(location.hash.slice(1))!==expected)route();});
async function initWorld(){if(world)return world;if(worldUnavailable)return null;if(worldLoading)return worldLoading;worldLoading=loadWorld().finally(()=>worldLoading=null);return worldLoading;}
async function loadWorld(){try{const {createWorld}=await import('./world.js?v=studio-spacing-1');world=await createWorld($('#world'),{lang:state.lang,reducedMotion:motionOff,onSelect:id=>navigate(id),onScreenNavigate:next=>{if(routing)return;activeId=next.subject==='writing'?'articles':next.subject==='resume'?'mac-resume':next.subject;screenReturnTo=next.returnTo||null;updateSurfaces();writeRoute(activeId,!next.replace);},onScreenExit:()=>{activeId=null;screenReturnTo=null;updateSurfaces();if(!routing)writeRoute(null);},onActionChange:next=>{if(next.phase==='approach')toast(state.lang==='ar'?'قرّب من الحاجة الأول، وبعدها دوس عليها.':'Move closer, then click the object.');if(next.phase==='unpack-first')toast(state.lang==='ar'?'الماك لسه في الكرتونة. افتحها الأول.':'The Mac is still in its carton. Open that first.');if(next.phase==='walking'&&next.mode==='manual'){activeId=null;roomMoved=true;roomHelp.hidden=true;}const step=stops.indexOf(next.chapter);if(step>=0&&state.view==='room'){state.step=step;if(!activeId&&!routing)writeRoute(null,false);}},onUnboxingChange:next=>{unboxing=next;renderUnboxing();},onHover:h=>{const el=$('#hover-label');if(!h||opening||state.quick){el.hidden=true;return;}const hoverId=h.id==='play'?'fishing':['make','canvas','board'].includes(h.id)?'projects':h.id;const special={projects:{title:state.lang==='ar'?'المشاريع والأفكار':'Projects & Ideas',short:state.lang==='ar'?'افتحهم على الماك.':'Open them on the Mac.'},books:{title:state.lang==='ar'?'القراءة':'Reading',short:state.lang==='ar'?'على الرف ودلوقتي.':'On the shelf and on my mind.'},macbook:{title:state.lang==='ar'?'ماك معاذ':'Moaaz’s Mac',short:''},resume:{title:state.lang==='ar'?'السيرة الذاتية':'Résumé',short:''}};const d=special[hoverId]||(hoverId.startsWith('shipment-')?{title:t()[({'shipment-computer':'unpackComputer','shipment-monitors':'unpackMonitors','shipment-accessories':'unpackAccessories'})[h.id]],short:''}:projects[hoverId]?.[state.lang]);if(!d){el.hidden=true;return;}el.innerHTML=`${safe(d.title)}<small>${safe(d.short)}</small>`;el.style.left=`${Math.min(innerWidth-220,Math.max(8,h.x+12))}px`;el.style.top=`${Math.max(80,Math.min(innerHeight-100,h.y+12))}px`;el.hidden=false;},onShotResult:r=>{shotBusy=false;$('#shot-button').disabled=false;if(r.scored)score++;lastShotResult=r.scored;toast(r.scored?(state.lang==='ar'?'دخلت. '+score:'In. '+score):(state.lang==='ar'?'قريبة. جرّب تاني.':'Close. Try again.'));$('#power-fill').style.width='0%';renderHoop();}});$('#world-status').hidden=true;world.setMode('explore');world.home();return world;}catch(e){worldUnavailable=true;console.warn('World unavailable:',e.message);$('#world-status').textContent=t().fallback;quick();return null;}}
$('#world').addEventListener('world-context-lost',()=>{worldUnavailable=true;world?.destroy();world=null;toast(t().fallback);quick();});
document.documentElement.classList.add('js-ready');$('#static-fallback').hidden=true;localise();updateSurfaces();
route();
if(['127.0.0.1','localhost'].includes(location.hostname)){
 const proof=document.createElement('output');proof.id='preview-metrics';proof.hidden=true;proof.dataset.cls='0';document.body.append(proof);
 for(const type of ['largest-contentful-paint','layout-shift'])try{new PerformanceObserver(list=>{for(const e of list.getEntries())if(type==='largest-contentful-paint')proof.dataset.lcpMs=String(Math.round(e.startTime));else if(!e.hadRecentInput)proof.dataset.cls=String(Number(proof.dataset.cls)+e.value);}).observe({type,buffered:true});}catch{}
 if(query.get('qa')==='1'){const b=document.createElement('button');b.textContent='QA: simulate unavailable 3D';b.id='qa-context-loss';b.className='quiet';b.style.cssText='position:fixed;top:90px;left:20px;z-index:90';document.body.append(b);b.onclick=()=>{const gl=$('#world canvas')?.getContext('webgl2');gl?.getExtension('WEBGL_lose_context')?.loseContext();b.remove();};}
}
