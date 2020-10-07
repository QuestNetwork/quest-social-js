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




}
