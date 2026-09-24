/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroMinimalDarkParser from './parsers/hero-minimal-dark.js';
import columnsComfortableLightParser from './parsers/columns-comfortable-light.js';
import cardsParser from './parsers/cards.js';
import columnsMinimalLightParser from './parsers/columns-minimal-light.js';
import quoteParser from './parsers/quote.js';
import embedParser from './parsers/embed.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/destinationpet-cleanup.js';
import dmImagesTransformer from './transformers/destinationpet-dm-images.js';
import sectionsTransformer from './transformers/destinationpet-sections.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'content-page',
  description: 'General content page: full-width hero banner followed by stacked content sections (image+text, icon feature grid, CTA blocks, testimonials)',
  urls: [
    'https://www.destinationpet.com/',
  ],
  blocks: [
    {
      name: 'hero-minimal-dark',
      instances: ['.hero.teaser'],
    },
    {
      name: 'columns-comfortable-light',
      instances: ['.mediainfo'],
    },
    {
      name: 'cards',
      instances: ['.columncontainer.background-color--tertiary.spacing__top-bottom--40px:nth-of-type(3)'],
    },
    {
      name: 'columns-minimal-light',
      instances: ['.columncontainer.spacing__top--40px'],
    },
    {
      name: 'quote',
      instances: ['.columncontainer.background-color--tertiary.spacing__top-bottom--40px:nth-of-type(5)', '.testimonial'],
    },
    {
      name: 'embed',
      instances: ['.rawhtml'],
    },
  ],
  sections: [
    {
      id: 's1', name: 'hero', selector: ['.hero.teaser'], style: null,
      blocks: ['hero-minimal-dark'], defaultContent: [],
    },
    {
      id: 's2', name: 'who-we-are-intro', selector: ['.mediainfo'], style: null,
      blocks: ['columns-comfortable-light'], defaultContent: [],
    },
    {
      id: 's3', name: 'feature-grid', selector: ['.columncontainer.background-color--tertiary.spacing__top-bottom--40px:nth-of-type(3)'], style: 'grey',
      blocks: ['cards'], defaultContent: [],
    },
    {
      id: 's4', name: 'sell-your-business-cta', selector: ['.columncontainer.spacing__top--40px'], style: null,
      blocks: ['columns-minimal-light'], defaultContent: [],
    },
    {
      id: 's5', name: 'testimonials', selector: ['.columncontainer.background-color--tertiary.spacing__top-bottom--40px:nth-of-type(5)'], style: 'grey',
      blocks: ['quote'], defaultContent: [],
    },
  ],
};

// PARSER REGISTRY
const parsers = {
  'hero-minimal-dark': heroMinimalDarkParser,
  'columns-comfortable-light': columnsComfortableLightParser,
  cards: cardsParser,
  'columns-minimal-light': columnsMinimalLightParser,
  quote: quoteParser,
  embed: embedParser,
};

// TRANSFORMER REGISTRY
// cleanup runs first (removes chrome), then DM images (carrier anchors),
// then sections (inserts breaks + section-metadata) — sections last so it
// operates on the cleaned, block-parsed DOM.
const transformers = [
  cleanupTransformer,
  dmImagesTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook.
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration.
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip elements already replaced by a prior parser)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup + DM carrier anchors + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path; map root URL to /index
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
