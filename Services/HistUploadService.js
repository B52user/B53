const B53Service = require('./B53Service.js');

class HistUploadService {
    constructor(marketAdapter,dbAdapter,freq,symbol){
        this.freq = freq;
        this.Market = marketAdapter;
        this.DB = dbAdapter;
        this.Symbol = symbol;
        this.ServiceName = "HistUploadService_"+(this.Symbol.isfutures?"FUT":"SPOT")+"_"+this.Symbol.symbol;
        this.Service = null;
        this.HistoryTimeLeft = null;
        //this.LastRealCandleTime = 0;
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
                let gap = await that.DB.GetTradesGap(that.Market.Name,that.Symbol,fromTime);
                
                if(gap.to!=null)
                {
                    if(this.HistoryTimeLeft==null)
                    {
                        this.HistoryTimeLeft = {};
                        this.HistoryTimeLeft.lastGapStartTime = new Date().getTime();
                        this.HistoryTimeLeft.lastGapStartFrom = gap.toTime;
                    }
                    this.HistoryTimeLeft.timeWhenStop = fromTime;
                    //get it
                    let histTrade = await that.Market.GetHistoricalTrades(that.Symbol,gap.to);
                    //complete gaps if any
                    let extraGaps = [];
                    for(let i=1;i<histTrade.length;i++)
                    {
                        if(histTrade[i].id!=histTrade[i-1].id+1)
                        {
                            //gaps!!!
                            for(let j=1;j<(histTrade[i].id-histTrade[i-1].id);j++)
                            {
                                //add empty kinda rows
                                extraGaps.push({
                                    id:histTrade[i-1].id+j,
                                    isBuyerMaker:histTrade[i-1].isBuyerMaker,
                                    price:histTrade[i-1].price,
                                    qty:'0',
                                    quoteQty:'0',
                                    time:histTrade[i-1].time
                                });
                            }
                        }
                    }
                    histTrade = histTrade.concat(extraGaps);
                    if(gap.from!=null&&histTrade.some(a=>a.id==gap.from))
                    {
                        //prefilter
                        histTrade = histTrade.filter(a=>a.id>gap.from&&a.id<gap.to);
                    }
                    let filteredHists = histTrade.map((b)=>({
                        id:b.id,
                        buy:!b.isBuyerMaker,
                        price:b.price,
                        quantity:b.qty,
                        time:b.time
                    }));
                    if(filteredHists.length) {
                        await that.DB.AddTrades(that.Market.Name,that.Symbol,filteredHists);
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

module.exports = HistUploadService;