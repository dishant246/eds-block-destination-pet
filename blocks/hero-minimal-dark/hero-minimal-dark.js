import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Decorate the hero-minimal-dark block.
 *
 * Structure: a full-bleed background image with a single heading overlaid on top.
 * Row 1 (optional) = background image, Row 2 = heading/text. The image is pulled
 * behind the text via CSS (position: absolute; z-index: -1) so the heading sits on it.
 */
export default function decorate(block) {
  // Normalize any authored <img> into an optimized <picture>.
  block.querySelectorAll('img').forEach((img) => {
    const optimized = createOptimizedPicture(
      img.src,
      img.alt || '',
      true,
      [{ width: '2000' }],
    );
    const existingPicture = img.closest('picture');
    if (existingPicture) {
      existingPicture.replaceWith(optimized);
    } else {
      img.replaceWith(optimized);
    }
  });

  // Identify the background media cell (the row that holds a picture) and the
  // content cell (the row that holds the heading/text).
  const rows = [...block.children];
  rows.forEach((row) => {
    if (row.querySelector('picture')) {
      row.classList.add('hero-minimal-dark-media');
    } else {
      row.classList.add('hero-minimal-dark-content');
    }
  });
}
