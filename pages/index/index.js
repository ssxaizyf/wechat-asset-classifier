const { ALIAS_MAPPINGS, EXTRA_ASSETS } = require("../../data/aliases");
const { findMatch } = require("../../data/query");
const { requestMatch, requestFloatingAssets } = require("../../utils/api");
const config = require("../../utils/config");

const FALLBACK_ASSETS = [
  "消防水泵",
  "数据采集终端PAD",
  "防弹衣",
  "警棍",
  "多端融合通讯终端",
  "吸粪车",
  "身份证核查仪",
  "宽幅足迹勘查灯",
  "下肢功率车",
  "电子血压计",
  "除颤监护仪",
  "消防头盔",
  "警用盾牌",
  "红外夜视仪",
  "无人机图传终端",
  "应急照明灯",
  "生命探测仪",
  "便携发电机"
];

const mergedPool = [
  ...(Array.isArray(ALIAS_MAPPINGS) ? ALIAS_MAPPINGS.map((i) => i.asset).filter(Boolean) : []),
  ...(Array.isArray(EXTRA_ASSETS) ? EXTRA_ASSETS.filter(Boolean) : []),
  ...FALLBACK_ASSETS
];

const ASSET_POOL = [...new Set(mergedPool)];
const FLOATING_COUNT = 18;
const AUTO_REFRESH_MS = 2000;
const TICK_MS = 70;
const SWAP_FADE_OUT_MS = 220;
const SWAP_FADE_IN_MS = 260;
const SAFE_PADDING = 28;

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function estimateBubble(name) {
  const len = [...(name || "")].length;
  const w = Math.max(72, 34 + len * 14);
  const h = 42;
  return { w, h, r: Math.max(w, h) / 2 };
}

function pickRandomBatch(size) {
  const list = [...ASSET_POOL];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list.slice(0, size).map((name) => ({ name }));
}

function pickNextName(exists) {
  const list = ASSET_POOL.filter((n) => n && !exists.has(n));
  if (list.length === 0) return ASSET_POOL[Math.floor(Math.random() * ASSET_POOL.length)] || "";
  return list[Math.floor(Math.random() * list.length)];
}

function toRenderNodes(nodes) {
  return nodes.map((n) => ({
    id: n.id,
    name: n.name,
    style: `left:${n.x}px;top:${n.y}px;opacity:${n.opacity ?? 1};transform:scale(${n.scale ?? 1});`
  }));
}

function createNode(id, name, bounds, existingNodes) {
  const size = estimateBubble(name);
  const minX = Math.min(SAFE_PADDING, Math.max(8, bounds.w - size.w - 8));
  const minY = Math.min(SAFE_PADDING, Math.max(8, bounds.h - size.h - 8));
  const maxX = Math.max(minX, bounds.w - size.w - SAFE_PADDING);
  const maxY = Math.max(minY, bounds.h - size.h - SAFE_PADDING);

  let x = rand(minX, maxX);
  let y = rand(minY, maxY);

  for (let t = 0; t < 20; t += 1) {
    let overlap = false;
    for (const other of existingNodes) {
      const dx = x + size.w / 2 - (other.x + other.w / 2);
      const dy = y + size.h / 2 - (other.y + other.h / 2);
      const minDist = size.r * 0.78 + other.r * 0.78;
      if (dx * dx + dy * dy < minDist * minDist) {
        overlap = true;
        break;
      }
    }
    if (!overlap) break;
    x = rand(minX, maxX);
    y = rand(minY, maxY);
  }

  const cx = x + size.w / 2;
  const cy = y + size.h / 2;
  const centerX = bounds.w / 2;
  const centerY = bounds.h / 2;
  const dx = centerX - cx;
  const dy = centerY - cy;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const towardCenterSpeed = rand(0.22, 0.38);
  const jitterX = rand(-0.08, 0.08);
  const jitterY = rand(-0.08, 0.08);

  return {
    id,
    name,
    w: size.w,
    h: size.h,
    r: size.r,
    x,
    y,
    opacity: 1,
    scale: 1,
    vx: (dx / len) * towardCenterSpeed + jitterX,
    vy: (dy / len) * towardCenterSpeed + jitterY
  };
}

function buildNodes(items, bounds) {
  const nodes = [];
  items.forEach((item, idx) => {
    nodes.push(createNode(idx + 1, item.name, bounds, nodes));
  });
  return nodes;
}

function updatePhysics(nodes, bounds) {
  for (const n of nodes) {
    n.x += n.vx;
    n.y += n.vy;

    if (n.x <= 0) {
      n.x = 0;
      n.vx = Math.abs(n.vx);
    }
    if (n.x + n.w >= bounds.w) {
      n.x = bounds.w - n.w;
      n.vx = -Math.abs(n.vx);
    }
    if (n.y <= 0) {
      n.y = 0;
      n.vy = Math.abs(n.vy);
    }
    if (n.y + n.h >= bounds.h) {
      n.y = bounds.h - n.h;
      n.vy = -Math.abs(n.vy);
    }
  }

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      const ax = a.x + a.w / 2;
      const ay = a.y + a.h / 2;
      const bx = b.x + b.w / 2;
      const by = b.y + b.h / 2;

      let dx = bx - ax;
      let dy = by - ay;
      let dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = a.r * 0.78 + b.r * 0.78;

      if (dist < minDist) {
        if (dist < 0.001) {
          dx = rand(-1, 1);
          dy = rand(-1, 1);
          dist = Math.sqrt(dx * dx + dy * dy) || 1;
        }

        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDist - dist;

        a.x -= (overlap / 2) * nx;
        a.y -= (overlap / 2) * ny;
        b.x += (overlap / 2) * nx;
        b.y += (overlap / 2) * ny;

        const avn = a.vx * nx + a.vy * ny;
        const bvn = b.vx * nx + b.vy * ny;
        const impulse = (bvn - avn) * 0.25;

        a.vx += impulse * nx;
        a.vy += impulse * ny;
        b.vx -= impulse * nx;
        b.vy -= impulse * ny;
      }
    }
  }
}

function applyLocalMatch(page, assetName, errMsg) {
  const result = findMatch(assetName);
  page.setData({
    assetName,
    hasQuery: true,
    showFloatingArea: false,
    matchStatus: result.status,
    matchResult: result.primary,
    candidateResults: result.candidates,
    isLoading: false,
    lastSource: "local",
    requestError: errMsg || "网络异常，已使用本地匹配结果"
  });
}

function applyRemoteMatch(page, assetName) {
  page.setData({
    hasQuery: true,
    showFloatingArea: false,
    isLoading: true,
    requestError: ""
  });

  return requestMatch(assetName)
    .then((result) => {
      page.setData({
        assetName,
        matchStatus: result.status || "none",
        matchResult: result.primary || null,
        candidateResults: result.candidates || [],
        isLoading: false,
        lastSource: "remote",
        requestError: ""
      });
    })
    .catch((err) => {
      const errMsg = (err && err.errMsg) || (err && err.message) || "网络异常";
      console.error("[asset-page] remote match failed", { assetName, err });
      applyLocalMatch(page, assetName, `网络异常（${errMsg}），已使用本地匹配结果`);
    });
}

Page({
  data: {
    assetName: "",
    hasQuery: false,
    showFloatingArea: true,
    matchStatus: "empty",
    matchResult: null,
    candidateResults: [],
    floatingAssets: pickRandomBatch(FLOATING_COUNT),
    floatingNodes: [],
    isLoading: false,
    requestError: "",
    lastSource: ""
  },

  onLoad() {
    console.log("[asset-debug] config", {
      baseURL: config.baseURL,
      useRemoteFloatingAssets: config.useRemoteFloatingAssets,
      timeout: config.timeout
    });
    wx.request({
      url: `${config.baseURL}/health`,
      method: "GET",
      timeout: config.timeout,
      success: (res) => console.log("[asset-debug] health ok", res.statusCode, res.data),
      fail: (err) => console.error("[asset-debug] health fail", err)
    });
    this.floatingBounds = { w: 300, h: 260 };
    this.prepareFloatingAssets(FLOATING_COUNT);
  },

  onReady() {
    this.measureFloatingCanvas(() => {
      this.startFloatingMotion();
      this.startFloatingAutoRefresh();
    });
  },

  onShow() {
    if (this.data.showFloatingArea) {
      this.startFloatingMotion();
      this.startFloatingAutoRefresh();
    }
  },

  onHide() {
    this.stopFloatingMotion();
    this.stopFloatingAutoRefresh();
  },

  onUnload() {
    this.stopFloatingMotion();
    this.stopFloatingAutoRefresh();
  },

  measureFloatingCanvas(done) {
    const query = wx.createSelectorQuery().in(this);
    query.select(".float-canvas").boundingClientRect((rect) => {
      if (rect && rect.width && rect.height) {
        this.floatingBounds = { w: rect.width, h: rect.height };
        if (this._latestFloatingItems && this._latestFloatingItems.length > 0) {
          this.rebuildFloatingNodes(this._latestFloatingItems);
        }
      }
      if (typeof done === "function") done();
    }).exec();
  },

  prepareFloatingAssets(size) {
    const fallback = pickRandomBatch(size);
    if (!config.useRemoteFloatingAssets) {
      this._latestFloatingItems = fallback;
      this.rebuildFloatingNodes(fallback);
      return;
    }

    requestFloatingAssets(size)
      .then((res) => {
        const items = Array.isArray(res && res.items) ? res.items.filter((i) => i && i.name) : [];
        const picked = items.length > 0 ? items : fallback;
        this._latestFloatingItems = picked;
        this.rebuildFloatingNodes(picked);
      })
      .catch(() => {
        this._latestFloatingItems = fallback;
        this.rebuildFloatingNodes(fallback);
      });
  },

  rebuildFloatingNodes(items) {
    const list = Array.isArray(items) && items.length > 0 ? items : pickRandomBatch(FLOATING_COUNT);
    const nodes = buildNodes(list, this.floatingBounds || { w: 300, h: 260 });
    this.floatingNodes = nodes;
    this.setData({
      floatingAssets: list,
      floatingNodes: toRenderNodes(nodes)
    });
  },

  startFloatingMotion() {
    this.stopFloatingMotion();
    this.motionTimer = setInterval(() => {
      if (!this.data.showFloatingArea || !this.floatingNodes || this.floatingNodes.length === 0) return;
      updatePhysics(this.floatingNodes, this.floatingBounds || { w: 300, h: 260 });
      this.setData({ floatingNodes: toRenderNodes(this.floatingNodes) });
    }, TICK_MS);
  },

  stopFloatingMotion() {
    if (this.motionTimer) {
      clearInterval(this.motionTimer);
      this.motionTimer = null;
    }
  },

  refreshOneFloatingAsset() {
    if (!this.floatingNodes || this.floatingNodes.length === 0) return;
    const idx = Math.floor(Math.random() * this.floatingNodes.length);
    const exists = new Set(this.floatingNodes.map((i) => i.name).filter(Boolean));
    const nextName = pickNextName(exists);
    if (!nextName) return;
    const current = this.floatingNodes[idx];
    if (!current) return;

    // Soft transition: gentle fade out -> replace -> gentle fade in.
    current.opacity = 0.5;
    current.scale = 0.96;
    this.setData({ floatingNodes: toRenderNodes(this.floatingNodes) });

    setTimeout(() => {
      const replaced = createNode(
        current.id,
        nextName,
        this.floatingBounds || { w: 300, h: 260 },
        this.floatingNodes.filter((_, i) => i !== idx)
      );
      replaced.opacity = 0.52;
      replaced.scale = 0.96;
      this.floatingNodes[idx] = replaced;
      this.setData({ floatingNodes: toRenderNodes(this.floatingNodes) });

      setTimeout(() => {
        if (!this.floatingNodes[idx]) return;
        this.floatingNodes[idx].opacity = 1;
        this.floatingNodes[idx].scale = 1;
        this.setData({ floatingNodes: toRenderNodes(this.floatingNodes) });
      }, SWAP_FADE_IN_MS);
    }, SWAP_FADE_OUT_MS);
  },

  startFloatingAutoRefresh() {
    this.stopFloatingAutoRefresh();
    this.floatingTimer = setInterval(() => {
      if (!this.data.showFloatingArea) return;
      this.refreshOneFloatingAsset();
    }, AUTO_REFRESH_MS);
  },

  stopFloatingAutoRefresh() {
    if (this.floatingTimer) {
      clearInterval(this.floatingTimer);
      this.floatingTimer = null;
    }
  },

  onInput(e) {
    const assetName = e.detail.value;
    const trimmedName = (assetName || "").trim();
    if (this.inputTimer) clearTimeout(this.inputTimer);
    if (!trimmedName) {
      this.setData({
        assetName: "",
        hasQuery: false,
        showFloatingArea: true,
        matchStatus: "empty",
        matchResult: null,
        candidateResults: [],
        isLoading: false,
        requestError: "",
        lastSource: ""
      });
      this.startFloatingMotion();
      this.startFloatingAutoRefresh();
      return;
    }
    this.stopFloatingMotion();
    this.stopFloatingAutoRefresh();
    this.inputTimer = setTimeout(() => {
      applyRemoteMatch(this, trimmedName);
    }, 220);
  },

  onTapFloatingAsset(e) {
    const assetName = e.currentTarget.dataset.name || "";
    if (!assetName) return;
    this.stopFloatingMotion();
    this.stopFloatingAutoRefresh();
    this.setData({ showFloatingArea: false });
    applyRemoteMatch(this, assetName);
  },

  onTapCandidate(e) {
    const idx = Number(e.currentTarget.dataset.idx);
    if (!Number.isFinite(idx)) return;
    const picked = this.data.candidateResults[idx];
    if (!picked) return;
    this.setData({
      matchStatus: "single",
      matchResult: picked
    });
  },

  onRetry() {
    const assetName = this.data.assetName;
    if (!assetName) return;
    applyRemoteMatch(this, assetName);
  }
});
