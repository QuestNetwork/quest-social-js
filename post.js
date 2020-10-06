import { v4 as uuidv4 } from 'uuid';
import { NativeCrypto } from '@questnetwork/quest-crypto-js';


export class PostManager {
  constructor(){

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

  get(socialPubKey = "all"){
    if(socialPubKey == "NoProfileSelected"){
      throw('no pubkey selected');
    }

    if(socialPubKey == "all"){
      return this.bee.comb.search('social/timeline/').flat().sort(function(a,b) {
            return a.timestamp > b.timestamp ? -1 : 1;
          });;

    }
    else{
        return this.bee.comb.get('social/timeline/'+socialPubKey).sort(function(a,b) {
            return a.timestamp > b.timestamp ? -1 : 1;
          });
    }

  }
  search(searchPhrase){
    let timelines = this.get();
    let results = [];
    for(let t of timelines){
      if(t['content'].indexOf(searchPhrase) > -1){
        results.push(t);
      }
    }

    return results;
  }

}
