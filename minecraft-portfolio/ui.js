import { BlockRegistry } from './World';
let paused = false;
let gameReady = false;
let selectedBlockValue = 1;

let selectedIndex = 0;

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
        controls.lock();
    });

    document.getElementById('reset-btn').addEventListener('click', (e) => {
        e.stopPropagation();
    });

    document.addEventListener('click', () => {
        if(!paused && gameReady) controls.lock();
    });

    controls.addEventListener('unlock', () => {
        if(!gameReady) return;
        paused = true;
        pauseMenu.classList.add('visible');
    });

    controls.addEventListener('lock', () => {
        paused = false;
        pauseMenu.classList.remove('visible');
    });
}