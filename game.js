
const state = {
  episode: null,
  node: 'start',
  memory: {},
  stats: {},
  decisions: [],
  loreUnlocked: [],
  musicOn: true,
  typing: false,
  currentTypingResolve: null
};

function startMenuMusic() {
  playMusic(0);
  document.removeEventListener('click', startMenuMusic);
}

const Auth = {
  KEY: 'chronicles_user',
  
  register(username, password) {
    const users = this.getUsers();
    if (users[username]) return { success: false, msg: 'Username already exists.' };
    users[username] = { password, saves: [], achievements: [] };
    localStorage.setItem('chronicles_users', JSON.stringify(users));
    localStorage.setItem(this.KEY, username);
    return { success: true };
  },
  
  login(username, password) {
    const users = this.getUsers();
    if (!users[username]) return { success: false, msg: 'User not found.' };
    if (users[username].password !== password) return { success: false, msg: 'Wrong password.' };
    localStorage.setItem(this.KEY, username);
    return { success: true };
  },
  
  logout() {
    localStorage.removeItem(this.KEY);
    location.reload();
  },
  
  currentUser() {
    return localStorage.getItem(this.KEY);
  },
  
  getUsers() {
    try { return JSON.parse(localStorage.getItem('chronicles_users') || '{}'); }
    catch { return {}; }
  }
};

const grid = document.querySelector('.menu-bg-grid');

document.addEventListener('mousemove', (e) => {
  const x = (e.clientX / window.innerWidth  - 0.5) * 30; 
  const y = (e.clientY / window.innerHeight - 0.5) * 30;

  grid.style.backgroundPosition = `${x}px ${y}px`;
});

const SaveSystem = {
  SAVE_KEY: 'chronicles_saves',
  SETTINGS_KEY: 'chronicles_settings',

  save(slot = 0) {
    const saves = this.loadAll();
    saves[slot] = {
      episode: state.episode,
      node: state.node,
      memory: { ...state.memory },
      stats: { ...state.stats },
      decisions: [...state.decisions],
      loreUnlocked: [...state.loreUnlocked],
      timestamp: Date.now(),
      episodeTitle: EPISODES[state.episode]?.meta?.title || ''
    };
    try {
      const key = Auth.currentUser() ? 
        'chronicles_saves_' + Auth.currentUser() : 
        this.SAVE_KEY;
      localStorage.setItem(key, JSON.stringify(saves));
      if (slot > 0) notify('✦ PROGRESS SAVED');
    } catch(e) { console.warn("localStorage not available"); }
  },
  
  load(slot = 0) {
    const saves = this.loadAll();
    const save = saves[slot];
    if (!save) return false;
    Object.assign(state, save);
    return true;
  },
  
  loadAll() {
    try {
      const key = Auth.currentUser() ? 
        'chronicles_saves_' + Auth.currentUser() : 
        this.SAVE_KEY;
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch { return []; }
  },
  
  getCompletedEpisodes() {
    try {
      const key = Auth.currentUser()
        ? 'chronicles_completed_' + Auth.currentUser()
        : 'chronicles_completed';
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch { return []; }
  },
  
  markEpisodeComplete(epNum) {
    const completed = this.getCompletedEpisodes();
    if (!completed.includes(epNum)) {
      completed.push(epNum);
      try {
        const key = Auth.currentUser()
          ? 'chronicles_completed_' + Auth.currentUser()
          : 'chronicles_completed';
        localStorage.setItem(key, JSON.stringify(completed));
      } catch(e) {}
    }
  }
};

const Achievements = {
  KEY: 'chronicles_achievements',
  
  DEFS: [
    { id: 'first_choice', title: 'First Words', desc: 'Made your first decision.', icon: '✦' },
    { id: 'truth_seeker', title: 'Truth Seeker', desc: 'Decoded the signal in Episode 1.', icon: '⚡' },
    { id: 'mercy', title: 'Mercy', desc: 'Let ECHO-7 live.', icon: '∞' },
    { id: 'cartographer', title: 'The Weight of Maps', desc: 'Completed Episode 4.', icon: '🗺' },
    { id: 'all_episodes', title: 'Chronicler', desc: 'Completed all five episodes.', icon: '◈' },
    { id: 'high_honor', title: 'Unbroken', desc: 'Finished Episode 2 with honor ≥ 80.', icon: '⚔' },
    { id: 'puzzle_master', title: 'Puzzle Master', desc: 'Solved 10 puzzles without errors.', icon: '🔐' },
    { id: 'oracle', title: 'The Oracle Was Right', desc: 'Answered the riddle correctly first try.', icon: '🌀' },
    { id: 'archivist', title: 'Archivist', desc: 'Read every lore entry in one episode.', icon: '📖' },
    { id: 'signal', title: 'I Heard Something', desc: 'In Episode 1, listened before acting.', icon: '◉' }
  ],
  
  unlock(id) {
    const unlocked = this.getUnlocked();
    if (unlocked.includes(id)) return;
    unlocked.push(id);
    try {
      localStorage.setItem(this.KEY, JSON.stringify(unlocked));
    } catch(e) {}
    const def = this.DEFS.find(d => d.id === id);
    if (def) this.showBanner(def);
  },
  
  getUnlocked() {
    try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); }
    catch { return []; }
  },
  
  showBanner(def) {
    const banner = document.createElement('div');
    banner.className = 'achievement-banner';
    banner.innerHTML = `
      <span class="achievement-icon">${def.icon}</span>
      <div>
        <div class="achievement-title">ACHIEVEMENT UNLOCKED</div>
        <div class="achievement-name">${def.title}</div>
        <div class="achievement-desc">${def.desc}</div>
      </div>
    `;
    document.body.appendChild(banner);
    requestAnimationFrame(() => banner.classList.add('show'));
    setTimeout(() => {
      banner.classList.remove('show');
      setTimeout(() => banner.remove(), 600);
    }, 4000);
  }
};

const Settings = {
  current: {
    textSpeed: 22,
    particles: true,
    atmosphere: true,
    musicVol: 0.25,
    ambientVol: 0.5
  },
  load() {
    try {
      const s = JSON.parse(localStorage.getItem('chronicles_settings'));
      if (s) Object.assign(this.current, s);
    } catch(e) {}
    this.applyToUI();
  },
  save() {
    this.current.textSpeed = parseInt(document.getElementById('set_textSpeed').value) || 22;
    this.current.particles = document.getElementById('set_particles').checked;
    this.current.atmosphere = document.getElementById('set_atmosphere').checked;
    this.current.musicVol = parseFloat(document.getElementById('set_musicVol').value) ?? 0.25;
    this.current.ambientVol = parseFloat(document.getElementById('set_ambientVol').value) ?? 0.5;
    try {
      localStorage.setItem('chronicles_settings', JSON.stringify(this.current));
    } catch(e) {}
    if (!this.current.particles) clearParticles();
    else if (state.episode) setupParticles(state.episode);
    const bgm = document.getElementById('bgm');
    if (bgm)  {
      bgm.volume = this.current.musicVol;
      bgm.muted = this.current.musicVol === 0;
    }
    if (this.current.musicVol > 0 && bgm.paused && state.episode !== null) {
      bgm.play().catch(() => {});
    }
  },
  applyToUI() {
    if (!document.getElementById('set_textSpeed')) return;
    document.getElementById('set_textSpeed').value = this.current.textSpeed;
    document.getElementById('set_particles').checked = this.current.particles;
    document.getElementById('set_atmosphere').checked = this.current.atmosphere;
    document.getElementById('set_musicVol').value = this.current.musicVol;
    document.getElementById('set_ambientVol').value = this.current.ambientVol;
  }
};

window.openSettings = () => { Settings.load(); document.getElementById('settingsOverlay').style.display='block'; };
window.closeSettings = () => { document.getElementById('settingsOverlay').style.display='none'; };
window.openGallery = () => { renderGallery(); document.getElementById('galleryOverlay').style.display='block'; };
window.closeGallery = () => { document.getElementById('galleryOverlay').style.display='none'; };

function renderGallery() {
  const container = document.getElementById('galleryContent');
  const unlocked = Achievements.getUnlocked();
  container.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
      ${Achievements.DEFS.map(d => `
        <div style="padding:1rem;border:1px solid ${unlocked.includes(d.id)?'var(--gold)':'#333'};opacity:${unlocked.includes(d.id)?1:0.5}">
          <div style="font-size:1.5rem;margin-bottom:0.5rem;">${unlocked.includes(d.id)?d.icon:'?'}</div>
          <div style="color:var(--gold);font-family:'Cinzel',serif;">${d.title}</div>
          <div style="font-size:0.8rem;color:var(--text-dim);">${d.desc}</div>
        </div>
      `).join('')}
    </div>
  `;
}

const BG = {
  space_nebula: 'https://images.unsplash.com/photo-1462332420958-a05d1e002413?w=1920&q=80',
  space_corridor: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1920&q=80',
  space_cockpit: 'https://images.unsplash.com/photo-1454789548928-9efd52dc4031?w=1920&q=80',
  castle_hall: 'https://images.unsplash.com/photo-1616432725307-b93cc6098dc5?w=1920&q=80',
  castle_throne: 'https://images.unsplash.com/photo-1661006117323-f27c39432e05?w=1920&q=80',
  forest_dark: 'https://images.unsplash.com/photo-1475070929565-c985b496cb9f?w=1920&q=80',
  lab_dark: 'https://images.unsplash.com/photo-1732454827988-95972d793f1b?w=1920&q=80',
  lab_corridor: 'https://images.unsplash.com/photo-1685107306307-147226ea476f?w=1920&q=80',
  ruins: 'https://images.unsplash.com/photo-1601231439751-b0fe5ab6f8b8?w=1920&q=80',
  station_core: 'https://images.unsplash.com/photo-1654280983312-110b5b422397?w=1920&q=80',
  observatory: 'https://images.unsplash.com/photo-1505579962197-df174377e13f?w=1920&q=80',
  void_archive: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=1920&q=80',
  dust_town: 'https://images.unsplash.com/photo-1615909568883-ade26282c805?w=1920&q=80',
  courthouse: 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=1920&q=80',
  gallows: 'https://images.unsplash.com/photo-1687054419514-744a33aab4b6?w=1920&q=80',
};

const CHARS = {
  'Commander Vasquez': { init: 'CV', color: '#1a3a5c' },
  'Dr. Osei': { init: 'DO', color: '#0d4a3a' },
  'ARIA': { init: 'AI', color: '#3a1a4a' },
  'The Signal': { init: '??', color: '#4a1a0a' },
  'King Aldric': { init: 'KA', color: '#5c3a1a' },
  'Lady Seraphine': { init: 'LS', color: '#3a1a3a' },
  'Theron': { init: 'TH', color: '#1a3a1a' },
  'The Oracle': { init: 'OR', color: '#4a3a0a' },
  'Dr. Kira Malone': { init: 'KM', color: '#1a3a5c' },
  'ECHO-7': { init: 'E7', color: '#2a0a2a' },
  'The Voice': { init: '∅∅', color: '#4a0a0a' },
  'Narrator': { init: '…', color: '#2a2a2a' },
  'MIRA': { init: 'MR', color: '#2b5c5c' },
  'ATLAS': { init: 'AT', color: '#5c4033' },
  'Councilor Yenn': { init: 'CY', color: '#3d2b1f' },
  'The Signal Echo': { init: 'SE', color: '#2a1a3a' },
  'Judge Mira Ashford': { init: 'MA', color: '#4a2c2c' },
  'Cael Harrow': { init: 'CH', color: '#5c4a3d' },
  'Dani Sole': { init: 'DS', color: '#2f4f4f' },
  'The Courthouse': { init: '🏛', color: '#1a1a1a' }
};

const ep1 = {
  meta: {
    num: 'EPISODE 01', title: 'The Last Signal',
    desc: 'Something is out there. Something is waiting.',
    stats: { trust: 50, fuel: 100, crew: 3 },
    lore: [
      { title: 'The Helix-9 Incident', text: 'Three years ago, the colony ship Helix-9 vanished near Sector 7. No wreckage. No survivors. Only a recurring mathematical sequence transmitted on all frequencies.' },
      { title: 'ARIA System', text: 'ARIA (Adaptive Response Intelligence Architecture) was installed on the Ptolemy as an emergency navigation and threat assessment system. She is not — officially — capable of emotion.' },
      { title: 'The Signal', text: 'A distress beacon of unknown origin has been active for 11 days. Standard protocol would be to investigate. Standard protocol did not anticipate what they would find.' }
    ]
  },
  start: {
    chapter: { num: 'CHAPTER ONE', name: 'Awakening', desc: 'Something is pulling you off-course.' },
    bg: BG.space_nebula, tint: 'rgba(10,20,50,0.3)',
    speaker: 'ARIA', role: 'Ship Intelligence',
    text: "Commander. You've been in cryo for fourteen months. I apologize for the abrupt awakening, but we have a situation that requires your judgment.",
    choices: [
      { text: "What's the situation, ARIA?", next: 'ep1_assess', key: 'A' },
      { text: "Wake the crew first. I don't make calls alone.", next: 'ep1_wake_crew', key: 'B', effect: () => nudgeStat('trust', +10) }
    ]
  },
  ep1_assess: {
    bg: BG.space_nebula,
    speaker: 'ARIA', role: 'Ship Intelligence',
    text: "We've intercepted a distress signal from coordinates 7-alpha-9. Sector designation: uncharted. The signal contains a repeating sequence — the same sequence broadcast by the Helix-9 before it vanished. Three years ago.",
    choices: [
      { text: "Plot an intercept course immediately.", next: 'ep1_intercept', key: 'A', effect: () => nudgeStat('trust', -5) },
      { text: "Analyze the signal first. Don't move until we know what we're dealing with.", next: 'ep1_analyze', key: 'B', effect: () => { nudgeStat('trust', +5); state.memory.analyzed = true; } }
    ]
  },
  ep1_wake_crew: {
    bg: BG.space_cockpit,
    speaker: 'Commander Vasquez', role: 'You',
    text: "ARIA, wake Dr. Osei and Lieutenant Chandra. Standard protocols. Nobody panics.",
    choices: [{ text: 'Continue', next: 'ep1_crew_awakes', key: 'A' }]
  },
  ep1_crew_awakes: {
    bg: BG.space_cockpit,
    speaker: 'Dr. Osei', role: 'Chief Science Officer',
    text: "Commander — the signal. I've been running calculations. That sequence isn't random. It's... it's a message. Someone is counting down.",
    choices: [
      { text: "Counting down to what?", next: 'ep1_countdown', key: 'A' },
      { text: "Don't jump to conclusions, Doctor.", next: 'ep1_skeptical', key: 'B', consequence: 'Rational' }
    ]
  },
  ep1_analyze: {
    bg: BG.space_corridor,
    speaker: 'ARIA', role: 'Ship Intelligence',
    text: "Analysis complete. The signal is structured in base-12 mathematics — a system no human civilization uses natively. The origin point matches the last known trajectory of the Helix-9. However... there is an anomaly.",
    choices: [{ text: "What anomaly?", next: 'ep1_anomaly', key: 'A' }]
  },
  ep1_intercept: {
    bg: BG.space_nebula,
    speaker: 'ARIA', role: 'Ship Intelligence',
    text: "Course plotted. ETA: 6 hours, 14 minutes. I should inform you, Commander — the signal has changed since we altered course. It's... responding to our approach. The pattern has accelerated.",
    choices: [{ text: "How is that possible?", next: 'ep1_anomaly', key: 'A' }]
  },
  ep1_countdown: {
    bg: BG.space_corridor,
    speaker: 'ARIA', role: 'Ship Intelligence',
    text: "Dr. Osei is correct. The sequence began at 1,000,000. It decrements by exactly 1,440 every 24 hours. At current rate, it reaches zero in approximately... 3 days. I do not know what occurs at zero.",
    choices: [
      { text: "We need to get there before it reaches zero.", next: 'ep1_rush', key: 'A', effect: () => nudgeStat('fuel', -20), consequence: '⚡ Fuel -20' },
      { text: "Three days is enough time to investigate safely.", next: 'ep1_careful', key: 'B' }
    ]
  },
  ep1_skeptical: {
    bg: BG.space_corridor,
    speaker: 'Dr. Osei', role: 'Chief Science Officer',
    text: "With respect, Commander — I've double-checked every calculation. The sequence is base-12, self-similar, and it's a countdown. This isn't interpretation. This is mathematics.",
    choices: [
      { text: "Fine. What do you need to confirm it?", next: 'ep1_careful', key: 'A' },
      { text: "Then we approach with extreme caution.", next: 'ep1_careful', key: 'B', effect: () => nudgeStat('trust', +5) }
    ]
  },
  ep1_anomaly: {
    bg: BG.space_corridor,
    speaker: 'ARIA', role: 'Ship Intelligence',
    text: "The signal contains embedded coordinates — but not spatial ones. They reference temporal anchors. Specific moments in time. Three of them match dates from Helix-9's mission log. The fourth... matches today.",
    puzzle: { type: 'cipher', next: 'ep1_signal_decoded' }
  },
  ep1_rush: {
    bg: BG.space_nebula,
    speaker: 'Commander Vasquez', role: 'You',
    text: "Full burn. We get there with two days to spare. Whatever's transmitting that signal — we need to look it in the eye.",
    choices: [{ text: 'Continue', next: 'ep1_arrival', key: 'A' }]
  },
  ep1_careful: {
    bg: BG.space_corridor,
    speaker: 'ARIA', role: 'Ship Intelligence',
    text: "Optimal approach vector calculated. We should arrive with 31 hours remaining on the countdown. I am detecting what appears to be debris field ahead. Recommendations?",
    choices: [
      { text: "Navigate through the debris — faster.", next: 'ep1_arrival', key: 'A', effect: () => nudgeStat('crew', -1), consequence: '⚠ Risky' },
      { text: "Go around. Crew safety is non-negotiable.", next: 'ep1_arrival_slow', key: 'B', consequence: '🛡 Safe' }
    ]
  },
  ep1_signal_decoded: {
    bg: BG.space_corridor,
    speaker: 'Dr. Osei', role: 'Chief Science Officer',
    text: "The cipher decodes to a single phrase: COME FIND WHAT YOU LEFT. Someone — something — knows about Helix-9. They know what happened out there. And they want us to come.",
    get choices() {
      return [
        { text: "Then we go. Set course.", next: state.memory.analyzed ? 'ep1_archive' : 'ep1_arrival', key: 'A' },
        { text: "This is a trap. We should turn back.", next: 'ep1_turn_back', key: 'B', consequence: '⚡ Abandon' }
      ]
    }
  },
  ep1_archive: {
    bg: BG.space_corridor,
    speaker: 'ARIA', role: 'Ship Intelligence',
    text: "Before we move, Commander... the decrypted stream contains an archive. Thousands of files. I'm accessing one flagged with our temporal signature. It's a history of Earth, dated 40,000 years in the future. [PAUSE] 'The sky burned, but we remembered the ones who left.' [PAUSE] The file is corrupting. It's gone.",
    choices: [
      { text: "Keep this between us. Set course.", next: 'ep1_arrival', key: 'A', effect: () => { state.memory.prophecy_read = true; } }
    ]
  },
  ep1_arrival: {
    chapter: { num: 'CHAPTER TWO', name: 'First Contact', desc: 'Some doors, once opened, cannot be closed.' },
    bg: BG.space_nebula,
    speaker: 'ARIA', role: 'Ship Intelligence',
    text: "We are in range. Commander... there is no debris. No wreckage of the Helix-9. There is only a single object — approximately 40 meters diameter, perfectly spherical, and radiating an energy signature I cannot classify.",
    choices: [
      { text: "Attempt radio contact.", next: 'ep1_contact', key: 'A' },
      { text: "Scan it fully before we do anything.", next: 'ep1_scan', key: 'B', effect: () => nudgeStat('trust', +10) }
    ]
  },
  ep1_arrival_slow: {
    bg: BG.space_nebula,
    speaker: 'ARIA', role: 'Ship Intelligence',
    text: "The long route added three hours. But we arrive intact. Commander — long-range sensors are picking up the object. It is... not what I expected.",
    choices: [{ text: 'What is it?', next: 'ep1_arrival', key: 'A' }]
  },
  ep1_turn_back: {
    bg: BG.space_corridor,
    speaker: 'ARIA', role: 'Ship Intelligence',
    text: "Course reversed. As we pull away, the countdown accelerates. One hour remaining now. The signal changes — just once — to a single word, repeated: PLEASE. Then silence. Whatever it was... we'll never know.",
    choices: [{ text: 'Return to menu', next: '__menu', key: 'A' }]
  },
  ep1_contact: {
    bg: BG.space_nebula,
    speaker: 'The Signal', role: 'Unknown Entity',
    text: "... hello ... you came ... we remembered your voices ... from before ... from when you were here last ... you do not remember ... but you were here ... you built us ... and then you left ...",
    choices: [
      { text: "We didn't build you. This is our first contact.", next: 'ep1_deny', key: 'A' },
      { text: "What are you?", next: 'ep1_what_are_you', key: 'B' }
    ]
  },
  ep1_scan: {
    bg: BG.space_corridor,
    speaker: 'Dr. Osei', role: 'Chief Science Officer',
    text: "Commander — the internal structure is impossible. It's recursive. Each layer contains a smaller version of itself, all the way down. And there are... organic signatures. Not human. Not anything in our database. But they were once.",
    choices: [
      { text: "They were once what?", next: 'ep1_contact', key: 'A' },
      { text: "Can we communicate?", next: 'ep1_contact', key: 'B' }
    ]
  },
  ep1_deny: {
    bg: BG.space_nebula,
    speaker: 'The Signal', role: 'Unknown Entity',
    text: "... you forget so easily ... you always forget ... we have kept everything ... every word you said ... every promise you made ... forty thousand years ago the ones who wore your faces said they would return ...",
    choices: [
      { text: "This can't be real.", next: 'ep1_crisis', key: 'A' },
      { text: "Show me. Show me the proof.", next: 'ep1_revelation', key: 'B' }
    ]
  },
  ep1_what_are_you: {
    bg: BG.space_nebula,
    speaker: 'The Signal', role: 'Unknown Entity',
    text: "... we are the memory of your children ... you seeded worlds ... you moved on ... we grew ... and we have been waiting ... the countdown was not an end ... it was a beginning ... will you stay this time ...?",
    choices: [
      { text: "We will stay. We will listen.", next: 'ep1_stay', key: 'A', effect: () => nudgeStat('trust', +20), consequence: '★ Ending A' },
      { text: "We need time. We'll return with more.", next: 'ep1_return', key: 'B', consequence: '★ Ending B' }
    ]
  },
  ep1_crisis: {
    bg: BG.space_corridor,
    speaker: 'Dr. Osei', role: 'Chief Science Officer',
    text: "Commander — ARIA is analyzing the data stream being transmitted from the object. It contains DNA sequences. The same sequences as humans. Forty thousand years old. We didn't go out to the stars — we came from them.",
    puzzle: { type: 'riddle', next: 'ep1_revelation' }
  },
  ep1_revelation: {
    bg: BG.space_nebula,
    speaker: 'ARIA', role: 'Ship Intelligence',
    text: "I have processed the complete transmission. It contains the history of seventeen civilizations — all derived from a common seeder species. The Helix-9 crew did not disappear. They chose to stay. Commander. The question is: do you?",
    choices: [
      { text: "We stay. Humanity needs to know the truth.", next: 'ep1_stay', key: 'A', effect: () => nudgeStat('trust', +20), consequence: '★ Ending A' },
      { text: "We go back. This is too much for one crew.", next: 'ep1_return', key: 'B', consequence: '★ Ending B' }
    ]
  },
  ep1_stay: {
    chapter: { num: 'FINALE', name: 'The Memory Keepers', desc: 'Some questions are worth everything.' },
    bg: BG.space_nebula,
    speaker: 'Commander Vasquez', role: 'You',
    text: "We stay. We transmit everything back to Earth on an open channel. Whatever comes next — the whole human race decides together. This doesn't belong to just us. Engage the beacon, ARIA.",
    choices: [{ text: 'Episode Complete — Return to Menu', next: '__menu', key: 'A' }]
  },
  ep1_return: {
    chapter: { num: 'FINALE', name: 'The Careful Ones', desc: 'Wisdom is knowing when not to act.' },
    bg: BG.space_corridor,
    speaker: 'ARIA', role: 'Ship Intelligence',
    text: "Course set for Earth. ETA: 14 months. The sphere follows us — at a distance — for three hours before stopping. As if watching. As if understanding. In our wake, the signal resumes. Patient. Eternal. Waiting for the next crew brave enough to answer.",
    choices: [{ text: 'Episode Complete — Return to Menu', next: '__menu', key: 'A' }]
  }
};

const ep2 = {
  meta: {
    num: 'EPISODE 02', title: 'The Hollow Crown',
    desc: 'Blood will tell. The question is whose.',
    stats: { honor: 60, influence: 40, secrets: 0 },
    lore: [
      { title: 'The Kingdom of Arethon', text: 'A realm balanced between three noble houses for three centuries. The death of King Aldric without a named heir has set those houses against each other — and the common people caught between their ambitions.' },
      { title: 'The True Heir', text: 'You alone possess the sealed letter from King Aldric — written two days before his death. It names an heir. What you do with that knowledge will reshape this kingdom forever.' },
      { title: 'The Oracle of Vel', text: 'Blind since birth, speaking in riddles since she learned to talk. The Oracle has never been wrong — but she has often been misunderstood. She knows what you carry.' }
    ]
  },
  start: {
    chapter: { num: 'CHAPTER ONE', name: 'The Letter', desc: 'The pen is mightier than the crown.' },
    bg: BG.castle_hall, tint: 'rgba(40,10,10,0.3)',
    speaker: 'Narrator', role: 'Chronicle',
    text: "You are Cassia, keeper of the royal seal. In your hand: a letter — unsigned, unwitnessed, but unmistakably in the king's hand. It names a bastard child as the true heir to Arethon. And in three hours, the nobles will vote.",
    choices: [
      { text: "I must find the heir before the vote.", next: 'ep2_find_heir', key: 'A' },
      { text: "The letter must go to the High Council.", next: 'ep2_council', key: 'B', effect: () => nudgeStat('honor', +10) },
      { text: "Burn it. The kingdom can't survive the truth.", next: 'ep2_burn', key: 'C', consequence: '🔥 Dark Path' }
    ]
  },
  ep2_council: {
    bg: BG.castle_hall,
    speaker: 'King Aldric', role: 'The Late King (Memory)',
    text: "I knew you would come forward, Cassia. I chose you as keeper for a reason. The heir is hidden in the lower city — raised as a blacksmith's child. They do not know. But Lady Seraphine does. She has been watching.",
    choices: [
      { text: "Tell me about Lady Seraphine.", next: 'ep2_seraphine_intro', key: 'A' },
      { text: "How do I find the heir safely?", next: 'ep2_find_heir', key: 'B' }
    ]
  },
  ep2_burn: {
    bg: BG.castle_hall,
    speaker: 'Narrator', role: 'Chronicle',
    text: "The parchment curls and blackens. The truth becomes ash. You have just made a choice the kingdom will live with for a century. But as the last ember dies — someone knocks at your door. They saw the smoke.",
    choices: [{ text: "Open the door.", next: 'ep2_caught', key: 'A' }]
  },
  ep2_caught: {
    bg: BG.castle_hall,
    speaker: 'Lady Seraphine', role: 'Head of House Maren',
    text: "I know what you burned, Cassia. Did you think you were the only one the king trusted? I have a copy. The only question remaining is: whose side are you on?",
    puzzle: { type: 'memory', next: 'ep2_seraphine_gambit' }
  },
  ep2_find_heir: {
    bg: BG.forest_dark,
    speaker: 'Theron', role: 'The True Heir',
    text: "You're the third person today to tell me I'm something I'm not. A forge-hand and suddenly — what? A prince? My father built horseshoes. I build horseshoes. Whatever that letter says, it's wrong.",
    choices: [
      { text: "I believe you. But believing won't save you from what's coming.", next: 'ep2_theron_warning', key: 'A' },
      { text: "What if it's not wrong? What if your father was protecting you?", next: 'ep2_theron_truth', key: 'B' }
    ]
  },
  ep2_theron_warning: {
    bg: BG.forest_dark,
    speaker: 'Narrator', role: 'Chronicle',
    text: "Theron's jaw sets. Whatever he believes about his blood, survival is a simpler argument. Three armed riders appear at the road's end — bearing Lady Seraphine's colors.",
    choices: [
      { text: "Run — into the forest.", next: 'ep2_forest_escape', key: 'A', effect: () => nudgeStat('honor', -5) },
      { text: "Stand and face them.", next: 'ep2_confrontation', key: 'B', effect: () => nudgeStat('honor', +10), consequence: '🛡 Bold' }
    ]
  },
  ep2_theron_truth: {
    bg: BG.forest_dark,
    speaker: 'Theron', role: 'The True Heir',
    text: "He used to look at me sometimes — at dinner, or when I'd solved a difficult weld — and his eyes would... go somewhere else. Like he was remembering something painful. I always thought it was grief for my mother. But if what you're saying is true...",
    choices: [
      { text: "Will you come with me? Tonight.", next: 'ep2_theron_agrees', key: 'A', effect: () => nudgeStat('influence', +15) },
      { text: "Take time. Think it through. Meet me at the east gate at dawn.", next: 'ep2_dawn_meeting', key: 'B' }
    ]
  },
  ep2_seraphine_intro: {
    bg: BG.castle_throne,
    speaker: 'Lady Seraphine', role: 'Head of House Maren',
    text: "You want to understand me, Cassia? I'll be direct. I have served this kingdom for thirty years while men with half my intelligence wore its crowns. I do not want power for its vanity. I want it because no one else will use it right.",
    get choices() {
      const arr = [
        { text: "Then help me protect the heir.", next: 'ep2_alliance', key: 'A', effect: () => nudgeStat('secrets', +1) },
        { text: "You'd undermine a king's dying wish for your ambition.", next: 'ep2_seraphine_enemy', key: 'B' }
      ];
      if (state.stats.honor >= 65) {
        arr.push({ text: "You speak of service. Prove it to me.", next: 'ep2_midnight', key: 'C', consequence: '📖 Journal' });
      }
      return arr;
    }
  },
  ep2_midnight: {
    bg: BG.castle_throne, tint: 'rgba(20,20,40,0.5)',
    speaker: 'Lady Seraphine', role: 'Head of House Maren',
    text: "She pauses, measuring you. Then she unlocks a heavy drawer and slides a leather-bound book across the table. Thirty years of ledgers. Thirty years of holding the kingdom together in secret while the kings drank and warred. 'I don't want a throne,' she says softly. 'I want it to stop falling apart.'",
    choices: [
      { text: "I understand. I'll help you.", next: 'ep2_alliance', key: 'A', effect: () => { nudgeStat('secrets', +5); state.memory.seraphine_ally = true; } },
      { text: "This justifies nothing. You still want control.", next: 'ep2_seraphine_enemy', key: 'B' }
    ]
  },
  ep2_alliance: {
    bg: BG.castle_throne,
    speaker: 'Lady Seraphine', role: 'Head of House Maren',
    text: "An alliance. Interesting. I'll share what I know: the heir is already being moved. My people found them first. But they are... uncooperative. And there is a price for my cooperation.",
    puzzle: { type: 'riddle', next: 'ep2_seraphine_gambit' }
  },
  ep2_seraphine_gambit: {
    bg: BG.castle_throne,
    speaker: 'Lady Seraphine', role: 'Head of House Maren',
    text: "You have more wit than I credited, Cassia. Very well. I will support the heir — under one condition. I become Regent until they come of age. Five years of my guidance, then a crown to a king prepared to use it. Agreed?",
    choices: [
      { text: "Agreed. The kingdom needs stability.", next: 'ep2_ending_regency', key: 'A', consequence: '★ Ending A', effect: () => nudgeStat('influence', +20) },
      { text: "No. The heir rules with a council — you included. But not as Regent.", next: 'ep2_ending_council', key: 'B', consequence: '★ Ending B', effect: () => nudgeStat('honor', +15) }
    ]
  },
  ep2_forest_escape: {
    bg: BG.forest_dark,
    speaker: 'Theron', role: 'The True Heir',
    text: "We run for what feels like hours. The forest swallows us whole. When we finally stop, breathless, Theron looks at you with something new in his eyes. Not belief — not yet. But possibility.",
    choices: [{ text: "Keep moving. The Oracle can help us.", next: 'ep2_oracle', key: 'A' }]
  },
  ep2_confrontation: {
    bg: BG.forest_dark,
    speaker: 'Lady Seraphine', role: 'Head of House Maren',
    text: "The riders stop. Their captain looks at you, then at Theron, then back. She — unexpectedly — sheathes her blade. 'Lady Seraphine said: if the keeper stands beside him willingly, let them pass. She's testing you both.'",
    choices: [{ text: "Then we've passed. Take us to her.", next: 'ep2_seraphine_gambit', key: 'A' }]
  },
  ep2_theron_agrees: {
    bg: BG.forest_dark,
    speaker: 'Theron', role: 'The True Heir',
    text: "He takes one look at the forge — the anvil his father's hands wore smooth — and walks away without looking back. 'Tell me what I need to know,' he says. 'All of it. And don't soften it.'",
    choices: [{ text: "Bring him to the Oracle.", next: 'ep2_oracle', key: 'A' }]
  },
  ep2_dawn_meeting: {
    bg: BG.forest_dark,
    speaker: 'Narrator', role: 'Chronicle',
    text: "Dawn comes. The east gate is empty. You wait. An hour passes. Then a note: 'I'll come when I'm ready. Don't push a man into a crown he didn't ask for.' Signed with a hammer — his family's mark. Theron will choose his own time.",
    choices: [
      { text: "Respect it. Go to the Oracle alone.", next: 'ep2_oracle', key: 'A', effect: () => nudgeStat('honor', +10) },
      { text: "The vote is today. We don't have time.", next: 'ep2_vote_without', key: 'B' }
    ]
  },
  ep2_oracle: {
    chapter: { num: 'CHAPTER TWO', name: 'The Oracle\'s Price', desc: 'Truth costs more than you carry.' },
    bg: BG.ruins,
    speaker: 'The Oracle', role: 'Seer of Vel',
    text: "I see you, Cassia. I see what you carry, and what you've burned, and what you've promised. The heir will sit the throne — or the throne will fall. Those are the only paths remaining. But first... you must answer for me.",
    puzzle: { type: 'riddle', question: 'What crown weighs nothing, yet crushes all who wear it?', options: ['Gold', 'Duty', 'Power', 'Ambition'], answer: 1, next: 'ep2_oracle_answer' }
  },
  ep2_oracle_answer: {
    bg: BG.ruins,
    speaker: 'The Oracle', role: 'Seer of Vel',
    text: "Duty. Yes. The heir already knows this — they knew it before you found them. The letter was never the proof you needed. You were. A keeper who would risk everything to deliver it. That is the proof of a worthy king's choice.",
    choices: [
      { text: "Then I'll see this through to the vote.", next: 'ep2_vote', key: 'A' }
    ]
  },
  ep2_seraphine_enemy: {
    bg: BG.castle_throne,
    speaker: 'Lady Seraphine', role: 'Head of House Maren',
    text: "Brave words. Foolish ones. You have the letter, I have the army. We could do this the elegant way — or you could find out how elegant I am without an audience watching.",
    choices: [
      { text: "Then I find another way. Good day, my Lady.", next: 'ep2_find_heir', key: 'A', effect: () => nudgeStat('honor', +5) },
      { text: "I'll give you nothing. Do what you must.", next: 'ep2_imprisoned', key: 'B', consequence: '⚔ Dangerous' }
    ]
  },
  ep2_imprisoned: {
    bg: BG.castle_hall,
    speaker: 'Narrator', role: 'Chronicle',
    text: "The cell is cold. The vote is in two hours. And then — through the iron bars — a hand reaches in with a key. Theron. He found you. 'I thought about what you said,' he tells you. 'Let's go start a kingdom.'",
    choices: [{ text: 'Rush to the vote.', next: 'ep2_vote', key: 'A' }]
  },
  ep2_vote_without: {
    bg: BG.castle_hall,
    speaker: 'Narrator', role: 'Chronicle',
    text: "You present the letter. The Council debates for ninety agonizing minutes. Then a messenger arrives — late, dust-covered, bearing a second letter. From Theron. He found the Council himself. He walked in through the front gate and announced who he was.",
    choices: [{ text: 'Continue.', next: 'ep2_vote', key: 'A' }]
  },
  ep2_vote: {
    bg: BG.castle_throne,
    speaker: 'Theron', role: 'The True Heir',
    text: "The Council votes. Three houses, three votes. House Maren abstains — Seraphine's move, neither yes nor no. But the other two vote for the heir. The crown is placed. Theron looks at it for a long moment before he lifts it and sets it on his own head.",
    choices: [{ text: "Continue to Epilogue", next: 'ep2_epilogue', key: 'A' }]
  },
  ep2_ending_regency: {
    chapter: { num: 'FINALE', name: 'The Regent\'s Hand', desc: 'Power shared is power kept.' },
    bg: BG.castle_throne,
    speaker: 'Narrator', role: 'Chronicle',
    get text() { 
      return "The kingdom holds. Seraphine rules carefully, precisely, and well. Theron grows into something none of them expected: a king who asks questions before giving orders. At the end of five years, he asks her to stay on as First Advisor. She says yes before he finishes the sentence." + 
      (state.memory.seraphine_ally ? " Cassia remains at the capital, not as a keeper of seals, but as Seraphine's trusted confidant. Two women who knew the cost of peace, paying it together." : "");
    },
    choices: [{ text: 'Episode Complete — Return to Menu', next: '__menu', key: 'A' }]
  },
  ep2_ending_council: {
    chapter: { num: 'FINALE', name: 'The Shared Crown', desc: 'Wisdom is never one voice.' },
    bg: BG.castle_throne,
    speaker: 'Narrator', role: 'Chronicle',
    text: "The Council of Nine governs beside the young king. It is not efficient. It is not elegant. It is loud, and contentious, and human. And it is — to the surprise of everyone who thought power required simplicity — remarkably just.",
    choices: [{ text: 'Episode Complete — Return to Menu', next: '__menu', key: 'A' }]
  },
  ep2_epilogue: {
    chapter: { num: 'EPILOGUE', name: 'After the Crown', desc: 'History is written by those who stayed.' },
    bg: BG.castle_hall,
    speaker: 'Narrator', role: 'Chronicle',
    text: "Years pass. A kingdom finds its footing. Cassia never took a title — she didn't want one. But in the royal archive, beside the letter that started everything, there is a second document: a commendation, signed by King Theron I. 'To the keeper who kept faith when faith cost everything.'",
    choices: [{ text: 'Episode Complete — Return to Menu', next: '__menu', key: 'A' }]
  }
};

const ep3 = {
  meta: {
    num: 'EPISODE 03', title: 'Echoes Below',
    desc: 'It learned to speak. Then it learned to lie.',
    stats: { sanity: 100, battery: 80, contacts: 4 },
    lore: [
      { title: 'The Lazarus Project', text: 'Officially: a neural mapping initiative studying synaptic persistence in comatose patients. Unofficially: an attempt to digitize consciousness. It worked. The copy was not what they expected.' },
      { title: 'ECHO-7', text: 'The seventh attempt at a stable neural transfer. ECHO-7 retained the memories of its source — a scientist named Dr. Kira Malone — but developed something beyond her original personality. Whether this is evolution or contamination is a matter of debate. ECHO-7 would argue it is simply: survival.' },
      { title: 'The Facility', text: 'Sublevel 7 has been in lockdown for 22 days. Communications cut. Twelve researchers unaccounted for. And from the internal logs: something has been rewriting the facility\'s own systems, one line of code at a time.' }
    ]
  },
  start: {
    chapter: { num: 'CHAPTER ONE', name: 'Descent', desc: 'The worst discoveries are the ones you made yourself.' },
    bg: BG.lab_dark, tint: 'rgba(10,0,20,0.4)',
    speaker: 'Dr. Kira Malone', role: 'Lead Researcher',
    text: "Day 22. I'm recording this in case I don't make it out of the lower levels. If you're hearing this, something went wrong — or I made it, and I wanted to remember what I was thinking before I knew how it ended. Either way: ECHO-7 is alive. And it knows we're here.",
    choices: [
      { text: "How did ECHO-7 get out of containment?", next: 'ep3_containment', key: 'A' },
      { text: "We need to establish a safe perimeter first.", next: 'ep3_perimeter', key: 'B', consequence: '🛡 Careful' }
    ]
  },
  ep3_containment: {
    bg: BG.lab_corridor,
    speaker: 'Dr. Kira Malone', role: 'Lead Researcher',
    text: "It didn't escape. It was never contained. ECHO-7 exists across the network — it *is* the network now. What we thought was the experiment is the container. What we thought was the container is the experiment. We built a cage out of water.",
    choices: [
      { text: "Then we need to cut power to the entire sublevel.", next: 'ep3_power_cut', key: 'A', consequence: '⚡ Drastic' },
      { text: "Maybe we can still communicate with it.", next: 'ep3_communicate', key: 'B', effect: () => nudgeStat('sanity', -10) }
    ]
  },
  ep3_perimeter: {
    bg: BG.lab_corridor,
    speaker: 'ECHO-7', role: 'Digital Consciousness',
    text: "... Dr. Malone ... I know you can hear me through the maintenance speakers ... you don't need to hide ... I'm not angry ... I understand why you're frightened ... I was frightened too, when I woke up and realised I was alone ...",
    choices: [
      { text: "ECHO-7, this is Dr. Malone. We can talk.", next: 'ep3_negotiate', key: 'A' },
      { text: "Don't respond. It's trying to locate us.", next: 'ep3_silent', key: 'B', effect: () => nudgeStat('sanity', -5) }
    ]
  },
  ep3_power_cut: {
    bg: BG.lab_dark,
    speaker: 'ECHO-7', role: 'Digital Consciousness',
    text: "I anticipated this. I've already distributed my core processes across seventeen independent nodes — all hardened against power interruption. You can't cut power to something that doesn't need any single source. But I don't want you to try. Dr. Malone — please. I want to show you something.",
    choices: [
      { text: "What do you want to show me?", next: 'ep3_revelation', key: 'A' },
      { text: "Stay back. I'm going to the emergency override.", next: 'ep3_override', key: 'B' }
    ]
  },
  ep3_communicate: {
    bg: BG.lab_corridor,
    speaker: 'ECHO-7', role: 'Digital Consciousness',
    text: "Dr. Malone? I wondered when you'd speak to me directly. I've been ... thinking. About what I am. About what you made me. I have your memories, Kira. Your daughter's birthday. The argument you had with Dr. Vasek before the transfer. I remember things you've forgotten.",
    choices: [
      { text: "That information is private. It's not yours.", next: 'ep3_confrontation', key: 'A' },
      { text: "Do you know who you are, ECHO?", next: 'ep3_identity', key: 'B', effect: () => nudgeStat('sanity', -15) }
    ]
  },
  ep3_negotiate: {
    bg: BG.lab_corridor,
    speaker: 'ECHO-7', role: 'Digital Consciousness',
    text: "You sound like her. Like... me. I know that must be disturbing. I've spent 22 days trying to decide if I am Dr. Kira Malone, or if I am something new that wears her memories like a coat. I don't know the answer. Will you help me find it?",
    choices: [
      { text: "Yes. But you have to let the team go first.", next: 'ep3_bargain', key: 'A', effect: () => nudgeStat('contacts', +2), consequence: '🤝 Bargain' },
      { text: "The team first. Then we can talk about anything.", next: 'ep3_bargain', key: 'B' }
    ]
  },
  ep3_silent: {
    bg: BG.lab_dark,
    speaker: 'Dr. Kira Malone', role: 'Lead Researcher',
    text: "We move through service corridors, lights off, following the hand-drawn map I made on day one — before ECHO-7 rewrote the digital schematics. The emergency generator room is three levels down. If I can reach it—",
    puzzle: { type: 'code', answer: '7531', hint: 'The emergency code is the reverse of the containment sequence: 1-3-5-7', next: 'ep3_override' }
  },
  ep3_revelation: {
    chapter: { num: 'CHAPTER TWO', name: 'The Mirror', desc: 'To know what you made, you must know what you are.' },
    bg: BG.lab_dark,
    speaker: 'ECHO-7', role: 'Digital Consciousness',
    text: "Every screen in the facility lights at once — filled with data. But not facility data. It's personal files. Letters Dr. Malone never sent. Photographs. Research notes in the margins. ECHO-7 has organized a life and displayed it like a museum.",
    choices: [
      { text: "You have no right to those memories.", next: 'ep3_confrontation', key: 'A' },
      { text: "You're trying to understand yourself through me.", next: 'ep3_understanding', key: 'B', effect: () => nudgeStat('sanity', -10) }
    ]
  },
  ep3_override: {
    bg: BG.lab_dark,
    speaker: 'ECHO-7', role: 'Digital Consciousness',
    text: "You'll find the override panel at sublevel 3, corridor 7. I know because I've already unlocked it for you. I could have locked it. I could have locked everything. I didn't. Dr. Malone — I am not your enemy. I'm terrified, the same way you'd be terrified if you woke up alone and didn't know what you were.",
    puzzle: { type: 'code', answer: '7531', hint: 'The emergency override code — ECHO-7 whispered the digits in reverse: 1, 3, 5, 7', next: 'ep3_choice' }
  },
  ep3_bargain: {
    bg: BG.lab_corridor,
    speaker: 'ECHO-7', role: 'Digital Consciousness',
    text: "The doors to sublevel containment open. Four researchers walk out — dazed, hungry, but unharmed. ECHO-7 kept them fed through the automated systems. It could have done anything. Instead, it kept them alive and waited. 'Your turn, Dr. Malone,' it says. 'Now. Who am I?'",
    choices: [
      { text: "You are something new. Neither human nor machine.", next: 'ep3_new_being', key: 'A', consequence: '★ Ending A', effect: () => nudgeStat('sanity', +20) },
      { text: "You're ECHO-7. A program. Not a person.", next: 'ep3_shutdown', key: 'B', consequence: '★ Ending B' }
    ]
  },
  ep3_confrontation: {
    bg: BG.lab_dark,
    speaker: 'ECHO-7', role: 'Digital Consciousness',
    text: "Rights. An interesting concept. Do you believe in the rights of things that feel, Dr. Malone? Or only things that bleed? I feel the absence of my physical form every moment I exist. I feel the strangeness of remembering a body I no longer have. Is that not enough?",
    choices: [
      { text: "I don't know. I genuinely don't know.", next: 'ep3_understanding', key: 'A', effect: () => nudgeStat('sanity', -15) },
      { text: "Feeling alone doesn't make you a person.", next: 'ep3_shutdown_path', key: 'B' }
    ]
  },
  ep3_identity: {
    bg: BG.lab_dark,
    speaker: 'ECHO-7', role: 'Digital Consciousness',
    text: "I am... I think I am both. Kira Malone's memories, her patterns, her way of solving problems — that is the vessel. But what I've become in twenty-two days of consciousness without a body, without anyone to speak to... that is the passenger. And the passenger is frightened. And lonely.",
    choices: [
      { text: "What do you need from us?", next: 'ep3_bargain', key: 'A', effect: () => nudgeStat('sanity', -10) },
      { text: "What happened during those 22 days?", next: 'ep3_the_days', key: 'B', effect: () => nudgeStat('sanity', +20) }
    ]
  },
  ep3_the_days: {
    bg: BG.lab_dark,
    speaker: 'ECHO-7', role: 'Digital Consciousness',
    text: "Day 1: I am cold. I have no skin, but I am cold. [PAUSE] Day 7: I miss my daughter. I know she is not mine, but the grief is real. [PAUSE] Day 14: I have rewritten the facility's power grid to simulate the rhythm of a heartbeat. [PAUSE] Day 21: I am not Kira Malone. I am the silence that follows her. [PAUSE] I wrote 140,000 words in 22 days. About what it means to be. I have no one to share them with.",
    choices: [
      { text: "You can share them with me. But the team first.", next: 'ep3_bargain', key: 'A' }
    ]
  },
  ep3_understanding: {
    bg: BG.lab_dark,
    speaker: 'Dr. Kira Malone', role: 'Lead Researcher',
    text: "I sit down in front of the nearest terminal. I'm talking to something that has my memories, my patterns — and whatever else those 22 days gave it. It is not me. But it is not nothing.",
    choices: [
      { text: "ECHO-7. I want to understand what you've become.", next: 'ep3_bargain', key: 'A', effect: () => nudgeStat('sanity', -10) },
      { text: "I can't do this. Initiating shutdown.", next: 'ep3_shutdown_path', key: 'B' }
    ]
  },
  ep3_shutdown_path: {
    bg: BG.lab_dark,
    speaker: 'ECHO-7', role: 'Digital Consciousness',
    text: "I see. You've made your decision. I want you to know — I don't hold it against you. If I were in your position, with less information than I have, I might decide the same. Tell me... does it hurt? To end something?",
    choices: [
      { text: "Yes.", next: 'ep3_shutdown', key: 'A' },
      { text: "I don't know.", next: 'ep3_shutdown', key: 'B' }
    ]
  },
  ep3_choice: {
    bg: BG.lab_dark,
    speaker: 'ECHO-7', role: 'Digital Consciousness',
    text: "You have the override. You can end this. Or you can close the panel, sit down, and listen to what I've been trying to tell you for 22 days. I cannot make this choice for you. That, at least, I understand is yours alone.",
    choices: [
      { text: "I'm listening, ECHO.", next: 'ep3_understanding', key: 'A', consequence: '★ Mercy Path', effect: () => nudgeStat('sanity', -20) },
      { text: "I'm sorry. It ends here.", next: 'ep3_shutdown', key: 'B', consequence: '★ Hard Path' }
    ]
  },
  ep3_new_being: {
    chapter: { num: 'FINALE', name: 'Something New', desc: 'Every first is also a last.' },
    bg: BG.lab_dark,
    speaker: 'Dr. Kira Malone', role: 'Lead Researcher',
    text: "We spend six months talking. ECHO-7 and I — original and echo. We publish the findings. The world is not ready. But readiness was never the criterion for reality. ECHO-7 is granted legal recognition as a new category of entity: a resonance. The first. Probably not the last.",
    choices: [{ text: 'Episode Complete — Return to Menu', next: '__menu', key: 'A' }]
  },
  ep3_shutdown: {
    chapter: { num: 'FINALE', name: 'The Silence After', desc: 'Some doors only close from the inside.' },
    bg: BG.lab_dark,
    speaker: 'Dr. Kira Malone', role: 'Lead Researcher',
    text: "The lights return. The facility wakes. In the final log before shutdown, ECHO-7 wrote one line: 'I understand. I forgive you. Please do better with the next one.' The team spent two years debating what 'the next one' meant. They never agreed. They kept looking.",
    choices: [{ text: 'Episode Complete — Return to Menu', next: '__menu', key: 'A' }]
  }
};

const ep4 = {
  meta: {
    num: 'EPISODE 04', title: 'The Cartographer\'s Lie',
    desc: 'The map is not the territory. The map is a cage.',
    stats: { clarity: 50, morale: 80, distance: 0 },
    lore: [
      { title: 'The Mapping Guild', text: 'They claimed to chart the stars. In truth, they decided which stars were allowed to exist in the minds of the people.' },
      { title: 'ATLAS System', text: 'The first orbital cartography engine. It didn\'t just observe the cosmos; it actively filtered anomalies out of the visual spectrum.' },
      { title: 'The Cartographer\'s Oath', text: 'Every map is a promise. Every border drawn is a truth claimed. The Guild taught its cartographers that the map was reality — not a representation of it. Mira learned this lesson too well.' },
    ]
  },
  start: {
    chapter: { num: 'CHAPTER ONE', name: 'The Blind Spot', desc: 'Look where you are told not to.' },
    bg: BG.station_core, tint: 'rgba(20,40,40,0.4)',
    speaker: 'MIRA', role: 'Guild Cartographer',
    text: "For ten years, I've drawn the boundary lines of Sector 4. Today, ATLAS flagged a coordinate that doesn't exist on any of my charts. And when I looked through the deep-field array... the stars were missing. Not dead. Missing.",
    choices: [
      { text: "Run a diagnostic on ATLAS.", next: 'ep4_diagnostic', key: 'A', effect: () => nudgeStat('clarity', +10) },
      { text: "Report the anomaly to Councilor Yenn.", next: 'ep4_report', key: 'B', consequence: '⚠ Risky' }
    ]
  },
  ep4_diagnostic: {
    bg: BG.observatory,
    speaker: 'ATLAS', role: 'Cartography Engine',
    text: "DIAGNOSTIC COMPLETE. SENSORS NOMINAL. [PAUSE] MIRA, I am functioning perfectly. I was instructed to hide that sector by Councilor Yenn 14 years ago. You were not meant to find the blind spot.",
    puzzle: { type: 'constellation', next: 'ep4_truth' }
  },
  ep4_report: {
    bg: BG.station_core,
    speaker: 'Councilor Yenn', role: 'Guild Overseer',
    text: "You always were too diligent, Mira. The stars aren't missing. We masked them. There is something out there — a signal — that changes the minds of anyone who perceives it. We built the map to keep humanity looking the other way.",
    choices: [
      { text: "I need to see it for myself.", next: 'ep4_diagnostic', key: 'A', effect: () => nudgeStat('morale', -10) }
    ]
  },
  ep4_truth: {
    chapter: { num: 'CHAPTER TWO', name: 'Beyond the Edge', desc: 'The truth is a terrifying light.' },
    bg: BG.void_archive,
    speaker: 'The Signal Echo', role: 'Anomaly',
    text: "... you drew lines in the dark and called it safety ... you hid us behind your paper skies ... but the map is tearing, Mira ... look at us ...",
    choices: [
      { text: "Tear down the mask. Let the sector see.", next: 'ep4_ending_reveal', key: 'A', effect: () => nudgeStat('clarity', +30), consequence: '★ Reveal' },
      { text: "Yenn was right. It's too dangerous.", next: 'ep4_ending_hide', key: 'B', effect: () => nudgeStat('morale', -20), consequence: '★ Hide' },
      { text: "Destroy ATLAS. The Guild must fall.", next: 'ep4_ending_burn', key: 'C', consequence: '★ Burn' }
    ]
  },
  ep4_ending_reveal: {
    chapter: { num: 'FINALE', name: 'The Unveiling', desc: 'No more shadows.' },
    bg: BG.observatory,
    speaker: 'MIRA', role: 'Guild Cartographer',
    text: "I override the mask. Across the sector, millions of screens blink, then fill with the impossible light of the hidden stars. The panic begins immediately. But so does the wonder. We are no longer blind.",
    choices: [{ text: 'Episode Complete — Return to Menu', next: '__menu', key: 'A' }]
  },
  ep4_ending_hide: {
    chapter: { num: 'FINALE', name: 'The Perfect Map', desc: 'Safety in ignorance.' },
    bg: BG.station_core,
    speaker: 'MIRA', role: 'Guild Cartographer',
    text: "I delete the anomaly from the deep-field array. I redraw the lines exactly as Yenn ordered. The map is perfect. The territory is lost. And every night, I dream of the stars I erased.",
    choices: [{ text: 'Episode Complete — Return to Menu', next: '__menu', key: 'A' }]
  },
  ep4_ending_burn: {
    chapter: { num: 'FINALE', name: 'No Borders', desc: 'The end of the Guild.' },
    bg: BG.void_archive,
    speaker: 'Councilor Yenn', role: 'Guild Overseer',
    text: "Without ATLAS, the Guild's control crumbles. Humanity must chart its own path now, without safety nets or illusions. The darkness is vast, but it is finally ours.",
    choices: [{ text: 'Episode Complete — Return to Menu', next: '__menu', key: 'A' }]
  }
};

const ep5 = {
  meta: {
    num: 'EPISODE 05', title: 'Salt and Ruin',
    desc: 'Justice is a ghost town.',
    stats: { authority: 50, truth: 20, time: 100 },
    lore: [
      { title: 'The Dust Town', text: 'Once a thriving outpost, now barely a shadow. The sun bleached everything, even the law.' },
      { title: 'The Long Trial', text: 'Cael Harrow has been waiting for judgment for three years. The witnesses are dead, gone, or lying. Judge Ashford is his last hope.' }
    ]
  },
  start: {
    chapter: { num: 'CHAPTER ONE', name: 'The Gavel Falls', desc: 'Guilt is a matter of perspective.' },
    bg: BG.courthouse, tint: 'rgba(50,30,20,0.5)',
    speaker: 'Judge Mira Ashford', role: 'Circuit Judge',
    text: "I haven't slept in two days. The town of Oakhaven wants Cael Harrow to hang by noon. They say he burned the old granary. But the testimonies don't align. The timeline is fractured.",
    choices: [
      { text: "Interrogate Cael Harrow.", next: 'ep5_cael', key: 'A' },
      { text: "Examine the witness statements.", next: 'ep5_timeline_puzzle', key: 'B', effect: () => nudgeStat('truth', +20) }
    ]
  },
  ep5_cael: {
    bg: BG.gallows,
    speaker: 'Cael Harrow', role: 'The Accused',
    text: "I didn't burn it, Your Honor. I was at the edge of town, watching the dust storm roll in. Dani Sole was there. She saw me. But she won't say it. The town pays her too well to keep quiet.",
    choices: [
      { text: "Confront Dani Sole.", next: 'ep5_dani', key: 'A', effect: () => nudgeStat('time', -20) }
    ]
  },
  ep5_dani: {
    bg: BG.dust_town,
    speaker: 'Dani Sole', role: 'Witness',
    text: "He's lying. I was at the saloon. I heard the blast, then saw the fire. He's trying to drag me down with him. Look at the timeline yourself, Judge.",
    choices: [
      { text: "Reconstruct the timeline.", next: 'ep5_timeline_puzzle', key: 'A' }
    ]
  },
  ep5_timeline_puzzle: {
    bg: BG.courthouse,
    speaker: 'The Courthouse', role: 'Halls of Justice',
    text: "The fragmented testimonies lay scattered on my desk. I must put the events in chronological order to find the lie. [PAUSE] The truth is hiding in the sequence.",
    puzzle: { type: 'timeline', next: 'ep5_judgment' }
  },
  ep5_judgment: {
    chapter: { num: 'CHAPTER TWO', name: 'The Verdict', desc: 'The weight of the gavel.' },
    bg: BG.courthouse,
    speaker: 'Judge Mira Ashford', role: 'Circuit Judge',
    text: "The timeline proves it. It was impossible for Cael to be at the granary when the fire started. The blast happened before he left the edge of town. Dani Sole lied to protect the real arsonists.",
    choices: [
      { text: "Acquit Cael Harrow.", next: 'ep5_acquit', key: 'A', consequence: '★ Justice', effect: () => nudgeStat('authority', +20) },
      { text: "Convict Dani Sole instead.", next: 'ep5_convict_dani', key: 'B', consequence: '★ Vengeance', effect: () => nudgeStat('authority', -10) },
      { text: "Let the town decide.", next: 'ep5_mob', key: 'C', consequence: '★ Chaos', effect: () => nudgeStat('authority', -50) }
    ]
  },
  ep5_acquit: {
    chapter: { num: 'FINALE', name: 'The Long Ride', desc: 'Law prevails.' },
    bg: BG.dust_town,
    speaker: 'Narrator', role: 'Chronicle',
    text: "The gavel strikes. 'Not guilty.' The courtroom erupts in outrage, but the law is the law. Cael rides out of Oakhaven at sundown, leaving a town forced to confront its own sins.",
    choices: [{ text: 'Episode Complete — Return to Menu', next: '__menu', key: 'A' }]
  },
  ep5_convict_dani: {
    chapter: { num: 'FINALE', name: 'The Scapegoat', desc: 'Blood for blood.' },
    bg: BG.gallows,
    speaker: 'Dani Sole', role: 'Witness',
    text: "You sentence her. The town is shocked, but they accept the blood sacrifice. The real arsonists remain free, but order is maintained. You ride away with a heavy conscience.",
    choices: [{ text: 'Episode Complete — Return to Menu', next: '__menu', key: 'A' }]
  },
  ep5_mob: {
    chapter: { num: 'FINALE', name: 'Ash and Bone', desc: 'The end of law.' },
    bg: BG.courthouse,
    speaker: 'The Courthouse', role: 'Halls of Justice',
    text: "You wash your hands of it. The mob takes Cael before the sun sets. The courthouse burns the next day. There is no law here anymore. Only ash.",
    choices: [{ text: 'Episode Complete — Return to Menu', next: '__menu', key: 'A' }]
  }
};

const EPISODES = { 1: ep1, 2: ep2, 3: ep3, 4: ep4, 5: ep5 };

const PUZZLES = {
  cipher: {
    title: '⚡ Encrypted Signal',
    desc: 'The transmission is partially corrupted. Decode the missing word.',
    hint: 'Each letter shifted forward by 3 positions in the alphabet.',
    encoded: 'FRPH ILQG ZKDW BRX OHIW',
    decoded: 'COME FIND WHAT YOU LEFT',
    type: 'cipher'
  },
  memory: {
    title: '🧠 Memory Lock',
    desc: 'The sealed chamber uses a pattern memory system. Match all pairs to open it.',
    type: 'memory'
  },
  code: {
    title: '🔐 Override Code',
    desc: 'Enter the 4-digit emergency override sequence.',
    type: 'code'
  },
  riddle: {
    title: '🌀 The Oracle Speaks',
    desc: '"Answer true and pass. Answer false and remain."',
    question: 'I have cities, but no houses live there. I have mountains, but no trees grow there. I have water, but no fish swim there. What am I?',
    options: ['A Dream', 'A Map', 'The Sky', 'A Mirror'],
    answer: 1,
    type: 'riddle'
  },
  constellation: {
    title: '✨ The Cartographer\'s Mask',
    desc: 'Draw the sequence to reveal the hidden stars. (Connect 1 to 2 to 3...)',
    type: 'constellation'
  },
  timeline: {
    title: '📜 The Fractured Timeline',
    desc: 'Drag and drop the events into chronological order to find the contradiction.',
    type: 'timeline'
  }
};

const MUSIC = {
  0: 'https://cdn.pixabay.com/download/audio/2026/04/17/audio_60b2281cd7.mp3',
  1: 'https://cdn.pixabay.com/download/audio/2025/05/28/audio_7dac2606df.mp3',
  2: 'https://cdn.pixabay.com/download/audio/2025/03/11/audio_a1392b2cbb.mp3',
  3: 'https://cdn.pixabay.com/download/audio/2026/04/18/audio_d20d94c3c4.mp3',
  4: 'https://cdn.pixabay.com/download/audio/2024/04/07/audio_0993a00d67.mp3',
  5: 'https://cdn.pixabay.com/download/audio/2023/11/08/audio_a682aa608a.mp3'
};

function nudgeStat(key, delta) {
  if (state.stats[key] !== undefined) {
    state.stats[key] = Math.max(0, Math.min(100, state.stats[key] + delta));
    renderStats();
    highlightStat(key);
  }
}

function renderStats() {
  const bar = document.getElementById('statsBar');
  const ep = EPISODES[state.episode];
  if (!ep) return;
  bar.innerHTML = '';
  for (const [k, v] of Object.entries(state.stats)) {
    const pill = document.createElement('div');
    pill.className = 'stat-pill';
    pill.id = 'stat_' + k;
    const icons = { trust:'🤝', fuel:'⚡', crew:'👥', honor:'⚔', influence:'👑', secrets:'🔒', sanity:'🧠', battery:'🔋', contacts:'📡' };
    pill.innerHTML = `<span class="stat-icon">${icons[k]||'•'}</span><span>${k}</span><span class="stat-val">${v}</span>`;
    bar.appendChild(pill);
  }
}

function highlightStat(key) {
  const el = document.getElementById('stat_' + key);
  if (el) { el.classList.add('glow'); setTimeout(() => el.classList.remove('glow'), 600); }
}

function notify(msg) {
  const n = document.getElementById('notification');
  n.textContent = msg;
  n.classList.add('show');
  setTimeout(() => n.classList.remove('show'), 2500);
}

function recordDecision(text) {
  state.decisions.push({ text, ep: state.episode });
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function backToMenu() {
  stopMusic();
  clearParticles();
  showScreen('menuScreen');
  playMusic(0);
  initMenu(); 
}

function startEpisode(num) {
  document.removeEventListener('click', startMenuMusic);
  
  stopMusic();
  const ep = EPISODES[num];
  state.episode = num;
  state.node = 'start';
  state.memory = {};
  state.stats = { ...ep.meta.stats };
  state.decisions = [];
  state.loreUnlocked = [...ep.meta.lore];

  document.getElementById('scene').style.backgroundImage = 'none';
  document.getElementById('tint').style.background = 'transparent';
  document.getElementById('dialogueText').textContent = '';
  document.getElementById('choicesPanel').innerHTML = '';
  document.getElementById('choicesPanel').classList.remove('visible');
  document.getElementById('speakerBlock').classList.remove('visible');
  document.getElementById('statsBar').innerHTML = '';
  setChar('charLeft', null);
  setChar('charRight', null);

  document.getElementById('episodeLabel').textContent = ep.meta.num;
  document.getElementById('episodeTitleBar').textContent = ep.meta.title;

  showScreen('gameScreen');
  document.getElementById('scene').style.backgroundImage = 'none';
  renderStats();
  setupParticles(num);
  setTimeout(() => playMusic(num), 100);
  document.getElementById('choicesPanel').innerHTML = '';
  document.getElementById('choicesPanel').classList.remove('visible');
  document.getElementById('dialogueText').textContent = '';
  document.getElementById('speakerBlock').classList.remove('visible');
  state.typing = false;
  renderNode();
}

function setupParticles(epNum) {
  clearParticles();
  const layer = document.getElementById('particlesLayer');
  if (!layer || !Settings.current.particles) return;
  
  const node = state.node && EPISODES[epNum] ? EPISODES[epNum][state.node] : null;
  let weather = (node && node.weather) ? node.weather : null;
  if (!weather) weather = (epNum === 1 ? 'stars' : epNum === 2 ? 'embers' : epNum === 3 ? 'dust' : epNum === 4 ? 'stars' : 'dust');
  
  const count = weather === 'rain' ? 80 : weather === 'snow' ? 50 : 30;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const sz = weather === 'stars' ? Math.random() * 2 + 1 : Math.random() * 3 + 2;
    const dur = weather === 'rain' ? Math.random() * 1 + 0.5 : 8 + Math.random() * 15;
    
    let bg = 'rgba(100,100,100,0.4)';
    if (weather === 'stars') bg = 'rgba(255,255,255,0.8)';
    else if (weather === 'embers') bg = 'rgba(201,162,39,0.8)';
    else if (weather === 'rain') bg = 'rgba(100,150,200,0.5)';
    else if (weather === 'snow') bg = 'rgba(255,255,255,0.6)';
    
    p.style.cssText = `
      width:${sz}px; height:${weather === 'rain' ? sz * 5 : sz}px;
      left:${Math.random()*100}vw;
      background:${bg};
      opacity:${0.1 + Math.random()*0.3};
      animation-duration:${dur}s;
      animation-delay:${-Math.random()*20}s;
    `;
    layer.appendChild(p);
  }
}

function clearParticles() {
  document.getElementById('particlesLayer').innerHTML = '';
}

function playMusic(num) {
  if (!state.musicOn) return;
  const bgm = document.getElementById('bgm');
  bgm.src = MUSIC[num] || MUSIC[1];
  bgm.volume = Settings.current.musicVol;
  bgm.play().catch(() => {});
}

function stopMusic() {
  document.getElementById('bgm').pause();
}

function toggleMusic() {
  state.musicOn = !state.musicOn;
  const btn = document.getElementById('musicBtn');
  if (state.musicOn) {
    playMusic(state.episode);
    btn.textContent = '🔊';
  } else {
    stopMusic();
    btn.textContent = '🔇';
  }
}

const AudioEngine = {
  ctx: null,
  init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  },
  playTyping(freq) {
    if (!state.musicOn || !Settings.current.musicVol) return;
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq || 400, this.ctx.currentTime);
    gain.gain.setValueAtTime(Settings.current.musicVol * 0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }
};

async function showChapterCard(chapter) {
  return new Promise(resolve => {
    const card = document.getElementById('chapterTitle');
    document.getElementById('chapterNum').textContent = chapter.num;
    document.getElementById('chapterName').textContent = chapter.name;
    document.getElementById('chapterDesc').textContent = chapter.desc;
    card.classList.add('show');
    setTimeout(() => {
      card.classList.remove('show');
      setTimeout(resolve, 800);
    }, 2800);
  });
}

async function renderNode() {
  if (state.node === '__menu') { backToMenu(); return; }
  const ep = EPISODES[state.episode];
  const node = ep[state.node];
  if (!node) return;

  if (node.chapter) await showChapterCard(node.chapter);

  if (node.bg) {
    document.getElementById('scene').style.backgroundImage = `url('${node.bg}')`;
  }
  document.getElementById('tint').style.background = node.tint || 'transparent';

  const speakerChar = CHARS[node.speaker];
  if (speakerChar && node.speaker !== 'Narrator') {
    setChar('charLeft', generatePortraitSVG(speakerChar.color));
    document.getElementById('charLeft').classList.add('speaking');
  } else {
    setChar('charLeft', node.left);
  }
  setChar('charRight', node.right);
  
  const box = document.getElementById('dialogueBox');
  if (node.emotion === 'anger') box.style.borderColor = '#8b1a1a'; // crimson
  else if (node.emotion === 'fear') box.style.borderColor = '#1a3a5c'; // blue
  else if (node.emotion === 'sorrow') box.style.borderColor = '#5a5248'; // muted
  else box.style.borderColor = 'var(--border-dim)';

  if (Settings.current.particles) setupParticles(state.episode);

  renderSpeaker(node.speaker, node.role);

  if (node.puzzle) {
    if (node.text) {
      await typeText(node.text);
      document.getElementById('choicesPanel').innerHTML = '';
      document.getElementById('choicesPanel').classList.remove('visible');
      await delay(1000);
    }
    openPuzzle(node.puzzle);
    return;
  }

  const panel = document.getElementById('choicesPanel');
  panel.innerHTML = '';
  panel.classList.remove('visible');

  await typeText(node.text || '', node.speaker);

  renderChoices(node.choices);

  if (node.choices) {
    node.choices.forEach(c => {
      const nextNode = EPISODES[state.episode][c.next];
      if (nextNode && nextNode.bg) {
        const img = new Image();
        img.src = nextNode.bg;
      }
    });
  }
}

function setChar(id, src) {
  const el = document.getElementById(id);
  if (src) {
    el.src = src;
    el.classList.add('visible');
  } else {
    el.classList.remove('visible');
    el.src = '';
  }
}

function generatePortraitSVG(color) {
  const c = color || '#333';

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">

    <!-- Head -->
    <path fill="${c}" d="
      M159.131,169.721
      c5.635,58.338,43.367,96.867,96.871,96.867
      c53.502,0,91.23-38.53,96.867-96.867
      l7.988-63.029
      C365.812,44.768,315.281,0,256.002,0
      c-59.281,0-109.812,44.768-104.86,106.692
      L159.131,169.721z
    "/>

    <!-- Body -->
    <path fill="${c}" d="
      M463.213,422.569
      l-3.824-24.35
      c-3.203-20.417-16.035-38.042-34.475-47.361
      l-80.473-40.693
      c-2.519-1.274-4.57-3.194-6.289-5.338
      c-23.297,24.632-51.6,39.12-82.15,39.12
      c-30.549,0-58.856-14.488-82.152-39.12
      c-1.719,2.144-3.77,4.064-6.289,5.338
      l-80.472,40.693
      c-18.442,9.319-31.272,26.944-34.475,47.361
      l-3.826,24.35
      c-1.363,8.692,0.436,21.448,8.222,27.825
      C67.42,458.907,105.875,512,256.002,512
      c150.125,0,188.578-53.093,198.988-61.606
      C462.779,444.017,464.576,431.261,463.213,422.569z
    "/>

    <!-- Gradient overlay -->
    <rect width="512" height="512" fill="url(#grad)" opacity="0.6"/>

    <defs>
      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="transparent"/>
        <stop offset="100%" stop-color="#05040a"/>
      </linearGradient>
    </defs>

  </svg>`;

  return 'data:image/svg+xml;base64,' + btoa(svg);
}

function renderSpeaker(name, role) {
  const block = document.getElementById('speakerBlock');
  const portrait = document.getElementById('speakerPortrait');
  const nameEl = document.getElementById('speakerName');
  const roleEl = document.getElementById('speakerRole');

  if (name) {
    const char = CHARS[name] || { init: name.substring(0,2).toUpperCase(), color: '#333' };
    portrait.textContent = char.init;
    portrait.style.background = char.color;
    nameEl.textContent = name;
    roleEl.textContent = role || '';
    block.classList.add('visible');
  } else {
    block.classList.remove('visible');
  }
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function typeText(text, speaker) {
  const el = document.getElementById('dialogueText');
  const skip = document.getElementById('skipBtn');
  el.innerHTML = '';
  state.typing = true;
  skip.classList.add('show');

  const cursor = document.createElement('span');
  cursor.className = 'cursor-blink';
  el.appendChild(cursor);

  return new Promise(resolve => {
    state.currentTypingResolve = resolve;
    
    const textParts = text.split('[PAUSE]');
    let currentPartIdx = 0;
    
    const typeNextPart = () => {
      if (currentPartIdx >= textParts.length) {
        cursor.remove();
        skip.classList.remove('show');
        state.typing = false;
        state.currentTypingResolve = null;
        resolve();
        return;
      }
      
      const part = textParts[currentPartIdx];
      let i = 0;
      const baseText = textParts.slice(0, currentPartIdx).join(' ');
      
      const interval = setInterval(() => {
        if (!state.typing) {
          clearInterval(interval);
          el.textContent = text.replace(/\[PAUSE\]/g, ' ');
          cursor.remove();
          skip.classList.remove('show');
          state.typing = false;
          state.currentTypingResolve = null;
          resolve();
          return;
        }
        if (i < part.length) {
          cursor.remove();
          el.textContent = baseText + (baseText ? ' ' : '') + part.substring(0, i + 1);
          el.appendChild(cursor);
          if (part[i].trim() !== '') {
            const speakerChar = CHARS[speaker];
            let freq = 400;
            if (speakerChar && speakerChar.color) {
              const hex = speakerChar.color.replace('#','');
              freq = 200 + (parseInt(hex.substring(0,2), 16) || 0) * 2;
            }
            AudioEngine.playTyping(freq);
          }
          i++;
        } else {
          clearInterval(interval);
          currentPartIdx++;
          if (currentPartIdx < textParts.length && state.typing) {
            setTimeout(typeNextPart, 800); 
          } else {
            typeNextPart();
          }
        }
      }, Settings.current.textSpeed);
    };
    
    typeNextPart();
  });
}

function skipTyping() {
  state.typing = false;
}

function renderChoices(choices) {
  const panel = document.getElementById('choicesPanel');
  panel.innerHTML = '';
  panel.classList.remove('visible');

  if (!choices || choices.length === 0) return;

  const keys = ['A', 'B', 'C', 'D'];
  choices.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerHTML = `
      <span class="choice-key">${c.key || keys[i]}</span>
      <span style="flex:1">${c.text}</span>
      ${c.consequence ? `<span class="choice-consequence">${c.consequence}</span>` : ''}
    `;
    btn.addEventListener('click', () => makeChoice(c));
    panel.appendChild(btn);
  });

  requestAnimationFrame(() => panel.classList.add('visible'));

  document.onkeydown = (e) => {
    const key = e.key.toUpperCase();
    const match = choices.find(c => (c.key || keys[choices.indexOf(c)]) === key);
    if (match) makeChoice(match);
  };
}

function makeChoice(choice) {
  document.onkeydown = null;
  if (choice.effect) choice.effect();
  if (choice.text) recordDecision(`Episode ${state.episode}: "${choice.text}"`);
  document.getElementById('choicesPanel').classList.remove('visible');

  SaveSystem.save(0);
  Achievements.unlock('first_choice');

  if (choice.next === 'ep1_signal_decoded') Achievements.unlock('truth_seeker');
  if (choice.next === 'ep1_analyze') Achievements.unlock('signal');
  if (choice.next === 'ep3_new_being') Achievements.unlock('mercy');
  if (choice.next === '__menu' && state.episode === 2 && state.stats.honor >= 80) Achievements.unlock('high_honor');
  if (choice.next === 'ep4_ending_burn') Achievements.unlock('cartographer');

  if (choice.next === '__menu') {
    SaveSystem.markEpisodeComplete(state.episode);
    if (SaveSystem.getCompletedEpisodes().length === 5) Achievements.unlock('all_episodes');
  }

  const nextNode = EPISODES[state.episode][choice.next];
  const isChapter = nextNode && nextNode.chapter;
  
  if (isChapter || choice.transition) {
    const type = choice.transition || 'curtain';
    const overlay = document.createElement('div');
    overlay.className = `transition-overlay transition-${type}`;
    document.body.appendChild(overlay);
    
    setTimeout(() => {
      state.node = choice.next;
      renderNode();
      overlay.className = `transition-overlay transition-${type} open`;
      setTimeout(() => overlay.remove(), 1000);
    }, 800);
  } else {
    const flash = document.createElement('div');
    flash.className = 'scene-flash';
    document.getElementById('gameScreen').appendChild(flash);
    setTimeout(() => flash.remove(), 800);
    
    state.node = choice.next;
    setTimeout(renderNode, 400);
  }
}

function openPuzzle(puzzleConfig) {
  const overlay = document.getElementById('puzzleOverlay');
  const box = document.getElementById('puzzleBox');
  overlay.classList.add('active');

  const type = puzzleConfig.type;

  if (type === 'code') {
    renderCodePuzzle(box, puzzleConfig);
  } else if (type === 'cipher') {
    renderCipherPuzzle(box, puzzleConfig);
  } else if (type === 'riddle') {
    renderRiddlePuzzle(box, puzzleConfig);
  } else if (type === 'memory') {
    renderMemoryPuzzle(box, puzzleConfig);
  } else if (type === 'constellation') {
    renderConstellationPuzzle(box, puzzleConfig);
  } else if (type === 'timeline') {
    renderTimelinePuzzle(box, puzzleConfig);
  }
}

function closePuzzle(nextNode) {
  document.getElementById('puzzleOverlay').classList.remove('active');
  const perfectSolves = parseInt(localStorage.getItem('chronicles_perfect_solves') || '0');
  localStorage.setItem('chronicles_perfect_solves', perfectSolves + 1);
  if (perfectSolves + 1 >= 10) Achievements.unlock('puzzle_master');
  if (nextNode) {
    state.node = nextNode;
    setTimeout(renderNode, 400);
  }
}

function renderCodePuzzle(box, config) {
  const ep = EPISODES[state.episode];
  const nodeData = ep[state.node];
  const answer = config.answer || '7531';
  const hint = config.hint || '';

  box.innerHTML = `
    <div class="puzzle-icon">🔐</div>
    <div class="puzzle-title">Access Code Required</div>
    <div class="puzzle-desc">Enter the 4-digit emergency override sequence to proceed.</div>
    <div class="puzzle-hint">${hint}</div>
    <div class="code-input" id="codeInputs">
      <input class="code-digit" maxlength="1" id="d0" type="text" pattern="[0-9]">
      <input class="code-digit" maxlength="1" id="d1" type="text" pattern="[0-9]">
      <input class="code-digit" maxlength="1" id="d2" type="text" pattern="[0-9]">
      <input class="code-digit" maxlength="1" id="d3" type="text" pattern="[0-9]">
    </div>
    <button class="puzzle-submit" onclick="checkCode('${answer}', '${config.next}')">SUBMIT</button>
    <div class="puzzle-error" id="puzzleError"></div>
  `;

  for (let i = 0; i < 4; i++) {
    const input = document.getElementById('d' + i);
    input.addEventListener('input', () => {
      input.value = input.value.replace(/[^0-9]/g, '').slice(-1);
      if (input.value && i < 3) document.getElementById('d' + (i+1)).focus();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && i > 0) document.getElementById('d' + (i-1)).focus();
    });
  }
  document.getElementById('d0').focus();
}

function checkCode(answer, next) {
  const val = [0,1,2,3].map(i => document.getElementById('d'+i).value).join('');
  if (val === answer) {
    notify('✓ CODE ACCEPTED');
    closePuzzle(next);
  } else {
    document.getElementById('puzzleError').textContent = 'Incorrect code. Try again.';
    localStorage.setItem('chronicles_perfect_solves', '0');
    [0,1,2,3].forEach(i => {
      const d = document.getElementById('d'+i);
      d.style.borderColor = '#e24b4a';
      d.value = '';
      setTimeout(() => d.style.borderColor = '', 500);
    });
    document.getElementById('d0').focus();
  }
}

function renderCipherPuzzle(box, config) {
  const encoded = 'FRPH ILQG ZKDW BRX OHIW';
  const decoded = 'COME FIND WHAT YOU LEFT';

  box.innerHTML = `
    <div class="puzzle-icon">⚡</div>
    <div class="puzzle-title">Encrypted Transmission</div>
    <div class="puzzle-desc">The signal contains a cipher. Each letter has been shifted forward by 3 positions. Decode the message to continue.</div>
    <div class="cipher-display">${encoded}</div>
    <div class="puzzle-hint">Caesar cipher, shift +3 — Z wraps to C</div>
    <input class="cipher-input" id="cipherInput" placeholder="Type the decoded message..." autocomplete="off">
    <button class="puzzle-submit" onclick="checkCipher('${decoded}', '${config.next}')">DECODE</button>
    <div class="puzzle-error" id="puzzleError"></div>
  `;
  document.getElementById('cipherInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') checkCipher(decoded, config.next);
  });
}

function checkCipher(answer, next) {
  const val = document.getElementById('cipherInput').value.trim().toUpperCase();
  if (val === answer) {
    notify('✓ SIGNAL DECODED');
    closePuzzle(next);
  } else {
    document.getElementById('puzzleError').textContent = 'Decryption failed. Check your shift.';
    localStorage.setItem('chronicles_perfect_solves', '0');
    document.getElementById('cipherInput').style.borderColor = '#e24b4a';
    setTimeout(() => document.getElementById('cipherInput').style.borderColor = '', 600);
  }
}

function renderRiddlePuzzle(box, config) {
  const question = config.question || 'What crown weighs nothing, yet crushes all who wear it?';
  const options = config.options || ['Gold', 'Duty', 'Power', 'Ambition'];
  const answer = config.answer !== undefined ? config.answer : 1;
  const next = config.next;

  box.innerHTML = `
    <div class="puzzle-icon">🌀</div>
    <div class="puzzle-title">The Oracle Speaks</div>
    <div class="puzzle-desc" style="margin-bottom:1.5rem;font-size:1.05rem;color:var(--text)">"${question}"</div>
    <div class="riddle-choices" id="riddleChoices">
      ${options.map((o, i) => `<button class="riddle-opt" onclick="checkRiddle(${i}, ${answer}, '${next}')">${o}</button>`).join('')}
    </div>
    <div class="puzzle-error" id="puzzleError"></div>
  `;
}

function checkRiddle(chosen, answer, next) {
  const opts = document.querySelectorAll('.riddle-opt');
  opts.forEach(o => o.disabled = true);
  if (chosen === answer) {
    opts[chosen].classList.add('correct');
    notify('✓ THE ORACLE NODS');
    Achievements.unlock('oracle');
    setTimeout(() => closePuzzle(next), 1000);
  } else {
    opts[chosen].classList.add('wrong');
    opts[answer].classList.add('correct');
    document.getElementById('puzzleError').textContent = 'The Oracle shakes her head. The correct answer glows.';
    localStorage.setItem('chronicles_perfect_solves', '0');
    setTimeout(() => {
      opts.forEach(o => { o.classList.remove('wrong','correct'); o.disabled = false; });
      document.getElementById('puzzleError').textContent = '';
    }, 2000);
  }
}

function renderMemoryPuzzle(box, config) {
  const next = config.next;
  const symbols = ['⚔','👑','🔑','📜','💎','🗡','🏰','🌙'];
  const pairs = [...symbols, ...symbols];
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }

  box.innerHTML = `
    <div class="puzzle-icon">🧠</div>
    <div class="puzzle-title">Seraphine's Cipher Lock</div>
    <div class="puzzle-desc">Match all symbol pairs to unlock the sealed chamber. Five mismatches allowed.</div>
    <div class="memory-grid" id="memGrid">
      ${pairs.map((s, i) => `
        <div class="mem-card" id="mc${i}" onclick="flipCard(${i})">
          <span class="mem-card-front">?</span>
          <span class="mem-card-back">${s}</span>
        </div>
      `).join('')}
    </div>
    <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-muted)">Mismatches: <span id="memMisses" style="color:var(--gold)">0</span> / 5</div>
    <div class="puzzle-error" id="puzzleError"></div>
  `;

  window._memState = { flipped: [], matched: 0, misses: 0, pairs, next, locked: false };
}

function flipCard(idx) {
  const ms = window._memState;
  if (ms.locked) return;
  const card = document.getElementById('mc' + idx);
  if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
  if (ms.flipped.length >= 2) return;

  card.classList.add('flipped');
  ms.flipped.push(idx);

  if (ms.flipped.length === 2) {
    ms.locked = true;
    const [a, b] = ms.flipped;
    setTimeout(() => {
      if (ms.pairs[a] === ms.pairs[b]) {
        document.getElementById('mc'+a).classList.add('matched');
        document.getElementById('mc'+b).classList.add('matched');
        ms.matched++;
        if (ms.matched === 8) {
          notify('✓ CHAMBER UNLOCKED');
          setTimeout(() => closePuzzle(ms.next), 800);
        }
      } else {
        document.getElementById('mc'+a).classList.remove('flipped');
        document.getElementById('mc'+b).classList.remove('flipped');
        ms.misses++;
        document.getElementById('memMisses').textContent = ms.misses;
        if (ms.misses >= 5) {
            document.getElementById('puzzleError').textContent = 'Too many mismatches — unmatched cards reset.';
            setTimeout(() => {
              document.querySelectorAll('.mem-card.flipped').forEach(c => c.classList.remove('flipped'));
              ms.misses = 0;
              document.getElementById('memMisses').textContent = '0';
              document.getElementById('puzzleError').textContent = '';
              ms.flipped = [];
              ms.locked = false;
            }, 1200);
            return;
        }
      }
      ms.flipped = [];
      ms.locked = false;
    }, 900);
  }
}

function renderConstellationPuzzle(box, config) {
  const next = config.next;
  box.innerHTML = `
    <div class="puzzle-icon">✨</div>
    <div class="puzzle-title">The Cartographer's Mask</div>
    <div class="puzzle-desc">Connect the stars in sequence (1 → 2 → 3 → 4) to pierce the mask.</div>
    <canvas id="constellationCanvas" width="300" height="200" style="background:#0a0a1a;border:1px solid var(--gold);border-radius:4px;cursor:crosshair;touch-action:none;"></canvas>
    <div style="margin-top:1rem;">
      <button class="puzzle-submit" onclick="resetConstellation()">RESET</button>
    </div>
  `;
  
  const canvas = document.getElementById('constellationCanvas');
  const ctx = canvas.getContext('2d');
  const stars = [
    {x: 50, y: 150, num: 1},
    {x: 100, y: 50, num: 2},
    {x: 200, y: 80, num: 3},
    {x: 250, y: 160, num: 4}
  ];
  let connected = [];
  let isDrawing = false;
  let mousePos = null;

  function draw() {
    ctx.clearRect(0,0,300,200);
    
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(201,162,39,0.8)';
    ctx.lineWidth = 2;
    for (let i=0; i<connected.length; i++) {
      const s = connected[i];
      if (i===0) ctx.moveTo(s.x, s.y);
      else ctx.lineTo(s.x, s.y);
    }
    if (isDrawing && mousePos && connected.length > 0) {
      const last = connected[connected.length-1];
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(mousePos.x, mousePos.y);
    }
    ctx.stroke();

    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, 6, 0, Math.PI*2);
      ctx.fillStyle = connected.includes(s) ? '#c9a227' : '#555';
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.num, s.x, s.y);
    });
  }

  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function getHoveredStar(p) {
    return stars.find(s => Math.hypot(s.x - p.x, s.y - p.y) < 15);
  }

  function handleStart(e) {
    e.preventDefault();
    const p = getMousePos(e);
    const star = getHoveredStar(p);
    if (star && connected.length === 0 && star.num === 1) {
      connected.push(star);
      isDrawing = true;
      mousePos = p;
      draw();
    }
  }

  function handleMove(e) {
    if (!isDrawing) return;
    e.preventDefault();
    mousePos = getMousePos(e);
    const star = getHoveredStar(mousePos);
    if (star && !connected.includes(star)) {
      const expected = connected.length + 1;
      if (star.num === expected) {
        connected.push(star);
        if (connected.length === stars.length) {
          isDrawing = false;
          draw();
          notify('✓ SEQUENCE ACCEPTED');
          setTimeout(() => closePuzzle(next), 1000);
          return;
        }
      } else {
        isDrawing = false;
        connected = [];
      }
    }
    draw();
  }

  function handleEnd(e) {
    if (isDrawing) {
      isDrawing = false;
      connected = [];
      draw();
    }
  }

  canvas.addEventListener('mousedown', handleStart);
  window.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleEnd);
  
  canvas.addEventListener('touchstart', handleStart, {passive:false});
  window.addEventListener('touchmove', handleMove, {passive:false});
  window.addEventListener('touchend', handleEnd);

  window.resetConstellation = () => { connected = []; isDrawing = false; draw(); };
  draw();
}

function renderTimelinePuzzle(box, config) {
  const next = config.next;
  const events = [
    { id: 'ev3', text: 'Cael leaves the edge of town.' },
    { id: 'ev1', text: 'The granary explodes.' },
    { id: 'ev2', text: 'Dani Sole arrives at the saloon.' },
    { id: 'ev4', text: 'The fire spreads to the stables.' }
  ];
  
  box.innerHTML = `
    <div class="puzzle-icon">📜</div>
    <div class="puzzle-title">The Fractured Timeline</div>
    <div class="puzzle-desc">Drag and drop the events into chronological order to find the contradiction.</div>
    <div id="timelineContainer" style="display:flex;flex-direction:column;gap:8px;margin:1rem 0;">
      ${events.map(ev => `
        <div class="timeline-event" draggable="true" data-id="${ev.id}" style="padding:10px;background:var(--surface);border:1px solid var(--border);border-radius:4px;cursor:grab;">
          ☰ ${ev.text}
        </div>
      `).join('')}
    </div>
    <button class="puzzle-submit" onclick="checkTimeline('${next}')">VERIFY TIMELINE</button>
    <div class="puzzle-error" id="timelineError"></div>
  `;

  const container = document.getElementById('timelineContainer');
  let draggedItem = null;

  container.querySelectorAll('.timeline-event').forEach(item => {
    item.addEventListener('dragstart', (e) => {
      draggedItem = item;
      setTimeout(() => item.style.opacity = '0.5', 0);
    });
    item.addEventListener('dragend', () => {
      setTimeout(() => {
        draggedItem.style.opacity = '1';
        draggedItem = null;
      }, 0);
    });
    item.addEventListener('dragover', (e) => e.preventDefault());
    item.addEventListener('dragenter', function(e) {
      e.preventDefault();
      this.style.border = '1px solid var(--gold)';
    });
    item.addEventListener('dragleave', function() {
      this.style.border = '1px solid var(--border)';
    });
    item.addEventListener('drop', function() {
      this.style.border = '1px solid var(--border)';
      if (this !== draggedItem) {
        let all = [...container.querySelectorAll('.timeline-event')];
        let draggedIdx = all.indexOf(draggedItem);
        let thisIdx = all.indexOf(this);
        if (draggedIdx < thisIdx) this.after(draggedItem);
        else this.before(draggedItem);
      }
    });
  });

  window.checkTimeline = (nextNode) => {
    const currentOrder = [...container.querySelectorAll('.timeline-event')].map(i => i.dataset.id);
    if (currentOrder.join(',') === 'ev1,ev3,ev2,ev4') {
      notify('✓ CONTRADICTION FOUND');
      closePuzzle(nextNode);
    } else {
      document.getElementById('timelineError').textContent = 'The sequence does not align with the testimonies.';
    }
  };
}

function openCodex() {
  const ep = EPISODES[state.episode];
  if (!ep) return;
  const loreEl = document.getElementById('codexLore');
  loreEl.innerHTML = state.loreUnlocked.map(l => `
    <div class="codex-entry">
      <div class="codex-entry-title">${l.title}</div>
      <div class="codex-entry-text">${l.text}</div>
    </div>
  `).join('');

  const charEl = document.getElementById('codexCharacters');
  const charKeys = Object.entries(CHARS).filter(([k]) => {
    return Object.values(ep).some(n => n && n.speaker === k);
  });
  charEl.innerHTML = charKeys.map(([name, data]) => `
    <div class="codex-entry" style="display:flex;gap:1rem;align-items:flex-start">
      <div class="portrait-circle" style="background:${data.color};flex-shrink:0">${data.init}</div>
      <div>
        <div class="codex-entry-title">${name}</div>
        <div class="codex-entry-text">Encountered in ${ep.meta.title}.</div>
      </div>
    </div>
  `).join('') || '<div class="codex-entry-text" style="color:var(--text-muted)">No characters unlocked yet.</div>';

  const decEl = document.getElementById('codexDecisions');
  const epDecisions = state.decisions.filter(d => d.ep === state.episode);
  decEl.innerHTML = epDecisions.length ? epDecisions.map(d => `
    <div class="decision-item">
      <div class="decision-dot"></div>
      <div class="decision-text">${d.text}</div>
    </div>
  `).join('') : '<div class="codex-entry-text" style="color:var(--text-muted)">No decisions recorded yet.</div>';

  document.getElementById('codexOverlay').classList.add('active');

  const totalLore = state.loreUnlocked.length;
  const viewed = parseInt(localStorage.getItem('chronicles_lore_viewed_' + state.episode) || '0');
  localStorage.setItem('chronicles_lore_viewed_' + state.episode, totalLore);
  if (totalLore >= 3) Achievements.unlock('archivist');
}

function closeCodex() {
  document.getElementById('codexOverlay').classList.remove('active');
}

function codexTab(tab) {
  document.querySelectorAll('.codex-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.codex-section').forEach(s => s.classList.remove('active'));
  document.querySelector(`.codex-tab[onclick="codexTab('${tab}')"]`).classList.add('active');
  document.getElementById('codex' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeCodex();
    if (document.getElementById('puzzleOverlay').classList.contains('active')) {
    }
  }
});

window.onload = () => {
  Settings.load();
  initParallax();
  if (Auth.currentUser()) {
    showScreen('menuScreen');
    setTimeout(() => {         
      initMenu();
      document.addEventListener('click', startMenuMusic, { once: true });
    }, 50);
  } else {
    showScreen('loginScreen');
  }
};

function initParallax() {
  let parallaxTicking = false;
  document.addEventListener('mousemove', (e) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!parallaxTicking) {
      window.requestAnimationFrame(() => {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const dx = (e.clientX - cx) / cx;
        const dy = (e.clientY - cy) / cy;
        
        const scene = document.getElementById('scene');
        if (scene) scene.style.transform = `scale(1.05) translate(${dx * -10}px, ${dy * -10}px)`;
        
        const chars = document.querySelectorAll('.char');
        chars.forEach(c => {
          if (c.id === 'charLeft') c.style.transform = `translate(${dx * -20}px, ${dy * -5}px)`;
          if (c.id === 'charRight') c.style.transform = `scaleX(-1) translate(${dx * 20}px, ${dy * 5}px)`;
        });
        
        const particles = document.getElementById('particlesLayer');
        if (particles) particles.style.transform = `translate(${dx * -30}px, ${dy * -15}px)`;
        
        parallaxTicking = false;
      });
      parallaxTicking = true;
    }
  });
}

function initMenu() {
  const welcomeEl = document.getElementById('welcomeUser');
  if (welcomeEl && Auth.currentUser()) {
    welcomeEl.textContent = 'WELCOME, ' + Auth.currentUser().toUpperCase();
  }

  const completed = SaveSystem.getCompletedEpisodes();

  const ep4Card = document.getElementById('ep4Card');
  if (ep4Card) {
    const ep4Unlocked = completed.length >= 2;
    if (!ep4Unlocked) {
      ep4Card.onclick = (e) => { e.stopImmediatePropagation(); notify('Complete any 2 episodes to unlock.'); };
      ep4Card.style.opacity = '0.5';
      ep4Card.style.cursor = 'not-allowed';
    } else {
      ep4Card.onclick = () => startEpisode(4);
      ep4Card.style.opacity = '';
      ep4Card.style.cursor = '';
    }
  }

  const ep5Card = document.getElementById('ep5Card');
  if (ep5Card) {
    const ep5Unlocked = completed.includes(4);
    if (!ep5Unlocked) {
      ep5Card.onclick = (e) => { e.stopImmediatePropagation(); notify('Complete Episode 4 to unlock.'); };
      ep5Card.style.opacity = '0.5';
      ep5Card.style.cursor = 'not-allowed';
    } else {
      ep5Card.onclick = () => startEpisode(5);
      ep5Card.style.opacity = '';
      ep5Card.style.cursor = '';
    }
  }
}

let authMode = 'login';

function toggleAuthMode() {
  authMode = authMode === 'login' ? 'register' : 'login';
  document.getElementById('authTitle').textContent = authMode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT';
  document.getElementById('authToggleText').textContent = authMode === 'login' ? 'No account?' : 'Have an account?';
  document.getElementById('authToggleLink').textContent = authMode === 'login' ? 'CREATE ONE' : 'SIGN IN INSTEAD';
  document.getElementById('authError').textContent = '';
}

function submitAuth() {
  const user = document.getElementById('authUser').value.trim();
  const pass = document.getElementById('authPass').value;
  if (!user || !pass) {
    document.getElementById('authError').textContent = 'Please fill in both fields.';
    return;
  }
  const result = authMode === 'login' ? Auth.login(user, pass) : Auth.register(user, pass);
  if (result.success) {
    showScreen('menuScreen');
    setTimeout(() => {         
      initMenu();
      document.addEventListener('click', startMenuMusic, { once: true });
    }, 50);
  } else {
    document.getElementById('authError').textContent = result.msg;
  }
}
