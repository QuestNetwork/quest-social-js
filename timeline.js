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

  async get(socialPubKey = "all", config = { limit: 5,  storagePath: '/archive/social/timeline/transaction'}){
    if(socialPubKey == "NoProfileSelected"){
      throw('no pubkey selected');
    }

    if(socialPubKey == "all"){
      // let cachedHashes = [];

      let timelines = this.bee.comb.search('/social/timeline/').flat();
      for(let i = 0;i<timelines.length; i++){
        console.log('getting timeline...',timelines[i]);
          timelines[i] = await this.coral.dag.get(timelines[i]['qHash'], { storagePath: '/archive/social/timeline/transaction', limit: config['limit'], whistle: timelines[i]['whistle'] })
          console.log(timelines[i])
          timelines[i] =   timelines[i].sort(function(a,b) {
              return a.timestamp > b.timestamp ? -1 : 1;
            });
            // cachedHashes.push(timelines[i]['qHash'])
      }
      console.log(timelines)
      return timelines;
    }
    else{
      let timeline = await this.coral.dag.get('/social/timeline/'+socialPubKey, { storagePath: '/archive/social/timeline/transaction', limit: config['limit'] })
      timeline.sort(function(a,b) {
            return a.timestamp > b.timestamp ? -1 : 1;
      });
      console.log(timeline);
      return timeline;
    }

  }
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
