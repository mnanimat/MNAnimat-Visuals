import { BrushConfig } from '../types';

export interface Point {
  x: number;
  y: number;
  pressure: number;
}

// Color Utility Helpers
function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

function adjustColorBrightness(hex: string, percent: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  let r = parseInt(c.substring(0, 2), 16) || 0;
  let g = parseInt(c.substring(2, 4), 16) || 0;
  let b = parseInt(c.substring(4, 6), 16) || 0;

  r = Math.min(255, Math.max(0, Math.round(r + (255 * percent) / 100)));
  g = Math.min(255, Math.max(0, Math.round(g + (255 * percent) / 100)));
  b = Math.min(255, Math.max(0, Math.round(b + (255 * percent) / 100)));

  const toHex = (val: number) => val.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function drawBrushStroke(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  brush: BrushConfig
) {
  ctx.save();

  // Distance & Angle calculation
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);

  // Pressure Dynamics
  const avgPressure = (from.pressure + to.pressure) / 2;
  const minFactor = (brush.minSizePercent ?? 15) / 100;

  // Size modulation based on Pressure
  const usePressureSize = brush.usePressureSize ?? brush.usePressure ?? true;
  const sizeFactor = usePressureSize ? minFactor + (1 - minFactor) * avgPressure : 1.0;
  const currentSize = Math.max(1, brush.size * sizeFactor);

  // Opacity modulation based on Pressure
  const usePressureOpacity = brush.usePressureOpacity ?? brush.usePressure ?? true;
  const opacityFactor = usePressureOpacity ? 0.25 + 0.75 * avgPressure : 1.0;
  const flow = brush.flow ?? 0.8;
  const alpha = Math.max(0.02, Math.min(1.0, brush.opacity * flow * opacityFactor));

  const scatter = brush.scatter ?? 0;
  const grain = brush.textureGrain ?? 0.3;

  ctx.globalAlpha = alpha;

  switch (brush.type) {
    // ==========================================
    // FUNDAMENTAIS & TRADICIONAIS
    // ==========================================
    case 'pencil': {
      ctx.strokeStyle = brush.color;
      ctx.lineWidth = Math.max(0.8, currentSize * 0.7);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const steps = Math.max(1, Math.floor(distance / 2));
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);

      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const jitter = (Math.random() - 0.5) * (currentSize * 0.25 * (1 + grain));
        const x = from.x + dx * t + jitter;
        const y = from.y + dy * t + jitter;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      break;
    }

    case 'ink': {
      ctx.fillStyle = brush.color;
      const steps = Math.max(1, Math.floor(distance));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = from.x + dx * t;
        const y = from.y + dy * t;
        const p = from.pressure + (to.pressure - from.pressure) * t;
        const r = (brush.size / 2) * (usePressureSize ? minFactor + (1 - minFactor) * p : 1);

        ctx.beginPath();
        ctx.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'watercolor': {
      ctx.fillStyle = brush.color;
      ctx.globalAlpha = alpha * 0.25;

      const steps = Math.max(1, Math.floor(distance / 3));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = from.x + dx * t;
        const y = from.y + dy * t;
        const r = currentSize * 1.2 * (0.8 + Math.random() * 0.4);

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'airbrush': {
      ctx.fillStyle = brush.color;
      const density = Math.floor(currentSize * (1.2 + grain));
      const radius = currentSize;

      for (let i = 0; i < density; i++) {
        const r = Math.random() * radius;
        const theta = Math.random() * Math.PI * 2;
        const px = to.x + r * Math.cos(theta);
        const py = to.y + r * Math.sin(theta);

        ctx.globalAlpha = alpha * (1 - r / radius) * 0.4;
        ctx.fillRect(px, py, 1.5, 1.5);
      }
      break;
    }

    case 'oil': {
      ctx.fillStyle = brush.color;
      ctx.globalAlpha = alpha * 0.85;

      const steps = Math.max(1, Math.floor(distance / 2));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = from.x + dx * t;
        const y = from.y + dy * t;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        // Bristle textured block
        ctx.fillRect(-currentSize / 2, -currentSize * 0.35, currentSize, currentSize * 0.7);
        // Impasto edge highlight
        ctx.fillStyle = adjustColorBrightness(brush.color, 15);
        ctx.fillRect(-currentSize / 2, -currentSize * 0.35, currentSize * 0.4, 2);
        ctx.restore();
      }
      break;
    }

    case 'chalk':
    case 'gouache': {
      ctx.fillStyle = brush.color;
      ctx.globalAlpha = alpha * 0.75;

      const steps = Math.max(1, Math.floor(distance / 2));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = from.x + dx * t;
        const cy = from.y + dy * t;

        for (let j = 0; j < 8; j++) {
          const offsetX = (Math.random() - 0.5) * currentSize * (1 + scatter);
          const offsetY = (Math.random() - 0.5) * currentSize * (1 + scatter);
          if (Math.hypot(offsetX, offsetY) <= currentSize) {
            ctx.fillRect(cx + offsetX, cy + offsetY, 2, 2);
          }
        }
      }
      break;
    }

    // ==========================================
    // METAL & METALURGIA
    // ==========================================
    case 'metal_sheen': {
      // Metallic base stroke + intense central specular sheen
      const steps = Math.max(1, Math.floor(distance / 2));
      const highlightColor = adjustColorBrightness(brush.color, 45);

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = from.x + dx * t;
        const y = from.y + dy * t;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        // Darker base metallic body
        ctx.fillStyle = adjustColorBrightness(brush.color, -20);
        ctx.globalAlpha = alpha * 0.7;
        ctx.beginPath();
        ctx.ellipse(0, 0, currentSize * 0.5, currentSize * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hot specular core line
        ctx.fillStyle = highlightColor;
        ctx.globalAlpha = alpha;
        ctx.fillRect(-currentSize * 0.4, -1.5, currentSize * 0.8, 3);
        ctx.restore();
      }
      break;
    }

    case 'metal_brushed': {
      // Parallel micro-scratches along stroke angle
      ctx.strokeStyle = brush.color;
      ctx.globalAlpha = alpha * 0.8;
      const scratchCount = Math.max(4, Math.floor(currentSize * 0.4));
      const steps = Math.max(1, Math.floor(distance / 2));

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = from.x + dx * t;
        const cy = from.y + dy * t;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        for (let k = 0; k < scratchCount; k++) {
          const offsetY = (k / scratchCount - 0.5) * currentSize;
          const isBright = k % 2 === 0;
          ctx.strokeStyle = isBright
            ? adjustColorBrightness(brush.color, 30)
            : adjustColorBrightness(brush.color, -25);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-currentSize * 0.3, offsetY);
          ctx.lineTo(currentSize * 0.3, offsetY);
          ctx.stroke();
        }
        ctx.restore();
      }
      break;
    }

    case 'metal_chrome': {
      // High-contrast chrome rim edge + white specular burnish
      const steps = Math.max(1, Math.floor(distance / 2));

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = from.x + dx * t;
        const y = from.y + dy * t;

        // Outer dark reflection rim
        ctx.fillStyle = '#0f172a';
        ctx.globalAlpha = alpha * 0.9;
        ctx.beginPath();
        ctx.arc(x, y, currentSize * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Metallic color body
        ctx.fillStyle = brush.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(x, y, currentSize * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // White hot specular center point
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x - currentSize * 0.1, y - currentSize * 0.1, currentSize * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    // ==========================================
    // NATUREZA & FOLHAGENS
    // ==========================================
    case 'nature_foliage': {
      // Cluster of randomized leaf shapes with angle rotation
      const leafCount = Math.max(2, Math.floor(currentSize * 0.3));
      const steps = Math.max(1, Math.floor(distance / 6));

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = from.x + dx * t;
        const cy = from.y + dy * t;

        for (let l = 0; l < leafCount; l++) {
          const offsetX = (Math.random() - 0.5) * currentSize * (1 + scatter * 2);
          const offsetY = (Math.random() - 0.5) * currentSize * (1 + scatter * 2);
          const leafAngle = Math.random() * Math.PI * 2;
          const leafSize = (currentSize * 0.3) * (0.6 + Math.random() * 0.8);

          // Subtle hue variation: slightly lighter/darker green/tone
          const colorVariant = Math.random() > 0.5
            ? adjustColorBrightness(brush.color, Math.floor(Math.random() * 20))
            : adjustColorBrightness(brush.color, -Math.floor(Math.random() * 20));

          ctx.save();
          ctx.translate(cx + offsetX, cy + offsetY);
          ctx.rotate(leafAngle);
          ctx.fillStyle = colorVariant;
          ctx.globalAlpha = alpha * (0.6 + Math.random() * 0.4);

          // Leaf shape path
          ctx.beginPath();
          ctx.moveTo(0, -leafSize);
          ctx.quadraticCurveTo(leafSize * 0.6, 0, 0, leafSize);
          ctx.quadraticCurveTo(-leafSize * 0.6, 0, 0, -leafSize);
          ctx.fill();
          ctx.restore();
        }
      }
      break;
    }

    case 'nature_moss': {
      // Soft organic noise stipple cluster for moss and lichen
      const steps = Math.max(1, Math.floor(distance / 3));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = from.x + dx * t;
        const cy = from.y + dy * t;

        const particleCount = Math.floor(currentSize * 1.5);
        for (let p = 0; p < particleCount; p++) {
          const r = Math.random() * currentSize * (0.5 + scatter);
          const theta = Math.random() * Math.PI * 2;
          const px = cx + r * Math.cos(theta);
          const py = cy + r * Math.sin(theta);

          ctx.fillStyle = Math.random() > 0.4
            ? brush.color
            : adjustColorBrightness(brush.color, Math.random() > 0.5 ? 20 : -20);
          ctx.globalAlpha = alpha * (1 - r / (currentSize * 1.5)) * 0.6;
          ctx.beginPath();
          ctx.arc(px, py, 1 + Math.random() * 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }

    case 'nature_bark': {
      // Grooved vertical bark fiber striations
      const steps = Math.max(1, Math.floor(distance / 3));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = from.x + dx * t;
        const cy = from.y + dy * t;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        const fibers = Math.floor(currentSize * 0.5);
        for (let f = 0; f < fibers; f++) {
          const offY = (f / fibers - 0.5) * currentSize;
          ctx.fillStyle = f % 2 === 0 ? brush.color : adjustColorBrightness(brush.color, -30);
          ctx.globalAlpha = alpha * 0.8;
          ctx.fillRect(-currentSize * 0.4, offY, currentSize * 0.8, 2.5);
        }
        ctx.restore();
      }
      break;
    }

    case 'nature_grass': {
      // Upward tapered grass blades
      const bladeCount = Math.max(2, Math.floor(currentSize * 0.25));
      const steps = Math.max(1, Math.floor(distance / 8));

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = from.x + dx * t;
        const cy = from.y + dy * t;

        for (let b = 0; b < bladeCount; b++) {
          const offX = (Math.random() - 0.5) * currentSize;
          const bladeHeight = currentSize * (0.8 + Math.random() * 0.8);
          const curve = (Math.random() - 0.5) * 12;

          ctx.strokeStyle = Math.random() > 0.3
            ? brush.color
            : adjustColorBrightness(brush.color, 25);
          ctx.lineWidth = Math.max(1, currentSize * 0.08);
          ctx.globalAlpha = alpha * (0.7 + Math.random() * 0.3);

          ctx.beginPath();
          ctx.moveTo(cx + offX, cy);
          ctx.quadraticCurveTo(cx + offX + curve, cy - bladeHeight * 0.5, cx + offX + curve * 1.5, cy - bladeHeight);
          ctx.stroke();
        }
      }
      break;
    }

    // ==========================================
    // CABELO & PELAGEM
    // ==========================================
    case 'hair_strands': {
      // Fine multi-strand fan tapering with pressure
      const strands = 7;
      const steps = Math.max(1, Math.floor(distance / 2));

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = from.x + dx * t;
        const cy = from.y + dy * t;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        for (let s = 0; s < strands; s++) {
          const offY = (s / (strands - 1) - 0.5) * currentSize * 0.8;
          ctx.strokeStyle = s % 3 === 0
            ? adjustColorBrightness(brush.color, 30)
            : s % 2 === 0
            ? adjustColorBrightness(brush.color, -15)
            : brush.color;
          ctx.lineWidth = Math.max(0.6, currentSize * 0.06);
          ctx.globalAlpha = alpha;

          ctx.beginPath();
          ctx.moveTo(-currentSize * 0.2, offY);
          ctx.lineTo(currentSize * 0.2, offY);
          ctx.stroke();
        }
        ctx.restore();
      }
      break;
    }

    case 'hair_fur': {
      // Dense tuft fur mass following stroke direction
      const steps = Math.max(1, Math.floor(distance / 4));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = from.x + dx * t;
        const cy = from.y + dy * t;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle + (Math.random() - 0.5) * 0.3);

        const tufts = 6;
        for (let tf = 0; tf < tufts; tf++) {
          const offY = (Math.random() - 0.5) * currentSize;
          const length = currentSize * (0.4 + Math.random() * 0.5);
          ctx.strokeStyle = Math.random() > 0.4 ? brush.color : adjustColorBrightness(brush.color, 20);
          ctx.lineWidth = 1.2;
          ctx.globalAlpha = alpha * 0.8;

          ctx.beginPath();
          ctx.moveTo(0, offY);
          ctx.lineTo(length, offY + (Math.random() - 0.5) * 4);
          ctx.stroke();
        }
        ctx.restore();
      }
      break;
    }

    case 'hair_shine': {
      // Elongated specular catchlight glint overlay for hair volume
      const steps = Math.max(1, Math.floor(distance / 3));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = from.x + dx * t;
        const cy = from.y + dy * t;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle + Math.PI / 2);

        // Soft white/light halo sheen
        ctx.fillStyle = hexToRgba('#ffffff', alpha * 0.6);
        ctx.beginPath();
        ctx.ellipse(0, 0, currentSize * 0.15, currentSize * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      break;
    }

    // ==========================================
    // MADEIRA
    // ==========================================
    case 'wood_grain': {
      // Undulating parallel organic wood fibers
      const steps = Math.max(1, Math.floor(distance / 2));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = from.x + dx * t;
        const cy = from.y + dy * t;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        const lines = 6;
        for (let l = 0; l < lines; l++) {
          const offY = (l / (lines - 1) - 0.5) * currentSize;
          const wave = Math.sin(t * 10 + l) * 2;
          ctx.strokeStyle = l % 2 === 0 ? brush.color : adjustColorBrightness(brush.color, -35);
          ctx.lineWidth = 1.8;
          ctx.globalAlpha = alpha * 0.85;

          ctx.beginPath();
          ctx.moveTo(-currentSize * 0.3, offY + wave);
          ctx.lineTo(currentSize * 0.3, offY + wave);
          ctx.stroke();
        }
        ctx.restore();
      }
      break;
    }

    case 'wood_weathered': {
      // Rough dry-brush timber stipple with knots
      const steps = Math.max(1, Math.floor(distance / 3));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = from.x + dx * t;
        const cy = from.y + dy * t;

        ctx.fillStyle = brush.color;
        const particles = Math.floor(currentSize * 0.8);
        for (let p = 0; p < particles; p++) {
          const rx = (Math.random() - 0.5) * currentSize;
          const ry = (Math.random() - 0.5) * currentSize * 0.5;
          ctx.globalAlpha = alpha * Math.random();
          ctx.fillRect(cx + rx, cy + ry, 2.5, 1.5);
        }
      }
      break;
    }

    // ==========================================
    // VIDRO & CRISTAIS
    // ==========================================
    case 'glass_refract': {
      // Dual-line translucent refraction with bright glass edge
      const steps = Math.max(1, Math.floor(distance / 2));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = from.x + dx * t;
        const cy = from.y + dy * t;

        // Translucent glass body fill
        ctx.fillStyle = hexToRgba(brush.color, alpha * 0.35);
        ctx.beginPath();
        ctx.arc(cx, cy, currentSize * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Crisp white refraction highlight border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = alpha * 0.85;
        ctx.beginPath();
        ctx.arc(cx - currentSize * 0.1, cy - currentSize * 0.1, currentSize * 0.45, -Math.PI / 4, Math.PI / 4);
        ctx.stroke();
      }
      break;
    }

    case 'glass_caustics': {
      // Starry caustics glare and light web
      const steps = Math.max(1, Math.floor(distance / 5));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = from.x + dx * t;
        const cy = from.y + dy * t;

        ctx.save();
        ctx.translate(cx, cy);
        const starSize = currentSize * (0.6 + Math.random() * 0.4);

        // Core white flare
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(0, 0, starSize * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Cross rays
        ctx.strokeStyle = hexToRgba(brush.color, alpha * 0.8);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-starSize, 0); ctx.lineTo(starSize, 0);
        ctx.moveTo(0, -starSize); ctx.lineTo(0, starSize);
        ctx.stroke();

        ctx.restore();
      }
      break;
    }

    case 'glass_glaze': {
      // Smooth semi-translucent glaze coat
      ctx.fillStyle = hexToRgba(brush.color, alpha * 0.2);
      const steps = Math.max(1, Math.floor(distance / 2));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = from.x + dx * t;
        const cy = from.y + dy * t;
        ctx.beginPath();
        ctx.arc(cx, cy, currentSize * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    // ==========================================
    // PELE HUMANA (SKIN & DERMIS)
    // ==========================================
    case 'skin_pores': {
      // Ultra-fine micro pore stipple density (ArtStation realism standard)
      const steps = Math.max(1, Math.floor(distance / 3));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = from.x + dx * t;
        const cy = from.y + dy * t;

        const poreCount = Math.floor(currentSize * 2.2);
        for (let p = 0; p < poreCount; p++) {
          const r = Math.random() * currentSize * 0.5;
          const theta = Math.random() * Math.PI * 2;
          const px = cx + r * Math.cos(theta);
          const py = cy + r * Math.sin(theta);

          // Alternating shadow & light stipple dot for tactile skin micro-texture
          ctx.fillStyle = p % 2 === 0
            ? adjustColorBrightness(brush.color, -18)
            : adjustColorBrightness(brush.color, 12);
          ctx.globalAlpha = alpha * 0.55;
          ctx.fillRect(px, py, 1.2, 1.2);
        }
      }
      break;
    }

    case 'skin_subsurface': {
      // Warm translucent dermal glow overlay for ears, nose, shadows
      const steps = Math.max(1, Math.floor(distance / 3));
      const warmGlowColor = adjustColorBrightness(brush.color, 25);

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = from.x + dx * t;
        const cy = from.y + dy * t;

        ctx.fillStyle = hexToRgba(warmGlowColor, alpha * 0.25);
        ctx.beginPath();
        ctx.arc(cx, cy, currentSize * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'skin_freckles': {
      // Natural irregular melanin stipple scatter
      const steps = Math.max(1, Math.floor(distance / 5));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = from.x + dx * t;
        const cy = from.y + dy * t;

        const count = Math.floor(currentSize * 0.4);
        for (let f = 0; f < count; f++) {
          const rx = (Math.random() - 0.5) * currentSize * (1 + scatter * 2);
          const ry = (Math.random() - 0.5) * currentSize * (1 + scatter * 2);
          const fSize = 1 + Math.random() * 2.5;

          ctx.fillStyle = adjustColorBrightness(brush.color, -25);
          ctx.globalAlpha = alpha * (0.5 + Math.random() * 0.5);
          ctx.beginPath();
          ctx.arc(cx + rx, cy + ry, fSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }

    case 'skin_blender': {
      // Soft transitional smudger blender brush for smooth skin gradients
      ctx.fillStyle = hexToRgba(brush.color, alpha * 0.15);
      const steps = Math.max(1, Math.floor(distance / 2));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = from.x + dx * t;
        const cy = from.y + dy * t;
        ctx.beginPath();
        ctx.arc(cx, cy, currentSize * 0.75, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    // ==========================================
    // CENÁRIO & AMBIENTES
    // ==========================================
    case 'environment_clouds': {
      // Volumetric soft cumulus cloud density
      const steps = Math.max(1, Math.floor(distance / 4));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = from.x + dx * t;
        const cy = from.y + dy * t;

        const puffs = 4;
        for (let p = 0; p < puffs; p++) {
          const rx = (Math.random() - 0.5) * currentSize * 0.6;
          const ry = (Math.random() - 0.5) * currentSize * 0.6;
          const pRadius = (currentSize * 0.5) * (0.7 + Math.random() * 0.6);

          ctx.fillStyle = hexToRgba(brush.color, alpha * 0.2);
          ctx.beginPath();
          ctx.arc(cx + rx, cy + ry, pRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }

    case 'environment_stone': {
      // Angular faceted rock cliff texture
      const steps = Math.max(1, Math.floor(distance / 4));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = from.x + dx * t;
        const cy = from.y + dy * t;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((Math.floor(Math.random() * 4) * Math.PI) / 2);

        ctx.fillStyle = Math.random() > 0.5 ? brush.color : adjustColorBrightness(brush.color, -25);
        ctx.globalAlpha = alpha * 0.8;
        const s = currentSize * 0.6;
        ctx.beginPath();
        ctx.moveTo(-s, -s * 0.5);
        ctx.lineTo(s * 0.8, -s);
        ctx.lineTo(s, s * 0.7);
        ctx.lineTo(-s * 0.5, s);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }
      break;
    }

    case 'environment_water': {
      // Horizontal wave streaks with light sheen
      const steps = Math.max(1, Math.floor(distance / 3));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = from.x + dx * t;
        const cy = from.y + dy * t;

        const waveCount = 4;
        for (let w = 0; w < waveCount; w++) {
          const offY = (w / waveCount - 0.5) * currentSize;
          const length = currentSize * (0.6 + Math.random() * 0.8);

          ctx.strokeStyle = w % 2 === 0
            ? adjustColorBrightness(brush.color, 30)
            : brush.color;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = alpha * 0.7;

          ctx.beginPath();
          ctx.moveTo(cx - length / 2, cy + offY);
          ctx.lineTo(cx + length / 2, cy + offY);
          ctx.stroke();
        }
      }
      break;
    }

    case 'environment_dust': {
      // Bokeh particle dust motes in light rays
      const steps = Math.max(1, Math.floor(distance / 6));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = from.x + dx * t;
        const cy = from.y + dy * t;

        const count = Math.floor(currentSize * 0.5);
        for (let d = 0; d < count; d++) {
          const rx = (Math.random() - 0.5) * currentSize * (1 + scatter * 2);
          const ry = (Math.random() - 0.5) * currentSize * (1 + scatter * 2);
          const dSize = 1 + Math.random() * 3.5;

          ctx.fillStyle = hexToRgba('#ffffff', alpha * (0.3 + Math.random() * 0.7));
          ctx.beginPath();
          ctx.arc(cx + rx, cy + ry, dSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }

    default: {
      ctx.strokeStyle = brush.color;
      ctx.lineWidth = currentSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
  }

  ctx.restore();
}
