import * as THREE from 'three';
import { savePortal, loadPortals } from './store';

const portalMeshes = [];
let pendingPortalPos = { x: 0, y: 0, z: 0 };
let pendingFacing = 'z';

// portal placement UI
const portalUI = document.createElement('div');
portalUI.id = 'portal-ui';
portalUI.style.cssText = `
    display: none;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0,0,0,0.9);
    padding: 30px;
    border: 2px solid #888;
    flex-direction: column;
    gap: 12px;
    z-index: 200;
    min-width: 300px;
`;
portalUI.innerHTML = `
    <h3 style="color:white;font-family:sans-serif;">Place Portal</h3>
    <input id="portal-label" placeholder="Label..." style="padding:8px;background:rgba(255,255,255,0.1);color:white;border:2px solid #888;font-size:14px;font-family:sans-serif;">
    <input id="portal-url" placeholder="URL (or leave blank for world link)..." style="padding:8px;background:rgba(255,255,255,0.1);color:white;border:2px solid #888;font-size:14px;font-family:sans-serif;">
    <input id="portal-world" placeholder="To world (or leave blank for URL)..." style="padding:8px;background:rgba(255,255,255,0.1);color:white;border:2px solid #888;font-size:14px;font-family:sans-serif;">
    <input id="portal-color" type="color" value="#00ffff" style="padding:4px;background:rgba(255,255,255,0.1);border:2px solid #888;height:40px;cursor:pointer;">
    <div style="display:flex;gap:8px;">
        <button id="portal-save-btn" style="flex:1;padding:10px;background:rgba(255,255,255,0.1);color:white;border:2px solid #888;cursor:pointer;font-family:sans-serif;">Place</button>
        <button id="portal-cancel-btn" style="flex:1;padding:10px;background:rgba(255,255,255,0.1);color:white;border:2px solid #888;cursor:pointer;font-family:sans-serif;">Cancel</button>
    </div>
`;
portalUI.style.display = 'none';
document.body.appendChild(portalUI);

function hexToInt(hex){
    return parseInt(hex.replace('#', ''), 16);
}

export async function initPortals(scene, currentWorld){
    // load portals for this world
    const saved = await loadPortals(currentWorld);
    console.log('raw portal data:', saved);
    if(saved){
        for(const portal of saved){
            spawnPortal(scene, {
                position: { x: portal.x, y: portal.y, z: portal.z },
                label: portal.label,
                url: portal.url,
                toWorld: portal.to_world,
                color: portal.color,
                facing: portal.facing 
            });
        }
    }

    // placement button handlers
    document.getElementById('portal-save-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        const label = document.getElementById('portal-label').value.trim();
        const url = document.getElementById('portal-url').value.trim();
        const toWorld = document.getElementById('portal-world').value.trim();
        const color = hexToInt(document.getElementById('portal-color').value);

        if(label.length === 0) return;
        if(url.length === 0 && toWorld.length === 0) return;

        await savePortal(
            pendingPortalPos.x,
            pendingPortalPos.y,
            pendingPortalPos.z,
            url || null,
            label,
            color,
            currentWorld,
            toWorld || null,
            pendingFacing
        );
        
        spawnPortal(scene, {
            position: { ...pendingPortalPos },
            label,
            url: url || null,
            toWorld: toWorld || null,
            color,
            facing: pendingFacing
        });

        portalUI.style.display = 'none';
        document.getElementById('portal-label').value = '';
        document.getElementById('portal-url').value = '';
        document.getElementById('portal-world').value = '';
    });

    document.getElementById('portal-cancel-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        portalUI.style.display = 'none';
    });
}

function spawnPortal(scene, portal){
    const x = parseFloat(portal.position.x);
    const y = parseFloat(portal.position.y);
    const z = parseFloat(portal.position.z);
    const color = parseInt(portal.color) || 0x00ffff;
    const facing = portal.facing || 'z';

    if(isNaN(x) || isNaN(y) || isNaN(z)){
        console.error('invalid portal position:', portal);
        return;
    }
    const geometry = new THREE.PlaneGeometry(2, 3);
    const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(x + 1, y + 1.5, z);

    if(facing === 'x'){
        plane.rotation.y = Math.PI / 2;
    }

    scene.add(plane);

    const particleCount = 80;
    const positions = new Float32Array(particleCount * 3);
    for(let i = 0; i < particleCount; i++){
        if(facing === 'x'){
            positions[i * 3]     = x + 1 + (Math.random() - 0.5) * 0.5;
            positions[i * 3 + 1] = y + Math.random() * 3;
            positions[i * 3 + 2] = z  + (Math.random() - 0.5) * 2;
        } else {
            positions[i * 3]     = x + 1 + (Math.random() - 0.5) * 2;
            positions[i * 3 + 1] = y + Math.random() * 3;
            positions[i * 3 + 2] = z  + (Math.random() - 0.5) * 0.5;
        }
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
        color,
        size: 0.08,
        transparent: true,
        opacity: 0.8
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    const labelDiv = document.createElement('div');
    labelDiv.style.cssText = `
        position: fixed;
        color: white;
        font-family: sans-serif;
        font-size: 18px;
        font-weight: bold;
        background: rgba(0,0,0,0.6);
        padding: 4px 12px;
        border-radius: 4px;
        pointer-events: none;
        transform: translate(-50%, -50%);
        border: 2px solid #${color.toString(16).padStart(6, '0')};
        display: none;
    `;
    labelDiv.textContent = portal.label;
    document.body.appendChild(labelDiv);

    portalMeshes.push({
        portal,
        plane,
        particles,
        particlePositions: positions,
        labelDiv,
        triggered: false
    });
}

export function updatePortals(playerPos, camera, onWorldChange){
    for(const p of portalMeshes){
        const { portal, plane, particles, particlePositions, labelDiv } = p;
        const { x, y, z } = portal.position;

        // animate
        plane.material.opacity = 0.4 + Math.sin(Date.now() * 0.003) * 0.2;

        for(let i = 0; i < particlePositions.length / 3; i++){
            particlePositions[i * 3 + 1] += 0.02;
            if(particlePositions[i * 3 + 1] > y + 3){
                particlePositions[i * 3 + 1] = y;
            }
        }
        particles.geometry.attributes.position.needsUpdate = true;

        // proximity check
        const dx = playerPos.x - (x + 1);
        const dy = Math.abs(playerPos.y - y);
        const dz = playerPos.z - z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if(dist < 8){
            const pos = new THREE.Vector3(x + 1, y + 4, z);
            pos.project(camera);
            const sx = (pos.x * 0.5 + 0.5) * window.innerWidth;
            const sy = (-(pos.y * 0.5) + 0.5) * window.innerHeight;
            if(pos.z < 1){
                labelDiv.style.display = 'block';
                labelDiv.style.left = sx + 'px';
                labelDiv.style.top = sy + 'px';
            }
        } else {
            labelDiv.style.display = 'none';
        }

        // trigger
        if(dist < 1.5 && dy < 3 && !p.triggered){
            p.triggered = true;
            if(portal.url){
                window.open(portal.url, '_blank');
            } else if(portal.toWorld && onWorldChange){
                onWorldChange(portal.toWorld);
            }
            setTimeout(() => p.triggered = false, 3000);
        }
    }
}

export function openPortalPlacement(x, y, z, controls, camera){
    pendingPortalPos = { x, y, z };
    
    // determine facing based on camera direction
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    
    // whichever axis has more influence determines facing
    pendingFacing = Math.abs(direction.x) > Math.abs(direction.z) ? 'x' : 'z';
    
    portalUI.style.display = 'flex';
    controls.unlock();
    setTimeout(() => document.getElementById('portal-label').focus(), 50);
}