/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-minimal-light. Base block: columns.
 * Source: https://www.destinationpet.com/ (.columncontainer.spacing__top--40px)
 * Model: core/franklin/components/columns (1 column, 1 row).
 * Columns blocks: NO field hints (per hinting rules). Cells hold default content only.
 * Generated: 2026-09-23
 *
 * structure.json reports 3 `.col-...` units but 2 are empty placeholders — only the
 * populated info-card column carries content (image + richtext + CTA button). This is a
 * single-column CTA. We collect the info-card's inner content into one cell.
 * DM/Scene7 <img> left as-is (carrier form handled by DM transformer downstream).
 */
export default function parse(element, { document }) {
  // The content lives inside the populated info-card text wrapper.
  const contentScope = element.querySelector('.info-card__text, .infocards')
    || element;

  const contentCell = [];

  const image = contentScope.querySelector('.cmp-image img, img');
  if (image) contentCell.push(image);

  contentScope.querySelectorAll('.cmp-text > p, .cmp-text, p').forEach((node) => {
    // Avoid double-adding a <p> already contained by an added .cmp-text
    if (node.matches('p') && node.closest('.cmp-text')
      && contentCell.includes(node.closest('.cmp-text'))) return;
    if (node.textContent.trim()) contentCell.push(node);
  });

  // CTA button/link
  const cta = contentScope.querySelector('a.button__bdl, .button a, a[href]');
  if (cta) {
    // Prefer the readable label if present
    const label = cta.querySelector('.button__text');
    if (label && label.textContent.trim()) {
      cta.textContent = label.textContent.trim();
    }
    contentCell.push(cta);
  }

  // Empty-block guard
  if (contentCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [
    [contentCell],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-minimal-light', cells });
  element.replaceWith(block);
}
