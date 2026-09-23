/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards. Base block: cards (container block).
 * Source: https://www.destinationpet.com/
 *   (.columncontainer.background-color--tertiary.spacing__top-bottom--40px:nth-of-type(3))
 * Model (blocks/cards/_cards.json): container `cards` with child `card` items.
 *   Each card: image (reference) + imageAlt (collapsed) + text (richtext).
 * Generated: 2026-09-23
 *
 * structure.json: 3 cards (repeating `.info-card--center.infocards`, iterationSafe: true).
 * Each card row has 2 cells: [image] and [text: h2 title, h3 subtitle, p description].
 * DM/Scene7 <img> left as-is (carrier form handled by DM transformer downstream).
 *
 * The source section leads with a centered title (`.cmp-title__text`, e.g.
 * "We work together to be...") that sits above the card grid, and closes with a
 * trailing CTA link (e.g. "More about us") below the grid. Both are default
 * content — the heading is inserted before the block, the CTA after it — so they
 * survive import instead of being discarded with the replaced container.
 */
export default function parse(element, { document }) {
  // Preserve the leading section heading (default content above the block).
  // It is the first `.cmp-title__text` that is NOT inside a card.
  const cards0 = Array.from(element.querySelectorAll('.infocards, .info-card--center'));
  const leadTitle = Array.from(element.querySelectorAll('.cmp-title__text'))
    .find((t) => !cards0.some((c) => c.contains(t)));

  // Preserve a trailing CTA link (default content below the block). It is a link
  // that is NOT inside any card (the source uses `.button__bdl`; fall back to any
  // section-level anchor with visible text that isn't within a card).
  const trailingCta = Array.from(element.querySelectorAll('a'))
    .find((a) => a.textContent.trim() && !cards0.some((c) => c.contains(a)));

  // Iterate the stable inner card wrapper. `.infocards` is a plain div (not an
  // interactive element), so iteration is safe per structure.json.
  const cards = Array.from(element.querySelectorAll('.infocards, .info-card--center'));

  // De-duplicate in case both class selectors match the same node.
  const seen = new Set();
  const uniqueCards = cards.filter((c) => {
    if (seen.has(c)) return false;
    seen.add(c);
    return true;
  });

  const cells = [];

  uniqueCards.forEach((card) => {
    // Image cell
    const image = card.querySelector('.info-card__asset img, .cmp-image img, img');

    // Text cell: titles + description, in document order.
    const textParts = [];
    const textScope = card.querySelector('.info-card__text') || card;
    textScope
      .querySelectorAll('.cmp-title__text, .cmp-text > p, .cmp-text, p')
      .forEach((node) => {
        if (node.matches('p') && node.closest('.cmp-text')
          && textParts.includes(node.closest('.cmp-text'))) return;
        if (node.textContent.trim()) textParts.push(node);
      });

    // Skip fully-empty cards
    if (!image && textParts.length === 0) return;

    const imageCell = image
      ? [document.createComment(' field:image '), image]
      : '';
    const textCell = textParts.length
      ? [document.createComment(' field:text '), ...textParts]
      : '';

    cells.push([imageCell, textCell]);
  });

  // Empty-block guard
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });
  element.replaceWith(block);

  // Re-insert the leading section heading as default content ABOVE the block,
  // so "We work together to be..." survives import instead of being discarded
  // with the replaced container.
  if (leadTitle && leadTitle.textContent.trim()) {
    const heading = document.createElement('h2');
    heading.textContent = leadTitle.textContent.trim();
    block.parentNode.insertBefore(heading, block);
  }

  // Re-insert the trailing CTA as default content BELOW the block. A standalone
  // link in its own paragraph is decorated as a button by EDS, matching the
  // source's "More about us" call-to-action beneath the card grid.
  if (trailingCta && trailingCta.getAttribute('href')) {
    const link = document.createElement('a');
    link.setAttribute('href', trailingCta.getAttribute('href'));
    link.textContent = trailingCta.textContent.trim();
    const para = document.createElement('p');
    para.append(link);
    if (block.nextSibling) {
      block.parentNode.insertBefore(para, block.nextSibling);
    } else {
      block.parentNode.append(para);
    }
  }
}
