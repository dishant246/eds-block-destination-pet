/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the carousel block. Base block: carousel (container).
 * Source: https://destinationpet.com/sell-your-business/sell-your-pet-resort/
 *   (.carousel.panelcontainer — a slick slider; e.g. the "Testimonials" quote
 *   slider and the "How selling works:" step slider).
 *
 * EDS carousel convention: block-name row (+ variants), then one row per slide
 * = [image cell, text-content cell]. xwalk item model `carousel-item`:
 *   media_image (reference) + media_imageAlt (collapsed → img alt) → image cell
 *   content_text (richtext: title / description / CTA)            → content cell
 * The image cell is the convention's image; testimonial slides have NO image in
 * the source, so their image cell is left empty (never invented).
 *
 * Container options come from the source slider settings and are emitted as
 * block variants (the container model's `classes` field — no row):
 *   autoplay    ← data-slick {"autoplay": true} (the step slider)
 *   hide-arrows ← `.arrows--hidden` on the slider wrapper (dots-only slider)
 *   left        ← testimonial copy not authored as centered (vet-practice)
 *
 * Only real slides are read (slick `.slick-cloned` copies are skipped), and all
 * nodes are cloned so the quote/cards parsers can't also consume them.
 */
export default function parse(element, { document }) {
  const wrapper = element.querySelector('.carousel__item-wrapper') || element;

  let settings = {};
  try {
    settings = JSON.parse(wrapper.getAttribute('data-slick') || '{}');
  } catch (e) {
    settings = {};
  }
  const variants = [];
  if (settings.autoplay === true) variants.push('autoplay');
  if (wrapper.classList.contains('arrows--hidden')) variants.push('hide-arrows');
  // Testimonial copy is centered only when the source paragraphs are authored
  // with an inline `text-align: center` (pet-resort); otherwise it is
  // left-aligned (vet-practice) → `left` variant.
  const quoteParas = Array.from(element.querySelectorAll('.testimonial__description p'));
  if (quoteParas.length
    && !quoteParas.some((p) => /text-align:\s*center/i.test(p.getAttribute('style') || ''))) {
    variants.push('left');
  }

  const items = Array.from(element.querySelectorAll('.carousel__item'))
    .filter((item) => !item.closest('.slick-cloned'));

  const cells = [];
  items.forEach((item) => {
    const content = [];
    let image = null;

    const testimonial = item.querySelector('.testimonial');
    if (testimonial) {
      // Header name (bold) / address render ABOVE the quote in the source when
      // present (e.g. "Dr. Barbara Darnell"); then the quote + attribution copy.
      testimonial
        .querySelectorAll('.testimonial__header-name, .testimonial__header-address')
        .forEach((p) => {
          if (!p.textContent.trim()) return;
          const para = document.createElement('p');
          if (p.classList.contains('testimonial__header-name')) {
            const strong = document.createElement('strong');
            strong.textContent = p.textContent.trim();
            para.append(strong);
          } else {
            para.textContent = p.textContent.trim();
          }
          content.push(para);
        });
      testimonial
        .querySelectorAll('.testimonial__description p')
        .forEach((p) => { if (p.textContent.trim()) content.push(p.cloneNode(true)); });
    } else {
      const img = item.querySelector('.info-card__asset img, .cmp-image img, img');
      if (img) image = img.cloneNode(true);
      const scope = item.querySelector('.info-card__text') || item;
      // Title → heading; description paragraphs; CTA links (convention order).
      scope.querySelectorAll('.cmp-title__text, .cmp-text p').forEach((node) => {
        if (!node.textContent.trim()) return;
        if (node.matches('.cmp-title__text')) {
          const h = document.createElement('h3');
          h.textContent = node.textContent.trim();
          content.push(h);
        } else {
          content.push(node.cloneNode(true));
        }
      });
      scope.querySelectorAll('a[href]').forEach((a) => {
        if (!a.textContent.trim()) return;
        const link = document.createElement('a');
        link.setAttribute('href', a.getAttribute('href'));
        link.textContent = a.textContent.trim();
        content.push(link);
      });
    }

    if (!image && content.length === 0) return;

    const imageCell = image ? [document.createComment(' field:media_image '), image] : '';
    const contentCell = content.length ? [document.createComment(' field:content_text '), ...content] : '';
    cells.push([imageCell, contentCell]);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const name = variants.length ? `carousel (${variants.join(', ')})` : 'carousel';
  const block = WebImporter.Blocks.createBlock(document, { name, cells });
  element.replaceWith(block);
}
