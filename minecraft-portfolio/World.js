import {Tree} from './structures';
import * as THREE from 'three';
import './store';
import { sessionId } from './GameState';
import { supabase, saveBlock, loadBlocks, getSeed, saveSeed, clearBlocks, clearWorldSettings } from './store';
import { createNoise2D } from 'simplex-noise';

let seed = 1000;
const loader = new THREE.TextureLoader();
const noise2D = createNoise2D(() => seededRandom());

function loadTex(path){
    const t = loader.load(path);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    return t;
}

const TEXTURES = {
    grass_top:  loadTex('/textures/grass_block_top2.png'),
    grass_side: loadTex('/textures/grass_block_side2.png'),
    dirt:       loadTex('/textures/dirt2.png'),
    stone:      loadTex('/textures/stone2.png'),
    log_side:   loadTex('/textures/oak_log2.png'),
    log_top:    loadTex('/textures/oak_log_top.png'),
    leaves:     loadTex('/textures/oak_leaves2.png'),
    planks:     loadTex('/textures/oak_planks2.png'),
    quartz_pillar:     loadTex('/textures/quartz_pillar.png'),
    quartz_pillar_top:     loadTex('/textures/quarts_pillar_top.png'), 
    portal_frame:     loadTex('/textures/portal_frame.png'),
    glow_block:     loadTex('/textures/glow_block.png'), 
}


const FACES = [
    { dir: [1, 0, 0],  vertices: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]], face: 'side' },
    { dir: [-1, 0, 0], vertices: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]], face: 'side' },
    { dir: [0, 1, 0],  vertices: [[0,1,0],[0,1,1],[1,1,1],[1,1,0]], face: 'top' },
    { dir: [0, -1, 0], vertices: [[0,0,1],[0,0,0],[1,0,0],[1,0,1]], face: 'bottom' },
    { dir: [0, 0, 1],  vertices: [[1,0,1],[1,1,1],[0,1,1],[0,0,1]], face: 'side' },
    { dir: [0, 0, -1], vertices: [[0,0,0],[0,1,0],[1,1,0],[1,0,0]], face: 'side' },
];

export const BlockRegistry = {
    0: { name: 'air', solid: false, transparent: false, textures: null },
    1: { name: 'grass', solid: true, transparent: false, glow: 0x00ffff, textures: {
        top:    TEXTURES.grass_top,
        bottom: TEXTURES.dirt,
        side:   TEXTURES.grass_side,
    }},
    2: { name: 'dirt', solid: true, transparent: false, glow: 0xffffff, textures: {
        top:    TEXTURES.dirt,
        bottom: TEXTURES.dirt,
        side:   TEXTURES.dirt,
    }},
    3: { name: 'stone', solid: true, transparent: false, glow: 0xffffff, textures: {
        top:    TEXTURES.stone,
        bottom: TEXTURES.stone,
        side:   TEXTURES.stone,
    }},
    4: { name: 'log', solid: true, transparent: false, glow: 0xffffff, textures: {
        top:    TEXTURES.log_top,
        bottom: TEXTURES.log_top,
        side:   TEXTURES.log_side,
    }},
    5: { name: 'leaves', solid: true, transparent: true, glow: 0xffffff, textures: {
        top:    TEXTURES.leaves,
        bottom: TEXTURES.leaves,
        side:   TEXTURES.leaves,
    }},
    6: { name: 'plank', solid: true, transparent: false, glow: 0xffffff, textures: {
        top:    TEXTURES.planks,
        bottom: TEXTURES.planks,
        side:   TEXTURES.planks,
    }},
    7: { name: 'quartz pillar', solid: true, transparent: false, glow: 0xffffff, textures: {
        top:    TEXTURES.quartz_pillar_top,
        bottom: TEXTURES.quartz_pillar_top,
        side:   TEXTURES.quartz_pillar,
    }},
    8: { name: 'portal frame', solid: true, transparent: false, glow: 0x9b59ff, textures: {
        top:    TEXTURES.portal_frame,
        bottom: TEXTURES.portal_frame,
        side:   TEXTURES.portal_frame,
    }},
    9: { name: 'glow block', solid: true, transparent: false, glow: 0xffd700, textures: {
        top:    TEXTURES.glow_block,
        bottom: TEXTURES.glow_block,
        side:   TEXTURES.glow_block,
    }},
}


const chunks = new Map();

function chunkKey(x, y){

    return `${x}, ${y}`;

}

function getTerrainHeight(worldX, worldZ){
    const value = noise2D(worldX / 200, worldZ / 200);
    return Math.floor(40 + value * 10);
}
export class Chunk{

    chunkX;
    chunkZ;
    scene;


    blocks = [];


    constructor(cx, cz, scene){

        this.chunkX = cx;
        this.chunkZ = cz;
        this.scene = scene;
        for(let x = 0; x < 10; x++){
            this.blocks[x] = [];
            for(let z = 0; z < 10; z++){
                const height = getTerrainHeight(x + cx * 10, z + cz * 10);
                this.blocks[x][z] = [];
                for(let y = 0; y < height; y++){
                    this.blocks[x][z][y] = [];
                    if(y == height - 1){
                        this.blocks[x][z][y] = 1;
                    } else if (y > height - 4){
                        this.blocks[x][z][y] = 2;
                    } else if (y > height - 8){
                        let chance = Math.random();
                        chance > 0.75 ? this.blocks[x][z][y] = 2 : this.blocks[x][z][y] = 3;
                        
                    } else{
                        this.blocks[x][z][y] = 3;
                    }
                }
            }
        }
        
    }

    getBlock(x, y, z) {
        if(x < 0 || x >= 10 || z < 0 || z >= 10 || y < 0 || y >= 90) {
            return null;
        }
        return this.blocks[x][z][y];
    }
    
    setBlock(x, y, z, type) {
        if(x < 0 || x >= 10 || z < 0 || z >= 10 || y < 0 || y >= 90) {
            return;
        }
        this.blocks[x][z][y] = type;
    }


    buildMesh(cx, cz){
        // group faces by texture
        const groups = new Map();
    
        for(let x = 0; x < 10; x++){
            for(let z = 0; z < 10; z++){
                for(let y = 0; y < 90; y++){
                    const block = this.getBlock(x, y, z);
                    if(block == null || block === 0) continue;
    
                    const blockData = BlockRegistry[block];
    
                    for(const face of FACES){
                        const [dx, dy, dz] = face.dir;
                        const neighbor = this.getBlock(x+dx, y+dy, z+dz);
                        const neighborData = neighbor != null && neighbor !== 0 ? BlockRegistry[neighbor] : null;
                        if(neighborData && !neighborData.transparent) continue; // skip hidden faces
    
                        const texture = blockData.textures[face.face];
                        const key = texture.uuid; // unique id for each texture
    
                        if(!groups.has(key)){
                            groups.set(key, {
                                texture,
                                positions: [],
                                indices: [],
                                uvs: [],
                                vertexCount: 0,
                                color: blockData.glow
                            });
                        }
    
                        const g = groups.get(key);
    
                        for(const [vx, vy, vz] of face.vertices){
                            g.positions.push(
                                x + cx * 10 + vx,
                                y + vy,
                                z + cz * 10 + vz
                            );
                        }
    
                        // UV coordinates for a full texture on one face
                        g.uvs.push(
                            0, 0,
                            0, 1,
                            1, 1,
                            1, 0
                        );
    
                        g.indices.push(
                            g.vertexCount, g.vertexCount + 1, g.vertexCount + 2,
                            g.vertexCount, g.vertexCount + 2, g.vertexCount + 3
                        );
                        g.vertexCount += 4;
                    }
                }
            }
        }
    
        // build one mesh per texture group
        this.meshes = [];
        for(const [key, g] of groups){
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(g.positions), 3));
            geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.uvs), 2));
            geometry.setIndex(g.indices);
            geometry.computeVertexNormals();
    
            const material = new THREE.MeshLambertMaterial({
                map: g.texture,
                // transparent: g.texture === TEXTURES.leaves,
                alphaTest: g.texture === TEXTURES.leaves ? 0.9 : 0,
                // depthWrite: g.texture == TEXTURES.leaves ? false : true, 
                color: g.color
            });
    
            const mesh = new THREE.Mesh(geometry, material);
            this.scene.add(mesh);
            this.meshes.push(mesh);
        }
    }
    rebuildMesh(){
        if(this.meshes){
            for(const mesh of this.meshes){
                this.scene.remove(mesh);
                mesh.geometry.dispose();
                mesh.material.dispose();
            }
            this.meshes = [];
        }
        this.buildMesh(this.chunkX, this.chunkZ);
    }

}



export class World{

    buildTrees(){
        let trees = Math.round(seededRandom() * 700);
        let size = Math.sqrt(chunks.size) * 10;

        for(let i = 0; i < trees; i++){
            let x = Math.floor(seededRandom() * size) - size/2;
            let z = Math.floor(seededRandom() * size) - size/2;
        
            // skip if outside world bounds
            if(x < -140 || x > 140 || z < -140 || z > 140) continue;
        
            Tree.place(x, getTerrainHeight(x, z), z);
        }
    }

    constructor(scene){
        
        for(let cx = -15; cx <= 15; cx++){
            for(let cz = -15; cz <= 15; cz++){
                let chunk = new Chunk(cx, cz, scene);
                chunks.set(chunkKey(cx, cz), chunk);
                
            }
        }
        
    }
    async init(key){
        let worldSeed = await getSeed(key);
    
        if(!worldSeed){
            // first time — generate and save a seed
            worldSeed = Math.floor(Math.random() * 1000000);
            await saveSeed(worldSeed, key);
        }
        
        seed = worldSeed;
        this.buildTrees();
        const blocks = await loadBlocks(key);
        if(blocks){
            for(const b of blocks){
                worldSetBlockSilent(b.x, b.y, b.z, b.type);
            }
        }
        

        for(const c of Array.from(chunks.values())){
            c.buildMesh(c.chunkX, c.chunkZ);
        }
    }


}
export function worldSetBlockSilent(x, y, z, type, world){
    let cx = Math.floor(x / 10);
    let cz = Math.floor(z / 10);
    let lx = ((Math.floor(x) % 10) + 10) % 10;
    let lz = ((Math.floor(z) % 10) + 10) % 10;

    let chunk = chunks.get(chunkKey(cx, cz));
    if(!chunk){
        
        return;
    }


    chunk.setBlock(lx, Math.floor(y), lz, type);
}

export function worldGetBlock(x, y, z, world){
    let cx = Math.floor(x / 10);
    let cz = Math.floor(z / 10);

    let lx = ((Math.floor(x) % 10) + 10) % 10;
    let lz = ((Math.floor(z) % 10) + 10) % 10;

    let chunk = chunks.get(chunkKey(cx, cz));

    return chunk.getBlock(lx, Math.floor(y), lz);

}

export function worldSetBlock(x, y, z, type, world){
    let cx = Math.floor(x / 10);
    let cz = Math.floor(z / 10);

    let lx = ((Math.floor(x) % 10) + 10) % 10;
    let lz = ((Math.floor(z) % 10) + 10) % 10;

    let chunk = chunks.get(chunkKey(cx, cz));

    if(!chunk) return;

    chunk.setBlock(lx, Math.floor(y), lz, type);
    chunk.rebuildMesh();
    

    saveBlock(x, Math.floor(y), z, type, sessionId, world)

}

function seededRandom(){
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
}

export async function resetWorld(){
    await clearBlocks();
    await clearWorldSettings();
    window.location.reload(); // reload the page to regenerate
}
export function rebuildChunkAt(x, z){
    let cx = Math.floor(x / 10);
    let cz = Math.floor(z / 10);
    let chunk = chunks.get(chunkKey(cx, cz));
    if(chunk) chunk.rebuildMesh();
}

export {chunks}

export function disposeWorld(scene){
    for(const chunk of chunks.values()){
        if(chunk.meshes){
            for(const mesh of chunk.meshes){
                scene.remove(mesh);
                mesh.geometry.dispose();
                mesh.material.dispose();
            }
        }
    }
    chunks.clear();
}