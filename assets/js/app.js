/* =========================================================
   Kaztop landing — i18n, language switch, WhatsApp lead form
   No frameworks. Texts live in kk.json / ru.json.
   ========================================================= */

(function () {
  "use strict";

  // ---- Config -----------------------------------------------------------
  // {{WHATSAPP_NUMBER}} — номер Kaztop в международном формате без "+" и пробелов
  // (например 77011234567). Пока пусто — ссылка откроет WhatsApp с готовым
  // текстом и предложит выбрать контакт. ЗАМЕНИТЬ на номер клиента.
  var WHATSAPP_NUMBER = "77012448871";

  // {{PHONE_NUMBER}} — телефон Kaztop для tel: (например "+77011234567").
  // Пусто → кнопки «Позвонить» ведут к секции контактов (#contacts).
  var PHONE_NUMBER = "+77012448871";

  var SUPPORTED = ["kk", "ru", "en"];
  var DEFAULT_LANG = "ru";
  var STORAGE_KEY = "kaztop_lang";

  // Объекты-заглушки. {{PHOTOS}} — заменить фото и реальными подписями клиента.
  // 6 плиток с пометкой «образец» (см. *.json: objects.sample_note / placeholder).
  var OBJECT_COUNT = 6;
  var objectsManifest = null; // null = ещё не грузили; [] = нет фото (заглушки)

  // код продукта KAZTOP → техкарта из PDF (для чипов «Подробнее» в каталоге систем)
  var SPEC_MAP = {
    "001": "assets/img/specs/spec_001.webp",
    "040": "assets/img/specs/spec_040.webp",
    "600": "assets/img/specs/spec_600.webp",
    "100": "assets/img/specs/spec_100.webp",
    "100М": "assets/img/specs/spec_100m.webp",
    "010": "assets/img/specs/spec_010.webp",
    "5/15": "assets/img/specs/spec_5-15.webp"
  };
  // уникальные коды продуктов из описания стандарта, в порядке появления
  function parseSpecCodes(text) {
    var re = /KAZTOP[\s \-]*(100М|\d\/\d{2}|\d{3})/g, out = [], m;
    while ((m = re.exec(text || ""))) { if (out.indexOf(m[1]) === -1) out.push(m[1]); }
    return out;
  }

  var dict = {};        // активный словарь
  var currentLang = DEFAULT_LANG;

  // ---- Helpers ----------------------------------------------------------
  function getByPath(obj, path) {
    return path.split(".").reduce(function (acc, key) {
      return acc != null ? acc[key] : undefined;
    }, obj);
  }

  function pickLang() {
    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
    var nav = (navigator.language || "").slice(0, 2).toLowerCase();
    if (nav === "kk") return "kk";
    if (nav === "en") return "en";
    return DEFAULT_LANG;
  }

  function loadDict(lang) {
    return fetch(lang + ".json", { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("Cannot load " + lang + ".json (" + r.status + ")");
      return r.json();
    });
  }

  // ---- Apply translations ----------------------------------------------
  function applyI18n() {
    // textContent
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var val = getByPath(dict, el.getAttribute("data-i18n"));
      if (typeof val === "string") el.textContent = val;
    });
    // attributes — format: "attr:path" (e.g. "placeholder:form.name_placeholder")
    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(",").forEach(function (pair) {
        var parts = pair.split(":");
        var attr = parts[0] && parts[0].trim();
        var path = parts[1] && parts[1].trim();
        if (!attr || !path) return;
        var val = getByPath(dict, path);
        if (typeof val === "string") el.setAttribute(attr, val);
      });
    });

    document.documentElement.lang = currentLang;
    var titleVal = getByPath(dict, "meta.title");
    if (titleVal) document.title = titleVal;

    buildObjects();
    buildSystems();
    buildHowSelect();
    buildProcess();
    buildDecor();
    buildPrices();
    buildSponsors();
    updateContacts();
  }

  // ---- Prices (рыночный ориентир, из dict.prices.rows) -----------------
  function buildPrices() {
    var grid = document.getElementById("price-table");
    var data = getByPath(dict, "prices");
    if (!grid || !data || !data.rows) return;
    grid.innerHTML = "";
    data.rows.forEach(function (r) {
      var row = document.createElement("div");
      row.className = "price-row";
      var sys = document.createElement("span");
      sys.className = "price-row__sys";
      sys.textContent = r.sys;
      var th = document.createElement("span");
      th.className = "price-row__th";
      th.textContent = r.th;
      var pr = document.createElement("span");
      pr.className = "price-row__price";
      pr.textContent = r.price;
      row.appendChild(sys);
      row.appendChild(th);
      row.appendChild(pr);
      grid.appendChild(row);
    });
  }

  // ---- How we select (методика, dict.selection) — карточки с фоном ------
  // фоны воздействий (Higgsfield); добавляются по мере генерации, иначе CSS-градиент
  var EFFECT_BG = {
    0: "assets/img/effects/eff_0.webp",
    1: "assets/img/effects/eff_1.webp",
    2: "assets/img/effects/eff_2.webp",
    3: "assets/img/effects/eff_3.webp"
  };
  function buildHowSelect() {
    var grid = document.getElementById("method-grid");
    var data = getByPath(dict, "selection");
    if (!grid || !data || !data.groups) return;
    grid.innerHTML = "";
    data.groups.forEach(function (g, gi) {
      var card = document.createElement("article");
      card.className = "method-card";
      if (EFFECT_BG[gi]) {
        card.classList.add("method-card--photo");
        var bg = document.createElement("img");
        bg.className = "method-card__bg";
        bg.loading = "lazy";
        bg.src = EFFECT_BG[gi];
        bg.alt = "";
        bg.setAttribute("aria-hidden", "true");
        card.appendChild(bg);
      }
      var inner = document.createElement("div");
      inner.className = "method-card__inner";
      var h = document.createElement("h4");
      h.className = "method-card__title";
      h.textContent = g.title;
      inner.appendChild(h);
      var ul = document.createElement("ul");
      ul.className = "method-card__list";
      (g.items || []).forEach(function (it) {
        var li = document.createElement("li");
        li.textContent = it;
        ul.appendChild(li);
      });
      inner.appendChild(ul);
      card.appendChild(inner);
      grid.appendChild(card);
    });
    var base = document.getElementById("method-base");
    if (base) {
      base.innerHTML = "";
      if (data.base_title) {
        var bt = document.createElement("p");
        bt.className = "method-base__title";
        bt.textContent = data.base_title;
        base.appendChild(bt);
      }
      var descs = data.base_desc || [];
      var bgrid = document.createElement("div");
      bgrid.className = "method-base__grid";
      (data.base_items || []).forEach(function (it, bi) {
        var item = document.createElement("div");
        item.className = "base-item";
        var ic = document.createElement("span");
        ic.className = "base-item__icon";
        ic.setAttribute("aria-hidden", "true");
        ic.textContent = "✓";
        var body = document.createElement("div");
        body.className = "base-item__body";
        var tx = document.createElement("span");
        tx.className = "base-item__text";
        tx.textContent = it;
        body.appendChild(tx);
        if (descs[bi]) {
          var ds = document.createElement("p");
          ds.className = "base-item__desc";
          ds.textContent = descs[bi];
          body.appendChild(ds);
        }
        item.appendChild(ic);
        item.appendChild(body);
        bgrid.appendChild(item);
      });
      base.appendChild(bgrid);
    }
  }

  // ---- Process (этапы, dict.process.steps) -----------------------------
  function buildProcess() {
    var grid = document.getElementById("steps-grid");
    var data = getByPath(dict, "process");
    if (!grid || !data || !data.steps) return;
    grid.innerHTML = "";
    data.steps.forEach(function (s) {
      var card = document.createElement("article");
      card.className = "step-card";
      var num = document.createElement("span");
      num.className = "step-card__num";
      num.textContent = s.num;
      var h = document.createElement("h3");
      h.className = "step-card__title";
      h.textContent = s.title;
      var p = document.createElement("p");
      p.className = "step-card__desc";
      p.textContent = s.desc;
      card.appendChild(num);
      card.appendChild(h);
      card.appendChild(p);
      grid.appendChild(card);
    });
  }

  // ---- Decor (RAL-свотчи + флоки, dict.palette) ------------------------
  function buildDecor() {
    var data = getByPath(dict, "palette");
    if (!data) return;
    var ral = document.getElementById("ral-grid");
    if (ral && data.colors) {
      ral.innerHTML = "";
      data.colors.forEach(function (c) {
        var sw = document.createElement("div");
        sw.className = "ral-swatch";
        var chip = document.createElement("span");
        chip.className = "ral-swatch__chip";
        chip.style.background = c.hex;
        var code = document.createElement("span");
        code.className = "ral-swatch__code";
        code.textContent = c.ral;
        var name = document.createElement("span");
        name.className = "ral-swatch__name";
        name.textContent = c.name;
        sw.appendChild(chip);
        sw.appendChild(code);
        sw.appendChild(name);
        ral.appendChild(sw);
      });
    }
    var fl = document.getElementById("flake-grid");
    if (fl && data.flakes) {
      fl.innerHTML = "";
      data.flakes.forEach(function (f) {
        var tile = document.createElement("figure");
        tile.className = "flake-tile";
        var img = document.createElement("img");
        img.className = "flake-tile__img";
        img.loading = "lazy";
        img.src = f.src;
        img.alt = "Флок " + f.id;
        var cap = document.createElement("figcaption");
        cap.className = "flake-tile__id";
        cap.textContent = f.id;
        tile.appendChild(img);
        tile.appendChild(cap);
        fl.appendChild(tile);
      });
    }
  }

  // ---- Sponsors marquee (из dict.sponsors.items, дублируем для петли) ---
  function buildSponsors() {
    var track = document.getElementById("sponsors-track");
    var data = getByPath(dict, "sponsors");
    if (!track || !data || !data.items) return;
    track.innerHTML = "";
    var list = data.items.concat(data.items);
    list.forEach(function (name) {
      var span = document.createElement("span");
      span.className = "sponsors__item";
      span.textContent = name;
      track.appendChild(span);
    });
  }

  // ---- Accordion helpers -----------------------------------------------
  // иконки по типу помещения (key из dict.systems.items)
  var SYS_ICONS = {
    dry: "🏭", admin: "🏢", auto: "🚗",
    warehouse: "📦", chemical: "🧪", antistatic: "⚡"
  };

  function chevronSvg() {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "acc-chev");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    var p = document.createElementNS(ns, "path");
    p.setAttribute("d", "M6 9l6 6 6-6");
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", "currentColor");
    p.setAttribute("stroke-width", "2");
    p.setAttribute("stroke-linecap", "round");
    p.setAttribute("stroke-linejoin", "round");
    svg.appendChild(p);
    return svg;
  }

  // ---- Lightbox: клик по картинке → крупный просмотр, Esc/клик/× → закрыть -
  function initLightbox() {
    var box = document.getElementById("lightbox");
    var img = document.getElementById("lightbox-img");
    if (!box || !img) return;
    var ZOOMABLE = ".obj-tile__img, .sys-std__cut, .flake-tile__img, .type-card__photo, .doc-thumb";

    function open(src, alt) {
      img.src = src;
      img.alt = alt || "";
      box.hidden = false;
      document.body.classList.add("lightbox-open");
    }
    function close() {
      box.hidden = true;
      img.removeAttribute("src");
      document.body.classList.remove("lightbox-open");
    }

    // делегирование: переживает ре-рендер блоков при смене языка
    document.addEventListener("click", function (e) {
      var s = e.target.closest && e.target.closest(".spec-link");
      if (s && s.getAttribute("data-spec")) { e.preventDefault(); open(s.getAttribute("data-spec"), s.getAttribute("aria-label")); return; }
      var t = e.target.closest && e.target.closest(ZOOMABLE);
      if (t && t.getAttribute("src")) { e.preventDefault(); open(t.getAttribute("src"), t.alt); }
    });
    box.addEventListener("click", function (e) {
      if (e.target === box || e.target.id === "lightbox-close") close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !box.hidden) close();
    });
  }


  // ---- Документ-галереи в «О компании» (сертификаты, техкарты, узлы) ----
  function initDocGalleries() {
    var toggles = document.querySelectorAll(".doc-toggle");
    Array.prototype.forEach.call(toggles, function (btn) {
      var gallery = document.getElementById(btn.getAttribute("aria-controls"));
      if (!gallery) return;
      btn.addEventListener("click", function () {
        var open = gallery.hidden;
        gallery.hidden = !open;
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
  }

  // ---- Systems by room type — карточки с фото + «Подробнее» -------------
  function buildSystems() {
    var grid = document.getElementById("systems-grid");
    var data = getByPath(dict, "systems");
    if (!grid || !data || !data.items) return;
    var advLabel = data.adv_label || "Преимущества";
    var ctaLabel = data.cta_calc || "Рассчитать этот пол";
    var moreLabel = data.more || "Подробнее";
    var lessLabel = data.less || "Свернуть";
    var specMore = data.spec_more || "Подробнее";
    grid.innerHTML = "";
    data.items.forEach(function (it) {
      var card = document.createElement("article");
      card.className = "type-card type-card--sys";

      // медиа: фото объекта + название и тизер поверх (современный вид)
      var media = document.createElement("div");
      media.className = "type-card__media";
      if (it.key) {
        var photo = document.createElement("img");
        photo.className = "type-card__photo";
        photo.loading = "lazy";
        photo.src = "assets/img/systems/sys_" + it.key + ".webp";
        photo.alt = it.title || "";
        media.appendChild(photo);
      }
      var overlay = document.createElement("div");
      overlay.className = "type-card__overlay";
      var ttl = document.createElement("h3");
      ttl.className = "type-card__title";
      ttl.textContent = it.title;
      overlay.appendChild(ttl);
      if (it.teaser) {
        var teaser = document.createElement("p");
        teaser.className = "type-card__teaser";
        teaser.textContent = it.teaser;
        overlay.appendChild(teaser);
      }
      media.appendChild(overlay);
      card.appendChild(media);

      var info = document.createElement("div");
      info.className = "type-card__info";

      // раскрываемое содержимое
      var extra = document.createElement("div");
      extra.className = "type-card__extra";
      if (it.adv && it.adv.length) {
        var advTitle = document.createElement("p");
        advTitle.className = "sys-card__adv-label";
        advTitle.textContent = advLabel;
        extra.appendChild(advTitle);
        var ul = document.createElement("ul");
        ul.className = "sys-card__adv";
        it.adv.forEach(function (a) {
          var li = document.createElement("li");
          li.textContent = a;
          ul.appendChild(li);
        });
        extra.appendChild(ul);
      }
      (it.std || []).forEach(function (s, i) {
        var row = document.createElement("div");
        row.className = "sys-std";
        var cut = document.createElement("img");
        cut.className = "sys-std__cut";
        cut.loading = "lazy";
        cut.src = "assets/img/systems/cut_" + it.key + "_" + i + ".webp";
        cut.alt = "";
        var name = document.createElement("span");
        name.className = "sys-std__name";
        name.textContent = s.name;
        var sbody = document.createElement("div");
        sbody.className = "sys-std__body";
        var sys = document.createElement("span");
        sys.className = "sys-std__sys";
        sys.textContent = s.sys;
        var th = document.createElement("span");
        th.className = "sys-std__th";
        th.textContent = s.th;
        sbody.appendChild(sys);
        sbody.appendChild(th);
        // чипы «Подробнее» на продукты с техкартой из PDF
        var codes = parseSpecCodes(s.sys).filter(function (c) { return SPEC_MAP[c]; });
        if (codes.length) {
          var docs = document.createElement("div");
          docs.className = "sys-std__docs";
          codes.forEach(function (c) {
            var link = document.createElement("button");
            link.type = "button";
            link.className = "spec-link";
            link.textContent = "KAZTOP " + c;
            link.setAttribute("data-spec", SPEC_MAP[c]);
            link.setAttribute("aria-label", specMore + " — техкарта KAZTOP " + c);
            link.title = specMore;
            docs.appendChild(link);
          });
          sbody.appendChild(docs);
        }
        row.appendChild(cut);
        row.appendChild(name);
        row.appendChild(sbody);
        extra.appendChild(row);
      });
      var cta = document.createElement("a");
      cta.className = "btn btn--accent btn--sm acc-cta";
      cta.href = "#form";
      cta.textContent = ctaLabel;
      cta.setAttribute("data-systemkey", it.key || "");
      extra.appendChild(cta);

      // кнопка раскрытия
      var toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "type-card__toggle";
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("data-more", moreLabel);
      toggle.setAttribute("data-less", lessLabel);
      var tlabel = document.createElement("span");
      tlabel.className = "type-card__toggle-label";
      tlabel.textContent = moreLabel;
      toggle.appendChild(tlabel);
      toggle.appendChild(chevronSvg());
      info.appendChild(toggle);
      info.appendChild(extra);

      card.appendChild(info);
      grid.appendChild(card);
    });
  }

  // раскрытие карточек («Подробнее» / «Свернуть») + доскролл, одна за раз
  function initTypeCards() {
    var grid = document.getElementById("systems-grid");
    if (!grid) return;
    grid.addEventListener("click", function (e) {
      var btn = e.target.closest && e.target.closest(".type-card__toggle");
      if (!btn) return;
      var card = btn.closest(".type-card");
      var open = card.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      var lab = btn.querySelector(".type-card__toggle-label");
      if (lab) lab.textContent = open ? btn.getAttribute("data-less") : btn.getAttribute("data-more");
      if (open) {
        grid.querySelectorAll(".type-card.is-open").forEach(function (o) {
          if (o !== card) {
            o.classList.remove("is-open");
            var b = o.querySelector(".type-card__toggle");
            var l = b && b.querySelector(".type-card__toggle-label");
            if (b) b.setAttribute("aria-expanded", "false");
            if (l) l.textContent = b.getAttribute("data-more");
          }
        });
      }
    });
  }

  // ---- Objects grid (placeholder tiles) --------------------------------
  function buildObjects() {
    var grid = document.getElementById("objects-grid");
    if (!grid) return;
    var watermark = getByPath(dict, "objects.sample_note") || "образец";
    var placeholder = getByPath(dict, "objects.placeholder") || "Скоро добавим реальные объекты Kaztop.";
    var caption = getByPath(dict, "objects.card_caption") || "Объект · Город · м²";

    // манифест реальных фото (scripts/build-manifest.py → assets/img/objects.json);
    // нет/пустой/file:// → плитки-заглушки
    if (objectsManifest === null) {
      objectsManifest = [];
      fetch("assets/img/objects.json")
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (list) {
          objectsManifest = Array.isArray(list) ? list : [];
          if (objectsManifest.length) buildObjects();
        })
        .catch(function () { /* остаёмся на заглушках */ });
    }

    grid.innerHTML = "";
    if (objectsManifest.length) {
      // авто-бегущая лента: оригиналы + дубль для бесшовного цикла (translateX -50%)
      grid.className = "objects-track";
      function makeObjTile(item, clone) {
        var tile = document.createElement("article");
        tile.className = "obj-tile obj-tile--photo" + (clone ? " is-clone" : "");
        if (clone) tile.setAttribute("aria-hidden", "true");
        var img = document.createElement("img");
        img.className = "obj-tile__img";
        img.loading = "lazy";
        img.src = item.src;
        var text = item["caption_" + currentLang] || item.caption_ru || caption;
        img.alt = text;
        var cap = document.createElement("div");
        cap.className = "obj-tile__caption";
        cap.textContent = text;
        tile.appendChild(img);
        tile.appendChild(cap);
        return tile;
      }
      objectsManifest.forEach(function (item) { grid.appendChild(makeObjTile(item, false)); });
      objectsManifest.forEach(function (item) { grid.appendChild(makeObjTile(item, true)); });
      return;
    }
    grid.className = "grid grid--objects";
    // реальные объекты (без фото пока) — именованные карточки как соцдоказательство
    var projects = getByPath(dict, "objects.projects");
    if (projects && projects.length) {
      grid.classList.add("objects-grid--named");
      projects.forEach(function (p) {
        var tile = document.createElement("article");
        tile.className = "obj-named";
        var nm = document.createElement("span");
        nm.className = "obj-named__name";
        nm.textContent = p.name;
        var ct = document.createElement("span");
        ct.className = "obj-named__city";
        ct.textContent = p.city;
        tile.appendChild(nm);
        tile.appendChild(ct);
        grid.appendChild(tile);
      });
      return;
    }
    for (var i = 0; i < OBJECT_COUNT; i++) {
      var tile = document.createElement("article");
      tile.className = "obj-tile";
      tile.innerHTML =
        '<div class="obj-tile__surface" aria-hidden="true"></div>' +
        '<span class="obj-tile__watermark"></span>' +
        '<div class="obj-tile__caption"></div>';
      tile.querySelector(".obj-tile__watermark").textContent = watermark;
      tile.querySelector(".obj-tile__caption").textContent = caption;
      tile.title = placeholder;
      grid.appendChild(tile);
    }
  }

  // ---- WhatsApp link helpers -------------------------------------------
  function waLink(text) {
    var base = "https://wa.me/" + (WHATSAPP_NUMBER || "");
    return base + "?text=" + encodeURIComponent(text);
  }

  function updateContacts() {
    var intro = getByPath(dict, "form.wa_intro") || "Kaztop";
    ["contact-whatsapp", "header-whatsapp", "hero-whatsapp", "floating-whatsapp"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      if (WHATSAPP_NUMBER) {
        el.setAttribute("href", waLink(intro));
        el.classList.remove("is-disabled");
        el.removeAttribute("aria-disabled");
      } else {
        // номер клиента ещё не задан → не ведём в пустой wa.me
        el.removeAttribute("href");
        el.classList.add("is-disabled");
        el.setAttribute("aria-disabled", "true");
      }
    });
    var tel = PHONE_NUMBER ? "tel:" + PHONE_NUMBER.replace(/\s/g, "") : "#contacts";
    ["header-call", "floating-call"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.setAttribute("href", tel);
    });
  }

  function buildLeadMessage(data) {
    var L = function (p, fallback) { return getByPath(dict, p) || fallback; };
    var lines = [
      L("form.wa_intro", "Заявка с сайта Kaztop:"),
      L("form.wa_name", "Имя") + ": " + (data.name || "—"),
      L("form.wa_phone", "Телефон") + ": " + (data.phone || "—"),
      L("form.wa_type", "Тип объекта") + ": " + (data.typeLabel || "—")
    ];
    if (data.system) lines.push(L("form.wa_system", "Интересует система") + ": " + data.system);
    lines.push(L("form.wa_area", "Площадь, м²") + ": " + (data.area || "—"));
    return lines.join("\n");
  }

  // CTA «Рассчитать этот пол» из раскрытой системы → предвыбор в форме + скролл
  function initAccordions() {
    var grid = document.getElementById("systems-grid");
    if (!grid) return;
    var KEY_TO_TYPE = {
      dry: "industrial", admin: "other", auto: "parking",
      warehouse: "industrial", chemical: "industrial", antistatic: "industrial"
    };
    grid.addEventListener("click", function (e) {
      var cta = e.target.closest && e.target.closest(".acc-cta");
      if (!cta) return;
      var key = cta.getAttribute("data-systemkey");
      var title = "";
      (getByPath(dict, "systems.items") || []).forEach(function (it) { if (it.key === key) title = it.title; });
      // CTA каталога → сразу WhatsApp с готовым текстом по выбранной системе
      if (WHATSAPP_NUMBER) {
        e.preventDefault();
        var L = function (p, f) { return getByPath(dict, p) || f; };
        var msg = L("form.wa_intro", "Заявка с сайта Kaztop:") + "\n" +
                  L("form.wa_system", "Интересует система") + ": " + (title || "—");
        window.open(waLink(msg), "_blank", "noopener");
        return;
      }
      // нет номера → мягкий фолбэк: прокрутка к форме (href="#form") + префилл
      var form = document.getElementById("lead-form");
      if (form && form.elements.type && KEY_TO_TYPE[key]) form.elements.type.value = KEY_TO_TYPE[key];
      var sys = document.getElementById("f-system");
      if (sys) sys.value = key || "";
    });
  }

  // ---- Lead form --------------------------------------------------------
  function disableForm(form) {
    form.classList.add("is-disabled");
    Array.prototype.forEach.call(
      form.querySelectorAll("input, select, textarea, button"),
      function (el) { el.disabled = true; }
    );
    var notice = document.getElementById("form-notice");
    if (notice) notice.hidden = false;
    var disclaimer = form.querySelector(".form-disclaimer");
    if (disclaimer) disclaimer.hidden = true;
  }

  function initForm() {
    var form = document.getElementById("lead-form");
    if (!form) return;
    var errorEl = document.getElementById("form-error");

    // нет номера клиента → форма отключена до получения контактов
    if (!WHATSAPP_NUMBER) { disableForm(form); return; }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim();
      var phone = form.elements.phone.value.trim();

      if (!name || !phone) {
        if (errorEl) errorEl.hidden = false;
        return;
      }
      if (errorEl) errorEl.hidden = true;

      var typeSelect = form.elements.type;
      var typeLabel = typeSelect.options[typeSelect.selectedIndex].textContent;
      // #f-system хранит КЛЮЧ системы — резолвим название из текущего словаря (актуальный язык)
      var sysKey = form.elements.system ? form.elements.system.value.trim() : "";
      var sysName = "";
      if (sysKey) {
        (getByPath(dict, "systems.items") || []).forEach(function (it) {
          if (it.key === sysKey) sysName = it.title;
        });
      }
      var message = buildLeadMessage({
        name: name,
        phone: phone,
        typeLabel: typeLabel,
        system: sysName,
        area: form.elements.area.value.trim()
      });
      window.open(waLink(message), "_blank", "noopener");
    });
  }

  // ---- Language switch UI ----------------------------------------------
  function setActiveLangButton() {
    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-lang") === currentLang);
    });
  }

  function switchLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1 || lang === currentLang) return;
    loadDict(lang).then(function (d) {
      dict = d;
      currentLang = lang;
      try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
      applyI18n();
      setActiveLangButton();
    }).catch(function (err) { console.error(err); });
  }

  function initLangSwitch() {
    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        switchLang(btn.getAttribute("data-lang"));
      });
    });
  }

  // ---- Mobile nav -------------------------------------------------------
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ---- Scroll-aware header (transparent over hero → solid white) -------
  function initHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    var bar = document.getElementById("floating-bar");
    var update = function () {
      var y = window.scrollY || window.pageYOffset;
      header.setAttribute("data-state", y > 40 ? "scrolled" : "top");
      if (bar) bar.classList.toggle("is-visible", y > window.innerHeight * 0.6);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  // ---- Scroll reveal ----------------------------------------------------
  function initReveal() {
    var targets = document.querySelectorAll(
      ".section__head, .seg-card, .type-card, .method-card, .step-card, .about-card, .price-card, .price-note, .lead-form, .contact-card"
    );
    if (!targets.length) return;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    targets.forEach(function (el, i) {
      el.classList.add("reveal");
      el.style.transitionDelay = (i % 3) * 0.08 + "s";
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (el) { io.observe(el); });
  }

  // ---- Hero count-up ----------------------------------------------------
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }
  function initCount() {
    var el = document.querySelector("[data-count]");
    if (!el) return;
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { el.textContent = prefix + fmt(target) + suffix; return; }
    var start = null, dur = 1600;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + fmt(Math.round(target * eased)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ---- Misc -------------------------------------------------------------
  function initYear() {
    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  }

  // ---- Hero: 3D layer (Spline slot → fallback to WebGL "poured resin") --
  // {{SPLINE_SCENE_URL}} — публичная .splinecode ссылка из spline.design.
  // Пусто → работает встроенный WebGL-шейдер (без зависимостей, офлайн).
  var SPLINE_SCENE_URL = "";

  var VERT = "attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}";
  var FRAG = [
    "precision highp float;",
    "uniform vec2 u_res;uniform float u_time;uniform vec2 u_mouse;",
    "float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}",
    "float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.0-2.0*f);",
    "return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x),u.y);}",
    "float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<6;i++){v+=a*noise(p);p*=2.02;a*=0.5;}return v;}",
    "void main(){",
    "vec2 p=(gl_FragCoord.xy-0.5*u_res)/u_res.y;",
    "float t=u_time*0.05;vec2 m=(u_mouse-0.5)*0.7;",
    "vec2 q=vec2(fbm(p*1.6+t+m),fbm(p*1.6-t+1.7));",
    "vec2 r=vec2(fbm(p*1.6+1.2*q+vec2(1.7,9.2)+0.15*t),fbm(p*1.6+1.2*q+vec2(8.3,2.8)-0.12*t));",
    "float f=fbm(p*1.6+2.0*r);",
    "vec3 deep=vec3(0.016,0.078,0.094),teal=vec3(0.0,0.42,0.49),sky=vec3(0.0,0.686,0.792),gold=vec3(0.996,0.773,0.047);",
    "vec3 col=mix(deep,teal,smoothstep(0.0,0.6,f));",
    "col=mix(col,sky,smoothstep(0.4,0.95,f+0.2*r.x));",
    "col=mix(col,gold,smoothstep(0.78,0.97,f+0.3*q.y)*0.55);",
    "float spec=pow(smoothstep(0.6,1.0,f),6.0);col+=spec*0.22;",
    "col*=1.0-0.45*length(p*vec2(0.55,1.0));",
    "gl_FragColor=vec4(col,1.0);}"
  ].join("");

  function compileShader(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(s)); return null; }
    return s;
  }

  // переиспользуемый «налив»-шейдер на любом canvas; пауза вне вьюпорта (observeTarget)
  function runFluidShader(canvas, observeTarget) {
    if (!canvas) return false;
    var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) { canvas.classList.add("is-off"); return false; } // → CSS-градиент как фолбэк
    var vs = compileShader(gl, gl.VERTEX_SHADER, VERT);
    var fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { canvas.classList.add("is-off"); return false; }
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.classList.add("is-off"); return false; }
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uRes = gl.getUniformLocation(prog, "u_res");
    var uTime = gl.getUniformLocation(prog, "u_time");
    var uMouse = gl.getUniformLocation(prog, "u_mouse");

    var mouse = [0.5, 0.5], target = [0.5, 0.5];
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    function resize() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener("resize", resize); resize();
    window.addEventListener("pointermove", function (e) {
      target[0] = e.clientX / window.innerWidth;
      target[1] = 1.0 - e.clientY / window.innerHeight;
    }, { passive: true });

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var visible = true, running = false, start = performance.now();
    function frame(now) {
      if (!visible) { running = false; return; }
      mouse[0] += (target[0] - mouse[0]) * 0.05;
      mouse[1] += (target[1] - mouse[1]) * 0.05;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (now - start) / 1000.0);
      gl.uniform2f(uMouse, mouse[0], mouse[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (reduce) { running = false; return; }
      requestAnimationFrame(frame);
    }
    function run() { if (!running) { running = true; requestAnimationFrame(frame); } }
    var tgt = observeTarget || canvas;
    if ("IntersectionObserver" in window && tgt) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) run(); }).observe(tgt);
    }
    run();
    return true;
  }

  function initHero3D() {
    runFluidShader(document.getElementById("hero-canvas"), document.getElementById("hero"));
  }

  // лента «Наши работы»: авто-прокрутка + ручной скролл/свайп/драг, бесшовный цикл
  function initObjectsScroll() {
    var marquee = document.querySelector(".objects-marquee");
    var track = document.getElementById("objects-grid");
    if (!marquee || !track) return;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var paused = false, resumeTimer;
    function pauseAuto(ms) { paused = true; clearTimeout(resumeTimer); resumeTimer = setTimeout(function () { paused = false; }, ms || 2500); }
    marquee.addEventListener("mouseenter", function () { paused = true; });
    marquee.addEventListener("mouseleave", function () { if (!down) paused = false; });
    // вертикальное колесо → горизонтальная прокрутка ленты
    marquee.addEventListener("wheel", function (e) {
      var d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (d) { marquee.scrollLeft += d; e.preventDefault(); }
      pauseAuto();
    }, { passive: false });
    marquee.addEventListener("touchstart", function () { paused = true; }, { passive: true });
    marquee.addEventListener("touchend", function () { pauseAuto(); }, { passive: true });
    // drag мышью на десктопе
    var down = false, startX = 0, startScroll = 0;
    marquee.addEventListener("pointerdown", function (e) {
      down = true; paused = true; startX = e.clientX; startScroll = marquee.scrollLeft;
      marquee.classList.add("is-grabbing");
    });
    window.addEventListener("pointermove", function (e) {
      if (!down) return; marquee.scrollLeft = startScroll - (e.clientX - startX);
    });
    window.addEventListener("pointerup", function () {
      if (!down) return; down = false; marquee.classList.remove("is-grabbing"); pauseAuto();
    });
    // авто-прокрутка стартует только когда лента в зоне видимости
    var inView = false;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }, { threshold: 0.2 }).observe(marquee);
    } else { inView = true; }
    function half() { return track.scrollWidth / 2; }
    function tick() {
      var h = half();
      if (h > 0) {
        if (!reduce && !paused && inView) marquee.scrollLeft += 0.5;
        if (marquee.scrollLeft >= h) marquee.scrollLeft -= h;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // авто-прокрутка горизонтальной ленты «туда-обратно» (RAL/флоки): только в зоне видимости,
  // пауза при наведении/касании/колесе; ручной скролл и скроллбар работают как обычно
  function initStripAutoScroll(el) {
    if (!el) return;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var paused = false, resumeT, dir = 1, inView = false;
    function pauseAuto(ms) { paused = true; clearTimeout(resumeT); resumeT = setTimeout(function () { paused = false; }, ms || 2500); }
    el.addEventListener("mouseenter", function () { paused = true; });
    el.addEventListener("mouseleave", function () { paused = false; });
    el.addEventListener("wheel", function () { pauseAuto(); }, { passive: true });
    el.addEventListener("touchstart", function () { paused = true; }, { passive: true });
    el.addEventListener("touchend", function () { pauseAuto(); }, { passive: true });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }, { threshold: 0 }).observe(el);
    } else { inView = true; }
    // float-аккумулятор: scrollLeft округляется до целого, поэтому копим позицию отдельно
    var pos = el.scrollLeft;
    el.addEventListener("scroll", function () { if (paused) pos = el.scrollLeft; }, { passive: true });
    function tick() {
      var max = el.scrollWidth - el.clientWidth;
      if (max > 4 && !reduce && !paused && inView) {
        pos += 0.4 * dir;
        if (pos >= max) { pos = max; dir = -1; }
        else if (pos <= 0) { pos = 0; dir = 1; }
        el.scrollLeft = pos;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // toast-уведомления (наличие → отгрузка → доставка) — по очереди справа, один проход
  function initStockToasts() {
    var box = document.getElementById("stock-toasts");
    if (!box) return;
    var items = box.querySelectorAll(".stock-toast");
    if (!items.length) return;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { box.classList.add("is-static"); return; }
    var i = 0;
    function step() {
      if (i >= items.length) return;
      var cur = items[i];
      cur.classList.add("is-in");
      setTimeout(function () {
        cur.classList.remove("is-in");
        i++;
        setTimeout(step, 450);
      }, 3500);
    }
    setTimeout(step, 1500);
  }

  // тот же «налив»-фон в тёмных секциях 04/05 (canvas .section-fx, фолбэк — CSS-градиент)
  function initSectionFx() {
    [["decor-fx", "decor"], ["objects-fx", "objects"], ["form-fx", "form"], ["sponsors-fx", "sponsors"]].forEach(function (pair) {
      runFluidShader(document.getElementById(pair[0]), document.getElementById(pair[1]));
    });
  }

  function initSpline() {
    if (!SPLINE_SCENE_URL) return false;
    var slot = document.getElementById("hero-spline");
    var canvas = document.getElementById("hero-canvas");
    if (!slot) return false;
    // version range @1 — при необходимости закрепить точную версию viewer
    var s = document.createElement("script");
    s.type = "module";
    s.src = "https://unpkg.com/@splinetool/viewer@1/build/spline-viewer.js";
    document.head.appendChild(s);
    var v = document.createElement("spline-viewer");
    v.setAttribute("url", SPLINE_SCENE_URL);
    slot.appendChild(v);
    slot.classList.add("is-active");
    if (canvas) canvas.classList.add("is-off");
    return true;
  }

  // ---- Bootstrap --------------------------------------------------------
  function init() {
    currentLang = pickLang();
    initLangSwitch();
    initForm();
    initAccordions();
    initTypeCards();
    initLightbox();
    initDocGalleries();
    initNav();
    initHeader();
    initYear();
    initReveal();
    initCount();
    // приоритет hero-визуала: Spline (если задан URL) → WebGL-шейдер
    if (!initSpline()) initHero3D();
    initSectionFx();
    initObjectsScroll();
    initStripAutoScroll(document.getElementById("ral-grid"));
    initStripAutoScroll(document.getElementById("flake-grid"));
    initStockToasts();

    loadDict(currentLang)
      .then(function (d) { dict = d; applyI18n(); setActiveLangButton(); })
      .catch(function (err) {
        console.error(err);
        // Fallback: страница уже содержит русский текст по умолчанию в разметке.
        setActiveLangButton();
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
