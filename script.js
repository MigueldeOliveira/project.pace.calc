// ════════════════════════════════════════
//  FIREBASE CONFIG
// ════════════════════════════════════════
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBphQYBSwJFakKoaouhHjSG4D08ts_BgCY",
  authDomain: "projctcalc.firebaseapp.com",
  projectId: "projctcalc",
  storageBucket: "projctcalc.firebasestorage.app",
  messagingSenderId: "902277892499",
  appId: "1:902277892499:web:a522a45f13b7b666f34066",
  measurementId: "G-FESX9YGMT9"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

let currentUser = null;

// ════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════
onAuthStateChanged(auth, user => {
  if (user) {
    currentUser = user;
    document.getElementById('login-screen').style.display  = 'none';
    document.getElementById('app-screen').style.display    = '';
    // populate topbar
    const av = user.photoURL || 'https://api.dicebear.com/7.x/initials/svg?seed=' + user.displayName;
    document.getElementById('user-avatar').src    = av;
    document.getElementById('dropdown-avatar').src = av;
    const firstName = (user.displayName || 'Usuário').split(' ')[0];
    document.getElementById('user-name-short').textContent = firstName;
    document.getElementById('dropdown-name').textContent   = user.displayName || 'Usuário';
    document.getElementById('dropdown-email').textContent  = user.email || '';
    loadDashboard();
  } else {
    currentUser = null;
    document.getElementById('login-screen').style.display  = '';
    document.getElementById('app-screen').style.display    = 'none';
  }
});

window.loginGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    errEl.textContent = '⚠ Erro ao fazer login: ' + e.message;
  }
};

window.logout = async () => {
  await signOut(auth);
  document.getElementById('user-dropdown').classList.remove('open');
};

window.toggleUserMenu = () => {
  document.getElementById('user-dropdown').classList.toggle('open');
};

document.addEventListener('click', e => {
  const menu = document.getElementById('user-menu');
  if (menu && !menu.contains(e.target)) {
    document.getElementById('user-dropdown').classList.remove('open');
  }
});

// ════════════════════════════════════════
//  NAVIGATION
// ════════════════════════════════════════
window.showSection = (sec) => {
  document.getElementById('section-calc').style.display      = sec === 'calc'      ? '' : 'none';
  document.getElementById('section-dashboard').style.display = sec === 'dashboard' ? '' : 'none';
  document.querySelectorAll('.nav-btn').forEach((b, i) => {
    b.classList.toggle('active', (i === 0 && sec === 'calc') || (i === 1 && sec === 'dashboard'));
  });
  if (sec === 'dashboard') loadDashboard();
};

// ════════════════════════════════════════
//  SPORT / TAB SWITCH
// ════════════════════════════════════════
window.setSport = (sport, el) => {
  document.querySelectorAll('.sport-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  const inner = document.getElementById('app-inner');
  inner.className = 'page ' + sport + '-mode';
  document.getElementById('section-running').style.display  = sport === 'running' ? '' : 'none';
  document.getElementById('section-cycling').style.display  = sport === 'cycling' ? '' : 'none';
};

window.switchTab = (sport, tab, el) => {
  const sId = sport === 'r' ? 'running' : 'cycling';
  document.querySelectorAll(`#tabs-${sId} .tab`).forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll(`#section-${sId} .panel`).forEach(p => p.classList.remove('active'));
  document.getElementById((sport === 'r' ? 'r' : 'c') + '-' + tab).classList.add('active');
};

// ════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════
function toSec(h, m, s) { return (parseInt(h)||0)*3600 + (parseInt(m)||0)*60 + (parseInt(s)||0); }

function fmtTime(sec) {
  const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60), s = Math.round(sec%60);
  if (h > 0) return `${h}h ${String(m).padStart(2,'0')}min`;
  return `${m}min ${String(s).padStart(2,'0')}s`;
}

function fmtPace(spk) {
  const m = Math.floor(spk/60), s = Math.round(spk%60);
  return `${m}:${String(s).padStart(2,'0')}`;
}

function show(id, v) { document.getElementById(id).classList.toggle('show', v); }

function animNum(el, end, dur=700) {
  const t0 = performance.now(), isFloat = String(end).includes('.');
  (function tick(now) {
    const p = Math.min((now-t0)/dur,1), e = 1-Math.pow(1-p,3);
    el.textContent = isFloat ? (e*parseFloat(end)).toFixed(1) : Math.round(e*end);
    if (p<1) requestAnimationFrame(tick); else el.textContent = end;
  })(t0);
}

window.updateIBar = (barId, selId) => {
  document.getElementById(barId).style.width = (parseFloat(document.getElementById(selId).value)*100)+'%';
};

function vamCategory(v) {
  if (v>=1600) return '🏆 Elite'; if (v>=1300) return '💪 Avançado';
  if (v>=1000) return '📈 Intermediário'; if (v>=700) return '🟢 Iniciante+';
  return '🔵 Iniciante';
}
function speedCategory(k) {
  if (k>=40) return '🏆 Elite'; if (k>=30) return '💪 Avançado';
  if (k>=22) return '📈 Intermediário'; if (k>=15) return '🟢 Iniciante+';
  return '🔵 Iniciante';
}

// ════════════════════════════════════════
//  CALCULATORS — RUNNING
// ════════════════════════════════════════
window.calcRPace = () => {
  const dist=parseFloat(document.getElementById('rp-dist').value);
  const sec=toSec(document.getElementById('rp-h').value,document.getElementById('rp-m').value,document.getElementById('rp-s').value);
  show('rp-res',false); show('rp-err',false);
  if(!dist||dist<=0||sec<=0){show('rp-err',true);return;}
  document.getElementById('rp-val').textContent=fmtPace(sec/dist);
  document.getElementById('rp-speed').textContent=(dist/(sec/3600)).toFixed(1)+' km/h';
  document.getElementById('rp-time').textContent=fmtTime(sec);
  show('rp-res',true);
};

window.calcRTempo = () => {
  const dist=parseFloat(document.getElementById('rt-dist').value);
  const pace=(parseInt(document.getElementById('rt-pm').value)||0)*60+(parseInt(document.getElementById('rt-ps').value)||0);
  show('rt-res',false); show('rt-err',false);
  if(!dist||dist<=0||pace<=0){show('rt-err',true);return;}
  document.getElementById('rt-val').textContent=fmtTime(pace*dist);
  document.getElementById('rt-dist-out').textContent=dist+' km';
  document.getElementById('rt-speed').textContent=(3600/pace).toFixed(1)+' km/h';
  show('rt-res',true);
};

window.calcRCal = () => {
  const peso=parseFloat(document.getElementById('rc-peso').value);
  const dist=parseFloat(document.getElementById('rc-dist').value);
  const intens=document.getElementById('rc-intens').value;
  show('rc-res',false); show('rc-err',false);
  if(!peso||!dist||peso<=0||dist<=0){show('rc-err',true);return;}
  const met={'0.3':6,'0.5':9,'0.7':11,'0.9':14}[intens]||9;
  const vel={'0.3':8,'0.5':10,'0.7':12.5,'0.9':15}[intens]||10;
  const kcal=Math.round(met*peso*(dist/vel));
  show('rc-res',true);
  animNum(document.getElementById('rc-val'),kcal);
  document.getElementById('rc-perkm').textContent=(kcal/dist).toFixed(1)+' kcal';
  document.getElementById('rc-dist-out').textContent=dist+' km';
};

window.calcRVel = () => {
  const dist=parseFloat(document.getElementById('rv-dist').value);
  const sec=toSec(document.getElementById('rv-h').value,document.getElementById('rv-m').value,document.getElementById('rv-s').value);
  show('rv-res',false); show('rv-err',false);
  if(!dist||dist<=0||sec<=0){show('rv-err',true);return;}
  document.getElementById('rv-val').textContent=(dist/(sec/3600)).toFixed(1);
  document.getElementById('rv-pace').textContent=fmtPace(sec/dist)+' /km';
  document.getElementById('rv-time').textContent=fmtTime(sec);
  show('rv-res',true);
};

// ════════════════════════════════════════
//  CALCULATORS — CYCLING
// ════════════════════════════════════════
window.calcVAM = () => {
  const alt=parseFloat(document.getElementById('vam-alt').value);
  const sec=toSec(document.getElementById('vam-h').value,document.getElementById('vam-m').value,document.getElementById('vam-s').value);
  const dist=parseFloat(document.getElementById('vam-dist').value)||0;
  show('vam-res',false); show('vam-err',false);
  if(!alt||alt<=0||sec<=0){show('vam-err',true);return;}
  const vam=Math.round(alt/(sec/3600));
  show('vam-res',true);
  animNum(document.getElementById('vam-val'),vam);
  document.getElementById('vam-cat').textContent=vamCategory(vam);
  document.getElementById('vam-grad').textContent=dist>0?((alt/(dist*1000))*100).toFixed(1)+'%':'—';
  document.getElementById('vam-speed').textContent=dist>0?(dist/(sec/3600)).toFixed(1)+' km/h':'—';
};

window.calcVMedia = () => {
  const dist=parseFloat(document.getElementById('vm-dist').value);
  const sec=toSec(document.getElementById('vm-h').value,document.getElementById('vm-m').value,document.getElementById('vm-s').value);
  show('vm-res',false); show('vm-err',false);
  if(!dist||dist<=0||sec<=0){show('vm-err',true);return;}
  const kmh=parseFloat((dist/(sec/3600)).toFixed(1));
  show('vm-res',true);
  animNum(document.getElementById('vm-val'),kmh);
  document.getElementById('vm-pace').textContent=fmtPace(sec/dist)+' /km';
  document.getElementById('vm-cat').textContent=speedCategory(kmh);
  document.getElementById('vm-time').textContent=fmtTime(sec);
};

window.calcVMax = () => {
  const dist=parseFloat(document.getElementById('vx-dist').value);
  const sec=toSec(document.getElementById('vx-h').value,document.getElementById('vx-m').value,document.getElementById('vx-s').value);
  show('vx-res',false); show('vx-err',false);
  if(!dist||dist<=0||sec<=0){show('vx-err',true);return;}
  const kmh=parseFloat((dist/(sec/3600)).toFixed(1));
  show('vx-res',true);
  animNum(document.getElementById('vx-val'),kmh);
  document.getElementById('vx-nivel').textContent=speedCategory(kmh);
  document.getElementById('vx-pace').textContent=fmtPace(sec/dist)+' /km';
};

window.calcCPace = () => {
  const dist=parseFloat(document.getElementById('cp-dist').value);
  const sec=toSec(document.getElementById('cp-h').value,document.getElementById('cp-m').value,document.getElementById('cp-s').value);
  show('cp-res',false); show('cp-err',false);
  if(!dist||dist<=0||sec<=0){show('cp-err',true);return;}
  document.getElementById('cp-val').textContent=fmtPace(sec/dist);
  document.getElementById('cp-speed').textContent=(dist/(sec/3600)).toFixed(1)+' km/h';
  document.getElementById('cp-time').textContent=fmtTime(sec);
  show('cp-res',true);
};

window.calcCCal = () => {
  const peso=parseFloat(document.getElementById('cc-peso').value);
  const dist=parseFloat(document.getElementById('cc-dist').value);
  const intens=document.getElementById('cc-intens').value;
  show('cc-res',false); show('cc-err',false);
  if(!peso||!dist||peso<=0||dist<=0){show('cc-err',true);return;}
  const met={'0.3':4,'0.5':6,'0.7':8,'0.9':10}[intens]||6;
  const vel={'0.3':13,'0.5':17.5,'0.7':22.5,'0.9':28}[intens]||17.5;
  const kcal=Math.round(met*peso*(dist/vel));
  show('cc-res',true);
  animNum(document.getElementById('cc-val'),kcal);
  document.getElementById('cc-perkm').textContent=(kcal/dist).toFixed(1)+' kcal';
  document.getElementById('cc-dist-out').textContent=dist+' km';
};

// ════════════════════════════════════════
//  SAVE RESULT TO FIRESTORE
// ════════════════════════════════════════

// Map to collect result values per calculator prefix
const resultMap = {
  rp:  () => ({ value: document.getElementById('rp-val').textContent, unit:'min/km', dist: parseFloat(document.getElementById('rp-dist').value)||0, kcal:0 }),
  rt:  () => ({ value: document.getElementById('rt-val').textContent, unit:'', dist: parseFloat(document.getElementById('rt-dist').value)||0, kcal:0 }),
  rc:  () => ({ value: document.getElementById('rc-val').textContent, unit:'kcal', dist: parseFloat(document.getElementById('rc-dist').value)||0, kcal: parseFloat(document.getElementById('rc-val').textContent)||0 }),
  rv:  () => ({ value: document.getElementById('rv-val').textContent, unit:'km/h', dist: parseFloat(document.getElementById('rv-dist').value)||0, kcal:0 }),
  vam: () => ({ value: document.getElementById('vam-val').textContent, unit:'m/h', dist: parseFloat(document.getElementById('vam-dist').value)||0, kcal:0 }),
  vm:  () => ({ value: document.getElementById('vm-val').textContent, unit:'km/h', dist: parseFloat(document.getElementById('vm-dist').value)||0, kcal:0 }),
  vx:  () => ({ value: document.getElementById('vx-val').textContent, unit:'km/h', dist: parseFloat(document.getElementById('vx-dist').value)||0, kcal:0 }),
  cp:  () => ({ value: document.getElementById('cp-val').textContent, unit:'min/km', dist: parseFloat(document.getElementById('cp-dist').value)||0, kcal:0 }),
  cc:  () => ({ value: document.getElementById('cc-val').textContent, unit:'kcal', dist: parseFloat(document.getElementById('cc-dist').value)||0, kcal: parseFloat(document.getElementById('cc-val').textContent)||0 }),
};

window.saveResult = async (label, prefix) => {
  if (!currentUser) return;
  const data = resultMap[prefix]?.();
  if (!data || data.value === '—') { showToast('⚠ Calcule primeiro!'); return; }
  try {
    await addDoc(collection(db,'users',currentUser.uid,'history'), {
      label, ...data,
      createdAt: serverTimestamp()
    });
    showToast('✅ Salvo no histórico!');
  } catch(e) { showToast('❌ Erro ao salvar.'); }
};

// ════════════════════════════════════════
//  DASHBOARD
// ════════════════════════════════════════
async function loadDashboard() {
  if (!currentUser) return;
  await Promise.all([loadHistory(), loadGoals(), loadWeights()]);
}

// ── HISTORY ──
async function loadHistory() {
  const q = query(collection(db,'users',currentUser.uid,'history'), orderBy('createdAt','desc'));
  const snap = await getDocs(q);
  const list = document.getElementById('history-list');
  if (snap.empty) { list.innerHTML='<div class="empty-state">Nenhum treino salvo. Use as calculadoras e clique em 💾!</div>'; updateSummary([]); return; }
  const items = snap.docs.map(d=>({id:d.id,...d.data()}));
  updateSummary(items);
  list.innerHTML = items.map(item=>`
    <div class="history-item">
      <div class="hi-left">
        <span class="hi-icon">${item.label.includes('Ciclismo')||item.label.includes('VAM')||item.label.includes('Velocidade M')||item.label.includes('Máxima')?'🚴':'🏃'}</span>
        <div>
          <div class="hi-type">${item.label}</div>
          <div class="hi-date">${item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString('pt-BR') : 'Agora'}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="hi-value">${item.value} ${item.unit}</span>
        <button class="hi-delete" onclick="deleteHistoryItem('${item.id}')">✕</button>
      </div>
    </div>
  `).join('');
}

function updateSummary(items) {
  document.getElementById('total-treinos').textContent = items.length;
  document.getElementById('total-km').textContent = items.reduce((a,i)=>a+(i.dist||0),0).toFixed(1);
  document.getElementById('total-kcal').textContent = items.reduce((a,i)=>a+(i.kcal||0),0);
}

window.deleteHistoryItem = async (id) => {
  await deleteDoc(doc(db,'users',currentUser.uid,'history',id));
  loadHistory();
  showToast('🗑 Removido!');
};

window.clearHistory = async () => {
  if (!confirm('Limpar todo o histórico?')) return;
  const snap = await getDocs(collection(db,'users',currentUser.uid,'history'));
  await Promise.all(snap.docs.map(d=>deleteDoc(d.ref)));
  loadHistory();
  showToast('🗑 Histórico limpo!');
};

// ── GOALS ──
window.openGoalModal = () => {
  document.getElementById('goal-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('goal-modal').classList.add('open');
};

window.saveGoal = async () => {
  const desc = document.getElementById('goal-desc').value.trim();
  const date = document.getElementById('goal-date').value;
  if (!desc) { showToast('⚠ Descreva a meta!'); return; }
  await addDoc(collection(db,'users',currentUser.uid,'goals'), { desc, date, done:false, createdAt: serverTimestamp() });
  closeModal('goal-modal');
  document.getElementById('goal-desc').value='';
  loadGoals();
  showToast('🎯 Meta salva!');
};

async function loadGoals() {
  const snap = await getDocs(query(collection(db,'users',currentUser.uid,'goals'), orderBy('createdAt','desc')));
  const list = document.getElementById('goals-list');
  if (snap.empty) { list.innerHTML='<div class="empty-state">Nenhuma meta ainda. Adicione sua primeira! 🎯</div>'; return; }
  list.innerHTML = snap.docs.map(d=>{
    const g={id:d.id,...d.data()};
    return `<div class="goal-item ${g.done?'done':''}">
      <div>
        <div class="goal-text">${g.desc}</div>
        ${g.date?`<div class="goal-date">📅 Prazo: ${new Date(g.date+'T00:00:00').toLocaleDateString('pt-BR')}</div>`:''}
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <button class="goal-done" onclick="toggleGoal('${g.id}',${!g.done})">${g.done?'↩ Reabrir':'✓ Concluir'}</button>
        <button class="hi-delete" onclick="deleteGoal('${g.id}')">✕</button>
      </div>
    </div>`;
  }).join('');
}

window.toggleGoal = async (id, val) => {
  const { updateDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
  await updateDoc(doc(db,'users',currentUser.uid,'goals',id),{done:val});
  loadGoals();
};

window.deleteGoal = async (id) => {
  await deleteDoc(doc(db,'users',currentUser.uid,'goals',id));
  loadGoals();
};

// ── WEIGHT ──
window.openWeightModal = () => {
  document.getElementById('weight-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('weight-modal').classList.add('open');
};

window.saveWeight = async () => {
  const val = parseFloat(document.getElementById('weight-val').value);
  const date = document.getElementById('weight-date').value;
  if (!val||val<=0) { showToast('⚠ Informe o peso!'); return; }
  await addDoc(collection(db,'users',currentUser.uid,'weights'), { kg:val, date, createdAt: serverTimestamp() });
  closeModal('weight-modal');
  document.getElementById('weight-val').value='';
  loadWeights();
  showToast('⚖️ Peso registrado!');
};

async function loadWeights() {
  const snap = await getDocs(query(collection(db,'users',currentUser.uid,'weights'), orderBy('createdAt','desc')));
  const list = document.getElementById('weight-list');
  if (snap.empty) { list.innerHTML='<div class="empty-state">Nenhum registro de peso ainda.</div>'; return; }
  list.innerHTML = snap.docs.map(d=>{
    const w={id:d.id,...d.data()};
    return `<div class="weight-item">
      <div>
        <div class="wi-kg">${w.kg} kg</div>
        <div class="wi-date">${w.date ? new Date(w.date+'T00:00:00').toLocaleDateString('pt-BR') : ''}</div>
      </div>
      <button class="hi-delete" onclick="deleteWeight('${w.id}')">✕</button>
    </div>`;
  }).join('');
}

window.deleteWeight = async (id) => {
  await deleteDoc(doc(db,'users',currentUser.uid,'weights',id));
  loadWeights();
};

// ════════════════════════════════════════
//  MODALS & TOAST
// ════════════════════════════════════════
window.closeModal = (id) => { document.getElementById(id).classList.remove('open'); };

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2800);
}

// ════════════════════════════════════════
//  INIT
// ════════════════════════════════════════
updateIBar('rc-ibar','rc-intens');
updateIBar('cc-ibar','cc-intens');
