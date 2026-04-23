this.DajiCS = (function () {
  'use strict'
  class ge {
    constructor() {
      this.listeners = {}
    }
    on(t, n) {
      let r = this.listeners[t]
      return (r || ((r = new Set()), (this.listeners[t] = r)), r.add(n), () => this.off(t, n))
    }
    once(t, n) {
      const r = (o) => {
          ;(i(), n(o))
        },
        i = this.on(t, r)
      return i
    }
    off(t, n) {
      var r
      ;(r = this.listeners[t]) == null || r.delete(n)
    }
    emit(t, n) {
      const r = this.listeners[t]
      if (r)
        for (const i of [...r])
          try {
            i(n)
          } catch (o) {
            console.error('[DajiCS] listener error on event', t, o)
          }
    }
    clear() {
      this.listeners = {}
    }
    count(t) {
      var n
      return ((n = this.listeners[t]) == null ? void 0 : n.size) ?? 0
    }
  }
  const S = new ge()
  function P(e, t) {
    return S.on(e, t)
  }
  function pe(e, t) {
    return S.once(e, t)
  }
  function me(e, t) {
    S.off(e, t)
  }
  function a(e, t) {
    S.emit(e, t)
  }
  function he() {
    S.clear()
  }
  const O = new Set()
  function q(e) {
    return (O.add(e), () => O.delete(e))
  }
  function be() {
    for (const e of [...O])
      try {
        e()
      } catch (t) {
        console.error('[DajiCS] reset handler error', t)
      }
  }
  const H = 'daji-cs-styles',
    J = 2147483e3,
    we = `
.daji-cs-launcher {
  position: fixed;
  z-index: ${J};
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--daji-cs-primary, #FA3E3E);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  transition: transform .18s ease, box-shadow .18s ease;
  user-select: none;
  border: none;
  outline: none;
}
.daji-cs-launcher:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(0,0,0,.28); }
.daji-cs-launcher:active { transform: translateY(0); }
.daji-cs-launcher[data-position="bottom-right"] { right: 24px; bottom: 24px; }
.daji-cs-launcher[data-position="bottom-left"] { left: 24px; bottom: 24px; }

.daji-cs-launcher-icon {
  width: 26px; height: 26px; fill: #fff;
}

.daji-cs-badge {
  position: absolute;
  top: -4px; right: -4px;
  min-width: 18px; height: 18px; padding: 0 5px;
  border-radius: 9px;
  background: #fff;
  color: var(--daji-cs-primary, #FA3E3E);
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,.2);
  display: none;
}
.daji-cs-badge[data-visible="true"] { display: inline-block; }

.daji-cs-widget {
  position: fixed;
  z-index: ${J + 1};
  background: #fff;
  box-shadow: 0 12px 40px rgba(0,0,0,.22);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transform: translateY(16px) scale(.98);
  opacity: 0;
  transition: transform .22s ease, opacity .22s ease;
  pointer-events: none;
}
.daji-cs-widget[data-open="true"] {
  transform: translateY(0) scale(1);
  opacity: 1;
  pointer-events: auto;
}
.daji-cs-widget[data-position="bottom-right"] { right: 24px; bottom: 96px; width: 400px; height: 620px; }
.daji-cs-widget[data-position="bottom-left"] { left: 24px; bottom: 96px; width: 400px; height: 620px; }

.daji-cs-widget-head {
  height: 44px;
  padding: 0 12px 0 16px;
  background: var(--daji-cs-primary, #FA3E3E);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 500;
}
.daji-cs-widget-actions { display: flex; gap: 4px; }
.daji-cs-widget-btn {
  width: 28px; height: 28px; border-radius: 4px;
  background: transparent; color: #fff;
  border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.daji-cs-widget-btn:hover { background: rgba(255,255,255,.16); }
.daji-cs-widget-btn svg { width: 16px; height: 16px; fill: currentColor; }

.daji-cs-widget iframe {
  flex: 1;
  width: 100%;
  border: 0;
  background: #fff;
}

.daji-cs-widget-end-banner {
  position: absolute;
  top: 44px;
  left: 0;
  right: 0;
  padding: 8px 16px;
  background: rgba(15, 23, 42, 0.92);
  color: #fff;
  font-size: 12px;
  text-align: center;
  opacity: 0;
  transform: translateY(-6px);
  transition: opacity .18s ease, transform .18s ease;
  pointer-events: none;
  z-index: 2;
}
.daji-cs-widget-end-banner[data-visible="true"] {
  opacity: 1;
  transform: translateY(0);
}

@media (max-width: 640px) {
  .daji-cs-widget[data-position],
  .daji-cs-widget {
    right: 0 !important;
    left: 0 !important;
    bottom: 0 !important;
    top: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    border-radius: 0;
  }
}
`
  let C = null,
    s = null,
    g = null,
    d = null,
    b = null,
    I = !1
  const w = { position: 'bottom-right', primary: '#FA3E3E', title: '在线客服' }
  function V() {
    typeof document > 'u' ||
      C ||
      document.getElementById(H) ||
      ((C = document.createElement('style')), (C.id = H), (C.textContent = we), document.head.appendChild(C))
  }
  function Y(e) {
    e && ((w.primary = e), document.documentElement.style.setProperty('--daji-cs-primary', e))
  }
  function ye() {
    var t, n
    if (s) return s
    ;((s = document.createElement('div')),
      (s.className = 'daji-cs-widget'),
      s.setAttribute('data-position', w.position),
      s.setAttribute('data-open', 'false'),
      s.setAttribute('role', 'dialog'),
      s.setAttribute('aria-label', w.title))
    const e = document.createElement('div')
    return (
      (e.className = 'daji-cs-widget-head'),
      (e.innerHTML = `
    <span class="daji-cs-widget-title"></span>
    <div class="daji-cs-widget-actions">
      <button class="daji-cs-widget-btn" data-action="minimize" title="最小化" aria-label="最小化">
        <svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="2" rx="1"/></svg>
      </button>
      <button class="daji-cs-widget-btn" data-action="close" title="关闭" aria-label="关闭">
        <svg viewBox="0 0 24 24"><path d="M18.3 5.71 12 12.01l-6.3-6.3-1.41 1.4L10.58 13.4 4.3 19.7l1.41 1.4L12 14.83l6.3 6.28 1.41-1.4-6.29-6.3 6.29-6.29z"/></svg>
      </button>
    </div>`),
      (e.querySelector('.daji-cs-widget-title').textContent = w.title),
      (t = e.querySelector('[data-action="close"]')) == null || t.addEventListener('click', () => y()),
      (n = e.querySelector('[data-action="minimize"]')) == null || n.addEventListener('click', () => y('minimize')),
      (g = document.createElement('iframe')),
      g.setAttribute('title', w.title),
      g.setAttribute('allow', 'microphone; camera; autoplay; clipboard-read; clipboard-write'),
      g.setAttribute('referrerpolicy', 'origin'),
      s.appendChild(e),
      s.appendChild(g),
      document.body.appendChild(s),
      s
    )
  }
  function F(e, t) {
    if (typeof document > 'u') return
    ;(V(),
      t != null && t.position && (w.position = t.position),
      t != null && t.title && (w.title = t.title),
      Y(t == null ? void 0 : t.primary))
    const n = ye()
    ;(n.setAttribute('data-position', w.position),
      g && g.src !== e && (g.src = e),
      requestAnimationFrame(() => {
        n.setAttribute('data-open', 'true')
      }),
      I || ((I = !0), a('widget:open', { url: e })))
  }
  function y(e = 'user') {
    !s || !I || (s.setAttribute('data-open', 'false'), (I = !1), Z(), a('widget:close', { reason: e }))
  }
  function xe() {
    ;(y('programmatic'), s && s.remove(), (s = null), (g = null), (d = null))
  }
  function G() {
    return g
  }
  function Q() {
    return I
  }
  function X(e = '会话已结束', t) {
    s &&
      (b && (clearTimeout(b), (b = null)),
      d || ((d = document.createElement('div')), (d.className = 'daji-cs-widget-end-banner'), s.appendChild(d)),
      (d.textContent = e),
      requestAnimationFrame(() => {
        d == null || d.setAttribute('data-visible', 'true')
      }),
      t &&
        t > 0 &&
        (b = setTimeout(() => {
          ;(d == null || d.setAttribute('data-visible', 'false'), (b = null))
        }, t)))
  }
  function Z() {
    ;(b && (clearTimeout(b), (b = null)), d == null || d.setAttribute('data-visible', 'false'))
  }
  const D = 'daji-cs',
    L = '0.1.0'
  let E = null
  const x = new Set()
  let A = null,
    T = { autoClose: !0, closeDelay: 3e3 },
    j = null
  function K(e) {
    try {
      return new URL(e).origin
    } catch {
      return null
    }
  }
  function je(e) {
    if (!e || typeof e != 'object') return !1
    const t = e
    return t.source === D && typeof t.type == 'string'
  }
  function Ee(e) {
    var t, n
    switch (e.type) {
      case 'daji:ready':
        break
      case 'daji:unread': {
        const r = Number(((t = e.payload) == null ? void 0 : t.count) ?? 0)
        a('unread:change', { count: r })
        break
      }
      case 'daji:message': {
        const r = e.payload
        a('message:incoming', {
          from: String((r == null ? void 0 : r.from) ?? ''),
          preview: r == null ? void 0 : r.preview,
        })
        break
      }
      case 'daji:conversation-end': {
        const r = (n = e.payload) == null ? void 0 : n.reason
        ;(a('conversation:end', { reason: r }), T.autoClose && Se(r))
        break
      }
      case 'daji:close':
        y('programmatic')
        break
    }
  }
  function ve(e, t, n) {
    if (typeof window > 'u') return
    ;(ee(),
      (T = {
        autoClose: (n == null ? void 0 : n.autoClose) ?? !0,
        closeDelay: Math.max(0, (n == null ? void 0 : n.closeDelay) ?? 3e3),
      }))
    const r = K(e)
    r && x.add(r)
    for (const i of t ?? []) {
      const o = K(i) ?? i
      o && x.add(o)
    }
    ;((E = (i) => {
      if (x.has(i.origin) && je(i.data))
        try {
          Ee(i.data)
        } catch (o) {
          a('error', { source: 'bridge:dispatch', error: o })
        }
    }),
      window.addEventListener('message', E),
      (A = q(() => ee())))
  }
  function ee() {
    ;(E && typeof window < 'u' && window.removeEventListener('message', E),
      (E = null),
      x.clear(),
      j && (clearTimeout(j), (j = null)),
      A == null || A(),
      (A = null))
  }
  function Se(e) {
    if (
      (j && clearTimeout(j),
      X(e === 'user' ? '您已结束本次会话' : '会话已结束，感谢您的咨询', T.closeDelay),
      T.closeDelay === 0)
    ) {
      y('programmatic')
      return
    }
    j = setTimeout(() => {
      ;((j = null), y('programmatic'))
    }, T.closeDelay)
  }
  function Ce() {
    return E !== null
  }
  function Ie() {
    return [...x]
  }
  function te(e, t, n) {
    const r = G()
    if (!(r != null && r.contentWindow)) return !1
    const i = n ?? [...x][0] ?? '*',
      o = { source: D, version: L, type: e, payload: t ?? null }
    return (r.contentWindow.postMessage(o, i), !0)
  }
  function Ae(e, t, n, r) {
    if (!e || e.closed) return !1
    const i = r ?? [...x][0] ?? '*',
      o = { source: D, version: L, type: t, payload: n ?? null }
    try {
      return (e.postMessage(o, i), !0)
    } catch {
      return !1
    }
  }
  class ne extends Error {
    constructor(t, n, r) {
      ;(super(`HTTP ${t} ${n}`),
        (this.status = t),
        (this.statusText = n),
        (this.response = r),
        (this.name = 'HttpError'))
    }
  }
  class N extends Error {
    constructor(t) {
      ;(super(`Request timeout after ${t}ms`), (this.timeoutMs = t), (this.name = 'TimeoutError'))
    }
  }
  function Te(e, t) {
    if (e instanceof N) return !0
    if (e instanceof ne) {
      const n = e.status
      return n >= 500 || n === 408 || n === 429
    }
    return e instanceof DOMException && e.name === 'AbortError' ? !1 : e instanceof TypeError
  }
  function ke(e) {
    return new Promise((t) => setTimeout(t, e))
  }
  function _e(e, t) {
    if (e) {
      if (e.aborted) {
        t.abort(e.reason)
        return
      }
      e.addEventListener('abort', () => t.abort(e.reason), { once: !0 })
    }
  }
  async function De(e, t = {}) {
    const {
      timeout: n = 8e3,
      maxRetries: r = 2,
      backoffBase: i = 300,
      shouldRetry: o = Te,
      signal: h,
      debug: v = !1,
      ...k
    } = t
    let c = 0,
      f
    for (; c <= r; ) {
      const _ = new AbortController()
      _e(h, _)
      const fe = setTimeout(() => _.abort(new N(n)), n)
      try {
        const m = await fetch(e, { ...k, signal: _.signal })
        if ((clearTimeout(fe), !m.ok)) throw new ne(m.status, m.statusText, m)
        return m
      } catch (m) {
        if ((clearTimeout(fe), h != null && h.aborted)) throw m
        if (
          (m instanceof DOMException && m.name === 'AbortError' && _.signal.reason instanceof N
            ? (f = _.signal.reason)
            : (f = m),
          v && console.warn(`[DajiCS][fetch] attempt ${c + 1} failed:`, f),
          c === r || !o(f, c + 1))
        )
          break
        const Ke = i * Math.pow(2, c)
        ;(await ke(Ke), c++)
      }
    }
    throw f
  }
  const Ue = 6e3,
    Re = 2
  function We(e, t) {
    const n = String(e.userId ?? 'anon'),
      r = String(e.supplierId ?? ''),
      i = String(t.spuId ?? ''),
      o = Math.floor(Date.now() / 3e4)
    return `cs_${n}_${r}_${i}_${o}`
  }
  async function Me(e, t, n, r = !1) {
    const i = We(t, n)
    a('presend:start', { clientMsgId: i, card: n, opts: t })
    const o = {
        clientMsgId: i,
        sendUserId: String(t.userId ?? ''),
        sendUserNickname: String(t.userName ?? ''),
        targetUserId: String(t.supplierId ?? ''),
        objectName: 'DAJI:ProductCard',
        content: JSON.stringify({
          customType: 'product',
          data: {
            title: n.title,
            imgUrl: n.imgUrl,
            spuId: n.spuId ?? '',
            intr: n.intr ?? '',
            notes: n.notes ?? '',
            jumpUrl: n.jumpUrl ?? '',
          },
        }),
        chatType: 1,
        messageType: 100,
        from: 'sdk',
      },
      h = e.replace(/\/$/, '') + '/sendRyMessage',
      v = { 'Content-Type': 'application/json' }
    t.token && (v.Authorization = String(t.token))
    try {
      const c = await (
          await De(h, {
            method: 'POST',
            headers: v,
            body: JSON.stringify(o),
            credentials: 'include',
            timeout: Ue,
            maxRetries: Re,
            debug: r,
          })
        )
          .json()
          .catch(() => null),
        f = c == null ? void 0 : c.code
      if (f !== void 0 && f !== 0 && f !== 200 && f !== '0' && f !== '200')
        throw new Error((c == null ? void 0 : c.message) || (c == null ? void 0 : c.msg) || `sendRyMessage code=${f}`)
      return (a('presend:success', { clientMsgId: i }), { clientMsgId: i })
    } catch (k) {
      throw (a('presend:error', { clientMsgId: i, error: k }), k)
    }
  }
  function re(e, t) {
    const n = {
      daji_userId: String(e.userId ?? ''),
      daji_userName: String(e.userName ?? ''),
      daji_userType: String(e.userType ?? ''),
      daji_language: String(e.language ?? ''),
      daji_token: String(e.token ?? ''),
      daji_priceType: String(e.priceType ?? ''),
      daji_supplierId: String(e.supplierId ?? ''),
      daji_host: typeof location < 'u' ? location.host : '',
      daji_sdkv: t,
    }
    return Object.entries(n)
      .filter(([, r]) => r !== '')
      .map(([r, i]) => `${encodeURIComponent(r)}=${encodeURIComponent(i)}`)
      .join('&')
  }
  let U = null,
    p = null,
    R = !1
  function ie() {
    return (
      U ||
        ((U = new Promise((e) => {
          p = e
        })),
        R && (p == null || p(), (p = null))),
      U
    )
  }
  function Oe() {
    ;((R = !0), ie(), p == null || p(), (p = null))
  }
  function Le() {
    return ie()
  }
  function Ne() {
    ;((U = null), (p = null), (R = !1))
  }
  function $e() {
    return R
  }
  const W = '0.1.0',
    $ = 'DJ_Chat_Window'
  let u = null
  function M(...e) {
    u != null && u.debug && console.log('[DajiCS]', ...e)
  }
  function oe(...e) {
    console.warn('[DajiCS]', ...e)
  }
  function Be(e) {
    if (!(e != null && e.baseUrl)) throw new Error('DajiCS.boot: baseUrl required')
    if (!(e != null && e.apiBase)) throw new Error('DajiCS.boot: apiBase required')
    if (u) {
      if (u.baseUrl !== e.baseUrl || u.apiBase !== e.apiBase) {
        oe('boot() called again with different config — ignoring. Call DajiCS.reset() first to re-boot.')
        return
      }
      M('boot() called again with identical config — no-op.')
      return
    }
    ;((u = { ...e, version: e.version ?? W }),
      M('booted', u),
      ve(u.baseUrl, u.allowedOrigins, { autoClose: u.autoCloseOnEnd, closeDelay: u.endCloseDelay }),
      Oe(),
      a('ready', void 0))
  }
  function ze(e) {
    ;((u = null), Ne(), be(), e != null && e.clearListeners && he())
  }
  function B() {
    if (!u) throw new Error('DajiCS: call boot() before open()')
    return u
  }
  function ae(e, t) {
    const n = e.baseUrl.replace(/\/$/, ''),
      r = t.supplierId ?? 'default',
      i = re(t, e.version ?? W)
    return `${n}/buyer/${encodeURIComponent(r)}${i ? '?' + i : ''}`
  }
  function Pe(e, t) {
    const n = e.baseUrl.replace(/\/$/, ''),
      r = re(t, e.version ?? W)
    return `${n}/chat${r ? '?' + r : ''}`
  }
  function se(e) {
    return Pe(B(), e)
  }
  function ce(e) {
    if (typeof window > 'u') return null
    const t = window.open(e, $)
    return (
      t || a('error', { source: 'window.open', error: new Error('window.open returned null (popup blocked?)') }),
      t
    )
  }
  async function de(e) {
    const t = B()
    if (e.card)
      try {
        await Me(t.apiBase, e, e.card, t.debug)
      } catch (i) {
        oe('pre-send product card failed, opening window anyway:', i)
      }
    const n = ae(t, e)
    ce(n) && (M('opened tab:', n), a('window:open', { key: $, url: n }))
  }
  function qe(e) {
    const t = B(),
      n = ae(t, e)
    ce(n) && (M('opened tab (safe):', n), a('window:open', { key: $, url: n }))
  }
  const He = W
  let l = null
  const Je =
    '<svg class="daji-cs-launcher-icon" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM7 9h10v2H7V9zm7 5H7v-2h7v2zm3-6H7V6h10v2z"/></svg>'
  function Ve(e, t) {
    return !e || e <= 0 ? '' : e > t ? t + '+' : String(e)
  }
  function Ye(e, t, n) {
    const r = Ve(t, n)
    ;((e.textContent = r), e.setAttribute('data-visible', r ? 'true' : 'false'))
  }
  function Fe(e) {
    var h
    if (typeof document > 'u') return
    if (!((h = e == null ? void 0 : e.openWith) != null && h.userId)) {
      a('error', { source: 'mountLauncher', error: new Error('openWith.userId required') })
      return
    }
    ;(l && z(), V(), Y(e.primary))
    const t = document.createElement('button')
    ;((t.type = 'button'),
      (t.className = 'daji-cs-launcher'),
      t.setAttribute('data-position', e.position ?? 'bottom-right'),
      t.setAttribute('aria-label', e.title ?? '在线客服'),
      (t.innerHTML = Je),
      e.primary && t.style.setProperty('--daji-cs-primary', e.primary))
    const n = document.createElement('span')
    ;((n.className = 'daji-cs-badge'), n.setAttribute('data-visible', 'false'), t.appendChild(n))
    const r = e.badgeMax ?? 99,
      i = P('unread:change', ({ count: v }) => Ye(n, v, r))
    ;(t.addEventListener('click', () => {
      ;(a('launcher:click', { mode: e.mode ?? 'tab' }), ue(e))
    }),
      document.body.appendChild(t))
    const o = q(() => z())
    ;((l = { root: t, badge: n, opts: e, unreadUnsub: i, offReset: o }),
      a('launcher:mount', { position: e.position ?? 'bottom-right' }))
  }
  async function ue(e) {
    const t = e.mode ?? 'tab'
    try {
      if (t === 'tab') {
        await de(e.openWith)
        return
      }
      if (Q()) {
        y('user')
        return
      }
      const n = se(e.openWith)
      F(n, { position: e.position ?? 'bottom-right', primary: e.primary, title: e.title ?? '在线客服' })
    } catch (n) {
      a('error', { source: 'launcher:click', error: n })
    }
  }
  function z() {
    l && (l.unreadUnsub(), l.offReset(), l.root.remove(), xe(), a('launcher:unmount', void 0), (l = null))
  }
  function Ge() {
    return (l == null ? void 0 : l.root) ?? null
  }
  function Qe(e) {
    a('unread:change', { count: e })
  }
  function Xe() {
    l && ue(l.opts)
  }
  function Ze(e) {
    return te('daji:identity', e)
  }
  const le = {
    boot: Be,
    open: de,
    openSafe: qe,
    reset: ze,
    ready: Le,
    isReadyNow: $e,
    on: P,
    off: me,
    once: pe,
    mountLauncher: Fe,
    unmountLauncher: z,
    setUnreadCount: Qe,
    toggleWidget: Xe,
    getLauncherElement: Ge,
    openWidget: F,
    closeWidget: y,
    isWidgetOpen: Q,
    getWidgetIframe: G,
    buildChatUrl: se,
    sendToWidgetIframe: te,
    sendToOpenWindow: Ae,
    isBridgeActive: Ce,
    getAllowedOrigins: Ie,
    showEndBanner: X,
    hideEndBanner: Z,
    refreshIdentity: Ze,
    DAJI_MSG_SOURCE: D,
    DAJI_MSG_VERSION: L,
    version: He,
  }
  return (typeof window < 'u' && (window.DajiCS = le), le)
})()
//# sourceMappingURL=daji-cs.iife.js.map
