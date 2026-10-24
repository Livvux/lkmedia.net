// Soft Aurora – WebGL2-Hintergrund.
// Port von reactbits.dev/backgrounds/soft-aurora (react-bits, MIT).
// Bewusst Vanilla statt React: der Hero soll ohne Framework-Hydration auskommen,
// das Canvas ist rein dekorativ (aria-hidden) und läuft nur, wenn WebGL2 da ist.

const MAX_PULSES = 4;

const VERTEX = `#version 300 es
const vec2 corners[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
void main() {
  gl_Position = vec4(corners[gl_VertexID], 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform float uFlow;
uniform float uHue;
uniform float uScale;
uniform float uBrightness;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uNoiseFreq;
uniform float uNoiseAmp;
uniform float uBandHeight;
uniform float uBandSpread;
uniform float uOctaveDecay;
uniform float uLayerOffset;
uniform vec2 uShift;
uniform vec4 uCursor;
uniform vec4 uPulses[${MAX_PULSES}];
uniform float uSpectrum;
uniform float uTilt;
uniform vec3 uIntro;
uniform float uLightMode;
uniform float uOpacity;
out vec4 fragColor;

#define TAU 6.28318

vec3 gradientHash(vec3 p) {
  p = vec3(
    dot(p, vec3(127.1, 311.7, 234.6)),
    dot(p, vec3(269.5, 183.3, 198.3)),
    dot(p, vec3(169.5, 283.3, 156.9))
  );
  vec3 h = fract(sin(p) * 43758.5453123);
  float phi = acos(2.0 * h.x - 1.0);
  float theta = TAU * h.y;
  return vec3(cos(theta) * sin(phi), sin(theta) * cos(phi), cos(phi));
}

float quinticSmooth(float t) {
  float t2 = t * t;
  float t3 = t * t2;
  return 6.0 * t3 * t2 - 15.0 * t2 * t2 + 10.0 * t3;
}

vec3 cosineGradient(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(TAU * (c * t + d));
}

float perlin3D(float amplitude, float frequency, float px, float py, float pz) {
  float x = px * frequency;
  float y = py * frequency;

  float fx = floor(x);
  float fy = floor(y);
  float fz = floor(pz);
  float cx = ceil(x);
  float cy = ceil(y);
  float cz = ceil(pz);

  vec3 g000 = gradientHash(vec3(fx, fy, fz));
  vec3 g100 = gradientHash(vec3(cx, fy, fz));
  vec3 g010 = gradientHash(vec3(fx, cy, fz));
  vec3 g110 = gradientHash(vec3(cx, cy, fz));
  vec3 g001 = gradientHash(vec3(fx, fy, cz));
  vec3 g101 = gradientHash(vec3(cx, fy, cz));
  vec3 g011 = gradientHash(vec3(fx, cy, cz));
  vec3 g111 = gradientHash(vec3(cx, cy, cz));

  float d000 = dot(g000, vec3(x - fx, y - fy, pz - fz));
  float d100 = dot(g100, vec3(x - cx, y - fy, pz - fz));
  float d010 = dot(g010, vec3(x - fx, y - cy, pz - fz));
  float d110 = dot(g110, vec3(x - cx, y - cy, pz - fz));
  float d001 = dot(g001, vec3(x - fx, y - fy, pz - cz));
  float d101 = dot(g101, vec3(x - cx, y - fy, pz - cz));
  float d011 = dot(g011, vec3(x - fx, y - cy, pz - cz));
  float d111 = dot(g111, vec3(x - cx, y - cy, pz - cz));

  float sx = quinticSmooth(x - fx);
  float sy = quinticSmooth(y - fy);
  float sz = quinticSmooth(pz - fz);

  float lx00 = mix(d000, d100, sx);
  float lx10 = mix(d010, d110, sx);
  float lx01 = mix(d001, d101, sx);
  float lx11 = mix(d011, d111, sx);

  float ly0 = mix(lx00, lx10, sy);
  float ly1 = mix(lx01, lx11, sy);

  return amplitude * mix(ly0, ly1, sz);
}

float auroraGlow(float t, vec2 uv, float bend) {
  float noiseVal = 0.0;
  float freq = uNoiseFreq;
  float amp = uNoiseAmp;
  vec2 samplePos = uv * uScale;

  for (float i = 0.0; i < 3.0; i += 1.0) {
    noiseVal += perlin3D(amp, freq, samplePos.x, samplePos.y, t);
    amp *= uOctaveDecay;
    freq *= 2.0;
  }

  float yBand = uv.y * 10.0 - (uBandHeight + bend) * 10.0;
  return 0.3 * max(exp(uBandSpread * (1.0 - 1.1 * uIntro.y * abs(noiseVal * uIntro.z + yBand))), 0.0);
}

vec2 turn(vec2 p, vec2 center) {
  float c = cos(uTilt);
  float s = sin(uTilt);
  vec2 d = p - center;
  return center + vec2(c * d.x - s * d.y, s * d.x + c * d.y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  vec2 center = vec2(0.5 * uResolution.x / uResolution.y, 0.5);
  vec2 screen = turn(gl_FragCoord.xy / uResolution.y, center);
  vec2 cursor = turn(uCursor.xy, center);
  vec2 field = screen + uShift;
  float t = 0.4 * uFlow;

  float reach = exp(-pow((screen.x - cursor.x) / 0.32, 2.0)) * uCursor.z;
  float gap = cursor.y + uShift.y - uBandHeight;
  float near = exp(-gap * gap / 0.16);
  float bend = reach * gap * near * 0.55;

  float pulse = 0.0;
  for (int i = 0; i < ${MAX_PULSES}; i++) {
    vec4 wave = uPulses[i];
    if (wave.z <= 0.0) continue;
    float x = (abs(screen.x - turn(wave.xy, center).x) - wave.w * 0.55) / (0.1 + wave.w * 0.06);
    pulse += wave.z * exp(-x * x);
  }
  float boost = (1.0 + reach * near * 0.25 + pulse * 0.65) * uIntro.x;

  float glow1 = auroraGlow(t, field, bend) * boost;
  float glow2 = auroraGlow(t + uLayerOffset, field, bend) * boost;
  vec3 gradient1 = mix(vec3(1.0), cosineGradient(uv.x + uHue * 0.2, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.3, 0.20, 0.20)), uSpectrum);
  vec3 gradient2 = mix(vec3(1.0), cosineGradient(uv.x + uHue * 0.1, vec3(0.5), vec3(0.5), vec3(2.0, 1.0, 0.0), vec3(0.5, 0.20, 0.25)), uSpectrum);

  vec3 col = 0.99 * glow1 * gradient1 * uColor1;
  col += 0.99 * glow2 * gradient2 * uColor2;
  col *= uBrightness;

  float grain = (fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) - 0.5) / 255.0;
  if (uLightMode > 0.5) {
    float energy = max(col.r, max(col.g, col.b));
    vec3 hue = clamp(col / max(energy, 1e-4), 0.0, 1.0);
    vec3 average = (glow1 * uColor1 + glow2 * uColor2) / max(glow1 + glow2, 1e-4);
    float top = max(average.r, max(average.g, average.b));
    float spread = top - min(average.r, min(average.g, average.b));
    float core = smoothstep(0.55, 1.6, energy);
    float depth = 1.25 + 0.45 * core;
    vec3 tint = mix(average * 0.82, pow(average / max(top, 1e-4), vec3(depth + 0.6)), smoothstep(0.04, 0.2, spread));
    float vivid = smoothstep(0.12, 0.55, 1.0 - min(hue.r, min(hue.g, hue.b))) * smoothstep(0.04, 0.2, spread);
    vec3 ink = mix(tint, pow(hue, vec3(depth)), vivid) * mix(0.93, 0.8, core);
    float density = 0.88 * (1.0 - exp(-1.9 * pow(energy, 1.7)));
    density = clamp(density * uOpacity + grain, 0.0, 1.0);
    fragColor = vec4(ink * density, density);
  } else {
    float alpha = clamp(length(col), 0.0, 1.0);
    vec3 color = clamp(col, 0.0, 1.0);
    fragColor = vec4(clamp(color * alpha + grain, 0.0, alpha) * uOpacity, alpha * uOpacity);
  }
}`;

export interface SoftAuroraOptions {
  /** Fließgeschwindigkeit der Noise-Ebene. */
  speed: number;
  /** Größe der Noise-Struktur (größer = ruhiger, breitere Bänder). */
  scale: number;
  /** Helligkeit der Aurora. */
  brightness: number;
  /** Farbe der hellen Schicht. */
  color1: string;
  /** Farbe der farbigen Schicht. */
  color2: string;
  /** Frequenz des Perlin-Noise. */
  noiseFrequency: number;
  /** Amplitude des Perlin-Noise. */
  noiseAmplitude: number;
  /** Höhe des Leuchtbands (0 = unten, 1 = oben). */
  bandHeight: number;
  /** Weichheit des Leuchtbands. */
  bandSpread: number;
  /** Abfall der Noise-Oktaven. */
  octaveDecay: number;
  /** Zeitversatz der zweiten Schicht. */
  layerOffset: number;
  /** Geschwindigkeit des Farbverlaufs. */
  colorSpeed: number;
  /** Anteil des Farbverlaufs (0 = einfarbig). */
  spectrum: number;
  /** Neigung des Bandes in Grad. */
  tilt: number;
  /** Wie stark die Maus das Band zieht. */
  mouseInfluence: number;
  /** Deckkraft der gesamten Aurora. */
  opacity: number;
}

export const SOFT_AURORA_DEFAULTS: SoftAuroraOptions = {
  speed: 0.5,
  scale: 1.4,
  brightness: 0.42,
  color1: "#8fa4ff",
  color2: "#4d6cff",
  noiseFrequency: 2.4,
  noiseAmplitude: 1,
  bandHeight: 0.8,
  bandSpread: 0.9,
  octaveDecay: 0.12,
  layerOffset: 0.45,
  colorSpeed: 1,
  // 0 = einfarbig. Die Aurora bleibt in Bewegung, mischt aber keine Farben mehr.
  spectrum: 0,
  tilt: 0,
  mouseInfluence: 0.2,
  opacity: 0.42,
};

interface Pulse {
  x: number;
  y: number;
  age: number;
}

type Uniforms = Record<string, WebGLUniformLocation | null>;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const parseColor = (value: string): [number, number, number] | null => {
  const text = String(value || "").trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  if (hex) {
    const full = hex[1].length === 3 ? hex[1].replace(/./g, (digit) => digit + digit) : hex[1];
    return [0, 2, 4].map((index) => parseInt(full.slice(index, index + 2), 16) / 255) as [
      number,
      number,
      number,
    ];
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(text);
  if (rgb) {
    return [rgb[1], rgb[2], rgb[3]].map((channel) => clamp(parseFloat(channel) / 255, 0, 1)) as [
      number,
      number,
      number,
    ];
  }
  return null;
};

const compile = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};

const link = (gl: WebGL2RenderingContext) => {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = vertex && fragment ? gl.createProgram() : null;
  if (!vertex || !fragment || !program) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  const uniforms: Uniforms = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let index = 0; index < count; index++) {
    const info = gl.getActiveUniform(program, index);
    if (info) uniforms[info.name.replace(/\[0\]$/, "")] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
};

const smoother = (t: number): number => {
  const x = clamp(t, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

/**
 * Startet die Aurora in `root` (muss ein Element mit einem <canvas> enthalten).
 * Gibt eine Cleanup-Funktion zurück. Ohne WebGL2 bekommt `root` die Klasse
 * `is-fallback` und es erscheint die CSS-Variante.
 */
export function mountSoftAurora(
  root: HTMLElement,
  options: Partial<SoftAuroraOptions> = {},
): () => void {
  const canvas = root.querySelector("canvas");
  if (!canvas) return () => {};

  const settings: SoftAuroraOptions = { ...SOFT_AURORA_DEFAULTS, ...options };
  const color1 = parseColor(settings.color1) ?? [0.91, 0.925, 1];
  const color2 = parseColor(settings.color2) ?? [0.302, 0.424, 1];

  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "default",
  });
  const shader = gl ? link(gl) : null;
  if (!gl || !shader) {
    root.classList.add("is-fallback");
    return () => {};
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const vao = gl.createVertexArray();
  const size = { width: 1, height: 1 };
  const pointer = { x: 0.5, y: 0.5, inside: false };
  const mouse = { x: 0.5, y: 0.5, presence: 0 };
  const pulses: Pulse[] = [];
  const pulseData = new Float32Array(MAX_PULSES * 4);
  let flow = 0;
  let hue = 0;
  let opening = reduced ? 1 : 0;
  let raf = 0;
  let last = 0;
  let visible = true;
  let pageVisible = document.visibilityState !== "hidden";
  let lost = false;

  const resize = () => {
    const rect = root.getBoundingClientRect();
    const cssWidth = Math.max(1, rect.width);
    const cssHeight = Math.max(1, rect.height);
    const ratio = clamp(0.35 + 0.04 * settings.noiseFrequency * settings.scale, 0.5, 1);
    const width = Math.max(1, Math.round(cssWidth * ratio));
    const height = Math.max(1, Math.round(cssHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    size.width = cssWidth;
    size.height = cssHeight;
  };

  const draw = () => {
    const aspect = size.width / size.height;
    const strength = Math.min(1, settings.mouseInfluence * 4) * mouse.presence;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    // biome-ignore lint/correctness/useHookAtTopLevel: gl.useProgram ist WebGL-API, kein React-Hook
    gl.useProgram(shader.program);
    gl.bindVertexArray(vao);
    const u = shader.uniforms;
    gl.uniform2f(u.uResolution, canvas.width, canvas.height);
    gl.uniform1f(u.uFlow, flow);
    gl.uniform1f(u.uHue, hue);
    gl.uniform1f(u.uScale, settings.scale);
    gl.uniform1f(u.uBrightness, settings.brightness);
    gl.uniform3f(u.uColor1, color1[0], color1[1], color1[2]);
    gl.uniform3f(u.uColor2, color2[0], color2[1], color2[2]);
    gl.uniform1f(u.uNoiseFreq, settings.noiseFrequency);
    gl.uniform1f(u.uNoiseAmp, settings.noiseAmplitude);
    gl.uniform1f(u.uBandHeight, settings.bandHeight);
    gl.uniform1f(u.uBandSpread, settings.bandSpread);
    gl.uniform1f(u.uOctaveDecay, settings.octaveDecay);
    gl.uniform1f(u.uLayerOffset, settings.layerOffset);
    gl.uniform2f(
      u.uShift,
      (mouse.x - 0.5) * settings.mouseInfluence,
      (mouse.y - 0.5) * settings.mouseInfluence,
    );
    gl.uniform4f(u.uCursor, mouse.x * aspect, mouse.y, strength, 0);
    gl.uniform4fv(u.uPulses, pulseData);
    gl.uniform1f(u.uSpectrum, settings.spectrum);
    gl.uniform1f(u.uTilt, (clamp(settings.tilt, -90, 90) * Math.PI) / 180);
    const eased = 1 - (1 - opening) ** 3;
    gl.uniform3f(
      u.uIntro,
      smoother(opening / 0.7),
      1 + 3 * (1 - eased) * (1 - eased),
      0.25 + 0.75 * eased,
    );
    gl.uniform1f(u.uLightMode, 0);
    gl.uniform1f(u.uOpacity, settings.opacity);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const frame = (now: number) => {
    raf = 0;
    if (lost) return;
    const dt = clamp((now - last) / 1000 || 0, 0, 0.05);
    last = Math.max(last, now);
    flow += dt * settings.speed;
    hue += dt * settings.speed * settings.colorSpeed;
    if (opening < 1) opening = Math.min(1, opening + dt / 1.6);

    const tracking = pointer.inside;
    const follow = 1 - Math.exp(-dt / 0.325);
    mouse.x += ((tracking ? pointer.x : 0.5) - mouse.x) * follow;
    mouse.y += ((tracking ? pointer.y : 0.5) - mouse.y) * follow;
    mouse.presence += ((tracking ? 1 : 0) - mouse.presence) * (1 - Math.exp(-dt / 0.8));

    for (let index = pulses.length - 1; index >= 0; index--) {
      const pulse = pulses[index];
      pulse.age += dt;
      if (pulse.age >= 2.6) pulses.splice(index, 1);
    }
    pulseData.fill(0);
    pulses.forEach((pulse, index) => {
      pulseData[index * 4] = pulse.x;
      pulseData[index * 4 + 1] = pulse.y;
      pulseData[index * 4 + 2] =
        smoother(pulse.age / 0.18) * (1 - smoother((pulse.age - 0.18) / 2.42));
      pulseData[index * 4 + 3] = pulse.age;
    });

    draw();

    const settling =
      Math.abs(mouse.x - (tracking ? pointer.x : 0.5)) > 1e-4 ||
      Math.abs(mouse.y - (tracking ? pointer.y : 0.5)) > 1e-4 ||
      Math.abs((tracking ? 1 : 0) - mouse.presence) > 1e-3 ||
      pulses.length > 0;
    if ((settings.speed > 0 || opening < 1 || settling) && visible && pageVisible) {
      raf = requestAnimationFrame(frame);
    }
  };

  const wake = () => {
    if (raf || lost || !visible || !pageVisible) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const locate = (event: PointerEvent) => {
    const rect = root.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / Math.max(1, rect.width),
      y: 1 - (event.clientY - rect.top) / Math.max(1, rect.height),
      inside:
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom,
    };
  };

  const onPointerMove = (event: PointerEvent) => {
    const spot = locate(event);
    pointer.x = spot.x;
    pointer.y = spot.y;
    pointer.inside = spot.inside;
    wake();
  };

  const onPointerDown = (event: PointerEvent) => {
    const spot = locate(event);
    if (!spot.inside) return;
    pulses.push({ x: spot.x * (size.width / size.height), y: spot.y, age: 0 });
    if (pulses.length > MAX_PULSES) pulses.shift();
    wake();
  };

  const onLeave = () => {
    pointer.inside = false;
    wake();
  };

  const onVisibility = () => {
    pageVisible = document.visibilityState !== "hidden";
    wake();
  };

  const onLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(raf);
    raf = 0;
  };

  const onRestored = () => {
    lost = false;
    resize();
    wake();
  };

  const resizeObserver = new ResizeObserver(() => {
    resize();
    wake();
  });
  resizeObserver.observe(root);

  const intersection = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    wake();
  });
  intersection.observe(root);

  document.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  if (!reduced) {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
  }

  resize();
  if (reduced) {
    // Reduzierte Bewegung: ein statisches Bild, keine Animation, kein Cursor-Effekt.
    opening = 1;
    flow = 1.4;
    hue = 0.35;
    draw();
  } else {
    wake();
  }

  return () => {
    cancelAnimationFrame(raf);
    resizeObserver.disconnect();
    intersection.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    canvas.removeEventListener("webglcontextlost", onLost);
    canvas.removeEventListener("webglcontextrestored", onRestored);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerdown", onPointerDown);
    document.documentElement.removeEventListener("pointerleave", onLeave);
    if (!gl.isContextLost()) {
      gl.deleteVertexArray(vao);
      gl.deleteProgram(shader.program);
    }
  };
}
