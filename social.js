import { v4 as uuidv4 } from 'uuid';
import { Subject } from 'rxjs';
import { NativeCrypto } from '@questnetwork/quest-crypto-js';

export class QuestSocial {

  constructor() {
    this.key = {}
    this.selectSub = new Subject();
    this.selected;
  }

  select(profileId){
    this.selectSub.next(profileId);
    this.selected = profileId
  }

  onSelect(){
    return this.selectSub;
  }
  getSelected(){
    return this.selected;
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

  setProfile(profileId,profileObject){
     this.saveProfile(profileId,profileObject);
  }

  async getMyProfileId(){
    let keys;
    let profileId;
    //get our first profile
    let mp = this.bee.comb.get("/social/myprofiles");
    // console.log(mp);
    if(typeof mp != 'undefined' && mp.length > 0){
      profileId = mp[0];
    }
    else{
      keys =  await this.crypto.generateKeyPair('EC');
      // console.log('Social: Profile Keys',keys);
      this.key[keys['pubKey']] = keys;
      profileId = keys['pubKey'];
      let p = { key: keys, private: true }
      this.setProfile(keys['pubKey'],p);
      this.bee.comb.add("/social/myprofiles",keys['pubKey']);
    }

    return profileId;

  }

  async getMyProfile(){

    let pId = await this.getMyProfileId();
    console.log("Social: Getting my profile...",pId);

    console.log(pId);
    let p = this.bee.comb.get("/social/profile/"+pId);
    console.log(p);
    return p;
  }

  async getVerificationQR(){
    let p = await this.getMyProfile();
    let privKey = p['key']['privKey'];

    let verificationQRUUID = uuidv4();
    this.bee.comb.add("/social/verificationCodes/"+this.pubKey,verificationQRUUID);
    return  JSON.stringify(await this.crypto.ec.sign({ pubKey: this.pubKey, random: verificationQRUUID } ,privKey));
  }


  saveProfile(profileId,profileObject){
   //see if this profile exists yet
   console.log('Saving Profile...',profileId,profileObject);
   if(this.key[profileId] == 'undefined'){
     throw('no keys');
   }
     profileObject['key'] = this.key[profileId];
     this.dolphin.setSocialProfile(profileId,profileObject);
     this.bee.comb.set("/social/profile/"+profileId,profileObject);
     this.bee.comb.set("/social/sharedWith",[]);
     this.dolphin.clearSharedWith();
   }

 async verify(signedObj){

    let response = await this.request.post(pK['channel'], { path: '/social/verify', message: signedObj, toSocialPubKey: signedObj['pubKey']  } );
    if(response['message']['isValid']){
      return true;
    }
   
   //timed out
   return false;

 }

 isVerified(pubKey){
   return this.bee.comb.in('/social/verified',pubKey);
 }

  async getProfile(profileId = 'NoProfileSelected'){

    if(profileId == 'NoProfileSelected'){
      //get our first profile
      profileId = await this.getMyProfileId();
    }

    console.log("Social: Retrieving profile...",profileId);

    console.log(this.bee.comb.get("/social/profile/"+profileId));

    let pC = JSON.parse(JSON.stringify(this.bee.comb.get("/social/profile/"+profileId)));
    console.log(JSON.parse(JSON.stringify(this.bee.comb.get("/social/profile/"+profileId))));
    if(typeof pC['key'] != "undefined"){
      this.key[profileId] = pC['key'];
      // delete pC['key']['privKey'];
    }

    console.log(pC);
    return pC;
  }

  async getProfileByChannelPubKey(chPubKey){
    let links = this.bee.comb.get('/social/links');
    console.log('Social: Links Found',links);
    if(typeof links[chPubKey] != 'undefined'){
      let profileId = links[chPubKey][0];
      console.log('Social: Getting Profile For',profileId);
      return await this.getProfile(profileId);
    }
    else{
      return {};
    }
  }


  async isPublic(profileId = "NoProfileSelected"){
    try{
      if(profileId == "NoProfileSelected"){
        profileId = await this.getMyProfileId();
      }
      let p = await this.getProfile(profileId);
      if(p['private'] == false){
        return true;
      }
    }catch(e){console.log(e)}
    return false;
  }

  hasMySocial(cPubKey){
    return this.bee.comb.in("/social/sharedWith",cPubKey);
  }

  gaveMySocialTo(cPubKey){
    this.bee.comb.add("/social/sharedWith",cPubKey);
  }

  isMyProfile(pid){
    return isMyProfileId(pid);
  }

  isMyProfileId(pid){
    if(pid == 'NoProfileSelected'){
      return true;
    }
    return this.bee.comb.in("/social/myprofiles",pid);
  }

  async togglePrivacy(profileId = 'NoProfileSelected'){

    let p = await this.getProfile(profileId);
    if(p['private'] == 'undefined' || p['private'] == true){
      p['private'] = false;
      this.setProfile(profileId,p);
    }
    else{
      p['private'] = true;
      this.setProfile(profileId,p);
    }

  }


  isFavorite(pubKey){
    return this.bee.comb.in('/social/favorites',pubKey)
  }

  isRequestedFavorite(pubKey){
    console.log('Social: Testing Favorites...',pubKey);
    let c = this.bee.comb.get('/social/favoriteRequests');
    console.log(c);
    if(typeof c['push'] == 'undefined'){
      return false;
    }
    for(let r of c ){
      if(r['pubKey'] == pubKey){
        return true;
      }
    }
    return false;
  }


  getRequestedFavoriteChannel(socialPubKey){
    let c = this.bee.comb.get('/social/favoriteRequests');

    for(let i=0;i<c.length;i++ ){
      console.log(c[i]);
      if(typeof c[i]['pubKey'] != 'undefined' && c[i]['pubKey'] == socialPubKey){
        return c[i]['channel'];
      }
    }
    return "";
  }

  async getAliasFromDirectChannel(channel, index = 1){
    let pubKey = channel.split('-----')[0].split('-')[index];
    let p = await this.getProfile(pubKey);
    return p['alias'];
  };

  async getAliasFromDirectChannel2(channel, index = 2){
    let pubKey1 = channel.split('-----')[0].split('-')[1];
    let pubKey2 = channel.split('-----')[0].split('-')[2];

    if(await this.isMyProfileId(pubKey1)){
      let p = await this.getProfile(pubKey2);
      return p['alias'];
    }
    else{
      let p = await this.getProfile(pubKey1);
      return p['alias'];
    }

  };


  addFavoriteRequest(pubKey,chName){
      console.log('qSocial: Adding New Favorite Request...',pubKey,chName);

      this.bee.comb.add('/social/favoriteRequests', { pubKey: pubKey, channel: chName });
  }

  addFavorite(pubKey){
    if(!this.bee.comb.in('/social/favorites',pubKey)){
      this.bee.comb.add('/social/favorites',pubKey);
    }
  }

  removeFavorite(pubKey){
    console.log(pubKey);
    console.log(this.bee.comb.get('/social/favorites'));
    this.bee.comb.removeIn('/social/favorites',pubKey)
    console.log(this.bee.comb.get('/social/favorites'));

    this.removeFavoriteRequest(pubKey);
  }

  removeFavoriteRequest(pubKey){
    this.bee.comb.removeFrom('/social/favoriteRequests', { pubKey: pubKey } );
  }



  search(phrase){
    let allProfiles = this.bee.comb.search("/social/profile/");
    let results = [];
    for(let p of allProfiles){
      if(p['alias'].indexOf(phrase) > -1 || p['fullName'].indexOf(phrase) > -1 || p['about'].indexOf(phrase) > -1){
        results.push(p);
      }
    }

    for(let i=0;i<results.length;i++){
      results[i]['isFavorite'] = this.isFavorite(results[i]['key']['pubKey']);
      results[i]['isRequestedFavorite'] = this.isRequestedFavorite(results[i]['key']['pubKey']);
    }

    return results;
  }


}
