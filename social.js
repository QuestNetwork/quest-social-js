import { v4 as uuidv4 } from 'uuid';
import { Subject } from 'rxjs';
import { NativeCrypto } from '@questnetwork/quest-crypto-js';
import { TimelineManager } from './timeline.js';
import { ProfileManager } from './profile.js';
import { AlgoManager } from './algo.js';

export class QuestSocial {

  constructor() {
    this.key = {}
    this.timeline = new TimelineManager();
    this.profile = new ProfileManager();
    this.algo = new AlgoManager();

  }

  async start(config){

    this.version = config['version'];
    this.jsonSwarm = config['ipfs']['swarm'];
    this.electron = config['dependencies']['electronService'];
    this.bee = config['dependencies']['bee'];
    this.dolphin = config['dependencies']['dolphin'];
    this.crypto = new NativeCrypto();
    this.request = config['dependencies']['request'];
    await this.algo.start(config);
    await this.profile.start(config);
    config['dependencies']['profile'] = this.profile;
    await this.timeline.start(config);
    return true;
  }


   async getPubKeyFromDirectChannel(channel, index = 1){
     let pubKey1 = channel.split('-----')[0].split('-')[1];
     let pubKey2 = channel.split('-----')[0].split('-')[2];

     if(await this.profile.isMyProfileId(pubKey1)){
       let p = await this.profile.get(pubKey2);
       return p['key']['pubKey'];
     }
     else{
       let p = await this.profile.get(pubKey1);
       return p['key']['pubKey'];
     }
  };

  async getAliasFromDirectChannel(channel, index = 1){
    let pubKey = channel.split('-----')[0].split('-')[index];
    let p = await this.profile.get(pubKey);
    return p['alias'];
  };

  async getAliasFromDirectChannel2(channel, index = 2){
    let pubKey1 = channel.split('-----')[0].split('-')[1];
    let pubKey2 = channel.split('-----')[0].split('-')[2];

    if(await this.profile.isMyProfileId(pubKey1)){
      let p = await this.profile.get(pubKey2);
      return p['alias'];
    }
    else{
      let p = await this.profile.get(pubKey1);
      return p['alias'];
    }

  };



  async getSocialProfileForChannelPubKey(channel,chPubKey){

      let folderBase = this.channel.getParticipantFolders(channel);
      if(folderBase.length > 0){
        for(let i=0;i<folderBase.length;i++){
          for(let i2=0;i2<folderBase[i]['participants'].length;i2++){

            if(folderBase[i]['participants'][i2]['pubKey'] == chPubKey && typeof folderBase[i]['participants'][i2]['nick'] != 'undefined' &&  folderBase[i]['participants'][i2]['nick'] != ""){


              let p;
              try{
                p = await this.profile.getByChannelPubKey(folderBase[i]['participants'][i2]['pubKey']);
              }catch(e){console.log(e)}
              if(typeof p != 'undefined' && typeof p['alias'] != 'undefined'){
                p['nick'] = folderBase[i]['participants'][i2]['nick'];
                return p;
              }

              return { nick: folderBase[i]['participants'][i2]['nick'] }
            }
            else if(folderBase[i]['participants'][i2]['pubKey'] == chPubKey){
                let p;
                try{
                  p = await this.profile.getByChannelPubKey(folderBase[i]['participants'][i2]['pubKey']);
                }catch(e){console.log(e)}
                if(typeof p != 'undefined' && typeof p['alias'] != 'undefined'){
                  return p;
                }
            }
          }
        }
      }

      let p;
      try{
        p = await this.profile.getByChannelPubKey(chPubKey);
      }catch(e){console.log(e)}

      if(typeof p != 'undefined' && typeof p['alias'] != 'undefined'){
        return p;
      }

       return { alias: 'Anonymous' };


    }



 async getMentionItems(channel){
   let results = [];
   // get channel pubkeys of participants
   let fullParticipantList = this.dolphin.getChannelParticipantList(channel)['cList'].split(',');
   if(typeof fullParticipantList['cList'] == 'undefined'){
     return [];
   }

   let participantCListArray = this.q.os.channel.getParticipantList(channel);
   // get social pubkeys of participants
   for(let chPubKey of participantCListArray){
     let p = this.channel.getSocialProfileForChannelPubKey(channel,chPubKey);
     if(typeof p['nick'] != 'undefined' && p['nick'].length > 0){
       results.push('<'+p['nick']+'|'+p['key']['pubKey']+'>');
     }
     else if(typeof p['alias'] != 'undefined' && p['alias'].length > 0 && p['alias'] != 'Anonymous'){
       results.push('<'+p['alias']+'|'+p['key']['pubKey']+'>');
     }
   }

   // get display names of participants
   return results;
 }




}
