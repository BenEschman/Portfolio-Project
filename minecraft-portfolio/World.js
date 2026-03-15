import {BlockData} from './Block'
import * as THREE from 'three';

const FACES = [
    { dir: [1, 0, 0],  vertices: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]] }, // right
    { dir: [-1, 0, 0], vertices: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]] }, // left
    { dir: [0, 1, 0],  vertices: [[0,1,0],[0,1,1],[1,1,1],[1,1,0]] }, // top
    { dir: [0, -1, 0], vertices: [[0,0,1],[0,0,0],[1,0,0],[1,0,1]] }, // bottom
    { dir: [0, 0, 1],  vertices: [[1,0,1],[1,1,1],[0,1,1],[0,0,1]] }, // front
    { dir: [0, 0, -1], vertices: [[0,0,0],[0,1,0],[1,1,0],[1,0,0]] }, // back
];

const BlockRegistry = {
    0: { name: 'air',   color: null,      solid: false },
    1: { name: 'grass', color: 0x427014,  solid: true },
    2: { name: 'dirt',  color: 0x2e240d,  solid: true },
    3: { name: 'stone', color: 0x403e3a,  solid: true },
}
export class Chunk{

    blocks = [];


    constructor(cx, cz, scene){
        
        for(let x = 0; x < 10; x++){
            this.blocks[x] = [];
            for(let z = 0; z < 10; z++){
                this.blocks[x][z] = [];
                for(let y = 0; y < 50; y++){
                    this.blocks[x][z][y] = [];
                    if(y == 49){
                        this.blocks[x][z][y] = 0;
                    } else if (y > 45){
                        this.blocks[x][z][y] = 1;
                    } else if (y > 43){
                        let chance = Math.random();
                        chance > 0.75 ? this.blocks[x][z][y] = 1 : this.blocks[x][z][y] = 2;
                        
                    } else{
                        this.blocks[x][z][y] = 2;
                    }
                }
            }
        }
        
    }

    getBlock(x, y, z) {
        if(x < 0 || x >= 10 || z < 0 || z >= 10 || y < 0 || y >= 51) {
            return null;
        }
        return this.blocks[x][z][y];
    }
    
    setBlock(x, y, z, type) {
        if(x < 0 || x >= 10 || z < 0 || z >= 10 || y < 0 || y >= 51) {
            return;
        }
        this.blocks[x][z][y] = type;
    }


    buildMesh(scene, cx, cz) {
        const positions = [];
        const indices = [];
        const colors = [];
        let vertexCount = 0;
    
        for(let x = 0; x < 10; x++) {
            for(let z = 0; z < 10; z++) {
                for(let y = 0; y < 50; y++) {
                    const block = this.getBlock(x, y, z);
                    if(block == null || block === 0) continue; // skip air
    
                    for(const face of FACES) {
                        const [dx, dy, dz] = face.dir;
                        const neighbor = this.getBlock(x+dx, y+dy, z+dz);
    
                        if(neighbor != null && neighbor !== 0) continue; // skip hidden faces
    
                        // add 4 vertices for this face
                        const color = new THREE.Color(BlockRegistry[block].color) ?? new THREE.Color(0xff00ff);
                        for(const [vx, vy, vz] of face.vertices) {
                            positions.push(
                                x + cx * 10 + vx,
                                y + vy,
                                z + cz * 10 + vz
                            );
                            colors.push(color.r, color.g, color.b);
                        }
    
                        // add 2 triangles (6 indices) for this face
                        indices.push(
                            vertexCount, vertexCount + 1, vertexCount + 2,
                            vertexCount, vertexCount + 2, vertexCount + 3
                        );
                        vertexCount += 4;
                    }
                }
            }
        }
    
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));

        const material = new THREE.MeshLambertMaterial({ vertexColors: true });
        this.mesh = new THREE.Mesh(geometry, material);
        scene.add(this.mesh);
    }

}


export class World{

    chunks = []

    constructor(scene){
        for(let cx = 0; cx <= 20; cx++){
            this.chunks[cx] = [];
            for(let cz = 0; cz <= 20; cz++){
                this.chunks[cx][cz] = [];
                let chunk = new Chunk(cx, cz, scene);
                chunk.buildMesh(scene, cx, cz);
                this.chunks[cx][cz] = chunk;
            }
        }
    }



}
