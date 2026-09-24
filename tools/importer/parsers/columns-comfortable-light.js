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
 * Layout: a two-column image + text row. Handles two source shapes:
 *   1) Homepage "Who We Are": .media-info__left (image) / .media-info__right (text)
 *   2) Team bio .mediainfo: .cmp-image (image) + .cmp-title/.cmp-text (heading + copy),
 *      with the image on either side (the source alternates image-left / image-right).
 * The image/text COLUMN ORDER is preserved from the source DOM so alternating bios
 * keep their side. DM/Scene7 <img> is left as-is (DM transformer handles it downstream).
 */
export default function parse(element, { document }) {
  // Locate the image and the text by CONTENT, not by a fixed left/right class:
  // the source alternates which side (.media-info__left / __right) holds the image
  // vs the text (homepage: image-left/text-right; some bios: text-left/image-right).
  const image = element.querySelector('.cmp-image img, img');

  // The image's own column wrapper (whichever side it's on) — its text must be
  // excluded from the text cell.
  const imageColumn = image
    ? (image.closest('.media-info__left, .media-info__right, .media-info__content') || image.closest('.cmp-image'))
    : null;

  // Collect heading + paragraph text from anywhere in the block that is NOT inside
  // the image's column, in document order.
  const textContent = [];
  element
    .querySelectorAll('.cmp-title__text, h1, h2, h3, h4, h5, h6, .cmp-text > p, .cmp-text, p')
    .forEach((node) => {
      if (imageColumn && imageColumn.contains(node)) return; // skip image-side nodes
      if (node.matches('p') && node.closest('.cmp-text')
        && textContent.includes(node.closest('.cmp-text'))) return;
      if (!node.textContent.trim()) return;
      textContent.push(node);
    });

  // Empty-block guard
  if (!image && textContent.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const imageCell = image ? [image] : [''];
  const textCell = textContent.length ? textContent : [''];

  // Preserve source column order. Base order comes from the DOM: if the text
  // appears BEFORE the image, the base is text-left / image-right; otherwise
  // image-left / text-right. BUT the source's `.media-info--right` modifier
  // REVERSES the visual left→right order (it maps to a row-reverse in the source
  // CSS), so a bio's on-screen image side = DOM order XOR that modifier. Without
  // honoring it, Jason (DOM text→image + modifier ⇒ image LEFT) and Rob (DOM
  // image→text + modifier ⇒ image RIGHT) render on the wrong side. In the EDS
  // columns block the first cell is the left column, so we build the DOM-order
  // row and reverse the two cells when the modifier is present.
  let row;
  if (image && textContent.length
    && (image.compareDocumentPosition(textContent[0]) & Node.DOCUMENT_POSITION_PRECEDING)) {
    row = [textCell, imageCell];
  } else {
    row = [imageCell, textCell];
  }
  if (element.classList && element.classList.contains('media-info--right')) {
    row.reverse();
  }
  const cells = [row];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns (comfortable-light)', cells });
  element.replaceWith(block);
}
