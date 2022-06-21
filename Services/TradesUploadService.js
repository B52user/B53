const B53Service = require('./B53Service.js');
const B53Settings = require('../B53Settings.js');

class TradeUploadService {
    constructor(marketAdapter,dbAdapter,freq,symbol){
        this.freq = freq;
        this.Market = marketAdapter;
        this.DB = dbAdapter;
        this.State = "";
        this.Symbol = symbol;
        this.ServiceName = "TradeUploadService_"+(this.Symbol.isfutures?"FUT":"SPOT")+"_"+this.Symbol.symbol;
        this.Service = null;
        this.HistoricalUpdateSpeeds = [];
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
                //console.log(this.ServiceName + " alive " + new Date().toLocaleTimeString());
                let lastTrades = await that.Market.GetLastTrades(that.Symbol);
                if(!lastTrades.length){
                    console.error(this.ServiceName + " Something wrong with the symbol "+that.Symbol.symbol + " returned 0 trade records");
                    return;
                }
                let lastTrade = await that.DB.GetLastTrade(that.Market.Name,that.Symbol);
                let filteredTrades = lastTrades.filter((a)=>a.id>lastTrade.id).map((b)=>({
                    id:b.id,
                    buy:!b.isBuyerMaker,
                    price:b.price,
                    quantity:b.qty,
                    time:b.time
                }));
                if(filteredTrades.length) {
                    await that.DB.AddTrades(that.Market.Name,that.Symbol,filteredTrades);
                }
            }
            catch(err){
                console.error(this.ServiceName + " lastTrades: ",err);
            }

            try
            {
                //now fill gaps
                let st = new Date().getTime();
                let tNow = await this.Market.BI.futures.time();
                let fromTime = tNow.serverTime - 60*60*1000*B53Settings.data_trades_upload_back_hours;
                let gap = await that.DB.GetTradesGap(that.Market.Name,that.Symbol,fromTime);
                
                if(gap.to!=null)
                {
                    console.log(this.ServiceName + " found gap: ",gap);
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
                        let timeMax = Math.max(...filteredHists.map(a=>a.time));
                        let timeLeftToFromMS = timeMin - fromTime;
                        let currentSpeedMStoMS = (timeMax - timeMin)/(new Date().getTime()-st);
                        this.HistoricalUpdateSpeeds.push(currentSpeedMStoMS);
                        let avgSpeed = this.HistoricalUpdateSpeeds.reduce((a,b)=>a+b)/this.HistoricalUpdateSpeeds.length;
                        let timeLeft = timeLeftToFromMS/avgSpeed;
                        console.log(this.ServiceName + " Expected Completion Time in: " + (timeLeft/(60000)).toFixed(1) + "m");
                    }
                }
            }
            catch(err){
                this.HistoricalUpdateSpeeds.push(0);
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

module.exports = TradeUploadService;