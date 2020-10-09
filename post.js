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
    this.coral = config['dependencies']['coral'];

    this.crypto = new NativeCrypto();
    this.request = config['dependencies']['request'];
    this.profile = config['dependencies']['profile'];
    this.timeline = config['dependencies']['timeline'];

    return true;
  }


  async new(postObj = { content: '', socialPubKey:'' }){
    postObj['timestamp'] = new Date().getTime();
    let mp = await this.profile.getMyProfile();
    let privKey = mp['key']['privKey'];
    // await this.crypto.ec.digest("SHA-512", this.crypto.convert.stringToArrayBuffer(JSON.stringify(postObj)));
    postObj = await this.crypto.ec.sign(postObj,privKey);

    let hash = await this.coral.dag.add('/social/timeline/'+postObj['socialPubKey'],postObj);
    let timeline = await this.timeline.getReferenceTree(postObj['socialPubKey']);

    let p = await this.profile.get(postObj['socialPubKey']);
    this.profile.set(postObj['socialPubKey'],p);
    console.log(timeline);
    let unsafeSocialObj = { timeline: timeline, alias: p['alias'], fullName: p['fullName'], about: p['about'], private: p['private'], key: { pubKey: mp['key']['pubKey'], privKey: privKey }  };

    this.bee.comb.set("/social/sharedWith",[]);
    this.dolphin.clearSharedWith();

    await this.profile.share(unsafeSocialObj)

  }

  delete(qHash, socialPubKey){
    console.log('Quest Social JS: Removing Post...',qHash,socialPubKey)
      this.bee.comb.removeFrom('/social/timeline/'+socialPubKey,{qHash: qHash});
      return true;
  }

}
