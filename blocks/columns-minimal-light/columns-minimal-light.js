/**
 * Decorate the columns-minimal-light block.
 *
 * Structure: a minimal, centered call-to-action band — typically a single cell
 * holding one button (and optionally a short line of text). Columns are counted
 * for layout parity with the base columns block, and any image-only column is
 * tagged so the CSS can treat it independently.
 */
export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-minimal-light-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          picWrapper.classList.add('columns-minimal-light-img-col');
        }
      }
    });
  });
}
