let paused = false;
let gameReady = false;
let selectedBlockValue = 1;

export function getSelectedBlock(){
    return selectedBlockValue;
}

export function enablePause(){
    gameReady = true;
}

export function initHotbar(){
    const slots = document.querySelectorAll('.slot');

    function selectSlot(index){
        if(index < 0 || index >= slots.length) return;
        slots.forEach(s => s.classList.remove('selected'));
        slots[index].classList.add('selected');
        selectedBlockValue = parseInt(slots[index].dataset.type);
    }

    document.addEventListener('keydown', (e) => {
        if(e.code === 'Digit1') selectSlot(0);
        if(e.code === 'Digit2') selectSlot(1);
        if(e.code === 'Digit3') selectSlot(2);
        if(e.code === 'Digit4') selectSlot(3);
        if(e.code === 'Digit5') selectSlot(4);
    });
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