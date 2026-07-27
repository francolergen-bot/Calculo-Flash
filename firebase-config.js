// ================================================================
// FIREBASE CONFIGURATION
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
    // MENU
    jugar: 'Jugar',
    mejoresMarcas: 'Mejores marcas',
    logros: 'Logros',
    misEstadisticas: 'Mis estadísticas',
    temas: 'Temas',
    comoJugar: 'Cómo jugar',
    inicio: 'Inicio',
    
    // IDIOMA
    idioma: 'Idioma',
    es: 'Español',
    en: 'English',
    
    // DIFFICULTY
    dificultad: 'Dificultad',
    elegiNivel: 'Elegí tu nivel de desafío',
    aprendizaje: 'Aprendizaje',
    aprendizajeDesc: 'Solo sumas · Números 1–5 · 3 seg por número · Sin presión\nIdeal para chicos o para empezar de cero',
    inicial: 'Inicial',
    inicialDesc: 'Solo sumas · Números 1–10 · 2 seg por número\nIdeal para empezar',
    intermedio: 'Intermedio',
    intermedioDesc: 'Sumas y restas · Números 1–20 · 1,5 seg por número\n⚠ El resultado puede ser negativo',
    experto: 'Experto',
    expertoDesc: 'Sumas y restas · Números −50 a 50 · 1 seg por número\n⚠ El resultado puede ser negativo',
    
    // LEADERBOARD
    ranking: 'Ranking',
    topMarcas: 'Top mejores marcas',
    topGlobal: 'Top 15 Global',
    sinMarcas: 'SIN MARCAS AÚN',
    
    // GAME OVER
    nombreJugador: 'Nombre del jugador',
    guardarYJugarDeNuevo: 'Guardar y jugar de nuevo',
    guardarYVolver: 'Guardar y volver',
    volver: 'Volver',
    pts: 'pts',
    
    // BUTTONS
    jugarDeNuevo: 'Jugar de nuevo',
    
    // COMMON
    velocidadMental: 'Velocidad mental',
    cargando: 'Cargando...',
  },
  en: {
    // MENU
    jugar: 'Play',
    mejoresMarcas: 'Top Scores',
    logros: 'Achievements',
    misEstadisticas: 'My Statistics',
    temas: 'Themes',
    comoJugar: 'How to Play',
    inicio: 'Home',
    
    // LANGUAGE
    idioma: 'Language',
    es: 'Español',
    en: 'English',
    
    // DIFFICULTY
    dificultad: 'Difficulty',
    elegiNivel: 'Choose your challenge level',
    aprendizaje: 'Learning',
    aprendizajeDesc: 'Only additions · Numbers 1–5 · 3 sec per number · No pressure\nIdeal for kids or starting fresh',
    inicial: 'Beginner',
    inicialDesc: 'Only additions · Numbers 1–10 · 2 sec per number\nIdeal to start',
    intermedio: 'Intermediate',
    intermedioDesc: 'Additions and subtractions · Numbers 1–20 · 1.5 sec per number\n⚠ Result can be negative',
    experto: 'Expert',
    expertoDesc: 'Additions and subtractions · Numbers −50 to 50 · 1 sec per number\n⚠ Result can be negative',
    
    // LEADERBOARD
    ranking: 'Ranking',
    topMarcas: 'Top scores',
    topGlobal: 'Global Top 15',
    sinMarcas: 'NO SCORES YET',
    
    // GAME OVER
    nombreJugador: 'Player name',
    guardarYJugarDeNuevo: 'Save and play again',
    guardarYVolver: 'Save and return',
    volver: 'Back',
    pts: 'pts',
    
    // BUTTONS
    jugarDeNuevo: 'Play again',
    
    // COMMON
    velocidadMental: 'Mental speed',
    cargando: 'Loading...',
  }
};

// ================================================================
// LANGUAGE HELPER
// ================================================================
let currentLanguage = localStorage.getItem('cf_language') || 'es';

function t(key) {
  return i18n[currentLanguage]?.[key] || i18n['es']?.[key] || key;
}

function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('cf_language', lang);
  location.reload(); // Recargar para aplicar cambios
}

// ================================================================
// FIREBASE HELPERS (Compat SDK - lo que usa Truco)
// ================================================================

// Importamos Firebase desde CDN en el HTML
let db = null;

async function initFirebase() {
  if (typeof firebase === 'undefined') {
    console.error('Firebase no cargó');
    return;
  }
  
  const app = firebase.initializeApp(firebaseConfig);
  db = firebase.firestore(app);
  console.log('Firebase inicializado');
}

async function submitScoreToFirebase(playerName, difficulty, level, score) {
  if (!db) {
    console.warn('Firebase no está inicializado');
    return;
  }

  try {
    // Obtener país por IP (usando ipapi.co - gratis)
    let country = 'AR';
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      country = data.country_code || 'AR';
    } catch (e) {
      console.warn('No se pudo obtener país', e);
    }

    await db.collection('cf_scores').add({
      playerName: playerName,
      difficulty: difficulty,
      level: level,
      score: score,
      country: country,
      timestamp: new Date(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    console.log('Score guardado en Firebase');
  } catch (error) {
    console.error('Error guardando score:', error);
  }
}

async function getLeaderboard(difficulty = null) {
  if (!db) {
    console.warn('Firebase no está inicializado');
    return [];
  }

  try {
    let query = db.collection('cf_scores').orderBy('score', 'desc').limit(15);
    
    if (difficulty) {
      query = query.where('difficulty', '==', difficulty);
    }

    const snapshot = await query.get();
    const scores = [];
    snapshot.forEach(doc => {
      scores.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return scores;
  } catch (error) {
    console.error('Error obteniendo leaderboard:', error);
    return [];
  }
}
