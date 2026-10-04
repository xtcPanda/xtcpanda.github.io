import { projects, personalContent, articles, workStories } from '../content.js';
import { mountTabsDemo } from '../tabs-demo.js';
import { mountRfidDemo } from '../rfid-demo.js';
import { mountFishingDemo } from '../fishing-demo.js';
import { mountCanvas } from '../canvas-workspace.js';
import { findProjectItem } from '../project-library.js';

const COPY = {
  en: {
    title: 'Moaaz’s Mac', simulation: 'Virtual desktop · browser simulation',
    exit: 'Back to the room', desktop: 'Back to Desktop', projects: 'Projects & Ideas', about: 'About', workspace: 'Back to Projects & Ideas', demo: 'Open browser demonstration', projectContext: 'Project context',
    ideas: 'Ideas', writing: 'Writing', resume: 'Résumé', work: 'Work',
    folders: 'Virtual desktop apps and files', original: 'Original work', more: 'Context',
    download: 'Download PDF', resumeEnglish: 'Résumé in English',
    open: 'Open', hint: 'Choose a file. Everything opens inside this screen.',
    arcade: 'Office Tide', arcadeHelp: 'Aim with the slider or ← / →. Enter or Space drops the hook.',
    paused: 'Screen paused.', unavailable: 'That file could not open.',
  },
  ar: {
    title: 'ماك معاذ', simulation: 'مكتب افتراضي · محاكاة في المتصفح',
    exit: 'ارجع للأوضة', desktop: 'ارجع للمكتب', projects: 'المشاريع والأفكار', about: 'عنّي', workspace: 'ارجع للمشاريع والأفكار', demo: 'افتح تجربة المتصفح', projectContext: 'عن المشروع',
    ideas: 'الأفكار', writing: 'الكتابة', resume: 'السيرة الذاتية', work: 'الشغل',
    folders: 'تطبيقات وملفات المكتب الافتراضي', original: 'الشغل الأصلي', more: 'عن المشروع',
    download: 'حمّل PDF', resumeEnglish: 'السيرة الذاتية بالإنجليزي',
    open: 'افتح', hint: 'اختار ملف. كل حاجة بتفتح جوّه الشاشة دي.',
    arcade: 'استراحة صيد', arcadeHelp: 'صوّب بالمؤشر أو ← / →. Enter أو Space بينزّل السنّارة.',
    paused: 'الشاشة متوقّفة.', unavailable: 'الملف ده مش متاح دلوقتي.',
  },
};
const FILES = [['work', '▧'], ['projects', '▰'], ['writing', '▱'], ['about', '☺'], ['resume', 'PDF']];
const DEMO_IDS = ['tabs', 'haweshly', 'rfid'];
const langOf = value => String(value).startsWith('ar') ? 'ar' : 'en';
const asset = path => new URL(`../../${path}`, import.meta.url).href;
const text = (doc, tag, value, className = '') => {
  const el = doc.createElement(tag); el.textContent = value; el.className = className; return el;
};

/** Real DOM for a CSS3D iframe; all virtual applications stay inside its display. */
export function mountScreen(host, { device = 'mac', lang = 'en' } = {}) {
  const doc = host.ownerDocument, view = doc.defaultView;
  const controller = new view.AbortController(), options = { signal: controller.signal };
  let language = langOf(lang), current = null, returnTo = null, active = true, destroyed = false, silentNavigation = false;
  let workspacePage = 'projects';
  const mode = device === 'arcade' ? 'arcade' : 'mac';
  const panes = new Map();
  const root = doc.createElement('section');
  root.className = `ps ps--${mode}`;
  root.innerHTML = `
    <header class="ps__bar"><strong data-ui="title"></strong><span class="ps__simulation" data-ui="simulation"></span><button type="button" data-exit data-ui="exit"></button></header>
    <div class="ps__desktop"><nav class="ps__files"></nav><p class="ps__desktop-hint" data-ui="hint"></p><div class="ps__wallpaper" aria-hidden="true"><svg class="ps__signature" viewBox="132 174 1106 804"><image href="${asset('assets/moaaz-akram-signature.png')}" width="1334" height="1179" /></svg></div></div>
    <section class="ps__window" hidden><header class="ps__window-bar"><button type="button" data-home>← <span data-ui="desktop"></span></button><h1></h1></header><div class="ps__panes"></div></section>
    <p class="ps__status" role="status" aria-live="polite" aria-atomic="true"></p>`;
  host.replaceChildren(root);
  const q = selector => root.querySelector(selector);
  const notifyParent = (type, extra = {}) => {
    if (view.parent !== view) view.parent.postMessage({ type, ...extra }, view.location.origin);
  };
  const projectId = id => id?.endsWith('-demo') ? id.slice(0, -5) : id;
  const itemOf = id => findProjectItem(projectId(id), language);
  const dataOf = id => projects[projectId(id)]?.[language] || personalContent[id]?.[language];
  const isProject = id => Boolean(itemOf(id)) || DEMO_IDS.includes(projectId(id)) || ['tourism', 'art'].includes(id);
  const fileTitle = id => id?.endsWith('-demo') ? `${fileTitle(projectId(id))} · ${language === 'ar' ? 'تجربة المتصفح' : 'browser demonstration'}` : COPY[language][id] || dataOf(id)?.title || itemOf(id)?.title || id;
  const subject = () => current === 'projects' ? workspacePage : current || 'macbook';
  const navigate = (replace = false) => { if (!silentNavigation) notifyParent('portfolio-screen-navigate', { subject: subject(), ...(returnTo ? { returnTo } : {}), ...(replace ? { replace: true } : {}) }); };
  const updateBack = () => { q('[data-home] span').textContent = isProject(current) ? COPY[language].workspace : COPY[language].desktop; };
  
  function appendLinks(hostNode, links = []) {
    for (const link of links) {
      const a = text(doc, 'a', `${link.label?.[language] || COPY[language].original} · ${language === 'ar' ? 'رابط خارجي' : 'external'} ↗`);
      a.href = link.url; a.target = '_blank'; a.rel = 'noopener'; hostNode.append(a);
    }
  }

  function makeFile(id, symbol) {
    const button = doc.createElement('button');
    button.type = 'button'; button.className = 'ps__file'; button.dataset.file = id;
    const icon = text(doc, 'span', symbol, 'ps__file-icon'); icon.setAttribute('aria-hidden', 'true');
    if (id === 'tabs') {
      const image = doc.createElement('img'); image.src = asset('assets/tabs-icon-small.png'); image.alt = ''; icon.replaceChildren(image);
    }
    button.append(icon, text(doc, 'b', fileTitle(id))); return button;
  }

  function createPane(id) {
    const node = doc.createElement('article'); node.className = `ps__pane ps__pane--${id}`; node.dataset.pane = id; node.hidden = true;
    q('.ps__panes').append(node);
    const pane = { id, node, demo: null, iframe: null, content: null, copy: null };
    panes.set(id, pane);
    if (id === 'projects') {
      pane.demo = mountCanvas(node, {
        lang: language,
        onOpen: key => openFile(key, { returnTo: workspacePage }),
        onStateChange: state => {
          const nextPage = state.page === 'ideas' ? 'ideas' : 'projects';
          if (nextPage === workspacePage) return;
          workspacePage = nextPage;
          if (current === 'projects') navigate();
        },
      });
    } else if (id === 'writing') {
      const grid = doc.createElement('div'); grid.className = 'ps__writing';
      for (const [index, article] of articles.entries()) {
        const a = doc.createElement('a'); a.href = article.url; a.target = '_blank'; a.rel = 'noopener'; a.dataset.article = index;
        const image = doc.createElement('img'); image.src = asset(article.image); image.alt = ''; image.loading = 'lazy';
        a.append(image, text(doc, 'strong', article[language]), text(doc, 'span', article.description?.[language] || '')); grid.append(a);
      }
      node.append(grid);
    } else if (id === 'resume') {
      const actions = doc.createElement('div'); actions.className = 'ps__document-actions';
      const label = text(doc, 'span', COPY[language].resumeEnglish); label.dataset.ui = 'resumeEnglish';
      const download = text(doc, 'a', COPY[language].download); download.dataset.ui = 'download'; download.href = asset('assets/Moaaz-Akram-Resume-Room.pdf'); download.download = 'Moaaz-Akram-Resume.pdf';
      actions.append(label, download);
      const pdf = doc.createElement('iframe'); pdf.className = 'ps__pdf'; pdf.title = 'Moaaz Akram résumé'; pdf.src = `${asset('assets/Moaaz-Akram-Resume-Room.pdf')}#toolbar=0&navpanes=0`; pane.iframe = pdf; node.append(actions, pdf);
    } else if (dataOf(id) || itemOf(id)) {
      const d = dataOf(id), item = itemOf(id), key = projectId(id), demonstration = id.endsWith('-demo');
      const heading = doc.createElement('header'); heading.className = 'ps__project-heading';
      const tag = text(doc, 'span', demonstration ? (language === 'ar' ? 'تجربة في المتصفح' : 'Browser demonstration') : item?.status || d?.tag || '', 'ps__project-tag'); tag.dataset.projectCopy = 'tag';
      const short = text(doc, 'p', d?.short || item?.subtitle || ''); short.dataset.projectCopy = 'short'; heading.append(tag, short); node.append(heading);
      pane.content = doc.createElement('div'); pane.content.className = 'ps__reading'; node.append(pane.content);
      if (!demonstration && (item?.image || projects[key]?.image)) {
        const image = doc.createElement('img'); image.className = 'ps__project-image'; image.src = asset(item?.image || projects[key].image); image.alt = fileTitle(id); image.loading = 'lazy'; node.append(image);
      }
      if (!demonstration && DEMO_IDS.includes(key)) {
        const open = text(doc, 'button', COPY[language].demo, 'ps__open-demo'); open.type = 'button'; open.dataset.demo = key; open.dataset.ui = 'demo'; node.append(open);
      }
      if (demonstration) {
        const tool = doc.createElement('div'); tool.className = 'ps__tool'; node.append(tool);
        if (key === 'tabs') pane.demo = mountTabsDemo(tool, { lang: language });
        else if (key === 'rfid') pane.demo = mountRfidDemo(tool, { lang: language });
        else if (key === 'haweshly') {
          const finance = doc.createElement('iframe'); finance.className = 'ps__finance'; finance.title = fileTitle(id); finance.src = `${asset('projects/haweshly/')}?lang=${language}&embedded=mac&v=single-studio-1`;
          finance.addEventListener('load', () => finance.contentWindow?.postMessage({ type: 'haweshly-language', lang: language }, view.location.origin), options);
          pane.iframe = finance; tool.append(finance);
        }
        const context = text(doc, 'button', COPY[language].projectContext, 'ps__context-link'); context.type = 'button'; context.dataset.file = key; context.dataset.ui = 'projectContext'; node.append(context);
      }
      if (['about', 'work', 'personal', 'future', ...Object.keys(personalContent)].includes(id)) heading.remove();
    }
    localisePane(pane);
    return pane;
  }

  function localisePane(pane) {
    const { id, node } = pane;
    for (const el of node.querySelectorAll('[data-ui]')) el.textContent = COPY[language][el.dataset.ui];
    for (const file of node.querySelectorAll('[data-file] b')) file.textContent = fileTitle(file.parentElement.dataset.file);
    if (id === 'writing') {
      for (const el of node.querySelectorAll('[data-article]')) {
        const article = articles[Number(el.dataset.article)]; el.querySelector('strong').textContent = article[language]; el.querySelector('span').textContent = article.description?.[language] || '';
      }
    } else if ((dataOf(id) || itemOf(id)) && pane.content) {
      const d = dataOf(id), item = itemOf(id), key = projectId(id), demonstration = id.endsWith('-demo');
      for (const el of node.querySelectorAll('[data-project-copy]')) el.textContent = el.dataset.projectCopy === 'tag'
        ? demonstration ? (language === 'ar' ? 'تجربة في المتصفح' : 'Browser demonstration') : item?.status || d?.tag || ''
        : d?.short || item?.subtitle || '';
      pane.content.replaceChildren();
      if (demonstration) {
        if (item?.demoDescription || d?.detail) pane.content.append(text(doc, 'p', item?.demoDescription || d.detail));
      } else if (id === 'work') {
        for (const entry of workStories[language]) pane.content.append(text(doc, 'h3', entry.title), text(doc, 'p', entry.body));
      } else {
        for (const field of ['body', 'next', 'detail']) if (d?.[field]) pane.content.append(text(doc, 'p', d[field]));
        if (!d && item?.description) pane.content.append(text(doc, 'p', item.description));
      }
      if (personalContent[id]?.items) for (const entry of personalContent[id].items) {
        pane.content.append(text(doc, 'h3', entry[language].title), text(doc, 'p', entry[language].body));
      }
      if (['personal', 'future'].includes(id)) {
        for (const sectionId of id === 'future' ? ['ambitions', 'travel'] : ['books', 'media', 'food']) {
          const section = personalContent[sectionId]; if (!section) continue;
          pane.content.append(text(doc, 'h3', section[language].title), text(doc, 'p', section[language].body)); appendLinks(pane.content, section.links);
        }
      }
      const links = doc.createElement('div'); links.className = 'ps__links';
      appendLinks(links, projects[key]?.links || personalContent[id]?.links);
      if (item?.href && !projects[key]?.links?.some(link => link.url === item.href)) {
        appendLinks(links, [{ url: item.href, label: { en: item.type === 'inspiration' ? 'Inspiration source' : item.href.includes('behance.net') ? 'Original Behance project' : 'Original source', ar: item.type === 'inspiration' ? 'مصدر الإلهام' : item.href.includes('behance.net') ? 'المشروع الأصلي على Behance' : 'المصدر الأصلي' } }]);
      }
      pane.content.append(links);
      pane.demo?.setLanguage(language);
      if (key === 'haweshly' && pane.iframe) {
        pane.iframe.title = fileTitle(id);
        pane.iframe.contentWindow?.postMessage({ type: 'haweshly-language', lang: language }, view.location.origin);
      }
      for (const image of node.querySelectorAll('.ps__project-image')) image.alt = fileTitle(id);
    } else if (id === 'projects') {
      pane.demo?.setLanguage(language);
    }
  }

  function openFile(requested, config = {}) {
    if (mode !== 'mac' || destroyed) return;
    if (requested === 'macbook') { desktop(config); return; }
    let id = requested === 'ideas' || requested === 'canvas' ? 'projects' : requested === 'kyc-bike' ? 'work' : requested;
    if (![...FILES.map(file => file[0]), ...Object.keys(projects), ...Object.keys(personalContent), ...DEMO_IDS.map(key => `${key}-demo`)].includes(id) && !itemOf(id)) return;
    const previousSilence = silentNavigation; silentNavigation = true;
    const pane = panes.get(id) || createPane(id);
    current = id;
    returnTo = isProject(id) ? (['projects', 'ideas'].includes(config.returnTo) ? config.returnTo : 'projects') : null;
    q('.ps__desktop').hidden = true; q('.ps__window').hidden = false;
    for (const entry of panes.values()) { entry.node.hidden = entry !== pane; entry.demo?.setActive?.(active && entry === pane); }
    if (id === 'projects' && !config.preservePage) {
      workspacePage = requested === 'ideas' ? 'ideas' : 'projects';
      pane.demo?.setPage(workspacePage);
    }
    q('.ps__window h1').textContent = fileTitle(id); updateBack();
    q('[data-home]').focus({ preventScroll: true });
    if (id === 'resume') notifyParent('portfolio-screen-resume');
    silentNavigation = previousSilence;
    if (!config.silent) navigate();
  }

  function desktop(config = {}) {
    current = null; returnTo = null; q('.ps__desktop').hidden = false; q('.ps__window').hidden = true;
    for (const pane of panes.values()) { pane.node.hidden = true; pane.demo?.setActive?.(false); }
    q('.ps__files button')?.focus({ preventScroll: true });
    if (!config.silent) navigate();
  }

  function back() {
    if (panes.get(current)?.demo?.cancelAction?.()) return;
    if (mode === 'mac' && isProject(current)) openFile(returnTo || 'projects');
    else if (mode === 'mac' && current) desktop();
    else notifyParent('portfolio-screen-exit');
  }

  function localise() {
    root.lang = language === 'ar' ? 'ar-EG' : 'en'; root.dir = language === 'ar' ? 'rtl' : 'ltr'; doc.documentElement.lang = root.lang; doc.documentElement.dir = root.dir;
    doc.title = mode === 'arcade' ? COPY[language].arcade : COPY[language].title;
    for (const el of root.querySelectorAll('[data-ui]')) el.textContent = COPY[language][el.dataset.ui];
    if (mode === 'arcade') q('.ps__bar strong').textContent = COPY[language].arcade;
    q('.ps__files').setAttribute('aria-label', COPY[language].folders);
    for (const file of q('.ps__files').querySelectorAll('[data-file] b')) file.textContent = fileTitle(file.parentElement.dataset.file);
    for (const pane of panes.values()) localisePane(pane);
    if (current) q('.ps__window h1').textContent = fileTitle(current);
    updateBack();
  }

  root.addEventListener('click', event => {
    if (event.target.closest('[data-exit]')) {
      for (const pane of panes.values()) pane.demo?.setActive?.(false);
      notifyParent('portfolio-screen-exit');
    } else if (event.target.closest('[data-home]')) back();
    else if (event.target.closest('[data-demo]')) openFile(`${event.target.closest('[data-demo]').dataset.demo}-demo`, { returnTo });
    else if (event.target.closest('[data-file]')) openFile(event.target.closest('[data-file]').dataset.file, { returnTo });
  }, options);
  root.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    event.preventDefault();
    back();
  }, options);

  for (const [id, symbol] of FILES) q('.ps__files').append(makeFile(id, symbol));
  if (mode === 'arcade') {
    q('.ps__desktop').hidden = true; q('.ps__window').hidden = false; q('.ps__window-bar').hidden = true;
    const node = doc.createElement('article'); node.className = 'ps__pane ps__pane--arcade'; q('.ps__panes').append(node);
    const demo = mountFishingDemo(node, { lang: language });
    panes.set('arcade', { id: 'arcade', node, demo });
    const help = text(doc, 'p', COPY[language].arcadeHelp, 'ps__arcade-help'); help.dataset.ui = 'arcadeHelp'; node.querySelector('.fd').append(help);
  }
  localise();
  view.addEventListener('message', event => {
    if (event.origin !== view.location.origin || !event.data || typeof event.data !== 'object') return;
    const child = panes.get('haweshly-demo')?.iframe;
    if (child && event.source === child.contentWindow) {
      if (current === 'haweshly-demo' && event.data.type === 'portfolio-demo-back') openFile(returnTo || 'projects');
      else if (current === 'haweshly-demo' && event.data.type === 'portfolio-demo-escape') back();
      return;
    }
    if (event.source !== view.parent) return;
    if (event.data.type === 'portfolio-screen-language' && ['en', 'ar'].includes(event.data.lang)) {
      language = event.data.lang; localise(); panes.get('arcade')?.demo?.setLanguage(language);
    } else if (event.data.type === 'portfolio-screen-open' && typeof event.data.subject === 'string') {
      openFile(event.data.subject, { returnTo: event.data.returnTo, silent: true });
    } else if (event.data.type === 'portfolio-screen-back') {
      back();
    } else if (event.data.type === 'portfolio-screen-active') {
      const wasActive = active; active = Boolean(event.data.active);
      if (active && !wasActive && mode === 'mac') navigate(true);
      for (const pane of panes.values()) pane.demo?.setActive?.(active && (mode === 'arcade' || pane.id === current));
    }
  }, options);
  notifyParent('portfolio-screen-ready', { device: mode });
  return {
    openFile,
    setLanguage(next) { language = langOf(next); localise(); panes.get('arcade')?.demo?.setLanguage(language); },
    setActive(value) { const wasActive = active; active = Boolean(value); if (active && !wasActive && mode === 'mac') navigate(true); for (const pane of panes.values()) pane.demo?.setActive?.(active && (mode === 'arcade' || pane.id === current)); },
    destroy() { if (destroyed) return; destroyed = true; controller.abort(); for (const pane of panes.values()) pane.demo?.destroy?.(); root.remove(); },
  };
}

const bootHost = document.querySelector('#screen-root');
if (bootHost) {
  const params = new URLSearchParams(location.search);
  try { mountScreen(bootHost, { device: params.get('device'), lang: params.get('lang') || 'en' }); }
  catch {
    bootHost.replaceChildren(text(document, 'p', COPY[langOf(params.get('lang'))].unavailable));
  }
}
