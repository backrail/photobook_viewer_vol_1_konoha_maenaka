document.addEventListener("DOMContentLoaded", init);

async function init() {

  // ----------------------------------------------------
  // ① ページ画像の自動ロード
  // ----------------------------------------------------
  async function imageExists(url) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      return res.ok;
    } catch {
      return false;
    }
  }

  const pages = [];
  let index = 1;
  while (true) {
    const url = `pages/${index}.jpg`;
    const exists = await imageExists(url);
    if (!exists) break;
    pages.push(url);
    index++;
  }

  if (pages.length === 0) {
    console.warn("No pages/*.jpg found.");
    return;
  }

  // ----------------------------------------------------
  // ② 画面フィット（90%）
  // ----------------------------------------------------
  function calcBookSize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const baseRatio = 800 / 1200;

    let width = vw;
    let height = vw / baseRatio;

    if (height > vh) {
      height = vh;
      width = vh * baseRatio;
    }

    width *= 0.90;
    height *= 0.90;

    return { width, height };
  }

  const size = calcBookSize();
  const flipBookElement = document.getElementById("flip-book");

  const flip = new St.PageFlip(flipBookElement, {
    width: size.width,
    height: size.height,
    size: "stretch",
    maxShadowOpacity: 0.9,
    showCover: true,
    drawShadow: true,
    mobileScrollSupport: true
  });

  flip.loadFromImages(pages);

  window.addEventListener("resize", () => {
    const newSize = calcBookSize();
    flip.update(newSize.width, newSize.height);
  });


  // ----------------------------------------------------
  // ③ PC: 右クリック → 完全無効（ページめくりさせない）
  // ----------------------------------------------------
  flipBookElement.addEventListener("mousedown", (e) => {
    if (e.button === 2) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, true);

  flipBookElement.addEventListener("click", (e) => {
    if (e.button === 2) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, true);

  flipBookElement.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  }, true);


  // ----------------------------------------------------
  // ④ 拡大ビュー（オーバーレイ）
  // ----------------------------------------------------
  if (!document.getElementById("zoom-overlay")) {
    const overlay = document.createElement("div");
    overlay.id = "zoom-overlay";
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.92);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    `;

    const img = document.createElement("img");
    img.id = "zoom-img";
    img.style.cssText = `
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
      margin: auto;
    `;

    const closeBtn = document.createElement("div");
    closeBtn.id = "zoom-close";
    closeBtn.innerText = "✕";
    closeBtn.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      color: white;
      font-size: 32px;
      cursor: pointer;
    `;

    overlay.appendChild(img);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);

    closeBtn.onclick = () => overlay.style.display = "none";
    overlay.onclick = (e) => {
      if (e.target === overlay) overlay.style.display = "none";
    };
  }


  // ----------------------------------------------------
  // ⑤ 押した位置からページ判定
  // ----------------------------------------------------
  function getClickedPageIndex(event) {
    const rect = flipBookElement.getBoundingClientRect();
    const clientX =
      (event.touches?.[0]?.clientX ?? event.clientX) - rect.left;

    const mid = rect.width / 2;
    const left = flip.getCurrentPageIndex();
    const right = left + 1;

    return clientX < mid ? left : right;
  }


  // ----------------------------------------------------
  // ⑥ 長押しで即拡大（ボタンなし）
  // ----------------------------------------------------
  let isLongPress = false;
  let pressTimer = null;

  flipBookElement.addEventListener("touchstart", (e) => {
    isLongPress = false;

    pressTimer = setTimeout(() => {
      isLongPress = true;

      const flipIndex = getClickedPageIndex(e);
      let realIndex = flipIndex;
      if (realIndex < 0) realIndex = -1;

      document.getElementById("zoom-img").src = pages[realIndex];
      document.getElementById("zoom-overlay").style.display = "flex";

    }, 500);
  });

  flipBookElement.addEventListener("touchend", (e) => {
    clearTimeout(pressTimer);

    if (isLongPress) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return;
    }
  });

  flipBookElement.addEventListener("touchmove", (e) => {
    if (isLongPress) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, true);

}
