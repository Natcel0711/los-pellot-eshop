// The 3D vehicle configurator scene — copied unchanged from the Angular app
// (originally ported from js/vehicle-scene.js). A
// stylized low-poly car (extruded from the same side-profile silhouette used
// in the original 2D artwork) that the user can freely drag-rotate and zoom.
// Clickable glowing markers use raycasting. `three` is now a real npm
// dependency instead of the vendored/import-mapped files the static site
// used, but the logic below is otherwise unchanged.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const CAR_WIDTH = 1.7;
const DEFAULT_RADIUS = 6.4;
const DEFAULT_PHI = 1.15; // polar angle (radians) — slight top-down 3/4 elevation

const COLORS = {
	body: 0x151a24,
	bodyEdge: 0x6f95ff,
	wheel: 0x0b0d12,
	wheelEdge: 0x8a93a8,
	hotspot: 0x2f5eff,
	hotspotActive: 0xffb020,
	ground: 0x0e111a
};

export type VehicleView = 'front' | 'side' | 'rear';

export interface VehicleSceneOptions {
	onHotspotClick?: (category: string, label: string) => void;
	onHotspotHover?: (category: string | null, x?: number, y?: number) => void;
	onAutoRotateChange?: (isOn: boolean) => void;
}

export interface HotspotScreenPosition {
	category: string;
	label: string;
	x: number;
	y: number;
}

export interface VehicleSceneHandle {
	goToView(view: VehicleView): void;
	focusCategory(category: string): void;
	setActiveCategory(category: string | null): void;
	toggleAutoRotate(): boolean;
	readonly autoRotate: boolean;
	getHotspotScreenPositions(): HotspotScreenPosition[];
	destroy(): void;
}

// Same silhouette used by the original 2D hero/side artwork, converted
// from its SVG points (x right, y down) into 3D-friendly coordinates
// (x = car length, +x = front; y = height, up positive).
function buildBodyShape(): THREE.Shape {
	const shape = new THREE.Shape();
	const pt = (svgX: number, svgY: number): [number, number] => [
		(svgX - 200) * 0.012,
		(180 - svgY) * 0.012
	];

	let p = pt(20, 150);
	shape.moveTo(p[0], p[1]);
	let c = pt(20, 110),
		e = pt(70, 100);
	shape.quadraticCurveTo(c[0], c[1], e[0], e[1]);
	e = pt(110, 60);
	shape.lineTo(e[0], e[1]);
	c = pt(140, 40);
	e = pt(190, 40);
	shape.quadraticCurveTo(c[0], c[1], e[0], e[1]);
	e = pt(260, 40);
	shape.lineTo(e[0], e[1]);
	c = pt(300, 40);
	e = pt(320, 70);
	shape.quadraticCurveTo(c[0], c[1], e[0], e[1]);
	e = pt(350, 100);
	shape.lineTo(e[0], e[1]);
	c = pt(380, 105);
	e = pt(380, 140);
	shape.quadraticCurveTo(c[0], c[1], e[0], e[1]);
	e = pt(380, 155);
	shape.lineTo(e[0], e[1]);
	c = pt(380, 165);
	e = pt(368, 165);
	shape.quadraticCurveTo(c[0], c[1], e[0], e[1]);
	e = pt(345, 165);
	shape.lineTo(e[0], e[1]);
	c = pt(340, 180);
	e = pt(322, 180);
	shape.quadraticCurveTo(c[0], c[1], e[0], e[1]);
	c = pt(304, 180);
	e = pt(299, 165);
	shape.quadraticCurveTo(c[0], c[1], e[0], e[1]);
	e = pt(140, 165);
	shape.lineTo(e[0], e[1]);
	c = pt(135, 180);
	e = pt(117, 180);
	shape.quadraticCurveTo(c[0], c[1], e[0], e[1]);
	c = pt(99, 180);
	e = pt(94, 165);
	shape.quadraticCurveTo(c[0], c[1], e[0], e[1]);
	e = pt(32, 165);
	shape.lineTo(e[0], e[1]);
	c = pt(20, 165);
	e = pt(20, 150);
	shape.quadraticCurveTo(c[0], c[1], e[0], e[1]);

	return shape;
}

// Hotspot positions in the same 3D space as the car body above. Front = +x.
const HOTSPOTS_3D = [
	{ category: 'headlights', label: 'Faros Delanteros', x: 1.85, y: 0.95, z: 0.68 },
	{ category: 'headlights', label: 'Faros Delanteros', x: 1.85, y: 0.95, z: -0.68 },
	{ category: 'fog-lights', label: 'Fog Lights', x: 1.95, y: 0.35, z: 0.55 },
	{ category: 'fog-lights', label: 'Fog Lights', x: 1.95, y: 0.35, z: -0.55 },
	{ category: 'drl', label: 'DRL / Diurnas', x: 1.78, y: 1.38, z: 0.62 },
	{ category: 'drl', label: 'DRL / Diurnas', x: 1.78, y: 1.38, z: -0.62 },
	{ category: 'turn-signals', label: 'Direccionales', x: 1.5, y: 0.55, z: 0.98 },
	{ category: 'turn-signals', label: 'Direccionales', x: 1.5, y: 0.55, z: -0.98 },
	{ category: 'tail-lights', label: 'Luces Traseras', x: -1.85, y: 0.95, z: 0.68 },
	{ category: 'tail-lights', label: 'Luces Traseras', x: -1.85, y: 0.95, z: -0.68 },
	{ category: 'reverse', label: 'Luz de Reversa', x: -1.95, y: 0.62, z: 0.25 },
	{ category: 'reverse', label: 'Luz de Reversa', x: -1.95, y: 0.62, z: -0.25 },
	{ category: 'license-plate', label: 'Luz de Placa', x: -2.02, y: 0.32, z: 0 },
	{ category: 'side-markers', label: 'Side Markers', x: 0.85, y: 0.55, z: 0.86 },
	{ category: 'side-markers', label: 'Side Markers', x: 0.85, y: 0.55, z: -0.86 },
	{ category: 'underglow', label: 'Underglow', x: 0, y: 0.06, z: 0.86 },
	{ category: 'underglow', label: 'Underglow', x: 0, y: 0.06, z: -0.86 },
	{ category: 'interior', label: 'Interior', x: -0.15, y: 1.45, z: 0 },
	{ category: 'light-bars', label: 'Barras LED', x: 0.3, y: 1.72, z: 0 },
	{ category: 'controllers', label: 'Switches y Controladores', x: 0.3, y: 1.0, z: 0.15 }
];

interface HotspotUserData {
	category: string;
	label: string;
	core: THREE.Mesh;
	halo: THREE.Mesh;
}

export function createVehicleScene(
	container: HTMLElement,
	{ onHotspotClick, onHotspotHover, onAutoRotateChange }: VehicleSceneOptions = {}
): VehicleSceneHandle {
	const scene = new THREE.Scene();

	const camera = new THREE.PerspectiveCamera(
		35,
		container.clientWidth / container.clientHeight,
		0.1,
		100
	);
	const target = new THREE.Vector3(0, 0.7, 0);
	positionCameraSpherical(camera, target, DEFAULT_RADIUS, Math.PI / 2, DEFAULT_PHI);

	const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.setSize(container.clientWidth, container.clientHeight);
	renderer.domElement.style.cssText =
		'position:absolute; inset:0; width:100%; height:100%; display:block; cursor:grab; touch-action:none;';
	container.appendChild(renderer.domElement);

	// ---- lighting ----
	scene.add(new THREE.HemisphereLight(0x3a4a80, 0x05060a, 1.1));
	const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
	keyLight.position.set(4, 6, 3);
	scene.add(keyLight);
	const rim = new THREE.PointLight(0x6f95ff, 0.8, 12);
	rim.position.set(-3, 2, -3);
	scene.add(rim);

	// ---- ground ----
	const ground = new THREE.Mesh(
		new THREE.CircleGeometry(3.4, 48),
		new THREE.MeshBasicMaterial({ color: COLORS.ground, transparent: true, opacity: 0.55 })
	);
	ground.rotation.x = -Math.PI / 2;
	ground.position.y = -0.001;
	scene.add(ground);
	const ring = new THREE.Mesh(
		new THREE.RingGeometry(2.55, 2.62, 64),
		new THREE.MeshBasicMaterial({
			color: COLORS.bodyEdge,
			transparent: true,
			opacity: 0.3,
			side: THREE.DoubleSide
		})
	);
	ring.rotation.x = -Math.PI / 2;
	scene.add(ring);

	// ---- car body ----
	const carGroup = new THREE.Group();
	scene.add(carGroup);

	const bodyGeo = new THREE.ExtrudeGeometry(buildBodyShape(), {
		depth: CAR_WIDTH,
		bevelEnabled: true,
		bevelThickness: 0.02,
		bevelSize: 0.02,
		bevelSegments: 1,
		steps: 1
	});
	bodyGeo.translate(0, 0, -CAR_WIDTH / 2);
	const bodyMesh = new THREE.Mesh(
		bodyGeo,
		new THREE.MeshStandardMaterial({ color: COLORS.body, metalness: 0.45, roughness: 0.4 })
	);
	carGroup.add(bodyMesh);
	carGroup.add(
		new THREE.LineSegments(
			new THREE.EdgesGeometry(bodyGeo, 20),
			new THREE.LineBasicMaterial({ color: COLORS.bodyEdge, transparent: true, opacity: 0.85 })
		)
	);

	// windshield hint (thin darker inset plane on the cabin flanks)
	[1, -1].forEach((side) => {
		const glass = new THREE.Mesh(
			new THREE.PlaneGeometry(1.5, 0.75),
			new THREE.MeshBasicMaterial({
				color: 0x0a0d14,
				transparent: true,
				opacity: 0.5,
				side: THREE.DoubleSide
			})
		);
		glass.position.set(-0.15, 1.05, side * (CAR_WIDTH / 2 + 0.005));
		glass.rotation.y = side > 0 ? 0 : Math.PI;
		carGroup.add(glass);
	});

	// ---- wheels ----
	const wheelRadius = 0.33;
	const wheelThickness = 0.26;
	const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelThickness, 20);
	const wheelEdgeGeo = new THREE.EdgesGeometry(wheelGeo, 15);
	function addWheel(x: number, zSide: number): void {
		const mesh = new THREE.Mesh(
			wheelGeo,
			new THREE.MeshStandardMaterial({ color: COLORS.wheel, metalness: 0.3, roughness: 0.7 })
		);
		mesh.rotation.x = Math.PI / 2;
		mesh.position.set(x, wheelRadius, zSide * (CAR_WIDTH / 2 - wheelThickness / 2 + 0.02));
		carGroup.add(mesh);
		const rimLines = new THREE.LineSegments(
			wheelEdgeGeo,
			new THREE.LineBasicMaterial({ color: COLORS.wheelEdge })
		);
		rimLines.rotation.copy(mesh.rotation);
		rimLines.position.copy(mesh.position);
		carGroup.add(rimLines);
	}
	addWheel(-1.21, 1);
	addWheel(-1.21, -1);
	addWheel(1.46, 1);
	addWheel(1.46, -1);

	// ---- hotspots ----
	const hotspotGroups: THREE.Group[] = [];
	HOTSPOTS_3D.forEach((h) => {
		const group = new THREE.Group();
		const core = new THREE.Mesh(
			new THREE.SphereGeometry(0.055, 12, 12),
			new THREE.MeshBasicMaterial({ color: COLORS.hotspot })
		);
		const halo = new THREE.Mesh(
			new THREE.SphereGeometry(0.09, 12, 12),
			new THREE.MeshBasicMaterial({
				color: COLORS.hotspot,
				transparent: true,
				opacity: 0.35,
				blending: THREE.AdditiveBlending,
				depthWrite: false
			})
		);
		group.add(core, halo);

		// Invisible larger sphere purely for raycasting, so a tap doesn't need
		// pixel-perfect precision on the small visible dot.
		const hitArea = new THREE.Mesh(
			new THREE.SphereGeometry(0.1, 8, 8),
			new THREE.MeshBasicMaterial({ visible: false })
		);
		group.add(hitArea);

		group.position.set(h.x, h.y, h.z);
		(group.userData as HotspotUserData) = { category: h.category, label: h.label, core, halo };
		scene.add(group);
		hotspotGroups.push(group);
	});

	// ---- controls ----
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.target.copy(target);
	controls.enableDamping = true;
	controls.dampingFactor = 0.08;
	controls.enablePan = false;
	controls.minDistance = 3.2;
	controls.maxDistance = 8;
	controls.minPolarAngle = 0.55;
	controls.maxPolarAngle = 1.5;
	controls.autoRotate = true;
	controls.autoRotateSpeed = 1.0;
	controls.addEventListener('start', () => {
		controls.autoRotate = false;
		onAutoRotateChange?.(false);
	});
	controls.update();

	// ---- raycasting: click vs. drag detection, hover tooltip ----
	const raycaster = new THREE.Raycaster();
	const pointerNDC = new THREE.Vector2();
	let downPos: { x: number; y: number } | null = null;

	function findHotspot(clientX: number, clientY: number): THREE.Object3D | null {
		const rect = renderer.domElement.getBoundingClientRect();
		pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
		pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
		raycaster.setFromCamera(pointerNDC, camera);
		const hits = raycaster.intersectObjects(hotspotGroups, true);
		if (!hits.length) return null;
		let obj: THREE.Object3D | null = hits[0].object;
		while (obj && !(obj.userData as HotspotUserData).category) obj = obj.parent;
		return obj;
	}

	renderer.domElement.addEventListener('pointerdown', (e) => {
		downPos = { x: e.clientX, y: e.clientY };
	});
	renderer.domElement.addEventListener('pointerup', (e) => {
		if (!downPos) return;
		const dx = e.clientX - downPos.x,
			dy = e.clientY - downPos.y;
		downPos = null;
		if (Math.hypot(dx, dy) > 6) return; // was a drag/orbit, not a tap
		const hit = findHotspot(e.clientX, e.clientY);
		if (hit) {
			const data = hit.userData as HotspotUserData;
			setActiveCategory(data.category);
			onHotspotClick?.(data.category, data.label);
		}
	});

	renderer.domElement.addEventListener('pointermove', (e) => {
		const hit = findHotspot(e.clientX, e.clientY);
		renderer.domElement.style.cursor = hit ? 'pointer' : downPos ? 'grabbing' : 'grab';
		if (hit) {
			const rect = container.getBoundingClientRect();
			const data = hit.userData as HotspotUserData;
			onHotspotHover?.(data.category, e.clientX - rect.left, e.clientY - rect.top);
		} else {
			onHotspotHover?.(null);
		}
	});
	renderer.domElement.addEventListener('pointerleave', () => onHotspotHover?.(null));

	function setActiveCategory(category: string | null): void {
		hotspotGroups.forEach((g) => {
			const data = g.userData as HotspotUserData;
			const isActive = data.category === category;
			(data.core.material as THREE.MeshBasicMaterial).color.setHex(
				isActive ? COLORS.hotspotActive : COLORS.hotspot
			);
			(data.halo.material as THREE.MeshBasicMaterial).color.setHex(
				isActive ? COLORS.hotspotActive : COLORS.hotspot
			);
		});
	}

	// ---- camera preset tweening ----
	function currentSpherical(): THREE.Spherical {
		return new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
	}

	function tweenTo(
		endTheta: number,
		endPhi = DEFAULT_PHI,
		endRadius = DEFAULT_RADIUS,
		duration = 650
	): void {
		controls.autoRotate = false;
		onAutoRotateChange?.(false);
		const start = currentSpherical();
		let delta = endTheta - start.theta;
		while (delta > Math.PI) delta -= Math.PI * 2;
		while (delta < -Math.PI) delta += Math.PI * 2;
		const targetTheta = start.theta + delta;
		const t0 = performance.now();
		function tick(now: number): void {
			const p = Math.min(1, (now - t0) / duration);
			const ease = 1 - Math.pow(1 - p, 3);
			const theta = start.theta + (targetTheta - start.theta) * ease;
			const phi = start.phi + (endPhi - start.phi) * ease;
			const radius = start.radius + (endRadius - start.radius) * ease;
			positionCameraSpherical(camera, controls.target, radius, theta, phi);
			if (p < 1) requestAnimationFrame(tick);
		}
		requestAnimationFrame(tick);
	}

	const VIEW_THETA: Record<VehicleView, number> = {
		front: Math.PI / 2,
		side: 0,
		rear: -Math.PI / 2
	};
	function goToView(view: VehicleView): void {
		tweenTo(VIEW_THETA[view] ?? Math.PI / 2);
	}

	function focusCategory(category: string): void {
		const match = hotspotGroups.find((g) => (g.userData as HotspotUserData).category === category);
		if (match) tweenTo(Math.atan2(match.position.x, match.position.z));
		setActiveCategory(category);
	}

	function toggleAutoRotate(): boolean {
		controls.autoRotate = !controls.autoRotate;
		return controls.autoRotate;
	}

	// ---- resize handling ----
	const resizeObserver = new ResizeObserver(() => {
		const w = container.clientWidth,
			h = container.clientHeight;
		if (w === 0 || h === 0) return;
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
		renderer.setSize(w, h);
	});
	resizeObserver.observe(container);

	// ---- animation loop ----
	let running = true;
	const clock = new THREE.Clock();
	function animate(): void {
		if (!running) return;
		requestAnimationFrame(animate);
		const t = clock.getElapsedTime();
		hotspotGroups.forEach((g) => {
			const data = g.userData as HotspotUserData;
			data.halo.scale.setScalar(1 + Math.sin(t * 3 + g.position.x * 2) * 0.18);
		});
		controls.update();
		renderer.render(scene, camera);
	}
	animate();

	return {
		goToView,
		focusCategory,
		setActiveCategory,
		toggleAutoRotate,
		get autoRotate() {
			return controls.autoRotate;
		},
		// Debug/testing helper: projects each hotspot's 3D position to CSS
		// pixel coordinates relative to the container, so click targets can be
		// verified precisely instead of guessed. Harmless to keep.
		getHotspotScreenPositions(): HotspotScreenPosition[] {
			const w = container.clientWidth,
				h = container.clientHeight;
			return hotspotGroups.map((g) => {
				const data = g.userData as HotspotUserData;
				const v = g.position.clone().project(camera);
				return {
					category: data.category,
					label: data.label,
					x: (v.x * 0.5 + 0.5) * w,
					y: (-v.y * 0.5 + 0.5) * h
				};
			});
		},
		destroy(): void {
			running = false;
			resizeObserver.disconnect();
			renderer.dispose();
			container.removeChild(renderer.domElement);
		}
	};
}

function positionCameraSpherical(
	camera: THREE.PerspectiveCamera,
	target: THREE.Vector3,
	radius: number,
	theta: number,
	phi: number
): void {
	const offset = new THREE.Vector3().setFromSphericalCoords(radius, phi, theta);
	camera.position.copy(target).add(offset);
	camera.lookAt(target);
}
