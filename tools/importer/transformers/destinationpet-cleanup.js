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
    WebImporter.DOMUtils.remove(element, [
      'link',
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
  }
}
