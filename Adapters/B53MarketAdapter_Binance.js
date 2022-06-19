const Binance = require('node-binance-api-ext');

class B53MarketAdapter_Binance{
    constructor(biClient=null){
        this.BI = Binance({
            APIKEY: 'MlmTyzzGbiFSDNyrI745NboXTBS9AdKXwxLMXd00aUWpWKPcI8hiRIfDpFv0oI8o',
            APISECRET: 'u3fNSMJlYwTMwCOb3X5Bvp3xrpiogEN1MyQbDdtYS3lisd2VB6aKV8KjCaGmgFIg'
        });
        //if(biClient) {this.BI = biClient;}
        this.Name = "Binance";
    }
    async GetLastTrades(symbolInfo){
        if(symbolInfo.isfutures) {
            return this.BI.futures.trades(symbolInfo.symbol,{limit:1000});
        }
        else
        {
            return this.BI.spot.trades(symbolInfo.symbol,{limit:1000});
        }
    }
}

module.exports = B53MarketAdapter_Binance;