(() => {
  const KEY = "tm_cookie_consent_v2";

  // ====== CONFIG via <script data-*> ======
  const self = document.currentScript;
  const GA_ID = self?.dataset?.ga || "";                 // es: G-XXXXXXXXXX
  const POLICY_URL = self?.dataset?.policy || "cookie.html";
  const PRIVACY_URL = self?.dataset?.privacy || "privacy.html";
  const MANAGE = (self?.dataset?.manage || "").toLowerCase(); // "floating"
  const MANAGE_POS = (self?.dataset?.managePos || "bl").toLowerCase(); // bl/br
  const MANAGE_LABEL = self?.dataset?.manageLabel || "Cookie";

  // ====== gtag stub + Consent Mode default denied ======
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied"
  });

  if (GA_ID) {
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
  }

  // ====== storage helpers ======
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; } };
  const write = (obj) => localStorage.setItem(KEY, JSON.stringify(obj));

  // ====== consent apply ======
  const apply = (c) => {
    if (GA_ID) {
      if (c.analytics) {
        gtag("consent", "update", { analytics_storage: "granted" });
        gtag("config", GA_ID);
      } else {
        gtag("consent", "update", { analytics_storage: "denied" });
      }
    }
    window.TMCookie = window.TMCookie || {};
    window.TMCookie.consent = c;
  };

  // ====== UI helpers ======
  const ensureRoot = () => {
    if (document.getElementById("tmCookieRoot")) return;
    const root = document.createElement("div");
    root.id = "tmCookieRoot";
    document.body.appendChild(root);
  };

  const closeBanner = () => {
    const el = document.getElementById("tmCookieBanner");
    if (!el) return;
    el.classList.add("tm-leave");
    setTimeout(() => el.remove(), 220);
  };

  const closePrefs = () => {
    const el = document.getElementById("tmCookiePrefs");
    if (!el) return;
    el.classList.add("tm-leave");
    setTimeout(() => el.remove(), 220);
  };

  const setConsent = ({ analytics }) => {
    const c = { necessary: true, analytics: !!analytics, ts: Date.now() };
    write(c);
    apply(c);
    closePrefs();
    closeBanner();
  };

  // ====== PREFERENCES drawer ======
  const openPrefs = () => {
    ensureRoot();
    if (document.getElementById("tmCookiePrefs")) return;

    const saved = read();

    const prefs = document.createElement("div");
    prefs.id = "tmCookiePrefs";
    prefs.className = "tm-cookie-prefs";
    prefs.innerHTML = `
      <div class="tm-cookie-prefs__card" role="dialog" aria-modal="true" aria-label="Preferenze cookie">
        <div class="tm-cookie-prefs__head">
          <div>
            <div class="tm-cookie-prefs__title">Preferenze cookie</div>
            <div class="tm-cookie-prefs__sub">Controlla cosa abiliti. Puoi cambiare idea in qualsiasi momento.</div>
          </div>
          <button class="tm-iconbtn" id="tmCkPrefsClose" aria-label="Chiudi">×</button>
        </div>

        <div class="tm-cookie-prefs__rows">
          <label class="tm-row">
            <span>
              <b>Necessari</b><br>
              <small>Sempre attivi per far funzionare il sito</small>
            </span>
            <input type="checkbox" checked disabled>
          </label>

          <label class="tm-row">
            <span>
              <b>Statistici</b><br>
              <small>Google Analytics (misurazione prestazioni)</small>
            </span>
            <input type="checkbox" id="tmCkAnalytics">
          </label>
        </div>

        <div class="tm-cookie-prefs__actions">
          <a class="tm-link" href="${POLICY_URL}">Cookie Policy</a>
          <a class="tm-link" href="${PRIVACY_URL}">Privacy</a>
          <div class="tm-spacer"></div>
          <button class="tm-btn tm-btn--ghost" id="tmCkReject2">Rifiuta</button>
          <button class="tm-btn tm-btn--solid" id="tmCkSave">Salva</button>
        </div>
      </div>
    `;

    document.getElementById("tmCookieRoot").appendChild(prefs);

    const chk = document.getElementById("tmCkAnalytics");
    chk.checked = !!saved?.analytics;

    document.getElementById("tmCkPrefsClose").addEventListener("click", closePrefs);
    document.getElementById("tmCkReject2").addEventListener("click", () => setConsent({ analytics: false }));
    document.getElementById("tmCkSave").addEventListener("click", () => setConsent({ analytics: chk.checked }));

    // ESC to close
    document.addEventListener("keydown", function esc(e){
      if (e.key === "Escape") { closePrefs(); document.removeEventListener("keydown", esc); }
    });
  };

  // ====== Banner slim (no overlay) ======
  const mountBanner = () => {
    ensureRoot();
    if (document.getElementById("tmCookieBanner")) return;

    const banner = document.createElement("div");
    banner.id = "tmCookieBanner";
    banner.className = "tm-cookie-banner";
    banner.innerHTML = `
      <div class="tm-cookie-banner__inner" role="dialog" aria-label="Banner cookie">
        <div class="tm-cookie-banner__left">
          <div class="tm-cookie-badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
              <path d="M12 2c.4 1.9-.4 3.6-2 4.8C8.7 7.7 8 9 8 10.5c0 2.5 2 4.5 4.5 4.5 2.6 0 4.7-2.1 4.5-4.7 1.2.5 2 1.7 2 3.2 0 3-2.5 5.5-5.5 5.5S8 16.5 8 13.5c0-.9.2-1.8.7-2.5-1.7.3-3.2 1.7-3.6 3.6C4.4 12.8 5 10.5 6.5 9 8 7.5 10 6.7 12 2Z"
                stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M14.8 3.6c.1 1.2-.5 2.2-1.3 2.9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
          </div>

          <div class="tm-cookie-banner__text">
            <div class="tm-cookie-banner__title">Cookie</div>
            <div class="tm-cookie-banner__desc">
              Usiamo cookie necessari e, con consenso, cookie statistici (Google Analytics).
              <a class="tm-link" href="${POLICY_URL}">Policy</a>
            </div>
          </div>
        </div>

        <div class="tm-cookie-banner__actions">
          <button class="tm-btn tm-btn--ghost" id="tmCkPrefs">Preferenze</button>
          <button class="tm-btn tm-btn--ghost" id="tmCkReject">Rifiuta</button>
          <button class="tm-btn tm-btn--solid" id="tmCkAccept">Accetta</button>
        </div>
      </div>
    `;

    document.getElementById("tmCookieRoot").appendChild(banner);

    document.getElementById("tmCkPrefs").addEventListener("click", openPrefs);
    document.getElementById("tmCkReject").addEventListener("click", () => setConsent({ analytics: false }));
    document.getElementById("tmCkAccept").addEventListener("click", () => setConsent({ analytics: true }));
  };

  // ====== Floating manage icon ======
  const mountManageButton = () => {
    if (MANAGE !== "floating") return;
    if (document.getElementById("tmCookieManage")) return;

    const b = document.createElement("button");
    b.id = "tmCookieManage";
    b.type = "button";
    b.className = "tm-cookie-manage " + (MANAGE_POS === "br" ? "tm-pos-br" : "tm-pos-bl");
    b.setAttribute("aria-label", MANAGE_LABEL);
    b.innerHTML = `
      <span class="tm-cookie-manage__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
          <path d="M12 2c.4 1.9-.4 3.6-2 4.8C8.7 7.7 8 9 8 10.5c0 2.5 2 4.5 4.5 4.5 2.6 0 4.7-2.1 4.5-4.7 1.2.5 2 1.7 2 3.2 0 3-2.5 5.5-5.5 5.5S8 16.5 8 13.5c0-.9.2-1.8.7-2.5-1.7.3-3.2 1.7-3.6 3.6C4.4 12.8 5 10.5 6.5 9 8 7.5 10 6.7 12 2Z"
            stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M14.8 3.6c.1 1.2-.5 2.2-1.3 2.9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
      </span>
    `;
    b.addEventListener("click", openPrefs);
    document.body.appendChild(b);
  };

  // ====== Public API ======
  window.TMCookie = window.TMCookie || {};
  window.TMCookie.openPrefs = openPrefs;
  window.TMCookie.reset = () => localStorage.removeItem(KEY);

  // ====== Init ======
  const existing = read();
  if (existing) apply(existing);

  const start = () => {
    mountManageButton();
    if (!existing) mountBanner();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
