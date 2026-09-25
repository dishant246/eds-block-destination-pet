/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the logos cards variant. Base block: cards (container).
 * Source: https://destinationpet.com/our-locations/ (one `.columncontainer` per
 *   state: a navy `.background-color--primary` title band with the state name,
 *   then one inner `.columncontainer` per hand-built logo ROW — 1 to 4 columns
 *   (col-lg-3 / -4 / -6) of linked location logos, some followed by a caption
 *   such as "Dunwoody" (richtext) or "Charlotte / North Carolina" (h3 title)).
 *
 * EDS cards convention: one row per card = [image cell, text cell]; both cells
 * are always present (an empty one stays empty). Emitted as `cards (logos)`:
 *   image cell (field:image): the logo <img> (DM asset; the DM transformer
 *     converts it downstream)
 *   text cell  (field:text):  the caption (description) when present — kept as
 *     <h3> when the source uses a title, otherwise <p> — then the call-to-action
 *     link at the bottom — <a href=location site>Location name</a>. The name
 *     comes from the logo's alt text without the "logo" suffix; the block CSS
 *     makes the whole card the link, so the logo stays clickable.
 * ONE BLOCK PER SOURCE ROW, so the source's 2-up / 3-up / 4-up row grouping is
 * kept (the block lays its cards out in a single row). A column that stacks a
 * second logo under the first (California's Rover Kennels) contributes that
 * logo to an extra row emitted right after.
 * The state name is re-inserted ABOVE the blocks as an <h2> (default content),
 * so it remains the heading/anchor target the state index links to.
 */
function locationName(alt) {
  return (alt || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s*logo\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Logos + captions of one column, in document order; a caption belongs to the
// most recent logo.
function columnCards(column) {
  const cards = [];
  column.querySelectorAll('.image a img, .richtext p, .title .cmp-title__text').forEach((node) => {
    if (node.tagName === 'IMG') {
      const a = node.closest('a');
      cards.push({ img: node, href: a ? a.getAttribute('href') : '', name: locationName(node.alt), captions: [] });
    } else if (node.textContent.trim() && cards.length) {
      cards[cards.length - 1].captions.push({ heading: !!node.closest('.title'), text: node.textContent.trim() });
    }
  });
  return cards;
}

export default function parse(element, { document }) {
  const bands = element.querySelectorAll('.background-color--primary .cmp-title__text');
  if (bands.length !== 1) return; // not a single state container — leave untouched
  const stateName = bands[0].textContent.trim();
  const band = bands[0].closest('.columncontainer.background-color--primary') || bands[0];

  // Source rows: the band's sibling containers that hold logos. Fallback: the
  // whole state container is one row.
  let rows = band.parentElement
    ? Array.from(band.parentElement.children).filter((c) => c !== band && c.querySelector('.image a img'))
    : [];
  if (!rows.length) rows = [element];

  const cardRows = [];
  rows.forEach((row) => {
    const layout = row.querySelector('.container__layout-section');
    let columns = layout ? Array.from(layout.children).filter((c) => c.querySelector('.image a img')) : [];
    if (!columns.length) columns = [row];
    const perColumn = columns.map(columnCards).filter((cards) => cards.length);
    const depth = Math.max(0, ...perColumn.map((cards) => cards.length));
    for (let i = 0; i < depth; i += 1) {
      const cards = perColumn.map((colCards) => colCards[i]).filter(Boolean);
      if (cards.length) cardRows.push(cards);
    }
  });

  if (cardRows.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const toCells = (cards) => cards.map((card) => {
    const img = card.img.cloneNode(true);
    const text = [document.createComment(' field:text ')];
    card.captions.forEach((caption) => {
      const el = document.createElement(caption.heading ? 'h3' : 'p');
      el.textContent = caption.text;
      text.push(el);
    });
    if (card.href) {
      const p = document.createElement('p');
      const link = document.createElement('a');
      link.setAttribute('href', card.href);
      link.textContent = card.name || stateName;
      p.append(link);
      text.push(p);
    }
    return [[document.createComment(' field:image '), img], text.length > 1 ? text : ''];
  });

  const heading = document.createElement('h2');
  heading.textContent = stateName;
  const blocks = cardRows.map((cards) => WebImporter.Blocks.createBlock(document, { name: 'cards (logos)', cells: toCells(cards) }));
  element.replaceWith(heading, ...blocks);
}
