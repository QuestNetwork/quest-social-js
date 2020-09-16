import { v4 as uuidv4 } from 'uuid';
import { Subject } from 'rxjs';

export class QuestProfile {

  constructor() {


  }

  async start(config){

    this.version = config['version'];
    this.jsonSwarm = config['ipfs']['swarm'];
    this.electron = config['dependencies']['electronService'];
    this.bee = config['dependencies']['bee'];

    var userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf(' electron/') > -1) {
      this.isElectron = true;
      this.fs = this.electron.remote.require('fs');
      this.configPath = this.electron.remote.app.getPath('userData');
      this.configFilePath = this.configPath + "/user.qcprofile";
    }

    return true;
  }



}
