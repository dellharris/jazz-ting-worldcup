/* ================================================================
   JAZZ TING RADIO — app.js
   YouTube episodes + player interactions
================================================================ */

// Always land at the top of the page on load
if (history.scrollRestoration) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

/* ──────────────────────────────────────────────────────────────
   NO API KEY NEEDED. To add your real videos:

   1. Go to youtube.com/@jazztingradio
   2. Click any video → copy the ID from the URL:
      youtube.com/watch?v=  >>>  THIS_11_CHAR_PART  <<<
   3. Paste each ID into EPISODES below

   OPTIONAL PLAYLIST EMBED:
   - Go to your channel → Playlists tab → open a playlist
   - Copy the ID from the URL: youtube.com/playlist?list= >>>ID<<<
   - Paste it as PLAYLIST_ID below to show the full playlist player
────────────────────────────────────────────────────────────────*/

const CONFIG = {
  CHANNEL_HANDLE: 'jazztingradio',
  YT_CHANNEL_URL: 'https://www.youtube.com/@jazztingradio',
  PLAYLIST_ID:    ''   // optional: paste your playlist ID here
};

// ── Add your real video IDs here ──────────────────────────────
const EPISODES = [
  { id:'hPrOw27Sves', title:'All Vinyl Jazz Funk Soul Mix',            host:'DJ Cozy Shawn',   date:'Recent' },
  { id:'KqTbh0HuK7E', title:'OutKast vs Larry June Mashup',            host:'Jazz Ting Radio', date:'Recent' },
  { id:'DPbPblyTr7w', title:'A Jazzy Mix of House & Beats — Atlanta',  host:'Dell Harris',     date:'Recent' },
  { id:'v_0ntWlxQfA', title:'They Lied About UK Garage',               host:'Jazz Ting Radio', date:'Recent' },
  { id:'sUy6hqrtd_Q', title:"It Don't Matter: Black Roots of UK Garage", host:'Jazz Ting Radio', date:'Recent' },
  { id:'xzXfs8tzSZM', title:'Story of UKG',                            host:'Jazz Ting Radio', date:'Recent' },
  { id:'9pC5pjgzUjc', title:'Throw Back NYC Session',                  host:'Dell Harris',     date:'Recent' }
];

document.addEventListener('DOMContentLoaded', () => {
  initPowerOn();
  initPlayer();
  initEpisodeTabs();
  renderEpisodes();
  initRadioShuffle();
  initUniverseNav();
  initSFTransition();
});

/* ── Hero Play Button — unmute/mute YouTube at 70% volume ──── */
let ytMuted = true;

function _ytCmd(func, args) {
  const iframe = document.getElementById('ytHeroPlayer');
  if (!iframe) return;
  iframe.contentWindow.postMessage(
    JSON.stringify({ event: 'command', func, args: args || [] }),
    '*'
  );
}

function _updatePlayBtn(playing) {
  const pauseIcon = '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>';
  const playIcon  = '<path d="M8 5v14l11-7z"/>';
  const btn = document.getElementById('heroScBtn');
  if (btn) {
    btn.querySelector('.hero-sc-icon').innerHTML = playing ? pauseIcon : playIcon;
    btn.classList.toggle('playing', playing);
  }
}

function triggerSCPlay() {
  if (ytMuted) {
    _ytCmd('unMute');
    _ytCmd('setVolume', [70]);
    ytMuted = false;
    _updatePlayBtn(true);
  } else {
    _ytCmd('mute');
    ytMuted = true;
    _updatePlayBtn(false);
  }
}

/* ── Radio Player: start on a random track ─────────────────── */
function initRadioShuffle() {
  const iframe = document.querySelector('.radio-display-inner iframe');
  if (!iframe || typeof SC === 'undefined') return;

  const radioWidget = SC.Widget(iframe);
  radioWidget.bind(SC.Widget.Events.READY, () => {
    radioWidget.getSounds(sounds => {
      if (sounds && sounds.length > 1) {
        const randomIndex = Math.floor(Math.random() * sounds.length);
        radioWidget.skip(randomIndex);
      }
    });
  });
}

/* ── Power-On Knob ─────────────────────────────────────────── */
function initPowerOn() {
  const screen   = document.getElementById('powerOn');
  const knob     = document.getElementById('poKnob');
  const arcFill  = document.getElementById('poArcFill');
  const led      = document.getElementById('poLed');
  const instrEl  = document.getElementById('poInstruction');
  const statusEl = document.getElementById('poStatusText');
  if (!screen || !knob) return;

  const ARC_LEN = 265;
  const MAX_DEG = 270;
  let   rotDeg  = 0;
  let   isDrag  = false;
  let   lastAng = null;

  function pointerAngle(e) {
    const rect = knob.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const px = e.touches ? e.touches[0].clientX : e.clientX;
    const py = e.touches ? e.touches[0].clientY : e.clientY;
    return Math.atan2(py - cy, px - cx) * 180 / Math.PI;
  }

  function setRotation(deg) {
    rotDeg = Math.max(0, Math.min(MAX_DEG, deg));
    knob.style.transform = `rotate(${rotDeg - 135}deg)`;
    if (arcFill) arcFill.style.strokeDashoffset = ARC_LEN - (rotDeg / MAX_DEG) * ARC_LEN;
    if (rotDeg >= MAX_DEG * 0.85) {
      if (instrEl)  instrEl.textContent  = 'ALMOST THERE...';
      if (led) {
        led.style.setProperty('background', 'radial-gradient(circle at 35% 30%, #ffdd60, #cc8800)', '');
        led.style.boxShadow  = '0 0 10px rgba(255,200,0,0.8)';
        led.style.animation  = 'none';
      }
      if (statusEl) statusEl.textContent = 'POWERING ON';
    } else if (rotDeg >= MAX_DEG * 0.35) {
      if (instrEl) instrEl.textContent = 'KEEP TURNING...';
    }
  }

  knob.addEventListener('mousedown', e => {
    isDrag = true; lastAng = pointerAngle(e); e.preventDefault();
  });
  knob.addEventListener('touchstart', e => {
    isDrag = true; lastAng = pointerAngle(e); e.preventDefault();
  }, { passive: false });

  window.addEventListener('mousemove', e => {
    if (!isDrag) return;
    const ang = pointerAngle(e);
    let delta = ang - lastAng;
    if (delta >  180) delta -= 360;
    if (delta < -180) delta += 360;
    if (delta > 0) setRotation(rotDeg + delta);
    lastAng = ang;
  });
  window.addEventListener('touchmove', e => {
    if (!isDrag) return;
    const ang = pointerAngle(e);
    let delta = ang - lastAng;
    if (delta >  180) delta -= 360;
    if (delta < -180) delta += 360;
    if (delta > 0) setRotation(rotDeg + delta);
    lastAng = ang;
    e.preventDefault();
  }, { passive: false });

  window.addEventListener('mouseup',  () => { isDrag = false; lastAng = null; });
  window.addEventListener('touchend', () => { isDrag = false; lastAng = null; });

  const check = setInterval(() => {
    if (rotDeg >= MAX_DEG - 2) {
      clearInterval(check);
      powerOn();
    }
  }, 40);

  function powerOn() {
    isDrag = false;
    if (led) { led.className = 'po-led po-led-on'; led.style.cssText = ''; }
    if (statusEl) statusEl.textContent = 'ON AIR';
    if (instrEl)  instrEl.textContent  = 'POWERED ON';
    let ticks = 0;
    const flicker = setInterval(() => {
      screen.style.opacity = (ticks % 2 === 0) ? '0' : '0.5';
      ticks++;
      if (ticks >= 5) {
        clearInterval(flicker);
        screen.classList.add('po-powered');
        setTimeout(() => { screen.style.display = 'none'; }, 1000);
      }
    }, 90);
  }
}


/* ── YouTube Episodes ─────────────────────────────────────── */
function renderEpisodes() {
  const list = document.getElementById('episodesList');
  if (!list) return;

  let playlistEmbed = '';
  if (CONFIG.PLAYLIST_ID) {
    playlistEmbed = `
      <div class="ep-playlist-wrap">
        <iframe
          src="https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(CONFIG.PLAYLIST_ID)}&rel=0"
          style="width:100%;height:200px;border:none;border-radius:6px;"
          allowfullscreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        ></iframe>
      </div>`;
  }

  const cards = EPISODES.map(e => {
    const thumb = `https://img.youtube.com/vi/${e.id}/mqdefault.jpg`;
    return `
      <div class="ep-item" onclick="playEpisode('${escHtml(e.id)}','${escHtml(e.title)}')">
        <div class="ep-thumb">
          <img src="${escHtml(thumb)}" alt="${escHtml(e.title)}" loading="lazy"
               onerror="this.src='https://img.youtube.com/vi/${escHtml(e.id)}/hqdefault.jpg'">
        </div>
        <div class="ep-info">
          <div class="ep-title">${escHtml(e.title)}</div>
          <div class="ep-host">${escHtml(e.host)}</div>
          <div class="ep-meta">${escHtml(e.date)}</div>
        </div>
      </div>`;
  }).join('');

  list.innerHTML = playlistEmbed + cards;
}

function playEpisode(videoId, title) {
  const idx = EPISODES.findIndex(e => e.id === videoId);
  if (idx !== -1) currentEpIndex = idx;

  const iframe = document.getElementById('ytHeroPlayer');
  if (iframe) {
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: 'loadVideoById', args: [videoId] }), '*'
    );
    _ytCmd('unMute');
    _ytCmd('setVolume', [90]);
    ytMuted = false;
    _updatePlayBtn(true);
  }
  const timeEl = document.querySelector('.pbar-time');
  if (timeEl) timeEl.textContent = 'Playing: ' + title.slice(0, 30) + '…';
}

/* ── Player Controls ──────────────────────────────────────── */
let currentEpIndex = -1;

function initPlayer() {
  let pct = 0;
  setInterval(() => {
    pct = (pct + 0.05) % 100;
    const fill = document.getElementById('scrubFill');
    if (fill) fill.style.width = pct + '%';
  }, 300);

  animateVU();

  document.querySelectorAll('.pbar-btn').forEach(btn => {
    const label = btn.getAttribute('aria-label');
    if (label === 'Next')     btn.addEventListener('click', playNext);
    if (label === 'Previous') btn.addEventListener('click', playPrev);
  });
}

function playNext() {
  currentEpIndex = (currentEpIndex + 1) % EPISODES.length;
  const ep = EPISODES[currentEpIndex];
  playEpisode(ep.id, ep.title);
}

function playPrev() {
  currentEpIndex = (currentEpIndex - 1 + EPISODES.length) % EPISODES.length;
  const ep = EPISODES[currentEpIndex];
  playEpisode(ep.id, ep.title);
}

function animateVU() {
  const heights = [
    [22, 40, 60, 75, 50, 30],
    [30, 55, 70, 45, 65, 25],
    [18, 35, 52, 80, 40, 28],
    [35, 60, 48, 72, 38, 22],
  ];
  let frame = 0;
  setInterval(() => {
    frame = (frame + 1) % heights.length;
    const set = heights[frame];
    ['vuBarsL','vuBarsR'].forEach((id, i) => {
      const bars = document.querySelectorAll(`#${id} .r-vu-bar`);
      bars.forEach((bar, j) => {
        const base = set[j] || 20;
        const jitter = (Math.random() * 20 - 10);
        bar.style.height = Math.max(6, Math.min(96, base + jitter + (i * 5))) + '%';
      });
    });
  }, 140);
}

function togglePlay() {
  window.open(CONFIG.YT_CHANNEL_URL, '_blank');
}

/* ── Episode Tabs ─────────────────────────────────────────── */
function initEpisodeTabs() {
  const audioPanel = document.getElementById('epPanelAudio');
  const videoPanel = document.getElementById('epPanelVideo');

  document.querySelectorAll('.ep-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.ep-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const which = tab.dataset.tab || tab.textContent.trim().toLowerCase();
      if (which === 'audio') {
        if (audioPanel) audioPanel.style.display = 'block';
        if (videoPanel) videoPanel.style.display = 'none';
      } else {
        if (audioPanel) audioPanel.style.display = 'none';
        if (videoPanel) videoPanel.style.display = 'block';
      }
    });
  });
}

/* ── Mailchimp Contact Form ───────────────────────────────── */
(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const btn     = document.getElementById('cfSubmit');
    const btnText = document.getElementById('cfBtnText');
    const msg     = document.getElementById('cfMsg');

    if (!form.checkValidity()) { form.reportValidity(); return; }

    const action = form.action.replace('/post?', '/post-json?') + '&c=_mcCb';
    const params = new URLSearchParams(new FormData(form)).toString();

    btnText.textContent = 'Sending…';
    btn.disabled = true;
    msg.className = 'cf-msg';
    msg.textContent = '';

    window._mcCb = function (res) {
      btn.disabled = false;
      btnText.textContent = 'Send Inquiry';
      if (res.result === 'success') {
        msg.className = 'cf-msg cf-msg-ok';
        msg.textContent = '✦ Got it — we\'ll be in touch within 48 hours.';
        form.reset();
      } else {
        msg.className = 'cf-msg cf-msg-err';
        msg.textContent = res.msg.replace(/<[^>]+>/g, '') || 'Something went wrong. Please try again.';
      }
      const old = document.getElementById('_mcScript');
      if (old) old.remove();
    };

    const script = document.createElement('script');
    script.id  = '_mcScript';
    script.src = action + '&' + params;
    document.body.appendChild(script);
  });
})();

/* ── Enter the World — Tile Scramble Transition ────────────── */
function initSFTransition() {
  var btn = document.querySelector('.sf-cta');
  if (!btn) return;

  btn.addEventListener('click', function (e) {
    e.preventDefault();
    var dest = this.href;
    sfScramble('sf-promo.png', dest);
  });
}

function sfScramble(src, dest) {
  var W = window.innerWidth;
  var H = window.innerHeight;
  var ROWS = 10;
  var COLS = 10;
  var tW   = W / COLS;
  var tH   = H / ROWS;

  // Wrapper
  var wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;z-index:9500;overflow:hidden;background:#050302;';
  document.body.appendChild(wrap);

  // Build grid of image slices
  var tiles = [];
  for (var r = 0; r < ROWS; r++) {
    for (var c = 0; c < COLS; c++) {
      var div = document.createElement('div');
      div.style.cssText = [
        'position:absolute;',
        'left:'   + (c * tW) + 'px;',
        'top:'    + (r * tH) + 'px;',
        'width:'  + (tW + 1) + 'px;',
        'height:' + (tH + 1) + 'px;',
        'background-image:url(' + src + ');',
        'background-size:' + W + 'px ' + H + 'px;',
        'background-position:-' + (c * tW) + 'px -' + (r * tH) + 'px;',
        'background-repeat:no-repeat;',
        'opacity:0;',
        'will-change:transform,opacity;',
      ].join('');
      wrap.appendChild(div);
      tiles.push({ el: div, r: r, c: c });
    }
  }

  // Phase 1 — all tiles snap on instantly
  tiles.forEach(function (t) {
    t.el.style.opacity = '1';
  });

  // Phase 2 — 2 ultra-fast scramble passes
  var pass = 0;
  var PASSES = 2;

  function scramblePass() {
    pass++;
    tiles.forEach(function (t) {
      var tx = (Math.random() - 0.5) * W * 0.35;
      var ty = (Math.random() - 0.5) * H * 0.08;
      t.el.style.transition = 'transform 0.018s linear';
      t.el.style.transform  = 'translate(' + tx + 'px,' + ty + 'px)';
    });
    if (pass < PASSES) {
      setTimeout(scramblePass, 20);
    } else {
      wrap.style.filter = 'brightness(12) saturate(0)';
      setTimeout(function () {
        try { sessionStorage.setItem('jtr-enter', '1'); } catch(e) {}
        window.location.href = dest;
      }, 60);
    }
  }

  setTimeout(scramblePass, 30);
}

function escHtml(s) {
  return String(s || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Universe Nav ─────────────────────────────────────────── */
function initUniverseNav() {
  var overlay    = document.getElementById('jtrNav');
  if (!overlay) return;
  var hamburgers = document.querySelectorAll('.hamburger');

  function animateBurgers(opening) {
    hamburgers.forEach(function (btn) {
      btn.classList.remove('jtr-opening', 'jtr-closing');
      void btn.offsetWidth;
      btn.classList.add(opening ? 'jtr-opening' : 'jtr-closing');
    });
  }

  function openNav() {
    document.body.classList.add('jtr-nav-open');
    overlay.setAttribute('aria-hidden', 'false');
    hamburgers.forEach(function(b) { b.setAttribute('aria-label','Close navigation'); });
    animateBurgers(true);
  }

  function closeNav() {
    document.body.classList.remove('jtr-nav-open');
    overlay.setAttribute('aria-hidden', 'true');
    hamburgers.forEach(function(b) { b.setAttribute('aria-label','Open navigation'); });
    animateBurgers(false);
  }

  hamburgers.forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.body.classList.contains('jtr-nav-open') ? closeNav() : openNav();
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('jtr-nav-open')) closeNav();
  });

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeNav();
  });
}
