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
            return await this.BI.futures.trades(symbolInfo.symbol,{limit:250});
        }
        else
        {
            return await this.BI.spot.recentTrades(symbolInfo.symbol,{limit:250});
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
    async GetLastInterest(symbolInfo){
        if(symbolInfo.isfutures) {
            return await this.BI.futures.openInterest(symbolInfo.symbol);
        }
        else
        {
            console.error("Open interest cannot be retrieved for spot symbol");
        }
    }
    async GetLast5mInterest(symbolInfo){
        if(symbolInfo.isfutures) {
            let params = {
                symbol:symbolInfo.symbol,
                period:"5m",
                limit:30
            };
            return await this.BI.promiseRequest("futures/data/openInterestHist",params,{base:"https://fapi.binance.com/"});
        }
        else
        {
            console.error("Open interest cannot be retrieved for spot symbol");
        }
    }
    async Get5mInterest(symbolInfo,startTime=null,endTime=null){
        if(symbolInfo.isfutures) {
            let params = {
                symbol:symbolInfo.symbol,
                period:"5m",
                limit:500
            };
            if(startTime) params.startTime = startTime;
            if(endTime) params.endTime = endTime;
            return await this.BI.promiseRequest("futures/data/openInterestHist",params,{base:"https://fapi.binance.com/"});
        }
        else
        {
            console.error("Open interest cannot be retrieved for spot symbol");
        }
    }
}

module.exports = B53MarketAdapter_Binance;