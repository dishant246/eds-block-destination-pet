const SLIDE_INTERVAL = 3000;

/**
 * A column cell holding several images becomes an auto-advancing slideshow
 * with dot controls (source: the foundation page's "Our Impact in Action"
 * carousel — slides every 3s, no pause on hover).
 * @param {Element} col The column cell
 */
function decorateSlideshow(col) {
  const pictures = [...col.querySelectorAll('picture')];
  if (pictures.length < 2) return;

  const track = document.createElement('div');
  track.className = 'columns-slides';
  pictures.forEach((picture) => {
    const slide = document.createElement('div');
    slide.className = 'columns-slide';
    slide.append(picture);
    track.append(slide);
  });

  const dots = document.createElement('div');
  dots.className = 'columns-slide-dots';
  let current = 0;
  const show = (index) => {
    current = (index + pictures.length) % pictures.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    [...dots.children].forEach((dot, i) => dot.setAttribute('aria-current', i === current ? 'true' : 'false'));
  };
  pictures.forEach((picture, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Show slide ${i + 1} of ${pictures.length}`);
    dot.addEventListener('click', () => show(i));
    dots.append(dot);
  });

  col.textContent = '';
  col.classList.add('columns-img-col', 'columns-slideshow');
  col.append(track, dots);
  show(0);

  // once near the viewport, load every slide (they sit off to the side, so
  // lazy loading would leave the next slide blank until it is shown)
  const preload = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    col.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = 'eager'; });
    preload.disconnect();
  }, { rootMargin: '200px' });
  preload.observe(col);

  // auto-advance while on screen, unless the visitor prefers reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let timer = null;
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !timer) {
      timer = setInterval(() => show(current + 1), SLIDE_INTERVAL);
    } else if (!entry.isIntersecting && timer) {
      clearInterval(timer);
      timer = null;
    }
  }, { threshold: 0.3 });
  observer.observe(col);
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      decorateSlideshow(col);
      const pic = col.querySelector('picture');
      if (pic && !col.classList.contains('columns-slideshow')) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });
}
