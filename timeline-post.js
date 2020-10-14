import { v4 as uuidv4 } from 'uuid';
import { Subject } from 'rxjs';

import { NativeCrypto } from '@questnetwork/quest-crypto-js';
import { UtilitiesInstance } from "@questnetwork/quest-utilities-js";


export class PostManager {

  constructor() {
    this.key = {}
    this.selectSub = new Subject();
    this.selected;
  }

  select(qHash){
    this.selectSub.next(qHash);
    this.selected = qHash;
    console.log('Quest Social Timeline Post: Selecting...',qHash)
  }

  onSelect(){
    return this.selectSub;
  }
  getSelected(){
    return this.selected;
  }


  async start(config){

    this.utilities = new UtilitiesInstance();
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

    let latestRef = await this.coral.dag.add('/social/timeline/'+postObj['socialPubKey'],postObj,{ storagePath: '/archive/social/timeline/transaction' });

    await this.propagate(latestRef, postObj);
  }

  async propagate(latestRef, postObj){
    let mp = await this.profile.getMyProfile();
    let privKey = mp['key']['privKey'];

    let p = await this.profile.get(postObj['socialPubKey']);
    this.profile.set(postObj['socialPubKey'],p);
    console.log(latestRef);
    let unsafeSocialObj = { timeline: latestRef, alias: p['alias'], fullName: p['fullName'], about: p['about'], private: p['private'], key: { pubKey: mp['key']['pubKey'], privKey: privKey }  };

    this.bee.comb.set("/social/sharedWith",[]);
    this.dolphin.clearSharedWith();

    await this.profile.share(unsafeSocialObj)
  }

  async delete(qHash, socialPubKey){




    let latestRef;
      console.log('Quest Social JS: Removing Post...',qHash,socialPubKey)
      let completeTimeline = await this.coral.dag.get('/social/timeline/'+socialPubKey, {limit:0});
      console.log(completeTimeline);

      completeTimeline =  completeTimeline.sort(function(a,b) {
            return a.timestamp < b.timestamp ? -1 : 1;
      });

      completeTimeline = this.utilities.removeFrom(completeTimeline,{qHash: qHash});
      let i = 0;
      let postObj;
      for(let p of completeTimeline){

        if(i == 0){
          latestRef = await this.coral.dag.set('/social/timeline/'+socialPubKey,p,{ storagePath: '/archive/social/timeline/transaction' });
          postObj = p;
        }
        else{
          latestRef = await this.coral.dag.add('/social/timeline/'+socialPubKey,p,{ storagePath: '/archive/social/timeline/transaction' });
          postObj = p
        }

        i++;
      }



      if(typeof latestRef != 'undefined'){

        try{
          ipfs.pin.rm(qHash);
        }catch(e){
          console.log(e);
        }


        await this.propagate(latestRef, postObj);
      }
      else{
        throw('delete failed')
      }

    }

}
