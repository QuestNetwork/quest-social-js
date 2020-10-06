import { v4 as uuidv4 } from 'uuid';
import { Subject } from 'rxjs';

import { NativeCrypto } from '@questnetwork/quest-crypto-js';


export class PostManager {

  constructor() {
    this.key = {}
    this.selectSub = new Subject();
    this.selected;
  }

  async start(config){

    this.version = config['version'];
    this.jsonSwarm = config['ipfs']['swarm'];
    this.electron = config['dependencies']['electronService'];
    this.bee = config['dependencies']['bee'];
    this.dolphin = config['dependencies']['dolphin'];
    this.crypto = new NativeCrypto();
    this.request = config['dependencies']['request'];
    this.profile = config['dependencies']['profile'];
    return true;
  }


  async new(postObj = { content: '', socialPubKey:'' }){
    postObj['id'] = uuidv4();
    postObj['timestamp'] = new Date().getTime();
    let mp = await this.profile.getMyProfile();
    let privKey = mp['key']['privKey'];
    postObj = await this.crypto.ec.sign(postObj,privKey);
    this.bee.comb.add('/social/timeline/'+postObj['socialPubKey'],postObj);
  }

  delete(postObj, socialPubKey){
      this.bee.comb.removeFrom('/social/timeline/'+socialPubKey,postObj);
      return true;
  }

}
