// ===== iframe height / parent viewport bridge =====
const SYURA_PARENT_ORIGIN = "https://artmug.kr";
const SYURA_ALLOWED_PARENT_ORIGINS = [
  "https://artmug.kr",
  "https://www.artmug.kr"
];

let syuraLastSentHeight = 0;
let syuraParentViewport = null;

function sendIframeHeightToParent() {
  if (!window.parent || window.parent === window) return;

  const height = Math.ceil(Math.max(
    document.documentElement.scrollHeight || 0,
    document.body?.scrollHeight || 0,
    document.documentElement.offsetHeight || 0,
    document.body?.offsetHeight || 0
  ));

  if (Math.abs(height - syuraLastSentHeight) < 4) return;
  syuraLastSentHeight = height;

  window.parent.postMessage(
    { source: "syura-css", type: "SYURA_IFRAME_HEIGHT", height },
    "*"
  );
}

function notifyIframeReady() {
  if (!window.parent || window.parent === window) return;
  window.parent.postMessage(
    { source: "syura-css", type: "SYURA_IFRAME_READY" },
    "*"
  );
  sendIframeHeightToParent();
}

function applyParentViewport(data) {
  syuraParentViewport = data || null;

  const viewportHeight = Number(data?.viewportHeight || window.innerHeight || 0);
  const iframeTop = Number(data?.iframeTop || 0);

  const visibleTop = Math.max(0, -iframeTop);
  const visibleBottom = Math.max(0, Math.min(Number(data?.iframeHeight || 0), viewportHeight - iframeTop));
  const visibleHeight = Math.max(320, visibleBottom - visibleTop || viewportHeight);
  const centerY = visibleTop + visibleHeight / 2;

  document.documentElement.style.setProperty("--parent-modal-top", `${centerY}px`);
  document.documentElement.style.setProperty("--parent-modal-height", `${Math.max(320, visibleHeight)}px`);
}

window.addEventListener("message", (e) => {
  if (SYURA_ALLOWED_PARENT_ORIGINS.length && !SYURA_ALLOWED_PARENT_ORIGINS.includes(e.origin)) return;

  const data = e.data || {};
  if (data.source !== "syura-artmug-parent") return;

  if (data.type === "SYURA_PARENT_VIEWPORT") {
    applyParentViewport(data);
  }
});

function setupIframeAutoResize() {
  notifyIframeReady();

  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver(() => requestAnimationFrame(sendIframeHeightToParent));
    ro.observe(document.documentElement);
    if (document.body) ro.observe(document.body);
  }

  window.addEventListener("load", sendIframeHeightToParent);
  window.addEventListener("resize", sendIframeHeightToParent);
  setTimeout(sendIframeHeightToParent, 300);
  setTimeout(sendIframeHeightToParent, 1000);
  setTimeout(sendIframeHeightToParent, 2000);
}

// app.js

const NOTICE_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR-XmfO0Kmn1WxK_gbsXHFPNY_XuS6EPciWj-1NWcDbIQdcx2plZxDjUpxAR1qo8X-KtxbJuznRiqd2/pub?output=csv";

document.addEventListener("DOMContentLoaded", () => {
  renderNoticesFromCsv(NOTICE_CSV_URL, "#noticeList");
});

async function renderNoticesFromCsv(csvUrl, targetSelector) {
  const listEl = document.querySelector(targetSelector);
  if (!listEl) {
    console.warn(`[notice] target not found: ${targetSelector}`);
    return;
  }

  try {
    const res = await fetch(csvUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const csvText = await res.text();

    const table = parseCsv(csvText);
    if (!table.length) return;

    const rows = table.slice(1);

    listEl.innerHTML = "";

    for (const row of rows) {
      const order = (row[0] ?? "").trim();
      const body = (row[1] ?? "").trim();

      if (!body) continue;

      const li = document.createElement("li");
      li.className = "noticeItem";
      li.innerHTML = `
        <span class="noticeItem__num">${escapeHtml(order)}</span>
        <p class="noticeItem__body">${escapeHtml(body)}</p>
      `;
      listEl.appendChild(li);
    }
  } catch (err) {
    console.error("[notice] failed to load CSV:", err);
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(field);
        field = "";
      } else if (ch === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += ch;
      }
    }
  }

  row.push(field);
  if (row.length > 1 || (row[0] ?? "").trim() !== "") rows.push(row);

  return rows;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const ADDON_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR-XmfO0Kmn1WxK_gbsXHFPNY_XuS6EPciWj-1NWcDbIQdcx2plZxDjUpxAR1qo8X-KtxbJuznRiqd2/pub?gid=239906440&single=true&output=csv";

document.addEventListener("DOMContentLoaded", () => {
  renderAddonsFromCsv(ADDON_CSV_URL, "#addonGrid");
});

async function renderAddonsFromCsv(csvUrl, targetSelector){
  const grid = document.querySelector(targetSelector);
  if (!grid) return;

  try{
    const res = await fetch(csvUrl, { cache: "no-store" });
    const text = await res.text();

    const rows = parseCsv(text).slice(1);
    grid.innerHTML = "";

    rows.forEach(row => {
      const [order, title, desc, imgUrl] = row;
      if (!title || !imgUrl) return;

      const imageSrc = convertDriveUrl(imgUrl);

      const li = document.createElement("li");
      li.className = "addonCard";
      li.innerHTML = `
        <div class="addonCard__imageWrap">
          <img src="${imageSrc}" alt="${escapeHtml(title)}" class="addonCard__image" loading="lazy">
        </div>
        <div class="addonCard__body">
          <h3 class="addonCard__title">${escapeHtml(title)}</h3>
          <p class="addonCard__desc">${escapeHtml(desc || "")}</p>
        </div>
      `;
      grid.appendChild(li);
    });

    sendIframeHeightToParent();
  }catch(err){
    console.error("[addons] load failed:", err);
  }
}

function convertDriveUrl(url){
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return url;
  return `https://lh3.googleusercontent.com/d/${match[1]}`;
}


// === 보유 아바타 (다중 이미지 스트립) ===
const AVATAR_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR-XmfO0Kmn1WxK_gbsXHFPNY_XuS6EPciWj-1NWcDbIQdcx2plZxDjUpxAR1qo8X-KtxbJuznRiqd2/pub?gid=1036775616&single=true&output=csv";

document.addEventListener("DOMContentLoaded", () => {
  renderAvatarImagesFromCsv(AVATAR_CSV_URL, "#avatarImages");
});

async function renderAvatarImagesFromCsv(csvUrl, targetSelector){
  const wrap = document.querySelector(targetSelector);
  if (!wrap) return;

  try{
    const res = await fetch(csvUrl, { cache: "no-store" });
    const text = await res.text();

    const rows = parseCsv(text).slice(1);
    wrap.innerHTML = "";

    rows.forEach(row => {
      const [order, imgUrl, isActive] = row;
      if (isActive === "FALSE" || !imgUrl) return;

      const src = convertDriveUrl(imgUrl);

      const img = document.createElement("img");
      img.src = src;
      img.alt = "보유 아바타 이미지";
      img.loading = "lazy";

      wrap.appendChild(img);
    });
  }catch(err){
    console.error("[avatars] load failed:", err);
  }
}



// === 판매작 ===
const SALES_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR-XmfO0Kmn1WxK_gbsXHFPNY_XuS6EPciWj-1NWcDbIQdcx2plZxDjUpxAR1qo8X-KtxbJuznRiqd2/pub?gid=1540907887&single=true&output=csv";

document.addEventListener("DOMContentLoaded", () => {
  renderSalesFromCsv(SALES_CSV_URL, "#salesGrid");
});

async function renderSalesFromCsv(csvUrl, targetSelector){
  const grid = document.querySelector(targetSelector);
  if (!grid) return;

  try{
    const res = await fetch(csvUrl, { cache: "no-store" });
    const text = await res.text();

    const rows = parseCsv(text).slice(1);
    grid.innerHTML = "";

    const items = rows
      .map(row => {
        const [order, title, imgUrl, linkUrl, isActive] = row;
        return { order, title, imgUrl, linkUrl, isActive };
      })
      .filter(item => item.isActive !== "FALSE" && item.imgUrl);

    const section = grid.closest("section");
    if (!items.length) {
      if (section) section.hidden = true;
      sendIframeHeightToParent();
      return;
    }

    if (section) section.hidden = false;

    items.forEach(item => {
      const { title, imgUrl, linkUrl } = item;
      const src = convertDriveUrl(imgUrl);
      const altText = title || "판매작 이미지";

      const li = document.createElement("li");
      li.className = "salesCard";

      li.innerHTML = `
        <button type="button" class="salesCard__imageButton" aria-label="${escapeHtml(altText)} 크게 보기">
          <div class="salesCard__imageWrap">
            <img
              src="${src}"
              alt="${escapeHtml(altText)}"
              class="salesCard__image"
              loading="lazy"
            />
          </div>
        </button>
        ${
          linkUrl
            ? `<a href="${linkUrl}" target="_blank" rel="noopener" class="salesCard__titleLink">${escapeHtml(altText)}</a>`
            : `<div class="salesCard__title">${escapeHtml(altText)}</div>`
        }
      `;

      li.querySelector(".salesCard__imageButton")?.addEventListener("click", () => {
        openImageModal(src, altText);
      });

      grid.appendChild(li);
    });

    sendIframeHeightToParent();
  }catch(err){
    console.error("[sales] load failed:", err);
  }
}

// === 포트폴리오 ===
const PORTFOLIO_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR-XmfO0Kmn1WxK_gbsXHFPNY_XuS6EPciWj-1NWcDbIQdcx2plZxDjUpxAR1qo8X-KtxbJuznRiqd2/pub?gid=201649179&single=true&output=csv";

document.addEventListener("DOMContentLoaded", () => {
  renderPortfolioFromCsv(PORTFOLIO_CSV_URL, "#portfolioGrid");
});

async function renderPortfolioFromCsv(csvUrl, targetSelector){
  const grid = document.querySelector(targetSelector);
  if (!grid) return;

  try{
    const res = await fetch(csvUrl, { cache: "no-store" });
    const text = await res.text();

    const rows = parseCsv(text).slice(1);
    grid.innerHTML = "";

    rows.forEach(row => {
      const [order, imgUrl, title, isActive] = row;

      if (isActive === "FALSE" || !imgUrl) return;

      const src = convertDriveUrl(imgUrl);
      const altText = title || "";

      const li = document.createElement("li");
      li.className = "portfolioItem";
      li.setAttribute("role", "button");
      li.setAttribute("tabindex", "0");
      li.setAttribute("aria-label", `${altText} 크게 보기`);

      li.innerHTML = `
        <img
          src="${src}"
          alt="${escapeHtml(altText)}"
          class="portfolioItem__img"
          loading="lazy"
        />
      `;

      li.addEventListener("click", () => {
        openImageModal(src, altText);
      });

      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openImageModal(src, altText);
        }
      });

      grid.appendChild(li);
    });

    sendIframeHeightToParent();
  }catch(err){
    console.error("[portfolio] load failed:", err);
  }
}

// === 협업 작가 ===
const COLLAB_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR-XmfO0Kmn1WxK_gbsXHFPNY_XuS6EPciWj-1NWcDbIQdcx2plZxDjUpxAR1qo8X-KtxbJuznRiqd2/pub?gid=774580265&single=true&output=csv";

document.addEventListener("DOMContentLoaded", () => {
  renderCollabFromCsv(COLLAB_CSV_URL, "#collabGrid");
  setupIframeAutoResize();
});

async function renderCollabFromCsv(csvUrl, targetSelector) {
  const grid = document.querySelector(targetSelector);
  if (!grid) return;

  try {
    const res = await fetch(csvUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    const rows = parseCsv(text).slice(1);

    grid.innerHTML = "";

    rows
      .map(row => ({
        order: Number(row[0] || 0),
        name: (row[1] || "").trim(),
        desc: (row[2] || "").trim(),
        thumbs: [row[3], row[4], row[5]]
          .map(v => (v || "").trim())
          .filter(Boolean)
          .map(convertDriveUrl),
        link: (row[6] || "").trim()
      }))
      .filter(item => item.name)
      .sort((a, b) => a.order - b.order)
      .forEach(item => {
        const li = document.createElement("li");
        li.className = "collabCard";

        const thumbs = item.thumbs.slice(0, 3);
        const imageInner = thumbs.length
          ? `<div class="collabCard__thumbGrid">
              ${thumbs.map((thumb, index) => `
                <figure class="collabCard__thumb">
                  <img src="${escapeHtml(thumb)}" alt="${escapeHtml(item.name)} 샘플 이미지 ${index + 1}" class="collabCard__image" loading="lazy">
                </figure>
              `).join("")}
            </div>`
          : `<span class="collabCard__placeholder">이미지 준비중입니다.</span>`;

        const imageBox = item.link
          ? `<a class="collabCard__imageLink" href="${escapeHtml(item.link)}" target="_blank" rel="noopener" aria-label="${escapeHtml(item.name)} 페이지로 이동">${imageInner}</a>`
          : `<div class="collabCard__imageLink" role="img" aria-label="${escapeHtml(item.name)} 대표 이미지">${imageInner}</div>`;

        li.innerHTML = `
          <article class="collabCard__box">
            <h3 class="collabCard__name">${escapeHtml(item.name)} 작가님</h3>
            ${imageBox}
            ${item.desc ? `<p class="collabCard__desc">${escapeHtml(item.desc)}</p>` : ""}
          </article>
        `;

        grid.appendChild(li);
      });

    sendIframeHeightToParent();
  } catch (err) {
    console.error("[collab] load failed:", err);
  }
}


document.getElementById("copyForm")?.addEventListener("click", async () => {
  const result = buildFormText();

  try {
    await navigator.clipboard.writeText(result);
    alert("신청 양식이 복사되었습니다!");
  } catch (err) {
    const ta = document.createElement("textarea");
    ta.value = result;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);

    const ok = document.execCommand("copy");
    document.body.removeChild(ta);

    if (ok) alert("신청 양식이 복사되었습니다!");
    else {
      alert("복사가 제한되어 있어요. 아래 텍스트를 직접 복사해주세요.");
      console.warn("[copy] blocked:", err);
    }
  }
});

function buildFormText() {
  const v = (id) => (document.getElementById(id)?.value ?? "").trim();

  const data = {
    "1. 신청 항목": v("f_item"),
    "2. 아바타 BOOTH 링크": v("f_avatar"),
    "3. 의상 BOOTH 링크": v("f_outfit"),
    "4. 헤어 BOOTH 링크": v("f_hair"),
    "5. 색 변경사항": v("f_color"),
    "6. 원하는 느낌 / 참고": v("f_vibe"),
    "7. 플랫폼 / 닉네임": v("f_platform"),
    "8. 사용 프로그램": v("f_program"),
    "9. 기타 문의": v("f_note"),
  };

  let result = "📋 작업 신청 양식\n\n";
  for (const key in data) result += `${key}\n- ${data[key] || "없음"}\n\n`;
  return result;
}

const imageModal = document.getElementById("imageModal");
const imageModalImg = document.getElementById("imageModalImg");
const imageModalCaption = document.getElementById("imageModalCaption");
const imageModalClose = document.getElementById("imageModalClose");

function openImageModal(src, caption = "") {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage(
      {
        source: "syura-css",
        type: "SYURA_OPEN_IMAGE_MODAL",
        src,
        caption
      },
      "*"
    );
    return;
  }

  if (!imageModal || !imageModalImg) return;

  imageModalImg.src = src;
  imageModalImg.alt = caption || "확대 이미지";
  if (imageModalCaption) {
    imageModalCaption.textContent = caption || "";
  }

  imageModal.classList.add("is-open");
  imageModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  if (syuraParentViewport) applyParentViewport(syuraParentViewport);
  sendIframeHeightToParent();
}

function closeImageModal() {
  if (!imageModal || !imageModalImg) return;

  imageModal.classList.remove("is-open");
  imageModal.setAttribute("aria-hidden", "true");
  imageModalImg.src = "";
  imageModalImg.alt = "";
  if (imageModalCaption) {
    imageModalCaption.textContent = "";
  }

  document.body.style.overflow = "";
  sendIframeHeightToParent();
}

imageModalClose?.addEventListener("click", closeImageModal);

imageModal?.addEventListener("click", (e) => {
  if (e.target.matches("[data-close-modal]")) {
    closeImageModal();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && imageModal?.classList.contains("is-open")) {
    closeImageModal();
  }
});

// ===== safe goto scroll =====
(function () {
  function bindGoto() {
    document.querySelectorAll('a[name="goto"]').forEach(a => {
      if (a.__gotoBound) return;
      a.__gotoBound = true;

      a.addEventListener("click", e => {
        e.preventDefault();

        const targetId = a.getAttribute("href");
        if (!targetId) return;

        const target =
          document.getElementById(targetId) ||
          document.querySelector(`[name="${targetId}"]`);

        if (!target) {
          console.warn("[goto] target not found:", targetId);
          return;
        }

        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest"
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", bindGoto);

  window.addEventListener("load", bindGoto);

  setTimeout(bindGoto, 800);
})();

document.getElementById("resetForm")?.addEventListener("click", () => {
  const form = document.querySelector(".applyForm");
  if (!form) return;

  form.reset();

  form.querySelectorAll("input, textarea, select").forEach((el) => {
    if (el.tagName === "SELECT") el.selectedIndex = 0;
    else el.value = "";
  });
});
 

