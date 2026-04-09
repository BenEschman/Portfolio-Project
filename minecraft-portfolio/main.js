import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { World, chunks, disposeWorld, resetWorld, worldSetBlock } from './World';
import { Player } from './Player';
import { sessionId, playerName, setPlayerName, loadPlayerName } from './GameState';
import { updatePresence } from './store';
import { initInput, keys } from './input';
import { initMultiplayer, updatePlayerTags, otherPlayers, disposeMultiplayer } from './multiplayer';
import { initSigns, openSignPlacement, disposeSigns } from './sign';
import { initHotbar, initPauseMenu, getSelectedBlock, enablePause, updateHotbarUI } from './ui';
import { getHotbarSlots, initInventory } from './inventory';
import { initPortals, updatePortals, openPortalPlacement, disposePortals } from './portal';

let worldLoading = false;

// renderer
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);


// scene
let scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
let raycaster = new THREE.Raycaster();

// camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// controls
const controls = new PointerLockControls(camera, document.body);
controls.pointerSpeed += 1;

// lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.3));

// player
const p = new Player(0, 0);

// UI
initHotbar(getHotbarSlots());
initPauseMenu(controls);
initInput(controls, breakBlock, placeBlock, resetWorld);

async function start(){
    const savedName = loadPlayerName();
    if(savedName){
        setPlayerName(savedName);
        document.getElementById('name-screen').style.display = 'none';
        await startGame();
    } else {
        const nameBtn = document.getElementById('name-btn');
        const nameInput = document.getElementById('name-input');

        const onSubmit = async (e) => {
            if(e) e.stopPropagation();
            const name = nameInput.value.trim();
            if(name.length === 0) return;
            setPlayerName(name);
            document.getElementById('name-screen').style.display = 'none';
            nameBtn.removeEventListener('click', onSubmit);
            await startGame();
        };

        nameBtn.addEventListener('click', onSubmit);
        nameInput.addEventListener('keydown', (e) => {
            if(e.code === 'Enter') onSubmit();
        });
    }
}


//intiate inventory

async function startGame(){
    const world = new World(scene);
    await world.init(p.world);
    await initPortals(scene, p.world);
    initMultiplayer(scene);
    enablePause();

// and update when inventory changes:
initInventory(controls, (newHotbar) => {
    updateHotbarUI(newHotbar);
});
    animate();
}

start();

const updateSigns = await initSigns(camera, controls);

function animate(){
    
    requestAnimationFrame(animate);
    if(worldLoading) return;

    raycaster.ray.origin.copy(camera.position);
    camera.getWorldDirection(raycaster.ray.direction);

    camera.position.set(p.position.x, p.position.y + 1.6, p.position.z);

    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    const right = new THREE.Vector3();
    camera.getWorldDirection(right);
    right.cross(new THREE.Vector3(0, 1, 0));
    updateSigns(p.position);

    let speed = keys['ShiftLeft'] ? 0.17 : 0.1;
    if(keys['KeyW']) move(direction, speed, 1);
    if(keys['KeyS']) move(direction, speed, -1);
    if(keys['KeyA']) move(right, speed, -1);
    if(keys['KeyD']) move(right, speed, 1);
    if(!keys['KeyW'] && !keys['KeyS'] && !keys['KeyA'] && !keys['KeyD']) move(direction, 0, 1);
    if(keys['Space']) p.isOnGround ? p.jump = true : 0;
    if(keys['ControlLeft'] || keys['ControlRight']) p.position.y -= speed;
    let lPressed = false;
    if(keys['KeyL'] && !lPressed){
        lPressed = true;
        const target = blockInView();
        if(target && document.getElementById('sign-ui').style.display === 'none'){
            openSignPlacement(target.bx, target.by + 1, target.bz, controls);
        }
    } else if(!keys['KeyL']){
        lPressed = false;
    }
    let pPressed = false;
    if(keys['KeyP'] && !pPressed){
        pPressed = true;
        const target = blockInView();
        if(target && document.getElementById('portal-ui').style.display === 'none'){
            openPortalPlacement(target.bx, target.by + 1, target.bz, controls, camera);
        }
    } else if(!keys['KeyP']){
        pPressed = false;
    }

    p.move();
    updatePresence(p.position.x, p.position.y, p.position.z, playerName, sessionId);
    updatePlayerTags(camera);

    updatePortals(p.position, camera, (newWorld) => {
        console.log('switching to world:', newWorld);
        p.world = newWorld;
        switchWorld(p.world);
    });

    renderer.render(scene, camera);
}

function move(vector, speed, sign){
    p.velocity.x = vector.x * speed * sign;
    p.velocity.z = vector.z * speed * sign;
}

function breakBlock(){
    const target = blockInView();
    if(target) worldSetBlock(target.bx, target.by, target.bz, 0, p.world);
}

function placeBlock(){
    const meshes = Array.from(chunks.values()).flatMap(c => c.meshes || []).filter(Boolean);
    const intersects = raycaster.intersectObjects(meshes);

    if(intersects.length > 0){
        const hit = intersects[0];
        const placePos = hit.point.clone().addScaledVector(hit.face.normal, 0.5);
        const bx = Math.floor(placePos.x);
        const by = Math.floor(placePos.y);
        const bz = Math.floor(placePos.z);

        const playerBx = Math.floor(p.position.x);
        const playerBy = Math.floor(p.position.y);
        const playerBz = Math.floor(p.position.z);

        if(bx === playerBx && bz === playerBz && (by === playerBy || by === playerBy + 1)) return;

        worldSetBlock(bx, by, bz, getSelectedBlock(), p.world);
    }
}

function blockInView(){
    const meshes = Array.from(chunks.values()).flatMap(c => c.meshes || []).filter(Boolean);
    const intersects = raycaster.intersectObjects(meshes);

    if(intersects.length > 0){
        const hit = intersects[0];
        const blockPos = hit.point.clone().addScaledVector(hit.face.normal, -0.5);
        return {
            bx: Math.floor(blockPos.x),
            by: Math.floor(blockPos.y),
            bz: Math.floor(blockPos.z)
        };
    }
    return null;
}
async function switchWorld(worldName){
    worldLoading = true;

    // dispose everything
    disposeWorld(scene);
    disposePortals(scene);
    disposeSigns();
    disposeMultiplayer();

    // reset player position
    p.position = { x: 0, y: 55, z: 0 };
    p.velocity = { x: 0, y: 0, z: 0 };

    // load new world
    const world = new World(scene);
    await world.init(worldName);
    await initPortals(scene, worldName);
    const updateSigns = await initSigns(camera, controls);

    worldLoading = false;
}
