import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Box,
  Sun,
  Eye,
  EyeOff,
  Sliders,
  Download,
  Plus,
  Trash2,
  Layers,
  Sparkles,
  Move,
  RotateCw,
  Scaling,
  User,
  Trees,
  Shield,
  Palette,
  Copy,
  Compass,
  Zap,
  Lightbulb,
  Check,
  Camera,
  Globe,
  Flame,
  SlidersHorizontal,
  Edit2,
} from 'lucide-react';
import { ThreeObject, SceneLight } from '../../types';

export const ThreeStudio: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const objectGroupsRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const lightObjectsRef = useRef<Map<string, THREE.Light>>(new Map());
  const lightGizmosRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const selectionBoxRef = useRef<THREE.BoxHelper | null>(null);

  // Active Category Filter for Object Library
  const [activeTab, setActiveTab] = useState<'basicos' | 'personagem' | 'cenario'>('basicos');

  // Active Transform Tool Mode: Move, Rotate, Scale
  const [transformMode, setTransformMode] = useState<'move' | 'rotate' | 'scale'>('move');

  // Inspector Right Panel Tab: 'object' or 'lighting'
  const [inspectorTab, setInspectorTab] = useState<'object' | 'lighting'>('object');

  // Scene Objects List
  const [objects, setObjects] = useState<ThreeObject[]>([
    {
      id: '3d_mannequin_1',
      name: 'Manequim Humanoide T-Pose',
      type: 'character_dummy',
      category: 'personagem',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#6366f1',
      roughness: 0.3,
      metalness: 0.2,
      wireframe: false,
      visible: true,
    },
    {
      id: '3d_tree_1',
      name: 'Árvore Mística',
      type: 'tree',
      category: 'cenario',
      position: [-3.5, 0, -2],
      rotation: [0, 0.4, 0],
      scale: [1.2, 1.2, 1.2],
      color: '#10b981',
      roughness: 0.7,
      metalness: 0.1,
      wireframe: false,
      visible: true,
    },
    {
      id: '3d_chest_1',
      name: 'Baú do Tesouro',
      type: 'chest',
      category: 'cenario',
      position: [2.5, 0.5, 1],
      rotation: [0, -0.6, 0],
      scale: [1, 1, 1],
      color: '#f59e0b',
      roughness: 0.4,
      metalness: 0.6,
      wireframe: false,
      visible: true,
    },
  ]);

  const [selectedObjId, setSelectedObjId] = useState<string>('3d_mannequin_1');

  // Object / Layer Renaming State
  const [editingObjId, setEditingObjId] = useState<string | null>(null);
  const [editingObjName, setEditingObjName] = useState<string>('');

  const saveEditingObjName = (id: string) => {
    const trimmed = editingObjName.trim();
    if (trimmed) {
      setObjects((prev) =>
        prev.map((o) => (o.id === id ? { ...o, name: trimmed } : o))
      );
    }
    setEditingObjId(null);
  };

  // Dedicated Lighting System State
  const [sceneLights, setSceneLights] = useState<SceneLight[]>([
    {
      id: 'light_sun_1',
      name: 'Sol Principal (Direcional)',
      type: 'directional',
      color: '#38bdf8',
      intensity: 2.2,
      position: [6, 12, 8],
      enabled: true,
      castShadow: true,
    },
    {
      id: 'light_ambient_1',
      name: 'Luz Ambiente Suave',
      type: 'ambient',
      color: '#ffffff',
      intensity: 0.5,
      position: [0, 0, 0],
      enabled: true,
    },
    {
      id: 'light_point_warm',
      name: 'Ponto Quente Dourado',
      type: 'point',
      color: '#f59e0b',
      intensity: 3.5,
      position: [-4, 3, 2],
      enabled: true,
      castShadow: true,
      distance: 25,
      decay: 2,
    },
    {
      id: 'light_point_cyan',
      name: 'Luz Rim Cyan (Recorte)',
      type: 'point',
      color: '#06b6d4',
      intensity: 2.5,
      position: [4, 2, -3],
      enabled: true,
      castShadow: true,
      distance: 20,
      decay: 2,
    },
  ]);

  const [selectedLightId, setSelectedLightId] = useState<string>('light_sun_1');

  // Environment & Viewport Options
  const [fogDensity, setFogDensity] = useState<number>(0.02);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [autoRotateScene, setAutoRotateScene] = useState<boolean>(false);
  const [uniformScale, setUniformScale] = useState<boolean>(true);

  // Camera Orbit Controller State
  const cameraSpherical = useRef({
    radius: 12,
    theta: Math.PI / 4,
    phi: Math.PI / 3,
    target: new THREE.Vector3(0, 1, 0),
  });

  const isDraggingCamera = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  const autoRotateRef = useRef(autoRotateScene);
  useEffect(() => {
    autoRotateRef.current = autoRotateScene;
  }, [autoRotateScene]);

  // Update camera position from spherical coordinates
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { radius, theta, phi, target } = cameraSpherical.current;
    const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    const y = target.y + radius * Math.cos(phi);
    const z = target.z + radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(target);
  };

  const gizmoGroupRef = useRef<THREE.Group | null>(null);
  const isDraggingGizmo = useRef<boolean>(false);
  const activeGizmoAxis = useRef<'x' | 'y' | 'z' | null>(null);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth > 0 ? container.clientWidth : 800;
    const height = container.clientHeight > 0 ? container.clientHeight : 600;
    const aspect = height > 0 ? width / height : 1.33;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#030712');
    scene.fog = new THREE.FogExp2('#030712', fogDensity);
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // 4. Grid Helper & Ground Shadow Catch
    const gridHelper = new THREE.GridHelper(40, 40, '#3b82f6', '#1e293b');
    gridHelper.name = 'scene_grid';
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    const groundGeo = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = 0;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // 5. Selection Box Helper & 3D Gizmo Group
    const boxHelper = new THREE.BoxHelper(new THREE.Object3D(), new THREE.Color('#38bdf8'));
    boxHelper.visible = false;
    scene.add(boxHelper);
    selectionBoxRef.current = boxHelper;

    const gizmoGroup = new THREE.Group();
    gizmoGroup.name = '3d_gizmo_root';
    scene.add(gizmoGroup);
    gizmoGroupRef.current = gizmoGroup;

    // 6. Render Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (autoRotateRef.current) {
        cameraSpherical.current.theta += 0.005;
        updateCameraPosition();
      }

      renderer.render(scene, camera);
    };
    animate();

    // Handle Resize with ResizeObserver
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth || 800;
      const h = mountRef.current.clientHeight || 600;
      if (h === 0) return;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Sync Dynamic Scene Lights & Visual Gizmos
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove previous light objects & gizmos
    lightObjectsRef.current.forEach((light) => scene.remove(light));
    lightObjectsRef.current.clear();

    lightGizmosRef.current.forEach((gizmo) => scene.remove(gizmo));
    lightGizmosRef.current.clear();

    scene.fog = new THREE.FogExp2('#030712', fogDensity);

    const grid = scene.getObjectByName('scene_grid');
    if (grid) grid.visible = showGrid;

    sceneLights.forEach((light) => {
      if (!light.enabled) return;

      let threeLight: THREE.Light;

      if (light.type === 'ambient') {
        threeLight = new THREE.AmbientLight(light.color, light.intensity);
      } else if (light.type === 'directional') {
        const dir = new THREE.DirectionalLight(light.color, light.intensity);
        dir.position.set(light.position[0], light.position[1], light.position[2]);
        dir.castShadow = light.castShadow !== false;
        dir.shadow.mapSize.width = 2048;
        dir.shadow.mapSize.height = 2048;
        threeLight = dir;
      } else if (light.type === 'spot') {
        const spot = new THREE.SpotLight(
          light.color,
          light.intensity,
          light.distance || 0,
          light.angle || Math.PI / 6,
          light.penumbra || 0.2,
          light.decay || 2
        );
        spot.position.set(light.position[0], light.position[1], light.position[2]);
        spot.castShadow = light.castShadow !== false;
        threeLight = spot;
      } else {
        // Point Light
        const point = new THREE.PointLight(
          light.color,
          light.intensity,
          light.distance || 0,
          light.decay || 2
        );
        point.position.set(light.position[0], light.position[1], light.position[2]);
        point.castShadow = light.castShadow !== false;
        threeLight = point;
      }

      scene.add(threeLight);
      lightObjectsRef.current.set(light.id, threeLight);

      // Create Visual Helper Gizmo in 3D Scene for non-ambient lights
      if (light.type !== 'ambient') {
        const gizmoGroup = new THREE.Group();
        gizmoGroup.position.set(light.position[0], light.position[1], light.position[2]);
        gizmoGroup.userData = { isLightGizmo: true, lightId: light.id };

        const isSelected = selectedLightId === light.id && inspectorTab === 'lighting';

        // Light bulb core sphere
        const bulbMat = new THREE.MeshBasicMaterial({
          color: light.color,
          wireframe: isSelected,
        });
        const bulbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), bulbMat);
        bulbMesh.userData = { isLightGizmo: true, lightId: light.id };
        gizmoGroup.add(bulbMesh);

        // Selection ring indicator around selected light
        if (isSelected) {
          const ringGeo = new THREE.RingGeometry(0.45, 0.52, 32);
          const ringMat = new THREE.MeshBasicMaterial({
            color: '#facc15',
            side: THREE.DoubleSide,
          });
          const ringMesh = new THREE.Mesh(ringGeo, ringMat);
          ringMesh.userData = { isLightGizmo: true, lightId: light.id };
          gizmoGroup.add(ringMesh);
        }

        scene.add(gizmoGroup);
        lightGizmosRef.current.set(light.id, gizmoGroup);
      }
    });
  }, [sceneLights, selectedLightId, inspectorTab, fogDensity, showGrid]);

  // Construct Complex 3D Procedural Mesh Groups
  const createObjectMeshGroup = (obj: ThreeObject): THREE.Object3D => {
    const mat = new THREE.MeshStandardMaterial({
      color: obj.color,
      roughness: obj.roughness,
      metalness: obj.metalness,
      wireframe: obj.wireframe,
      emissive: obj.emissive ? new THREE.Color(obj.emissive) : new THREE.Color('#000000'),
      emissiveIntensity: obj.emissiveIntensity ?? 0,
    });

    if (obj.type === 'character_dummy') {
      const group = new THREE.Group();

      // Head
      const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
      const headMesh = new THREE.Mesh(headGeo, mat);
      headMesh.position.set(0, 2.2, 0);
      headMesh.castShadow = true;
      group.add(headMesh);

      // Torso
      const torsoGeo = new THREE.BoxGeometry(0.8, 1.0, 0.4);
      const torsoMesh = new THREE.Mesh(torsoGeo, mat);
      torsoMesh.position.set(0, 1.3, 0);
      torsoMesh.castShadow = true;
      group.add(torsoMesh);

      // Arms
      const armGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.8, 12);
      const leftArm = new THREE.Mesh(armGeo, mat);
      leftArm.position.set(-0.6, 1.3, 0);
      leftArm.rotation.z = Math.PI / 8;
      leftArm.castShadow = true;
      group.add(leftArm);

      const rightArm = new THREE.Mesh(armGeo, mat);
      rightArm.position.set(0.6, 1.3, 0);
      rightArm.rotation.z = -Math.PI / 8;
      rightArm.castShadow = true;
      group.add(rightArm);

      // Legs
      const legGeo = new THREE.CylinderGeometry(0.15, 0.12, 1.0, 12);
      const leftLeg = new THREE.Mesh(legGeo, mat);
      leftLeg.position.set(-0.25, 0.3, 0);
      leftLeg.castShadow = true;
      group.add(leftLeg);

      const rightLeg = new THREE.Mesh(legGeo, mat);
      rightLeg.position.set(0.25, 0.3, 0);
      rightLeg.castShadow = true;
      group.add(rightLeg);

      return group;
    } else if (obj.type === 'character_head') {
      const group = new THREE.Group();
      const skull = new THREE.Mesh(new THREE.SphereGeometry(0.8, 24, 24), mat);
      skull.position.set(0, 1.2, 0);
      skull.scale.set(1, 1.2, 1);
      group.add(skull);

      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.7, 16), mat);
      neck.position.set(0, 0.35, 0);
      group.add(neck);

      return group;
    } else if (obj.type === 'helmet') {
      const group = new THREE.Group();
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.7, 20, 20), mat);
      dome.position.set(0, 0.7, 0);
      group.add(dome);

      const visor = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.3, 0.5),
        new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.9, roughness: 0.1 })
      );
      visor.position.set(0, 0.75, 0.4);
      group.add(visor);

      return group;
    } else if (obj.type === 'tree') {
      const group = new THREE.Group();
      const trunkMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.8 });
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 2.0, 12), trunkMat);
      trunk.position.set(0, 1.0, 0);
      trunk.castShadow = true;
      group.add(trunk);

      const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 16), mat);
      leaves.position.set(0, 2.5, 0);
      leaves.castShadow = true;
      group.add(leaves);

      return group;
    } else if (obj.type === 'chest') {
      const group = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 0.9), mat);
      body.position.set(0, 0.4, 0);
      body.castShadow = true;
      group.add(body);

      const lidMat = new THREE.MeshStandardMaterial({ color: '#d97706', metalness: 0.8, roughness: 0.2 });
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.4, 16, 1, false, 0, Math.PI), lidMat);
      lid.position.set(0, 0.8, 0);
      lid.rotation.z = Math.PI / 2;
      group.add(lid);

      return group;
    } else if (obj.type === 'rock') {
      const rockGeo = new THREE.DodecahedronGeometry(1.0, 1);
      const mesh = new THREE.Mesh(rockGeo, mat);
      mesh.castShadow = true;
      return mesh;
    } else if (obj.type === 'pillar') {
      const pillarGeo = new THREE.CylinderGeometry(0.6, 0.7, 3.5, 16);
      const mesh = new THREE.Mesh(pillarGeo, mat);
      mesh.castShadow = true;
      return mesh;
    } else {
      let geo: THREE.BufferGeometry;
      switch (obj.type) {
        case 'sphere':
          geo = new THREE.SphereGeometry(1, 32, 32);
          break;
        case 'cylinder':
          geo = new THREE.CylinderGeometry(1, 1, 2, 32);
          break;
        case 'torus':
          geo = new THREE.TorusGeometry(1, 0.3, 16, 100);
          break;
        case 'cone':
          geo = new THREE.ConeGeometry(1, 2, 32);
          break;
        case 'pyramid':
          geo = new THREE.ConeGeometry(1, 1.5, 4);
          break;
        case 'plane':
          geo = new THREE.PlaneGeometry(4, 4);
          break;
        default:
          geo = new THREE.BoxGeometry(1, 1, 1);
      }

      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    }
  };

  // Re-sync 3D objects & Interactive Gizmo Position in Three.js Scene
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove existing meshes
    objectGroupsRef.current.forEach((group) => scene.remove(group));
    objectGroupsRef.current.clear();

    // Create & add objects
    objects.forEach((obj) => {
      if (obj.visible === false) return;

      const group = createObjectMeshGroup(obj);
      group.userData = { objectId: obj.id };
      group.position.set(obj.position[0], obj.position[1], obj.position[2]);
      group.rotation.set(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
      group.scale.set(obj.scale[0], obj.scale[1], obj.scale[2]);

      scene.add(group);
      objectGroupsRef.current.set(obj.id, group);
    });

    // Update selection box helper
    if (selectionBoxRef.current) {
      if (inspectorTab === 'object') {
        const activeGroup = objectGroupsRef.current.get(selectedObjId);
        if (activeGroup) {
          selectionBoxRef.current.setFromObject(activeGroup);
          selectionBoxRef.current.visible = true;
        } else {
          selectionBoxRef.current.visible = false;
        }
      } else {
        selectionBoxRef.current.visible = false;
      }
    }

    // Rebuild 3D Interactive Transform Gizmo & Bind Position directly to active item
    if (gizmoGroupRef.current) {
      const gizmoGroup = gizmoGroupRef.current;
      while (gizmoGroup.children.length > 0) {
        gizmoGroup.remove(gizmoGroup.children[0]);
      }

      let activeTargetPos: [number, number, number] | null = null;

      if (inspectorTab === 'object') {
        const activeGroup = objectGroupsRef.current.get(selectedObjId);
        if (activeGroup) {
          activeTargetPos = [activeGroup.position.x, activeGroup.position.y, activeGroup.position.z];
        }
      } else if (inspectorTab === 'lighting') {
        const activeLight = sceneLights.find((l) => l.id === selectedLightId);
        if (activeLight && activeLight.type !== 'ambient') {
          activeTargetPos = activeLight.position;
        }
      }

      if (activeTargetPos) {
        gizmoGroup.position.set(activeTargetPos[0], activeTargetPos[1], activeTargetPos[2]);
        gizmoGroup.visible = true;

        if (transformMode === 'move') {
          // X Arrow Red
          const shaftX = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 1.4, 12),
            new THREE.MeshBasicMaterial({ color: '#ef4444' })
          );
          shaftX.rotation.z = -Math.PI / 2;
          shaftX.position.x = 0.7;
          shaftX.userData = { isGizmo: true, axis: 'x', type: 'move' };

          const tipX = new THREE.Mesh(
            new THREE.ConeGeometry(0.14, 0.38, 12),
            new THREE.MeshBasicMaterial({ color: '#ef4444' })
          );
          tipX.rotation.z = -Math.PI / 2;
          tipX.position.x = 1.5;
          tipX.userData = { isGizmo: true, axis: 'x', type: 'move' };

          // Y Arrow Green
          const shaftY = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 1.4, 12),
            new THREE.MeshBasicMaterial({ color: '#22c55e' })
          );
          shaftY.position.y = 0.7;
          shaftY.userData = { isGizmo: true, axis: 'y', type: 'move' };

          const tipY = new THREE.Mesh(
            new THREE.ConeGeometry(0.14, 0.38, 12),
            new THREE.MeshBasicMaterial({ color: '#22c55e' })
          );
          tipY.position.y = 1.5;
          tipY.userData = { isGizmo: true, axis: 'y', type: 'move' };

          // Z Arrow Blue
          const shaftZ = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 1.4, 12),
            new THREE.MeshBasicMaterial({ color: '#3b82f6' })
          );
          shaftZ.rotation.x = Math.PI / 2;
          shaftZ.position.z = 0.7;
          shaftZ.userData = { isGizmo: true, axis: 'z', type: 'move' };

          const tipZ = new THREE.Mesh(
            new THREE.ConeGeometry(0.14, 0.38, 12),
            new THREE.MeshBasicMaterial({ color: '#3b82f6' })
          );
          tipZ.rotation.x = Math.PI / 2;
          tipZ.position.z = 1.5;
          tipZ.userData = { isGizmo: true, axis: 'z', type: 'move' };

          gizmoGroup.add(shaftX, tipX, shaftY, tipY, shaftZ, tipZ);
        } else if (transformMode === 'rotate') {
          // X Torus Red
          const ringX = new THREE.Mesh(
            new THREE.TorusGeometry(1.4, 0.04, 16, 64),
            new THREE.MeshBasicMaterial({ color: '#ef4444' })
          );
          ringX.rotation.y = Math.PI / 2;
          ringX.userData = { isGizmo: true, axis: 'x', type: 'rotate' };

          // Y Torus Green
          const ringY = new THREE.Mesh(
            new THREE.TorusGeometry(1.4, 0.04, 16, 64),
            new THREE.MeshBasicMaterial({ color: '#22c55e' })
          );
          ringY.rotation.x = Math.PI / 2;
          ringY.userData = { isGizmo: true, axis: 'y', type: 'rotate' };

          // Z Torus Blue
          const ringZ = new THREE.Mesh(
            new THREE.TorusGeometry(1.4, 0.04, 16, 64),
            new THREE.MeshBasicMaterial({ color: '#3b82f6' })
          );
          ringZ.userData = { isGizmo: true, axis: 'z', type: 'rotate' };

          gizmoGroup.add(ringX, ringY, ringZ);
        } else if (transformMode === 'scale') {
          // X Scale Box
          const shaftX = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 1.3, 12),
            new THREE.MeshBasicMaterial({ color: '#ef4444' })
          );
          shaftX.rotation.z = -Math.PI / 2;
          shaftX.position.x = 0.65;
          shaftX.userData = { isGizmo: true, axis: 'x', type: 'scale' };

          const boxX = new THREE.Mesh(
            new THREE.BoxGeometry(0.28, 0.28, 0.28),
            new THREE.MeshBasicMaterial({ color: '#ef4444' })
          );
          boxX.position.x = 1.4;
          boxX.userData = { isGizmo: true, axis: 'x', type: 'scale' };

          // Y Scale Box
          const shaftY = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 1.3, 12),
            new THREE.MeshBasicMaterial({ color: '#22c55e' })
          );
          shaftY.position.y = 0.65;
          shaftY.userData = { isGizmo: true, axis: 'y', type: 'scale' };

          const boxY = new THREE.Mesh(
            new THREE.BoxGeometry(0.28, 0.28, 0.28),
            new THREE.MeshBasicMaterial({ color: '#22c55e' })
          );
          boxY.position.y = 1.4;
          boxY.userData = { isGizmo: true, axis: 'y', type: 'scale' };

          // Z Scale Box
          const shaftZ = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 1.3, 12),
            new THREE.MeshBasicMaterial({ color: '#3b82f6' })
          );
          shaftZ.rotation.x = Math.PI / 2;
          shaftZ.position.z = 0.65;
          shaftZ.userData = { isGizmo: true, axis: 'z', type: 'scale' };

          const boxZ = new THREE.Mesh(
            new THREE.BoxGeometry(0.28, 0.28, 0.28),
            new THREE.MeshBasicMaterial({ color: '#3b82f6' })
          );
          boxZ.position.z = 1.4;
          boxZ.userData = { isGizmo: true, axis: 'z', type: 'scale' };

          gizmoGroup.add(shaftX, boxX, shaftY, boxY, shaftZ, boxZ);
        }
      } else {
        gizmoGroup.visible = false;
      }
    }
  }, [objects, selectedObjId, sceneLights, selectedLightId, transformMode, inspectorTab]);

  const selectedObj = objects.find((o) => o.id === selectedObjId);
  const selectedLight = sceneLights.find((l) => l.id === selectedLightId);

  // Update object properties in state
  const updateSelectedObject = (field: keyof ThreeObject, value: any) => {
    setObjects((prev) =>
      prev.map((o) => (o.id === selectedObjId ? { ...o, [field]: value } : o))
    );
  };

  // Update object transform sub-arrays [x, y, z]
  const updateTransformAxis = (
    transformType: 'position' | 'rotation' | 'scale',
    axisIndex: 0 | 1 | 2,
    val: number
  ) => {
    if (!selectedObj) return;
    const currentArr = [...selectedObj[transformType]] as [number, number, number];

    if (transformType === 'scale' && uniformScale) {
      currentArr[0] = val;
      currentArr[1] = val;
      currentArr[2] = val;
    } else {
      currentArr[axisIndex] = val;
    }

    updateSelectedObject(transformType, currentArr);
  };

  // Update Selected Light properties
  const updateSelectedLight = (field: keyof SceneLight, value: any) => {
    setSceneLights((prev) =>
      prev.map((l) => (l.id === selectedLightId ? { ...l, [field]: value } : l))
    );
  };

  // Update Light Position sub-array [x, y, z]
  const updateLightPositionAxis = (axisIndex: 0 | 1 | 2, delta: number) => {
    if (!selectedLight) return;
    const newPos = [...selectedLight.position] as [number, number, number];
    newPos[axisIndex] = Number((newPos[axisIndex] + delta).toFixed(2));
    updateSelectedLight('position', newPos);
  };

  // Camera preset views
  const setCameraPreset = (view: 'front' | 'top' | 'side' | 'iso') => {
    switch (view) {
      case 'front':
        cameraSpherical.current.radius = 10;
        cameraSpherical.current.theta = 0;
        cameraSpherical.current.phi = Math.PI / 2;
        break;
      case 'top':
        cameraSpherical.current.radius = 12;
        cameraSpherical.current.theta = 0;
        cameraSpherical.current.phi = 0.01;
        break;
      case 'side':
        cameraSpherical.current.radius = 10;
        cameraSpherical.current.theta = Math.PI / 2;
        cameraSpherical.current.phi = Math.PI / 2;
        break;
      case 'iso':
        cameraSpherical.current.radius = 12;
        cameraSpherical.current.theta = Math.PI / 4;
        cameraSpherical.current.phi = Math.PI / 3;
        break;
    }
    updateCameraPosition();
  };

  // Add 3D Object Handler
  const handleAddObject = (type: ThreeObject['type'], labelName: string, category: ThreeObject['category']) => {
    const newId = `3d_${type}_${Date.now()}`;
    const newObj: ThreeObject = {
      id: newId,
      name: labelName,
      type,
      category,
      position: [0, 1, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: type === 'tree' ? '#10b981' : type === 'chest' ? '#f59e0b' : '#6366f1',
      roughness: 0.3,
      metalness: 0.4,
      wireframe: false,
      visible: true,
    };

    setObjects((prev) => [...prev, newObj]);
    setSelectedObjId(newId);
    setInspectorTab('object');
  };

  // Add New Light Source Handler
  const handleAddLight = (type: SceneLight['type']) => {
    const newId = `light_${type}_${Date.now()}`;
    let newLight: SceneLight;

    if (type === 'point') {
      newLight = {
        id: newId,
        name: 'Ponto de Luz Omni',
        type: 'point',
        color: '#f59e0b',
        intensity: 3.0,
        position: [0, 4, 2],
        enabled: true,
        castShadow: true,
        distance: 25,
        decay: 2,
      };
    } else if (type === 'directional') {
      newLight = {
        id: newId,
        name: 'Luz Direcional Sol',
        type: 'directional',
        color: '#ffffff',
        intensity: 2.0,
        position: [5, 10, 5],
        enabled: true,
        castShadow: true,
      };
    } else if (type === 'spot') {
      newLight = {
        id: newId,
        name: 'Spotlight Focal',
        type: 'spot',
        color: '#a855f7',
        intensity: 4.0,
        position: [0, 6, 2],
        enabled: true,
        castShadow: true,
        distance: 30,
        angle: Math.PI / 5,
        penumbra: 0.3,
        decay: 2,
      };
    } else {
      newLight = {
        id: newId,
        name: 'Luz Ambiente Global',
        type: 'ambient',
        color: '#e2e8f0',
        intensity: 0.5,
        position: [0, 0, 0],
        enabled: true,
      };
    }

    setSceneLights((prev) => [...prev, newLight]);
    setSelectedLightId(newId);
    setInspectorTab('lighting');
  };

  // Apply Lighting Presets
  const applyLightingPreset = (presetKey: 'classic_3point' | 'sunset' | 'cyberpunk' | 'moonlight') => {
    if (presetKey === 'classic_3point') {
      setSceneLights([
        {
          id: 'light_key',
          name: 'Key Light (Principal)',
          type: 'directional',
          color: '#ffffff',
          intensity: 2.5,
          position: [6, 8, 5],
          enabled: true,
          castShadow: true,
        },
        {
          id: 'light_fill',
          name: 'Fill Light (Preenchimento)',
          type: 'point',
          color: '#93c5fd',
          intensity: 1.2,
          position: [-6, 4, 3],
          enabled: true,
          distance: 25,
          decay: 2,
        },
        {
          id: 'light_rim',
          name: 'Rim Light (Contorno Dourado)',
          type: 'point',
          color: '#f59e0b',
          intensity: 3.5,
          position: [0, 6, -6],
          enabled: true,
          distance: 20,
          decay: 2,
        },
        {
          id: 'light_ambient',
          name: 'Ambiente de Estúdio',
          type: 'ambient',
          color: '#1e293b',
          intensity: 0.4,
          position: [0, 0, 0],
          enabled: true,
        },
      ]);
    } else if (presetKey === 'sunset') {
      setSceneLights([
        {
          id: 'light_sunset_sun',
          name: 'Sol Pôr do Sol Dourado',
          type: 'directional',
          color: '#f97316',
          intensity: 3.8,
          position: [12, 3, 8],
          enabled: true,
          castShadow: true,
        },
        {
          id: 'light_horizon_glow',
          name: 'Brilho no Horizonte',
          type: 'point',
          color: '#ef4444',
          intensity: 2.5,
          position: [0, 1, -8],
          enabled: true,
          distance: 30,
          decay: 2,
        },
        {
          id: 'light_ambient_warm',
          name: 'Ambiente Céu Alaranjado',
          type: 'ambient',
          color: '#7c2d12',
          intensity: 0.6,
          position: [0, 0, 0],
          enabled: true,
        },
      ]);
    } else if (presetKey === 'cyberpunk') {
      setSceneLights([
        {
          id: 'light_cyan_neon',
          name: 'Luz Neon Cyan',
          type: 'point',
          color: '#06b6d4',
          intensity: 4.5,
          position: [-5, 4, 3],
          enabled: true,
          castShadow: true,
          distance: 25,
          decay: 2,
        },
        {
          id: 'light_magenta_neon',
          name: 'Luz Neon Magenta',
          type: 'point',
          color: '#ec4899',
          intensity: 4.0,
          position: [5, 3, -3],
          enabled: true,
          castShadow: true,
          distance: 25,
          decay: 2,
        },
        {
          id: 'light_purple_spot',
          name: 'Spotlight Violeta',
          type: 'spot',
          color: '#a855f7',
          intensity: 3.5,
          position: [0, 8, 0],
          enabled: true,
          distance: 30,
          angle: Math.PI / 4,
          penumbra: 0.4,
        },
        {
          id: 'light_ambient_dark',
          name: 'Ambiente Cyber Noturno',
          type: 'ambient',
          color: '#0f172a',
          intensity: 0.3,
          position: [0, 0, 0],
          enabled: true,
        },
      ]);
    } else if (presetKey === 'moonlight') {
      setSceneLights([
        {
          id: 'light_moon',
          name: 'Lua Azulada Fria',
          type: 'directional',
          color: '#38bdf8',
          intensity: 2.0,
          position: [-5, 12, -6],
          enabled: true,
          castShadow: true,
        },
        {
          id: 'light_blue_mystic',
          name: 'Acentuação Mística',
          type: 'point',
          color: '#1d4ed8',
          intensity: 2.5,
          position: [3, 2, 3],
          enabled: true,
          distance: 20,
          decay: 2,
        },
        {
          id: 'light_ambient_night',
          name: 'Ambiente Noturno',
          type: 'ambient',
          color: '#020617',
          intensity: 0.3,
          position: [0, 0, 0],
          enabled: true,
        },
      ]);
    }
    setSelectedLightId('light_key');
    setInspectorTab('lighting');
  };

  // Duplicate Selected Object
  const handleDuplicate = () => {
    if (!selectedObj) return;
    const dupId = `3d_${selectedObj.type}_${Date.now()}`;
    const dupObj: ThreeObject = {
      ...selectedObj,
      id: dupId,
      name: `${selectedObj.name} (Cópia)`,
      position: [
        selectedObj.position[0] + 1.2,
        selectedObj.position[1],
        selectedObj.position[2] + 1.2,
      ],
    };
    setObjects((prev) => [...prev, dupObj]);
    setSelectedObjId(dupId);
  };

  // Delete Selected Object
  const handleDelete = () => {
    if (objects.length <= 1) return;
    const filtered = objects.filter((o) => o.id !== selectedObjId);
    setObjects(filtered);
    setSelectedObjId(filtered[0]?.id || '');
  };

  // Delete Selected Light
  const handleDeleteLight = (lightId: string) => {
    if (sceneLights.length <= 1) return;
    const filtered = sceneLights.filter((l) => l.id !== lightId);
    setSceneLights(filtered);
    setSelectedLightId(filtered[0]?.id || '');
  };

  const pointerDownPos = useRef({ x: 0, y: 0 });

  // Mouse Orbit Camera & Interactive 3D Transform Gizmo Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;

    pointerDownPos.current = { x: e.clientX, y: e.clientY };
    previousMousePosition.current = { x: e.clientX, y: e.clientY };

    // Check if user clicked on a 3D Transform Gizmo Handle
    if (mountRef.current && cameraRef.current && gizmoGroupRef.current) {
      const rect = mountRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

      const gizmoIntersects = raycaster.intersectObjects(gizmoGroupRef.current.children, true);
      if (gizmoIntersects.length > 0) {
        const hitGizmo = gizmoIntersects[0].object;
        if (hitGizmo.userData?.isGizmo) {
          isDraggingGizmo.current = true;
          activeGizmoAxis.current = hitGizmo.userData.axis as 'x' | 'y' | 'z';
          return;
        }
      }
    }

    // Default: camera orbit
    isDraggingCamera.current = true;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };

    if (isDraggingGizmo.current && activeGizmoAxis.current) {
      const axis = activeGizmoAxis.current;
      const index = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;

      if (inspectorTab === 'object' && selectedObj) {
        if (transformMode === 'move') {
          const sens = 0.04;
          const delta = axis === 'y' ? -deltaY * sens : deltaX * sens;
          updateTransformAxis('position', index as 0 | 1 | 2, selectedObj.position[index] + delta);
        } else if (transformMode === 'rotate') {
          const sens = 0.05;
          const delta = (deltaX + deltaY) * sens;
          updateTransformAxis('rotation', index as 0 | 1 | 2, selectedObj.rotation[index] + delta);
        } else if (transformMode === 'scale') {
          const sens = 0.03;
          const delta = axis === 'y' ? -deltaY * sens : deltaX * sens;
          const newScale = Math.max(0.1, selectedObj.scale[index] + delta);
          updateTransformAxis('scale', index as 0 | 1 | 2, newScale);
        }
      } else if (inspectorTab === 'lighting' && selectedLight) {
        const sens = 0.04;
        const delta = axis === 'y' ? -deltaY * sens : deltaX * sens;
        updateLightPositionAxis(index as 0 | 1 | 2, delta);
      }
      return;
    }

    if (isDraggingCamera.current) {
      cameraSpherical.current.theta -= deltaX * 0.006;
      cameraSpherical.current.phi = Math.max(
        0.05,
        Math.min(Math.PI - 0.05, cameraSpherical.current.phi + deltaY * 0.006)
      );
      updateCameraPosition();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingCamera.current = false;
    isDraggingGizmo.current = false;
    activeGizmoAxis.current = null;

    // Check if it's a click (minimal drag distance) to select 3D objects or Light Gizmos
    const dist = Math.hypot(
      e.clientX - pointerDownPos.current.x,
      e.clientY - pointerDownPos.current.y
    );

    if (dist < 6 && mountRef.current && cameraRef.current && sceneRef.current) {
      const rect = mountRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

      const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
      for (const hit of intersects) {
        let curr: THREE.Object3D | null = hit.object;

        if (curr.userData?.isLightGizmo) {
          setSelectedLightId(curr.userData.lightId);
          setInspectorTab('lighting');
          break;
        }

        while (curr && curr.parent && curr.parent !== sceneRef.current) {
          if (curr.userData?.isGizmo) break; // ignore transform gizmo handle
          curr = curr.parent;
        }

        if (curr && curr.userData?.objectId) {
          setSelectedObjId(curr.userData.objectId);
          setInspectorTab('object');
          break;
        }
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    cameraSpherical.current.radius = Math.max(
      2,
      Math.min(40, cameraSpherical.current.radius + e.deltaY * 0.01)
    );
    updateCameraPosition();
  };

  // High Quality Render Snapshot Export
  const renderSnapshotHD = () => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const dataUrl = renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `3D_Studio_Render_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="flex-1 flex bg-[#030712] overflow-hidden text-gray-200 select-none">
      {/* Left Sidebar: Asset Library & Object Outliner */}
      <aside className="w-72 bg-[#0f172a]/90 border-r border-slate-800 flex flex-col shrink-0 divide-y divide-slate-800">
        {/* Object Library Section */}
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Adicionar Objetos 3D
            </h2>
          </div>

          {/* Category Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-semibold">
            <button
              onClick={() => setActiveTab('basicos')}
              className={`py-1 rounded transition-colors ${
                activeTab === 'basicos' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Primitivos
            </button>
            <button
              onClick={() => setActiveTab('personagem')}
              className={`py-1 rounded transition-colors ${
                activeTab === 'personagem' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Personagens
            </button>
            <button
              onClick={() => setActiveTab('cenario')}
              className={`py-1 rounded transition-colors ${
                activeTab === 'cenario' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cenários
            </button>
          </div>

          {/* Asset Grid for Active Tab */}
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-none">
            {activeTab === 'basicos' && (
              <>
                <button
                  onClick={() => handleAddObject('cube', 'Cubo 3D', 'basicos')}
                  className="p-2.5 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 text-xs text-slate-300 font-medium flex flex-col items-center gap-1.5 transition-all hover:scale-105"
                >
                  <Box className="w-5 h-5 text-indigo-400" />
                  <span>Cubo</span>
                </button>
                <button
                  onClick={() => handleAddObject('sphere', 'Esfera HD', 'basicos')}
                  className="p-2.5 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 text-xs text-slate-300 font-medium flex flex-col items-center gap-1.5 transition-all hover:scale-105"
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-violet-500 to-cyan-400" />
                  <span>Esfera</span>
                </button>
                <button
                  onClick={() => handleAddObject('cylinder', 'Cilindro', 'basicos')}
                  className="p-2.5 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 text-xs text-slate-300 font-medium flex flex-col items-center gap-1.5 transition-all hover:scale-105"
                >
                  <div className="w-4 h-5 border-2 border-cyan-400 rounded-sm" />
                  <span>Cilindro</span>
                </button>
                <button
                  onClick={() => handleAddObject('torus', 'Anel Torus', 'basicos')}
                  className="p-2.5 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 text-xs text-slate-300 font-medium flex flex-col items-center gap-1.5 transition-all hover:scale-105"
                >
                  <div className="w-5 h-5 rounded-full border-2 border-amber-400" />
                  <span>Torus</span>
                </button>
              </>
            )}

            {activeTab === 'personagem' && (
              <>
                <button
                  onClick={() => handleAddObject('character_dummy', 'Manequim Rigged', 'personagem')}
                  className="p-2.5 bg-indigo-950/40 hover:bg-indigo-900/40 rounded-lg border border-indigo-500/40 text-xs text-indigo-200 font-bold flex flex-col items-center gap-1.5 transition-all hover:scale-105 col-span-2"
                >
                  <User className="w-5 h-5 text-cyan-400 animate-bounce" />
                  <span>🕺 Manequim Humanoide T-Pose</span>
                </button>
                <button
                  onClick={() => handleAddObject('character_head', 'Busto / Cabeça Sculpt', 'personagem')}
                  className="p-2.5 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 text-xs text-slate-300 font-medium flex flex-col items-center gap-1.5 transition-all hover:scale-105"
                >
                  <User className="w-4 h-4 text-violet-400" />
                  <span>Busto Cabeça</span>
                </button>
                <button
                  onClick={() => handleAddObject('helmet', 'Elmo de Armadura', 'personagem')}
                  className="p-2.5 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 text-xs text-slate-300 font-medium flex flex-col items-center gap-1.5 transition-all hover:scale-105"
                >
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Elmo Armadura</span>
                </button>
              </>
            )}

            {activeTab === 'cenario' && (
              <>
                <button
                  onClick={() => handleAddObject('tree', 'Árvore Mística', 'cenario')}
                  className="p-2.5 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 text-xs text-slate-300 font-medium flex flex-col items-center gap-1.5 transition-all hover:scale-105"
                >
                  <Trees className="w-5 h-5 text-emerald-400" />
                  <span>Árvore</span>
                </button>
                <button
                  onClick={() => handleAddObject('chest', 'Baú do Tesouro', 'cenario')}
                  className="p-2.5 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 text-xs text-slate-300 font-medium flex flex-col items-center gap-1.5 transition-all hover:scale-105"
                >
                  <Box className="w-5 h-5 text-amber-400" />
                  <span>Baú</span>
                </button>
                <button
                  onClick={() => handleAddObject('rock', 'Rocha Rugosa', 'cenario')}
                  className="p-2.5 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 text-xs text-slate-300 font-medium flex flex-col items-center gap-1.5 transition-all hover:scale-105"
                >
                  <Compass className="w-5 h-5 text-slate-400" />
                  <span>Rocha</span>
                </button>
                <button
                  onClick={() => handleAddObject('pillar', 'Coluna Clássica', 'cenario')}
                  className="p-2.5 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 text-xs text-slate-300 font-medium flex flex-col items-center gap-1.5 transition-all hover:scale-105"
                >
                  <Layers className="w-5 h-5 text-cyan-400" />
                  <span>Pilar</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Scene Outliner Tree */}
        <div className="flex-1 p-4 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              Outliner de Objetos ({objects.length})
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={handleDuplicate}
                title="Duplicar Objeto Selecionado (Ctrl+D)"
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDelete}
                title="Excluir Objeto (Delete)"
                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {objects.map((obj) => {
              const isSelected = obj.id === selectedObjId && inspectorTab === 'object';
              return (
                <div
                  key={obj.id}
                  onClick={() => {
                    setSelectedObjId(obj.id);
                    setInspectorTab('object');
                  }}
                  className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold shadow'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1 min-w-0 mr-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: obj.color }}
                    />
                    {editingObjId === obj.id ? (
                      <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingObjName}
                          onChange={(e) => setEditingObjName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditingObjName(obj.id);
                            if (e.key === 'Escape') setEditingObjId(null);
                          }}
                          onBlur={() => saveEditingObjName(obj.id)}
                          autoFocus
                          className="bg-slate-900 border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-white font-bold focus:outline-none w-full"
                        />
                        <button
                          onClick={() => saveEditingObjName(obj.id)}
                          className="p-0.5 text-emerald-400 hover:text-emerald-300"
                          title="Salvar Nome"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-1 flex-1 min-w-0 group/objname cursor-pointer"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditingObjId(obj.id);
                          setEditingObjName(obj.name);
                        }}
                      >
                        <span className="truncate">{obj.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingObjId(obj.id);
                            setEditingObjName(obj.name);
                          }}
                          className="opacity-0 group-hover/objname:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-indigo-300"
                          title="Renomear Objeto"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateSelectedObject('visible', !obj.visible);
                    }}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    {obj.visible !== false ? (
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main 3D Viewport & Interactive Tools Overlay */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-950">
        {/* Top Viewport Control Bar */}
        <div className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-2 flex items-center justify-between z-10 shrink-0">
          {/* Transform Mode Switcher Gizmo Bar */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">Modo Transformar:</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setTransformMode('move')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
                  transformMode === 'move'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Mover Posição 3D (Arraste as Setas Vermelha, Verde e Azul)"
              >
                <Move className="w-3.5 h-3.5 text-cyan-300" />
                <span>Mover</span>
              </button>

              <button
                onClick={() => setTransformMode('rotate')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
                  transformMode === 'rotate'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Rotacionar Ângulo 3D (Arraste os Anéis)"
              >
                <RotateCw className="w-3.5 h-3.5 text-cyan-300" />
                <span>Rotacionar</span>
              </button>

              <button
                onClick={() => setTransformMode('scale')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
                  transformMode === 'scale'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Escalar Dimensão 3D (Arraste os Cubos das Pontas)"
              >
                <Scaling className="w-3.5 h-3.5 text-cyan-300" />
                <span>Escalar</span>
              </button>
            </div>
          </div>

          {/* Camera View Preset Buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">Vistas Câmera:</span>
            <button
              onClick={() => setCameraPreset('front')}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded border border-slate-800 transition-colors"
            >
              Frente
            </button>
            <button
              onClick={() => setCameraPreset('top')}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded border border-slate-800 transition-colors"
            >
              Topo
            </button>
            <button
              onClick={() => setCameraPreset('side')}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded border border-slate-800 transition-colors"
            >
              Lado
            </button>
            <button
              onClick={() => setCameraPreset('iso')}
              className="px-2.5 py-1 bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 text-xs font-bold rounded shadow transition-colors"
            >
              Iso 3D
            </button>

            <button
              onClick={() => setAutoRotateScene(!autoRotateScene)}
              className={`p-1.5 rounded border text-xs font-medium transition-colors ${
                autoRotateScene
                  ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Giro Automático da Cena (Turntable 360°)"
            >
              <RotateCw className={`w-3.5 h-3.5 ${autoRotateScene ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* High Res Render Snapshot Export */}
          <button
            onClick={renderSnapshotHD}
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs rounded-lg shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Render HD</span>
          </button>
        </div>

        {/* WebGL Canvas Container Viewport */}
        <div
          ref={mountRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
          className="flex-1 w-full h-full cursor-grab active:cursor-grabbing relative"
        >
          {/* Overlay Navigation Hint */}
          <div className="absolute bottom-4 left-6 z-10 flex items-center gap-3 bg-black/70 backdrop-blur px-3.5 py-1.5 rounded-full border border-white/10 text-[11px] text-slate-300">
            <span className="flex items-center gap-1 font-semibold text-cyan-400">
              <Camera className="w-3.5 h-3.5" />
              Clique no objeto/luz e arraste as setas (Gizmo)
            </span>
            <span className="text-slate-500">•</span>
            <span>Arraste com o mouse para orbitar a cena</span>
          </div>
        </div>
      </div>

      {/* Right Sidebar: Dual Tab Inspector (Object Properties vs Lighting Control Panel) */}
      <aside className="w-80 bg-[#0f172a]/90 border-l border-slate-800 flex flex-col shrink-0 overflow-y-auto divide-y divide-slate-800">
        {/* Top Switcher Tabs: Objeto vs Iluminação */}
        <div className="p-3 bg-slate-900 flex items-center gap-2 border-b border-slate-800">
          <button
            onClick={() => setInspectorTab('object')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              inspectorTab === 'object'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-cyan-300" />
            <span>Transformação</span>
          </button>

          <button
            onClick={() => setInspectorTab('lighting')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              inspectorTab === 'lighting'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Painel Iluminação</span>
          </button>
        </div>

        {/* TAB 1: OBJECT TRANSFORM & MATERIAL INSPECTOR */}
        {inspectorTab === 'object' && (
          selectedObj ? (
            <>
              {/* Header: Object Title */}
              <div className="p-4 bg-slate-900/60">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={selectedObj.name}
                    onChange={(e) => updateSelectedObject('name', e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                  />
                </div>
                <span className="text-[10px] text-indigo-400 font-mono mt-1 inline-block">
                  ID: {selectedObj.id}
                </span>
              </div>

              {/* Transform Inspector (Position, Rotation, Scale) */}
              <div className="p-4 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    Inspetor de Transformação
                  </span>
                  {transformMode === 'scale' && (
                    <label className="flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={uniformScale}
                        onChange={(e) => setUniformScale(e.target.checked)}
                        className="rounded bg-slate-950 border-slate-700 text-indigo-600"
                      />
                      <span>Escala Uniforme</span>
                    </label>
                  )}
                </h3>

                {/* POSITIONS X, Y, Z */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Move className="w-3.5 h-3.5 text-indigo-400" />
                    Posição (X, Y, Z):
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['X', 'Y', 'Z'] as const).map((axis, i) => (
                      <div key={axis} className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                          <span className={i === 0 ? 'text-rose-400' : i === 1 ? 'text-emerald-400' : 'text-cyan-400'}>
                            {axis}
                          </span>
                          <span className="font-mono">{selectedObj.position[i].toFixed(1)}</span>
                        </div>
                        <input
                          type="range"
                          min="-15"
                          max="15"
                          step="0.2"
                          value={selectedObj.position[i]}
                          onChange={(e) => updateTransformAxis('position', i as 0 | 1 | 2, Number(e.target.value))}
                          className="w-full accent-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* ROTATIONS X, Y, Z */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                    Rotação (Ângulos):
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['X', 'Y', 'Z'] as const).map((axis, i) => (
                      <div key={axis} className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                          <span className={i === 0 ? 'text-rose-400' : i === 1 ? 'text-emerald-400' : 'text-cyan-400'}>
                            {axis}
                          </span>
                          <span className="font-mono">
                            {Math.round((selectedObj.rotation[i] * 180) / Math.PI)}°
                          </span>
                        </div>
                        <input
                          type="range"
                          min={-Math.PI}
                          max={Math.PI}
                          step="0.05"
                          value={selectedObj.rotation[i]}
                          onChange={(e) => updateTransformAxis('rotation', i as 0 | 1 | 2, Number(e.target.value))}
                          className="w-full accent-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* SCALE X, Y, Z */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Scaling className="w-3.5 h-3.5 text-indigo-400" />
                    Escala Dimensão:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['X', 'Y', 'Z'] as const).map((axis, i) => (
                      <div key={axis} className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                          <span className={i === 0 ? 'text-rose-400' : i === 1 ? 'text-emerald-400' : 'text-cyan-400'}>
                            {axis}
                          </span>
                          <span className="font-mono">{selectedObj.scale[i].toFixed(1)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="6.0"
                          step="0.1"
                          value={selectedObj.scale[i]}
                          onChange={(e) => updateTransformAxis('scale', i as 0 | 1 | 2, Number(e.target.value))}
                          className="w-full accent-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PBR Material & Shading Properties */}
              <div className="p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-violet-400" />
                  Material PBR & Superfície
                </h3>

                {/* Color Picker & Swatches */}
                <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-300 font-medium">Cor Base:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedObj.color}
                      onChange={(e) => updateSelectedObject('color', e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <span className="text-xs font-mono font-bold text-indigo-400 uppercase">
                      {selectedObj.color}
                    </span>
                  </div>
                </div>

                {/* Roughness & Metalness Sliders */}
                <div className="space-y-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Rugosidade (Roughness):</span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {Math.round(selectedObj.roughness * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={selectedObj.roughness}
                      onChange={(e) => updateSelectedObject('roughness', Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Metalicidade (Metalness):</span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {Math.round(selectedObj.metalness * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={selectedObj.metalness}
                      onChange={(e) => updateSelectedObject('metalness', Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>

                {/* Wireframe Toggle */}
                <label className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800 cursor-pointer">
                  <span className="text-xs text-slate-300 font-medium">Modo Malha Wireframe</span>
                  <input
                    type="checkbox"
                    checked={selectedObj.wireframe}
                    onChange={(e) => updateSelectedObject('wireframe', e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </label>
              </div>
            </>
          ) : (
            <div className="p-6 text-center text-slate-500 text-xs">
              Nenhum objeto 3D selecionado.
            </div>
          )
        )}

        {/* TAB 2: LIGHTING CONTROL PANEL */}
        {inspectorTab === 'lighting' && (
          <div className="p-4 space-y-5">
            {/* Presets Grid */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                Presets de Iluminação Prontos:
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold">
                <button
                  onClick={() => applyLightingPreset('classic_3point')}
                  className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-slate-300 flex items-center gap-1.5 transition-all hover:scale-105"
                >
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Estúdio 3 Pontos</span>
                </button>
                <button
                  onClick={() => applyLightingPreset('sunset')}
                  className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-slate-300 flex items-center gap-1.5 transition-all hover:scale-105"
                >
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span>Pôr do Sol</span>
                </button>
                <button
                  onClick={() => applyLightingPreset('cyberpunk')}
                  className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-slate-300 flex items-center gap-1.5 transition-all hover:scale-105"
                >
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Cyberpunk Neon</span>
                </button>
                <button
                  onClick={() => applyLightingPreset('moonlight')}
                  className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-slate-300 flex items-center gap-1.5 transition-all hover:scale-105"
                >
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Luar Noturno</span>
                </button>
              </div>
            </div>

            {/* Add New Light Actions */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                Adicionar Fonte de Luz:
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <button
                  onClick={() => handleAddLight('point')}
                  className="p-2 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-500/40 text-amber-200 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all hover:scale-105"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span>+ Point Light</span>
                </button>

                <button
                  onClick={() => handleAddLight('directional')}
                  className="p-2 bg-sky-950/40 hover:bg-sky-900/40 border border-sky-500/40 text-sky-200 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all hover:scale-105"
                >
                  <Sun className="w-3.5 h-3.5 text-sky-400" />
                  <span>+ Directional</span>
                </button>

                <button
                  onClick={() => handleAddLight('spot')}
                  className="p-2 bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/40 text-purple-200 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all hover:scale-105"
                >
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  <span>+ Spot Light</span>
                </button>

                <button
                  onClick={() => handleAddLight('ambient')}
                  className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all hover:scale-105"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>+ Ambient</span>
                </button>
              </div>
            </div>

            {/* List of Active Scene Lights */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Fontes de Luz Ativas ({sceneLights.length}):</span>
              </span>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {sceneLights.map((light) => {
                  const isSelected = light.id === selectedLightId;
                  return (
                    <div
                      key={light.id}
                      onClick={() => setSelectedLightId(light.id)}
                      className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-600/30 border-amber-500 text-white font-bold shadow'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                          style={{ backgroundColor: light.color }}
                        />
                        <span className="truncate">{light.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-slate-400 uppercase font-mono">
                          {light.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateSelectedLight('enabled', !light.enabled);
                          }}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          {light.enabled ? (
                            <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                          )}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLight(light.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Light Config Panel */}
            {selectedLight && (
              <div className="pt-3 border-t border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4" />
                    Propriedades da Luz
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">
                    {selectedLight.type}
                  </span>
                </div>

                {/* Light Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400">Nome da Luz:</label>
                  <input
                    type="text"
                    value={selectedLight.name}
                    onChange={(e) => updateSelectedLight('name', e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-500 w-full"
                  />
                </div>

                {/* Light Color & Quick Swatches */}
                <div className="space-y-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-medium">Cor da Luz:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedLight.color}
                        onChange={(e) => updateSelectedLight('color', e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 p-0"
                      />
                      <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                        {selectedLight.color}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800">
                    {['#ffffff', '#fef08a', '#f97316', '#06b6d4', '#ec4899', '#10b981'].map((hex) => (
                      <button
                        key={hex}
                        onClick={() => updateSelectedLight('color', hex)}
                        className="w-5 h-5 rounded-full border border-white/20 transition-transform hover:scale-125"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>

                {/* Light Intensity */}
                <div className="space-y-1 bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">Intensidade do Brilho:</span>
                    <span className="font-mono text-amber-400 font-bold">{selectedLight.intensity.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="10.0"
                    step="0.1"
                    value={selectedLight.intensity}
                    onChange={(e) => updateSelectedLight('intensity', Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                {/* Light Position (for non-ambient lights) */}
                {selectedLight.type !== 'ambient' && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <Move className="w-3.5 h-3.5 text-amber-400" />
                      Posição no Espaço 3D (X, Y, Z):
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {(['X', 'Y', 'Z'] as const).map((axis, i) => (
                        <div key={axis} className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                            <span className={i === 0 ? 'text-rose-400' : i === 1 ? 'text-emerald-400' : 'text-cyan-400'}>
                              {axis}
                            </span>
                            <span className="font-mono">{selectedLight.position[i].toFixed(1)}</span>
                          </div>
                          <input
                            type="range"
                            min="-20"
                            max="20"
                            step="0.5"
                            value={selectedLight.position[i]}
                            onChange={(e) => {
                              const pos = [...selectedLight.position] as [number, number, number];
                              pos[i] = Number(e.target.value);
                              updateSelectedLight('position', pos);
                            }}
                            className="w-full accent-amber-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Point / Spot Light Distance & Decay */}
                {(selectedLight.type === 'point' || selectedLight.type === 'spot') && (
                  <div className="space-y-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Alcance (Distance):</span>
                        <span className="font-mono text-cyan-400 font-bold">{selectedLight.distance || 0}m</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="80"
                        step="1"
                        value={selectedLight.distance || 0}
                        onChange={(e) => updateSelectedLight('distance', Number(e.target.value))}
                        className="w-full accent-cyan-500"
                      />
                    </div>

                    <div className="space-y-1 pt-2 border-t border-slate-800">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Atenuação (Decay):</span>
                        <span className="font-mono text-cyan-400 font-bold">{selectedLight.decay || 2}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.2"
                        value={selectedLight.decay || 2}
                        onChange={(e) => updateSelectedLight('decay', Number(e.target.value))}
                        className="w-full accent-cyan-500"
                      />
                    </div>
                  </div>
                )}

                {/* Cast Shadow Toggle */}
                {selectedLight.type !== 'ambient' && (
                  <label className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800 cursor-pointer">
                    <span className="text-xs text-slate-300 font-medium">Projetar Sombras Realistas</span>
                    <input
                      type="checkbox"
                      checked={selectedLight.castShadow !== false}
                      onChange={(e) => updateSelectedLight('castShadow', e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500 cursor-pointer"
                    />
                  </label>
                )}
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
};
