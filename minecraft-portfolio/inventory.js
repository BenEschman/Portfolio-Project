import { BlockRegistry } from './World';

let inventoryOpen = false;
let draggedBlock = null;
let hotbarSlots = [1, 2, 3, 4, 5]; // default hotbar block types
let onHotbarUpdate = null;


export function initInventory(controls, onUpdate){
    onHotbarUpdate = onUpdate;
    createInventoryUI();
    createDragGhost();

    document.addEventListener('keydown', (e) => {
        if(e.code === 'KeyE' && document.getElementById('sign-ui').style.display === 'none'){
            toggleInventory(controls);
        }
    });
}

function getTextureCanvas(block){
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    const texture = block.textures?.top;
    
    if(texture && texture.image && texture.image.complete){
        ctx.drawImage(texture.image, 0, 0, 32, 32);
    } else if(texture){
        texture.addEventListener('update', () => {
            ctx.clearRect(0, 0, 32, 32);
            ctx.drawImage(texture.image, 0, 0, 32, 32);
        });
    }
    
    return canvas;
}

function toggleInventory(controls){
    inventoryOpen = !inventoryOpen;
    const inv = document.getElementById('inventory');
    if(inventoryOpen){
        inv.style.display = 'flex';
        controls.unlock();
    } else {
        inv.style.display = 'none';
        controls.lock();
    }
}

export function closeInventory(controls){
    inventoryOpen = false;
    document.getElementById('inventory').style.display = 'none';
}

function createDragGhost(){
    const ghost = document.createElement('div');
    ghost.id = 'drag-ghost';
    ghost.style.cssText = `
        position: fixed;
        pointer-events: none;
        width: 50px;
        height: 50px;
        background: rgba(255,255,255,0.3);
        border: 2px solid white;
        display: none;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        z-index: 1000;
        transform: translate(-50%, -50%);
    `;
    document.body.appendChild(ghost);

    document.addEventListener('mousemove', (e) => {
        if(draggedBlock !== null){
            ghost.style.left = e.clientX + 'px';
            ghost.style.top = e.clientY + 'px';
        }
    });
}

function createInventoryUI(){
    const inv = document.createElement('div');
    inv.id = 'inventory';
    inv.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 20px;
        z-index: 150;
    `;

    // inventory grid
    const grid = document.createElement('div');
    grid.id = 'inventory-grid';
    grid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(8, 60px);
        gap: 6px;
        background: rgba(0,0,0,0.8);
        padding: 20px;
        border: 2px solid #888;
    `;

    // add all blocks except air
    Object.entries(BlockRegistry).forEach(([id, block]) => {
        if(parseInt(id) === 0) return;
        const slot = createBlockSlot(parseInt(id), block);
        grid.appendChild(slot);
    });

    // hotbar in inventory
    const hotbarLabel = document.createElement('p');
    hotbarLabel.textContent = 'Hotbar';
    hotbarLabel.style.cssText = 'color: white; font-family: sans-serif; font-size: 14px;';

    const hotbar = document.createElement('div');
    hotbar.id = 'inv-hotbar';
    hotbar.style.cssText = `
        display: flex;
        gap: 6px;
        background: rgba(0,0,0,0.8);
        padding: 20px;
        border: 2px solid #888;
    `;

    hotbarSlots.forEach((blockType, index) => {
        const slot = createHotbarSlot(index, blockType);
        hotbar.appendChild(slot);
    });

    inv.appendChild(grid);
    inv.appendChild(hotbarLabel);
    inv.appendChild(hotbar);
    document.body.appendChild(inv);
}

function createBlockSlot(id, block){
    const slot = document.createElement('div');
    slot.style.cssText = `
        width: 60px;
        height: 60px;
        background: rgba(255,255,255,0.1);
        border: 2px solid #666;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: grab;
        color: white;
        font-family: sans-serif;
        font-size: 10px;
        gap: 2px;
    `;

    const textureCanvas = getTextureCanvas(block);
    textureCanvas.style.cssText = `
        width: 32px;
        height: 32px;
        image-rendering: pixelated;
    `;
    slot.appendChild(textureCanvas);

    const label = document.createElement('span');
    label.textContent = block.name;

    slot.appendChild(label);

    // drag start
    slot.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        draggedBlock = id;
        const ghost = document.getElementById('drag-ghost');
        ghost.style.display = 'flex';
        ghost.style.background = `#${block.color ? block.color.toString(16).padStart(6, '0') : '333'}`;
    });

    document.addEventListener('mouseup', () => {
        draggedBlock = null;
        document.getElementById('drag-ghost').style.display = 'none';
    });

    return slot;
}

function createHotbarSlot(index, blockType){
    const slot = document.createElement('div');
    slot.id = `inv-hotbar-${index}`;
    slot.style.cssText = `
        width: 60px;
        height: 60px;
        background: rgba(255,255,255,0.1);
        border: 2px solid #888;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        font-family: sans-serif;
        font-size: 10px;
        gap: 2px;
    `;

    updateHotbarSlotDisplay(slot, blockType);

    // drop target
    slot.addEventListener('mouseup', (e) => {
        e.stopPropagation();
        if(draggedBlock !== null){
            hotbarSlots[index] = draggedBlock;
            updateHotbarSlotDisplay(slot, draggedBlock);
            draggedBlock = null;
            document.getElementById('drag-ghost').style.display = 'none';
            if(onHotbarUpdate) onHotbarUpdate(hotbarSlots);
        }
    });

    return slot;
}

function updateHotbarSlotDisplay(slot, blockType){
    slot.innerHTML = '';
    const block = BlockRegistry[blockType];
    if(!block) return;

    const textureCanvas = getTextureCanvas(block);
    textureCanvas.style.cssText = `
        width: 32px;
        height: 32px;
        image-rendering: pixelated;
    `;

    const label = document.createElement('span');
    label.textContent = block.name;

    slot.appendChild(textureCanvas);
    slot.appendChild(label);
}

export function getHotbarSlots(){
    return hotbarSlots;
}