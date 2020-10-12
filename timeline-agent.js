import { v4 as uuidv4 } from 'uuid';
import { Subject } from 'rxjs';

import { NativeCrypto } from '@questnetwork/quest-crypto-js';
import { UtilitiesInstance } from "@questnetwork/quest-utilities-js";


export class TimelineAgent {

  constructor() {
    this.key = {}
    this.utilities = new UtilitiesInstance();

    this.limitDefault =
       this.groupedTimelines = {};
         this.replyTree = {};
      this.replyIterator = 0;
      this.updateSub = {};
      this.timelines = {};
      this.limit = {}
      this.limitDefault = 5;
  }

  getReplyCount(qHash){
    let keys = Object.keys(this.timelines);
    let count = 0;
    let replyHashes = [];
    for(let key of keys){
      let t = this.timelines[key];
      for(let p of t){
        if(typeof p['qHash'] != 'undefined' && !this.utilities.inArray(replyHashes,p['qHash']) && typeof p['replyTo'] != 'undefined' &&  p['replyTo'] == qHash){
          replyHashes.push(p['qHash']);
          count++;
        }
      }
    }


    return count;
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


  onSync(pubKey){
    if(typeof this.updateSub[pubKey] == 'undefined'){
      console.log('creating new syncSub for',pubKey);
      this.updateSub[pubKey] = new Subject();
    }
    return this.updateSub[pubKey];
  }

  reload(pubKey = "all"){
    if(pubKey == "all"){
      let keys = Object.keys(this.updateSub);
      for(let key of keys){
        try{
          this.sync(key);
        }catch(e){console.log(e)}
      }
    }
  }

  getLimit(pubKey){
    if(typeof this.limit[pubKey] == 'undefined'){
    return this.limitDefault
    }
    return this.limit[pubKey];
  }


  async sync(pubKey = "all", config = { limit: 5,  storagePath: '/archive/social/timeline/transaction' }){

    console.log('Quest Social Timeline Agent: Syncing...',pubKey);

        if(pubKey == 'NoProfileSelected'){
          throw('no pubkey selected');
        }

        this.timelines[pubKey] = [];


        this.limit[pubKey] = config['limit'];

        this.replyTree[pubKey] = {};


        if(pubKey == "all"){
          this.timelines[pubKey] = await this.timeline.get('all', config);
        }
        else{
          this.timelines[pubKey] = await this.timeline.get(pubKey, config);
        }


        if(this.timelines[pubKey].length > 0){
          for(let p of this.timelines[pubKey]){
            await this.resolveReplyTreeRec(p, p['qHash'], pubKey);
          }
        }





          //
          // this.timeline = this.timeline.filter(e => typeof e['content'] != 'undefined')
          // this.timeline = this.timeline.filter(e => typeof e['repyTo'] == 'undefined')
          //

          await this.groupTimeline(pubKey);


          let res = { id: uuidv4(), groupedTimeline: this.groupedTimelines[pubKey], replyTree: this.replyTree[pubKey], timeline: this.timelines[pubKey] };
          console.log(res);
          console.log(pubKey);


          if(typeof this.updateSub[pubKey] == 'undefined'){
            this.updateSub[pubKey] = new Subject();
          }

          this.updateSub[pubKey].next(res)

          return res;
  }

  async groupTimeline(pubKey){
     let groupedTimeline = {};
     let replied = [];
     for(let i=0;i<this.timelines[pubKey].length; i++){
       let p = this.timelines[pubKey][i];

        if(typeof p['replyTo'] != 'undefined'){
          replied.push(p['replyTo']);
          if(typeof groupedTimeline[p['replyTo']] == 'undefined'){
            groupedTimeline[p['replyTo']]  = [];
          }
          groupedTimeline[p['replyTo']].push(p);
        }
        else{
            groupedTimeline[i] = [p];
        }
     }

     this.groupedTimelines[pubKey] = [];
     let keys = Object.keys(groupedTimeline);
     for(let key of keys){
       // console.log(key)
       // console.log( groupedTimeline[key][0]);
       if((key.length > 5 && groupedTimeline[key].length > 0 && this.inTimeline(groupedTimeline[key][0]['replyTo'], pubKey)) || (groupedTimeline[key].length == 1 && typeof groupedTimeline[key][0]['replyTo'] == 'undefined'  && replied.indexOf(groupedTimeline[key][0]['qHash']) < 0 )){
         this.groupedTimelines[pubKey].push(groupedTimeline[key]);
       }
     }

     this.groupedTimelines[pubKey].sort(function(a,b) {
       return a[0].timestamp > b[0].timestamp ? -1 : 1;
     });

     console.log(this.groupedTimelines[pubKey]);
     return this.groupedTimelines[pubKey] ;


   }

   inTimeline(qHash, pubKey){
     for(let p of this.timelines[pubKey]){
       if(typeof p['qHash'] != 'undefined' && p['qHash'] == qHash){
         return true;
       }
     }

     return false;
   }

  async resolveReplyTreeRec(postObj, qHash, pubKey){


    if(typeof this.replyTree[pubKey][qHash] == 'undefined'){
       this.replyTree[pubKey][qHash] = [];
    }

    if(typeof postObj['replyTo'] == 'undefined'){
      return this.replyTree[pubKey][qHash];
    }


try{

      let node = await this.coral.dag.get(postObj['replyTo'],{ storagePath: '/archive/social/timeline/transaction' });
      //
      // let exists = false;
      // for(let n of this.replyTree[pubKey][qHash]){
      //   if(node['qHash'] == n['qHash']){
      //     exists = true;
      //   }
      // }
      //
      // if(!exists){
        this.replyTree[pubKey][qHash].push(node);
      // }

      if(typeof this.replyTree[pubKey][qHash][this.replyTree[pubKey][qHash].length-1] != 'undefined' && this.replyTree[pubKey][qHash][this.replyTree[pubKey][qHash].length-1] !== false){
              await this.resolveReplyTreeRec(this.replyTree[pubKey][qHash][this.replyTree[pubKey][qHash].length-1], qHash, pubKey);
      }

      this.replyTree[pubKey][qHash] = this.replyTree[pubKey][qHash].sort(function(a,b) {
        return a.timestamp < b.timestamp ? -1 : 1;
      });
}catch(e){console.log(e)};
      return this.replyTree[pubKey][qHash]
  }


}
