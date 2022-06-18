const B53Service = require('./B53Service.js');

class WorkBookUploadService{
    DB;
    #_freq;
    ADP;
    Service;
    constructor(dbAdapter,freq,marketAdapter){
        this.#_freq = freq;
        this.DB = dbAdapter;
        this.ADP = marketAdapter;
        this.Service = new B53Service("WorkBookUploadService_"+this.Market,freq);
    }
    Start(){
        //kill if exists
        if(this.Service!=null) this.Service.Stop();
        if(B53Service.Srvs.some(a=>a.Name=="WorkBookUploadService_"+this.Market)) clearInterval(B53Service.Srvs.find(a=>a.Name=="WorkBookUploadService_"+this.Market).Service);
    }
}

module.exports = WorkBookUploadService;