import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type mapboxgl from 'mapbox-gl';
import mb from '@/lib/mapbox';

// Loader com suporte a Draco (modelos comprimidos KHR_draco_mesh_compression).
// O decoder é servido localmente de /public/draco.
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

export interface VehicleModelLayer extends mapboxgl.CustomLayerInterface {
  /** Atualiza posição (lng/lat) e rumo (graus, 0 = norte) do modelo. */
  setPose: (lng: number, lat: number, heading: number) => void;
}

interface ModelLayerOptions {
  id: string;
  modelUrl: string;
  /** Tamanho do modelo na TELA, em pixels (constante em qualquer zoom). */
  sizeMeters?: number;
  /** Ajuste de rumo se o "nariz" do modelo não apontar para -Z. */
  headingOffsetDeg?: number;
  onLoad?: () => void;
  onError?: (e: unknown) => void;
}

/**
 * Camada custom do Mapbox que renderiza um GLB via Three.js, georreferenciado,
 * com rotação pelo rumo (alinha à rua). O mapa precisa estar com algum `pitch`
 * para o 3D aparecer com volume.
 */
export function createVehicleModelLayer(opts: ModelLayerOptions): VehicleModelLayer {
  const { id, modelUrl, sizeMeters = 4.5, headingOffsetDeg = 0, onLoad, onError } = opts;

  let map: mapboxgl.Map;
  let renderer: THREE.WebGLRenderer;
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  let model: THREE.Object3D | null = null;

  // pose atual
  let lng = 0;
  let lat = 0;
  let heading = 0;

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 2.0);
  dir.position.set(50, -70, 100).normalize();
  scene.add(dir);
  const dir2 = new THREE.DirectionalLight(0xffffff, 1.0);
  dir2.position.set(-50, 70, 60).normalize();
  scene.add(dir2);

  const layer: VehicleModelLayer = {
    id,
    type: 'custom',
    renderingMode: '3d',

    onAdd(m, gl) {
      map = m;
      renderer = new THREE.WebGLRenderer({
        canvas: m.getCanvas(),
        context: gl,
        antialias: true,
      });
      renderer.autoClear = false;
      renderer.outputColorSpace = THREE.SRGBColorSpace; // cores corretas
      // iluminação de ambiente (IBL) — deixa os materiais PBR claros e bonitos
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

      gltfLoader.load(
        modelUrl,
        (gltf) => {
          const obj = gltf.scene;
          // normaliza para ~1 unidade (maior dimensão); o tamanho final em
          // pixels é aplicado no render, constante em qualquer zoom.
          const box = new THREE.Box3().setFromObject(obj);
          const size = new THREE.Vector3();
          box.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const factor = 1 / maxDim;
          obj.scale.setScalar(factor);
          // centraliza na origem
          const center = box.getCenter(new THREE.Vector3()).multiplyScalar(factor);
          obj.position.sub(center);
          // desenha SEMPRE por cima do mapa (sem ser ocultado pelo basemap)
          obj.traverse((o: any) => {
            if (o.isMesh && o.material) {
              o.renderOrder = 999;
              o.material.depthTest = false;
            }
          });
          model = obj;
          scene.add(obj);
          map.triggerRepaint();
          onLoad?.();
        },
        undefined,
        (err) => onError?.(err)
      );
    },

    render(_gl, matrix) {
      if (!model) return;

      const mc = mb.MercatorCoordinate.fromLngLat([lng, lat], 0);
      // tamanho constante na tela (em px): converte px -> unidades de mercator
      const worldSize = 512 * Math.pow(2, map.getZoom());
      const s = sizeMeters / worldSize; // sizeMeters é, na prática, pixels-alvo
      const headingRad = THREE.MathUtils.degToRad(-(heading + headingOffsetDeg));

      const l = new THREE.Matrix4()
        .makeTranslation(mc.x, mc.y, mc.z as number)
        .scale(new THREE.Vector3(s, -s, s))
        .multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)) // glTF Y-up -> mapa Z-up
        .multiply(new THREE.Matrix4().makeRotationY(headingRad)); // rumo (alinha à via)

      camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix as number[]).multiply(l);
      renderer.resetState();
      renderer.render(scene, camera);
    },

    setPose(nextLng, nextLat, nextHeading) {
      lng = nextLng;
      lat = nextLat;
      heading = Number.isFinite(nextHeading) ? nextHeading : 0;
      if (map) map.triggerRepaint();
    },
  };

  return layer;
}
