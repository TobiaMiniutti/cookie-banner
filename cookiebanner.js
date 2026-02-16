(() => {
  const KEY = "tm_cookie_consent_v1";

  // ====== CONFIG via <script data-*> ======
  const self = document.currentScript;
  const GA_ID = self?.dataset?.ga || "";                 // es: G-XXXXXXXXXX
  const POLICY_URL = self?.dataset?.policy || "cookie.html";
  const PRIVACY_URL = self?.dataset?.privacy || "privacy.html";
  const MANAGE = (self?.dataset?.manage || "").toLowerCase(); // "floating"
  const MANAGE_TEXT = self?.dataset?.manageText || "Cookie";  // opzionale

  // ====== gtag stub + Consent Mode default denied ======
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  // Default denied (EEA-friendly)
  gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied"
  });

  // Load GA script (can run cookieless until granted)
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

  // ====== UI mount banner ======
  const mount = () => {
    if (document.getElementById("tmCookie")) return;

    const wrap = document.createElement("div");
    wrap.className = "tm-cookie";
    wrap.id = "tmCookie";
    wrap.innerHTML = `
      <div class="tm-cookie__card" role="dialog" aria-modal="true" aria-label="Preferenze cookie">
        <div class="tm-cookie__head">
          <h3>Cookie</h3>
          <button class="tm-cookie__x" id="tmCkX" aria-label="Chiudi">×</button>
        </div>

        <p class="tm-cookie__text">
          Usiamo cookie <b>necessari</b> per il funzionamento del sito e, solo con il tuo consenso,
          cookie <b>statistici</b> (Google Analytics).
          <a href="${POLICY_URL}">Cookie Policy</a> · <a href="${PRIVACY_URL}">Privacy</a>
        </p>

        <div class="tm-cookie__actions" id="tmCkActions">
          <button class="tm-btn tm-btn--ghost" id="tmCkPrefs">Preferenze</button>
          <button class="tm-btn tm-btn--ghost" id="tmCkReject">Rifiuta</button>
          <button class="tm-btn tm-btn--solid" id="tmCkAccept">Accetta</button>
        </div>

        <div class="tm-cookie__prefs" id="tmCkPanel" hidden>
          <label class="tm-row">
            <span><b>Necessari</b><br><small>Sempre attivi</small></span>
            <input type="checkbox" checked disabled>
          </label>

          <label class="tm-row">
            <span><b>Statistici</b><br><small>Google Analytics</small></span>
            <input type="checkbox" id="tmCkAnalytics">
          </label>

          <div class="tm-cookie__actions">
            <button class="tm-btn tm-btn--ghost" id="tmCkBack">Indietro</button>
            <button class="tm-btn tm-btn--solid" id="tmCkSave">Salva</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(wrap);
    document.documentElement.classList.add("tm-no-scroll");

    const $ = (id) => document.getElementById(id);

    const actions = $("tmCkActions");
    const panel = $("tmCkPanel");
    const chkA = $("tmCkAnalytics");

    const openPrefs = () => {
      actions.hidden = true;
      panel.hidden = false;
      const c = read();
      chkA.checked = !!c?.analytics;
    };

    const close = () => {
      wrap.remove();
      document.documentElement.classList.remove("tm-no-scroll");
    };

    const setConsent = (analytics) => {
      const c = { necessary: true, analytics: !!analytics, ts: Date.now() };
      write(c);
      apply(c);
      close();
    };

    $("tmCkPrefs").addEventListener("click", openPrefs);
    $("tmCkBack").addEventListener("click", () => { panel.hidden = true; actions.hidden = false; });
    $("tmCkSave").addEventListener("click", () => setConsent(chkA.checked));
    $("tmCkReject").addEventListener("click", () => setConsent(false));
    $("tmCkAccept").addEventListener("click", () => setConsent(true));

    // X = rifiuta analytics (safe)
    $("tmCkX").addEventListener("click", () => setConsent(false));
  };

  // ====== floating manage button ======
  const mountManageButton = () => {
    if (MANAGE !== "floating") return;
    if (document.getElementById("tmCookieManage")) return;

    const b = document.createElement("button");
    b.id = "tmCookieManage";
    b.type = "button";
    b.className = "tm-cookie-manage";
    b.textContent = MANAGE_TEXT;

    b.addEventListener("click", () => {
      // apre direttamente preferenze
      mount();
      setTimeout(() => document.getElementById("tmCkPrefs")?.click(), 0);
    });

    document.body.appendChild(b);
  };

  // ====== Public API ======
  window.TMCookie = window.TMCookie || {};
  window.TMCookie.open = () => mount();
  window.TMCookie.openPrefs = () => {
    mount();
    setTimeout(() => document.getElementById("tmCkPrefs")?.click(), 0);
  };
  window.TMCookie.reset = () => {
    localStorage.removeItem(KEY);
    // opzionale: ricarica per far riapparire banner
    // location.reload();
  };

  // ====== Init ======
  const existing = read();
  if (existing) apply(existing);

  const start = () => {
    mountManageButton();
    if (!existing) mount();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
