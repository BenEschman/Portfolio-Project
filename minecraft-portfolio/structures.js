import {worldSetBlockSilent} from "./World";
export class Tree{


    static place(x, y, z){
        //leaves
        let size = 3;
        let start = -2;
        for(let h = 0; h < 3; h++){
            for(let i = start; i < size; i++){
                for(let j = start; j < size; j++){
                    worldSetBlockSilent(x + i, y + 4 + h, z + j, 5);
                }
            }
            size--;
            start++;
        }
        //trunk
        for(let h = 0; h < 6; h++){
            worldSetBlockSilent(x, y + h, z, 4);
        }
    }



}