import { v4 as uuidv4 } from 'uuid';
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
    return true;
  }


  new(postObj = { content: '', socialPubKey:'' }){
    postObj['id'] = uuidv4();
    postObj['timestamp'] = new Date().getTime();
    this.bee.comb.add('social/timeline/'+postObj['socialPubKey'],postObj);
  }

  delete(postObj, socialPubKey){
      this.bee.comb.removeFrom('social/timeline/'+socialPubKey,postObj);
      return true;
  }

}
