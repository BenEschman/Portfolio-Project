import * as THREE from 'three';

export class PlayerModel {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.walkTime = 0;

        const skinMaterial = new THREE.MeshLambertMaterial({ color: 0x4a90d9 });
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x2255aa });
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x1a3a7a });

        // head
        this.head = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 0.5),
            skinMaterial
        );
        this.head.position.y = 1.75;

        // body
        this.body = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.75, 0.25),
            bodyMaterial
        );
        this.body.position.y = 1.125;

        // left arm
        this.leftArm = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.75, 0.25),
            skinMaterial
        );
        this.leftArm.position.set(-0.375, 1.125, 0);

        // right arm
        this.rightArm = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.75, 0.25),
            skinMaterial
        );
        this.rightArm.position.set(0.375, 1.125, 0);

        // left leg
        this.leftLeg = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.75, 0.25),
            legMaterial
        );
        this.leftLeg.position.set(-0.125, 0.375, 0);

        // right leg
        this.rightLeg = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.75, 0.25),
            legMaterial
        );
        this.rightLeg.position.set(0.125, 0.375, 0);

        this.group.add(this.head);
        this.group.add(this.body);
        this.group.add(this.leftArm);
        this.group.add(this.rightArm);
        this.group.add(this.leftLeg);
        this.group.add(this.rightLeg);

        scene.add(this.group);
    }

    update(x, y, z, isMoving){
        this.group.position.set(x, y, z);

        if(isMoving){
            this.walkTime += 0.15;
        } else {
            // smoothly reset limbs to neutral
            this.walkTime *= 0.85;
        }

        const swing = Math.sin(this.walkTime) * 0.4;

        // arms swing opposite to legs
        this.leftArm.rotation.x = swing;
        this.rightArm.rotation.x = -swing;
        this.leftLeg.rotation.x = -swing;
        this.rightLeg.rotation.x = swing;

        // slight head bob
        this.head.position.y = 1.75 + Math.abs(Math.sin(this.walkTime)) * 0.03;
    }

    // rotate model to face direction of movement
    faceDirection(dx, dz){
        if(dx !== 0 || dz !== 0){
            this.group.rotation.y = Math.atan2(dx, dz);
        }
    }

    dispose(){
        this.scene.remove(this.group);
    }
}