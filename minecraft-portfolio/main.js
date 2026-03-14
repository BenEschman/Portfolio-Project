import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

//setup
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({canvas});
renderer.setSize(window.innerWidth, window.innerHeight);

//scene
const scene = new THREE.Scene();


//camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

//mouse lock
const controls = new PointerLockControls(camera, document.body);

//cube
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

//event Listener
const keys = {};
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);
document.addEventListener('click', () => controls.lock());


//animate
function animate(){
    requestAnimationFrame(animate);

    //get direction vector
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    //get right vector
    const right = new THREE.Vector3();
    camera.getWorldDirection(right);

    const up = new THREE.Vector3(0, 1, 0);
    right.cross(up) // cross the up and direction vector to get right vector
    
    const speed = 0.1;
    if(keys['KeyW']) camera.position.addScaledVector(direction, speed);
    if(keys['KeyS']) camera.position.addScaledVector(direction, -speed);
    if(keys['KeyA']) camera.position.addScaledVector(right, -speed);
    if(keys['KeyD']) camera.position.addScaledVector(right, speed);
    if(keys['Space']) camera.position.y += speed;
    if(keys['ControlLeft'] || keys['ControlRight']) camera.position.y -= speed;

    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
}

animate();