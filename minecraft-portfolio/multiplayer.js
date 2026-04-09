import * as THREE from 'three';
import { PlayerModel } from './PlayerModel';
import { initPresence, updatePresence, subscribeToBlocks } from './store';
import { sessionId, playerName } from './GameState';
import { worldSetBlockSilent, rebuildChunkAt } from './World';

export const otherPlayers = new Map();

export function initMultiplayer(scene){
    // subscribe to block changes
    subscribeToBlocks((block) => {
        if(block.session_id === sessionId) return;
        worldSetBlockSilent(block.x, block.y, block.z, block.type);
        rebuildChunkAt(block.x, block.z);
    });

    // presence and name tags
    initPresence(sessionId, playerName, (state) => {
        for(const [id, player] of otherPlayers){
            if(!state[id]){
                document.body.removeChild(player.label);
                player.model.dispose();
                otherPlayers.delete(id);
            }
        }

        for(const [id, presences] of Object.entries(state)){
            const presence = presences[0];
            if(presence.session_id === sessionId) continue;

            if(!otherPlayers.has(id)){
                const label = document.createElement('div');
                label.style.cssText = `
                    position: fixed;
                    color: white;
                    font-family: sans-serif;
                    font-size: 20px;
                    font-weight: bold;
                    background: rgba(0,0,0,0.6);
                    padding: 4px 10px;
                    border-radius: 4px;
                    pointer-events: none;
                    transform: translate(-50%, -50%);
                    z-index: 50;
                `;
                label.textContent = presence.name;
                document.body.appendChild(label);

                const model = new PlayerModel(scene);

                otherPlayers.set(id, {
                    label,
                    model,
                    position: new THREE.Vector3(),
                    prevPosition: new THREE.Vector3()
                });
            }

            const player = otherPlayers.get(id);
            player.position.set(presence.x, presence.y, presence.z);
            player.label.textContent = presence.name;
        }
    });
}

export function updatePlayerTags(camera){
    for(const [id, player] of otherPlayers){
        const pos = player.position;
        const isMoving = pos.distanceTo(player.prevPosition) > 0.01;
        const dx = pos.x - player.prevPosition.x;
        const dz = pos.z - player.prevPosition.z;

        player.model.update(pos.x, pos.y, pos.z, isMoving);
        player.model.faceDirection(dx, dz);
        player.prevPosition.copy(pos);

        const tagPos = pos.clone();
        tagPos.y += 2.5;
        tagPos.project(camera);

        const x = (tagPos.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(tagPos.y * 0.5) + 0.5) * window.innerHeight;

        if(tagPos.z > 1){
            player.label.style.display = 'none';
        } else {
            player.label.style.display = 'block';
            player.label.style.left = x + 'px';
            player.label.style.top = y + 'px';
        }
    }
}

export function disposeMultiplayer(){
    for(const [id, player] of otherPlayers){
        player.label.remove();
        player.model.dispose();
    }
    otherPlayers.clear();
}