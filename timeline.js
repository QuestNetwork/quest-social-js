import { v4 as uuidv4 } from 'uuid';
import { NativeCrypto } from '@questnetwork/quest-crypto-js';
import { PostManager } from './post.js';
import { Subject } from 'rxjs';


export class TimelineManager {
  constructor(){
    this.post = new PostManager();

  }

  async start(config){

    this.version = config['version'];
    this.jsonSwarm = config['ipfs']['swarm'];
    this.electron = config['dependencies']['electronService'];
    this.bee = config['dependencies']['bee'];
    this.dolphin = config['dependencies']['dolphin'];
    this.crypto = new NativeCrypto();
    this.request = config['dependencies']['request'];
    this.post.start(config);
    return true;
  }


  get(socialPubKey = "all"){
    if(socialPubKey == "NoProfileSelected"){
      throw('no pubkey selected');
    }

    if(socialPubKey == "all"){
      let timeline = this.bee.comb.search('/social/timeline/').flat().sort(function(a,b) {
            return a.timestamp > b.timestamp ? -1 : 1;
          });

          let results = [];
          let cachedSigs = [];
          for(let t of timeline){
            if(typeof t['sig'] != 'undefined' && cachedSigs.indexOf(t['sig']) == -1 && typeof t['content'] != 'undefined' && t['content'].length > 0){
              results.push(t);
              cachedSigs.push(t['sig'])
            }
          }

      return results;

    }
    else{
        return this.bee.comb.get('/social/timeline/'+socialPubKey).sort(function(a,b) {
            return a.timestamp > b.timestamp ? -1 : 1;
          });
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
