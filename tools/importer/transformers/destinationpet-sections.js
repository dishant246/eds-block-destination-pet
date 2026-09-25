/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: destinationpet section breaks and section metadata.
 * Reads payload.template.sections (5 sections for content-page).
 * Selectors come from page-templates.json (DOM-verified in analysis).
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';

// section.selector is an array of candidate selectors — try each in order, first match wins.
function querySection(root, selectors) {
  for (const sel of selectors) {
    const el = root.querySelector(sel);
    if (el) return el;
  }
  return null;
}

const CENTERED_MARKER_ATTR = 'data-excat-centered-section';
const GREY_BAND_MARKER_ATTR = 'data-excat-grey-band';
const BLUE_BAND_MARKER_ATTR = 'data-excat-blue-band';
const SUBHEAD_MARKER_ATTR = 'data-excat-subhead';

// Source text-style scale on intro copy: `subhead-1` = 20px/600,
// `subhead-2` / `subhead-3` = 16px/600, no class = 16px/400.
function subheadStyle(container) {
  if (container.querySelector('.richtext.subhead-1')) return 'subhead-large';
  if (container.querySelector('.richtext.subhead-2, .richtext.subhead-3')) return 'subhead';
  return null;
}

// True when `el` is a section break inserted by this transformer.
function isBreak(el) {
  return !!el && el.tagName === 'HR';
}

// Outermost `.columncontainer` ancestor of `el` (the page-level section container).
// Titles nested inside a band (e.g. the accordion-group titles inside the
// light-blue Job Shadow band) resolve to the band itself, so the band is bounded
// once as a whole instead of being split around each nested title.
function outermostContainer(el) {
  let found = null;
  let node = el.parentElement;
  while (node) {
    if (node.classList && node.classList.contains('columncontainer')) found = node;
    node = node.parentElement;
  }
  return found;
}

// Opening break before `el`: reuse an adjacent break (e.g. the previous
// section's closing break) instead of inserting a second one, which would leave
// an empty section between them. Returns the break so callers can mark it.
function openBreak(el) {
  const prev = el.previousElementSibling;
  if (isBreak(prev)) return prev;
  const hr = document.createElement('hr');
  el.before(hr);
  return hr;
}

// Closing break after `el`, unless it's the last node or a break already follows.
function closeBreak(el) {
  const next = el.nextElementSibling;
  if (next && !isBreak(next)) el.after(document.createElement('hr'));
}

export default function transform(hookName, element, payload) {
  const sections = payload.template.sections || [];

  if (hookName === 'beforeTransform') {
    // Insert breaks now, before parsers can replace any section element.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (i === 0 && !section.style) continue; // first section: no leading break needed
      const sectionEl = querySection(element, section.selector);
      if (!sectionEl) continue; // no selector matched on this page — skip, never guess

      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
      sectionEl.before(hr);
    }

    // Generic centered-section detection (template-independent): the source marks
    // centered content sections with a `.title.text-center` heading in their own
    // `.columncontainer` (e.g. the /live-webinar/ "A Series of Webinars…" intro).
    // These are default-content sections not in the template's section list. Bound
    // the raw container with an opening <hr> (carrying a marker) here in
    // beforeTransform — exactly like the template-path breaks above, so the
    // importer's hr→section conversion recognizes them — and let afterTransform
    // attach the `centered` Section Metadata to the surviving marker.
    //
    // EXCLUDE titles inside a tertiary/grey container — those already belong to a
    // styled (grey) section (e.g. the homepage "We work together to be…" and
    // "Testimonials" headings) and must not get a second, conflicting section.
    const centeredContainers = new Set();
    element.querySelectorAll('.title.text-center .cmp-title__text').forEach((title) => {
      // Grey (tertiary) bands are normally grey sections handled below (card
      // grids, testimonials, accordions, title-only bands). The exception is a
      // grey default-content intro — title + copy/CTA only (e.g. the
      // sell-your-veterinary-practice "Plan a rewarding future…" band): it is
      // both centered and grey.
      const band = title.closest('.background-color--tertiary');
      if (band) {
        if (band.querySelector('.infocards, .testimonial, .accordion, .carousel, .mediainfo')) return;
        if (!band.querySelector('.richtext, a')) return; // title-only band
        const prev = band.previousElementSibling;
        if (isBreak(prev) && prev.hasAttribute(SECTION_MARKER_ATTR)) return; // template-managed
      }

      // Bound the page-level container once, however many centered titles it holds.
      const container = outermostContainer(title);
      if (!container || centeredContainers.has(container)) return;
      centeredContainers.add(container);

      // Opening break (carries the marker); closing break so `centered` doesn't
      // bleed into the following section.
      const open = openBreak(container);
      open.setAttribute(CENTERED_MARKER_ATTR, 'true');
      if (band) open.setAttribute(GREY_BAND_MARKER_ATTR, 'true');
      const subhead = subheadStyle(container);
      if (subhead) open.setAttribute(SUBHEAD_MARKER_ATTR, subhead);
      closeBreak(container);
    });

    // Light-blue band (source `background-color--secondary`, e.g. the life-at-dp
    // "Job Shadow Experience" band). Tag it `blue` — on top of `centered` when the
    // loop above already bounded it. A nested container holding accordion groups
    // gets its own break carrying the same markers: the band stays one continuous
    // blue area, but the groups form their own section so they can be laid out
    // side-by-side like the source's two columns.
    element.querySelectorAll('.columncontainer.background-color--secondary').forEach((band) => {
      const open = openBreak(band);
      open.setAttribute(BLUE_BAND_MARKER_ATTR, 'true');
      closeBreak(band);

      band.querySelectorAll('.columncontainer').forEach((inner) => {
        if (!inner.querySelector('.accordion') || !inner.previousElementSibling) return;
        const split = openBreak(inner);
        split.setAttribute(BLUE_BAND_MARKER_ATTR, 'true');
        if (open.hasAttribute(CENTERED_MARKER_ATTR)) split.setAttribute(CENTERED_MARKER_ATTR, 'true');
      });
    });

    // Grey testimonial band: a tertiary container holding a `.testimonial` (e.g.
    // the life-at-dp "Watch Your Career Soar" quote). Bound it by content rather
    // than the template's homepage-positional selector, so preceding content (the
    // life-at-dp video) keeps its own white section. When a template section
    // break already marks the band (homepage Testimonials), leave it to that.
    element.querySelectorAll('.columncontainer.background-color--tertiary').forEach((band) => {
      if (!band.querySelector('.testimonial')) return;
      const prev = band.previousElementSibling;
      if (isBreak(prev) && prev.hasAttribute(SECTION_MARKER_ATTR)) return;
      openBreak(band).setAttribute(GREY_BAND_MARKER_ATTR, 'true');
      closeBreak(band);
    });

    // Generic grey CTA-band detection: a standalone `.columncontainer` with a
    // tertiary background that holds only call-to-action links (no heading, no
    // testimonial) — e.g. the /live-webinar/ "View past webinars / Start a
    // conversation" band, which sits on grey with the two buttons side-by-side.
    // Bound it with breaks and tag it `grey` (matching the site's tertiary band).
    // Template-listed sections (homepage) are already handled above; this only
    // fires for tertiary bands that weren't part of the template section list.
    element.querySelectorAll('.columncontainer.background-color--tertiary').forEach((band) => {
      if (band.querySelector('.cmp-title__text') || band.querySelector('.testimonial')) return;
      if (!band.querySelector('a')) return; // must be a CTA-only band
      if (band.previousElementSibling && band.previousElementSibling.tagName === 'HR'
        && band.previousElementSibling.hasAttribute(SECTION_MARKER_ATTR)) return; // already bounded

      openBreak(band).setAttribute(GREY_BAND_MARKER_ATTR, 'true');
      closeBreak(band);
    });

    // Generic grey title-only band: a standalone tertiary `.columncontainer` that
    // holds just a section heading (no cards, no testimonial, no CTA links) — e.g.
    // the sell-your-business "Carry on your legacy with Destination Pet" band,
    // which sits on grey ABOVE a separate white icon-card grid. Bound it with
    // breaks and tag it `grey` so the following white content starts a new
    // (default) section. EXCLUDE tertiary containers that themselves contain the
    // card grid (homepage feature grid: title + `.infocards` live in ONE grey
    // container) — those are a single grey section handled by the template list.
    element.querySelectorAll('.columncontainer.background-color--tertiary').forEach((band) => {
      if (!band.querySelector('.cmp-title__text')) return; // must have a heading
      if (band.querySelector('.infocards, .info-card--center')) return; // not a card grid
      if (band.querySelector('.testimonial')) return; // testimonials handled elsewhere
      if (band.querySelector('a')) return; // CTA-only bands handled above

      // Opening break: reuse an adjacent break. A template SECTION_MARKER that
      // already matched this band attaches its own grey metadata; otherwise mark
      // it grey here. Either way the band OPENS a grey section.
      const open = openBreak(band);
      if (!open.hasAttribute(SECTION_MARKER_ATTR)) open.setAttribute(GREY_BAND_MARKER_ATTR, 'true');

      // Closing break: the grey title band must END here so the following content
      // (a separate WHITE icon-card grid, e.g. sell-your-business) starts a new
      // default section. Add it independently of the opening break — a template
      // section that (wrongly, for this page) grouped the band with the cards
      // would otherwise leave them merged on grey.
      closeBreak(band);
    });

    // Generic grey image+text bio band: an individual `.mediainfo` block with a
    // tertiary background (e.g. the John Maresh / Rob Correia bios on the team
    // page — every other bio alternates onto grey). Unlike the CTA band above,
    // these DO carry a heading, so the CTA-only guard skips them; handle them
    // separately. Give each tertiary bio its own grey section by bounding it with
    // <hr> breaks; the intervening non-tertiary bios stay on the default (white)
    // background. Reuse GREY_BAND_MARKER_ATTR so afterTransform tags them `grey`.
    element.querySelectorAll('.mediainfo.background-color--tertiary').forEach((bio) => {
      // Opening break: if a break already precedes this bio (e.g. the template's
      // leading `.mediainfo` section break before the first bio), reuse it as the
      // grey marker instead of inserting a second adjacent <hr> (which would leave
      // an empty section). Otherwise insert a fresh grey-marked opening break.
      const prev = bio.previousElementSibling;
      if (prev && prev.tagName === 'HR') {
        prev.setAttribute(GREY_BAND_MARKER_ATTR, 'true');
      } else {
        const openHr = document.createElement('hr');
        openHr.setAttribute(GREY_BAND_MARKER_ATTR, 'true');
        bio.before(openHr);
      }
      // Closing break so the grey ends with this bio and the next (white) bio
      // starts a fresh section. Skip if one already follows or it's the last node.
      const next = bio.nextElementSibling;
      if (next && next.tagName !== 'HR') {
        bio.after(document.createElement('hr'));
      }
    });
  }

  if (hookName === 'afterTransform') {
    // Anchor each template section's Section Metadata to the break inserted in
    // beforeTransform. With no marker there is no break, so the metadata would
    // style whatever section the element happens to sit in — skip, never guess.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      if (!marker) continue;

      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      marker.after(metadataBlock);
      marker.removeAttribute(SECTION_MARKER_ATTR);
      if (i === 0) marker.remove(); // section 0 never gets a real leading break
    }

    // Centered and/or light-blue sections: the opening <hr> markers were inserted
    // in beforeTransform. Attach one Section Metadata block right after each so it
    // becomes the first node of its section (e.g. `centered, blue` for the Job
    // Shadow band, whose headings are centered on the blue background).
    element.querySelectorAll(`hr[${CENTERED_MARKER_ATTR}], hr[${BLUE_BAND_MARKER_ATTR}]`).forEach((marker) => {
      const styles = [];
      if (marker.hasAttribute(CENTERED_MARKER_ATTR)) styles.push('centered');
      if (marker.hasAttribute(BLUE_BAND_MARKER_ATTR)) styles.push('blue');
      // A grey intro band is also centered: fold `grey` into this single
      // metadata block (EDS only reads a section's first Section Metadata).
      if (marker.hasAttribute(GREY_BAND_MARKER_ATTR)) styles.push('grey');
      if (marker.hasAttribute(SUBHEAD_MARKER_ATTR)) styles.push(marker.getAttribute(SUBHEAD_MARKER_ATTR));
      marker.removeAttribute(CENTERED_MARKER_ATTR);
      marker.removeAttribute(BLUE_BAND_MARKER_ATTR);
      marker.removeAttribute(GREY_BAND_MARKER_ATTR);
      marker.removeAttribute(SUBHEAD_MARKER_ATTR);
      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: styles.join(', ') },
      });
      marker.after(metadataBlock);
    });

    // Grey CTA-band section: opening <hr> marker inserted in beforeTransform.
    // Attach a `grey` Section Metadata block right after it.
    element.querySelectorAll(`hr[${GREY_BAND_MARKER_ATTR}="true"]`).forEach((greyMarker) => {
      greyMarker.removeAttribute(GREY_BAND_MARKER_ATTR);
      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: 'grey' },
      });
      greyMarker.after(metadataBlock);
    });
  }
}
