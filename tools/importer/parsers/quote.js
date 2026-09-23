/* eslint-disable */
/* global WebImporter */
/**
 * Parser for quote. Base block: quote.
 * Source: https://www.destinationpet.com/
 *   (.columncontainer.background-color--tertiary.spacing__top-bottom--40px:nth-of-type(5))
 * Model (blocks/quote/_quote.json): quotation (richtext), attribution (richtext).
 * Generated: 2026-09-23
 *
 * No library-description available (base "quote" not in catalog) — structure derived
 * from source. Simple block: 1 column, one row per model field.
 *   Row 2: field:quotation  — the testimonial body paragraph.
 *   Row 3: field:attribution — the "- Name, Role" paragraph (+ empty header name/address).
 * structure.json: 4 <p> in the testimonial; header name/address are blank.
 */
export default function parse(element, { document }) {
  const testimonial = element.querySelector('.testimonial') || element;

  // Preserve the leading section heading (e.g. "Testimonials") as default content
  // above the block. It is the first `.cmp-title__text` not inside the testimonial.
  const leadTitle = Array.from(element.querySelectorAll('.cmp-title__text'))
    .find((t) => !testimonial.contains(t));

  // Body paragraphs live in .testimonial__description .cmp-text
  const descParas = Array.from(
    testimonial.querySelectorAll('.testimonial__description .cmp-text > p, .testimonial__description p'),
  ).filter((p) => p.textContent.trim());

  // First paragraph = quotation; remaining paragraph(s) = attribution.
  const quotation = descParas.length ? descParas[0] : null;
  const attributionParas = descParas.slice(1);

  // Fallback attribution from header info (name / address) if description had none.
  if (attributionParas.length === 0) {
    testimonial
      .querySelectorAll('.testimonial__header-name, .testimonial__header-address')
      .forEach((p) => {
        if (p.textContent.trim()) attributionParas.push(p);
      });
  }

  // Empty-block guard
  if (!quotation && attributionParas.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: quotation (field:quotation)
  if (quotation) {
    cells.push([[document.createComment(' field:quotation '), quotation]]);
  }

  // Row 3: attribution (field:attribution)
  if (attributionParas.length) {
    cells.push([[document.createComment(' field:attribution '), ...attributionParas]]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'quote', cells });
  element.replaceWith(block);

  // Re-insert the leading section heading as default content ABOVE the block,
  // so "Testimonials" survives import instead of being discarded with the container.
  if (leadTitle && leadTitle.textContent.trim()) {
    const heading = document.createElement('h2');
    heading.textContent = leadTitle.textContent.trim();
    block.parentNode.insertBefore(heading, block);
  }
}
