/* ============================================================
   Aymen Dehimi — portfolio interactions
   vanilla JS, no dependencies
   ============================================================ */
(() => {
  "use strict";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = matchMedia("(max-width: 820px)").matches;

  /* ---------- nav state + scroll progress ---------- */
  const nav = document.getElementById("nav");
  const progress = document.getElementById("progress");
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("scrolled", y > 40);
    const h = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- custom cursor ---------- */
  const cursor = document.getElementById("cursor");
  if (cursor && !isTouch) {
    let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; });
    const loop = () => {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.querySelectorAll("a, .work, button").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("big"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("big"));
    });
  }

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

  /* skill bars animate when their column enters */
  const sio = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); sio.unobserve(en.target); } });
  }, { threshold: 0.3 });
  document.querySelectorAll(".skill-col").forEach((el) => sio.observe(el));

  /* ---------- animated stat counters ---------- */
  const fmt = (n) => (n >= 1000 ? n.toLocaleString() : String(n));
  const runCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const dur = 1400, t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(target * eased)) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        reduced ? (en.target.textContent = fmt(parseFloat(en.target.dataset.count)) + (en.target.dataset.suffix || "")) : runCount(en.target);
        cio.unobserve(en.target);
      }
    });
  }, { threshold: 0.6 });
  document.querySelectorAll("[data-count]").forEach((el) => cio.observe(el));

  /* ============================================================
     Hero background: a living data-field of points + links
     ============================================================ */
  const canvas = document.getElementById("field");
  if (canvas && !reduced) {
    const ctx = canvas.getContext("2d");
    let w, h, dpr, pts = [];
    const mouse = { x: -9999, y: -9999 };

    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.width = innerWidth * dpr;
      h = canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + "px";
      canvas.style.height = innerHeight + "px";
      const count = Math.min(Math.floor((innerWidth * innerHeight) / 16000), 90);
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18 * dpr,
        vy: (Math.random() - 0.5) * 0.18 * dpr,
        r: (Math.random() * 1.6 + 0.6) * dpr,
      }));
    };
    resize();
    addEventListener("resize", resize);
    addEventListener("mousemove", (e) => { mouse.x = e.clientX * dpr; mouse.y = e.clientY * dpr; });
    addEventListener("mouseout", () => { mouse.x = -9999; mouse.y = -9999; });

    const LINK = 130; // px in device space (will scale with dpr)
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const linkDist = LINK * dpr;

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        // gentle drift
        p.x += p.vx; p.y += p.vy;
        // mouse repulsion
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const md = Math.hypot(dx, dy);
        if (md < 120 * dpr && md > 0) {
          const f = (120 * dpr - md) / (120 * dpr);
          p.x += (dx / md) * f * 1.6;
          p.y += (dy / md) * f * 1.6;
        }
        // wrap
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;

        // links
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < linkDist) {
            const a = (1 - d / linkDist) * 0.22;
            ctx.strokeStyle = `rgba(200,255,77,${a})`;
            ctx.lineWidth = dpr * 0.6;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
        // node
        const near = md < 150 * dpr;
        ctx.beginPath();
        ctx.fillStyle = near ? "rgba(200,255,77,0.9)" : "rgba(243,239,230,0.45)";
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(draw);
    };
    draw();
  }

  /* ============================================================
     About: self-drawing scatter + regression line (fig.1)
     ============================================================ */
  const plot = document.getElementById("plot");
  if (plot) {
    const P = { x0: 40, x1: 380, y0: 280, y1: 20 };
    const gridG = document.getElementById("grid");
    const pointsG = document.getElementById("points");
    const regline = document.getElementById("regline");
    const r2El = document.getElementById("r2");
    const NS = "http://www.w3.org/2000/svg";

    // grid
    for (let i = 1; i <= 4; i++) {
      const gx = P.x0 + ((P.x1 - P.x0) / 5) * i;
      const vy = document.createElementNS(NS, "line");
      vy.setAttribute("x1", gx); vy.setAttribute("y1", P.y1);
      vy.setAttribute("x2", gx); vy.setAttribute("y2", P.y0);
      gridG.appendChild(vy);
      const gy = P.y0 - ((P.y0 - P.y1) / 5) * i;
      const hz = document.createElementNS(NS, "line");
      hz.setAttribute("x1", P.x0); hz.setAttribute("y1", gy);
      hz.setAttribute("x2", P.x1); hz.setAttribute("y2", gy);
      gridG.appendChild(hz);
    }

    // synthetic correlated data: y = a*x + b + noise
    const N = 48, slope = 0.62, intercept = 0.18, noise = 0.16;
    const data = [];
    for (let i = 0; i < N; i++) {
      const x = Math.random();
      const y = Math.min(1, Math.max(0, slope * x + intercept + (Math.random() - 0.5) * 2 * noise));
      data.push({ x, y });
    }

    const toPx = (x, y) => ({
      px: P.x0 + x * (P.x1 - P.x0),
      py: P.y0 - y * (P.y0 - P.y1),
    });

    // ordinary least squares
    const computeFit = (pts) => {
      const n = pts.length;
      let sx = 0, sy = 0, sxy = 0, sxx = 0;
      pts.forEach((p) => { sx += p.x; sy += p.y; sxy += p.x * p.y; sxx += p.x * p.x; });
      const m = (n * sxy - sx * sy) / (n * sxx - sx * sx);
      const b = (sy - m * sx) / n;
      const my = sy / n;
      let ssTot = 0, ssRes = 0;
      pts.forEach((p) => { const pred = m * p.x + b; ssRes += (p.y - pred) ** 2; ssTot += (p.y - my) ** 2; });
      const r2 = 1 - ssRes / ssTot;
      return { m, b, r2 };
    };

    // render points
    const circles = data.map((d, i) => {
      const { px, py } = toPx(d.x, d.y);
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", px); c.setAttribute("cy", py); c.setAttribute("r", 0);
      c.style.transitionDelay = i * 14 + "ms";
      pointsG.appendChild(c);
      return { el: c, d };
    });

    const drawReg = () => {
      const { m, b, r2 } = computeFit(data);
      const a0 = toPx(0, Math.min(1, Math.max(0, b)));
      const a1 = toPx(1, Math.min(1, Math.max(0, m + b)));
      regline.setAttribute("x1", a0.px); regline.setAttribute("y1", a0.py);
      regline.setAttribute("x2", a1.px); regline.setAttribute("y2", a1.py);
      if (r2El) r2El.textContent = r2.toFixed(2);
    };

    let played = false;
    const play = () => {
      if (played) return; played = true;
      circles.forEach((c) => c.el.setAttribute("r", reduced ? 3.4 : 3.4));
      // animate r grow
      if (!reduced) {
        circles.forEach((c) => { c.el.style.transition = "r .5s var(--ease)"; });
        requestAnimationFrame(() => circles.forEach((c) => c.el.setAttribute("r", 3.4)));
      }
      // grow regression line after points settle
      regline.style.transition = reduced ? "none" : "all 1s cubic-bezier(.22,1,.36,1) .35s";
      setTimeout(drawReg, reduced ? 0 : 120);
    };
    const pio = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { play(); pio.disconnect(); } });
    }, { threshold: 0.4 });
    pio.observe(plot);

    // hover to perturb the cloud (recompute fit live)
    if (!isTouch) {
      const jitter = () => {
        circles.forEach((c) => {
          const { px, py } = toPx(c.d.x, c.d.y);
          c.el.setAttribute("cx", px + (Math.random() - 0.5) * 16);
          c.el.setAttribute("cy", py + (Math.random() - 0.5) * 16);
          c.el.setAttribute("fill", Math.random() > 0.5 ? "var(--accent-2)" : "var(--coral)");
        });
      };
      const settle = () => {
        circles.forEach((c) => {
          const { px, py } = toPx(c.d.x, c.d.y);
          c.el.setAttribute("cx", px); c.el.setAttribute("cy", py);
          c.el.setAttribute("fill", "var(--accent-2)");
        });
      };
      plot.addEventListener("mousemove", jitter);
      plot.addEventListener("mouseleave", settle);
    }
  }

  /* ---------- year in footer (auto) ---------- */
  // (kept static 2026 in markup; nothing to do)
})();
