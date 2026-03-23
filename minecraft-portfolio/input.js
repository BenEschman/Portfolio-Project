export const keys = {};

import { isUIOpen } from './ui';

window.addEventListener('blur', () => {
    Object.keys(keys).forEach(key => keys[key] = false);
});

export function initInput(controls, onBreak, onPlace, onReset){
    document.addEventListener('keydown', (e) => {
        if(isUIOpen()) return; // ignore all game input when UI is open
        keys[e.code] = true;
    });

    document.addEventListener('keyup', (e) => {
        keys[e.code] = false; // always track key up so keys don't get stuck
    });

    document.addEventListener('mousedown', (e) => {
        if(isUIOpen()) return;
        switch(e.button){
            case 0: onBreak(); break;
            case 1: onPlace(); break;
            case 2: onPlace(); break;
        }
    });

    document.addEventListener('keydown', (e) => {
        if(isUIOpen()) return;
        if(e.code === 'KeyR' && e.shiftKey) onReset();
    });

    document.addEventListener('contextmenu', (e) => e.preventDefault());
}