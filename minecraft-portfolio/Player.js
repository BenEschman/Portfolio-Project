export class Player {
    position;
    velocity;
    gravity = -0.01;
    isOnGround = false;
    jump = false;
    ticks = 0;

    constructor(x, y){
        this.position = { x: 100, y: 60, z: 100 };
        this.velocity = { x: 0, y: 0, z: 0 };
    }

    checkGravity(world){
        let cx = Math.floor(this.position.x / 10);
        let cz = Math.floor(this.position.z / 10);
        let bx = Math.floor(this.position.x % 10);
        let bz = Math.floor(this.position.z % 10);
        let b = world.chunks[cx][cz].blocks[bx][bz][Math.floor(this.position.y - 1)];
        if(this.jump && this.ticks < 16){
            this.velocity.y += 0.1;
            this.position.y += this.velocity.y;
            this.ticks++;
        } else{
            this.ticks = 0;
            this.jump = false;
        }
        if(b == null || b == 0 && !this.jump){
            this.velocity.y += this.gravity;
            this.position.y += this.velocity.y;
            this.isOnGround = false;
        } else {
            this.velocity.y = 0;
            this.isOnGround = true;
        }

    }
    

}