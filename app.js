/* ================================================================
   JAZZ TING RADIO × WORLD CUP — app.js
   YouTube episodes + player interactions
================================================================ */

const CONFIG = {
  YT_API_KEY:    'PASTE_YOUR_API_KEY_HERE',
  CHANNEL_ID:    'PASTE_YOUR_CHANNEL_ID_HERE',
  CHANNEL_HANDLE:'jazztingradio',
  YT_CHANNEL_URL:'https://www.youtube.com/@jazztingradio',
  MAX_EPISODES:  20
};

// Fallback episodes (replace IDs with real ones from your channel)
const FALLBACK_EPISODES = [
  { id:'dQw4w9WgXcQ', title:'All Vinyl Jazz Funk Soul Mix', host:'DJ Cozy Shawn', views:'2 views' },
  { id:'dQw4w9WgXcQ', title:'OutKast vs Larry June Mashup', host:'Jazz Ting Radio', views:'1 view' },
  { id:'dQw4w9WgXcQ', title:'A Jazzy Mix of House & Beats — Atlanta', host:'Dell Harris', views:'1 view' },
  { id:'dQw4w9WgXcQ', title:'They Lied About UK Garage', host:'Jazz Ting Radio', views:'1.5K views' },
  { id:'dQw4w9WgXcQ', title:"It Don't Matter: Black Roots of UK Garage", host:'Jazz Ting Radio', views:'12 views' },
  { id:'dQw4w9WgXcQ', title:'Story of UKG', host:'Jazz Ting Radio', views:'73 views' },
  { id:'dQw4w9WgXcQ', title:'Throw Back NYC Session', host:'Dell Harris', views:'Recent' }
];

document.addEventListener('DOMContentLoaded', () => {
  initPlayer();
  initEpisodeTabs();

  if (isConfigured()) {
    fetchEpisodes();
  } else {
    renderFallbackEpisodes();
  }
});

function isConfigured() {
  return CONFIG.YT_API_KEY !== 'PASTE_YOUR_API_KEY_HERE' && CONFIG.CHANNEL_ID !== 'PASTE_YOUR_CHANNEL_ID_HERE';
}

/* ── YouTube Episodes ─────────────────────────────────────── */
async function fetchEpisodes() {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CONFIG.CHANNEL_ID}&type=video&order=date&maxResults=${CONFIG.MAX_EPISODES}&key=${CONFIG.YT_API_KEY}`;
    const res  = await fetch(url);
    const data = await res.json();
    if (!data.items?.length) { renderFallbackEpisodes(); return; }

    const episodes = data.items.map(item => ({
      id:    item.id.videoId,
      title: item.snippet.title,
      host:  item.snippet.channelTitle || 'Jazz Ting Radio',
      views: formatDate(item.snippet.publishedAt),
      thumb: item.snippet.thumbnails.medium?.url
    }));

    renderEpisodes(episodes);
  } catch { renderFallbackEpisodes(); }
}

function renderFallbackEpisodes() {
  const episodes = FALLBACK_EPISODES.map(e => ({
    ...e,
    thumb: `https://img.youtube.com/vi/${e.id}/mqdefault.jpg`
  }));
  renderEpisodes(episodes);
}

function renderEpisodes(episodes) {
  const list = document.getElementById('episodesList');
  if (!list) return;
  list.innerHTML = episodes.map(e => `
    <div class="ep-item" onclick="playEpisode('${escHtml(e.id)}','${escHtml(e.title)}')">
      <div class="ep-thumb">
        <img src="${escHtml(e.thumb)}" alt="${escHtml(e.title)}" loading="lazy"
             onerror="this.src='https://img.youtube.com/vi/${escHtml(e.id)}/hqdefault.jpg'">
      </div>
      <div class="ep-info">
        <div class="ep-title">${escHtml(e.title)}</div>
        <div class="ep-host">${escHtml(e.host)}</div>
        <div class="ep-meta">${escHtml(e.views)}</div>
      </div>
    </div>`).join('');
}

function playEpisode(videoId, title) {
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
function initPlayer() {
  // Animate scrubber fill for visual effect
  let pct = 0;
  setInterval(() => {
    pct = (pct + 0.05) % 100;
    const fill = document.getElementById('scrubFill');
    if (fill) fill.style.width = pct + '%';
  }, 300);
}

function togglePlay() {
  const btn  = document.getElementById('playBtn');
  const wrap = document.querySelector('.studio-video-wrap');
  if (!wrap) return;

  // On first play, swap image for YouTube live embed
  if (wrap.querySelector('img')) {
    wrap.innerHTML = `
      <iframe
        src="https://www.youtube.com/embed/live_stream?channel=${CONFIG.CHANNEL_ID || ''}&autoplay=1&rel=0"
        style="position:absolute;inset:0;width:100%;height:100%;border:none;"
        allowfullscreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      ></iframe>`;
  }
}

/* ── Episode Tabs ─────────────────────────────────────────── */
function initEpisodeTabs() {
  document.querySelectorAll('.ep-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.ep-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
}

/* ── Utils ────────────────────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return ''; }
}

function escHtml(s) {
  return String(s || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
