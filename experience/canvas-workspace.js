import { buildProjectLibrary } from './project-library.js';

const COPY = {
  en: {
    title: 'Projects & Ideas', pages: '2 areas', pageChooser: 'Choose an area', projectsPage: 'Projects', ideasPage: 'Ideas & inspiration',
    projectsTitle: 'Projects', projectsLead: 'Original work, prototypes and things you can try. Open a card to read more.',
    ideasTitle: 'Ideas & inspiration', ideasLead: 'Unfinished concepts and credited references. Ideas are still unbuilt.',
    select: 'Select', hand: 'Pan', marker: 'Draw', stamp: 'Stamp', eraser: 'Erase',
    clear: 'Clear marks', reset: 'Reset workspace', fit: 'Fit width', zoomIn: 'Zoom in', zoomOut: 'Zoom out',
    tools: 'Tools', colours: 'Drawing colours', blue: 'Royal blue', peach: 'Pale peach', ink: 'Charcoal',
    star: 'Star', ring: 'Circle', arrow: 'Arrow', stamps: 'Stamp shape', open: 'Open details', move: 'Move card',
    hint: 'Select: drag a card by its handle, or use arrow keys on the handle. Enter opens details. Pan: drag the workspace. Draw or Stamp adds marks; Erase removes them. Escape cancels a tool first.',
    mobile: 'Scroll to explore. Open Tools to draw, move cards or zoom.',
    label: 'Projects and ideas workspace', ready: 'Explore the workspace.', cleared: 'Marks cleared in this area. Cards kept where you put them.',
    resetDone: 'Both areas, marks and zoom returned to the starting workspace.', moved: 'Card moved.',
    erased: 'Mark erased.', marked: 'Mark added.', sheet: 'MOVE CARD', footer: 'Keep exploring', selected: ' selected',
    preview: 'Project card', creator: 'Inside the studio Mac',
  },
  ar: {
    title: 'المشاريع والأفكار', pages: 'مساحتين', pageChooser: 'اختار المساحة', projectsPage: 'المشاريع', ideasPage: 'أفكار وإلهام',
    projectsTitle: 'المشاريع', projectsLead: 'شغل أصلي، ونماذج أولية، وحاجات تجرّبها. افتح بطاقة عشان تقرا أكتر.',
    ideasTitle: 'أفكار وإلهام', ideasLead: 'أفكار لسه ما اتعملتش، ومراجع بأسماء أصحابها.',
    select: 'اختار', hand: 'حرّك اللوحة', marker: 'ارسم', stamp: 'ختم', eraser: 'امسح',
    clear: 'امسح العلامات', reset: 'رجّع المساحة للبداية', fit: 'ظبّط العرض', zoomIn: 'كبّر', zoomOut: 'صغّر',
    tools: 'الأدوات', colours: 'ألوان الرسم', blue: 'أزرق', peach: 'خوخي فاتح', ink: 'فحمي',
    star: 'نجمة', ring: 'دايرة', arrow: 'سهم', stamps: 'شكل الختم', open: 'افتح التفاصيل', move: 'حرّك البطاقة',
    hint: 'اختار: اسحب البطاقة من المقبض، أو حرّكها بالأسهم وإنت واقف عليه. Enter بيفتح التفاصيل. حرّك اللوحة: اسحب المساحة. القلم والختم بيضيفوا علامات؛ المسح بيشيلها. Escape بيوقف الأداة الأول.',
    mobile: 'اسكرول عشان تستكشف. افتح الأدوات للرسم وتحريك البطاقات والتكبير.',
    label: 'مساحة المشاريع والأفكار', ready: 'خد راحتك واستكشف.', cleared: 'علامات المساحة دي اتمسحت. البطاقات فضلت في مكانها.',
    resetDone: 'المساحتين والعلامات والتكبير رجعوا للبداية.', moved: 'البطاقة اتحرّكت.',
    erased: 'العلامة اتمسحت.', marked: 'العلامة اتضافت.', sheet: 'حرّك البطاقة', footer: 'كمّل استكشاف', selected: ' متحدد',
    preview: 'بطاقة مشروع', creator: 'جوه ماك الاستوديو',
  },
};
const WIDTH = 1100;
const HEIGHT = 540;
const NS = 'http://www.w3.org/2000/svg';
const COLOURS = { blue: '#325fe8', peach: '#edc4b2', ink: '#181b23' };
const TOOLS = ['select', 'hand', 'marker', 'stamp', 'eraser'];
const PAGES = ['projects', 'ideas'];
const PAGE_KEYS = { projects: ['projectsTitle', 'projectsLead'], ideas: ['ideasTitle', 'ideasLead'] };
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const languageOf = (value) => String(value).startsWith('ar') ? 'ar' : 'en';
const copy = (value) => JSON.parse(JSON.stringify(value));
const finite = (value, fallback) => Number.isFinite(value) ? value : fallback;
const svgNode = (doc, tag, attrs = {}) => {
  const node = doc.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
};

// Native scroll coordinates stay physical in both languages; text direction is separate.
export function makeCanvasLayout(items, boardWidth = WIDTH, heights = [], startY = 136) {
  const width = Math.max(280, boardWidth);
  const columns = width >= 980 ? 3 : width >= 620 ? 2 : 1;
  const gutter = columns === 1 ? 22 : 30;
  const gap = columns === 1 ? 32 : 35;
  const slot = (width - gutter * 2 - gap * (columns - 1)) / columns;
  const cardWidth = Math.min(slot, 360);
  const rows = [];
  return items.map((item, index) => {
    const column = index % columns, row = Math.floor(index / columns);
    if (rows[row] === undefined) {
      rows[row] = row === 0 ? startY : rows[row - 1] + Math.max(...Array.from({length: columns}, (_, col) => heights[(row - 1) * columns + col] || 410)) + 58;
    }
    const shift = columns === 1 ? 0 : [0, 18, 7][column];
    const x = gutter + column * (slot + gap) + (slot - cardWidth) / 2;
    const angle = columns === 1 ? (index % 2 ? 1.1 : -1.1) : [-1.6, 1.3, -1][index % 3];
    return { id: item.id, x, y: rows[row] + shift, width: cardWidth, height: heights[index] || 410, angle, z: index + 1 };
  });
}

function boardHeight(layout) {
  return Math.max(HEIGHT, ...layout.map((item) => item.y + (item.height || 410) + 132));
}

export function markHit(mark, x, y, radius = 20) {
  if (mark.type === 'stamp') return Math.hypot(mark.x - x, mark.y - y) < radius + 37;
  const points = mark.points || [];
  if (points.length === 1) return Math.hypot(points[0][0] - x, points[0][1] - y) <= radius;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1], [bx, by] = points[i];
    const dx = bx - ax, dy = by - ay;
    const t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    if (Math.hypot(x - ax - t * dx, y - ay - t * dy) <= radius) return true;
  }
  return false;
}

function validMarks(marks) {
  if (!Array.isArray(marks)) return [];
  return marks.slice(-300).filter((mark) => mark && COLOURS[mark.colour] &&
    (mark.type === 'stamp' ? Number.isFinite(mark.x) && Number.isFinite(mark.y) && ['star', 'ring', 'arrow'].includes(mark.shape) :
      mark.type === 'line' && Array.isArray(mark.points) && mark.points.length && mark.points.every((p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite))))
    .map((mark) => mark.type === 'line' ? { ...mark, points: mark.points.slice(0, 3500) } : { ...mark });
}

export function mountCanvas(host, { lang = 'en', items, onOpen = () => {}, state: initial, onStateChange = () => {} } = {}) {
  if (!host?.ownerDocument) throw new TypeError('Canvas needs a host element.');
  const doc = host.ownerDocument, view = doc.defaultView;
  const controller = new view.AbortController();
  const options = { signal: controller.signal };
  let language = languageOf(lang), libraryItems = !Array.isArray(items), allProjects = [], projects = [], layout = [], marks = validMarks(initial?.marks);
  let tool = TOOLS.includes(initial?.tool) ? initial.tool : 'select';
  let colour = COLOURS[initial?.colour] ? initial.colour : 'blue';
  let stamp = ['star', 'ring', 'arrow'].includes(initial?.stamp) ? initial.stamp : 'star';
  let zoom = clamp(finite(initial?.zoom, 1), 0.25, 1.6);
  let selected = null, gesture = null, destroyed = false, active = true, scrollFrame = 0, height = HEIGHT;
  let width = WIDTH, bases = [], lastWidth = 0;
  let page = PAGES.includes(initial?.page) ? initial.page : 'projects';
  const pageLayouts = initial?.pageLayouts && typeof initial.pageLayouts === 'object' ? copy(initial.pageLayouts) : {};
  let changingPage = false;
  const pageViews = initial?.pageViews && typeof initial.pageViews === 'object' ? copy(initial.pageViews) : {};
  const pageMarks = initial?.pageMarks && typeof initial.pageMarks === 'object' ? copy(initial.pageMarks) : {};
  marks = validMarks(pageMarks[page] || marks);
  let toolsOpen = Boolean(initial?.toolsOpen);
  const pageWidths = initial?.pageWidths && typeof initial.pageWidths === 'object' ? copy(initial.pageWidths) : {};
  const pageStarts = initial?.pageStarts && typeof initial.pageStarts === 'object' ? copy(initial.pageStarts) : {};
  const root = doc.createElement('section');
  root.className = 'cw';
  root.innerHTML = `
    <header class="cw__intro"><div class="cw__heading"><b data-copy="title"></b><nav class="cw__areas">${PAGES.map(name => `<button type="button" data-page="${name}" data-copy="${name}Page"></button>`).join('')}</nav></div><button class="cw__tools-toggle" type="button" data-action="tools" data-copy="tools" aria-expanded="false" aria-controls="cw-tools"></button></header>
    <div class="cw__toolbar" id="cw-tools" role="group" hidden>
      <div class="cw__tools">${TOOLS.map((name) => `<button type="button" data-tool="${name}"><span aria-hidden="true">${{ select: '↖', hand: '✋', marker: '╱', stamp: '✳', eraser: '▱' }[name]}</span><b data-copy="${name}"></b></button>`).join('')}</div>
      <div class="cw__colour-group" role="group">${Object.keys(COLOURS).map((name) => `<button type="button" data-colour="${name}" style="--swatch:${COLOURS[name]}"><span></span></button>`).join('')}</div>
      <label class="cw__stamp-choice"><span data-copy="stamps"></span><select data-stamp>${['star','ring','arrow'].map((name) => `<option value="${name}" data-copy="${name}"></option>`).join('')}</select></label>
      <div class="cw__zoom"><button type="button" data-action="out">−</button><output class="cw__zoom-value"></output><button type="button" data-action="in">+</button><button type="button" data-action="fit" data-copy="fit"></button></div>
      <div class="cw__clears"><button type="button" data-action="clear" data-copy="clear"></button><button type="button" data-action="reset" data-copy="reset"></button></div>
      <p class="cw__hint" data-copy="hint"></p>
    </div>
    <div class="cw__viewport" tabindex="0"><div class="cw__extent"><div class="cw__plane">
      <header class="cw__board-title"><h2 class="cw__hero-title"></h2><p class="cw__hero-lead"></p></header>
      <div class="cw__cards"></div><svg class="cw__marks" aria-hidden="true"></svg>
    </div></div></div>
    <p class="cw__status" role="status" aria-live="polite"></p>`;
  host.append(root);
  const q = (selector) => root.querySelector(selector);
  const viewport = q('.cw__viewport'), extent = q('.cw__extent'), plane = q('.cw__plane');
  const cards = q('.cw__cards'), drawing = q('.cw__marks'), status = q('.cw__status');
  let lastStatus = 'ready';
  const tell = (key) => { lastStatus = key; status.textContent = COPY[language][key]; };
  const notify = () => { if (!destroyed && !changingPage) onStateChange(getState()); };
  function boardStart() { return Math.max(viewport.clientWidth<600 && view.innerHeight<300 ? 10 : 120, q('.cw__board-title').offsetTop + q('.cw__board-title').offsetHeight + 32); }
  function pageProjects() { return allProjects.filter(item => (item.page || item.area || 'projects') === page); }
  function rememberPage() {
    pageLayouts[page] = copy(layout); pageStarts[page] = bases[0]?.y ?? boardStart(); pageWidths[page] = width;
    pageViews[page] = { zoom, scrollX: viewport.scrollLeft, scrollY: viewport.scrollTop };
    pageMarks[page] = copy(marks);
  }
  function setPage(next) {
    if (!PAGES.includes(next) || next === page) return;
    cancelGesture(); rememberPage(); page = next; changingPage = true; localise();
    layout = Array.isArray(pageLayouts[page]) ? copy(pageLayouts[page]) : []; bases = [];
    marks = validMarks(pageMarks[page]); selected = null;
    zoom = clamp(finite(pageViews[page]?.zoom, 1), .25, 1.6);
    setItems(allProjects); renderMarks();
    viewport.scrollLeft = finite(pageViews[page]?.scrollX, 0); viewport.scrollTop = finite(pageViews[page]?.scrollY, 0);
    changingPage = false; notify();
  }
  function getState() {
    rememberPage();
    return copy({ version: 4, page, pageLayouts, pageStarts, pageWidths, pageViews, pageMarks, toolsOpen, width, height, lang: language, layout, marks, tool, colour, stamp, zoom, scrollX: viewport.scrollLeft, scrollY: viewport.scrollTop });
  }
  function setItems(nextItems) {
    const ids = new Set();
    allProjects = (Array.isArray(nextItems) ? nextItems : []).filter((item) => {
      if (!item || typeof item.id !== 'string' || ids.has(item.id)) return false;
      ids.add(item.id); return true;
    });
    projects = pageProjects();
    const saved = layout.length ? layout : !changingPage && Array.isArray(initial?.layout) ? initial.layout : [];
    const startY = boardStart();
    const oldWidth = bases.length ? width : finite(pageWidths[page], finite(initial?.width, width));
    const oldBases = bases.length ? bases : Number.isFinite(pageStarts[page]) ? makeCanvasLayout(projects, oldWidth, projects.map(project => saved.find(item => item.id === project.id)?.height), pageStarts[page]) : initial?.version >= 2 ? makeCanvasLayout(projects, oldWidth, projects.map(project => saved.find(item => item.id === project.id)?.height), initial.version === 2 ? 136 : startY) : [];
    width = Math.max(280, viewport.clientWidth || width);
    bases = makeCanvasLayout(projects, width, projects.map(project => saved.find(item => item.id === project.id)?.height), startY);
    layout = bases.map((item) => {
      const prior = saved.find((old) => old.id === item.id);
      const oldBase = oldBases.find((old) => old.id === item.id);
      // Older oversized boards start with the new readable composition.
      if (!prior) return { ...item };
      const dx = oldBase ? (prior.x - oldBase.x) * width / oldWidth : prior.x - item.x;
      const dy = oldBase ? prior.y - oldBase.y : prior.y - item.y;
      return { ...item, x: clamp(item.x + dx, 15, width - item.width - 15), y: Math.max(startY, item.y + dy), z: finite(prior.z, item.z) };
    });
    height = Math.max(boardHeight(layout), boardStart() + 250);
    cards.replaceChildren();
    for (const [index, item] of projects.entries()) {
      const card = doc.createElement('article');
      card.className = `cw__card cw__card--${index % 6}`; card.dataset.project = item.id;
      const handle = doc.createElement('button');
      handle.type = 'button'; handle.className = 'cw__handle'; handle.dataset.handle = item.id;
      const label = doc.createElement('span'); label.className = 'cw__sheet-label'; label.dataset.copy = 'sheet';
      const number = doc.createElement('span'); number.textContent = `${String(index + 1).padStart(2, '0')} / ⠿`; number.setAttribute('aria-hidden', 'true');
      handle.append(label, number);
      const open = doc.createElement('button'); open.type = 'button'; open.className = 'cw__open'; open.dataset.open = item.id;
      const art = doc.createElement('div'); art.className = 'cw__art'; art.setAttribute('aria-hidden', 'true');
      card.dataset.kind = item.id;
      const visualImage = item.image;
      if (visualImage) {
        const image = doc.createElement('img'); image.src = visualImage; image.alt = ''; image.loading = 'lazy'; image.draggable = false; art.append(image);
        image.addEventListener('error', () => { image.remove(); makeTypePreview(true); }, { once: true });
      } else makeTypePreview();
      function makeTypePreview(missingImage = false) {
        art.classList.add('cw__art--type');
        const name = doc.createElement('strong'); name.textContent = item.title || item.id;
        const caption = doc.createElement('small'); caption.textContent = missingImage ? COPY[language].preview : item.previewLabel || COPY[language].preview;
        art.append(name, caption);
      }
      const text = doc.createElement('div'); text.className = 'cw__card-text';
      const title = doc.createElement('h3'); title.textContent = item.title || item.id;
      const tag = doc.createElement('p'); tag.className = 'cw__tag'; tag.textContent = [item.status || item.tag || '', item.demoKey ? item.demoLabel : ''].filter(Boolean).join(' · ');
      const summary = doc.createElement('p'); summary.className = 'cw__summary'; summary.textContent = item.summary || '';
      const arrow = doc.createElement('span'); arrow.className = 'cw__open-label'; arrow.dataset.copy = 'open';
      text.append(title, tag, summary, arrow);
      open.append(art, text); card.append(handle, open); cards.append(card);
    }
    updateLayout(); localise(); compose();
  }
  function compose() {
    if (!viewport.clientWidth) return;
    const heights = [...cards.children].map(card => card.offsetHeight || 410);
    const next = makeCanvasLayout(projects, width, heights, boardStart());
    layout = next.map(item => {
      const prior = layout.find(old => old.id === item.id);
      const base = bases.find(old => old.id === item.id);
      return { ...item, x: prior?.x ?? item.x, y: Math.max(boardStart(), item.y + (prior && base ? prior.y - base.y : 0)), z: prior?.z ?? item.z };
    });
    bases = next; height = Math.max(boardHeight(layout), boardStart() + 250); updateLayout();
  }
  function updateLayout() {
    for (const item of layout) {
      const card = [...cards.children].find((node) => node.dataset.project === item.id);
      if (!card) continue;
      Object.assign(card.style, { left: `${item.x}px`, top: `${item.y}px`, width: `${item.width}px`, transform: `rotate(${item.angle}deg)`, zIndex: item.z });
      card.classList.toggle('is-selected', selected === item.id);
    }
    extent.style.width = `${width * zoom}px`; extent.style.height = `${height * zoom}px`;
    plane.style.width = `${width}px`; plane.style.height = `${height}px`; plane.style.transform = `scale(${zoom})`;
    drawing.setAttribute('viewBox', `0 0 ${width} ${height}`);
    q('.cw__zoom-value').textContent = `${Math.round(zoom * 100)}%`;
  }
  function renderMarks() {
    drawing.replaceChildren();
    for (const mark of marks) {
      const attrs = { fill: 'none', stroke: COLOURS[mark.colour], 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
      if (mark.type === 'line') {
        const d = mark.points.length === 1 ? `M${mark.points[0]}l.1 .1` : mark.points.map((point, i) => `${i ? 'L' : 'M'}${point.join(' ')}`).join(' ');
        drawing.append(svgNode(doc, 'path', { ...attrs, d }));
      } else {
        const g = svgNode(doc, 'g', { transform: `translate(${mark.x} ${mark.y}) rotate(-12)`, ...attrs });
        if (mark.shape === 'ring') g.append(svgNode(doc, 'ellipse', { rx: 31, ry: 26 }));
        else if (mark.shape === 'arrow') g.append(svgNode(doc, 'path', { d: 'M-35 15Q-4 22 30-15M10-20l22 4-7 24' }));
        else g.append(svgNode(doc, 'path', { d: 'M0-33 9-11 33-10 16 6 21 31 0 18-22 31-16 6-33-10-9-11Z' }));
        drawing.append(g);
      }
    }
  }
  function localise() {
    root.dataset.page = page;
    q('.cw__hero-title').textContent = COPY[language][PAGE_KEYS[page][0]];
    q('.cw__hero-lead').textContent = COPY[language][PAGE_KEYS[page][1]];
    q('.cw__areas').setAttribute('aria-label', COPY[language].pageChooser);
    for (const button of root.querySelectorAll('[data-page]')) button.setAttribute('aria-current', button.dataset.page === page ? 'page' : 'false');
    root.lang = language === 'ar' ? 'ar-EG' : 'en'; root.dir = language === 'ar' ? 'rtl' : 'ltr';
    for (const node of root.querySelectorAll('[data-copy]')) node.textContent = COPY[language][node.dataset.copy];
    q('.cw__toolbar').setAttribute('aria-label', COPY[language].tools);
    q('.cw__colour-group').setAttribute('aria-label', COPY[language].colours);
    viewport.setAttribute('aria-label', COPY[language].label);
    for (const node of root.querySelectorAll('[data-colour]')) node.setAttribute('aria-label', COPY[language][node.dataset.colour]);
    for (const [action, key] of [['in', 'zoomIn'], ['out', 'zoomOut']]) q(`[data-action="${action}"]`).setAttribute('aria-label', COPY[language][key]);
    for (const item of projects) {
      const handle = [...cards.querySelectorAll('[data-handle]')].find((node) => node.dataset.handle === item.id);
      const open = [...cards.querySelectorAll('[data-open]')].find((node) => node.dataset.open === item.id);
      handle?.setAttribute('aria-label', `${COPY[language].move}: ${item.title || item.id}`);
      open?.setAttribute('aria-label', `${COPY[language].open}: ${item.title || item.id}`);
    }
    root.dataset.toolsOpen=String(toolsOpen);q('.cw__toolbar').hidden = !toolsOpen;
    q('.cw__tools-toggle').setAttribute('aria-expanded', String(toolsOpen));
    updateTools(); tell(lastStatus);
  }
  function updateTools() {
    root.dataset.tool = tool;
    q('.cw__tools-toggle').textContent = COPY[language].tools + (tool !== 'select' ? ` · ${COPY[language][tool]}` : '');
    for (const node of root.querySelectorAll('[data-tool]')) node.setAttribute('aria-pressed', String(node.dataset.tool === tool));
    for (const node of root.querySelectorAll('[data-colour]')) node.setAttribute('aria-pressed', String(node.dataset.colour === colour));
    q('[data-stamp]').value = stamp;
    q('[data-stamp]').setAttribute('aria-label', COPY[language].stamps);
  }
  function setTool(next) { cancelGesture(); tool = next; updateTools(); notify(); }
  function zoomTo(next) {
    cancelGesture();
    const cx = (viewport.scrollLeft + viewport.clientWidth / 2) / zoom;
    const cy = (viewport.scrollTop + viewport.clientHeight / 2) / zoom;
    zoom = clamp(next, .25, 1.6); updateLayout();
    viewport.scrollLeft = cx * zoom - viewport.clientWidth / 2;
    viewport.scrollTop = cy * zoom - viewport.clientHeight / 2; notify();
  }
  function fit() {
    cancelGesture();
    zoom = clamp((viewport.clientWidth || width) / width, .65, 1);
    updateLayout(); viewport.scrollLeft = 0; viewport.scrollTop = 0; notify();
  }
  function reset() {
    cancelGesture();
    for (const collection of [pageLayouts, pageStarts, pageWidths, pageViews, pageMarks]) for (const key of Object.keys(collection)) delete collection[key];
    bases = makeCanvasLayout(projects, width, [...cards.children].map(card => card.offsetHeight), boardStart());
    layout = copy(bases); height = Math.max(boardHeight(layout), boardStart() + 250); marks = []; selected = null;
    tool = 'select'; colour = 'blue'; stamp = 'star'; updateTools(); renderMarks(); fit(); tell('resetDone'); notify();
  }
  function cancelAction() {
    if (!gesture && tool === 'select') return false;
    cancelGesture(); tool = 'select'; updateTools(); notify(); return true;
  }
  function point(event) {
    const rect = plane.getBoundingClientRect();
    return [clamp((event.clientX - rect.left) / zoom, 0, width), clamp((event.clientY - rect.top) / zoom, 0, height)];
  }
  function cancelGesture() {
    if (!gesture) return;
    const old = gesture; gesture = null;
    try { viewport.releasePointerCapture(old.pointer); } catch {}
    root.classList.remove('is-dragging');
    notify();
  }
  function revealProject(id) {
    const item = layout.find((item) => item.id === id);
    if (!item) return;
    const left = item.x * zoom, top = item.y * zoom, width = item.width * zoom;
    if (left < viewport.scrollLeft || left + width > viewport.scrollLeft + viewport.clientWidth) viewport.scrollLeft = Math.max(0, left - 24);
    if (top < viewport.scrollTop || top + (item.height || 410) * zoom > viewport.scrollTop + viewport.clientHeight) viewport.scrollTop = Math.max(0, top - 24);
  }
  viewport.addEventListener('pointerdown', (event) => {
    if (!active || event.button !== 0 || gesture) return;
    const handle = event.target.closest('[data-handle]');
    const open = event.target.closest('[data-open]');
    if (tool === 'select') {
      if (!handle) return;
      // Only handles capture touch movement; the project body keeps native scrolling.
      const item = layout.find((item) => item.id === handle.dataset.handle);
      selected = item.id; item.z = Math.max(...layout.map((item) => item.z)) + 1;
      gesture = { type: 'card', pointer: event.pointerId, item, x: event.clientX, y: event.clientY, startX: item.x, startY: item.y };
      updateLayout(); handle.focus({ preventScroll: true });
    } else if (tool === 'hand') gesture = { type: 'pan', pointer: event.pointerId, x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
    else {
      const [x, y] = point(event);
      if (tool === 'marker') {
        const mark = { type: 'line', colour, points: [[x, y]] };
        marks.push(mark); if (marks.length > 300) marks.shift(); gesture = { type: 'line', pointer: event.pointerId, mark };
      } else if (tool === 'stamp') {
        marks.push({ type: 'stamp', colour, shape: stamp, x, y }); if (marks.length > 300) marks.shift();
        tell('marked'); renderMarks(); notify();
      } else {
        const i = marks.findLastIndex((mark) => markHit(mark, x, y, 20 / zoom));
        if (i >= 0) { marks.splice(i, 1); renderMarks(); tell('erased'); notify(); }
        gesture = { type: 'erase', pointer: event.pointerId };
      }
      renderMarks();
    }
    if (gesture) { viewport.setPointerCapture(event.pointerId); root.classList.add('is-dragging'); }
    if (!open || tool !== 'select') event.preventDefault();
  }, options);
  viewport.addEventListener('pointermove', (event) => {
    if (!gesture || gesture.pointer !== event.pointerId) return;
    if (gesture.type === 'card') {
      gesture.item.x = clamp(gesture.startX + (event.clientX - gesture.x) / zoom, 15, width - gesture.item.width - 15);
      gesture.item.y = clamp(gesture.startY + (event.clientY - gesture.y) / zoom, boardStart(), height - (gesture.item.height || 410) - 18); updateLayout();
    } else if (gesture.type === 'pan') {
      viewport.scrollLeft = gesture.left - (event.clientX - gesture.x); viewport.scrollTop = gesture.top - (event.clientY - gesture.y);
    } else if (gesture.type === 'line') {
      const p = point(event), last = gesture.mark.points.at(-1);
      if (Math.hypot(p[0] - last[0], p[1] - last[1]) > 2 && gesture.mark.points.length < 3500) { gesture.mark.points.push(p); renderMarks(); }
    } else if (gesture.type === 'erase') {
      const [x,y] = point(event); const i = marks.findLastIndex((mark) => markHit(mark, x, y, 20 / zoom));
      if (i >= 0) { marks.splice(i, 1); renderMarks(); tell('erased'); }
    }
  }, options);
  const finish = (event) => {
    if (!gesture || gesture.pointer !== event.pointerId) return;
    const key = gesture.type === 'card' ? 'moved' : gesture.type === 'line' ? 'marked' : null;
    cancelGesture(); if (key) tell(key);
  };
  viewport.addEventListener('pointerup', finish, options);
  viewport.addEventListener('pointercancel', finish, options);
  viewport.addEventListener('lostpointercapture', finish, options);
  view.addEventListener('blur', cancelGesture, options);
  root.addEventListener('click', (event) => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.dataset.page) setPage(button.dataset.page);
    else if (button.dataset.tool) setTool(button.dataset.tool);
    else if (button.dataset.colour) { colour = button.dataset.colour; updateTools(); notify(); }
    else if (button.dataset.action) {
      const action = button.dataset.action;
      if (action === 'tools') { toolsOpen = !toolsOpen; root.dataset.toolsOpen=String(toolsOpen);q('.cw__toolbar').hidden = !toolsOpen; button.setAttribute('aria-expanded', String(toolsOpen)); notify(); }
      if (action === 'in') zoomTo(zoom + .1);
      if (action === 'out') zoomTo(zoom - .1);
      if (action === 'fit') fit();
      if (action === 'clear') { cancelGesture(); marks = []; renderMarks(); tell('cleared'); notify(); }
      if (action === 'reset') reset();
    } else if (button.dataset.open && (tool === 'select' || event.detail === 0)) onOpen(button.dataset.open, button);
  }, options);
  q('[data-stamp]').addEventListener('change', (event) => { stamp = event.target.value; setTool('stamp'); }, options);
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && cancelAction()) { event.preventDefault(); event.stopPropagation(); return; }
    const handle = event.target.closest('[data-handle]');
    if (!active) return;
    if (handle) {
      const item = layout.find((item) => item.id === handle.dataset.handle);
      if (event.key === 'Enter') { event.preventDefault(); onOpen(item.id, handle); return; }
      const moves = { ArrowLeft: [-1,0], ArrowRight: [1,0], ArrowUp: [0,-1], ArrowDown: [0,1] };
      if (!moves[event.key]) return;
      event.preventDefault(); const step = event.shiftKey ? 40 : 12;
      selected = item.id; item.x = clamp(item.x + moves[event.key][0] * step, 15, width - item.width - 15);
      item.y = clamp(item.y + moves[event.key][1] * step, boardStart(), height - (item.height || 410) - 18); updateLayout(); revealProject(item.id); tell('moved'); notify();
    } else if (event.target === viewport) {
      if (event.key === '+' || event.key === '=') { event.preventDefault(); zoomTo(zoom + .1); }
      if (event.key === '-') { event.preventDefault(); zoomTo(zoom - .1); }
      if (event.key === '0') { event.preventDefault(); fit(); }
    }
  }, options);
  viewport.addEventListener('scroll', () => {
    if (scrollFrame) return;
    scrollFrame = view.requestAnimationFrame(() => { scrollFrame = 0; notify(); });
  }, options);
  // Native focus scrolling reveals keyboard projects even when they are outside the current board view.
  cards.addEventListener('focusin', (event) => {
    const card = event.target.closest('[data-project]'); if (!card) return;
    selected = card.dataset.project; updateLayout();
    revealProject(selected);
  }, options);
  localise(); setItems(libraryItems ? buildProjectLibrary(language) : items);
  if (initial?.version >= 2 && Number.isFinite(initial.width) && Math.abs(width - initial.width) > 2) {
    const sx = width / initial.width, sy = height / finite(initial.height, height);
    marks = marks.map(mark => mark.type === 'stamp' ? { ...mark, x: mark.x * sx, y: mark.y * sy } : { ...mark, points: mark.points.map(([x,y]) => [x * sx, y * sy]) });
  }
  renderMarks();
  if (initial) { viewport.scrollLeft = finite(initial.scrollX, 0); viewport.scrollTop = finite(initial.scrollY, 0); }
  else fit();
  lastWidth = viewport.clientWidth;
  const resize = new view.ResizeObserver(() => {
    if (!active || !viewport.clientWidth) return;
    if (Math.abs(viewport.clientWidth - lastWidth) > 2) {
      const priorWidth = width, priorHeight = height, wasFitted = Math.abs(zoom - 1) < .015;
      lastWidth = viewport.clientWidth;
      setItems(allProjects);
      const sx = width / priorWidth, sy = height / priorHeight;
      if (Math.abs(width - priorWidth) > 2) marks = marks.map(mark => mark.type === 'stamp' ? { ...mark, x: mark.x * sx, y: mark.y * sy } : { ...mark, points: mark.points.map(([x,y]) => [x * sx, y * sy]) });
      renderMarks(); if (wasFitted && Math.abs(width - priorWidth) > 2) fit(); else updateLayout(); notify();
    } else compose();
  }); resize.observe(viewport);
  return {
    setLanguage(next) { cancelGesture(); const x = viewport.scrollLeft, y = viewport.scrollTop; language = languageOf(next); localise(); if (libraryItems) setItems(buildProjectLibrary(language)); else compose(); viewport.scrollLeft = x; viewport.scrollTop = y; notify(); },
    setItems(next) { cancelGesture(); libraryItems = false; setItems(next); notify(); },
    setActive(value) { active = Boolean(value); if (!active) cancelGesture(); else { lastWidth = 0; resize.unobserve(viewport); resize.observe(viewport); } }, getState, reset, setPage, cancelAction,
    destroy() { if (destroyed) return; cancelGesture(); const finalState = getState(); onStateChange(finalState); destroyed = true; controller.abort(); resize.disconnect(); view.cancelAnimationFrame(scrollFrame); root.remove(); },
  };
}
