/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the accordion block. Base block: accordion (container).
 * Source: https://destinationpet.com/join-our-pack/life-at-dp/
 *   (.accordion.panelcontainer — the "Job Shadow Experience" collapsibles).
 *
 * EDS accordion convention: 2-column table; block-name row, then one row per
 * accordion item = [ title cell, content cell ]. The source item markup is
 * `.cmp-accordion__item` with a `.cmp-accordion__title` header (title) and a
 * `.cmp-accordion__panel` body (content).
 *
 * xwalk item model `accordion-item`: summary (text) → title cell, text
 * (richtext) → content cell. Each non-empty cell carries its field hint so the
 * Universal Editor maps it to the right property (only Columns blocks are exempt).
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('.cmp-accordion__item'));
  if (items.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  items.forEach((item) => {
    const titleEl = item.querySelector('.cmp-accordion__title');
    const panel = item.querySelector('.cmp-accordion__panel');
    const label = titleEl ? titleEl.textContent.trim() : '';
    if (!label && !panel) return;

    // Content cell: pull the panel's rich content (paragraphs, lists, etc.).
    // Prefer the inner richtext wrapper's children; fall back to the panel.
    const bodyParts = [];
    const richScope = panel ? (panel.querySelector('.richtext') || panel) : null;
    if (richScope) {
      Array.from(richScope.children).forEach((node) => {
        if (node.textContent.trim() || node.querySelector('img, br')) bodyParts.push(node);
      });
      if (bodyParts.length === 0 && richScope.textContent.trim()) {
        const p = document.createElement('p');
        p.textContent = richScope.textContent.trim();
        bodyParts.push(p);
      }
    }

    const titleCell = label
      ? [document.createComment(' field:summary '), document.createTextNode(label)]
      : '';
    const contentCell = bodyParts.length
      ? [document.createComment(' field:text '), ...bodyParts]
      : '';
    cells.push([titleCell, contentCell]);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion', cells });
  element.replaceWith(block);
}
