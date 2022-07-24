const B53Service = require('./B53Service.js');

class InsterestUploadService {
    constructor(marketAdapter,dbAdapter,freq,symbol){
        this.freq = freq;
        this.Market = marketAdapter;
        this.DB = dbAdapter;
        this.Symbol = symbol;
        //it always fut
        this.ServiceName = "InsterestUploadService_"+this.Symbol.symbol;
        this.Service = null;
        this.HistoryTimeLeft = null;
        this.LastRealInterestTime = 0;
    }
    async Start(){
        //check if stop or kill
        this.Stop();
        this.Service = new B53Service(this.ServiceName,this.freq);

        //set method
        let that = this;
        this.Service.Actions.push(async()=>{
            try
            {
                let lastInterest = await that.Market.GetLastInterest(that.Symbol);
                if(!lastInterest.openInterest.length){
                    console.error(this.ServiceName + " Something wrong with the symbol "+that.Symbol.symbol + " returned "+JSON.stringify(lastInterest));
                    return;
                }
                await that.DB.AddRealInterest(that.Market.Name,that.Symbol,lastInterest);
                this.LastRealInterestTime = new Date().getTime();
            }
            catch(err){
                console.error(this.ServiceName + " lastTrades: ",err);
            }
        });
        this.Service.Start();
    }
    Stop(){
        //check if stop or kill
        if(this.Service!=null) this.Service.Stop();
        if(B53Service.Srvs.some(a=>a.Name==this.ServiceName)) clearInterval(B53Service.Srvs.find(a=>a.Name==this.ServiceName).Service);
    }
}

module.exports = InsterestUploadService;