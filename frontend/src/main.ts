/**
 * artha.bot - Splash Page
 * Checks backend health and displays cute status
 */

interface HealthResponse {
  status: string;
  service: string;
  version: string;
  message: string;
}

async function checkHealth(): Promise<HealthResponse | null> {
  try {
    const response = await fetch('/api/health');
    if (!response.ok) throw new Error('API not healthy');
    return await response.json();
  } catch {
    return null;
  }
}

function updateStatus(health: HealthResponse | null): void {
  const statusText = document.getElementById('status-text');
  const statusCard = document.getElementById('status-card');
  const version = document.getElementById('version');

  if (!statusText || !statusCard || !version) return;

  if (health) {
    statusText.innerHTML = `<strong>Online</strong> — ${health.message}`;
    version.textContent = `v${health.version}`;
  } else {
    statusText.innerHTML = '<strong style="color: #ef4444;">Offline</strong> — Backend unreachable';
    const dot = statusCard.querySelector('.status-dot') as HTMLElement;
    if (dot) {
      dot.style.background = '#ef4444';
      dot.style.boxShadow = '0 0 10px #ef4444';
    }
  }
}

function createParticles(): void {
  const container = document.getElementById('particles');
  if (!container) return;

  for (let i = 0; i < 15; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * 20}s`;
    particle.style.animationDuration = `${15 + Math.random() * 10}s`;
    container.appendChild(particle);
  }
}

async function init(): Promise<void> {
  createParticles();
  const health = await checkHealth();
  updateStatus(health);

  // Refresh status every 30 seconds
  setInterval(async () => {
    const h = await checkHealth();
    updateStatus(h);
  }, 30000);
}

init();
