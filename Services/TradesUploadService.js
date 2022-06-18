const B53Service = require('./B53Service.js');

class TradeUploadService{
    constructor(marketAdapter,dbAdapter,freq,symbol){
        this.freq = freq;
        this.Market = marketAdapter;
        this.DB = dbAdapter;
        this.State = "";
        this.Symbol = symbol;
        this.ServiceName = "TradeUploadService_"+this.Symbol.symbol;
        this.Service = null;
    }
    Start(){
        //check if stop or kill
        this.Stop();
        this.Service = new B53Service(this.ServiceName,freq);

        //set method
        let that = this;
        this.Service.Actions.push(()=>{
            let lastTrades = that.Market.GetLastTrades(that.Symbol);
            let lastTrade = that.DB.GetLastTrade(that.Market.Name,that.Symbol);
            that.DB.AddTradesUp(that.Market.Name,that.Symbol,lastTrades.filter(a=>a.id>lastTrade.id).map(b=>({
                id:b.id,
                buy:!b.isBuyerMaker,
                price:b.price,
                quantity:b.qty,
                time:b.time
            })));
        });
    }
    Stop(){
        //check if stop or kill
        if(this.Service!=null) this.Service.Stop();
        if(B53Service.Srvs.some(a=>a.Name==this.ServiceName)) clearInterval(B53Service.Srvs.find(a=>a.Name==this.ServiceName).Service);
    }
}

module.exports = TradeUploadService;