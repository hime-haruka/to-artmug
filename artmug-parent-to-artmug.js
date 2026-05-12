(function () {
  const IFRAME_ORIGIN = 'https://to-artmug.netlify.app';

  let lastHeight = 0;

  function injectStyle() {
    if (document.getElementById('syura-artmug-style')) return;

    const style = document.createElement('style');
    style.id = 'syura-artmug-style';

    style.textContent = `
html,body{
  overflow-x:hidden!important;
}

#detailViews [name="am-root"]{
  text-align:start!important;
  padding:0!important;
  line-height:normal!important;
}

#detailViews [name="am-root"] *{
  padding:0;
  margin:0;
  box-sizing:border-box;
}

#detailViews [name="stage"]{
  width:100%;
  overflow:visible;
}

#detailViews [name="am-root"] iframe,
[name="am-root"] iframe{
  display:block;
  width:100%!important;
  max-width:1180px;
  min-height:700px;
  height:700px;
  margin:0 auto;
  border:0;
  overflow:hidden;
}

.btn_open_btn,
.btn_open,
.btn_close{
  display:none!important;
}

.syuraParentModal{
  position:fixed;
  inset:0;
  z-index:2147483647;
}

.syuraParentModal__backdrop{
  position:absolute;
  inset:0;
  background:rgba(10,18,34,.58);
}

.syuraParentModal__panel{
  position:absolute;
  left:50%;
  top:50%;
  transform:translate(-50%,-50%);
  width:min(980px,calc(100vw - 28px));
  max-height:calc(100vh - 28px);
  background:#fff;
  border-radius:24px;
  box-shadow:0 30px 90px rgba(0,0,0,.25);
  overflow:hidden;
}

.syuraParentModal__close{
  position:absolute;
  top:10px;
  right:10px;
  z-index:2;
  width:38px;
  height:38px;
  border:0;
  border-radius:999px;
  background:rgba(255,255,255,.9);
  cursor:pointer;
  font-size:18px;
}

.syuraParentModal__frame{
  aspect-ratio:16/9;
  background:#000;
}

.syuraParentModal__frame iframe{
  display:block;
  width:100%;
  height:100%;
  border:0;
}
`;

    document.head.appendChild(style);
  }

  function unlockDetail() {
    const box = document.querySelector('.detailinfo');

    if (!box) return;

    box.classList.remove('showstep1');

    box.style.maxHeight = 'none';
    box.style.overflow = 'visible';

    const content = box.querySelector('.showcontent');

    if (content) {
      content.style.maxHeight = 'none';
      content.style.overflow = 'visible';
    }
  }

  function getIframe() {
    return document.querySelector(
      '#detailViews [name="am-root"] iframe,[name="am-root"] iframe'
    );
  }

  function resizeIframe(height) {
    const iframe = getIframe();

    if (!iframe) return;

    const nextHeight = Math.max(
      700,
      Math.ceil(Number(height) || 0)
    );

    if (Math.abs(nextHeight - lastHeight) < 4) return;

    lastHeight = nextHeight;
    iframe.style.height = nextHeight + 'px';
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
    });
  }

  function neutralize() {
    injectStyle();
    unlockDetail();
    bindMessages();
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
