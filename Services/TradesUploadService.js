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
        if(this.Service!=null) this.Service.Stop();
        if(B53Service.Srvs.some(a=>a.Name==this.ServiceName)) clearInterval(B53Service.Srvs.find(a=>a.Name==this.ServiceName).Service);

        this.Service = new B53Service(this.ServiceName,freq);
        
    }
}