/**
 * artha - Landing Page
 * Clean, fast rotor animation that follows mouse
 */

import './styles.css';

// Animation state
let targetRotation = 0;
let currentRotation = 0;

function createHeader(): string {
  return `
    <header class="header">
      <nav class="nav-links">
        <a class="nav-link" href="#about">About</a>
        <a class="nav-link" href="#zippy">Zippy</a>
        <a class="nav-link" href="#contact">Contact</a>
      </nav>
      <div class="nav-divider"></div>
      <div class="nav-buttons">
        <button class="btn btn-ghost">Log In</button>
        <button class="btn btn-primary">Platform</button>
      </div>
    </header>
  `;
}

function createStatorTicks(): string {
  const ticks: string[] = [];
  const numTicks = 24;

  for (let i = 0; i < numTicks; i++) {
    const angle = (360 / numTicks) * i;
    ticks.push(`<div class="stator-tick" style="transform: rotate(${angle}deg)"></div>`);
  }

  return ticks.join('');
}

function createRotorSpokes(): string {
  const spokes: string[] = [];
  const numSpokes = 6;

  for (let i = 0; i < numSpokes; i++) {
    const angle = (360 / numSpokes) * i;
    spokes.push(`<div class="rotor-spoke" style="transform: rotate(${angle}deg)"></div>`);
  }

  return spokes.join('');
}

function createActuator(): string {
  return `
    <div class="actuator-container">
      <!-- Stator (outer, stationary) -->
      <div class="stator"></div>
      <div class="stator-ticks">
        ${createStatorTicks()}
      </div>

      <!-- Rotor (inner, spins with mouse) -->
      <div class="rotor" id="rotor">
        ${createRotorSpokes()}
      </div>

      <!-- Direction indicator -->
      <div class="rotor-indicator" id="rotor-indicator"></div>

      <!-- Center shaft -->
      <div class="shaft"></div>
    </div>
  `;
}

function createHero(): string {
  return `
    <main class="main">
      <div class="hero-left">
        <h1 class="logo">artha</h1>
        <p class="tagline">an open and accessible platform for AI robotics</p>
      </div>
      <div class="hero-right">
        ${createActuator()}
      </div>
    </main>
  `;
}

function updateRotation(clientX: number, clientY: number): void {
  // Get actuator center position
  const actuator = document.querySelector('.actuator-container');
  if (!actuator) return;

  const rect = actuator.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const dx = clientX - centerX;
  const dy = clientY - centerY;

  // Calculate angle from actuator center to pointer
  targetRotation = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
}

function handleMouseMove(e: MouseEvent): void {
  updateRotation(e.clientX, e.clientY);
}

function handleTouchMove(e: TouchEvent): void {
  if (e.touches.length > 0) {
    updateRotation(e.touches[0].clientX, e.touches[0].clientY);
  }
}

function animateRotor(): void {
  const rotor = document.getElementById('rotor');
  const indicator = document.getElementById('rotor-indicator');
  if (!rotor || !indicator) {
    requestAnimationFrame(animateRotor);
    return;
  }

  // Fast, snappy interpolation
  let diff = targetRotation - currentRotation;

  // Handle angle wrapping for shortest path
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;

  // Quick response - 0.2 = snappy, 0.05 = sluggish
  currentRotation += diff * 0.15;

  // Apply rotation - rotor spins, indicator points
  rotor.style.transform = `translate(-50%, -50%) rotate(${currentRotation}deg)`;
  indicator.style.transform = `rotate(${currentRotation}deg)`;

  requestAnimationFrame(animateRotor);
}

function init(): void {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    ${createHeader()}
    ${createHero()}
  `;

  // Mouse tracking (desktop)
  document.addEventListener('mousemove', handleMouseMove);

  // Touch tracking (mobile)
  document.addEventListener('touchmove', handleTouchMove, { passive: true });
  document.addEventListener('touchstart', handleTouchMove, { passive: true });

  // Start animation
  animateRotor();
}

document.addEventListener('DOMContentLoaded', init);
