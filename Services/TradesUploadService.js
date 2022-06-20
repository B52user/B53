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
                let lastTrades = await that.Market.GetLastTrades(that.Symbol);
                if(!lastTrades.length){
                    console.error(this.ServiceName + " Something wrong with the symbol "+that.Symbol.symbol + " returned 0 trade records");
                    return;
                }
                let lastTrade = await that.DB.GetLastTrade(that.Market.Name,that.Symbol);
                console.log(lastTrade.id);
                let filteredTrades = lastTrades.filter((a)=>a.id>lastTrade.id).map((b)=>({
                    id:b.id,
                    buy:!b.isBuyerMaker,
                    price:b.price,
                    quantity:b.qty,
                    time:b.time
                }));
                if(filteredTrades.length) {
                    let st = new Date().getTime();
                    await that.DB.AddTrades(that.Market.Name,that.Symbol,filteredTrades);
                    console.log(this.ServiceName + " " + (new Date().getTime()-st).toString());
                }
                

                //now fill gaps
                let tNow = await this.Market.BI.futures.time();
                let from = tNow.serverTime - 60*60*1000*B53Settings.data_trades_upload_back_hours;
                let gap = await that.DB.GetTradesGap(that.Market.Name,that.Symbol,from);
                console.log(gap);
                if(gap.to!=null)
                {
                    //get it
                    let histTrade = await that.Market.GetHistoricalTrades(that.Symbol,gap.to);
                    console.log(histTrade.length);
                    if(gap.from!=null&&histTrade.some(a=>a.id==gap.from))
                    {
                        //prefilter
                        histTrade = histTrade.filter(a=>a.id>gap.from);
                    }
                    let filteredHists = histTrade.map((b)=>({
                        id:b.id,
                        buy:!b.isBuyerMaker,
                        price:b.price,
                        quantity:b.qty,
                        time:b.time
                    }));
                    if(filteredHists.length) {
                        let st = new Date().getTime();
                        await that.DB.AddTrades(that.Market.Name,that.Symbol,filteredHists);
                        console.log(this.ServiceName + " New Trades! " + (new Date().getTime()-st).toString());
                    }
                }

            }
            catch(err){
                console.error(err);
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