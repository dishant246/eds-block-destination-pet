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
    element.querySelectorAll('.title.text-center .cmp-title__text').forEach((title) => {
      if (title.closest('.background-color--tertiary')) return;
      // Raw section container = nearest .columncontainer ancestor.
      let container = title;
      while (container && !(container.classList && container.classList.contains('columncontainer'))) {
        container = container.parentElement;
      }
      if (!container) return;

      // Opening break before the centered container (carries the marker).
      const openHr = document.createElement('hr');
      openHr.setAttribute(CENTERED_MARKER_ATTR, 'true');
      container.before(openHr);

      // Closing break after the centered container so `centered` ends here and
      // doesn't bleed into the following section. Skip it when:
      //  - there is no following element sibling (centered block is last — a
      //    trailing <hr> would leave a stray empty section), or
      //  - the next sibling is a tertiary CTA band, which inserts its OWN opening
      //    break below (two adjacent <hr>s would leave an empty section between).
      const next = container.nextElementSibling;
      const nextIsTertiaryBand = next && next.classList
        && next.classList.contains('columncontainer')
        && next.classList.contains('background-color--tertiary');
      if (next && !nextIsTertiaryBand) {
        container.after(document.createElement('hr'));
      }
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

      const openHr = document.createElement('hr');
      openHr.setAttribute(GREY_BAND_MARKER_ATTR, 'true');
      band.before(openHr);
      band.after(document.createElement('hr'));
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

      // Opening break: reuse a leading marker HR (e.g. a template SECTION_MARKER
      // that already matched this band) if present; otherwise insert a fresh grey
      // marker. Either way the band OPENS a grey section.
      const prev = band.previousElementSibling;
      const hasLeadingBreak = prev && prev.tagName === 'HR'
        && (prev.hasAttribute(SECTION_MARKER_ATTR) || prev.hasAttribute(GREY_BAND_MARKER_ATTR));
      if (!hasLeadingBreak) {
        const openHr = document.createElement('hr');
        openHr.setAttribute(GREY_BAND_MARKER_ATTR, 'true');
        band.before(openHr);
      }

      // Closing break: the grey title band must END here so the following content
      // (a separate WHITE icon-card grid, e.g. sell-your-business) starts a new
      // default section. Add it independently of the opening break — a template
      // section that (wrongly, for this page) grouped the band with the cards
      // would otherwise leave them merged on grey.
      const next = band.nextElementSibling;
      if (next && next.tagName !== 'HR') {
        band.after(document.createElement('hr'));
      }
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
    // Parsers have now run and may have replaced section elements. Anchor each
    // styled section's Section Metadata block to whichever still exists.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchor = marker || querySection(element, section.selector);
      if (!anchor) continue; // neither survived — skip, never guess

      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.after(metadataBlock);

      if (marker) {
        marker.removeAttribute(SECTION_MARKER_ATTR);
        if (i === 0) marker.remove(); // section 0 never gets a real leading break
      }
    }

    // Centered default-content section: the opening <hr> marker was inserted in
    // beforeTransform. Attach a `centered` Section Metadata block right after that
    // marker so it becomes the first node of the centered section.
    const centeredMarker = element.querySelector(`hr[${CENTERED_MARKER_ATTR}="true"]`);
    if (centeredMarker) {
      centeredMarker.removeAttribute(CENTERED_MARKER_ATTR);
      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: 'centered' },
      });
      centeredMarker.after(metadataBlock);
    }

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
