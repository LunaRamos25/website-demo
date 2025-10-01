// Reads the CSS var and sets the wobble strength on the SVG filter.
(function () {
  var doc = document.documentElement;
  var scale = getComputedStyle(doc).getPropertyValue('--lg-distortion-scale').trim() || '70';
  var fe = document.querySelector('filter#glass-distortion feDisplacementMap');
  if (fe) fe.setAttribute('scale', scale);
})();

(function () {
  // “Lower than lg” in Bootstrap = below 992px
  var mq = window.matchMedia('(max-width: 991.98px)');

  function apply(e) {
    document.querySelectorAll('[data-lgdown-class]').forEach(function (el) {
      var classes = (el.dataset.lgdownClass || '').split(/\s+/).filter(Boolean);
      classes.forEach(function (c) { el.classList.toggle(c, e.matches); });
    });
  }

  if (mq.addEventListener) mq.addEventListener('change', apply);
  else mq.addListener(apply);
  apply(mq);
})();

/* =========
   Animate-on-view logic:
   - Enables IntersectionObserver ONLY on ≥992px
   - On <992px: disables the observer, forces elements to "shown" state and removes transitions so nothing animates.
========= */
(function () {
  var mqLG = window.matchMedia('(min-width: 992px)');
  var io = null;

  var animated = Array.prototype.slice.call(document.querySelectorAll('.animate'));

  function enableIO() {
    if (io) return;
    // Remove any inline transition disabling from mobile state
    animated.forEach(function (el) {
      el.classList.remove('show');      // let IO drive it
      el.style.transition = '';         // restore CSS-defined transitions
    });

    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
        } else {
          entry.target.classList.remove('show');
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

    animated.forEach(function (el) { io.observe(el); });
  }

  function disableIO() {
    if (io) { io.disconnect(); io = null; }
    // Force everything visible immediately and kill transitions so it doesn't animate-in
    animated.forEach(function (el) {
      el.classList.add('show');
      el.style.transition = 'none';   // prevents any fade/slide on mobile
    });
  }

  function apply(e) {
    if (e.matches) {     // ≥992px
      enableIO();
    } else {             // <992px
      disableIO();
    }
  }

  if (mqLG.addEventListener) mqLG.addEventListener('change', apply);
  else mqLG.addListener(apply);
  apply(mqLG);
})();

// TEAM — prevent iOS double-tap zoom from hijacking arrow taps
(function () {
  var el = document.getElementById('teamCarousel');
  if (!el) return;
  el.addEventListener('dblclick', function (e) { e.preventDefault(); }, { passive: false });
  var lastTouch = 0;
  el.addEventListener('touchend', function (e) {
    var now = Date.now();
    if (now - lastTouch <= 350) { e.preventDefault(); }
    lastTouch = now;
  }, { passive: false });
})();

// TEAM — Toggle between Co-Founders and Core Team with animations
(function () {
  // --- Data for the teams ---
  const coFounders = [
    { name: 'Mark De Leon', imgSrc: 'assets/DELEON.png' },
    { name: 'Paulo Ramos', imgSrc: 'assets/RAMOS.png' },
    { name: 'Christian Diaz', imgSrc: 'assets/DIAZ.png' },
    { name: 'Jeric Lauresta', imgSrc: 'assets/LAURESTA.png' },
    { name: 'Ivan Tuazon', imgSrc: 'assets/TUAZON.png' },
  ];

  // *** THIS SECTION HAS BEEN UPDATED WITH UNIQUE DATA ***
  const coreTeam = [
    { name: 'Rainiel Paz', imgSrc: 'assets/PAZ.png' },
    { name: 'Mark Quicay', imgSrc: 'assets/QUICAY.png' },
    { name: 'Namiel Paz', imgSrc: 'assets/PAZM.png' },
    { name: 'Priya Patel', imgSrc: 'assets/PATEL.png' },
    { name: 'Kenji Tanaka', imgSrc: 'assets/TANAKA.png' },
  ];
  // --- End of Data ---

  const toggleContainer = document.getElementById('teamToggle');
  if (!toggleContainer) {
    console.error('Team toggle container not found!');
    return;
  }
  
  const desktopMembers = document.querySelectorAll('.team-rail .member');
  const mobileMembers = document.querySelectorAll('#teamCarousel .carousel-item');
  const allTeamMembers = [...desktopMembers, ...mobileMembers];

  function updateTeamView(teamData) {
    // Update desktop view
    desktopMembers.forEach((member, index) => {
      const data = teamData[index] || { name: 'Member', imgSrc: 'assets/phd.jpg' };
      const img = member.querySelector('.member-photo');
      const nameMeta = member.querySelector('.member-meta .name');
      const nameSpotlight = member.querySelector('.spot-name');
      const figure = member.querySelector('.member-card');
      if (img) img.src = data.imgSrc;
      if (nameMeta) nameMeta.textContent = data.name;
      if (nameSpotlight) nameSpotlight.textContent = data.name;
      if (figure) figure.setAttribute('aria-label', data.name);
    });

    // Update mobile view
    mobileMembers.forEach((member, index) => {
      const data = teamData[index] || { name: 'Member', imgSrc: 'assets/phd.jpg' };
      const img = member.querySelector('.media-34-img');
      const nameMeta = member.querySelector('.media-34-meta .name');
      if (img) img.src = data.imgSrc;
      if (nameMeta) nameMeta.textContent = data.name;
    });
  }

  toggleContainer.addEventListener('click', function(e) {
    if (!e.target.matches('.btn-toggle') || e.target.classList.contains('active')) return;

    // 1. Update button state and trigger slider
    toggleContainer.querySelector('.active').classList.remove('active');
    e.target.classList.add('active');
    const teamToShow = e.target.dataset.team;
    if (teamToShow === 'coreteam') {
      toggleContainer.classList.add('core-active');
    } else {
      toggleContainer.classList.remove('core-active');
    }

    // 2. Animate out current members
    allTeamMembers.forEach(member => {
        member.classList.add('animate-out');
        member.classList.remove('animate-in'); // clean up previous animation
    });

    // 3. Wait for 'out' animation, then swap content and animate 'in'
    setTimeout(() => {
      const teamData = teamToShow === 'coreteam' ? coreTeam : coFounders;
      updateTeamView(teamData);

      allTeamMembers.forEach(member => {
        member.classList.remove('animate-out');
        member.classList.add('animate-in');
      });

      // 4. Clean up 'in' class after animations finish
      // Longest delay (0.4s) + transition duration (0.5s)
      setTimeout(() => {
        allTeamMembers.forEach(member => member.classList.remove('animate-in'));
      }, 900);

    }, 400); // This should match the transition duration in the CSS
  });
})();