import * as THREE from 'three';

export class GameScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  private lights: THREE.Light[] = [];

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 10, 100);

    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.setupLighting();
    this.createGround();
    this.createEnvironment();

    window.addEventListener('resize', () => this.handleResize(container));
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    this.lights.push(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
    this.lights.push(directionalLight);

    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x5d4e37, 0.5);
    this.scene.add(hemisphereLight);
    this.lights.push(hemisphereLight);
  }

  private createGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a5f0b,
      roughness: 0.8,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const gridHelper = new THREE.GridHelper(200, 40, 0x888888, 0x444444);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);
  }

  private createEnvironment(): void {
    const treePositions = [
      { x: -15, z: -15 }, { x: -12, z: -18 }, { x: -18, z: -12 },
      { x: 15, z: -15 }, { x: 18, z: -18 }, { x: 12, z: -12 },
      { x: -15, z: 15 }, { x: -18, z: 12 }, { x: -12, z: 18 },
      { x: 15, z: 15 }, { x: 12, z: 18 }, { x: 18, z: 12 },
    ];

    treePositions.forEach(pos => {
      this.createTree(pos.x, pos.z);
    });

    for (let i = 0; i < 20; i++) {
      const x = (Math.random() - 0.5) * 80;
      const z = (Math.random() - 0.5) * 80;
      if (Math.abs(x) > 10 || Math.abs(z) > 10) {
        this.createRock(x, z);
      }
    }
  }

  private createTree(x: number, z: number): void {
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 1.5, z);
    trunk.castShadow = true;
    this.scene.add(trunk);

    const leavesGeometry = new THREE.ConeGeometry(2, 4, 8);
    const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5016 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(x, 4.5, z);
    leaves.castShadow = true;
    this.scene.add(leaves);
  }

  private createRock(x: number, z: number): void {
    const geometry = new THREE.DodecahedronGeometry(Math.random() * 0.5 + 0.3);
    const material = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.9,
    });
    const rock = new THREE.Mesh(geometry, material);
    rock.position.set(x, 0.3, z);
    rock.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    rock.castShadow = true;
    rock.receiveShadow = true;
    this.scene.add(rock);
  }

  createCharacterMesh(color: number, name: string): THREE.Group {
    const group = new THREE.Group();
    group.name = name;

    const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1, 8, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.2;
    head.castShadow = true;
    group.add(head);

    const nameSprite = this.createNameTag(name);
    nameSprite.position.y = 2.5;
    group.add(nameSprite);

    return group;
  }

  private createNameTag(name: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;

    context.fillStyle = 'rgba(0, 0, 0, 0.6)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.font = 'Bold 24px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(name, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2, 0.5, 1);

    return sprite;
  }

  createEnemyMesh(color: number, scale: number = 1): THREE.Group {
    const group = new THREE.Group();

    const bodyGeometry = new THREE.OctahedronGeometry(0.7 * scale);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.2,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const eyeGeometry = new THREE.SphereGeometry(0.1 * scale);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5,
    });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.3 * scale, 0.3 * scale, 0.5 * scale);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.3 * scale, 0.3 * scale, 0.5 * scale);
    group.add(rightEye);

    return group;
  }

  createProjectile(startPos: THREE.Vector3, endPos: THREE.Vector3, color: number): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.2);
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.5,
    });
    const projectile = new THREE.Mesh(geometry, material);
    projectile.position.copy(startPos);
    return projectile;
  }

  updateCamera(targetPosition: THREE.Vector3): void {
    const offset = new THREE.Vector3(0, 5, 10);
    const cameraTarget = targetPosition.clone().add(offset);
    this.camera.position.lerp(cameraTarget, 0.1);
    this.camera.lookAt(targetPosition.x, targetPosition.y + 1, targetPosition.z);
  }

  private handleResize(container: HTMLElement): void {
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.renderer.dispose();
    this.lights.forEach(light => this.scene.remove(light));
  }
}
