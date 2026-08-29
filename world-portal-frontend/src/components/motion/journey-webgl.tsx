"use client";

import * as React from "react";

import * as THREE from "three";

import { prefersReducedMotion } from "@/lib/motion/gsap";

const VERT = /* glsl */ `
  attribute float aOffset;   // 0 -> 1 along the path
  attribute float aSeed;
  uniform float uProgress;
  uniform float uTime;
  uniform float uAspect;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    // A serpentine route down the panel — the flight path the copy talks about.
    float t = aOffset;
    float x = sin(t * 6.2831 * 1.5) * 0.42 + sin(t * 6.2831 * 0.5 + 1.2) * 0.14;
    float y = 1.0 - t * 2.0;

    // Gentle drift so the line breathes even when the page is still.
    x += sin(uTime * 0.4 + aSeed * 6.28) * 0.012;
    y += cos(uTime * 0.33 + aSeed * 6.28) * 0.008;

    // Dots ahead of the scroll position have not been "travelled" yet.
    float lead = smoothstep(uProgress + 0.06, uProgress - 0.02, t);
    // The head of the trail glows brightest.
    float head = exp(-pow((t - uProgress) / 0.05, 2.0));

    vAlpha = lead * (0.22 + head * 0.9);
    vSeed = aSeed;

    gl_Position = vec4(x / uAspect * uAspect, y, 0.0, 1.0);
    gl_PointSize = (1.8 + head * 7.0) * (1.0 + aSeed * 0.4);
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    // Round, soft-edged points.
    vec2 d = gl_PointCoord - 0.5;
    float r = dot(d, d);
    if (r > 0.25) discard;
    float soft = smoothstep(0.25, 0.02, r);

    vec3 warm = mix(vec3(1.0, 0.85, 0.30), vec3(1.0, 0.98, 0.90), vSeed);
    gl_FragColor = vec4(warm, vAlpha * soft);
  }
`;

/**
 * The route line behind the How It Works panel: a serpentine trail of points
 * that draws itself forward as you scroll into the section and retracts as you
 * scroll back out. Purely decorative — the steps themselves are real DOM.
 *
 * `progressRef` is written by the section's ScrollTrigger rather than read from
 * scroll here, so the WebGL layer and the DOM animation stay on exactly the
 * same clock in both directions.
 */
export function JourneyWebgl({
  progressRef,
  className,
}: {
  progressRef: React.RefObject<number>;
  className?: string;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

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
      return; // No WebGL — the panel is complete without it.
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const COUNT = 900;
    const offsets = new Float32Array(COUNT);
    const seeds = new Float32Array(COUNT);
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      offsets[i] = i / (COUNT - 1);
      seeds[i] = Math.random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aOffset", new THREE.BufferAttribute(offsets, 1));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    const uniforms = {
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uAspect: { value: 1 },
    };

    const points = new THREE.Points(
      geometry,
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms,
        transparent: true,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    scene.add(points);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      if (!w || !h) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setSize(w, h, false);
      uniforms.uAspect.value = w / h;
    };

    let raf = 0;
    let running = true;
    const start = performance.now();
    // Eased follow, so a flung scroll does not make the trail snap.
    let shown = 0;

    const tick = () => {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      uniforms.uTime.value = (performance.now() - start) / 1000;
      shown += (progressRef.current - shown) * 0.12;
      uniforms.uProgress.value = shown;
      renderer.render(scene, camera);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
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
    tick();
    window.addEventListener("resize", resize);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
      geometry.dispose();
      (points.material as THREE.Material).dispose();
      renderer.dispose();
    };
  }, [progressRef]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}

export default JourneyWebgl;
