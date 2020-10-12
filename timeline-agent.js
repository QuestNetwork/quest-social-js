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


        // this.timelines[pubKey] = [];
        let timeline = [];


        this.limit[pubKey] = config['limit'];


          if(pubKey == "all"){
            timeline = await this.timeline.get('all', config);
          }
          else{
            timeline = await this.timeline.get(pubKey, config);
          }


          let replyTree = {};
          if(timeline.length > 0){
            for(let p of timeline){
              replyTree[p['qHash']] = []
            }
          }

          let groupedTimeline = await this.groupTimeline(timeline, config['limit']);

          this.timelines[pubKey] = timeline;
          // this.replyTree[pubKey] = replyTree;

          let res = { id: uuidv4(), groupedTimeline: groupedTimeline, replyTree: replyTree, timeline: timeline };
          console.log(res);
          console.log(pubKey);


          if(typeof this.updateSub[pubKey] == 'undefined'){
            this.updateSub[pubKey] = new Subject();
          }

          this.updateSub[pubKey].next(res)

          return res;
  }



  async groupTimeline(timeline,  limit = 0){
    let groupedTimelines = [];
     let groupedTimeline = {};
     let replied = [];
     for(let i=0;i<timeline.length; i++){
       let p = timeline[i];

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

     let keys = Object.keys(groupedTimeline);
     for(let key of keys){
       if((key.length > 5 && groupedTimeline[key].length > 0 && this.inTimeline(timeline,groupedTimeline[key][0]['replyTo'])) || (groupedTimeline[key].length == 1 && typeof groupedTimeline[key][0]['replyTo'] == 'undefined'  && replied.indexOf(groupedTimeline[key][0]['qHash']) < 0 )){
         groupedTimelines.push(groupedTimeline[key]);
       }
     }

     groupedTimelines.sort(function(a,b) {
       return a[0].timestamp > b[0].timestamp ? -1 : 1;
     });

     let newCombined = [];
     let i = 0;

     for(let combinedTimeline of groupedTimelines){
       let newTimeline = [];
       let pushed = [];
       for(let p of combinedTimeline){
         if(pushed.indexOf(p['qHash']) < 0){
           newTimeline.push(p);
           pushed.push(p['qHash']);
         }
       }

       if(i<limit || limit == 0){
          newCombined.push(newTimeline);
       }

        i++;

     }

     groupedTimelines = newCombined;

     console.log(groupedTimelines);
     return groupedTimelines;


   }
   //
   inTimeline(timeline,qHash){
     for(let p of timeline){
       if(typeof p['qHash'] != 'undefined' && p['qHash'] == qHash){
         return true;
       }
     }

     return false;
   }
   //

   async resolveReplyTreeRec(postObj, qHash = ""){
     qHash = postObj['qHash'];
     let replyTree = [];

     if(typeof postObj['replyTo'] == 'undefined'){
       return [];
     }
     try{

      let node = await this.coral.dag.get(postObj['replyTo'],{ storagePath: '/archive/social/timeline/transaction' });
      replyTree.push(node);
      if(typeof replyTree[replyTree.length-1] != 'undefined' && replyTree[replyTree.length-1] !== false){
            replyTree = replyTree.concat(await this.resolveReplyTreeRec(replyTree[replyTree.length-1], qHash));
      }

      replyTree = replyTree.sort(function(a,b) {
        return a.timestamp < b.timestamp ? -1 : 1;
      });
}catch(e){console.log(e)};
      return replyTree;
  }


}
