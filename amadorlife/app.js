// House on the Green — interactions

document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }

  // Promo video sound toggle (starts muted so autoplay works everywhere)
  const video = document.getElementById('promoVideo');
  const soundToggle = document.getElementById('soundToggle');
  if (video && soundToggle) {
    soundToggle.addEventListener('click', () => {
      video.muted = !video.muted;
      soundToggle.innerHTML = video.muted ? '&#128264; Sound On' : '&#128266; Sound Off';
    });
  }

  // Countdown to event — Oct 17, 2026, 10:00 AM ET
  const countdown = document.getElementById('countdown');
  if (countdown) {
    const eventDate = new Date('2026-10-17T10:00:00-04:00');
    const update = () => {
      const diff = eventDate - new Date();
      if (diff <= 0) {
        countdown.textContent = "It's happening now — Founders Green";
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      countdown.innerHTML = `<strong>${days}</strong> day${days === 1 ? '' : 's'} until House on the Green`;
    };
    update();
    setInterval(update, 1000 * 60 * 60);
  }
});
