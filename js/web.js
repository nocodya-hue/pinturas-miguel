// Pinturas Miguel Asturias · interacción (sin librerías)
(() => {
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ahorro = navigator.connection && navigator.connection.saveData;

  // cabecera sólida al bajar + barra de progreso (la línea de luz) + barra del móvil
  const cab = $('[data-cab]'), barra = $('.barra-movil'), hero = $('.hero');
  let pendiente = false;
  const alScroll = () => {
    pendiente = false;
    const y = scrollY, alto = document.documentElement.scrollHeight - innerHeight;
    cab.classList.toggle('solida', y > 30);
    cab.style.setProperty('--p', alto > 0 ? Math.min(1, y / alto).toFixed(4) : 0);
    if (barra) barra.classList.toggle('visible', y > (hero ? hero.offsetHeight * .7 : innerHeight * .7));
  };
  addEventListener('scroll', () => { if (!pendiente) { pendiente = true; requestAnimationFrame(alScroll); } }, { passive: true });
  alScroll();

  // menú del móvil
  const bm = $('[data-menu]');
  bm.addEventListener('click', () => { const ab = cab.classList.toggle('abierta'); bm.setAttribute('aria-expanded', ab); });
  $$('#menu a').forEach((a) => a.addEventListener('click', () => { cab.classList.remove('abierta'); bm.setAttribute('aria-expanded', false); }));

  // aparición
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  $$('.aparece').forEach((el) => io.observe(el));

  // vídeos mudos: se cargan y reproducen solo cuando se ven
  const arranca = (v) => {
    if (!v.src && v.dataset.src) { v.src = v.dataset.src; v.load(); }
    const p = v.play(); if (p) p.then(() => v.classList.add('vivo')).catch(() => {});
  };
  if (!reducido && !ahorro) {
    const iov = new IntersectionObserver((es) => es.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting) arranca(v); else if (!v.paused) v.pause();
    }), { threshold: .35 });
    $$('video[data-src]:not(.hero__video)').forEach((v) => iov.observe(v));
    const hv = $('.hero__video');
    if (hv) addEventListener('load', () => setTimeout(() => { arranca(hv); iov.observe(hv); }, 300), { once: true });
  }

  // la linterna: la luz rasante sobre la pared (sigue al ratón o al dedo; si nadie la toca, barre sola)
  const lin = $('[data-linterna]');
  if (lin) {
    const esc = $('[data-escena]', lin), est = $('[data-luz-estado]', lin), pista = $('[data-pista]', lin);
    const TXT = {
      antes: 'Así estaba: bultos, parches y marcas que la luz no perdona.',
      despues: 'Rehecha: masilla, alisado y lijado. Lisa aunque la luz la roce.',
    };
    $$('[data-luz]', lin).forEach((b) => b.addEventListener('click', () => {
      lin.dataset.estado = b.dataset.luz;
      $$('[data-luz]', lin).forEach((x) => x.setAttribute('aria-pressed', x === b));
      est.textContent = TXT[b.dataset.luz];
    }));
    if (matchMedia('(pointer: coarse)').matches && pista) pista.textContent = 'Desliza el dedo por la pared';
    let w = 0, h = 0, manual = -1e9, visible = false;
    const t0 = performance.now();
    const mide = () => {
      const r = esc.getBoundingClientRect(); w = r.width; h = r.height;
      esc.style.setProperty('--rx', Math.round(w * .32) + 'px');
      esc.style.setProperty('--ry', Math.round(h * .46) + 'px');
    };
    const pon = (px, py) => { esc.style.setProperty('--x', px.toFixed(1) + 'px'); esc.style.setProperty('--y', py.toFixed(1) + 'px'); };
    mide(); pon(w * .3, h * .45);
    addEventListener('resize', mide);
    const mueve = (e) => {
      const r = esc.getBoundingClientRect();
      pon(Math.max(0, Math.min(r.width, e.clientX - r.left)), Math.max(0, Math.min(r.height, e.clientY - r.top)));
      manual = performance.now(); lin.classList.add('tocada');
    };
    esc.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.buttons) mueve(e); });
    esc.addEventListener('pointerdown', mueve);
    const vuelta = (t) => {
      if (!visible) return;
      if (t - manual > 2600) {
        const k = (t - t0) / 1000;
        pon(w * (.5 + .36 * Math.sin(k * .9)), h * (.47 + .14 * Math.sin(k * 1.6)));
      }
      requestAnimationFrame(vuelta);
    };
    if (reducido) pon(w * .5, h * .45);
    else new IntersectionObserver((es) => { const antes = visible; visible = es[0].isIntersecting; if (visible && !antes) { mide(); requestAnimationFrame(vuelta); } }).observe(esc);
  }

  // antes / después en las obras
  $$('.obra').forEach((o) => {
    $$('[data-ver]', o).forEach((b) => b.addEventListener('click', () => {
      const antes = b.dataset.ver === 'antes';
      o.classList.toggle('ver-antes', antes);
      $$('[data-ver]', o).forEach((x) => x.setAttribute('aria-pressed', x === b));
    }));
  });

  // más obras en el móvil
  const mas = $('[data-mas]');
  if (mas) mas.addEventListener('click', () => { $('[data-minis]').classList.add('todas'); mas.remove(); });

  // vídeo de la clienta, con sonido al pulsar
  const vt = $('[data-video-sonido]'), bp = $('[data-play]');
  if (vt && bp) bp.addEventListener('click', () => { vt.controls = true; vt.muted = false; vt.play(); bp.hidden = true; });

  // visor de fotos
  const dlg = $('[data-visor-dlg]'), img = $('[data-visor-img]'), tit = $('[data-visor-tit]'), num = $('[data-visor-n]');
  let lista = [], i = 0, origen = null;
  const pinta = () => {
    const [src, w, h] = lista[i];
    img.src = src; img.width = w; img.height = h; img.alt = `${tit.textContent}, foto ${i + 1}`;
    num.textContent = `${i + 1} / ${lista.length}`;
    const sig = lista[(i + 1) % lista.length]; if (sig) { const p = new Image(); p.src = sig[0]; }
  };
  const mueveV = (d) => { i = (i + d + lista.length) % lista.length; pinta(); };
  $$('[data-visor]').forEach((b) => b.addEventListener('click', () => {
    lista = JSON.parse(b.dataset.visor); i = 0; origen = b;
    tit.textContent = b.dataset.titulo || '';
    pinta(); dlg.showModal(); document.body.style.overflow = 'hidden';
  }));
  dlg.addEventListener('close', () => { document.body.style.overflow = ''; img.removeAttribute('src'); if (origen) origen.focus(); });
  $('[data-visor-x]').addEventListener('click', () => dlg.close());
  $('[data-visor-ant]').addEventListener('click', () => mueveV(-1));
  $('[data-visor-sig]').addEventListener('click', () => mueveV(1));
  dlg.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') mueveV(-1); if (e.key === 'ArrowRight') mueveV(1); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.matches('[data-visor-esc]')) dlg.close(); });
  let x0 = null;
  const ve = $('[data-visor-esc]');
  ve.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  ve.addEventListener('touchend', (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 45) mueveV(dx < 0 ? 1 : -1); x0 = null; });

  // formulario → WhatsApp
  const f = $('[data-form]');
  if (f) f.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    const n = f.elements.nombre;
    if (!d.nombre.trim()) { n.classList.add('error'); n.focus(); return; }
    n.classList.remove('error');
    const t = `Hola Miguel, soy ${d.nombre.trim()}${d.pueblo.trim() ? ` (${d.pueblo.trim()})` : ''}.\nMe interesa: ${d.tipo}.\n${d.mensaje.trim()}`;
    window.open(`https://wa.me/${window.WA}?text=${encodeURIComponent(t.trim())}`, '_blank', 'noopener');
  });
})();
