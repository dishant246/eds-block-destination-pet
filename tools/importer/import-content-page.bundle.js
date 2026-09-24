/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-content-page.js
  var import_content_page_exports = {};
  __export(import_content_page_exports, {
    default: () => import_content_page_default
  });

  // tools/importer/parsers/hero-minimal-dark.js
  function parse(element, { document: document2 }) {
    const image = element.querySelector(".hero__image img, .s7dm-dynamic-media img, img");
    const heading = element.querySelector(
      ".hero__content .cmp-title__text, .hero__content h1, .hero__content h2, h1, h2"
    );
    const description = element.querySelector(
      ".hero__content-description p, .hero__content p"
    );
    const ctaLinks = Array.from(
      element.querySelectorAll(".hero__content a, .hero__content-action a")
    );
    const hasText = heading && heading.textContent.trim() || description && description.textContent.trim() || ctaLinks.length;
    if (!image && !hasText) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (image) {
      cells.push([[document2.createComment(" field:image "), image]]);
    }
    const textCell = [document2.createComment(" field:text ")];
    if (heading) textCell.push(heading);
    if (description && description.textContent.trim()) textCell.push(description);
    ctaLinks.forEach((a) => textCell.push(a));
    if (textCell.length > 1) {
      cells.push([textCell]);
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-minimal-dark", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-comfortable-light.js
  function parse2(element, { document: document2 }) {
    const image = element.querySelector(".media-info__left img, .cmp-image img, img");
    const rightContent = [];
    const right = element.querySelector(".media-info__right, .media-info__content");
    const scope = right || element;
    scope.querySelectorAll(".cmp-title__text, h1, h2, h3, h4, h5, h6, .cmp-text > p, .cmp-text, p").forEach((node) => {
      if (node.matches("p") && node.closest(".cmp-text") && rightContent.includes(node.closest(".cmp-text"))) return;
      rightContent.push(node);
    });
    if (!image && rightContent.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const leftCell = image ? [image] : [""];
    const rightCell = rightContent.length ? rightContent : [""];
    const cells = [
      [leftCell, rightCell]
    ];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns (comfortable-light)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards.js
  function parse3(element, { document: document2 }) {
    const cards0 = Array.from(element.querySelectorAll(".infocards, .info-card--center"));
    const leadTitle = Array.from(element.querySelectorAll(".cmp-title__text")).find((t) => !cards0.some((c) => c.contains(t)));
    const trailingCta = Array.from(element.querySelectorAll("a")).find((a) => a.textContent.trim() && !cards0.some((c) => c.contains(a)));
    const cards = Array.from(element.querySelectorAll(".infocards, .info-card--center"));
    const seen = /* @__PURE__ */ new Set();
    const uniqueCards = cards.filter((c) => {
      if (seen.has(c)) return false;
      seen.add(c);
      return true;
    });
    const cells = [];
    uniqueCards.forEach((card) => {
      const image = card.querySelector(".info-card__asset img, .cmp-image img, img");
      const textParts = [];
      const textScope = card.querySelector(".info-card__text") || card;
      textScope.querySelectorAll(".cmp-title__text, .cmp-text > p, .cmp-text, p").forEach((node) => {
        if (node.matches("p") && node.closest(".cmp-text") && textParts.includes(node.closest(".cmp-text"))) return;
        if (node.textContent.trim()) textParts.push(node);
      });
      if (!image && textParts.length === 0) return;
      const imageCell = image ? [document2.createComment(" field:image "), image] : "";
      const textCell = textParts.length ? [document2.createComment(" field:text "), ...textParts] : "";
      cells.push([imageCell, textCell]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards", cells });
    element.replaceWith(block);
    if (leadTitle && leadTitle.textContent.trim()) {
      const heading = document2.createElement("h2");
      heading.textContent = leadTitle.textContent.trim();
      block.parentNode.insertBefore(heading, block);
    }
    if (trailingCta && trailingCta.getAttribute("href")) {
      const link = document2.createElement("a");
      link.setAttribute("href", trailingCta.getAttribute("href"));
      link.textContent = trailingCta.textContent.trim();
      const para = document2.createElement("p");
      para.append(link);
      if (block.nextSibling) {
        block.parentNode.insertBefore(para, block.nextSibling);
      } else {
        block.parentNode.append(para);
      }
    }
  }

  // tools/importer/parsers/columns-minimal-light.js
  function parse4(element, { document: document2 }) {
    const contentScope = element.querySelector(".info-card__text, .infocards") || element;
    const contentCell = [];
    const image = contentScope.querySelector(".cmp-image img, img");
    if (image) contentCell.push(image);
    contentScope.querySelectorAll(".cmp-text > p, .cmp-text, p").forEach((node) => {
      if (node.matches("p") && node.closest(".cmp-text") && contentCell.includes(node.closest(".cmp-text"))) return;
      if (node.textContent.trim()) contentCell.push(node);
    });
    const cta = contentScope.querySelector("a.button__bdl, .button a, a[href]");
    if (cta) {
      const label = cta.querySelector(".button__text");
      if (label && label.textContent.trim()) {
        cta.textContent = label.textContent.trim();
      }
      contentCell.push(cta);
    }
    if (contentCell.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [
      [contentCell]
    ];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns (minimal-light)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/quote.js
  function parse5(element, { document: document2 }) {
    const testimonial = element.querySelector(".testimonial") || element;
    const leadTitle = Array.from(element.querySelectorAll(".cmp-title__text")).find((t) => !testimonial.contains(t));
    const descParas = Array.from(
      testimonial.querySelectorAll(".testimonial__description .cmp-text > p, .testimonial__description p")
    ).filter((p) => p.textContent.trim());
    const quotation = descParas.length ? descParas[0] : null;
    const attributionParas = descParas.slice(1);
    let headerSourcedAttribution = false;
    if (attributionParas.length === 0) {
      testimonial.querySelectorAll(".testimonial__header-name, .testimonial__header-address").forEach((p) => {
        if (p.textContent.trim()) attributionParas.push(p);
      });
      headerSourcedAttribution = attributionParas.length > 0;
    }
    if (!quotation && attributionParas.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (quotation) {
      cells.push([[document2.createComment(" field:quotation "), quotation]]);
    }
    if (attributionParas.length) {
      cells.push([[document2.createComment(" field:attribution "), ...attributionParas]]);
    }
    const blockName = headerSourcedAttribution ? "quote (left)" : "quote";
    const block = WebImporter.Blocks.createBlock(document2, { name: blockName, cells });
    element.replaceWith(block);
    if (leadTitle && leadTitle.textContent.trim()) {
      const heading = document2.createElement("h2");
      heading.textContent = leadTitle.textContent.trim();
      block.parentNode.insertBefore(heading, block);
    }
  }

  // tools/importer/transformers/destinationpet-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "link",
        "noscript"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        ".headerRedesign",
        "header",
        ".footer"
      ]);
      element.querySelectorAll('img[src*="facebook.com/tr"]').forEach((img) => {
        const picture = img.closest("picture");
        const node = picture || img;
        const para = node.parentElement;
        if (para && para.tagName === "P" && para.children.length === 1) {
          para.remove();
        } else {
          node.remove();
        }
      });
    }
  }

  // tools/importer/transformers/destinationpet-dm-images.js
  function detectDynamicMediaUrl(urlStr) {
    let u;
    try {
      u = new URL(urlStr, "https://x/");
    } catch (e) {
      return false;
    }
    if (u.pathname.startsWith("/is/image/")) {
      return "scene7";
    }
    if (/^delivery-p\d+-e\d+\.adobeaemcloud\.com$/.test(u.hostname) && u.pathname.startsWith("/adobe/assets/urn:")) {
      return "dm-openapi";
    }
    return false;
  }
  var LINKED_DM_INLINE_WRAPPER_TAGS = /* @__PURE__ */ new Set(["PICTURE"]);
  var LINKED_DM_WRAPPER_SIBLING_TAGS = /* @__PURE__ */ new Set(["SOURCE"]);
  function findLinkedDmCarrier(img) {
    if (!img || !img.parentElement) return null;
    let node = img;
    let parent = img.parentElement;
    while (parent && LINKED_DM_INLINE_WRAPPER_TAGS.has(parent.tagName)) {
      let foundNode = false;
      for (const child of parent.children) {
        if (child === node) {
          foundNode = true;
        } else if (!LINKED_DM_WRAPPER_SIBLING_TAGS.has(child.tagName)) {
          return null;
        }
      }
      if (!foundNode) return null;
      node = parent;
      parent = parent.parentElement;
    }
    if (!parent || parent.tagName !== "A") return null;
    if (parent.children.length !== 1 || parent.children[0] !== node) return null;
    if (parent.textContent.trim() !== "") return null;
    return parent;
  }
  var EMPTY_ALT_SENTINEL = "Image without alt text";
  function altToLinkText(alt) {
    return alt || EMPTY_ALT_SENTINEL;
  }
  function transform2(hookName, element, payload) {
    if (hookName !== "afterTransform") return;
    const doc = element.ownerDocument;
    element.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src") || "";
      if (!detectDynamicMediaUrl(src)) return;
      const alt = img.getAttribute("alt") || "";
      const linkedAnchor = findLinkedDmCarrier(img);
      if (linkedAnchor) {
        linkedAnchor.setAttribute("title", src);
        linkedAnchor.textContent = altToLinkText(alt);
        return;
      }
      const parent = img.parentElement;
      if (parent && parent.tagName === "A") {
        console.warn("DM image inside mixed-content anchor, skipped:", src);
        return;
      }
      const a = doc.createElement("a");
      a.href = src;
      a.textContent = altToLinkText(alt);
      img.replaceWith(a);
    });
  }

  // tools/importer/transformers/destinationpet-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    for (const sel of selectors) {
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  var CENTERED_MARKER_ATTR = "data-excat-centered-section";
  var GREY_BAND_MARKER_ATTR = "data-excat-grey-band";
  function transform3(hookName, element, payload) {
    const sections = payload.template.sections || [];
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
      element.querySelectorAll(".title.text-center .cmp-title__text").forEach((title) => {
        if (title.closest(".background-color--tertiary")) return;
        let container = title;
        while (container && !(container.classList && container.classList.contains("columncontainer"))) {
          container = container.parentElement;
        }
        if (!container) return;
        const openHr = document.createElement("hr");
        openHr.setAttribute(CENTERED_MARKER_ATTR, "true");
        container.before(openHr);
        const next = container.nextElementSibling;
        const nextIsTertiaryBand = next && next.classList && next.classList.contains("columncontainer") && next.classList.contains("background-color--tertiary");
        if (!nextIsTertiaryBand) {
          container.after(document.createElement("hr"));
        }
      });
      element.querySelectorAll(".columncontainer.background-color--tertiary").forEach((band) => {
        if (band.querySelector(".cmp-title__text") || band.querySelector(".testimonial")) return;
        if (!band.querySelector("a")) return;
        if (band.previousElementSibling && band.previousElementSibling.tagName === "HR" && band.previousElementSibling.hasAttribute(SECTION_MARKER_ATTR)) return;
        const openHr = document.createElement("hr");
        openHr.setAttribute(GREY_BAND_MARKER_ATTR, "true");
        band.before(openHr);
        band.after(document.createElement("hr"));
      });
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
      const centeredMarker = element.querySelector(`hr[${CENTERED_MARKER_ATTR}="true"]`);
      if (centeredMarker) {
        centeredMarker.removeAttribute(CENTERED_MARKER_ATTR);
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: "centered" }
        });
        centeredMarker.after(metadataBlock);
      }
      element.querySelectorAll(`hr[${GREY_BAND_MARKER_ATTR}="true"]`).forEach((greyMarker) => {
        greyMarker.removeAttribute(GREY_BAND_MARKER_ATTR);
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: "grey" }
        });
        greyMarker.after(metadataBlock);
      });
    }
  }

  // tools/importer/import-content-page.js
  var PAGE_TEMPLATE = {
    name: "content-page",
    description: "General content page: full-width hero banner followed by stacked content sections (image+text, icon feature grid, CTA blocks, testimonials)",
    urls: [
      "https://www.destinationpet.com/"
    ],
    blocks: [
      {
        name: "hero-minimal-dark",
        instances: [".hero.teaser"]
      },
      {
        name: "columns-comfortable-light",
        instances: [".mediainfo"]
      },
      {
        name: "cards",
        instances: [".columncontainer.background-color--tertiary.spacing__top-bottom--40px:nth-of-type(3)"]
      },
      {
        name: "columns-minimal-light",
        instances: [".columncontainer.spacing__top--40px"]
      },
      {
        name: "quote",
        instances: [".columncontainer.background-color--tertiary.spacing__top-bottom--40px:nth-of-type(5)", ".testimonial"]
      }
    ],
    sections: [
      {
        id: "s1",
        name: "hero",
        selector: [".hero.teaser"],
        style: null,
        blocks: ["hero-minimal-dark"],
        defaultContent: []
      },
      {
        id: "s2",
        name: "who-we-are-intro",
        selector: [".mediainfo"],
        style: null,
        blocks: ["columns-comfortable-light"],
        defaultContent: []
      },
      {
        id: "s3",
        name: "feature-grid",
        selector: [".columncontainer.background-color--tertiary.spacing__top-bottom--40px:nth-of-type(3)"],
        style: "grey",
        blocks: ["cards"],
        defaultContent: []
      },
      {
        id: "s4",
        name: "sell-your-business-cta",
        selector: [".columncontainer.spacing__top--40px"],
        style: null,
        blocks: ["columns-minimal-light"],
        defaultContent: []
      },
      {
        id: "s5",
        name: "testimonials",
        selector: [".columncontainer.background-color--tertiary.spacing__top-bottom--40px:nth-of-type(5)"],
        style: "grey",
        blocks: ["quote"],
        defaultContent: []
      }
    ]
  };
  var parsers = {
    "hero-minimal-dark": parse,
    "columns-comfortable-light": parse2,
    cards: parse3,
    "columns-minimal-light": parse4,
    quote: parse5
  };
  var transformers = [
    transform,
    transform2,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform3] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_content_page_default = {
    transform: (payload) => {
      const {
        document: document2,
        url,
        html,
        params
      } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_content_page_exports);
})();
