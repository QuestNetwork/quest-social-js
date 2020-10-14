import { v4 as uuidv4 } from 'uuid';
import { NativeCrypto } from '@questnetwork/quest-crypto-js';
import { PostManager } from './timeline-post.js';
import { Subject } from 'rxjs';
import { TimelineAgent } from './timeline-agent.js';


export class TimelineManager {
  constructor(){
    this.post = new PostManager();
    this.agent = new TimelineAgent();

  }

  async start(config){

    this.version = config['version'];
    this.jsonSwarm = config['ipfs']['swarm'];
    this.electron = config['dependencies']['electronService'];
    this.bee = config['dependencies']['bee'];
    this.coral = config['dependencies']['coral'];

    this.dolphin = config['dependencies']['dolphin'];
    this.crypto = new NativeCrypto();
    this.request = config['dependencies']['request'];
    config['dependencies']['timeline'] = this;
    this.post.start(config);
    this.agent.start(config);

    return true;
  }

  getReferenceTree(socialPubKey = "all"){
    if(socialPubKey == "NoProfileSelected"){
      throw('no pubkey selected');
    }

    if(socialPubKey == "all"){
      return this.bee.comb.search('/social/timeline/').flat();
    }
    else{
      return this.bee.comb.get('/social/timeline/'+socialPubKey);
    }

  }

  getLatestRef(socialPubKey = "all"){
        return this.bee.comb.get('/social/timeline/'+socialPubKey);
  }

  async get(socialPubKey = "all", config = { limit: 5, cacheRef:true,  storagePath: '/archive/social/timeline/transaction'}){



    if(socialPubKey == "NoProfileSelected"){
      throw('no pubkey selected');
    }

    if(socialPubKey == "all"){
      // let cachedHashes = [];

      let timelines = this.bee.comb.search('/social/timeline/').flat();

      for(let i = 0;i<timelines.length; i++){
        // console.log('getting timeline...',timelines[i]);
          timelines[i] = await this.coral.dag.get(timelines[i]['qHash'], { storagePath: '/archive/social/timeline/transaction', cacheRef:true, limit: config['limit'], whistle: timelines[i]['whistle'] })
          // console.log(  timelines[i]);
          // console.log(timelines[i])
            // cachedHashes.push(timelines[i]['qHash'])
      }
      let re =  timelines.flat().sort(function(a,b) {
            return a.timestamp > b.timestamp ? -1 : 1;
      });

      let results = [];
      let pushed = [];

      for(let p of re){
        if(typeof p['content'] != 'undefined' && p['content'].length > 0 && pushed.indexOf(p['qHash']) === -1){
          results.push(p);
          pushed.push(p['qHash']);
        }
      }

      return results;
    }
    else{
      let timeline = await this.coral.dag.get('/social/timeline/'+socialPubKey, config);
      timeline.sort(function(a,b) {
            return a.timestamp > b.timestamp ? -1 : 1;
      });
      console.log(timeline);
      return timeline;
    }

  }


// usage example:
  search(searchPhrase){
    let timelines = this.get();
    let results = [];
    let cachedSigs = [];
    for(let t of timelines){
      if(cachedSigs.indexOf(t['sig']) == -1 && t['content'].indexOf(searchPhrase) > -1){
        results.push(t);
        cachedSigs.push(t['sig'])
      }
    }

    return results;
  }

}
