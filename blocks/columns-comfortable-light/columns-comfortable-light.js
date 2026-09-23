/**
 * Decorate the columns-comfortable-light block.
 *
 * Structure: a two-column row — a media column (image / image slider) beside a
 * text column (heading + story copy). Mirrors the vanilla columns behaviour:
 * columns are counted for layout, and image-only columns are tagged so the CSS
 * can order/size them independently of the text column.
 */
export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-comfortable-light-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-comfortable-light-img-col');
        }
      }
    });
  });
}
