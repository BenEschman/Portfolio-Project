import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import {World} from './World'
import {Player} from './Player'

//setup
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({canvas});
renderer.setSize(window.innerWidth, window.innerHeight);

//scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);


//camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

//mouse lock
const controls = new PointerLockControls(camera, document.body);
controls.pointerSpeed += 1

//create world
const world = new World(scene);

//add player
const p = new Player(0, 0);


//add blocks to scene
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);
const ambient = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambient);


//event Listener
const keys = {};
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);
document.addEventListener('click', () => controls.lock());


//animate
function animate(){
    requestAnimationFrame(animate);
    
    camera.position.set(p.position.x, p.position.y, p.position.z);

    //get direction vector
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    //get right vector
    const right = new THREE.Vector3();
    camera.getWorldDirection(right);

    const up = new THREE.Vector3(0, 1, 0);
    right.cross(up) // cross the up and direction vector to get right vector

    
    const speed = 0.1;
    if(keys['KeyW']) move(direction, speed, 1);
    if(keys['KeyS']) move(direction, speed, -1);
    if(keys['KeyA']) move(right, speed, -1);
    if(keys['KeyD']) move(right, speed, 1);
    if(keys['Space']) p.isOnGround ? p.jump = true: 0;
    if(keys['ControlLeft'] || keys['ControlRight']) p.position.y -= speed;

    p.checkGravity(world);

    renderer.render(scene, camera);
}

function move(vector, speed, sign){
    p.position.x += vector.x * speed * sign
    p.position.z += vector.z * speed * sign
}


animate();