// Builds the AJ Developers site from the mirrored Gleam home page source.
// Keeps only: nav, hero + work grid, "posters" section, 3D section, CTA, footer.
// Usage: node build.mjs   (from c:\Users\AJAY\Downloads\aj-developers)
import fs from 'node:fs';
import path from 'node:path';

const SRC_ROOT = path.resolve('../gleamstudio-clone/site');
const OUT = path.resolve('.');
const BRAND = 'AJ Developers';
const EMAIL = 'ajaypro123456@gmail.com';
const PHONE = '+91 98765 43210';
const ADDRESS = '100 Logistics Park, Whitefield, Bengaluru, KA 560066';
const HOURS = 'Mon–Sat, 9:00 AM – 7:00 PM IST';

let h = fs.readFileSync(path.join(SRC_ROOT, 'index.html'), 'utf8');

// ---------- helpers ----------
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
/** end index (exclusive) of the element whose opening tag starts at `start` */
function elementEnd(src, start) {
  const tag = src.slice(start + 1).match(/^[a-zA-Z][\w-]*/)[0].toLowerCase();
  const openEnd = src.indexOf('>', start) + 1;
  if (VOID.has(tag) || src[openEnd - 2] === '/') return openEnd;
  const re = new RegExp(`<(script|style)\\b[\\s\\S]*?</\\1>|<(/?)${tag}\\b[^>]*>`, 'gi');
  re.lastIndex = openEnd;
  let depth = 1, m;
  while ((m = re.exec(src))) {
    if (m[1]) continue;
    if (m[2]) { if (--depth === 0) return re.lastIndex; }
    else if (!m[0].endsWith('/>')) depth++;
  }
  throw new Error('unclosed <' + tag + '> at ' + start);
}
/** remove every element whose opening tag matches `openRe`; optionally keep its inner <style>/<script> */
function removeAll(openRe, { keepCode = false, label = openRe } = {}) {
  let count = 0, m;
  const re = new RegExp(openRe.source, openRe.flags.includes('g') ? openRe.flags : openRe.flags + 'g');
  while ((m = re.exec(h))) {
    const s = m.index, e = elementEnd(h, s);
    const keep = keepCode ? (h.slice(s, e).match(/<(style|script)\b[\s\S]*?<\/\1>/g) || []).join('\n') : '';
    h = h.slice(0, s) + keep + h.slice(e);
    re.lastIndex = s + keep.length; count++;
  }
  if (!count) console.warn('WARN nothing removed for', String(label));
  return count;
}
function replaceElement(openRe, fn) {
  const m = openRe.exec(h);
  if (!m) { console.warn('WARN not found', String(openRe)); return; }
  const e = elementEnd(h, m.index);
  h = h.slice(0, m.index) + fn(h.slice(m.index, e)) + h.slice(e);
}
function must(re, rep) { if (!re.test(h)) console.warn('WARN no match', String(re)); h = h.replace(re, rep); }

// ---------- 1. keep only the sections from the screenshots ----------
const KEEP = [/class="section hero dark"/, /class="wr-section"/, /class="wr-poster"/, /spline-section/, /class="section no-pad"/];
{
  const re = /<section\b[^>]*>/g; let m;
  while ((m = re.exec(h))) {
    if (KEEP.some(k => k.test(m[0]))) continue;
    const s = m.index, e = elementEnd(h, s);
    const code = (h.slice(s, e).match(/<(style|script)\b[\s\S]*?<\/\1>/g) || []).join('\n'); // shared CSS/JS lives in some sections
    h = h.slice(0, s) + code + h.slice(e);
    re.lastIndex = s + code.length;
  }
}
// anchors for nav
must(/<section class="wr-section"/, '<section id="work" class="wr-section"');
must(/<section class="section spline-section/, '<section id="about" class="section spline-section');
must(/<section([^>]*?)class="section no-pad"/, '<section id="contact"$1class="section no-pad"');

// remove content that is not wanted / belongs to Gleam's clients
removeAll(/<div[^>]*class="carousel-text-wrap"/, { label: 'hero client logos' });
removeAll(/<div class="wr-wall"/, { label: 'trusted by brands logo grid' });
removeAll(/<div[^>]*class="services-cta"/, { label: '4-card services grid' });
removeAll(/<div class="flex in-sec is-center"/, { label: 'world map' });
removeAll(/<a[^>]*class="webflow-partner[^"]*"/, { label: 'webflow badge' });
removeAll(/<div class="shopify-partner"/, { label: 'shopify badge' });
removeAll(/<div class="new_nav-work-m"/, { keepCode: true, label: 'nav work panel' });
removeAll(/<div class="new_nav-tools-m"/, { keepCode: true, label: 'nav tools panel' });
removeAll(/<a[^>]*class="new_nav-dd-card is-blog[^"]*"/, { label: 'nav blog card' });

// guard inline scroll script references to removed .services-cta and .wr-wall
must(
  /hero\.insertBefore\(hero\.querySelector\('\.services-cta'\)\.closest\('\.container'\),po\);/,
  "var _sc=hero&&hero.querySelector('.services-cta');if(_sc&&po)hero.insertBefore(_sc.closest('.container'),po);"
);
must(
  /\.fromTo\(veil,\{opacity:0\},\{opacity:1,duration:\.28,ease:'sine\.inOut'\},\.44\)\s*\.fromTo\(wall,\{autoAlpha:0\},\{autoAlpha:1,duration:\.08,ease:'none'\},\.66\)/,
  ''
);
must(
  /g\.fromTo\(veil,\{opacity:0\},\{opacity:1,ease:'sine\.inOut',scrollTrigger:\{trigger:wall,start:'top 165%',end:'top 88%',scrub:\.8\}\}\);\s*g\.fromTo\(wall,\{opacity:0\},\{opacity:1,ease:'none',scrollTrigger:\{trigger:wall,start:'top 96%',end:'top 62%',scrub:\.8\}\}\);/,
  ''
);

// ---------- 2. nav ----------
// logo svg -> text logo
replaceElement(/<div class="logo-code w-embed">/, () => `<div class="logo-code"><span class="aj-logo">${BRAND}</span></div>`);
// Work / Tools / Blog -> plain links (no Gleam dropdowns)
function simplifyNavLink(label, newLabel, href) {
  const re = /<a\b[^>]*class="nav-link[^"]*"[^>]*>/g; let m, n = 0;
  while ((m = re.exec(h))) {
    const e = elementEnd(h, m.index), inner = h.slice(m.index, e);
    if (!new RegExp(`<div>${label}</div>`).test(inner)) continue;
    const cls = m[0].match(/class="([^"]*)"/)[1].replace(/\bis-dd\b/, '').replace(/\s+/g, ' ').trim();
    const rep = `<a invert="text" href="${href}" class="${cls}"><div>${newLabel}</div></a>`;
    h = h.slice(0, m.index) + rep + h.slice(e); re.lastIndex = m.index + rep.length; n++;
  }
  if (!n) console.warn('WARN nav link not found', label);
}
// Remove "Work" link from navbar (both desktop & mobile)
{
  const re = /<a\b[^>]*class="nav-link[^"]*"[^>]*>/g; let m;
  while ((m = re.exec(h))) {
    const e = elementEnd(h, m.index), inner = h.slice(m.index, e);
    if (!/<div>Work<\/div>/.test(inner)) continue;
    h = h.slice(0, m.index) + h.slice(e);
    re.lastIndex = m.index;
  }
}
simplifyNavLink('Tools', 'About', 'about.html');
simplifyNavLink('Blog', 'Contact', 'contact.html');

// Replace the 4 Services dropdown cards with ONLY 2 cards: Website and Website + APK
replaceElement(/<div[^>]*class="new_nav-dd-card_grid"/, () => {
  const arrowSvg = `<div class="arrow-s w-embed"><svg width="100%" height="100%" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.13125 6.75H0V5.25H9.13125L4.93125 1.05L6 0L12 6L6 12L4.93125 10.95L9.13125 6.75Z" fill="currentColor"/></svg></div>`;
  const makeTags = (items) => {
    const row = items.map(t => `<div class="carousel-item p-2rem is-ser"><div class="tag is-ser"><div>${t}</div></div></div>`).join('');
    return `<div class="carousel-parent is-card"><div class="nav-carousel-move"><div class="carousel-wrap">${row}</div><div class="carousel-wrap">${row}</div></div></div>`;
  };
  const card = (pkg, time, title, desc, tags) =>
    `<a href="#contact" data-aj-service="${pkg}" class="new_nav-dd-card w-inline-block">` +
      `<div class="flex split"><div class="text-color-white">${time}</div>${arrowSvg}</div>` +
      `<div class="new_nav-dd-card-bottom"><p class="paragraph-l is-sora">${title}</p>` +
        `<div class="para-reveal"><p class="text-color-white">${desc}</p></div>${makeTags(tags)}` +
      `</div>` +
      `<img src="assets/cdn.prod.website-files.com/66bb1d0dc020bf46266e0c4a/6ae8b55c4051399ee0bf1da3_nav-sun.svg" loading="lazy" alt="" class="card-art"/>` +
      `<img src="assets/cdn.prod.website-files.com/66bb1d0dc020bf46266e0c4a/67ad57daecbbebd01e2eaa2a_gradient-s.svg" loading="lazy" alt="" class="card-bg"/>` +
    `</a>`;
  return `<div class="new_nav-dd-card_grid aj-two-services">` +
    card('Website', '1-3 weeks', 'Website', 'High-converting business websites, e-commerce stores, portfolios, and web apps built for speed and SEO.', ['Business Website', 'E-Commerce', 'Portfolio', 'SaaS / Web App']) +
    card('Website + APK', '2-5 weeks', 'Website + APK', 'Launch on web and Android together — pair your custom website with a WebView APK or Full Native Android APK.', ['Website + WebView APK', 'Website + Full APK', 'Play Store Ready', 'Push Ready']) +
  `</div>`;
});

// ---------- 3. footer ----------
must(/<img[^>]*Logo-white\.svg[^>]*>/, `<div class="aj-logo aj-logo-footer">${BRAND}</div>`);
must(/Your Light, Our Direction\./g, 'Websites & Android Apps built to perform.');
must(/© 2026 Gleam Studio Pvt Ltd/g, `© ${new Date().getFullYear()} ${BRAND}`);
replaceElement(/<div class="footer-links-wrap">/, () =>
  `<div class="footer-links-wrap">` +
    `<div class="footer-columns">` +
      `<div class="footer-column">` +
        `<div class="footer-link h"><strong>Company</strong></div>` +
        `<div class="footer-links">` +
          `<a href="about.html" class="footer-link">About Us</a>` +
          `<a href="customer-support.html" class="footer-link">Customer Support</a>` +
          `<a href="contact.html" class="footer-link">Contact Us</a>` +
        `</div>` +
      `</div>` +
      `<div class="footer-column">` +
        `<div class="footer-link h"><strong>Contact</strong></div>` +
        `<div class="footer-links">` +
          `<div class="paragraph-m"><strong>Address:</strong> ${ADDRESS}</div>` +
          `<div class="paragraph-m"><strong>Phone:</strong> ${PHONE}</div>` +
          `<div class="paragraph-m"><strong>Email:</strong> ${EMAIL}</div>` +
          `<div class="paragraph-m"><strong>Hours:</strong> ${HOURS}</div>` +
        `</div>` +
      `</div>` +
    `</div>` +
    `<div class="footer-links-bottom">` +
      `<a href="terms-of-service.html" class="footer-link s">Terms of Service</a>` +
      `<a href="privacy-policy.html" class="footer-link s">Privacy Policy</a>` +
    `</div>` +
  `</div>`
);

// ---------- 4. links: other Gleam pages no longer exist ----------
h = h.replace(/href="(?!index\.html")[^"#:]*?index\.html(#[^"]*)?"/g, 'href="#contact"');
h = h.replace(/href="https?:\/\/(www\.)?gleamstudio\.design[^"]*"/g, 'href="#"');
must(/<form([^>]*?) redirect="\/thank-you" data-redirect="\/thank-you"/, '<form$1');

// ---------- 5. head & SEO ----------
must(/<title>[\s\S]*?<\/title>/, `<title>${BRAND} | Custom Website &amp; Android APK Development Agency</title>`);
const DESC = `${BRAND} builds high-performing websites (Business, E-Commerce, Portfolio, SaaS) and Android APKs (WebView &amp; Full Native) engineered for speed, SEO, and conversion.`;
h = h.replace(/<meta (content="[^"]*" )?(name|property)="(description|og:description|twitter:description)"( content="[^"]*")?\/?>/g, (m, a, k, v) => `<meta ${k}="${v}" content="${DESC}"/>`);
h = h.replace(/<meta (content="[^"]*" )?(name|property)="(og:title|twitter:title)"( content="[^"]*")?\/?>/g, (m, a, k, v) => `<meta ${k}="${v}" content="${BRAND} | Website &amp; APK Development"/>`);
h = h.replace(/<meta [^>]*(og:image|twitter:image|og:url)[^>]*>/g, '');
h = h.replace(/<link[^>]*rel="(canonical|alternate|shortcut icon|apple-touch-icon|icon)"[^>]*>/g, '');
h = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
// Gleam's tracking / lead-report scripts
h = h.replace(/<script[^>]*gleam_cta_tracking[^>]*><\/script>/g, '');
h = h.replace(/<script\b[^>]*>(?:(?!<\/script>)[\s\S])*?supabase\.co[\s\S]*?<\/script>/g, '');
h = h.replace(/<script\b[^>]*>(?:(?!<\/script>)[\s\S])*?(googletagmanager|gtag\(|clarity\.ms|hotjar)[\s\S]*?<\/script>/g, '');

const LD_JSON = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: BRAND,
  url: 'https://aj-developer-7467b.web.app/',
  email: EMAIL,
  telephone: PHONE,
  description: DESC,
  address: {
    '@type': 'PostalAddress',
    streetAddress: '100 Logistics Park, Whitefield',
    addressLocality: 'Bengaluru',
    addressRegion: 'KA',
    postalCode: '560066',
    addressCountry: 'IN'
  },
  openingHours: 'Mo-Sa 09:00-19:00',
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Development Services',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Website Design & Development' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Website + Android APK (WebView & Full Native)' } }
    ]
  }
});

const FAVICON = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#000dff"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="28" fill="#fff">AJ</text></svg>`)}`;
must(/<\/head>/, `<meta name="keywords" content="AJ Developers, website development, web design, e-commerce website, SaaS web app, portfolio website, Android APK development, WebView APK, Bengaluru web agency"/>
<meta name="robots" content="index, follow"/>
<meta name="theme-color" content="#080912"/>
<link rel="canonical" href="https://aj-developer-7467b.web.app/"/>
<link rel="icon" href="${FAVICON}"/>
<script type="application/ld+json">${LD_JSON}</script>
<link rel="stylesheet" href="aj.css"/>
</head>`);
must(/<\/body>/, `<script type="module" src="firebase-init.js"></script>
<script src="aj.js"></script>
</body>`);

// ---------- 6. 3D scene: serve locally ----------
const SPLINE = 'https://prod.spline.design/OemZaz9nwST7iivs/scene.splinecode';
if (fs.existsSync(path.join(OUT, 'assets/prod.spline.design/OemZaz9nwST7iivs/scene.splinecode')))
  h = h.split(SPLINE).join('assets/prod.spline.design/OemZaz9nwST7iivs/scene.splinecode');

// ---------- 7. rebrand any remaining visible text / attributes ----------
function rebrand(s) { return s.replace(/gleam\s+studio('s)?/gi, BRAND + '$1').replace(/\bgleam\b(?!-)/gi, BRAND); }
h = h.replace(/(<(script|style)\b[\s\S]*?<\/\2>)|(<[^>]+>)|([^<]+)/g, (m, code, _t, tag, text) => {
  if (code) return code;
  if (tag) return tag.replace(/\b(alt|title|aria-label|content|placeholder|value)="([^"]*)"/g, (a, k, v) => `${k}="${rebrand(v)}"`);
  return rebrand(text);
});

fs.writeFileSync(path.join(OUT, 'index.html'), h);

// ---------- 8. copy only the assets this page uses ----------
const ASSET_RE = /assets\/(?:[^\s"'<>()\\]|(?:\([^\s"'<>()\\]*\)))*?\.(?:png|jpe?g|webp|avif|gif|svg|mp4|webm|css|js|woff2?|ttf|otf|json|ico|splinecode)/gi;
const copied = new Set();
function copyAsset(relPath) {
  relPath = relPath.replace(/\\/g, '/');
  if (copied.has(relPath)) return; copied.add(relPath);
  const from = path.join(SRC_ROOT, relPath), to = path.join(OUT, relPath);
  if (!fs.existsSync(from)) { if (!fs.existsSync(to)) console.warn('missing asset', relPath); return; }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  if (/\.css$/i.test(relPath)) { // follow url() inside CSS
    const css = fs.readFileSync(from, 'utf8');
    for (const m of css.matchAll(/url\(\s*(?:(["'])(.*?)\1|([^'")\s]+))\s*\)/g)) {
      const u = m[2] ?? m[3];
      if (!u || /^(data:|https?:|#)/.test(u)) continue;
      copyAsset(path.posix.normalize(path.posix.join(path.posix.dirname(relPath), u)));
    }
  }
}
for (const m of h.matchAll(ASSET_RE)) copyAsset(m[0]);
console.log(`index.html written (${(h.length / 1024).toFixed(0)} KB), ${copied.size} assets copied`);
const left = (h.replace(/<(script|style)\b[\s\S]*?<\/\1>/g, '').match(/[^\s>"]{0,30}gleam[^\s<"]{0,30}/gi) || []).filter(s => !/^(assets\/|class=)/.test(s));
console.log('remaining "gleam" mentions outside code:', [...new Set(left)].slice(0, 20));
