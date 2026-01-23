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

function convertDriveUrl(url){
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return url;
  return `https://lh3.googleusercontent.com/d/${match[1]}`;
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

    rows.forEach(row => {
      const [order, title, imgUrl, linkUrl, isActive] = row;

      if (isActive === "FALSE" || !imgUrl) return;

      const src = convertDriveUrl(imgUrl);

      const li = document.createElement("li");
      li.className = "salesCard";

      const cardInner = `
        <div class="salesCard__imageWrap">
          <img
            src="${src}"
            alt="${escapeHtml(title)}"
            class="salesCard__image"
            loading="lazy"
          />
        </div>
        <div class="salesCard__title">
          ${escapeHtml(title)}
        </div>
      `;

      if (linkUrl){
        li.innerHTML = `<a href="${linkUrl}" target="_blank" rel="noopener">${cardInner}</a>`;
        li.querySelector("a").style.textDecoration = "none";
        li.querySelector("a").style.color = "inherit";
        li.style.cursor = "pointer";
      }else{
        li.innerHTML = cardInner;
      }

      grid.appendChild(li);
    });
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

    const rows = parseCsv(text).slice(1); // header 제거
    grid.innerHTML = "";

    rows.forEach(row => {
      const [order, imgUrl, title, isActive] = row;

      if (isActive === "FALSE" || !imgUrl) return;

      const src = convertDriveUrl(imgUrl);

      const li = document.createElement("li");
      li.className = "portfolioItem";
      li.innerHTML = `
        <img
          src="${src}"
          alt="${escapeHtml(title || "포트폴리오 이미지")}"
          class="portfolioItem__img"
          loading="lazy"
        />
      `;

      grid.appendChild(li);
    });
  }catch(err){
    console.error("[portfolio] load failed:", err);
  }
}

document.getElementById("copyForm")?.addEventListener("click", () => {
  const data = {
    "1. 신청 항목": f_item.value,
    "2. 아바타 BOOTH 링크": f_avatar.value,
    "3. 의상 BOOTH 링크": f_outfit.value,
    "4. 헤어 BOOTH 링크": f_hair.value,
    "5. 색 변경사항": f_color.value,
    "6. 원하는 느낌 / 참고": f_vibe.value,
    "7. 플랫폼 / 닉네임": f_platform.value,
    "8. 사용 프로그램": f_program.value,
    "9. 기타 문의": f_note.value,
  };

  let result = "📋 작업 신청 양식\n\n";
  for (const key in data) {
    result += `${key}\n- ${data[key] || "없음"}\n\n`;
  }

  navigator.clipboard.writeText(result).then(() => {
    alert("신청 양식이 복사되었습니다!");
  });
});




// ===== Smooth Anchor Scroll (for WebView / blocked hash navigation) =====
document.addEventListener("DOMContentLoaded", () => {
  try {
    document.documentElement.style.scrollBehavior = "smooth";
  } catch (_) {}

  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;

    const hash = a.getAttribute("href");
    if (!hash || hash === "#") return;

    const target = document.querySelector(hash);
    if (!target) return;

    e.preventDefault();

    smoothScrollTo(target, {
      offset: getFixedHeaderOffset(),
      duration: 520,
    });
  });
});

function getFixedHeaderOffset() {
  const header = document.querySelector(".siteHeader.is-fixed, header.is-fixed, .header.is-fixed");
  if (!header) return 0;
  const h = header.getBoundingClientRect().height || 0;
  return Math.round(h + 8);
}

/*
 * 스무스 스크롤
 */
function smoothScrollTo(element, options = {}) {
  const offset = options.offset ?? 0;
  const duration = options.duration ?? 500;

  const startY = window.pageYOffset || document.documentElement.scrollTop || 0;
  const rect = element.getBoundingClientRect();
  const targetY = startY + rect.top - offset;

  const startTime = performance.now();

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  function step(now) {
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / duration);
    const eased = easeOutCubic(t);
    const y = startY + (targetY - startY) * eased;
    window.scrollTo(0, y);
    if (t < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// ===== iFrame height reporter =====
(function () {
  function getDocHeight() {
    const body = document.body;
    const html = document.documentElement;

    return Math.max(
      body.scrollHeight, body.offsetHeight,
      html.clientHeight, html.scrollHeight, html.offsetHeight
    );
  }

  function postHeight() {
    const height = getDocHeight();
    window.parent.postMessage(
      { type: "AM_IFRAME_HEIGHT", height },
      "*"
    );
  }

  postHeight();
  window.addEventListener("load", postHeight);

  const ro = new ResizeObserver(() => postHeight());
  ro.observe(document.documentElement);

  document.addEventListener("load", postHeight, true);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(postHeight).catch(() => {});
  }
})();
