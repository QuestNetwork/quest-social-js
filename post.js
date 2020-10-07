import { v4 as uuidv4 } from 'uuid';
import { Subject } from 'rxjs';

import { NativeCrypto } from '@questnetwork/quest-crypto-js';


export class PostManager {

  constructor() {
    this.key = {}
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
    postObj['timestamp'] = new Date().getTime();
    let mp = await this.profile.getMyProfile();
    let privKey = mp['key']['privKey'];
    postObj = await this.crypto.ec.sign(postObj,privKey);
    console.log('quest-social-js:','/social/timeline/'+postObj['socialPubKey'],postObj);
    this.bee.comb.add('/social/timeline/'+postObj['socialPubKey'],postObj);
    return postObj;
  }

  delete(postObj, socialPubKey){
      this.bee.comb.removeFrom('/social/timeline/'+socialPubKey,postObj);
      return true;
  }

}
