
import { v4 as uuidv4 } from 'uuid';
import { Subject } from 'rxjs';

import { NativeCrypto } from '@questnetwork/quest-crypto-js';



export class AlgoManager {

    constructor() {
      this.key = {}
      this.selectSub = new Subject();
      this.selected;
    }


    select(profileId){
      this.selectSub.next(profileId);
      this.selected = profileId
    }

    onSelect(){
      return this.selectSub;
    }
    getSelected(){
      return this.selected;
    }


    async start(config){

      this.version = config['version'];
      this.jsonSwarm = config['ipfs']['swarm'];
      this.electron = config['dependencies']['electronService'];
      this.bee = config['dependencies']['bee'];
      this.dolphin = config['dependencies']['dolphin'];
      this.crypto = new NativeCrypto();
      this.request = config['dependencies']['request'];
      return true;
    }

  }
