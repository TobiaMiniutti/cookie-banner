(() => {
  const CONSENT_KEY = "tm_cookie_consent_v3";
  const UID_KEY = "tm_cookie_uid_v1";

  // ====== CONFIG via <script data-*> ======
  const self = document.currentScript;
  const GA_ID = self?.dataset?.ga || "";
  const POLICY_URL = self?.dataset?.policy || "cookie.html";
  const PRIVACY_URL = self?.dataset?.privacy || "privacy.html";
  const MANAGE = (self?.dataset?.manage || "").toLowerCase();      // "floating"
  const MANAGE_POS = (self?.dataset?.managePos || "br").toLowerCase(); // bl/br
  const MANAGE_LABEL = self?.dataset?.manageLabel || "Preferenze cookie";

  // ====== UID (anonimo, locale) ======
  const getUID = () => {
    let uid = localStorage.getItem(UID_KEY);
    if (uid) return uid;

    // UUID-ish semplice e robusto (senza dipendenze)
    const rnd = () => Math.random().toString(16).slice(2);
    uid = `tm_${Date.now().toString(16)}_${rnd()}_${rnd()}`.slice(0, 44);

    localStorage.setItem(UID_KEY, uid);
    return uid;
  };

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
  const readConsent = () => {
    try { return JSON.parse(localStorage.getItem(CONSENT_KEY) || "null"); }
    catch { return null; }
  };
  const writeConsent = (obj) => localStorage.setItem(CONSENT_KEY, JSON.stringify(obj));

  // ====== consent apply ======
  const applyConsent = (c) => {
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
    window.TMCookie.uid = getUID();
  };

  // ====== root mount ======
  const ensureRoot = () => {
    if (document.getElementById("tmCookieRoot")) return;
    const root = document.createElement("div");
    root.id = "tmCookieRoot";
    document.body.appendChild(root);
  };

  const animateOutRemove = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add("tm-leave");
    setTimeout(() => el.remove(), 220);
  };

  const closeBanner = () => {
    document.documentElement.classList.remove("tm-banner-open");
    animateOutRemove("tmCookieBanner");
  };
  const closePrefs = () => animateOutRemove("tmCookiePrefs");
  const closeInfo  = () => animateOutRemove("tmCookieInfo");

  const setConsent = ({ analytics }) => {
    const c = { necessary: true, analytics: !!analytics, ts: Date.now() };
    writeConsent(c);
    applyConsent(c);
    closePrefs();
    closeBanner();
    // lascia aperta Info se l'utente l'ha aperta: aggiorniamo testo live
    refreshInfoUI();
  };

  // ====== format ======
  const fmtDate = (ms) => {
    if (!ms) return "—";
    try {
      return new Date(ms).toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" });
    } catch { return String(ms); }
  };

  // ====== Preferences drawer ======
  const openPrefs = () => {
    ensureRoot();
    if (document.getElementById("tmCookiePrefs")) return;

    const saved = readConsent();

    const prefs = document.createElement("div");
    prefs.id = "tmCookiePrefs";
    prefs.className = "tm-cookie-prefs";
    prefs.innerHTML = `
      <div class="tm-cookie-card" role="dialog" aria-modal="true" aria-label="Preferenze cookie">
        <div class="tm-head">
          <div>
            <div class="tm-title">Preferenze cookie</div>
            <div class="tm-sub">Puoi cambiare idea in qualsiasi momento.</div>
          </div>
          <button class="tm-iconbtn" id="tmPrefsClose" aria-label="Chiudi">×</button>
        </div>

        <div class="tm-section">
          <label class="tm-row">
            <span><b>Necessari</b><br><small>Sempre attivi</small></span>
            <input type="checkbox" checked disabled>
          </label>

          <label class="tm-row">
            <span><b>Statistici</b><br><small>Google Analytics</small></span>
            <input type="checkbox" id="tmAnalytics">
          </label>
        </div>

        <div class="tm-actions">
          <a class="tm-link" href="${POLICY_URL}">Cookie Policy</a>
          <a class="tm-link" href="${PRIVACY_URL}">Privacy</a>
          <span class="tm-spacer"></span>
          <button class="tm-btn tm-btn--ghost" id="tmReject2">Rifiuta</button>
          <button class="tm-btn tm-btn--solid" id="tmSave">Salva</button>
        </div>
      </div>
    `;

    document.getElementById("tmCookieRoot").appendChild(prefs);

    const chk = document.getElementById("tmAnalytics");
    chk.checked = !!saved?.analytics;

    document.getElementById("tmPrefsClose").addEventListener("click", closePrefs);
    document.getElementById("tmReject2").addEventListener("click", () => setConsent({ analytics: false }));
    document.getElementById("tmSave").addEventListener("click", () => setConsent({ analytics: chk.checked }));

    document.addEventListener("keydown", function esc(e){
      if (e.key === "Escape") { closePrefs(); document.removeEventListener("keydown", esc); }
    });
  };

  // ====== Info panel ======
  const refreshInfoUI = () => {
    const box = document.getElementById("tmInfoBox");
    if (!box) return;

    const c = readConsent();
    const uid = getUID();

    const analytics = c ? (c.analytics ? "Attivi" : "Disattivi") : "Non scelto";
    const ts = c?.ts ? fmtDate(c.ts) : "—";

    box.querySelector("[data-field='uid']").textContent = uid;
    box.querySelector("[data-field='ga']").textContent = GA_ID || "—";
    box.querySelector("[data-field='analytics']").textContent = analytics;
    box.querySelector("[data-field='ts']").textContent = ts;
  };

  const openInfo = () => {
    ensureRoot();
    if (document.getElementById("tmCookieInfo")) {
      refreshInfoUI();
      return;
    }

    const info = document.createElement("div");
    info.id = "tmCookieInfo";
    info.className = "tm-cookie-info";
    info.innerHTML = `
      <div class="tm-cookie-card" role="dialog" aria-modal="false" aria-label="Info cookie">
        <div class="tm-head">
          <div>
            <div class="tm-title">Cookie • Info</div>
            <div class="tm-sub">ID anonimo locale + stato consenso.</div>
          </div>
          <button class="tm-iconbtn" id="tmInfoClose" aria-label="Chiudi">×</button>
        </div>

        <div class="tm-section" id="tmInfoBox">
          <div class="tm-kv">
            <div class="tm-k">ID utente (anonimo)</div>
            <div class="tm-v" data-field="uid">—</div>
          </div>

          <div class="tm-kv">
            <div class="tm-k">Google Analytics ID</div>
            <div class="tm-v" data-field="ga">—</div>
          </div>

          <div class="tm-kv">
            <div class="tm-k">Cookie statistici</div>
            <div class="tm-v" data-field="analytics">—</div>
          </div>

          <div class="tm-kv">
            <div class="tm-k">Ultima scelta</div>
            <div class="tm-v" data-field="ts">—</div>
          </div>
        </div>

        <div class="tm-actions">
          <a class="tm-link" href="${POLICY_URL}">Cookie Policy</a>
          <a class="tm-link" href="${PRIVACY_URL}">Privacy</a>
          <span class="tm-spacer"></span>
          <button class="tm-btn tm-btn--ghost" id="tmOpenPrefs">Rivedi preferenze</button>
          <button class="tm-btn tm-btn--solid" id="tmInfoOk">Chiudi</button>
        </div>
      </div>
    `;

    document.getElementById("tmCookieRoot").appendChild(info);

    refreshInfoUI();

    document.getElementById("tmInfoClose").addEventListener("click", closeInfo);
    document.getElementById("tmInfoOk").addEventListener("click", closeInfo);
    document.getElementById("tmOpenPrefs").addEventListener("click", () => {
      closeInfo();
      openPrefs();
    });

    document.addEventListener("keydown", function esc(e){
      if (e.key === "Escape") { closeInfo(); document.removeEventListener("keydown", esc); }
    });
  };

  // ====== Banner slim (more opaque) ======
  const mountBanner = () => {
    ensureRoot();
    if (document.getElementById("tmCookieBanner")) return;

    const banner = document.createElement("div");
    banner.id = "tmCookieBanner";
    banner.className = "tm-cookie-banner";
    banner.innerHTML = `
      <div class="tm-cookie-banner__inner" role="dialog" aria-label="Banner cookie">
        <div class="tm-cookie-banner__left">
          <div class="tm-badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
              <path d="M12 2c.4 1.9-.4 3.6-2 4.8C8.7 7.7 8 9 8 10.5c0 2.5 2 4.5 4.5 4.5 2.6 0 4.7-2.1 4.5-4.7 1.2.5 2 1.7 2 3.2 0 3-2.5 5.5-5.5 5.5S8 16.5 8 13.5c0-.9.2-1.8.7-2.5-1.7.3-3.2 1.7-3.6 3.6C4.4 12.8 5 10.5 6.5 9 8 7.5 10 6.7 12 2Z"
                stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
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
          <button class="tm-btn tm-btn--ghost" id="tmPrefs">Preferenze</button>
          <button class="tm-btn tm-btn--ghost" id="tmReject">Rifiuta</button>
          <button class="tm-btn tm-btn--solid" id="tmAccept">Accetta</button>
        </div>
      </div>
    `;

    document.getElementById("tmCookieRoot").appendChild(banner);

    document.getElementById("tmPrefs").addEventListener("click", openPrefs);
    document.getElementById("tmReject").addEventListener("click", () => setConsent({ analytics: false }));
    document.getElementById("tmAccept").addEventListener("click", () => setConsent({ analytics: true }));
  };

  // ====== Floating manage icon button (opens INFO) ======
  const mountManageButton = () => {
    if (MANAGE !== "floating") return;
    if (document.getElementById("tmCookieManage")) return;

    const b = document.createElement("button");
    b.id = "tmCookieManage";
    b.type = "button";
    b.className = "tm-cookie-manage " + (MANAGE_POS === "bl" ? "tm-pos-bl" : "tm-pos-br");
    b.setAttribute("aria-label", MANAGE_LABEL);
    b.innerHTML = `
      <span class="tm-cookie-manage__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
          <path d="M12 2c.4 1.9-.4 3.6-2 4.8C8.7 7.7 8 9 8 10.5c0 2.5 2 4.5 4.5 4.5 2.6 0 4.7-2.1 4.5-4.7 1.2.5 2 1.7 2 3.2 0 3-2.5 5.5-5.5 5.5S8 16.5 8 13.5c0-.9.2-1.8.7-2.5-1.7.3-3.2 1.7-3.6 3.6C4.4 12.8 5 10.5 6.5 9 8 7.5 10 6.7 12 2Z"
            stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    `;
    b.addEventListener("click", openInfo);
    document.body.appendChild(b);
    document.documentElement.classList.add("tm-banner-open");
  };

  // ====== Public API ======
  window.TMCookie = window.TMCookie || {};
  window.TMCookie.openPrefs = openPrefs;
  window.TMCookie.openInfo = openInfo;
  window.TMCookie.uid = getUID();
  window.TMCookie.reset = () => {
    localStorage.removeItem(CONSENT_KEY);
    // non rimuovo UID di default
  };

  // ====== Init ======
  const existing = readConsent();
  if (existing) applyConsent(existing);
  else applyConsent({ necessary: true, analytics: false, ts: 0 }); // stato iniziale

  const start = () => {
    getUID(); // ensure UID
    mountManageButton();
    if (!existing) mountBanner();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
