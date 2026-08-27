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
 * Samples the hero photograph through a slow, scroll-reactive displacement so
 * the water and cloud edges drift rather than sitting flat, then lifts the
 * contrast slightly toward the horizon.
 */
const FRAG = /* glsl */ `
  precision highp float;

  uniform sampler2D uTexture;
  uniform vec2  uResolution;
  uniform vec2  uImageSize;
  uniform float uTime;
  uniform float uScroll;
  uniform vec2  uPointer;
  uniform float uOpacity;

  varying vec2 vUv;

  // Classic 2D value noise — cheap, and smooth enough for a slow drift.
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

  // Cover-fit the texture regardless of the canvas aspect ratio.
  vec2 coverUv(vec2 uv, vec2 res, vec2 img) {
    float canvasAspect = res.x / res.y;
    float imageAspect  = img.x / img.y;
    vec2 scale = canvasAspect > imageAspect
      ? vec2(1.0, imageAspect / canvasAspect)
      : vec2(canvasAspect / imageAspect, 1.0);
    return (uv - 0.5) * scale + 0.5;
  }

  void main() {
    vec2 uv = coverUv(vUv, uResolution, uImageSize);

    // Parallax: the plate lifts as the page scrolls, with a light pointer lean.
    uv.y += uScroll * 0.09;
    uv += uPointer * 0.012 * (1.0 - vUv.y);

    // Slow organic displacement, strongest low in the frame where the water is.
    float n = noise(uv * 3.2 + vec2(uTime * 0.045, uTime * 0.03));
    float weight = smoothstep(0.05, 0.95, 1.0 - vUv.y);
    uv += (n - 0.5) * 0.012 * weight;

    vec3 color = texture2D(uTexture, uv).rgb;

    // Gentle contrast lift so the scrim above it has something to sit on.
    color = mix(color, color * color * 1.22, 0.18);

    gl_FragColor = vec4(color, uOpacity);
  }
`;

/**
 * WebGL layer over the hero. It renders the *same* image file the underlying
 * <Image> already fetched, so it costs one cache hit and no extra download,
 * and it fades in only once the texture is decoded — meaning the static image
 * stays the LCP element and the page never depends on WebGL to look right.
 */
export function HeroWebgl({ src, className }: { src: string; className?: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion()) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: "low-power",
      });
    } catch {
      return; // No WebGL — the plain <Image> underneath is already correct.
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTexture: { value: null as THREE.Texture | null },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uImageSize: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uOpacity: { value: 0 },
    };

    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms,
        transparent: true,
      }),
    );
    scene.add(mesh);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      if (!w || !h) return;
      // Cap DPR — the shader is fill-rate bound and 3x buys nothing here.
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setSize(w, h, false);
      uniforms.uResolution.value.set(w, h);
    };

    const pointerTarget = new THREE.Vector2();
    const onPointerMove = (e: PointerEvent) => {
      pointerTarget.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        (e.clientY / window.innerHeight) * 2 - 1,
      );
    };

    new THREE.TextureLoader().load(src, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      uniforms.uTexture.value = texture;
      uniforms.uImageSize.value.set(texture.image.width, texture.image.height);
    });

    let raf = 0;
    let running = true;
    // Plain elapsed time — THREE.Clock is deprecated and all the shader needs
    // is a monotonically rising seconds value.
    let start = performance.now();
    let elapsed = 0;

    const tick = () => {
      if (!running) return;
      raf = requestAnimationFrame(tick);

      elapsed = (performance.now() - start) / 1000;
      uniforms.uTime.value = elapsed;
      // 0 at the top of the hero, 1 once it has scrolled a full viewport.
      uniforms.uScroll.value = Math.min(window.scrollY / window.innerHeight, 1.4);
      uniforms.uPointer.value.lerp(pointerTarget, 0.05);

      if (uniforms.uTexture.value) {
        uniforms.uOpacity.value += (1 - uniforms.uOpacity.value) * 0.04;
      }
      renderer.render(scene, camera);
    };

    // Only run while the hero is actually on screen.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          // Rebase so the drift resumes where it left off rather than jumping.
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
    tick();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      uniforms.uTexture.value?.dispose();
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      renderer.dispose();
    };
  }, [src]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}

export default HeroWebgl;
