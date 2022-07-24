const B53Service = require('./B53Service.js');

class TradeUploadService {
    constructor(marketAdapter,dbAdapter,freq,symbol){
        this.freq = freq;
        this.Market = marketAdapter;
        this.DB = dbAdapter;
        this.Symbol = symbol;
        this.ServiceName = "TradeUploadService_"+(this.Symbol.isfutures?"FUT":"SPOT")+"_"+this.Symbol.symbol;
        this.Service = null;
        //this.HistoryTimeLeft = null;
        this.LastRealCandleTime = 0;
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
                this.LastRealCandleTime = new Date().getTime();
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

module.exports = TradeUploadService;