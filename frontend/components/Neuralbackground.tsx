"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface NeuralBackgroundProps {
  nodeCount?: number;
  className?: string;
}

interface NodeUserData {
  basePos: THREE.Vector3;
  drift: THREE.Vector3;
  phase: number;
}

/**
 * NeuralBackground
 * A soft, ambient neuron / synapse field rendered with Three.js.
 * Ties back into the "NeusomaHealing" / neural-inspired brand (see hero alt text)
 * without competing with the portrait photo — nodes drift slowly, connections
 * fade in/out, and everything sits in the warm cream/gold palette already used
 * on the page (#ad7432, #d4b896, #f6f1e8).
 *
 * Usage: drop <NeuralBackground /> as an absolutely-positioned layer behind
 * (or beside) your existing content, e.g.:
 *
 *   <div className="absolute inset-0 -z-10">
 *     <NeuralBackground />
 *   </div>
 */
export default function NeuralBackground({
  nodeCount = 70,
  className = "",
}: NeuralBackgroundProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // ---------- Scene setup ----------
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 60;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    // ---------- Palette ----------
    const gold = new THREE.Color("#ad7432");
    const sand = new THREE.Color("#d4b896");
    const cream = new THREE.Color("#fff5d8");

    // ---------- Nodes (neurons) ----------
    const spread = { x: 70, y: 45, z: 40 };
    const nodes: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>[] = [];
    const nodeGeometry = new THREE.SphereGeometry(0.35, 12, 12);

    for (let i = 0; i < nodeCount; i++) {
      const color = [gold, sand, cream][i % 3];
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.55 + Math.random() * 0.35,
      });
      const mesh = new THREE.Mesh(nodeGeometry, material);

      mesh.position.set(
        (Math.random() - 0.5) * spread.x,
        (Math.random() - 0.5) * spread.y,
        (Math.random() - 0.5) * spread.z
      );

      const userData: NodeUserData = {
        basePos: mesh.position.clone(),
        drift: new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4
        ),
        phase: Math.random() * Math.PI * 2,
      };
      mesh.userData = userData;

      scene.add(mesh);
      nodes.push(mesh);
    }

    // ---------- Synapse connections ----------
    const maxDistance = 16;
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(nodeCount * nodeCount * 6);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: gold,
      transparent: true,
      opacity: 0.12,
    });
    lineGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(linePositions, 3)
    );
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // ---------- Ambient glow sprite ----------
    const glowTexture = (() => {
      const size = 128;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const gradient = ctx.createRadialGradient(
        size / 2,
        size / 2,
        0,
        size / 2,
        size / 2,
        size / 2
      );
      gradient.addColorStop(0, "rgba(255,245,216,0.9)");
      gradient.addColorStop(1, "rgba(255,245,216,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
      return new THREE.CanvasTexture(canvas);
    })();

    const glowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    const glow = new THREE.Sprite(glowMaterial);
    glow.scale.set(50, 50, 1);
    glow.position.set(10, 5, -10);
    scene.add(glow);

    // ---------- Mouse parallax ----------
    const mouse = { x: 0, y: 0 };
    const handlePointerMove = (e: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouse.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    window.addEventListener("pointermove", handlePointerMove);

    // ---------- Resize ----------
    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mount);

    // ---------- Animation loop ----------
    let frameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        // Drift nodes gently
        nodes.forEach((node) => {
          const { basePos, drift, phase } = node.userData as NodeUserData;
          node.position.x = basePos.x + Math.sin(t * 0.15 + phase) * drift.x * 3;
          node.position.y = basePos.y + Math.cos(t * 0.12 + phase) * drift.y * 3;
          node.position.z = basePos.z + Math.sin(t * 0.1 + phase) * drift.z * 3;
        });

        // Rebuild synapse lines between nearby nodes
        let vertexIndex = 0;
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dist = nodes[i].position.distanceTo(nodes[j].position);
            if (dist < maxDistance) {
              linePositions[vertexIndex++] = nodes[i].position.x;
              linePositions[vertexIndex++] = nodes[i].position.y;
              linePositions[vertexIndex++] = nodes[i].position.z;
              linePositions[vertexIndex++] = nodes[j].position.x;
              linePositions[vertexIndex++] = nodes[j].position.y;
              linePositions[vertexIndex++] = nodes[j].position.z;
            }
          }
        }
        lineGeometry.setDrawRange(0, vertexIndex / 3);
        lineGeometry.attributes.position.needsUpdate = true;

        // Gentle camera parallax toward the mouse
        camera.position.x += (mouse.x * 6 - camera.position.x) * 0.02;
        camera.position.y += (-mouse.y * 4 - camera.position.y) * 0.02;
        camera.lookAt(0, 0, 0);

        glow.position.x = 10 + Math.sin(t * 0.1) * 4;
        glow.position.y = 5 + Math.cos(t * 0.08) * 4;
      }

      renderer.render(scene, camera);
    };
    animate();

    // ---------- Cleanup ----------
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("pointermove", handlePointerMove);
      resizeObserver.disconnect();
      nodeGeometry.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      glowMaterial.dispose();
      glowTexture.dispose();
      nodes.forEach((n) => n.material.dispose());
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [nodeCount]);

  return (
    <div
      ref={mountRef}
      className={`pointer-events-none h-full w-full ${className}`}
      aria-hidden="true"
    />
  );
}