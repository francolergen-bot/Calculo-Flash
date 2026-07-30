// ================================================================
// FIREBASE CONFIGURATION - Cálculo Flash
// ================================================================
const firebaseConfig = {
  apiKey: "AIzaSyBfQa1TO-dCIyUJTzbhh9gJTI0lbw9R48o",
  authDomain: "calculo-flash.firebaseapp.com",
  projectId: "calculo-flash",
  storageBucket: "calculo-flash.firebasestorage.app",
  messagingSenderId: "245714226218",
  appId: "1:245714226218:web:4cadd15cc0ead7b3d08753"
};

// ================================================================
// i18n TRANSLATIONS (ES + EN)
// ================================================================
const i18n = {
  es: {
    jugar: 'Jugar',
    mejoresMarcas: 'Mejores marcas',
    logros: 'Logros',
    misEstadisticas: 'Mis estadísticas',
    temas: 'Temas',
    comoJugar: 'Cómo jugar',
    ranking: 'Ranking',
    topMarcas: 'Top mejores marcas',
    sinMarcas: 'SIN MARCAS AÚN',
    volver: 'Volver',
    pts: 'pts',
    cargando: 'Cargando...',
    misMarcasTab: '📱 MIS MARCAS',
  },
  en: {
    jugar: 'Play',
    mejoresMarcas: 'Top Scores',
    logros: 'Achievements',
    misEstadisticas: 'My Statistics',
    temas: 'Themes',
    comoJugar: 'How to Play',
    ranking: 'Ranking',
    topMarcas: 'Top scores',
    sinMarcas: 'NO SCORES YET',
    volver: 'Back',
    pts: 'pts',
    cargando: 'Loading...',
    misMarcasTab: '📱 MY SCORES',
  }
};

// ================================================================
// LANGUAGE - CAMBIO DINÁMICO SIN RELOAD
// ================================================================
let currentLanguage = localStorage.getItem('cf_language') || 'es';

function t(key) {
  return (i18n[currentLanguage] && i18n[currentLanguage][key]) || (i18n['es'] && i18n['es'][key]) || key;
}

function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('cf_language', lang);
  updateLanguageUI(); // EN VIVO, sin recargar
}

function updateLanguageUI() {
  // Botones de idioma
  document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById('lang-' + currentLanguage);
  if (activeBtn) activeBtn.classList.add('active');

  // Menú principal
  const setText = (id, key) => {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  };
  setText('menu-jugar', 'jugar');
  setText('menu-scores', 'mejoresMarcas');
  setText('menu-achievements', 'logros');
  setText('menu-stats', 'misEstadisticas');
  setText('menu-themes', 'temas');
  setText('menu-howto', 'comoJugar');

  // Screen de ranking
  setText('title-ranking', 'ranking');
  setText('sub-topscores', 'topMarcas');
  setText('btn-volver', 'volver');

  // Tab de marcas locales
  const tabLocal = document.getElementById('tab-local');
  if (tabLocal) tabLocal.textContent = t('misMarcasTab');
}

// ================================================================
// DÍAS ACUMULADOS (el conteo lo hace updateDailyStreak en index.html)
// ================================================================
function getTotalDaysPlayed() {
  return parseInt(localStorage.getItem('cf_total_days_played')) || 0;
}

// ================================================================
// FIREBASE HELPERS (Compat SDK)
// ================================================================
let db = null;

function initFirebase() {
  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK no cargó');
    return;
  }
  try {
    const app = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore(app);
    console.log('Firebase inicializado ✅');
  } catch (e) {
    console.error('Error inicializando Firebase:', e);
  }
}

async function submitScoreToFirebase(playerName, difficulty, level, score) {
  if (!db) { console.warn('Firebase no inicializado'); return; }

  try {
    let country = 'AR';
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      country = data.country_code || 'AR';
    } catch (e) { /* sin país, no pasa nada */ }

    await db.collection('cf_scores').add({
      playerName: playerName,
      difficulty: difficulty,
      level: level,
      score: score,
      country: country,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log('Score guardado en Firebase ✅');
  } catch (error) {
    console.error('Error guardando score:', error);
  }
}

async function getLeaderboard(difficulty = null) {
  if (!db) { console.warn('Firebase no inicializado'); return []; }

  try {
    let query = db.collection('cf_scores').orderBy('score', 'desc').limit(15);
    if (difficulty && difficulty !== 'global') {
      query = db.collection('cf_scores')
        .where('difficulty', '==', difficulty)
        .orderBy('score', 'desc')
        .limit(15);
    }
    const snapshot = await query.get();
    const scores = [];
    snapshot.forEach(doc => scores.push({ id: doc.id, ...doc.data() }));
    return scores;
  } catch (error) {
    console.error('Error obteniendo leaderboard:', error);
    return [];
  }
}
