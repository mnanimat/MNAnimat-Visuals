import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Box,
  Sun,
  Eye,
  Sliders,
  Download,
  Plus,
  Trash2,
  Cpu,
  Layers,
  Sparkles,
  Maximize2,
} from 'lucide-react';
import { ThreeObject } from '../../types';

export const ThreeStudio: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshesRef = useRef<Map<string, THREE.Mesh>>(new Map());

  const [objects, setObjects] = useState<ThreeObject[]>([
    {
      id: '3d_cube_1',
      name: 'Cubo Metálico Monolítico',
      type: 'cube',
      position: [0, 1, 0],
      rotation: [0.4, 0.6, 0],
      scale: [1.8, 1.8, 1.8],
      color: '#3b82f6',
      roughness: 0.15,
      metalness: 0.85,
      wireframe: false,
    },
    {
      id: '3d_sphere_1',
      name: 'Esfera Espelhada HDRI',
      type: 'sphere',
      position: [2.5, 1.2, -1],
      rotation: [0, 0, 0],
      scale: [1.2, 1.2, 1.2],
      color: '#a855f7',
      roughness: 0.05,
      metalness: 0.95,
      wireframe: false,
    },
    {
      id: '3d_torus_1',
      name: 'Anel de Ouro Rosa',
      type: 'torus',
      position: [-2.5, 1.5, 1],
      rotation: [1.2, 0.3, 0],
      scale: [1.1, 1.1, 1.1],
      color: '#f43f5e',
      roughness: 0.2,
      metalness: 0.8,
      wireframe: false,
    },
  ]);

  const [selectedObjId, setSelectedObjId] = useState<string>('3d_cube_1');
  const [renderQuality, setRenderQuality] = useState<'1080p' | '4k'>('1080p');

  // Initialize Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#030712');
    scene.fog = new THREE.FogExp2('#030712', 0.03);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 4, 10);
    camera.lookAt(0, 1, 0);
    cameraRef.current = camera;

    // WebGL Renderer using Local GPU
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 2.5);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xf43f5e, 3, 20);
    pointLight.position.set(-5, 5, -3);
    scene.add(pointLight);

    // Ground Grid & Reflector
    const gridHelper = new THREE.GridHelper(30, 30, '#334155', '#1e293b');
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Render Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Rotate active objects gently
      meshesRef.current.forEach((mesh) => {
        mesh.rotation.y += 0.005;
      });

      renderer.render(scene, camera);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Sync state objects to Three.js Meshes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear old meshes
    meshesRef.current.forEach((mesh) => scene.remove(mesh));
    meshesRef.current.clear();

    // Re-create meshes
    objects.forEach((obj) => {
      let geometry: THREE.BufferGeometry;

      switch (obj.type) {
        case 'sphere':
          geometry = new THREE.SphereGeometry(1, 32, 32);
          break;
        case 'cylinder':
          geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
          break;
        case 'torus':
          geometry = new THREE.TorusGeometry(1, 0.3, 16, 100);
          break;
        default:
          geometry = new THREE.BoxGeometry(1, 1, 1);
      }

      const material = new THREE.MeshStandardMaterial({
        color: obj.color,
        roughness: obj.roughness,
        metalness: obj.metalness,
        wireframe: obj.wireframe,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(obj.position[0], obj.position[1], obj.position[2]);
      mesh.rotation.set(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
      mesh.scale.set(obj.scale[0], obj.scale[1], obj.scale[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      scene.add(mesh);
      meshesRef.current.set(obj.id, mesh);
    });
  }, [objects]);

  const selectedObj = objects.find((o) => o.id === selectedObjId);

  const updateObject = (field: keyof ThreeObject, value: any) => {
    setObjects((prev) =>
      prev.map((o) => (o.id === selectedObjId ? { ...o, [field]: value } : o))
    );
  };

  const setCameraView = (view: 'front' | 'top' | 'side' | 'iso') => {
    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    switch (view) {
      case 'front':
        cam.position.set(0, 1, 10);
        cam.lookAt(0, 1, 0);
        break;
      case 'top':
        cam.position.set(0, 10, 0.01);
        cam.lookAt(0, 0, 0);
        break;
      case 'side':
        cam.position.set(10, 1, 0);
        cam.lookAt(0, 1, 0);
        break;
      case 'iso':
        cam.position.set(6, 6, 8);
        cam.lookAt(0, 1, 0);
        break;
    }
  };

  // Keyboard Shortcuts for 3D Studio
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        renderFrameSnapshot();
      } else if (e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        addObject('cube');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedObjId) {
          e.preventDefault();
          deleteObject();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjId]);

  const addObject = (type: ThreeObject['type']) => {
    const newObj: ThreeObject = {
      id: `3d_${type}_${Date.now()}`,
      name: `Novo ${type.toUpperCase()}`,
      type,
      position: [0, 1, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#10b981',
      roughness: 0.3,
      metalness: 0.5,
      wireframe: false,
    };
    setObjects((prev) => [...prev, newObj]);
    setSelectedObjId(newObj.id);
  };

  const deleteObject = () => {
    setObjects((prev) => prev.filter((o) => o.id !== selectedObjId));
    if (objects.length > 1) {
      setSelectedObjId(objects[0].id);
    }
  };

  const renderFrameSnapshot = () => {
    if (!rendererRef.current) return;
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Aether_Render3D_${renderQuality}_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="flex-1 flex bg-[#0a0a0a] overflow-hidden text-gray-300 select-none">
      {/* Left Sidebar: Scene Hierarchy Tree */}
      <aside className="w-64 bg-[#161616] border-r border-white/10 p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Hierarquia 3D
            </h3>
          </div>

          <div className="space-y-1">
            {objects.map((obj) => {
              const isSelected = obj.id === selectedObjId;
              return (
                <button
                  key={obj.id}
                  onClick={() => setSelectedObjId(obj.id)}
                  className={`w-full p-2 rounded border text-left text-xs font-medium flex items-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-indigo-600/10 border-indigo-500/50 text-white shadow'
                      : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Box className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-gray-500'}`} />
                  <span className="truncate flex-1">{obj.name}</span>
                </button>
              );
            })}
          </div>

          {/* Add 3D Primitive */}
          <div className="pt-3 border-t border-white/10">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-2">
              Adicionar Objeto 3D:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => addObject('cube')}
                className="p-1.5 bg-black hover:bg-white/10 border border-white/10 rounded text-xs text-gray-300 font-medium flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Cubo</span>
              </button>
              <button
                onClick={() => addObject('sphere')}
                className="p-1.5 bg-black hover:bg-white/10 border border-white/10 rounded text-xs text-gray-300 font-medium flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Esfera</span>
              </button>
              <button
                onClick={() => addObject('cylinder')}
                className="p-1.5 bg-black hover:bg-white/10 border border-white/10 rounded text-xs text-gray-300 font-medium flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Cilindro</span>
              </button>
              <button
                onClick={() => addObject('torus')}
                className="p-1.5 bg-black hover:bg-white/10 border border-white/10 rounded text-xs text-gray-300 font-medium flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Torus</span>
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={deleteObject}
          className="w-full py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Excluir Objeto</span>
        </button>
      </aside>

      {/* Main 3D Viewport Canvas */}
      <div className="flex-1 relative bg-[#111111] flex flex-col">
        {/* Top Floating Badge */}
        <div className="absolute top-4 left-6 z-10 flex items-center gap-3 bg-[#161616]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
            <Cpu className="w-3.5 h-3.5" />
            <span>WebGL 2.0 WebGL GPU</span>
          </div>

          <div className="h-3 w-[1px] bg-white/10" />

          {/* Camera View Controls */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mr-1">Vistas:</span>
            <button
              onClick={() => setCameraView('front')}
              className="px-2 py-0.5 bg-black/60 hover:bg-white/10 text-[10px] text-gray-300 font-medium rounded transition-colors"
            >
              Frente
            </button>
            <button
              onClick={() => setCameraView('top')}
              className="px-2 py-0.5 bg-black/60 hover:bg-white/10 text-[10px] text-gray-300 font-medium rounded transition-colors"
            >
              Topo
            </button>
            <button
              onClick={() => setCameraView('side')}
              className="px-2 py-0.5 bg-black/60 hover:bg-white/10 text-[10px] text-gray-300 font-medium rounded transition-colors"
            >
              Lado
            </button>
            <button
              onClick={() => setCameraView('iso')}
              className="px-2 py-0.5 bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold rounded transition-colors"
            >
              Iso
            </button>
          </div>
        </div>

        {/* Render Quality & Export Button */}
        <div className="absolute top-4 right-6 z-10 flex items-center gap-3 bg-[#161616]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs">
          <select
            value={renderQuality}
            onChange={(e) => setRenderQuality(e.target.value as any)}
            className="bg-black border border-white/10 rounded px-2 py-0.5 text-xs text-gray-200 font-semibold focus:outline-none"
          >
            <option value="1080p">Full HD 1080p</option>
            <option value="4k">Ultra HD 4K</option>
          </select>

          <button
            onClick={renderFrameSnapshot}
            className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-full shadow transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>Renderizar Imagem</span>
          </button>
        </div>

        {/* Three.js Mount Container */}
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      </div>

      {/* Right Sidebar: 3D Material & Transform Inspector */}
      <aside className="w-72 bg-[#161616] border-l border-white/10 p-4 space-y-4 overflow-y-auto shrink-0">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          Material PBR
        </h3>

        {selectedObj ? (
          <div className="space-y-3 text-xs">
            {/* Color */}
            <div className="flex items-center justify-between p-2.5 bg-black/40 rounded border border-white/10">
              <span className="text-gray-300 font-medium">Cor do Objeto:</span>
              <input
                type="color"
                value={selectedObj.color}
                onChange={(e) => updateObject('color', e.target.value)}
                className="w-7 h-7 rounded cursor-pointer bg-transparent border border-white/10 p-0"
              />
            </div>

            {/* Roughness */}
            <div className="p-2.5 bg-black/40 rounded border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Rugosidade:</span>
                <span className="font-mono text-indigo-400 font-bold">
                  {Math.round(selectedObj.roughness * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={selectedObj.roughness}
                onChange={(e) => updateObject('roughness', Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Metalness */}
            <div className="p-2.5 bg-black/40 rounded border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Metalicidade:</span>
                <span className="font-mono text-indigo-400 font-bold">
                  {Math.round(selectedObj.metalness * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={selectedObj.metalness}
                onChange={(e) => updateObject('metalness', Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Wireframe Toggle */}
            <label className="flex items-center justify-between p-2.5 bg-black/40 rounded border border-white/10 cursor-pointer">
              <span className="text-gray-300 font-medium">Modo Wireframe</span>
              <input
                type="checkbox"
                checked={selectedObj.wireframe}
                onChange={(e) => updateObject('wireframe', e.target.checked)}
                className="rounded bg-black border-white/10 text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          </div>
        ) : (
          <p className="text-xs text-gray-500 text-center py-8">
            Nenhum objeto selecionado na cena.
          </p>
        )}
      </aside>
    </div>
  );
};
