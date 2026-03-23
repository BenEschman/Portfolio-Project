import { BlockRegistry } from './World';

let paused = false;
let gameReady = false;
let selectedIndex = 0;

export function isUIOpen(){
    const signUI = document.getElementById('sign-ui');
    const portalUI = document.getElementById('portal-ui');
    const inventory = document.getElementById('inventory');
    
    return (
        (signUI && signUI.style.display !== 'none') ||
        (portalUI && portalUI.style.display !== 'none') ||
        (inventory && inventory.style.display !== 'none')
    );
}

function safeLock(controls){
    setTimeout(() => {
        try {
            controls.lock();
        } catch(e) {
            // browser rejected, ignore
        }
    }, 200);
}

export function getSelectedBlock(){
    const slots = document.querySelectorAll('.slot');
    if(slots[selectedIndex]){
        return parseInt(slots[selectedIndex].dataset.type);
    }
    return 1;
}

export function enablePause(){
    gameReady = true;
}

function selectSlot(index){
    const slots = document.querySelectorAll('.slot');
    slots.forEach(s => s.classList.remove('selected'));
    if(slots[index]){
        slots[index].classList.add('selected');
        selectedIndex = index;
    }
}

export function initHotbar(initialSlots){
    const hotbar = document.getElementById('hotbar');
    hotbar.innerHTML = '';

    initialSlots.forEach((blockType, index) => {
        const slot = document.createElement('div');
        slot.className = index === 0 ? 'slot selected' : 'slot';
        slot.dataset.type = blockType;
        slot.dataset.index = index;
        updateHotbarSlot(slot, blockType);
        hotbar.appendChild(slot);
    });

    document.addEventListener('keydown', (e) => {
        for(let i = 0; i < initialSlots.length; i++){
            if(e.code === `Digit${i + 1}`) selectSlot(i);
        }
    });
}

export function updateHotbarUI(slots){
    const hotbarEls = document.querySelectorAll('.slot');
    slots.forEach((blockType, i) => {
        if(hotbarEls[i]){
            hotbarEls[i].dataset.type = blockType;
            updateHotbarSlot(hotbarEls[i], blockType);
        }
    });
}

function updateHotbarSlot(slot, blockType){
    slot.innerHTML = '';
    const block = BlockRegistry[blockType];
    if(!block || !block.textures) return;

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    canvas.style.cssText = 'width:40px;height:40px;image-rendering:pixelated;';
    
    const texture = block.textures.top;
    if(texture && texture.image && texture.image.complete){
        canvas.getContext('2d').drawImage(texture.image, 0, 0, 32, 32);
    } else if(texture){
        texture.addEventListener('update', () => {
            canvas.getContext('2d').drawImage(texture.image, 0, 0, 32, 32);
        });
    }
    
    slot.appendChild(canvas);
}

export function initPauseMenu(controls){
    const pauseMenu = document.getElementById('pause-menu');

    document.getElementById('resume-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        pauseMenu.classList.remove('visible');
        paused = false;
        
        // show click to continue message
        const clickMsg = document.createElement('div');
        clickMsg.id = 'click-to-continue';
        clickMsg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-family: sans-serif;
            font-size: 24px;
            background: rgba(0,0,0,0.6);
            padding: 20px 40px;
            border: 2px solid #888;
            z-index: 200;
            pointer-events: none;
        `;
        clickMsg.textContent = 'Click to continue';
        document.body.appendChild(clickMsg);
    
        // remove message and lock on next click
        const onClick = () => {
            try {
                controls.lock();
            } catch(err) {}
            clickMsg.remove();
            document.removeEventListener('click', onClick);
        };
    
        setTimeout(() => {
            document.addEventListener('click', onClick);
        }, 200);
    });

    document.getElementById('reset-btn').addEventListener('click', (e) => {
        e.stopPropagation();
    });

    document.addEventListener('click', (e) => {
        if(!paused && gameReady && !isUIOpen()){
            safeLock(controls);
        }
    });

    controls.addEventListener('unlock', () => {
        if(!gameReady) return;
        if(isUIOpen()) return;
        paused = true;
        pauseMenu.classList.add('visible');
    });

    controls.addEventListener('lock', () => {
        paused = false;
        pauseMenu.classList.remove('visible');
    });
}