import { projects, personalContent } from './content.js';

const languageOf = value => String(value).startsWith('ar') ? 'ar' : 'en';
const STATUS = {
  en: { completed: 'Completed work', prototype: 'Prototype', demonstration: 'Browser demonstration', idea: 'Idea · unbuilt', inspiration: 'Inspiration · external reference' },
  ar: { completed: 'شغل مكتمل', prototype: 'نموذج أولي', demonstration: 'تجربة للمتصفح', idea: 'فكرة · لسه ما اتعملتش', inspiration: 'إلهام · مرجع خارجي' },
};
const SUMMARIES = {
  en: { tabs: 'Save and restore window layouts in a native Mac prototype.', haweshly: 'A personal-finance database, with a separate browser demonstration.', rfid: 'Student check-ins and communication: a university team prototype.', tourism: 'Original 2020 tourism interface screens from a team prototype.', art: 'A personal Valentine’s illustration concept; no brand commission.' },
  ar: { tabs: 'نموذج للماك بيحفظ ترتيب الشبابيك ويرجّعه.', haweshly: 'قاعدة بيانات للفلوس، ومعاها تجربة منفصلة للمتصفح.', rfid: 'تسجيل حضور الطلبة والتواصل: نموذج أولي مع فريق الجامعة.', tourism: 'شاشات السياحة الأصلية من نموذج الفريق في ٢٠٢٠.', art: 'فكرة رسمة شخصية لفالنتاين؛ من غير تكليف من البراند.' },
};
const ORIGINALS = [
  {
    id: 'business-card', href: 'https://www.behance.net/gallery/103785447/Business-Card',
    en: { title: 'Business Card', description: 'A historical business-card design on Behance: an MA monogram and black-and-white card variations.', summary: 'Monogram and business-card variations.' },
    ar: { title: 'Business Card', description: 'تصميم بيزنس كارد قديم على Behance: علامة MA ونسخ بالكارت بالأبيض والأسود.', summary: 'علامة MA ونسخ للبيزنس كارد.' },
  },
  {
    id: 'calarts', href: 'https://www.behance.net/gallery/103784825/CALARTS-experience',
    en: { title: 'CALARTS experience', description: 'Composition studies and motorcycle remixes, collected in the original Behance project.', summary: 'Composition studies and motorcycle remixes.' },
    ar: { title: 'CALARTS experience', description: 'دراسات في التكوين ونسخ مختلفة للموتوسيكل، مجمّعة في المشروع الأصلي على Behance.', summary: 'دراسات تكوين ونسخ مختلفة للموتوسيكل.' },
  },
];
const REFERENCES = [
  {
    id: 'inspiration-elaine', href: 'https://www.elaineyu.design/',
    en: { title: 'Elaine Yu', description: 'A portfolio reference for visual direction. This is Elaine Yu’s work; it is linked here as inspiration.', summary: 'Portfolio reference · work by Elaine Yu.' },
    ar: { title: 'Elaine Yu', description: 'مرجع للاتجاه البصري للبورتفوليو. الشغل ده بتاع Elaine Yu؛ الرابط هنا للإلهام.', summary: 'مرجع بورتفوليو · شغل Elaine Yu.' },
  },
  {
    id: 'inspiration-sierra', href: 'https://sierrahopkins.com/',
    en: { title: 'Sierra Hopkins', description: 'A portfolio reference for visual direction. This is Sierra Hopkins’s work; it is linked here as inspiration.', summary: 'Portfolio reference · work by Sierra Hopkins.' },
    ar: { title: 'Sierra Hopkins', description: 'مرجع للاتجاه البصري للبورتفوليو. الشغل ده بتاع Sierra Hopkins؛ الرابط هنا للإلهام.', summary: 'مرجع بورتفوليو · شغل Sierra Hopkins.' },
  },
];

/** All cards open a local detail first. href is an explicitly labelled external source. */
export function buildProjectLibrary(lang = 'en') {
  const language = languageOf(lang), status = STATUS[language];
  const library = ['tabs', 'haweshly', 'rfid', 'tourism', 'art'].map(id => {
    const source = projects[id], text = source[language];
    const type = id === 'art' || id === 'haweshly' ? 'completed' : 'prototype';
    const demoKey = ['tabs', 'haweshly', 'rfid'].includes(id) ? id : null;
    return {
      id, area: 'projects', type, title: text.title, subtitle: text.short, summary: SUMMARIES[language][id],
      description: [text.body, text.next].filter(Boolean).join('\n\n'), status: status[type],
      tag: text.tag, image: source.image ? new URL('../' + source.image, import.meta.url).href : null, previewLabel: source.image ? (language === 'ar' ? 'صورة من المشروع' : 'Project visual') : (language === 'ar' ? 'بطاقة تعريف · مفيش صورة معاينة' : 'Project card · no image preview'),
      href: source.links?.[0]?.url || null, links: (source.links || []).map(link => ({ label: link.label[language], url: link.url })),
      demoKey, demoLabel: status.demonstration, demoDescription: demoKey ? text.detail : null,
    };
  });
  library.push(...ORIGINALS.map(item => ({ id: item.id, area: 'projects', type: 'completed', ...item[language], status: status.completed, href: item.href, image: null, previewLabel: language === 'ar' ? 'بطاقة تعريف · الصور في المشروع الأصلي' : 'Project card · images on original page', links: [], demoKey: null })));
  library.push(...personalContent.ideas.items.map(item => ({ id: item.id, area: 'ideas', type: 'idea', title: item[language].title, description: item[language].body, summary: item[language].body, status: status.idea, href: null, image: null, previewLabel: language === 'ar' ? 'ملاحظة فكرة' : 'Idea note', links: [], demoKey: null })));
  library.push(...REFERENCES.map(item => ({ id: item.id, area: 'ideas', type: 'inspiration', ...item[language], status: status.inspiration, href: item.href, image: null, previewLabel: language === 'ar' ? 'مرجع إلهام · شغل صاحبه' : 'Inspiration reference · credited work', links: [], demoKey: null })));
  return library.map(item => ({ ...item, page: item.area, subtitle: item.subtitle || item.summary || '' }));
}

export function findProjectItem(id, lang = 'en') {
  return buildProjectLibrary(lang).find(item => item.id === id) || null;
}
