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
