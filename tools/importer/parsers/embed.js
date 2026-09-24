/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the embed block. Base block: embed (blocks/embed).
 * Source: https://destinationpet.com/about-us/get-in-touch/ (hosted JotForm embed)
 *
 * EDS embed convention: 1-column table; the block-name row, then a single cell
 * holding the URL of the external content to embed (an optional poster image may
 * sit above the link, used only for video posters — not needed here).
 *
 * The source embeds a third-party JotForm contact form inside a `.rawhtml`
 * component: a <script src="https://form.jotform.com/jsform/{id}"> that injects
 * an <iframe src="https://form.jotform.com/{id}?..."> at runtime. We migrate it
 * as the embed block pointing at the canonical JotForm URL, so the exact same
 * form (fields, captcha, backend) keeps working with no re-wiring.
 *
 * xwalk model (blocks/embed/_embed.json): embed_uri (text) is a non-collapsed
 * field, so the single cell carries a `<!-- field:embed_uri -->` hint before the
 * link. The embed block's decorate() reads the anchor href at runtime.
 */
export default function parse(element, { document }) {
  // Locate the JotForm reference: prefer the injected iframe, fall back to the
  // jsform <script> (present in the raw source before the iframe materializes).
  const iframe = element.querySelector('iframe[src*="jotform"]');
  const script = element.querySelector('script[src*="jotform"]');
  const raw = (iframe && iframe.getAttribute('src'))
    || (script && script.getAttribute('src'))
    || '';

  // Derive the JotForm form id and build the canonical embeddable URL
  // (https://form.jotform.com/{id}), dropping tracking/parentURL query params.
  const idMatch = raw.match(/jotform\.com\/(?:jsform\/)?(\d+)/);
  if (!idMatch) {
    // Not a recognizable JotForm embed — leave the DOM untouched.
    return;
  }
  const embedUrl = `https://form.jotform.com/${idMatch[1]}`;

  const link = document.createElement('a');
  link.href = embedUrl;
  link.textContent = embedUrl;

  // 1 column, single content cell = [ comment hint, link ].
  const cells = [[[document.createComment(' field:embed_uri '), link]]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'embed', cells });
  element.replaceWith(block);
}
