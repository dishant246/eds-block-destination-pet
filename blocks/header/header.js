// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(width >= 900px)');

/**
 * Fetches the nav fragment. Metadata-independent: /content first (local
 * preview), then the site root (DA/EDS production).
 * @returns {Promise<{html: string, url: string}|null>}
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  return { html: await resp.text(), url: resp.url };
}

/**
 * Fragment images use paths relative to the fragment; resolve them against
 * the fragment URL so they work on every page depth.
 */
function resolveImages(root, baseUrl) {
  root.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), baseUrl).href;
  });
}

function setExpanded(item, expanded) {
  item.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  const trigger = item.querySelector(':scope > a, :scope > button');
  if (trigger) trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  if (!expanded) item.querySelectorAll('.nav-drop').forEach((d) => setExpanded(d, false));
}

function closeAll(scope) {
  scope.querySelectorAll('.nav-drop[aria-expanded="true"]').forEach((d) => setExpanded(d, false));
}

function toggleMenu(nav, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  if (button) button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  if (expanded) closeAll(nav);
}

/**
 * Turns every list item holding a sub-list into a dropdown: hover opens it on
 * desktop, a click on its label toggles it everywhere.
 */
function decorateDropdowns(sections) {
  sections.querySelectorAll('li').forEach((li) => {
    const sub = li.querySelector(':scope > ul');
    if (!sub) return;
    const nested = !!li.parentElement.closest('li');
    li.classList.add('nav-drop', nested ? 'nav-drop-nested' : 'nav-drop-top');
    sub.classList.add(nested ? 'nav-flyout' : 'nav-dropdown');
    let trigger = li.querySelector(':scope > a');
    if (!trigger) {
      // label authored as plain text: wrap it so it can be focused and toggled
      trigger = document.createElement('button');
      trigger.type = 'button';
      [...li.childNodes].filter((n) => n !== sub).forEach((n) => trigger.append(n));
      li.prepend(trigger);
    }
    trigger.setAttribute('aria-haspopup', 'true');
    setExpanded(li, false);
    const isPlaceholder = trigger.tagName === 'BUTTON'
      || ['', '#'].includes(trigger.getAttribute('href'));

    trigger.addEventListener('click', (e) => {
      if (!isPlaceholder && isDesktop.matches) return; // real link: navigate
      e.preventDefault();
      const open = li.getAttribute('aria-expanded') !== 'true';
      if (open) {
        [...li.parentElement.children].forEach((sib) => sib !== li && setExpanded(sib, false));
      }
      setExpanded(li, open);
    });
    li.addEventListener('mouseenter', () => { if (isDesktop.matches) setExpanded(li, true); });
    li.addEventListener('mouseleave', () => { if (isDesktop.matches) setExpanded(li, false); });
  });
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  block.textContent = '';
  if (!fragment) return;

  const content = document.createElement('div');
  content.innerHTML = fragment.html;
  resolveImages(content, fragment.url);

  // links to other sites (e.g. the social icons) open in a new tab, like the source
  content.querySelectorAll('a[href]').forEach((a) => {
    const url = new URL(a.href, window.location.href);
    if (url.protocol.startsWith('http') && url.hostname !== window.location.hostname) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
  });

  // sections in authored order; a leading third section is the top ribbon
  const sectionEls = [...content.children].filter((el) => el.tagName === 'DIV');
  const names = sectionEls.length >= 3 ? ['ribbon', 'brand', 'sections'] : ['brand', 'sections'];

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');
  nav.setAttribute('aria-label', 'Main navigation');

  let ribbon = null;
  sectionEls.forEach((el, i) => {
    const name = names[i] || `extra-${i}`;
    el.classList.add(`nav-${name}`);
    if (name === 'ribbon') ribbon = el;
    else nav.append(el);
  });

  const brand = nav.querySelector('.nav-brand');
  const brandLink = brand && brand.querySelector('a');
  if (brandLink && brandLink.querySelector('img')) brandLink.setAttribute('aria-label', brandLink.querySelector('img').alt || 'Home');

  const sections = nav.querySelector('.nav-sections');
  if (sections) decorateDropdowns(sections);

  // hamburger (mobile)
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = '<button type="button" aria-controls="nav" aria-label="Open navigation"><span class="nav-hamburger-icon"></span></button>';
  hamburger.querySelector('button').addEventListener('click', () => toggleMenu(nav));
  nav.append(hamburger);

  // close everything on Escape / outside click
  document.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    if (nav.querySelector('.nav-drop[aria-expanded="true"]')) closeAll(nav);
    else if (!isDesktop.matches && nav.getAttribute('aria-expanded') === 'true') toggleMenu(nav, false);
  });
  document.addEventListener('click', (e) => {
    if (isDesktop.matches && !nav.contains(e.target)) closeAll(nav);
  });

  // reset state when crossing the desktop breakpoint
  isDesktop.addEventListener('change', () => {
    closeAll(nav);
    toggleMenu(nav, false);
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  if (ribbon) navWrapper.append(ribbon);
  navWrapper.append(nav);
  block.append(navWrapper);
}
