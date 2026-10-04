const COPY = {
  en: {
    label: "Concept simulation · fictional data",
    title: "One bracelet. One check-in.",
    scan: "Scan fictional bracelet",
    reset: "Reset",
    bracelet: "Bracelet",
    reader: "Reader",
    register: "Attendance",
    braceletDetail: "DEMO-01",
    readerDetail: "Simulated reader",
    registerDetail: "Sample register",
    ready: "Try a fictional check-in.",
    reading: "Simulated reader detected DEMO-01.",
    registering: "Adding a fictional attendance entry…",
    complete: "Fictional check-in added.",
    view: "Parent / teacher concept view",
    student: "Demo student 01",
    time: "09:00 · sample time",
    checkedIn: "Checked in",
    empty: "Your fictional check-in will appear here.",
    note: "Browser-only concept from a university team prototype. No real bracelet, server or notifications are connected.",
    flowLabel: "Concept flow: bracelet, reader, attendance register",
  },
  ar: {
    label: "محاكاة لفكرة · بيانات خيالية",
    title: "سوار واحد. وتسجيل حضور.",
    scan: "جرّب مسح السوار الخيالي",
    reset: "ابدأ من الأول",
    bracelet: "السوار",
    reader: "القارئ",
    register: "الحضور",
    braceletDetail: "DEMO-01",
    readerDetail: "قارئ في المحاكاة",
    registerDetail: "سجل للتجربة",
    ready: "جرّب تسجّل حضور خيالي.",
    reading: "القارئ في المحاكاة قرأ DEMO-01.",
    registering: "بنضيف حضور خيالي للسجل…",
    complete: "الحضور الخيالي اتسجّل.",
    view: "تصوّر لواجهة ولي الأمر / المدرّس",
    student: "طالب للتجربة 01",
    time: "09:00 · وقت للتجربة",
    checkedIn: "الحضور اتسجّل",
    empty: "تسجيل الحضور الخيالي هيظهر هنا.",
    note: "فكرة في المتصفح مستوحاة من نموذج لفريق جامعي. مفيش سوار حقيقي أو سيرفر متوصّل، ومفيش إشعارات بتتبعت.",
    flowLabel: "تصوّر الخطوات: السوار، القارئ، سجل الحضور",
  },
};

export function mountRfidDemo(container, { lang = "en" } = {}) {
  if (!container || typeof container.append !== "function")
    throw new TypeError("A container element is required.");
  const doc = container.ownerDocument;
  const view = doc.defaultView;
  const previousFocus = doc.activeElement;
  const root = doc.createElement("section");
  root.className = "rfid-demo";
  root.innerHTML = `
    <span class="rfid-demo__label" data-copy="label"></span>
    <p class="rfid-demo__title" data-copy="title"></p>
    <div class="rfid-demo__actions"><button type="button" class="rfid-demo__scan" data-copy="scan"></button>
      <button type="button" class="rfid-demo__reset" data-copy="reset" disabled></button></div>
    <ol class="rfid-demo__flow">
      <li data-step="bracelet"><span class="rfid-demo__icon rfid-demo__icon--bracelet" aria-hidden="true"><i></i></span>
        <b data-copy="bracelet"></b><small data-copy="braceletDetail" dir="ltr"></small></li>
      <li data-step="reader"><span class="rfid-demo__icon rfid-demo__icon--reader" aria-hidden="true"><i></i><i></i><i></i></span>
        <b data-copy="reader"></b><small data-copy="readerDetail"></small></li>
      <li data-step="register"><span class="rfid-demo__icon rfid-demo__icon--register" aria-hidden="true"><i></i><i></i><i></i></span>
        <b data-copy="register"></b><small data-copy="registerDetail"></small></li>
    </ol>
    <p class="rfid-demo__status" role="status" aria-live="polite" aria-atomic="true"></p>
    <div class="rfid-demo__register"><p class="rfid-demo__view-label" data-copy="view"></p>
      <p class="rfid-demo__empty" data-copy="empty"></p>
      <div class="rfid-demo__entry" hidden><span class="rfid-demo__avatar" aria-hidden="true">01</span>
        <div class="rfid-demo__person"><b data-copy="student"></b><span data-copy="time"></span></div>
        <span class="rfid-demo__badge" data-copy="checkedIn"></span></div>
    </div>
    <p class="rfid-demo__note" data-copy="note"></p>`;
  container.append(root);
  const scan = root.querySelector(".rfid-demo__scan");
  const reset = root.querySelector(".rfid-demo__reset");
  const status = root.querySelector(".rfid-demo__status");
  const entry = root.querySelector(".rfid-demo__entry");
  const empty = root.querySelector(".rfid-demo__empty");
  const flow = root.querySelector(".rfid-demo__flow");
  const steps = [...root.querySelectorAll("[data-step]")];
  const controller = new view.AbortController();
  const timers = new Set();
  let phase = "ready";
  let language = "en";
  let destroyed = false;
  let run = 0;

  function render() {
    root.dataset.phase = phase;
    status.textContent = COPY[language][phase];
    scan.disabled = phase !== "ready";
    reset.disabled = phase === "ready";
    entry.hidden = phase !== "complete";
    empty.hidden = phase === "complete";
    flow.setAttribute("aria-label", COPY[language].flowLabel);
    steps.forEach((step, index) => {
      const active =
        phase === "reading"
          ? 1
          : phase === "registering"
            ? 2
            : phase === "complete"
              ? 3
              : 0;
      step.dataset.state =
        index < active
          ? "done"
          : index === active && phase !== "complete"
            ? "current"
            : "waiting";
    });
  }
  function clearTimers() {
    for (const timer of timers) view.clearTimeout(timer);
    timers.clear();
    run++;
  }
  function later(nextPhase, delay, currentRun) {
    const timer = view.setTimeout(() => {
      timers.delete(timer);
      if (destroyed || run !== currentRun) return;
      phase = nextPhase;
      render();
    }, delay);
    timers.add(timer);
  }
  function setLanguage(value) {
    if (destroyed) return;
    language = String(value).toLowerCase().startsWith("ar") ? "ar" : "en";
    root.lang = language === "ar" ? "ar-EG" : "en";
    root.dir = language === "ar" ? "rtl" : "ltr";
    for (const node of root.querySelectorAll("[data-copy]"))
      node.textContent = COPY[language][node.dataset.copy];
    render();
  }
  scan.addEventListener(
    "click",
    () => {
      if (destroyed || phase !== "ready") return;
      clearTimers();
      phase = "reading";
      render();
      const currentRun = run;
      later("registering", 650, currentRun);
      later("complete", 1300, currentRun);
    },
    { signal: controller.signal },
  );
  reset.addEventListener(
    "click",
    () => {
      if (destroyed) return;
      clearTimers();
      phase = "ready";
      render();
      scan.focus({ preventScroll: true });
    },
    { signal: controller.signal },
  );
  setLanguage(lang);

  return {
    setLanguage,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      clearTimers();
      controller.abort();
      if (
        root.contains(doc.activeElement) &&
        previousFocus?.isConnected &&
        typeof previousFocus.focus === "function"
      )
        previousFocus.focus({ preventScroll: true });
      root.remove();
    },
  };
}
