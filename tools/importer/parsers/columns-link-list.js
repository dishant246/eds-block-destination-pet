/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the link-list columns variant. Base block: columns.
 * Source: https://destinationpet.com/our-locations/ (the state index under
 *   "100s of locations nationwide": a row of `.container__column`s, each a stack
 *   of `.link` anchors jumping to the state sections, e.g. href="#arizona").
 *
 * EDS columns convention: block-name row (+ variant), then one row with a cell
 * per column. Emitted as `columns (link-list)` (the variant is a `classes`
 * value on the core columns block, which survives md2jcr); each cell is a <ul>
 * of links — list items, so EDS does not turn them into buttons. Columns blocks
 * take no field hints.
 *
 * In-page anchors are normalized to the ids EDS generates for headings
 * (lowercase, hyphenated: "#New-Hampshire" → "#new-hampshire") so they still
 * land on the migrated state headings.
 */
function slugifyHash(href, text) {
  const target = href.length > 1 ? decodeURIComponent(href.slice(1)) : text;
  return `#${target.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

export default function parse(element, { document }) {
  const columns = Array.from(element.querySelectorAll('.container__column'))
    .filter((col) => col.querySelector('.link a[href]') && !col.querySelector('.container__column'));

  const cells = columns.map((col) => {
    const list = document.createElement('ul');
    col.querySelectorAll('.link a[href]').forEach((a) => {
      const text = a.textContent.trim();
      if (!text) return;
      const href = a.getAttribute('href');
      const link = document.createElement('a');
      link.setAttribute('href', href.startsWith('#') ? slugifyHash(href, text) : href);
      link.textContent = text;
      const li = document.createElement('li');
      li.append(link);
      list.append(li);
    });
    return list.children.length ? list : '';
  }).filter(Boolean);

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns (link-list)', cells: [cells] });
  element.replaceWith(block);
}
