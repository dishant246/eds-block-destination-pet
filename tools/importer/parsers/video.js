/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the video block. Base block: video (blocks/video).
 * Source: https://destinationpet.com/join-our-pack/life-at-dp/ (the "One Pack" .video element)
 *
 * EDS video convention: 1-column table; block-name row, then a row with the video
 * source (link/URL), then an optional row with a poster image. The source is a
 * native <video> with a webm src and a poster; the video block's decorate() reads
 * the source from an <a> href and the poster from a <picture>.
 *
 * xwalk model (blocks/video/_video.json): uri (aem-content) + placeholder_image
 * (reference) + placeholder_imageAlt (collapsed → img alt); classes skipped.
 */
export default function parse(element, { document }) {
  const video = element.querySelector('video');
  if (!video) return; // not a video block — leave untouched

  const src = video.getAttribute('src')
    || (video.querySelector('source') && video.querySelector('source').getAttribute('src'))
    || '';
  const poster = video.getAttribute('poster') || '';
  if (!src) return;

  const cells = [];

  // Row 2: video URL (field:uri) as a link — the decorator reads block <a> href.
  const link = document.createElement('a');
  link.href = src;
  link.textContent = src;
  cells.push([[document.createComment(' field:uri '), link]]);

  // Row 3 (optional): poster image (field:placeholder_image). Emit a plain <img>
  // so the DM transformer converts it to a <picture>; the decorator uses it as
  // the click-to-play placeholder.
  if (poster) {
    const img = document.createElement('img');
    img.src = poster;
    img.alt = '';
    cells.push([[document.createComment(' field:placeholder_image '), img]]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'video', cells });
  element.replaceWith(block);
}
