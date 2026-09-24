/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the comfortable-light columns variant. Base block: columns.
 * Source: https://www.destinationpet.com/ (.mediainfo)
 * Model: core/franklin/components/columns (2 columns, 1 row).
 * Columns blocks: NO field hints (per hinting rules). Cells hold default content only.
 * Generated: 2026-09-23
 *
 * Emitted as the EDS block variant `columns (comfortable-light)` so it renders
 * <div class="columns comfortable-light"> — the variant is carried as a class on
 * the core columns block, which is what survives md2jcr → JCR conversion (a
 * distinct `columns-comfortable-light` block name would be flattened to plain
 * `columns` and lose the variant styling).
 *
 * Layout: left cell = image, right cell = headings + richtext.
 * DM/Scene7 <img> is left as-is (carrier form handled by DM transformer downstream).
 */
export default function parse(element, { document }) {
  // Left column: image
  const image = element.querySelector('.media-info__left img, .cmp-image img, img');

  // Right column: titles + richtext, in document order.
  const rightContent = [];
  const right = element.querySelector('.media-info__right, .media-info__content');
  const scope = right || element;
  scope
    .querySelectorAll('.cmp-title__text, h1, h2, h3, h4, h5, h6, .cmp-text > p, .cmp-text, p')
    .forEach((node) => {
      // Avoid double-capturing: skip <p> that is a descendant of an already-added .cmp-text
      if (node.matches('p') && node.closest('.cmp-text')
        && rightContent.includes(node.closest('.cmp-text'))) return;
      rightContent.push(node);
    });

  // Empty-block guard
  if (!image && rightContent.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const leftCell = image ? [image] : [''];
  const rightCell = rightContent.length ? rightContent : [''];

  const cells = [
    [leftCell, rightCell],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns (comfortable-light)', cells });
  element.replaceWith(block);
}
