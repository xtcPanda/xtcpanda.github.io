const COPY = {
  en: {
    eyebrow: "Browser simulation",
    title: "A little room to focus.",
    intro:
      "Move the windows. Save your arrangement. Bring it back when things get messy.",
    save: "Save layout",
    shuffle: "Shuffle",
    restore: "Restore saved",
    undo: "Undo",
    reset: "Reset",
    notes: "Notes",
    inbox: "Inbox",
    music: "Music",
    noteTitle: "One thing at a time.",
    noteBody: "A thought worth keeping.",
    noteFooter: "Make a little space for it.",
    inboxTitle: "A quieter inbox",
    inboxBody: "Three imaginary messages. Zero urgency.",
    messageOne: "A good idea",
    messageTwo: "Something for later",
    messageThree: "No reply needed",
    musicTitle: "Focus, gently",
    musicBody: "An imaginary soundtrack",
    hint: "Drag a window, or focus it and use the arrow keys. Hold Shift for a bigger move.",
    notice:
      "Fictional windows only. This demo does not control your Mac. Saved layouts live in this page; reloading clears them.",
    ready: "Your desk, your arrangement.",
    saved: "Layout saved. You can shuffle and bring it back.",
    shuffled: "A little chaos. Your saved layout is still safe.",
    restored: "Your saved arrangement is back.",
    undone: "Previous arrangement restored.",
    resetDone:
      "Back to the starting arrangement. Your saved layout is still safe.",
    moved: "Window moved.",
    move: "Move",
    close: "Decorative window controls",
  },
  ar: {
    eyebrow: "محاكاة في المتصفح",
    title: "شوية مساحة للتركيز.",
    intro: "حرّك النوافذ، احفظ ترتيبك، وارجع له لما الدنيا تتلخبط.",
    save: "احفظ الترتيب",
    shuffle: "لخبّط النوافذ",
    restore: "رجّع المحفوظ",
    undo: "تراجع",
    reset: "ابدأ من الأول",
    notes: "ملاحظات",
    inbox: "الوارد",
    music: "موسيقى",
    noteTitle: "حاجة واحدة كل مرة.",
    noteBody: "فكرة تستاهل تتسجّل.",
    noteFooter: "سيب لها شوية مساحة.",
    inboxTitle: "وارد أهدى",
    inboxBody: "تلات رسائل خيالية. ولا واحدة مستعجلة.",
    messageOne: "فكرة حلوة",
    messageTwo: "حاجة لوقت تاني",
    messageThree: "مش محتاجة رد",
    musicTitle: "تركيز، بالراحة",
    musicBody: "موسيقى خيالية للتركيز",
    hint: "اسحب النافذة، أو اختارها واستخدم أسهم الكيبورد. اضغط Shift معاها عشان تتحرك أكتر.",
    notice:
      "دي نوافذ خيالية بس. التجربة مش بتتحكّم في جهاز Mac. ترتيبك المحفوظ بيفضل في الصفحة دي؛ إعادة تحميلها بتمسحه.",
    ready: "مساحتك، وترتيبك.",
    saved: "الترتيب اتحفظ. جرّب تلخبطه وترجّعه.",
    shuffled: "شوية لخبطة. ترتيبك المحفوظ لسه موجود.",
    restored: "ترتيبك المحفوظ رجع.",
    undone: "رجعنا للترتيب اللي قبله.",
    resetDone: "رجعنا للبداية. ترتيبك المحفوظ لسه موجود.",
    moved: "النافذة اتحرّكت.",
    move: "حرّك",
    close: "عناصر شكلية للنافذة",
  },
};

const IDS = ["notes", "inbox", "music"];
const START = [
  { id: "notes", x: 0.07, y: 0.08, w: 0.39, h: 0.55, z: 1 },
  { id: "inbox", x: 0.51, y: 0.15, w: 0.4, h: 0.51, z: 2 },
  { id: "music", x: 0.3, y: 0.55, w: 0.38, h: 0.38, z: 3 },
];

const cloneLayout = (layout) => layout.map((item) => ({ ...item }));
const sameLayout = (a, b) =>
  a.every((item, index) =>
    ["id", "x", "y", "w", "h", "z"].every((key) => item[key] === b[index][key]),
  );
const bounded = (value, min, max) => Math.min(max, Math.max(min, value));

// Coordinates are physical fractions of the desktop, independent of UI language.
function clampWindow(item, stageWidth = 800) {
  const w = bounded(
    Math.max(item.w, 210 / Math.max(stageWidth, 1)),
    0.25,
    0.82,
  );
  const h = bounded(item.h, 0.32, 0.75);
  return {
    ...item,
    w,
    h,
    x: bounded(item.x, 0, 1 - w),
    y: bounded(item.y, 0, 1 - h),
  };
}

export function mountTabsDemo(container, { lang = "en" } = {}) {
  if (!container || typeof container.append !== "function")
    throw new TypeError("A container element is required.");
  const doc = container.ownerDocument;
  const view = doc.defaultView;
  const root = doc.createElement("section");
  root.className = "tabs-demo";
  root.innerHTML = `
    <div class="tabs-demo__intro"><span class="tabs-demo__eyebrow" data-copy="eyebrow"></span>
      <h2 data-copy="title"></h2><p data-copy="intro"></p></div>
    <div class="tabs-demo__toolbar" role="group">
      ${["save", "shuffle", "restore", "undo", "reset"].map((action) => `<button type="button" data-action="${action}" data-copy="${action}"></button>`).join("")}
    </div>
    <p class="tabs-demo__hint" data-copy="hint"></p>
    <div class="tabs-demo__desktop">
      <div class="tabs-demo__deskmark" aria-hidden="true"><span>T</span><span>A</span><span>B</span><span>S</span></div>
      ${IDS.map(
        (id) => `
        <article class="tabs-demo__window tabs-demo__window--${id}" data-window="${id}">
          <button type="button" class="tabs-demo__handle" data-handle="${id}">
            <span class="tabs-demo__dots" aria-hidden="true"><i></i><i></i><i></i></span>
            <span class="tabs-demo__window-title" data-copy="${id}"></span>
            <span class="tabs-demo__grip" aria-hidden="true">⠿</span>
          </button>
          <div class="tabs-demo__window-body">${
            id === "notes"
              ? `
            <span class="tabs-demo__small" data-copy="noteBody"></span><h3 data-copy="noteTitle"></h3>
            <div class="tabs-demo__note-lines" aria-hidden="true"><i></i><i></i><i></i></div>
            <p data-copy="noteFooter"></p>`
              : id === "inbox"
                ? `
            <h3 data-copy="inboxTitle"></h3><p data-copy="inboxBody"></p>
            <ul class="tabs-demo__messages">${["messageOne", "messageTwo", "messageThree"].map((key) => `<li><span aria-hidden="true"></span><b data-copy="${key}"></b></li>`).join("")}</ul>`
                : `
            <div class="tabs-demo__record" aria-hidden="true"><span></span></div>
            <div class="tabs-demo__track"><h3 data-copy="musicTitle"></h3><p data-copy="musicBody"></p>
            <div class="tabs-demo__wave" aria-hidden="true">${Array.from({ length: 11 }, (_, i) => `<i style="--bar:${((i * 7) % 5) + 1}"></i>`).join("")}</div></div>`
          }
          </div>
        </article>`,
      ).join("")}
    </div>
    <div class="tabs-demo__footer"><p class="tabs-demo__status" role="status" aria-live="polite" aria-atomic="true"></p>
      <p class="tabs-demo__notice" data-copy="notice"></p></div>`;
  container.append(root);

  const stage = root.querySelector(".tabs-demo__desktop");
  const status = root.querySelector(".tabs-demo__status");
  const toolbar = root.querySelector(".tabs-demo__toolbar");
  const windows = new Map(
    IDS.map((id) => [id, root.querySelector(`[data-window="${id}"]`)]),
  );
  const handles = new Map(
    IDS.map((id) => [id, root.querySelector(`[data-handle="${id}"]`)]),
  );
  const buttons = new Map(
    [...root.querySelectorAll("[data-action]")].map((button) => [
      button.dataset.action,
      button,
    ]),
  );
  const controller = new view.AbortController();
  const listenerOptions = { signal: controller.signal };
  let language = normalizeLanguage(lang);
  let layout = cloneLayout(START);
  let saved = null;
  let previous = null;
  let drag = null;
  let keyMove = null;
  let zIndex = 3;
  let lastStatus = "ready";
  let destroyed = false;

  function normalizeLanguage(value) {
    return String(value).toLowerCase().startsWith("ar") ? "ar" : "en";
  }
  function tell(key) {
    lastStatus = key;
    status.textContent = COPY[language][key];
  }
  function effective(item) {
    return clampWindow(item, stage.clientWidth || 800);
  }
  function render() {
    for (const item of layout) {
      const rect = effective(item);
      const win = windows.get(item.id);
      Object.assign(win.style, {
        left: `${rect.x * 100}%`,
        top: `${rect.y * 100}%`,
        width: `${rect.w * 100}%`,
        height: `${rect.h * 100}%`,
        zIndex: String(item.z),
      });
    }
    buttons.get("shuffle").disabled = false;
    buttons.get("restore").disabled = !saved || sameLayout(layout, saved);
    buttons.get("undo").disabled = !previous;
    buttons.get("save").disabled = Boolean(saved && sameLayout(layout, saved));
    buttons.get("reset").disabled = sameLayout(layout, START);
    // Layout actions must not interrupt an in-flight pointer or keyboard move.
    if (drag || keyMove)
      for (const button of buttons.values()) button.disabled = true;
  }
  function promote(id) {
    const item = layout.find((win) => win.id === id);
    item.z = ++zIndex;
  }
  function finishMove(cancelled = false) {
    const move = drag || keyMove;
    if (!move) return;
    if (cancelled) layout = cloneLayout(move.before);
    else if (!sameLayout(layout, move.before)) {
      previous = move.before;
      tell("moved");
    }
    const activeDrag = drag;
    drag = null;
    keyMove = null;
    root.classList.remove("tabs-demo--dragging");
    if (activeDrag && activeDrag.handle.hasPointerCapture(activeDrag.pointerId))
      activeDrag.handle.releasePointerCapture(activeDrag.pointerId);
    render();
  }
  function setLanguage(value) {
    if (destroyed) return;
    language = normalizeLanguage(value);
    root.lang = language === "ar" ? "ar-EG" : "en";
    root.dir = language === "ar" ? "rtl" : "ltr";
    for (const element of root.querySelectorAll("[data-copy]"))
      element.textContent = COPY[language][element.dataset.copy];
    toolbar.setAttribute(
      "aria-label",
      language === "ar" ? "تحكّم في ترتيب النوافذ" : "Window layout controls",
    );
    for (const id of IDS)
      handles
        .get(id)
        .setAttribute(
          "aria-label",
          `${COPY[language].move} ${COPY[language][id]}`,
        );
    tell(lastStatus);
  }

  toolbar.addEventListener(
    "click",
    (event) => {
      const button = event.target.closest("[data-action]");
      if (!button || button.disabled || drag || keyMove) return;
      const action = button.dataset.action;
      if (action === "save") {
        saved = cloneLayout(layout);
        tell("saved");
      } else if (action === "undo" && previous) {
        layout = cloneLayout(previous);
        previous = null;
        tell("undone");
      } else {
        const before = cloneLayout(layout);
        if (action === "shuffle")
          layout = layout.map((item) => {
            const rect = effective(item);
            return {
              ...item,
              x: Math.random() * (1 - rect.w),
              y: Math.random() * (1 - rect.h),
            };
          });
        else if (action === "restore" && saved) layout = cloneLayout(saved);
        else if (action === "reset") layout = cloneLayout(START);
        if (!sameLayout(before, layout)) previous = before;
        tell(
          action === "shuffle"
            ? "shuffled"
            : action === "restore"
              ? "restored"
              : "resetDone",
        );
      }
      render();
    },
    listenerOptions,
  );

  for (const [id, handle] of handles) {
    handle.addEventListener(
      "pointerdown",
      (event) => {
        if (event.button !== 0 || drag || keyMove) return;
        const bounds = stage.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        event.preventDefault();
        const before = cloneLayout(layout);
        handle.focus({ preventScroll: true });
        promote(id);
        const item = effective(layout.find((win) => win.id === id));
        drag = {
          id,
          pointerId: event.pointerId,
          handle,
          before,
          clientX: event.clientX,
          clientY: event.clientY,
          startX: item.x,
          startY: item.y,
          width: bounds.width,
          height: bounds.height,
        };
        handle.setPointerCapture(event.pointerId);
        root.classList.add("tabs-demo--dragging");
        render();
      },
      listenerOptions,
    );
    handle.addEventListener(
      "pointermove",
      (event) => {
        if (!drag || event.pointerId !== drag.pointerId) return;
        const index = layout.findIndex((item) => item.id === drag.id);
        const rect = effective(layout[index]);
        layout[index] = {
          ...layout[index],
          x: bounded(
            drag.startX + (event.clientX - drag.clientX) / drag.width,
            0,
            1 - rect.w,
          ),
          y: bounded(
            drag.startY + (event.clientY - drag.clientY) / drag.height,
            0,
            1 - rect.h,
          ),
        };
        render();
      },
      listenerOptions,
    );
    handle.addEventListener(
      "pointerup",
      (event) => {
        if (drag?.pointerId === event.pointerId) finishMove();
      },
      listenerOptions,
    );
    handle.addEventListener(
      "pointercancel",
      (event) => {
        if (drag?.pointerId === event.pointerId) finishMove(true);
      },
      listenerOptions,
    );
    handle.addEventListener(
      "lostpointercapture",
      () => {
        if (drag?.id === id) finishMove();
      },
      listenerOptions,
    );
    handle.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape" && (drag || keyMove)) {
          event.preventDefault();
          finishMove(true);
          return;
        }
        if (
          !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
            event.key,
          ) ||
          drag
        )
          return;
        event.preventDefault();
        if (!keyMove) {
          keyMove = { id, before: cloneLayout(layout) };
          promote(id);
        }
        const index = layout.findIndex((item) => item.id === id);
        const rect = effective(layout[index]);
        const step = event.shiftKey ? 0.06 : 0.02;
        layout[index] = {
          ...layout[index],
          x: bounded(
            rect.x +
              (event.key === "ArrowLeft"
                ? -step
                : event.key === "ArrowRight"
                  ? step
                  : 0),
            0,
            1 - rect.w,
          ),
          y: bounded(
            rect.y +
              (event.key === "ArrowUp"
                ? -step
                : event.key === "ArrowDown"
                  ? step
                  : 0),
            0,
            1 - rect.h,
          ),
        };
        render();
      },
      listenerOptions,
    );
    handle.addEventListener(
      "keyup",
      (event) => {
        if (event.key.startsWith("Arrow") && keyMove) finishMove();
      },
      listenerOptions,
    );
    handle.addEventListener(
      "blur",
      () => {
        if (keyMove?.id === id) finishMove();
      },
      listenerOptions,
    );
  }
  view.addEventListener("blur", () => finishMove(), listenerOptions);
  const observer = new view.ResizeObserver(() => {
    if (drag || keyMove) finishMove();
    render();
  });
  observer.observe(stage);
  setLanguage(language);
  render();

  return {
    setLanguage,
    cancelAction() {
      if (!drag && !keyMove) return false;
      finishMove(true);
      return true;
    },
    setActive(value) { if (!value) finishMove(true); },
    destroy() {
      if (destroyed) return;
      finishMove();
      destroyed = true;
      controller.abort();
      observer.disconnect();
      root.remove();
    },
  };
}
