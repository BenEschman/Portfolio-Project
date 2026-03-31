import { worldGetBlock } from "./World";

export class Player {
    position = { x: 0, y: 55, z: 0 };
    velocity = { x: 0, y: 0, z: 0 };
    gravity = -0.015;
    isOnGround = false;
    jump = false;
    world = "BaseWorld";

    isSolid(x, y, z){
        const b = worldGetBlock(Math.floor(x), Math.floor(y), Math.floor(z));
        return b != null && b !== 0;
    }

    move(){
        // jumping
        if(this.jump && this.isOnGround){
            this.velocity.y = 0.3;
            this.isOnGround = false;
            this.jump = false;
        }

        // gravity
      // gravity
if(!this.isOnGround){
    this.velocity.y += this.gravity;
    if(this.velocity.y < -0.4) this.velocity.y = -0.4;
} else {
    this.velocity.y = 0; // this is the key line
}

        const buffer = 0.2;
        const worldLimit = 100;

        // move x
        this.position.x += this.velocity.x;
        this.position.x = Math.max(-worldLimit, Math.min(worldLimit, this.position.x));
        if(
            this.isSolid(this.position.x + buffer, this.position.y, this.position.z) ||
            this.isSolid(this.position.x - buffer, this.position.y, this.position.z) ||
            this.isSolid(this.position.x + buffer, this.position.y + 1, this.position.z) ||
            this.isSolid(this.position.x - buffer, this.position.y + 1, this.position.z)
        ){
            this.position.x -= this.velocity.x;
        }

        // move z
        this.position.z += this.velocity.z;
        this.position.z = Math.max(-worldLimit, Math.min(worldLimit, this.position.z));
        if(
            this.isSolid(this.position.x, this.position.y, this.position.z + buffer) ||
            this.isSolid(this.position.x, this.position.y, this.position.z - buffer) ||
            this.isSolid(this.position.x, this.position.y + 1, this.position.z + buffer) ||
            this.isSolid(this.position.x, this.position.y + 1, this.position.z - buffer)
        ){
            this.position.z -= this.velocity.z;
        }

        // move y
        this.position.y += this.velocity.y;
        
        // check ceiling
        if(
            this.isSolid(this.position.x, this.position.y + 2, this.position.z)
        ){
            this.position.y -= this.velocity.y;
            this.velocity.y = 0;
        }

        // check floor
const inBlock = this.isSolid(this.position.x, this.position.y, this.position.z);
const aboveBlock = this.isSolid(this.position.x, this.position.y - 0.001, this.position.z);

if(inBlock){
    this.position.y = Math.floor(this.position.y) + 1;
    this.velocity.y = 0;
    this.isOnGround = true;
} else if(aboveBlock && this.velocity.y <= 0){
    this.velocity.y = 0;
    this.isOnGround = true;
} else {
    this.isOnGround = false;
}
    }
}