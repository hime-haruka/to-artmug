(function () {
  const IFRAME_ORIGIN = 'https://hime-haruka.github.io';

  let lastHeight = 0;
  let viewportTimer = null;

  function injectStyle() {
    if (document.getElementById('syura-artmug-parent-style')) return;

    const style = document.createElement('style');
    style.id = 'syura-artmug-parent-style';

    style.textContent = `
html,
body{
  overflow-x:hidden!important;
}

#detailViews [name="am-root"]{
  text-align:start!important;
  padding:0!important;
  margin:0!important;
  line-height:normal!important;
  overflow:visible!important;
}

#detailViews [name="am-root"] *,
[name="am-root"] *{
  box-sizing:border-box;
}

#detailViews [name="stage"],
[name="stage"]{
  width:100%!important;
  overflow:visible!important;
}

#detailViews [name="am-root"] iframe,
[name="am-root"] iframe{
  display:block!important;
  width:100%!important;
  max-width:1180px!important;
  min-height:700px;
  height:700px;
  margin:0 auto!important;
  border:0!important;
  overflow:hidden!important;
}

/* 아트머그 기본 더보기/접기 버튼 숨김 */
.btn_open_btn,
.btn_open,
.btn_close{
  display:none!important;
  visibility:hidden!important;
  pointer-events:none!important;
}

/* 부모 페이지 기준 이미지/영상 모달 */
.syuraParentModal{
  position:fixed!important;
  inset:0!important;
  z-index:2147483647!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  padding:18px!important;
}

.syuraParentModal__backdrop{
  position:absolute!important;
  inset:0!important;
  background:rgba(20,16,12,.54)!important;
}

.syuraParentModal__panel{
  position:relative!important;
  z-index:1!important;
  width:min(980px,calc(100vw - 36px))!important;
  max-height:calc(100vh - 36px)!important;
  background:#fffaf3!important;
  border:1px solid rgba(128,92,56,.22)!important;
  border-radius:22px!important;
  box-shadow:0 28px 90px rgba(48,32,18,.28)!important;
  overflow:hidden!important;
}

.syuraParentModal__close{
  position:absolute!important;
  top:12px!important;
  right:12px!important;
  z-index:2!important;
  width:40px!important;
  height:40px!important;
  border:1px solid rgba(128,92,56,.24)!important;
  border-radius:999px!important;
  background:rgba(255,250,243,.94)!important;
  color:#5b432d!important;
  cursor:pointer!important;
  font-size:19px!important;
  line-height:40px!important;
  text-align:center!important;
}

.syuraParentModal__body{
  width:100%!important;
  max-height:calc(100vh - 36px)!important;
  overflow:auto!important;
}

.syuraParentModal__image{
  display:block!important;
  width:100%!important;
  height:auto!important;
  max-height:calc(100vh - 72px)!important;
  object-fit:contain!important;
  background:#fff!important;
}

.syuraParentModal__frame{
  aspect-ratio:16/9!important;
  width:100%!important;
  background:#000!important;
}

.syuraParentModal__frame iframe{
  display:block!important;
  width:100%!important;
  height:100%!important;
  border:0!important;
}
`;

    document.head.appendChild(style);
  }

  function unlockDetail() {
    const box = document.querySelector('.detailinfo');

    if (!box) return;

    box.classList.remove('showstep1');

    box.style.maxHeight = 'none';
    box.style.height = 'auto';
    box.style.overflow = 'visible';

    const content = box.querySelector('.showcontent');

    if (content) {
      content.style.maxHeight = 'none';
      content.style.height = 'auto';
      content.style.overflow = 'visible';
    }
  }

  function removeMoreButtons(root = document) {
    root
      .querySelectorAll('.btn_open_btn,.btn_open,.btn_close')
      .forEach(el => el.remove());
  }

  function hardBlockMoreButtons() {
    if (window.__syuraArtmugHardBlockClicks) return;

    window.__syuraArtmugHardBlockClicks = true;

    document.addEventListener(
      'click',
      e => {
        const target = e.target && e.target.closest
          ? e.target.closest('.btn_open_btn,.btn_open,.btn_close')
          : null;

        if (!target) return;

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      },
      true
    );
  }

  function getIframe() {
    return document.querySelector(
      '#detailViews [name="am-root"] iframe,[name="am-root"] iframe'
    );
  }

  function sendViewportToIframe() {
    const iframe = getIframe();

    if (!iframe || !iframe.contentWindow) return;

    const rect = iframe.getBoundingClientRect();

    iframe.contentWindow.postMessage(
      {
        source: 'syura-artmug-parent',
        type: 'SYURA_PARENT_VIEWPORT',
        iframeTop: rect.top,
        iframeLeft: rect.left,
        iframeWidth: rect.width,
        iframeHeight: rect.height,
        viewportWidth:
          window.innerWidth ||
          document.documentElement.clientWidth ||
          0,
        viewportHeight:
          window.innerHeight ||
          document.documentElement.clientHeight ||
          0,
        scrollY:
          window.scrollY ||
          window.pageYOffset ||
          0
      },
      IFRAME_ORIGIN
    );
  }

  function queueViewportSend() {
    clearTimeout(viewportTimer);
    viewportTimer = setTimeout(sendViewportToIframe, 30);
  }

  function resizeIframe(height) {
    const iframe = getIframe();

    if (!iframe) return;

    const nextHeight = Math.max(
      700,
      Math.ceil(Number(height) || 0)
    );

    if (Math.abs(nextHeight - lastHeight) < 4) {
      queueViewportSend();
      return;
    }

    lastHeight = nextHeight;
    iframe.style.height = nextHeight + 'px';

    queueViewportSend();
  }

  function scrollParentTo(targetY, navHeight) {
    const iframe = getIframe();

    if (!iframe) return;

    const rect = iframe.getBoundingClientRect();
    const iframePageTop =
      (window.scrollY || window.pageYOffset || 0) + rect.top;

    const y = Math.max(
      0,
      iframePageTop +
        Number(targetY || 0) -
        Number(navHeight || 0) -
        8
    );

    window.scrollTo({
      top: y,
      behavior: 'smooth'
    });

    setTimeout(sendViewportToIframe, 80);
    setTimeout(sendViewportToIframe, 350);
  }

  function escapeHTML(value) {
    return String(value || '').replace(/[&<>"']/g, s => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[s]));
  }

  function closeParentModal() {
    document
      .querySelectorAll('.syuraParentModal')
      .forEach(el => el.remove());

    document.removeEventListener('keydown', onModalKeydown);
  }

  function onModalKeydown(e) {
    if (e.key === 'Escape') closeParentModal();
  }

  function createModal(innerHTML, label) {
    closeParentModal();

    const modal = document.createElement('div');
    modal.className = 'syuraParentModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', label || '이미지 보기');

    modal.innerHTML = `
<div class="syuraParentModal__backdrop" data-syura-close="1"></div>
<div class="syuraParentModal__panel">
  <button
    class="syuraParentModal__close"
    type="button"
    data-syura-close="1"
    aria-label="닫기"
  >×</button>
  ${innerHTML}
</div>
`;

    modal.addEventListener('click', e => {
      if (
        e.target &&
        e.target.dataset &&
        e.target.dataset.syuraClose === '1'
      ) {
        closeParentModal();
      }
    });

    document.addEventListener('keydown', onModalKeydown);
    document.body.appendChild(modal);
  }

  function openImageModal(src, title) {
    if (!src) return;

    createModal(
      `<div class="syuraParentModal__body">
        <img
          class="syuraParentModal__image"
          src="${escapeHTML(src)}"
          alt="${escapeHTML(title || '협업 작가 이미지')}"
        >
      </div>`,
      title || '이미지 보기'
    );
  }

  function openYoutubeModal(id, title) {
    if (!id) return;

    createModal(
      `<div class="syuraParentModal__frame">
        <iframe
          src="https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0"
          title="${escapeHTML(title || 'YouTube video player')}"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>`,
      title || '영상 재생'
    );
  }

  function bindMessages() {
    if (window.__syuraArtmugMessageBind) return;

    window.__syuraArtmugMessageBind = true;

    window.addEventListener('message', e => {
      if (e.origin !== IFRAME_ORIGIN) return;

      const data = e.data || {};

      if (data.source !== 'syura-css') return;

      if (data.type === 'SYURA_IFRAME_HEIGHT') {
        resizeIframe(data.height);
      }

      if (data.type === 'SYURA_IFRAME_READY') {
        setTimeout(sendViewportToIframe, 50);
        setTimeout(sendViewportToIframe, 300);
        setTimeout(sendViewportToIframe, 900);
      }

      if (data.type === 'SYURA_PARENT_SCROLL_TO') {
        scrollParentTo(data.targetY, data.navHeight);
      }

      if (data.type === 'SYURA_OPEN_IMAGE_MODAL') {
        openImageModal(data.src, data.title);
      }

      if (data.type === 'SYURA_OPEN_YOUTUBE_MODAL') {
        openYoutubeModal(data.id, data.title);
      }
    });

    window.addEventListener('scroll', queueViewportSend, { passive: true });
    window.addEventListener('resize', queueViewportSend);
    window.addEventListener('orientationchange', () => {
      setTimeout(sendViewportToIframe, 250);
    });
  }

  function observePage() {
    if (window.__syuraArtmugObserver) return;

    window.__syuraArtmugObserver = new MutationObserver(() => {
      removeMoreButtons();
      unlockDetail();
    });

    window.__syuraArtmugObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  function neutralize() {
    injectStyle();
    removeMoreButtons();
    unlockDetail();
    hardBlockMoreButtons();
    bindMessages();
    observePage();
    queueViewportSend();
  }

  if (document.readyState !== 'loading') {
    neutralize();
  } else {
    document.addEventListener('DOMContentLoaded', neutralize);
  }

  setTimeout(neutralize, 300);
  setTimeout(neutralize, 1000);
  setTimeout(neutralize, 2000);
})();
