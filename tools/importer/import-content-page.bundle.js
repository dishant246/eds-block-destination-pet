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
    const image = element.querySelector(".cmp-image img, img");
    const imageColumn = image ? image.closest(".media-info__left, .media-info__right, .media-info__content") || image.closest(".cmp-image") : null;
    const textContent = [];
    element.querySelectorAll(".cmp-title__text, h1, h2, h3, h4, h5, h6, .cmp-text > p, .cmp-text, p").forEach((node) => {
      if (imageColumn && imageColumn.contains(node)) return;
      if (node.matches("p") && node.closest(".cmp-text") && textContent.includes(node.closest(".cmp-text"))) return;
      if (!node.textContent.trim()) return;
      textContent.push(node);
    });
    if (!image && textContent.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const imageCell = image ? [image] : [""];
    const textCell = textContent.length ? textContent : [""];
    let row;
    if (image && textContent.length && image.compareDocumentPosition(textContent[0]) & Node.DOCUMENT_POSITION_PRECEDING) {
      row = [textCell, imageCell];
    } else {
      row = [imageCell, textCell];
    }
    if (element.classList && element.classList.contains("media-info--right")) {
      row.reverse();
    }
    const cells = [row];
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
      textScope.querySelectorAll("a[href]").forEach((a) => {
        if (!a.textContent.trim()) return;
        if (textParts.some((n) => n.contains && n.contains(a))) return;
        const link = document2.createElement("a");
        link.setAttribute("href", a.getAttribute("href"));
        link.textContent = a.textContent.trim();
        textParts.push(link);
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

  // tools/importer/parsers/embed.js
  function parse6(element, { document: document2 }) {
    const iframe = element.querySelector('iframe[src*="jotform"]');
    const script = element.querySelector('script[src*="jotform"]');
    const raw = iframe && iframe.getAttribute("src") || script && script.getAttribute("src") || "";
    const idMatch = raw.match(/jotform\.com\/(?:jsform\/)?(\d+)/);
    if (!idMatch) {
      return;
    }
    const embedUrl = `https://form.jotform.com/${idMatch[1]}`;
    const link = document2.createElement("a");
    link.href = embedUrl;
    link.textContent = embedUrl;
    const cells = [[[document2.createComment(" field:embed_uri "), link]]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "embed", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/video.js
  function parse7(element, { document: document2 }) {
    const video = element.querySelector("video");
    if (!video) return;
    const src = video.getAttribute("src") || video.querySelector("source") && video.querySelector("source").getAttribute("src") || "";
    const poster = video.getAttribute("poster") || "";
    if (!src) return;
    const cells = [];
    const link = document2.createElement("a");
    link.href = src;
    link.textContent = src;
    cells.push([[document2.createComment(" field:uri "), link]]);
    if (poster) {
      const img = document2.createElement("img");
      img.src = poster;
      img.alt = "";
      cells.push([[document2.createComment(" field:placeholder_image "), img]]);
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "video", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion.js
  function parse8(element, { document: document2 }) {
    const items = Array.from(element.querySelectorAll(".cmp-accordion__item"));
    if (items.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    items.forEach((item) => {
      const titleEl = item.querySelector(".cmp-accordion__title");
      const panel = item.querySelector(".cmp-accordion__panel");
      const label = titleEl ? titleEl.textContent.trim() : "";
      if (!label && !panel) return;
      const bodyParts = [];
      const richScope = panel ? panel.querySelector(".richtext") || panel : null;
      if (richScope) {
        Array.from(richScope.children).forEach((node) => {
          if (node.textContent.trim() || node.querySelector("img, br")) bodyParts.push(node);
        });
        if (bodyParts.length === 0 && richScope.textContent.trim()) {
          const p = document2.createElement("p");
          p.textContent = richScope.textContent.trim();
          bodyParts.push(p);
        }
      }
      const titleCell = label ? [document2.createComment(" field:summary "), document2.createTextNode(label)] : "";
      const contentCell = bodyParts.length ? [document2.createComment(" field:text "), ...bodyParts] : "";
      cells.push([titleCell, contentCell]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "accordion", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel.js
  function parse9(element, { document: document2 }) {
    const wrapper = element.querySelector(".carousel__item-wrapper") || element;
    let settings = {};
    try {
      settings = JSON.parse(wrapper.getAttribute("data-slick") || "{}");
    } catch (e) {
      settings = {};
    }
    const variants = [];
    if (settings.autoplay === true) variants.push("autoplay");
    if (wrapper.classList.contains("arrows--hidden")) variants.push("hide-arrows");
    const quoteParas = Array.from(element.querySelectorAll(".testimonial__description p"));
    if (quoteParas.length && !quoteParas.some((p) => /text-align:\s*center/i.test(p.getAttribute("style") || ""))) {
      variants.push("left");
    }
    const items = Array.from(element.querySelectorAll(".carousel__item")).filter((item) => !item.closest(".slick-cloned"));
    const cells = [];
    items.forEach((item) => {
      const content = [];
      let image = null;
      const testimonial = item.querySelector(".testimonial");
      if (testimonial) {
        testimonial.querySelectorAll(".testimonial__header-name, .testimonial__header-address").forEach((p) => {
          if (!p.textContent.trim()) return;
          const para = document2.createElement("p");
          if (p.classList.contains("testimonial__header-name")) {
            const strong = document2.createElement("strong");
            strong.textContent = p.textContent.trim();
            para.append(strong);
          } else {
            para.textContent = p.textContent.trim();
          }
          content.push(para);
        });
        testimonial.querySelectorAll(".testimonial__description p").forEach((p) => {
          if (p.textContent.trim()) content.push(p.cloneNode(true));
        });
      } else {
        const img = item.querySelector(".info-card__asset img, .cmp-image img, img");
        if (img) image = img.cloneNode(true);
        const scope = item.querySelector(".info-card__text") || item;
        scope.querySelectorAll(".cmp-title__text, .cmp-text p").forEach((node) => {
          if (!node.textContent.trim()) return;
          if (node.matches(".cmp-title__text")) {
            const h = document2.createElement("h3");
            h.textContent = node.textContent.trim();
            content.push(h);
          } else {
            content.push(node.cloneNode(true));
          }
        });
        scope.querySelectorAll("a[href]").forEach((a) => {
          if (!a.textContent.trim()) return;
          const link = document2.createElement("a");
          link.setAttribute("href", a.getAttribute("href"));
          link.textContent = a.textContent.trim();
          content.push(link);
        });
      }
      if (!image && content.length === 0) return;
      const imageCell = image ? [document2.createComment(" field:media_image "), image] : "";
      const contentCell = content.length ? [document2.createComment(" field:content_text "), ...content] : "";
      cells.push([imageCell, contentCell]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const name = variants.length ? `carousel (${variants.join(", ")})` : "carousel";
    const block = WebImporter.Blocks.createBlock(document2, { name, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-logos.js
  function locationName(alt) {
    return (alt || "").replace(/[-_]+/g, " ").replace(/\s*logo\s*$/i, "").replace(/\s+/g, " ").trim();
  }
  function columnCards(column) {
    const cards = [];
    column.querySelectorAll(".image a img, .richtext p, .title .cmp-title__text").forEach((node) => {
      if (node.tagName === "IMG") {
        const a = node.closest("a");
        cards.push({ img: node, href: a ? a.getAttribute("href") : "", name: locationName(node.alt), captions: [] });
      } else if (node.textContent.trim() && cards.length) {
        cards[cards.length - 1].captions.push({ heading: !!node.closest(".title"), text: node.textContent.trim() });
      }
    });
    return cards;
  }
  function parse10(element, { document: document2 }) {
    const bands = element.querySelectorAll(".background-color--primary .cmp-title__text");
    if (bands.length !== 1) return;
    const stateName = bands[0].textContent.trim();
    const band = bands[0].closest(".columncontainer.background-color--primary") || bands[0];
    let rows = band.parentElement ? Array.from(band.parentElement.children).filter((c) => c !== band && c.querySelector(".image a img")) : [];
    if (!rows.length) rows = [element];
    const cardRows = [];
    rows.forEach((row) => {
      const layout = row.querySelector(".container__layout-section");
      let columns = layout ? Array.from(layout.children).filter((c) => c.querySelector(".image a img")) : [];
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
      const text = [document2.createComment(" field:text ")];
      card.captions.forEach((caption) => {
        const el = document2.createElement(caption.heading ? "h3" : "p");
        el.textContent = caption.text;
        text.push(el);
      });
      if (card.href) {
        const p = document2.createElement("p");
        const link = document2.createElement("a");
        link.setAttribute("href", card.href);
        link.textContent = card.name || stateName;
        p.append(link);
        text.push(p);
      }
      return [[document2.createComment(" field:image "), img], text.length > 1 ? text : ""];
    });
    const heading = document2.createElement("h2");
    heading.textContent = stateName;
    const blocks = cardRows.map((cards) => WebImporter.Blocks.createBlock(document2, { name: "cards (logos)", cells: toCells(cards) }));
    element.replaceWith(heading, ...blocks);
  }

  // tools/importer/parsers/columns-link-list.js
  function slugifyHash(href, text) {
    const target = href.length > 1 ? decodeURIComponent(href.slice(1)) : text;
    return `#${target.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
  }
  function parse11(element, { document: document2 }) {
    const columns = Array.from(element.querySelectorAll(".container__column")).filter((col) => col.querySelector(".link a[href]") && !col.querySelector(".container__column"));
    const cells = columns.map((col) => {
      const list = document2.createElement("ul");
      col.querySelectorAll(".link a[href]").forEach((a) => {
        const text = a.textContent.trim();
        if (!text) return;
        const href = a.getAttribute("href");
        const link = document2.createElement("a");
        link.setAttribute("href", href.startsWith("#") ? slugifyHash(href, text) : href);
        link.textContent = text;
        const li = document2.createElement("li");
        li.append(link);
        list.append(li);
      });
      return list.children.length ? list : "";
    }).filter(Boolean);
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns (link-list)", cells: [cells] });
    element.replaceWith(block);
  }

  // tools/importer/transformers/destinationpet-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "link",
        "noscript"
      ]);
      element.querySelectorAll("span.icon-location").forEach((icon) => {
        icon.replaceWith(document.createTextNode(":location: "));
      });
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
  var BLUE_BAND_MARKER_ATTR = "data-excat-blue-band";
  var SUBHEAD_MARKER_ATTR = "data-excat-subhead";
  var TEXT_PRIMARY_MARKER_ATTR = "data-excat-text-primary";
  function subheadStyle(container) {
    const copy = Array.from(container.querySelectorAll(".richtext")).filter((t) => !(t.closest(".container__column") || t.parentElement).querySelector("img"));
    if (copy.some((t) => t.matches(".subhead-1"))) return "subhead-large";
    if (copy.some((t) => t.matches(".subhead-2, .subhead-3"))) return "subhead";
    return null;
  }
  function isBreak(el) {
    return !!el && el.tagName === "HR";
  }
  function outermostContainer(el) {
    let found = null;
    let node = el.parentElement;
    while (node) {
      if (node.classList && node.classList.contains("columncontainer")) found = node;
      node = node.parentElement;
    }
    return found;
  }
  function openBreak(el) {
    const prev = el.previousElementSibling;
    if (isBreak(prev)) return prev;
    const hr = document.createElement("hr");
    el.before(hr);
    return hr;
  }
  function closeBreak(el) {
    const next = el.nextElementSibling;
    if (next && !isBreak(next)) el.after(document.createElement("hr"));
  }
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
      const centeredContainers = /* @__PURE__ */ new Set();
      element.querySelectorAll(".title.text-center .cmp-title__text").forEach((title) => {
        const band = title.closest(".background-color--tertiary");
        if (band) {
          if (band.querySelector(".infocards, .testimonial, .accordion, .carousel, .mediainfo")) return;
          if (!band.querySelector(".richtext, a")) return;
          const prev = band.previousElementSibling;
          if (isBreak(prev) && prev.hasAttribute(SECTION_MARKER_ATTR)) return;
        }
        const container = outermostContainer(title);
        if (!container || centeredContainers.has(container)) return;
        centeredContainers.add(container);
        const open = openBreak(container);
        open.setAttribute(CENTERED_MARKER_ATTR, "true");
        if (band) open.setAttribute(GREY_BAND_MARKER_ATTR, "true");
        const subhead = subheadStyle(container);
        if (subhead) open.setAttribute(SUBHEAD_MARKER_ATTR, subhead);
        closeBreak(container);
      });
      element.querySelectorAll(".columncontainer").forEach((container) => {
        if (outermostContainer(container) || centeredContainers.has(container)) return;
        if (container.querySelector(".title, img, a, iframe, video, .rawhtml, .infocards, .testimonial, .accordion, .carousel, .mediainfo")) return;
        const paras = Array.from(container.querySelectorAll(".richtext p")).filter((p) => p.textContent.trim());
        if (!paras.length || !paras.every((p) => /text-align:\s*center/i.test(p.getAttribute("style") || ""))) return;
        centeredContainers.add(container);
        const open = openBreak(container);
        open.setAttribute(CENTERED_MARKER_ATTR, "true");
        const subhead = subheadStyle(container);
        if (subhead) open.setAttribute(SUBHEAD_MARKER_ATTR, subhead);
        if (container.querySelector(".richtext.color--primary")) open.setAttribute(TEXT_PRIMARY_MARKER_ATTR, "true");
        if (container.matches(".background-color--tertiary")) open.setAttribute(GREY_BAND_MARKER_ATTR, "true");
        closeBreak(container);
      });
      element.querySelectorAll(".columncontainer.background-color--secondary").forEach((band) => {
        const open = openBreak(band);
        open.setAttribute(BLUE_BAND_MARKER_ATTR, "true");
        closeBreak(band);
        band.querySelectorAll(".columncontainer").forEach((inner) => {
          if (!inner.querySelector(".accordion") || !inner.previousElementSibling) return;
          const split = openBreak(inner);
          split.setAttribute(BLUE_BAND_MARKER_ATTR, "true");
          if (open.hasAttribute(CENTERED_MARKER_ATTR)) split.setAttribute(CENTERED_MARKER_ATTR, "true");
        });
      });
      element.querySelectorAll(".columncontainer.background-color--tertiary").forEach((band) => {
        if (!band.querySelector(".testimonial")) return;
        const prev = band.previousElementSibling;
        if (isBreak(prev) && prev.hasAttribute(SECTION_MARKER_ATTR)) return;
        openBreak(band).setAttribute(GREY_BAND_MARKER_ATTR, "true");
        closeBreak(band);
      });
      element.querySelectorAll(".columncontainer.background-color--tertiary").forEach((band) => {
        if (band.querySelector(".cmp-title__text") || band.querySelector(".testimonial")) return;
        if (!band.querySelector("a")) return;
        if (band.previousElementSibling && band.previousElementSibling.tagName === "HR" && band.previousElementSibling.hasAttribute(SECTION_MARKER_ATTR)) return;
        openBreak(band).setAttribute(GREY_BAND_MARKER_ATTR, "true");
        closeBreak(band);
      });
      element.querySelectorAll(".columncontainer.background-color--tertiary").forEach((band) => {
        if (!band.querySelector(".cmp-title__text")) return;
        if (band.querySelector(".infocards, .info-card--center")) return;
        if (band.querySelector(".testimonial")) return;
        if (band.querySelector("a")) return;
        const open = openBreak(band);
        if (!open.hasAttribute(SECTION_MARKER_ATTR)) open.setAttribute(GREY_BAND_MARKER_ATTR, "true");
        closeBreak(band);
      });
      element.querySelectorAll(".mediainfo.background-color--tertiary").forEach((bio) => {
        const prev = bio.previousElementSibling;
        if (prev && prev.tagName === "HR") {
          prev.setAttribute(GREY_BAND_MARKER_ATTR, "true");
        } else {
          const openHr = document.createElement("hr");
          openHr.setAttribute(GREY_BAND_MARKER_ATTR, "true");
          bio.before(openHr);
        }
        const next = bio.nextElementSibling;
        if (next && next.tagName !== "HR") {
          bio.after(document.createElement("hr"));
        }
      });
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        if (!marker) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        marker.after(metadataBlock);
        marker.removeAttribute(SECTION_MARKER_ATTR);
        if (i === 0) marker.remove();
      }
      element.querySelectorAll(`hr[${CENTERED_MARKER_ATTR}], hr[${BLUE_BAND_MARKER_ATTR}]`).forEach((marker) => {
        const styles = [];
        if (marker.hasAttribute(CENTERED_MARKER_ATTR)) styles.push("centered");
        if (marker.hasAttribute(BLUE_BAND_MARKER_ATTR)) styles.push("blue");
        if (marker.hasAttribute(GREY_BAND_MARKER_ATTR)) styles.push("grey");
        if (marker.hasAttribute(SUBHEAD_MARKER_ATTR)) styles.push(marker.getAttribute(SUBHEAD_MARKER_ATTR));
        if (marker.hasAttribute(TEXT_PRIMARY_MARKER_ATTR)) styles.push("text-primary");
        marker.removeAttribute(TEXT_PRIMARY_MARKER_ATTR);
        marker.removeAttribute(CENTERED_MARKER_ATTR);
        marker.removeAttribute(BLUE_BAND_MARKER_ATTR);
        marker.removeAttribute(GREY_BAND_MARKER_ATTR);
        marker.removeAttribute(SUBHEAD_MARKER_ATTR);
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: styles.join(", ") }
        });
        marker.after(metadataBlock);
      });
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
        // Before cards/quote: slides are built from infocards/testimonials, which
        // those parsers would otherwise claim individually.
        name: "carousel",
        instances: [".carousel.panelcontainer"]
      },
      {
        // A state container: one navy title band + linked location logos.
        name: "cards-logos",
        instances: [".columncontainer:has(.background-color--primary .cmp-title__text):has(.image a img)"]
      },
      {
        // In-page link index (e.g. the our-locations state list).
        name: "columns-link-list",
        instances: ['.columncontainer:has(.link a.link__text[href^="#"]):not(:has(.title))']
      },
      {
        name: "columns-comfortable-light",
        instances: [".mediainfo"]
      },
      {
        name: "cards",
        // Excludes the columns-minimal-light container (homepage "Sell your business"
        // logo + text + CTA), which is built from the same infocards component.
        instances: [".columncontainer:has(.infocards):not(.spacing__top--40px)"]
      },
      {
        name: "columns-minimal-light",
        instances: [".columncontainer.spacing__top--40px"]
      },
      {
        name: "quote",
        instances: [".columncontainer.background-color--tertiary.spacing__top-bottom--40px:nth-of-type(5)", ".testimonial"]
      },
      {
        name: "embed",
        instances: [".rawhtml"]
      },
      {
        name: "video",
        instances: [".video"]
      },
      {
        name: "accordion",
        instances: [".accordion.panelcontainer"]
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
    quote: parse5,
    embed: parse6,
    video: parse7,
    accordion: parse8,
    carousel: parse9,
    "cards-logos": parse10,
    "columns-link-list": parse11
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
