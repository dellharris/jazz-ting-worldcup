/* ================================================================
   JAZZ TING RADIO × WORLD CUP — app.js
   YouTube episodes + player interactions
================================================================ */

// Always land at the top of the page on load
if (history.scrollRestoration) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

/* ── Countdown to First ATL Match: June 14, 2026 · 3 PM ET ── */
(function () {
  // June 14, 2026 3:00 PM Eastern Time (UTC-4 in summer)
  const TARGET = new Date('2026-06-14T19:00:00Z');

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const diff = TARGET - Date.now();
    if (diff <= 0) {
      document.getElementById('cdDays').textContent  = '00';
      document.getElementById('cdHours').textContent = '00';
      document.getElementById('cdMins').textContent  = '00';
      document.getElementById('cdSecs').textContent  = '00';
      document.querySelector('.cd-label') && (document.querySelector('.cd-label').textContent = '⚽ MATCH DAY');
      return;
    }
    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000)  / 60000);
    const secs  = Math.floor((diff % 60000)    / 1000);
    document.getElementById('cdDays').textContent  = pad(days);
    document.getElementById('cdHours').textContent = pad(hours);
    document.getElementById('cdMins').textContent  = pad(mins);
    document.getElementById('cdSecs').textContent  = pad(secs);
  }

  tick();
  setInterval(tick, 1000);
})();

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
// Find each ID at: youtube.com/watch?v=YOUR_ID_IS_HERE
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
});

/* ── Hero Play Button — unmute/mute YouTube at 70% volume ──── */
let ytMuted = true;   // video starts muted (mute=1 in embed URL)

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

  const ARC_LEN = 265;   // matches SVG stroke-dasharray
  const MAX_DEG = 270;   // full knob travel (like a real mixer knob: 7 o'clock → 5 o'clock)
  let   rotDeg  = 0;     // current rotation (0 = fully counter-clockwise)
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
    // CSS: knob starts at -135deg visually, add rotDeg progress
    knob.style.transform = `rotate(${rotDeg - 135}deg)`;
    // Arc: offset from full (265) down to 0
    arcFill.style.strokeDashoffset = ARC_LEN - (rotDeg / MAX_DEG) * ARC_LEN;
    // Feedback text
    if (rotDeg >= MAX_DEG * 0.85) {
      instrEl.textContent = 'ALMOST THERE...';
      led.style.setProperty('background', 'radial-gradient(circle at 35% 30%, #ffdd60, #cc8800)', '');
      led.style.boxShadow  = '0 0 10px rgba(255,200,0,0.8)';
      led.style.animation  = 'none';
      statusEl.textContent = 'POWERING ON';
    } else if (rotDeg >= MAX_DEG * 0.35) {
      instrEl.textContent = 'KEEP TURNING...';
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
    if (delta > 0) setRotation(rotDeg + delta);  // clockwise only
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

  // Check for completion
  const check = setInterval(() => {
    if (rotDeg >= MAX_DEG - 2) {
      clearInterval(check);
      powerOn();
    }
  }, 40);

  function powerOn() {
    isDrag = false;
    led.className = 'po-led po-led-on';
    led.style.cssText = '';
    statusEl.textContent = 'ON AIR';
    instrEl.textContent  = 'POWERED ON';
    // Screen flicker → fade out
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

  // If a playlist ID is set, inject a native YouTube playlist player at the top
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
  // Keep index in sync so Next/Prev stay relative to what's playing
  const idx = EPISODES.findIndex(e => e.id === videoId);
  if (idx !== -1) currentEpIndex = idx;

  // Replace studio image with embedded player
  const wrap = document.querySelector('.studio-video-wrap');
  if (!wrap) return;
  wrap.innerHTML = `
    <iframe
      src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0"
      style="position:absolute;inset:0;width:100%;height:100%;border:none;"
      allowfullscreen
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    ></iframe>`;
  document.querySelector('.pbar-time').textContent = 'Playing: ' + title.slice(0, 30) + '…';
}

/* ── Player Controls ──────────────────────────────────────── */
let currentEpIndex = -1;  // -1 = hero default (not an episode yet)

function initPlayer() {
  // Scrubber fill visual
  let pct = 0;
  setInterval(() => {
    pct = (pct + 0.05) % 100;
    const fill = document.getElementById('scrubFill');
    if (fill) fill.style.width = pct + '%';
  }, 300);

  // VU meter animation
  animateVU();

  // Wire Next / Prev buttons
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
  const btn  = document.getElementById('playBtn');
  const wrap = document.querySelector('.studio-video-wrap');
  if (!wrap) return;

  // Open the YouTube channel in a new tab (no channel ID needed)
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

    // Basic validation
    if (!form.checkValidity()) { form.reportValidity(); return; }

    // Build JSONP URL (Mailchimp requires /post-json endpoint)
    const action = form.action.replace('/post?', '/post-json?') + '&c=_mcCb';
    const params = new URLSearchParams(new FormData(form)).toString();

    btnText.textContent = 'Sending…';
    btn.disabled = true;
    msg.className = 'cf-msg';
    msg.textContent = '';

    // JSONP callback
    window._mcCb = function (res) {
      btn.disabled = false;
      btnText.textContent = 'Send Inquiry';
      if (res.result === 'success') {
        msg.className = 'cf-msg cf-msg-ok';
        msg.textContent = '✦ Got it — we\'ll be in touch within 48 hours.';
        form.reset();
      } else {
        msg.className = 'cf-msg cf-msg-err';
        // Strip Mailchimp's HTML from error string
        msg.textContent = res.msg.replace(/<[^>]+>/g, '') || 'Something went wrong. Please try again.';
      }
      // Clean up script tag
      const old = document.getElementById('_mcScript');
      if (old) old.remove();
    };

    const script = document.createElement('script');
    script.id  = '_mcScript';
    script.src = action + '&' + params;
    document.body.appendChild(script);
  });
})();

/* ── Utils ────────────────────────────────────────────────── */
function escHtml(s) {
  return String(s || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
