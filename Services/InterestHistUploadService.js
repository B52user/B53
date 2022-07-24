const B53Service = require('./B53Service.js');

class InterestHistUploadService {
    constructor(marketAdapter,dbAdapter,freq,symbol){
        this.freq = freq;
        this.Market = marketAdapter;
        this.DB = dbAdapter;
        this.Symbol = symbol;
        this.ServiceName = "InterestHistUploadService"+(this.Symbol.isfutures?"FUT":"SPOT")+"_"+this.Symbol.symbol;
        this.Service = null;
        this.HistoryTimeLeft = null;
    }
    async Start(){
        //check if stop or kill
        this.Stop();
        this.Service = new B53Service(this.ServiceName,this.freq);

        //set method
        let that = this;
        this.Service.Actions.push(async()=>{
            //refresh symol
            that.Symbol = await that.DB.GetSymbolById(that.Symbol.id);

            try
            {
                //now fill gaps
                let tNow = await this.Market.BI.futures.time();
                let fromTime = tNow.serverTime - 60*60*1000*that.Symbol.uploadhours;
                let gap = await that.DB.GetInterestGap(that.Market.Name,that.Symbol,fromTime);
                
                if(gap.to!=null)
                {
                    if(this.HistoryTimeLeft==null)
                    {
                        this.HistoryTimeLeft = {};
                        this.HistoryTimeLeft.lastGapStartTime = new Date().getTime();
                        this.HistoryTimeLeft.lastGapStartFrom = gap.to;
                    }
                    this.HistoryTimeLeft.timeWhenStop = fromTime;
                    if(gap.from==null) gap.from = fromTime;
                    //get it
                    let histInt = await that.Market.Get5mInterest(that.Symbol,gap.from,gap.to);
                    
                    let filteredHists = histInt.map((b)=>({
                        id:b.id,
                        buy:!b.isBuyerMaker,
                        price:b.price,
                        quantity:b.qty,
                        time:b.time
                    }));
                    if(filteredHists.length) {
                        await that.DB.AddHistInterest(that.Market.Name,that.Symbol,filteredHists);
                        let timeMin = Math.min(...filteredHists.map(a=>a.time));
                        this.HistoryTimeLeft.lastGapClose = timeMin;
                    }
                }
                else this.HistoryTimeLeft = null;
            }
            catch(err){
                console.error(this.ServiceName + " historical Upload: ",err);
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

module.exports = InterestHistUploadService;