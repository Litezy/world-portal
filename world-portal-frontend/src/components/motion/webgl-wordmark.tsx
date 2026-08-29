"use client";

import * as React from "react";

import * as THREE from "three";

import { prefersReducedMotion } from "@/lib/motion/gsap";

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * The wordmark arrives as a texture; the shader does three things to it:
 *
 *  1. A bottom-up wipe on load, with a soft leading edge, so the letters rise
 *     out from behind the section's bottom border.
 *  2. A liquid displacement that is violent at the wipe front and settles into
 *     a barely-there idle drift — the letters look like they are resolving
 *     through water rather than sliding.
 *  3. A chromatic split that scales with that same displacement, which is what
 *     stops the reveal reading as a plain mask.
 */
const FRAG = /* glsl */ `
  precision highp float;

  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uReveal;   // 0 -> 1 over the intro
  uniform float uScroll;   // 0 at rest, grows as the hero leaves
  uniform vec2  uPointer;
  uniform float uSheen;    // 0 -> 1, loops forever

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    vec2 uv = vUv;

    // Letters start a full height below and rise into place.
    float rise = (1.0 - uReveal) * 1.06;
    uv.y += rise;

    // Turbulence is strongest while the wipe is travelling, then settles into a
    // permanent slow breath rather than stopping dead.
    float settle = smoothstep(0.55, 1.0, uReveal);
    float breathe = 0.045 + 0.02 * sin(uTime * 0.6);
    float churn = (1.0 - settle) * 0.9 + breathe;

    float n1 = noise(uv * vec2(3.0, 7.0) + vec2(uTime * 0.06, uTime * 0.11));
    float n2 = noise(uv * vec2(6.0, 3.0) - vec2(uTime * 0.04, uTime * 0.08));
    vec2 flow = vec2(n1 - 0.5, n2 - 0.5);

    uv += flow * 0.05 * churn;
    uv += uPointer * 0.006 * settle;
    uv.y += uScroll * 0.04;

    // Chromatic split, proportional to how much the surface is moving.
    float split = (0.006 * churn) + 0.0012;
    float r = texture2D(uTexture, uv + vec2(split, 0.0)).a;
    float g = texture2D(uTexture, uv).a;
    float b = texture2D(uTexture, uv - vec2(split, 0.0)).a;

    float front = smoothstep(0.0, 0.35, uReveal);
    float alpha = g * front;
    if (alpha <= 0.001) discard;

    vec3 color = vec3(1.0) - vec3(1.0 - r, 1.0 - g, 1.0 - b) * 0.22;

    // Infinite sheen: a soft diagonal band of light travelling left to right
    // across the glyphs, for ever. Diagonal so it reads as a moving highlight
    // rather than a wipe, and scaled by settle so it never fights the intro.
    float band = vUv.x * 0.82 + (1.0 - vUv.y) * 0.18;
    float head = uSheen * 1.6 - 0.3;
    float glow = exp(-pow((band - head) / 0.11, 2.0));
    color += vec3(1.0, 0.96, 0.86) * glow * 0.55 * settle;

    gl_FragColor = vec4(color, alpha);
  }
`;

/** Draw the word once into a 2D canvas so the real webfont supplies the shapes. */
async function buildTexture(text: string, width: number, height: number) {
  const canvas = document.createElement("canvas");
  const dpr = Math.min(window.devicePixelRatio, 2);
  // Cap to a safe texture size; 4096 is universally supported.
  const scale = Math.min(dpr, 4096 / Math.max(width, 1));
  canvas.width = Math.max(2, Math.round(width * scale));
  canvas.height = Math.max(2, Math.round(height * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const family = '"Playfair Display", Georgia, "Times New Roman", serif';
  try {
    // Without this the first paint can land on the fallback serif.
    await document.fonts.load(`italic 400 100px ${family}`);
    await document.fonts.ready;
  } catch {
    /* Font loading API unavailable — the fallback serif is still correct. */
  }

  // Fit the word to the canvas width by measuring at a reference size.
  const reference = 200;
  ctx.font = `italic 400 ${reference}px ${family}`;
  const measured = ctx.measureText(text).width || 1;
  const fontSize = (canvas.width / measured) * reference * 0.995;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = `italic 400 ${fontSize}px ${family}`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  // Sit the cap baseline on the canvas bottom, matching the CSS version.
  ctx.fillText(text, canvas.width / 2, canvas.height * 0.995);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

export function WebglWordmark({
  text,
  className,
  onReady,
}: {
  text: string;
  className?: string;
  /** Fires once the shader has a texture, so the CSS fallback can hide. */
  onReady?: () => void;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const readyRef = React.useRef(onReady);

  // Assigned in an effect, not during render — a ref write during render is
  // unsafe under concurrent rendering.
  React.useEffect(() => {
    readyRef.current = onReady;
  }, [onReady]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion()) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      return; // No WebGL — the CSS wordmark underneath stays visible.
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      uTexture: { value: null as THREE.Texture | null },
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uScroll: { value: 0 },
      uPointer: { value: new THREE.Vector2() },
      uSheen: { value: 0 },
    };

    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms,
        transparent: true,
        depthTest: false,
      }),
    );
    scene.add(mesh);

    let disposed = false;
    let raf = 0;
    let running = true;
    let start = performance.now();
    let elapsed = 0;
    let revealStart = 0;

    const size = () => ({
      w: canvas.clientWidth || 1,
      h: canvas.clientHeight || 1,
    });

    const resize = () => {
      const { w, h } = size();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h, false);
    };

    const rebuild = async () => {
      const { w, h } = size();
      const texture = await buildTexture(text, w, h);
      if (disposed || !texture) return;
      uniforms.uTexture.value?.dispose();
      uniforms.uTexture.value = texture;
      if (!revealStart) {
        revealStart = performance.now();
        readyRef.current?.();
      }
    };

    const pointerTarget = new THREE.Vector2();
    const onPointerMove = (e: PointerEvent) => {
      pointerTarget.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        (e.clientY / window.innerHeight) * 2 - 1,
      );
    };

    const tick = () => {
      if (!running) return;
      raf = requestAnimationFrame(tick);

      elapsed = (performance.now() - start) / 1000;
      uniforms.uTime.value = elapsed;

      if (revealStart) {
        const t = Math.min((performance.now() - revealStart) / 1900, 1);
        // Expo-out: fast off the mark, long settle.
        uniforms.uReveal.value = 1 - Math.pow(2, -10 * t);
      }

      // 3.4s of travel, then a 2.6s pause before the next pass.
      const CYCLE = 6;
      uniforms.uSheen.value = Math.min((elapsed % CYCLE) / 3.4, 1);

      uniforms.uScroll.value = Math.min(window.scrollY / window.innerHeight, 1.5);
      uniforms.uPointer.value.lerp(pointerTarget, 0.05);

      if (uniforms.uTexture.value) renderer.render(scene, camera);
    };

    // Re-rasterise the word when the box changes, so it never goes soft.
    let resizeTimer: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      resize();
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => void rebuild(), 180);
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          start = performance.now() - elapsed * 1000;
          tick();
        } else if (!entry.isIntersecting) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    resize();
    void rebuild();
    tick();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      disposed = true;
      running = false;
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      uniforms.uTexture.value?.dispose();
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      renderer.dispose();
    };
  }, [text]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}

export default WebglWordmark;
