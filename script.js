   const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.14 }
);

document.querySelectorAll("[data-reveal]").forEach((item) => revealObserver.observe(item));

function setupNeuralCanvas() {
  const canvas = document.getElementById("neural-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const pointer = { x: 0, y: 0, active: false };
  let nodes = [];
  let width = 0;
  let height = 0;
  let dpr = 1;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.max(42, Math.min(95, Math.floor((width * height) / 19000)));
    nodes = Array.from({ length: count }, (_, index) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.34,
      vy: (Math.random() - 0.5) * 0.34,
      r: index % 7 === 0 ? 2.2 : 1.35,
      hue: index % 3,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const maxDistance = width < 720 ? 115 : 150;

    for (const node of nodes) {
      if (!prefersReducedMotion) {
        node.x += node.vx;
        node.y += node.vy;
      }

      if (node.x < 0 || node.x > width) node.vx *= -1;
      if (node.y < 0 || node.y > height) node.vy *= -1;

      if (pointer.active) {
        const dx = node.x - pointer.x;
        const dy = node.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 180 && distance > 0.01) {
          const force = (180 - distance) / 180;
          node.x += (dx / distance) * force * 1.8;
          node.y += (dy / distance) * force * 1.8;
        }
      }
    }

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance < maxDistance) {
          const alpha = (1 - distance / maxDistance) * 0.24;
          ctx.strokeStyle = `rgba(17, 24, 39, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    for (const node of nodes) {
      const colors = ["0, 166, 166", "255, 107, 87", "248, 184, 78"];
      ctx.fillStyle = `rgba(${colors[node.hue]}, 0.78)`;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  });
  window.addEventListener("pointerleave", () => {
    pointer.active = false;
  });
  resize();
  draw();
}

function setupPhysicsCursor() {
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!finePointer || prefersReducedMotion) return;

  const dot = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");
  const canvas = document.getElementById("trail-canvas");
  if (!dot || !ring || !canvas) return;

  const ctx = canvas.getContext("2d");
  const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const ringPos = { x: mouse.x, y: mouse.y, vx: 0, vy: 0 };
  const dotPos = { x: mouse.x, y: mouse.y };
  const particles = [];
  let dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function addParticle(x, y, speed) {
    const count = Math.min(4, Math.max(1, Math.floor(speed / 18)));
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 1.7,
        vy: (Math.random() - 0.5) * 1.7,
        life: 1,
        size: Math.random() * 3 + 1,
        color: Math.random() > 0.5 ? "0, 166, 166" : "255, 107, 87",
      });
    }
  }

  let previous = { x: mouse.x, y: mouse.y };
  window.addEventListener("pointermove", (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    const speed = Math.hypot(mouse.x - previous.x, mouse.y - previous.y);
    addParticle(mouse.x, mouse.y, speed);
    previous = { x: mouse.x, y: mouse.y };
    dot.style.opacity = "1";
    ring.style.opacity = "1";
  });

  document.querySelectorAll("a, button, .magnetic-card").forEach((item) => {
    item.addEventListener("pointerenter", () => ring.classList.add("is-active"));
    item.addEventListener("pointerleave", () => ring.classList.remove("is-active"));
  });

  function animate() {
    dotPos.x += (mouse.x - dotPos.x) * 0.52;
    dotPos.y += (mouse.y - dotPos.y) * 0.52;

    const stiffness = 0.18;
    const damping = 0.72;
    ringPos.vx += (mouse.x - ringPos.x) * stiffness;
    ringPos.vy += (mouse.y - ringPos.y) * stiffness;
    ringPos.vx *= damping;
    ringPos.vy *= damping;
    ringPos.x += ringPos.vx;
    ringPos.y += ringPos.vy;

    dot.style.transform = `translate3d(${dotPos.x}px, ${dotPos.y}px, 0) translate(-50%, -50%)`;
    ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%)`;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const particle = particles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.015;
      particle.life -= 0.025;

      if (particle.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.fillStyle = `rgba(${particle.color}, ${particle.life * 0.42})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(animate);
  }

  resize();
  animate();
  window.addEventListener("resize", resize);
}

function setupMagneticElements() {
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!finePointer || prefersReducedMotion) return;

  document.querySelectorAll(".magnetic").forEach((element) => {
    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      element.style.transform = `translate(${x * 0.16}px, ${y * 0.22}px)`;
    });
    element.addEventListener("pointerleave", () => {
      element.style.transform = "translate(0, 0)";
    });
  });

  document.querySelectorAll(".magnetic-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rotateY = ((x / rect.width) - 0.5) * 7;
      const rotateX = -((y / rect.height) - 0.5) * 7;
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0)";
    });
  });
}

setupNeuralCanvas();
setupPhysicsCursor();
setupMagneticElements();
