// ================================================================
// ADS + PREMIUM - Cálculo Flash (Semana 2)
// ================================================================
// AdMob: los anuncios reales SOLO se muestran en la app Android
// (Capacitor, Semana 4). En la versión web este módulo queda
// preparado y silencioso.
// RevenueCat: suscripción $0.99/mes. En web se activa modo demo.
// ================================================================

const ADS_CONFIG = {
  admobAppId: 'ca-app-pub-2779947809961033~8880711929',
  bannerUnitId: 'ca-app-pub-2779947809961033/4338143324',
  interstitialUnitId: 'ca-app-pub-2779947809961033/2511297005',
  revenueCatApiKey: 'test_sLIsveZfZvdxEORechJHfdlNKcZ',
  interstitialEveryNGames: 2, // interstitial cada 2 partidas
};

// ================================================================
// PREMIUM (isPremium flag)
// ================================================================
function isPremium() {
  return localStorage.getItem('cf_premium') === 'true';
}

function setPremium(value) {
  localStorage.setItem('cf_premium', value ? 'true' : 'false');
  updatePremiumUI();
}

function updatePremiumUI() {
  const btn = document.getElementById('menu-premium-btn');
  if (btn) {
    if (isPremium()) {
      btn.innerHTML = '⭐ &nbsp;<span>Premium activo ✓</span>';
      btn.classList.add('premium-active');
    } else {
      btn.innerHTML = '⭐ &nbsp;<span>Premium — Sacá los anuncios</span>';
      btn.classList.remove('premium-active');
    }
  }
  // Ocultar banner si es premium
  const banner = document.getElementById('ad-banner-container');
  if (banner) banner.style.display = isPremium() ? 'none' : '';
}

// ================================================================
// ADMOB (solo funciona en la app Android via Capacitor)
// ================================================================
let admobAvailable = false;
let gamesPlayedThisSession = 0;

async function initAds() {
  // Detectar si corremos dentro de Capacitor con plugin AdMob
  if (window.Capacitor && window.Capacitor.isPluginAvailable && window.Capacitor.isPluginAvailable('AdMob')) {
    try {
      const { AdMob } = window.Capacitor.Plugins;
      await AdMob.initialize({});
      admobAvailable = true;
      console.log('AdMob inicializado (app nativa) ✅');
      if (!isPremium()) showBannerAd();
    } catch (e) {
      console.warn('AdMob no pudo inicializarse:', e);
    }
  } else {
    console.log('AdMob: versión web, anuncios desactivados (se activan en la app Android)');
  }
  updatePremiumUI();
}

async function showBannerAd() {
  if (!admobAvailable || isPremium()) return;
  try {
    const { AdMob } = window.Capacitor.Plugins;
    await AdMob.showBanner({
      adId: ADS_CONFIG.bannerUnitId,
      adSize: 'BANNER',
      position: 'BOTTOM_CENTER',
      margin: 0,
    });
  } catch (e) { console.warn('Banner error:', e); }
}

async function hideBannerAd() {
  if (!admobAvailable) return;
  try {
    const { AdMob } = window.Capacitor.Plugins;
    await AdMob.hideBanner();
  } catch (e) { /* noop */ }
}

// Llamar al terminar cada partida
async function maybeShowInterstitial() {
  gamesPlayedThisSession++;
  if (isPremium()) return;
  if (gamesPlayedThisSession % ADS_CONFIG.interstitialEveryNGames !== 0) return;
  if (!admobAvailable) return; // web: no interstitial

  try {
    const { AdMob } = window.Capacitor.Plugins;
    await AdMob.prepareInterstitial({ adId: ADS_CONFIG.interstitialUnitId });
    await AdMob.showInterstitial();
  } catch (e) { console.warn('Interstitial error:', e); }
}

// ================================================================
// PREMIUM MODAL + COMPRA
// ================================================================
function openPremiumModal() {
  const modal = document.getElementById('premium-modal');
  if (modal) modal.style.display = 'flex';
}

function closePremiumModal() {
  const modal = document.getElementById('premium-modal');
  if (modal) modal.style.display = 'none';
}

async function buyPremium() {
  // En la app Android (Semana 4): RevenueCat maneja la compra real
  // vía Google Play Billing. En web activamos modo demo.
  if (window.Capacitor && window.Capacitor.isPluginAvailable && window.Capacitor.isPluginAvailable('Purchases')) {
    try {
      const { Purchases } = window.Capacitor.Plugins;
      await Purchases.configure({ apiKey: ADS_CONFIG.revenueCatApiKey });
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current && offerings.current.availablePackages[0];
      if (!pkg) { alert('No hay suscripciones disponibles por ahora.'); return; }
      const result = await Purchases.purchasePackage({ aPackage: pkg });
      if (result && result.customerInfo && result.customerInfo.entitlements.active['premium']) {
        setPremium(true);
        hideBannerAd();
        closePremiumModal();
        alert('¡Gracias! Premium activado ⭐');
      }
    } catch (e) {
      if (!e.userCancelled) console.error('Error en compra:', e);
    }
  } else {
    // WEB: modo demo (para probar la experiencia premium)
    setPremium(true);
    closePremiumModal();
    alert('Premium activado en modo demo ⭐\n(La compra real estará disponible en la app de Google Play)');
  }
}

async function restorePurchases() {
  if (window.Capacitor && window.Capacitor.isPluginAvailable && window.Capacitor.isPluginAvailable('Purchases')) {
    try {
      const { Purchases } = window.Capacitor.Plugins;
      await Purchases.configure({ apiKey: ADS_CONFIG.revenueCatApiKey });
      const result = await Purchases.restorePurchases();
      if (result && result.customerInfo && result.customerInfo.entitlements.active['premium']) {
        setPremium(true);
        alert('Compras restauradas ✅ Premium activo.');
      } else {
        alert('No se encontraron compras previas.');
      }
    } catch (e) { console.error('Restore error:', e); }
  } else {
    alert('La restauración de compras estará disponible en la app de Google Play.');
  }
}
