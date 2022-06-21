const Binance = require('node-binance-api-ext');

class B53MarketAdapter_Binance{
    constructor(biClient=null){
        this.BI = Binance({
            APIKEY: 'MlmTyzzGbiFSDNyrI745NboXTBS9AdKXwxLMXd00aUWpWKPcI8hiRIfDpFv0oI8o',
            APISECRET: 'u3fNSMJlYwTMwCOb3X5Bvp3xrpiogEN1MyQbDdtYS3lisd2VB6aKV8KjCaGmgFIg'
        });
        this.BI.useServerTime();
        //if(biClient) {this.BI = biClient;}
        this.Name = "Binance";
    }
    async GetLastTrades(symbolInfo){
        if(symbolInfo.isfutures) {
            return await this.BI.futures.trades(symbolInfo.symbol,{limit:500});
        }
        else
        {
            return await this.BI.spot.recentTrades(symbolInfo.symbol,{limit:500});
        }
    }
    async GetHistoricalTrades(symbolInfo,lastid) {
        lastid = lastid - 500 + 1;
        if(symbolInfo.isfutures) {
            return await this.BI.futures.historicalTrades(symbolInfo.symbol,{fromId:lastid,limit:500});
        }
        else
        {
            return await this.BI.spot.historicalTrades(symbolInfo.symbol,{fromId:lastid,limit:500});
        }
    }
}

module.exports = B53MarketAdapter_Binance;