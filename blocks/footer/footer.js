/**
 * Fetches the footer fragment. Metadata-independent: /content first (local
 * preview), then the site root (DA/EDS production).
 * @returns {Promise<{html: string, url: string}|null>}
 */
async function fetchFooter() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  return { html: await resp.text(), url: resp.url };
}

/**
 * Prepares fragment content: image paths resolve against the fragment URL (so
 * they work at every page depth) and links to other sites open in a new tab.
 */
function prepareContent(root, baseUrl) {
  root.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), baseUrl).href;
    img.loading = 'lazy';
  });
  root.querySelectorAll('a[href]').forEach((a) => {
    const url = new URL(a.href, window.location.href);
    if (url.protocol.startsWith('http') && url.hostname !== window.location.hostname) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
  });
}

/**
 * Tags a list whose items are only image links (e.g. social icons).
 */
function markIconLists(root) {
  root.querySelectorAll('ul').forEach((ul) => {
    const items = [...ul.children];
    const iconOnly = items.length && items.every((li) => {
      const a = li.querySelector('a');
      return a && a.querySelector('img') && !a.textContent.trim();
    });
    if (iconOnly) ul.classList.add('footer-icons');
  });
}

/**
 * Makes a column heading toggle the rest of its column (mobile accordion; the
 * columns are always open on desktop via CSS). Sections open independently.
 */
function decorateToggle(column) {
  const heading = column.querySelector(':scope > h2, :scope > h3');
  if (!heading) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'footer-toggle';
  button.setAttribute('aria-expanded', 'false');
  button.append(...heading.childNodes);
  heading.append(button);
  button.addEventListener('click', () => {
    button.setAttribute('aria-expanded', button.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooter();
  block.textContent = '';
  if (!fragment) return;

  const content = document.createElement('div');
  content.innerHTML = fragment.html;
  prepareContent(content, fragment.url);
  markIconLists(content);

  // authored sections: first = brand, last = bottom bar, the rest = columns
  const sections = [...content.children].filter((el) => el.tagName === 'DIV');
  const inner = document.createElement('div');
  inner.className = 'footer-inner';

  const columns = document.createElement('div');
  columns.className = 'footer-columns';

  sections.forEach((section, i) => {
    if (i === 0 && sections.length > 1) {
      section.className = 'footer-brand';
      inner.append(section);
    } else if (i === sections.length - 1 && sections.length > 2) {
      section.className = 'footer-bottom';
      if (columns.children.length) inner.append(columns);
      inner.append(section);
    } else {
      section.className = 'footer-column';
      decorateToggle(section);
      columns.append(section);
    }
  });
  if (columns.children.length && !columns.parentElement) inner.append(columns);

  block.append(inner);
}
