/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: destinationpet site-wide cleanup.
 * Removes non-authorable site chrome and stray elements.
 * All selectors verified against migration-work/cleaned.html.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Dynamic Media Scene7 client library stylesheets embedded in the hero
    // (cleaned.html lines 329-331). Non-authorable; remove before parsing.
    //
    // Also remove <noscript> elements. On the live page the Facebook tracking
    // beacon (<img src="https://www.facebook.com/tr?...">) lives inside a
    // <noscript>, whose contents the browser treats as inert TEXT (not DOM) while
    // scripting is enabled — so an img selector can't match it, but WebImporter's
    // serialization turns that text back into a real <img> that leaks into the
    // output. Dropping the <noscript> nodes (never authorable content) removes the
    // beacon at the source.
    WebImporter.DOMUtils.remove(element, [
      'link',
      'noscript',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome verified in cleaned.html:
    //  - .headerRedesign : top ribbon + main header/nav (line 4)
    //  - header.header__main : sticky nav (line 65)
    //  - .footer : footer logo, categories, copyright, social (line 671)
    WebImporter.DOMUtils.remove(element, [
      '.headerRedesign',
      'header',
      '.footer',
    ]);

    // Strip the Facebook noscript tracking pixel — a 1x1 analytics beacon
    // (<img src="https://www.facebook.com/tr?...">) injected at runtime on the
    // live page. It gets normalized into <picture><img></picture> during
    // parsing, so run this in afterTransform and remove the whole carrier
    // (the enclosing <picture> and its wrapping <p>) rather than the bare img,
    // which would leave an empty wrapper behind.
    element.querySelectorAll('img[src*="facebook.com/tr"]').forEach((img) => {
      const picture = img.closest('picture');
      const node = picture || img;
      // If the beacon is the sole content of a wrapping <p>, drop the <p> too.
      const para = node.parentElement;
      if (para && para.tagName === 'P' && para.children.length === 1) {
        para.remove();
      } else {
        node.remove();
      }
    });
  }
}
