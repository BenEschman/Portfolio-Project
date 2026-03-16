export const sessionId = Math.random().toString(36).slice(2);
export let playerName = 'Player';

export function setPlayerName(name){
    playerName = name;
    localStorage.setItem('playerName', name);
}

export function loadPlayerName(){
    return localStorage.getItem('playerName');
}