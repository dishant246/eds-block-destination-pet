/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-minimal-dark. Base block: hero.
 * Source: https://www.destinationpet.com/ (.hero.teaser)
 * Model fields (blocks/hero-minimal-dark/_hero-minimal-dark.json):
 *   image (reference), imageAlt (collapsed -> img alt), text (richtext)
 * Generated: 2026-09-23
 *
 * Structure (structure.json): single instance, 1 image, 1 heading, 1 paragraph.
 * The DM/Scene7 image already appears as a plain <img> (carrier form handled downstream).
 * Table: 1 column. Row 2 = image (field:image), Row 3 = text (field:text).
 */
export default function parse(element, { document }) {
  // --- Image (background asset) ---
  // Source nests the asset inside .hero__image .../ img. Fall back to any hero img.
  const image = element.querySelector('.hero__image img, .s7dm-dynamic-media img, img');

  // --- Text content: heading + subheading + CTAs ---
  const heading = element.querySelector(
    '.hero__content .cmp-title__text, .hero__content h1, .hero__content h2, h1, h2',
  );
  const description = element.querySelector(
    '.hero__content-description p, .hero__content p',
  );
  const ctaLinks = Array.from(
    element.querySelectorAll('.hero__content a, .hero__content-action a'),
  );

  // Empty-block guard: bail if neither image nor text present.
  const hasText = (heading && heading.textContent.trim())
    || (description && description.textContent.trim())
    || ctaLinks.length;
  if (!image && !hasText) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: image cell (field:image). imageAlt is collapsed into the <img alt>.
  if (image) {
    cells.push([[document.createComment(' field:image '), image]]);
  }

  // Row 3: text cell (field:text) — heading, subheading, CTAs as richtext.
  const textCell = [document.createComment(' field:text ')];
  if (heading) textCell.push(heading);
  if (description && description.textContent.trim()) textCell.push(description);
  ctaLinks.forEach((a) => textCell.push(a));
  if (textCell.length > 1) {
    cells.push([textCell]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-minimal-dark', cells });
  element.replaceWith(block);
}
