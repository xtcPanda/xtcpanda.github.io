'use strict';
const copy = {
  en: {
    skip: 'Skip to content', back: '← Back to Moaaz’s portfolio', demoLabel: 'NEW DEMO · OCTOBER 2026',
    eyebrow: 'SMALL PROJECT. ACTUAL BUTTONS.', intro: '“Save my money for me.” First, let’s see where it went.',
    notice: 'This browser demo uses fictional money and transactions. Changes stay in this page’s memory and reset when you reload. No bank connection or account required.',
    monthTitle: 'Your month, at a glance.', month: 'Month', income: 'Income', expenses: 'Expenses', net: 'Net balance',
    addTitle: 'Add a transaction', description: 'Description', amount: 'Amount (EGP)', type: 'Type', expense: 'Expense',
    category: 'Category', date: 'Date', add: 'Add transaction +', reportTitle: 'Where it went',
    reportIntro: 'Expenses by category for the selected month.', reportFoot: 'The numbers have receipts. The coffee is innocent until proven otherwise.',
    transactions: 'Transactions', export: 'Export this month ↓', caption: 'Fictional demo transactions for the selected month', action: 'Action',
    provenance: 'New browser interface inspired by the original 2024 database project. Built with Codex as a separate demo in October 2026.',
    reset: 'Reset sample data ↺', more: 'More projects ↗', placeholder: 'e.g. Fictional groceries', remove: 'Remove',
    empty: 'No transactions for this month. Add one to try the demo.', noExpenses: 'No expenses this month. Suspiciously peaceful.',
    validation: 'Add a description, a valid date and an amount between EGP 0.01 and 1,000,000.', restored: 'Sample data restored.', exported: 'Exported the selected month as CSV.',
    added: name => `Added ${name}.`, removed: name => `Removed ${name}.`, showing: month => `Showing ${month}.`,
    removeLabel: (name, date) => `Remove ${name} on ${date}`,
    count: n => `${n} transaction${n === 1 ? '' : 's'} · fictional demo data`,
    categories: { Food: 'Food', Transport: 'Transport', Home: 'Home', Learning: 'Learning', Salary: 'Salary', Other: 'Other' },
    samples: { salary: 'Sample salary', rent: 'Sample rent', groceries: 'Sample groceries', commute: 'Sample commute', course: 'Sample course', coffee: 'Sample coffee' },
    currency: 'EGP', title: 'Haweshly / حوشلي — Browser demo',
  },
  ar: {
    skip: 'روح للمحتوى', back: '→ ارجع لبورتفوليو معاذ', demoLabel: 'تجربة جديدة · أكتوبر 2026',
    eyebrow: 'مشروع صغير. وأزرار بتشتغل.', intro: '«حوشلي فلوسي.» بس الأول نشوف راحت فين.',
    notice: 'دي تجربة في المتصفح بفلوس ومعاملات خيالية. تغييراتك بتفضل في ذاكرة الصفحة وبتتمسح لما تعمل إعادة تحميل. مفيش ربط ببنك، ولا محتاج تعمل حساب.',
    monthTitle: 'شَهرك في نظرة.', month: 'الشهر', income: 'الدخل', expenses: 'المصاريف', net: 'الصافي',
    addTitle: 'ضيف حركة', description: 'الوصف', amount: 'المبلغ (جنيه)', type: 'النوع', expense: 'مصروف',
    category: 'الفئة', date: 'التاريخ', add: 'ضيف الحركة +', reportTitle: 'راحت فين؟',
    reportIntro: 'مصاريف الشهر اللي اخترته، حسب الفئة.', reportFoot: 'الأرقام معاها إيصالات. والقهوة بريئة لحد ما يثبت العكس.',
    transactions: 'الحركات', export: 'نزّل بيانات الشهر ↓', caption: 'حركات خيالية للتجربة في الشهر اللي اخترته', action: 'إجراء',
    provenance: 'واجهة جديدة للمتصفح مستوحاة من مشروع قاعدة البيانات الأصلي في 2024. اتبنت بمساعدة Codex كتجربة منفصلة في أكتوبر 2026.',
    reset: 'رجّع بيانات التجربة ↺', more: 'مشاريع تانية ↗', placeholder: 'مثلاً: مشتريات للتجربة', remove: 'امسح',
    empty: 'مفيش حركات في الشهر ده. ضيف واحدة وجرّب.', noExpenses: 'مفيش مصاريف الشهر ده. هدوء يخلّي الواحد يشك.',
    validation: 'اكتب وصف وتاريخ صحيح ومبلغ من 0.01 لحد 1,000,000 جنيه.', restored: 'بيانات التجربة رجعت.', exported: 'بيانات الشهر نزلت في ملف CSV.',
    added: name => `ضفنا ${name}.`, removed: name => `مسحنا ${name}.`, showing: month => `بنعرض ${month}.`,
    removeLabel: (name, date) => `امسح ${name} بتاريخ ${date}`,
    count: n => `${n === 1 ? 'حركة واحدة' : n === 2 ? 'حركتين' : `${n} ${n >= 3 && n <= 10 ? 'حركات' : 'حركة'}`} · بيانات خيالية للتجربة`,
    categories: { Food: 'أكل', Transport: 'مواصلات', Home: 'البيت', Learning: 'تعلّم', Salary: 'مرتب', Other: 'حاجات تانية' },
    samples: { salary: 'مرتب للتجربة', rent: 'إيجار للتجربة', groceries: 'مشتريات للتجربة', commute: 'مواصلات للتجربة', course: 'كورس للتجربة', coffee: 'قهوة للتجربة' },
    currency: 'جنيه', title: 'حوشلي / Haweshly — تجربة في المتصفح',
  },
};
const sample = [
  { id: 1, date: '2026-10-01', description: 'Sample salary', sampleKey: 'salary', category: 'Salary', type: 'income', cents: 1200000 },
  { id: 2, date: '2026-10-01', description: 'Sample rent', sampleKey: 'rent', category: 'Home', type: 'expense', cents: 400000 },
  { id: 3, date: '2026-10-02', description: 'Sample groceries', sampleKey: 'groceries', category: 'Food', type: 'expense', cents: 78000 },
  { id: 4, date: '2026-10-02', description: 'Sample commute', sampleKey: 'commute', category: 'Transport', type: 'expense', cents: 9000 },
  { id: 5, date: '2026-10-03', description: 'Sample course', sampleKey: 'course', category: 'Learning', type: 'expense', cents: 35000 },
  { id: 6, date: '2026-10-03', description: 'Sample coffee', sampleKey: 'coffee', category: 'Food', type: 'expense', cents: 8500 },
];
let transactions = sample.map(t => ({ ...t })), nextId = 7;
let lang = new URLSearchParams(window.location.search).get('lang') === 'ar' ? 'ar' : 'en';
const embedded = window.parent !== window && new URLSearchParams(window.location.search).get('embedded') === 'mac';
let feedbackState = null;
const el = id => document.getElementById(id);
const text = () => copy[lang];
const locale = () => lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-EG';
const money = c => new Intl.NumberFormat(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(c / 100);
const descriptionOf = t => t.sampleKey ? text().samples[t.sampleKey] : t.description;
const forMonth = () => transactions.filter(t => t.date.slice(0, 7) === el('period').value);
function monthName(value) {
  if (!/^\d{4}-\d{2}$/.test(value)) return value;
  const [year, month] = value.split('-').map(Number);
  return new Intl.DateTimeFormat(locale(), { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1)));
}
function feedback(key, value = null) { feedbackState = { key, value }; renderFeedback(); }
function renderFeedback() {
  if (!feedbackState) return;
  const { key, value } = feedbackState;
  const arg = key === 'showing' ? monthName(value) : value?.sampleKey ? descriptionOf(value) : value?.description ?? value;
  el('feedback').textContent = typeof text()[key] === 'function' ? text()[key](arg) : text()[key];
}
function applyLanguage() {
  document.documentElement.lang = lang === 'ar' ? 'ar-EG' : 'en';
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.title = text().title;
  document.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = text()[node.dataset.i18n]; });
  if (embedded) {
    document.querySelector('[data-i18n=back]').textContent = lang === 'ar' ? '→ ارجع للمشاريع والأفكار' : '← Back to Projects & Ideas';
    document.querySelector('[data-i18n=more]').textContent = lang === 'ar' ? 'المشاريع والأفكار' : 'Projects & Ideas';
  }
  document.querySelectorAll('[data-category]').forEach(node => { node.textContent = text().categories[node.dataset.category]; });
  el('description').placeholder = text().placeholder;
  el('period').lang = document.documentElement.lang; el('date').lang = document.documentElement.lang;
  const toggle = el('language-toggle'); toggle.textContent = lang === 'ar' ? 'English' : 'عربي'; toggle.lang = lang === 'ar' ? 'en' : 'ar'; toggle.dir = lang === 'ar' ? 'ltr' : 'rtl';
  toggle.setAttribute('aria-label', lang === 'ar' ? 'Switch to English' : 'حوّل للعربي');
  render(); renderFeedback();
}
function render() {
  const items = forMonth(), income = items.filter(t => t.type === 'income').reduce((a, t) => a + t.cents, 0), expenses = items.filter(t => t.type === 'expense').reduce((a, t) => a + t.cents, 0);
  el('income').textContent = money(income); el('expenses').textContent = money(expenses); el('net').textContent = money(income - expenses); el('count').textContent = text().count(items.length); el('period-summary').textContent = monthName(el('period').value);
  el('transactions').replaceChildren();
  if (!items.length) { const tr = document.createElement('tr'), td = document.createElement('td'); td.colSpan = 5; td.textContent = text().empty; tr.append(td); el('transactions').append(tr); }
  items.slice().sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).forEach(t => {
    const tr = document.createElement('tr');
    [t.date, descriptionOf(t), text().categories[t.category], `${t.type === 'income' ? '+' : '−'} ${money(t.cents)}`].forEach((value, i) => {
      const td = document.createElement('td'); td.textContent = value;
      if (i === 0) td.dir = 'ltr'; if (i === 1) td.dir = 'auto';
      if (i === 3) { td.className = `amount-cell ${t.type === 'income' ? 'income-value' : ''}`; td.dir = 'ltr'; } tr.append(td);
    });
    const td = document.createElement('td'), button = document.createElement('button'); button.type = 'button'; button.className = 'remove'; button.textContent = text().remove;
    button.setAttribute('aria-label', text().removeLabel(descriptionOf(t), t.date));
    button.addEventListener('click', () => { transactions = transactions.filter(x => x.id !== t.id); render(); feedback('removed', t); el('description').focus(); }); td.append(button); tr.append(td); el('transactions').append(tr);
  });
  const categories = new Map(); items.filter(t => t.type === 'expense').forEach(t => categories.set(t.category, (categories.get(t.category) || 0) + t.cents)); el('category-report').replaceChildren();
  if (!categories.size) { const p = document.createElement('p'); p.className = 'muted'; p.textContent = text().noExpenses; el('category-report').append(p); }
  [...categories].sort((a, b) => b[1] - a[1]).forEach(([name, value]) => {
    const item = document.createElement('div'); item.className = 'category-item'; const label = document.createElement('div'); label.className = 'category-label';
    const n = document.createElement('span'), v = document.createElement('span'); n.textContent = text().categories[name]; v.textContent = `${money(value)} ${text().currency}`; v.className = 'category-amount'; label.append(n, v);
    const track = document.createElement('div'), fill = document.createElement('div'); track.className = 'category-track'; track.setAttribute('aria-hidden', 'true'); fill.className = 'category-fill'; fill.style.width = `${100 * value / expenses}%`; track.append(fill); item.append(label, track); el('category-report').append(item);
  }); el('export').disabled = !items.length;
}
function setLanguage(nextLanguage) {
  if (nextLanguage !== 'en' && nextLanguage !== 'ar') return;
  lang = nextLanguage;
  const url = new URL(window.location.href); url.searchParams.set('lang', lang);
  window.history.replaceState(null, '', url); applyLanguage();
}
el('language-toggle').addEventListener('click', () => setLanguage(lang === 'ar' ? 'en' : 'ar'));
window.addEventListener('message', event => {
  if (event.origin !== window.location.origin || event.source !== window.parent || event.data?.type !== 'haweshly-language') return;
  setLanguage(event.data.lang);
});
el('period').addEventListener('change', () => { render(); feedback('showing', el('period').value); });
el('transaction-form').addEventListener('submit', e => {
  e.preventDefault(); const description = el('description').value.trim(), amount = Number(el('amount').value), date = el('date').value, cents = Math.round(amount * 100);
  if (!description || !Number.isFinite(amount) || cents < 1 || cents > 100000000 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { feedback('validation'); return; }
  const transaction = { id: nextId++, date, description, category: el('category').value, type: el('type').value, cents }; transactions.push(transaction); el('period').value = date.slice(0, 7); render(); feedback('added', transaction); el('description').value = ''; el('amount').value = ''; el('description').focus();
});
el('reset').addEventListener('click', () => { transactions = sample.map(t => ({ ...t })); nextId = 7; el('period').value = '2026-10'; render(); feedback('restored'); });
function csvCell(value) { let s = String(value); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replaceAll('"', '""') + '"'; }
el('export').addEventListener('click', () => {
  const rows = [[text().date, text().description, text().category, text().type, text().amount], ...forMonth().map(t => [t.date, descriptionOf(t), text().categories[t.category], text()[t.type], (t.cents / 100).toFixed(2)])];
  const csv = rows.map(r => r.map(csvCell).join(',')).join('\r\n'); const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })), a = document.createElement('a'); a.href = url; a.download = `haweshly-demo-${el('period').value}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); feedback('exported');
});
applyLanguage();

// The embedded demo asks its containing Mac to navigate, retaining the live ledger.
// Standalone portfolio links remain ordinary links.
if (embedded) {
  document.querySelectorAll('[data-portfolio-back]').forEach(link => {
    link.removeAttribute('target');
    link.addEventListener('click', event => {
      event.preventDefault();
      window.parent.postMessage({ type: 'portfolio-demo-back' }, window.location.origin);
    });
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    event.preventDefault();
    window.parent.postMessage({ type: 'portfolio-demo-escape' }, window.location.origin);
  });
}
