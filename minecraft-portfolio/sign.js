import * as THREE from 'three';
import { saveSign, loadSigns } from './store';

let signElements = [];
let placingSign = false;

// sign placement UI
const signUI = document.createElement('div');
signUI.id = 'sign-ui';
signUI.style.cssText = `
    display: none;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0,0,0,0.9);
    padding: 30px;
    border: 2px solid #888;
    display: flex;
    flex-direction: column;
    gap: 12px;
    z-index: 200;
    min-width: 300px;
`;
signUI.innerHTML = `
    <h3 style="color:white;font-family:sans-serif;">Place Sign</h3>
    <input id="sign-title" placeholder="Title..." maxlength="30" style="padding:8px;background:rgba(255,255,255,0.1);color:white;border:2px solid #888;font-size:14px;font-family:sans-serif;">
    <textarea id="sign-text" placeholder="Text..." maxlength="150" rows="3" style="padding:8px;background:rgba(255,255,255,0.1);color:white;border:2px solid #888;font-size:14px;font-family:sans-serif;resize:none;"></textarea>
    <div style="display:flex;gap:8px;">
        <button id="sign-save-btn" style="flex:1;padding:10px;background:rgba(255,255,255,0.1);color:white;border:2px solid #888;cursor:pointer;font-family:sans-serif;">Place</button>
        <button id="sign-cancel-btn" style="flex:1;padding:10px;background:rgba(255,255,255,0.1);color:white;border:2px solid #888;cursor:pointer;font-family:sans-serif;">Cancel</button>
    </div>
`;
signUI.style.display = 'none';
document.body.appendChild(signUI);

function createSignElement(sign){
    const el = document.createElement('div');
    el.className = 'sign';
    el.innerHTML = `<h3>${sign.title}</h3><p>${sign.text.replace(/\n/g, '<br>')}</p>`;
    el.style.display = 'none';
    document.body.appendChild(el);

    // handle both {position: {x,y,z}} and {x,y,z} formats
    const position = sign.position ?? { x: sign.x, y: sign.y, z: sign.z };

    return { position, title: sign.title, text: sign.text, el };
}

export async function initSigns(camera, controls){
    // load signs from database
    const savedSigns = await loadSigns();
    if(savedSigns){
        for(const sign of savedSigns){
            signElements.push(createSignElement(sign));
        }
    }

    // place sign button handlers
    document.getElementById('sign-save-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        const title = document.getElementById('sign-title').value.trim();
        const text = document.getElementById('sign-text').value.trim();
        if(title.length === 0) return;

        const sign = {
            position: { ...pendingSignPos },
            title,
            text
        };

        await saveSign(pendingSignPos.x, pendingSignPos.y, pendingSignPos.z, title, text);
        signElements.push(createSignElement(sign));

        signUI.style.display = 'none';
        placingSign = false;
        controls.lock();
    });

    document.getElementById('sign-cancel-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        signUI.style.display = 'none';
        placingSign = false;
        controls.lock();
    });

    return function updateSigns(playerPos){
        for(const sign of signElements){
            const dx = playerPos.x - sign.position.x;
            const dz = playerPos.z - sign.position.z;
            const dist = Math.sqrt(dx*dx + dz*dz);

            if(dist < 20){
                const pos = new THREE.Vector3(
                    sign.position.x,
                    sign.position.y + 1,
                    sign.position.z
                );
                pos.project(camera);

                const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
                const y = (-(pos.y * 0.5) + 0.5) * window.innerHeight;

                if(pos.z < 1){
                    sign.el.style.display = 'block';
                    sign.el.style.left = x + 'px';
                    sign.el.style.top = y + 'px';
                } else {
                    sign.el.style.display = 'none';
                }
            } else {
                sign.el.style.display = 'none';
            }
        }
    };
}

let pendingSignPos = { x: 0, y: 0, z: 0 };

export function openSignPlacement(x, y, z, controls){
    pendingSignPos = { x, y, z };
    document.getElementById('sign-title').value = '';
    document.getElementById('sign-text').value = '';
    signUI.style.display = 'flex';
    controls.unlock();
    setTimeout(() => document.getElementById('sign-title').focus(), 50);
}

export function disposeSigns(){
    for(const sign of signElements){
        sign.el.remove();
    }
    signElements.length = 0;
}