(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  /* ---------- helpers ---------- */
  function fitCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height || (w * (canvas.height / canvas.width))));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  /* ---------- nav ---------- */
  const toggle = document.querySelector(".nav-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  if (toggle && mobileNav) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      mobileNav.hidden = open;
      toggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
    });
    mobileNav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        mobileNav.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
      });
    });
  }

  /* ---------- reveal ---------- */
  const reveals = document.querySelectorAll(".section, .axis, .framework-panel, .closing-inner");
  reveals.forEach((el) => el.classList.add("reveal"));
  if (!reducedMotion && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- animation runners ---------- */
  const runners = {
    parallel: null,
    tree: null,
    vote: null,
    hero: null,
    framework: null,
  };

  function stopRunner(key) {
    if (runners[key]) {
      cancelAnimationFrame(runners[key].raf);
      runners[key] = null;
    }
  }

  /* ===== Parallel sampling ===== */
  function animateParallel(canvas, loop) {
    stopRunner("parallel");
    const start = performance.now();
    const duration = reducedMotion ? 0 : 4200;
    const state = { raf: 0 };

    function frame(now) {
      const { ctx, w, h } = fitCanvas(canvas);
      const t = reducedMotion ? 1 : clamp((now - start) / duration, 0, 1);
      const e = easeOutCubic(t);

      ctx.clearRect(0, 0, w, h);

      // prompt node
      const px = w * 0.14;
      const py = h * 0.5;
      ctx.fillStyle = "#0a3d42";
      roundRect(ctx, px - 42, py - 22, 84, 44, 12);
      ctx.fill();
      ctx.fillStyle = "#f7f2ea";
      ctx.font = "600 13px Sora, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Prompt", px, py);

      const n = 5;
      const scores = [0.42, 0.91, 0.58, 0.33, 0.71];
      const best = 1;
      const appear = clamp((t - 0.08) / 0.45, 0, 1);

      for (let i = 0; i < n; i++) {
        const ty = h * (0.18 + i * 0.16);
        const tx = w * 0.58;
        const local = easeOutCubic(clamp((appear - i * 0.08) / 0.55, 0, 1));
        const x = px + (tx - px) * local;
        const y = py + (ty - py) * local;
        const selected = t > 0.62 && i === best;

        ctx.strokeStyle = selected ? "#c56a1a" : "rgba(15, 92, 99, 0.35)";
        ctx.lineWidth = selected ? 2.4 : 1.4;
        ctx.beginPath();
        ctx.moveTo(px + 42, py);
        ctx.bezierCurveTo(px + 90, py, x - 70, y, x - 48, y);
        ctx.stroke();

        ctx.globalAlpha = 0.25 + 0.75 * local;
        ctx.fillStyle = selected ? "#c56a1a" : "#1f8a8c";
        roundRect(ctx, x - 48, y - 20, 96, 40, 10);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "600 12px Sora, sans-serif";
        ctx.fillText(`y${i + 1}`, x - 18, y);
        ctx.font = "500 11px Sora, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillText(scores[i].toFixed(2), x + 18, y);
        ctx.globalAlpha = 1;
      }

      // selector badge
      const selectT = easeInOut(clamp((t - 0.55) / 0.35, 0, 1));
      if (selectT > 0) {
        const bx = w * 0.86;
        const by = h * (0.18 + best * 0.16);
        ctx.globalAlpha = selectT;
        ctx.fillStyle = "#142028";
        roundRect(ctx, bx - 54, by - 18, 108, 36, 18);
        ctx.fill();
        ctx.fillStyle = "#f7f2ea";
        ctx.font = "600 12px Sora, sans-serif";
        ctx.fillText("best-of-n", bx, by);
        ctx.globalAlpha = 1;

        ctx.strokeStyle = `rgba(197, 106, 26, ${0.35 + 0.45 * selectT})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(w * 0.58 + 48, by);
        ctx.lineTo(bx - 54, by);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.fillStyle = "rgba(20,32,40,0.55)";
      ctx.font = "500 12px Sora, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Independent samples → verifier selects", 18, h - 16);

      // subtle pulse after done
      if (t >= 1 && loop && !reducedMotion) {
        const pulse = 0.5 + 0.5 * Math.sin(now / 500);
        ctx.strokeStyle = `rgba(197,106,26,${0.2 + 0.35 * pulse})`;
        ctx.lineWidth = 2;
        const by = h * (0.18 + best * 0.16);
        roundRect(ctx, w * 0.58 - 52, by - 24, 104, 48, 12);
        ctx.stroke();
      }

      if (t < 1) {
        state.raf = requestAnimationFrame(frame);
      } else if (loop && !reducedMotion) {
        state.raf = requestAnimationFrame(frame);
      }
    }

    state.raf = requestAnimationFrame(frame);
    runners.parallel = state;
  }

  /* ===== Tree search ===== */
  function animateTree(canvas, loop) {
    stopRunner("tree");
    const start = performance.now();
    const duration = reducedMotion ? 0 : 4800;
    const state = { raf: 0 };

    const nodes = [
      { id: 0, x: 0.5, y: 0.16, label: "root", keep: true },
      { id: 1, x: 0.28, y: 0.42, label: "s1", keep: true, parent: 0 },
      { id: 2, x: 0.5, y: 0.42, label: "s2", keep: false, parent: 0 },
      { id: 3, x: 0.72, y: 0.42, label: "s3", keep: true, parent: 0 },
      { id: 4, x: 0.18, y: 0.72, label: "s1a", keep: true, parent: 1 },
      { id: 5, x: 0.36, y: 0.72, label: "s1b", keep: false, parent: 1 },
      { id: 6, x: 0.62, y: 0.72, label: "s3a", keep: false, parent: 3 },
      { id: 7, x: 0.82, y: 0.72, label: "s3b", keep: true, parent: 3 },
    ];

    function frame(now) {
      const { ctx, w, h } = fitCanvas(canvas);
      const t = reducedMotion ? 1 : clamp((now - start) / duration, 0, 1);
      ctx.clearRect(0, 0, w, h);

      const expand = easeOutCubic(clamp(t / 0.55, 0, 1));
      const prune = easeInOut(clamp((t - 0.45) / 0.35, 0, 1));
      const path = easeInOut(clamp((t - 0.72) / 0.28, 0, 1));

      // edges
      nodes.forEach((n) => {
        if (n.parent == null) return;
        const p = nodes[n.parent];
        const appear = easeOutCubic(clamp((expand - n.id * 0.07) / 0.4, 0, 1));
        if (appear <= 0) return;
        const faded = !n.keep && prune > 0;
        ctx.globalAlpha = appear * (faded ? 1 - 0.75 * prune : 1);
        ctx.strokeStyle = n.keep && path > 0.2 && (n.id === 1 || n.id === 4 || n.id === 3 || n.id === 7)
          ? `rgba(197,106,26,${0.35 + 0.45 * path})`
          : "rgba(15,92,99,0.35)";
        ctx.lineWidth = n.keep && path > 0.4 ? 2.4 : 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x * w, p.y * h + 16);
        ctx.lineTo(n.x * w, n.y * h - 16);
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      nodes.forEach((n, i) => {
        const appear = easeOutCubic(clamp((expand - i * 0.07) / 0.4, 0, 1));
        if (appear <= 0) return;
        const faded = !n.keep && prune > 0;
        const x = n.x * w;
        const y = n.y * h;
        ctx.globalAlpha = appear * (faded ? 1 - 0.8 * prune : 1);
        ctx.fillStyle = n.keep ? (n.id === 4 || n.id === 7 ? "#c56a1a" : "#0f5c63") : "#7a8790";
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "600 11px Sora, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(n.label, x, y);
        ctx.globalAlpha = 1;

        if (faded && prune > 0.4) {
          ctx.strokeStyle = `rgba(122,135,144,${prune})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x - 10, y - 10);
          ctx.lineTo(x + 10, y + 10);
          ctx.moveTo(x + 10, y - 10);
          ctx.lineTo(x - 10, y + 10);
          ctx.stroke();
        }
      });

      // value badge
      const vb = easeOutCubic(clamp((t - 0.2) / 0.3, 0, 1));
      if (vb > 0) {
        ctx.globalAlpha = vb;
        ctx.fillStyle = "rgba(20,32,40,0.88)";
        roundRect(ctx, w * 0.62, h * 0.08, 150, 34, 10);
        ctx.fill();
        ctx.fillStyle = "#f7f2ea";
        ctx.font = "600 12px Sora, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("score V(state)", w * 0.62 + 75, h * 0.08 + 17);
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = "rgba(20,32,40,0.55)";
      ctx.font = "500 12px Sora, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Expand → evaluate → prune → deepen", 18, h - 16);

      if (t < 1) {
        state.raf = requestAnimationFrame(frame);
      } else if (loop && !reducedMotion) {
        // soft highlight pulse on kept leaves
        const pulse = 0.4 + 0.6 * Math.sin(now / 450);
        [4, 7].forEach((id) => {
          const n = nodes[id];
          ctx.strokeStyle = `rgba(197,106,26,${0.25 * pulse})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(n.x * w, n.y * h, 22, 0, Math.PI * 2);
          ctx.stroke();
        });
        state.raf = requestAnimationFrame(frame);
      }
    }

    state.raf = requestAnimationFrame(frame);
    runners.tree = state;
  }

  /* ===== Self-consistency ===== */
  function animateVote(canvas, loop) {
    stopRunner("vote");
    const start = performance.now();
    const duration = reducedMotion ? 0 : 4200;
    const state = { raf: 0 };
    const answers = ["42", "40", "42", "41", "42", "42", "39"];

    function frame(now) {
      const { ctx, w, h } = fitCanvas(canvas);
      const t = reducedMotion ? 1 : clamp((now - start) / duration, 0, 1);
      ctx.clearRect(0, 0, w, h);

      const px = w * 0.16;
      const py = h * 0.22;
      ctx.fillStyle = "#0a3d42";
      roundRect(ctx, px - 48, py - 20, 96, 40, 12);
      ctx.fill();
      ctx.fillStyle = "#f7f2ea";
      ctx.font = "600 13px Sora, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("CoT paths", px, py);

      const counts = { "42": 0, "40": 0, "41": 0, "39": 0 };
      const appearN = Math.floor(easeOutCubic(clamp(t / 0.55, 0, 1)) * answers.length);

      for (let i = 0; i < answers.length; i++) {
        const local = easeOutCubic(clamp((t - i * 0.06) / 0.35, 0, 1));
        if (local <= 0) continue;
        const x = w * (0.38 + (i % 4) * 0.14);
        const y = h * (0.18 + Math.floor(i / 4) * 0.22);
        if (i < appearN) counts[answers[i]] += 1;

        ctx.globalAlpha = local;
        ctx.strokeStyle = "rgba(15,92,99,0.3)";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(px + 48, py);
        ctx.quadraticCurveTo(w * 0.3, y, x - 28, y);
        ctx.stroke();

        ctx.fillStyle = answers[i] === "42" ? "#1f8a8c" : "#8a939a";
        roundRect(ctx, x - 28, y - 16, 56, 32, 9);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "600 13px Sora, sans-serif";
        ctx.fillText(answers[i], x, y);
        ctx.globalAlpha = 1;
      }

      // vote bars
      const voteT = easeOutCubic(clamp((t - 0.5) / 0.4, 0, 1));
      if (voteT > 0) {
        const keys = ["42", "41", "40", "39"];
        const max = Math.max(...keys.map((k) => counts[k] || 0), 1);
        const baseY = h * 0.78;
        keys.forEach((k, i) => {
          const c = counts[k] || 0;
          const bh = (c / max) * h * 0.22 * voteT;
          const bx = w * 0.22 + i * (w * 0.16);
          ctx.fillStyle = k === "42" ? "#c56a1a" : "rgba(15,92,99,0.35)";
          roundRect(ctx, bx, baseY - bh, 44, Math.max(bh, 2), 6);
          ctx.fill();
          ctx.fillStyle = "rgba(20,32,40,0.7)";
          ctx.font = "600 12px Sora, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(k, bx + 22, baseY + 16);
          ctx.fillText(String(c), bx + 22, baseY - bh - 10);
        });

        ctx.fillStyle = "#142028";
        roundRect(ctx, w * 0.72, h * 0.62, 140, 40, 20);
        ctx.fill();
        ctx.fillStyle = "#f7f2ea";
        ctx.font = "600 13px Sora, sans-serif";
        ctx.fillText("majority → 42", w * 0.72 + 70, h * 0.62 + 20);
      }

      ctx.fillStyle = "rgba(20,32,40,0.55)";
      ctx.font = "500 12px Sora, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Sample paths → aggregate answers", 18, h - 16);

      if (t < 1) {
        state.raf = requestAnimationFrame(frame);
      } else if (loop && !reducedMotion) {
        const pulse = 0.5 + 0.5 * Math.sin(now / 480);
        ctx.strokeStyle = `rgba(197,106,26,${0.25 + 0.35 * pulse})`;
        ctx.lineWidth = 2;
        roundRect(ctx, w * 0.72 - 4, h * 0.62 - 4, 148, 48, 22);
        ctx.stroke();
        state.raf = requestAnimationFrame(frame);
      }
    }

    state.raf = requestAnimationFrame(frame);
    runners.vote = state;
  }

  /* ===== Hero / framework 3-axis sketch ===== */
  function drawThreeAxis(canvas, key, animated) {
    stopRunner(key);
    const start = performance.now();
    const state = { raf: 0 };

    function drawLabel(ctx, text, x, y, align, maxW) {
      ctx.textAlign = align;
      ctx.textBaseline = "middle";
      let drawX = x;
      if (align === "left") drawX = clamp(x, 4, maxW - 4);
      if (align === "right") drawX = clamp(x, 4, maxW - 4);
      if (align === "center") drawX = clamp(x, 4, maxW - 4);
      ctx.fillText(text, drawX, y);
    }

    function frame(now) {
      const { ctx, w, h } = fitCanvas(canvas);
      ctx.clearRect(0, 0, w, h);

      const t = reducedMotion || !animated
        ? 1
        : easeOutCubic(clamp((now - start) / 1800, 0, 1));
      const breathe = reducedMotion ? 0 : Math.sin(now / 1100) * 4;

      // Keep diagram inside padded inset so labels never clip
      const pad = Math.max(28, Math.min(w, h) * 0.08);
      const ox = w * 0.48;
      const oy = h * 0.58;
      const axLen = Math.min(w - ox - pad - 8, w * 0.34);
      const ayLen = Math.min(oy - pad - 28, h * 0.32);
      const depthLen = Math.min(ox - pad - 8, w * 0.2);

      const fontAxis = Math.max(11, Math.min(13, w * 0.022));
      const fontPoint = Math.max(10, Math.min(12, w * 0.02));

      const drawAxis = (x2, y2, lines, labelAnchor, color) => {
        const tipX = ox + x2 * t;
        const tipY = oy + y2 * t;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.2;
        ctx.globalAlpha = 0.9 * t;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        const ang = Math.atan2(y2, x2);
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX - 9 * Math.cos(ang - 0.4), tipY - 9 * Math.sin(ang - 0.4));
        ctx.lineTo(tipX - 9 * Math.cos(ang + 0.4), tipY - 9 * Math.sin(ang + 0.4));
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        ctx.globalAlpha = t;
        ctx.fillStyle = "#142028";
        ctx.font = `600 ${fontAxis}px Sora, sans-serif`;
        lines.forEach((line, i) => {
          const ly = labelAnchor.y + i * (fontAxis + 3);
          drawLabel(ctx, line, labelAnchor.x, ly, labelAnchor.align, w);
        });
        ctx.globalAlpha = 1;
      };

      // Axis 1 — right: label sits above the tip, right-aligned into the canvas
      drawAxis(
        axLen,
        0,
        ["Axis 1", "parallel width"],
        { x: ox + axLen * t - 2, y: oy - 28, align: "right" },
        "#0f5c63"
      );

      // Axis 3 — up: label to the right of tip
      drawAxis(
        0,
        -ayLen,
        ["Axis 3", "aggregation"],
        { x: ox + 12, y: oy - ayLen * t + 4, align: "left" },
        "#c56a1a"
      );

      // Axis 2 — down-left: label to the right of tip (avoids left clip)
      drawAxis(
        -depthLen * 0.95,
        depthLen * 0.62,
        ["Axis 2", "search structure"],
        {
          x: ox - depthLen * 0.95 * t + 14,
          y: oy + depthLen * 0.62 * t + 4,
          align: "left",
        },
        "#1f8a8c"
      );

      // Origin
      ctx.fillStyle = "#142028";
      ctx.beginPath();
      ctx.arc(ox, oy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `500 ${fontPoint}px Sora, sans-serif`;
      ctx.fillStyle = "rgba(20,32,40,0.65)";
      drawLabel(ctx, "greedy CoT", ox + 10, oy - 12, "left", w);

      const points = [
        {
          x: ox + axLen * 0.62,
          y: oy - ayLen * 0.32,
          r: 6,
          c: "#0f5c63",
          label: "best-of-n",
          align: "left",
          dx: 10,
          delay: 0.35,
        },
        {
          x: ox + axLen * 0.38,
          y: oy - ayLen * 0.68,
          r: 6,
          c: "#c56a1a",
          label: "self-consistency",
          align: "left",
          dx: 10,
          delay: 0.5,
        },
        {
          x: ox - depthLen * 0.48,
          y: oy + depthLen * 0.28,
          r: 6,
          c: "#1f8a8c",
          label: "ToT / MCTS",
          align: "left",
          dx: 10,
          delay: 0.65,
        },
        {
          x: ox + axLen * 0.22 + breathe,
          y: oy - ayLen * 0.26,
          r: 7,
          c: "#244a55",
          label: "hybrids",
          align: "right",
          dx: -10,
          delay: 0.8,
        },
      ];

      points.forEach((p) => {
        const local = easeOutCubic(clamp((t - p.delay) / 0.35, 0, 1));
        if (local <= 0) return;
        const px = clamp(p.x, pad, w - pad);
        const py = clamp(p.y, pad + 8, h - pad - 8);
        ctx.globalAlpha = local;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#142028";
        ctx.font = `600 ${fontPoint}px Sora, sans-serif`;
        drawLabel(ctx, p.label, px + p.dx, py, p.align, w);
        ctx.globalAlpha = 1;
      });

      if (key === "framework") {
        ctx.fillStyle = "rgba(20,32,40,0.5)";
        ctx.font = `500 ${fontPoint}px Sora, sans-serif`;
        ctx.textAlign = "left";
        ctx.fillText("Allocate compute independently along each axis", pad, h - 14);
      }

      if (t < 1 || (!reducedMotion && animated)) {
        state.raf = requestAnimationFrame(frame);
      }
    }

    state.raf = requestAnimationFrame(frame);
    runners[key] = state;
  }

  /* ---------- wire up ---------- */
  const canvasParallel = document.getElementById("canvas-parallel");
  const canvasTree = document.getElementById("canvas-tree");
  const canvasVote = document.getElementById("canvas-vote");
  const heroCanvas = document.getElementById("hero-canvas");
  const frameworkCanvas = document.getElementById("canvas-framework");

  const started = { parallel: false, tree: false, vote: false, framework: false };

  function startAxis(name) {
    if (name === "parallel" && canvasParallel) animateParallel(canvasParallel, true);
    if (name === "tree" && canvasTree) animateTree(canvasTree, true);
    if (name === "vote" && canvasVote) animateVote(canvasVote, true);
  }

  if (heroCanvas) drawThreeAxis(heroCanvas, "hero", true);

  if ("IntersectionObserver" in window) {
    const axisObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const name = entry.target.getAttribute("data-axis");
          if (name && !started[name]) {
            started[name] = true;
            startAxis(name);
          }
        });
      },
      { threshold: 0.35 }
    );
    document.querySelectorAll(".axis[data-axis]").forEach((el) => axisObserver.observe(el));

    if (frameworkCanvas) {
      const fo = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !started.framework) {
              started.framework = true;
              drawThreeAxis(frameworkCanvas, "framework", true);
            }
          });
        },
        { threshold: 0.3 }
      );
      fo.observe(frameworkCanvas);
    }
  } else {
    startAxis("parallel");
    startAxis("tree");
    startAxis("vote");
    if (frameworkCanvas) drawThreeAxis(frameworkCanvas, "framework", true);
  }

  document.querySelectorAll("[data-replay]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.getAttribute("data-replay");
      started[name] = true;
      startAxis(name);
    });
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (heroCanvas) drawThreeAxis(heroCanvas, "hero", false);
      if (started.framework && frameworkCanvas) drawThreeAxis(frameworkCanvas, "framework", false);
      if (started.parallel) animateParallel(canvasParallel, true);
      if (started.tree) animateTree(canvasTree, true);
      if (started.vote) animateVote(canvasVote, true);
    }, 120);
  });
})();
