import * as THREE from 'three';
export class Block{

    color;
    static geometry = new THREE.BoxGeometry(1, 1, 1);
    material; 
    type;
    cube;

    constructor(Color) {

        // const loader = new THREE.TextureLoader();
        // const topTexture = loader.load('/textures/grass_top.png');

        // const materials = [
        //     new THREE.MeshBasicMaterial({ map: rightTexture }),
        //     new THREE.MeshBasicMaterial({ map: leftTexture }),
        //     new THREE.MeshBasicMaterial({ map: topTexture }),
        //     new THREE.MeshBasicMaterial({ map: bottomTexture }),
        //     new THREE.MeshBasicMaterial({ map: frontTexture }),
        //     new THREE.MeshBasicMaterial({ map: backTexture }),
        // ];
        
        // const block = new THREE.Mesh(geometry, materials);
        this.color = Color;
        this.material = new THREE.MeshBasicMaterial({color: Color}); 
        this.cube = new THREE.Mesh(Block.geometry, this.material);
    }



}

export class BlockData{

    color;
    type;
    name;

    constructor(color, type, name){
        this.color = color;
        this.type = type;
        this.name = name;
    }

}

