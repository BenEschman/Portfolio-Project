export const keys = {};

export function initInput(controls, onBreak, onPlace, onReset){
    document.addEventListener('keydown', (e) => keys[e.code] = true);
    document.addEventListener('keyup', (e) => keys[e.code] = false);
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    document.addEventListener('mousedown', (e) => {
        switch(e.button){
            case 0: onBreak(); break;
            case 1: onPlace(); break;
            case 2: onPlace(); break;
        }
    });

    document.addEventListener('keydown', (e) => {
        if(e.code === 'KeyR' && e.shiftKey) onReset();
    });
}