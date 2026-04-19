/**
 * Launcher / Widget 内联样式。
 * 约定：所有 class 前缀 daji-cs- 避免与宿主站点样式冲突。
 * z-index 使用 2147483000（接近 int32 max，给其它 overlay 留余量）。
 */

export const STYLE_ID = 'daji-cs-styles'
export const Z_BASE = 2147483000

export const CSS = `
.daji-cs-launcher {
  position: fixed;
  z-index: ${Z_BASE};
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
  z-index: ${Z_BASE + 1};
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
