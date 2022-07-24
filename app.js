//import
const B53Settings = require('./B53Settings.js');
const B53DBAdapter_PG = require('./Adapters/B53DBAdapter_PG.js');
const B53MarketAdapter_Binance = require('./Adapters/B53MarketAdapter_Binance.js');
const TradeUploadService = require('./Services/TradesUploadService.js');
const HistUploadService = require('./Services/HistUploadService.js');
const InterestHistUploadService = require('./Services/InterestHistUploadService.js');
const InsterestUploadService = require('./Services/InterestUploadService');
const Insterest5mUploadService = require('./Services/Insterest5mUploadService.js');

const express = require('express');
const {Client} = require('pg');
const Binance = require('node-binance-api-ext');
const Binance2 = require('node-binance-api');
//init web
const app = express();
app.set("view engine", "ejs");;
app.use(express.json());
app.listen(3000);
//init db
const connectionString = B53Settings.pg_connection_string;
const pg_db = new Client({connectionString});
pg_db.connect();
//init Binance
const bi = Binance({
    APIKEY: 'MlmTyzzGbiFSDNyrI745NboXTBS9AdKXwxLMXd00aUWpWKPcI8hiRIfDpFv0oI8o',
    APISECRET: 'u3fNSMJlYwTMwCOb3X5Bvp3xrpiogEN1MyQbDdtYS3lisd2VB6aKV8KjCaGmgFIg'
});
const bi2 = new Binance2().options({
    APIKEY: 'MlmTyzzGbiFSDNyrI745NboXTBS9AdKXwxLMXd00aUWpWKPcI8hiRIfDpFv0oI8o',
    APISECRET: 'u3fNSMJlYwTMwCOb3X5Bvp3xrpiogEN1MyQbDdtYS3lisd2VB6aKV8KjCaGmgFIg'
});
//init Logic
const DB = new B53DBAdapter_PG(pg_db);
const Market = new B53MarketAdapter_Binance(bi);
var tSrvs = [];
var hSrvs = [];
var iSrvs = [];
var ihSrvs = [];
var i5Srvs = [];

//start tradeupload
/*
(async()=>{
    let exc = await bi.spot.exchangeInfo();
    let ix = await bi.spot.recentTrades("FLMUSDT");
    console.log(ix);
})();*/
/*
let tSrvs = [];
(async()=>{
    let tradiesTonight = await DB.GetTradeUploadSymbolsByMarketName(Market.Name);
    tradiesTonight.forEach(t => {
        let tS = new TradeUploadService(Market,DB,1000,t);
        tS.Start();
        tSrvs.push(tS);
    });
    console.log(tSrvs);
})();
*/
//init routes
app.use("/static",express.static("static"));
app.get('/', function(req, res) {res.redirect("/symbols");});
app.get('/s_d', async(req, res) => {
    let symbol = await DB.GetSymbolById(req.query.symbolid);
    res.render("symbol_dashboard",{symbol:symbol});
});
app.get('/symbols', function(req, res) {
    //get data for it
    DB.GetActiveSymbols().then(r=>{
        //render
        res.render("symbols",{
            rows:r
        });
    });
});
app.get('/system', function(req, res) {res.render("system");});

//controllers
app.get("/candles",async(req,res)=>{
    try
    {
        //get vars
        let symbolid = req.query.symbolid;
        let time = req.query.time;
        if(symbolid=="undefined"||time=="undefined") {
            res.status(500).send(`symbolid=${symbolid},time=${time}`);
            return;
        }
        let midnight = new Date();
        midnight.setHours(0,0,0,0);
        midnight.setDate(midnight.getDate()-1);
        let theSymbol = await DB.GetSymbolById(symbolid);
        let cdls = await DB.GetCandles(theSymbol.marketname,{isfutures:theSymbol.isfutures,symbol:theSymbol.symbol},time,midnight.getTime());
        res.json(cdls); 
    }
    catch(er) {console.error(er);res.status(500).send("candles");}
});
app.get("/indicator",async(req,res)=>{
    try
    {
        //get vars
        let symbolid = req.query.symbolid;
        let time = req.query.time;
        let type = req.query.type;
        if(symbolid=="undefined"||time=="undefined"||type=="undefined") {
            res.status(500).send(`symbolid=${symbolid},time=${time}`);
            return;
        }
        let midnight = new Date();
        midnight.setHours(0,0,0,0);
        midnight.setDate(midnight.getDate()-1);
        let theSymbol = await DB.GetSymbolById(symbolid);
        if(type=="volume")
        {
            let cdls = await DB.GetIndicator_Volume(theSymbol.marketname,{isfutures:theSymbol.isfutures,symbol:theSymbol.symbol},time,midnight.getTime());
            res.json(cdls); 
            return;
        }
        if(type=="sellvolume")
        {
            let cdls = await DB.GetIndicator_SellVolume(theSymbol.marketname,{isfutures:theSymbol.isfutures,symbol:theSymbol.symbol},time,midnight.getTime());
            res.json(cdls); 
            return;
        }
        if(type=="tradefreq")
        {
            let cdls = await DB.GetIndicator_TradeFreq(theSymbol.marketname,{isfutures:theSymbol.isfutures,symbol:theSymbol.symbol},time,midnight.getTime());
            res.json(cdls); 
            return;
        }
        if(type=="vertvolume")
        {
            let fromTimeCandle = req.query.fromtime;
            let toTimeCandle = req.query.totime;
            let tickPrec = parseInt(theSymbol.tickprecision)+1;
            let fromPrice = parseFloat(req.query.fromprice).toFixed(tickPrec);
            let toPrice = parseFloat(req.query.toprice).toFixed(tickPrec);
            let priceTick = parseFloat(theSymbol.mintick);
            let cdls = await DB.GetIndicator_VirtVolume(
                theSymbol.marketname,
                {
                    isfutures:theSymbol.isfutures,
                    symbol:theSymbol.symbol
                },
                fromTimeCandle,
                toTimeCandle,
                fromPrice,
                toPrice,
                priceTick,
                tickPrec
                );
            res.json(cdls); 
            return;
        }
        res.sendStatus(200);
    }
    catch(er) {console.error(er);res.status(500).send("candles");}
});

app.get("/lastcandle",async(req,res)=>{
    try
    {
        let symbolid = req.query.symbolid;
        let time = req.query.time;
        if(symbolid=="undefined"||time=="undefined") {
            res.status(500).send(`symbolid=${symbolid},time=${time}`);
            return;
        }
        let symb = await DB.GetSymbolById(symbolid);
        let ltc = await DB.GetLastCandle(symb.marketname,{isfutures:symb.isfutures,symbol:symb.symbol},time);
        res.json(ltc); 
    }
    catch(er) {console.error(er);res.status(500).send("lastcandle");}
});
app.get("/html_options",async(req,res)=>{
    try
    {
        let type=req.query.type;
        let toReturn = [];
        if(type=='market') {
            let markets = await DB.GetMarkets();
            toReturn = markets.map(m=>({name:m.name,value:m.id}));
        }
        if(type=='symbols'){
            let isfutures = req.query.isfutures;
            let market = req.query.market;
            let symbs = await DB.GetSymbolsByTypeAndMarket(market,isfutures);
            toReturn = symbs.map(s=>({name:s.symbol,value:s.id,ismainlist:s.ismainlist}));
            if(req.query.unmain) toReturn = toReturn.filter(s=>!s.ismainlist);
        }
        res.json(toReturn); 
    }
    catch(er) {console.error(er);res.status(500).send("html_options");}
});
app.post("/update",async(req,res)=>{
    try
    {
        let table=req.query.table;
        let id=req.query.id;
        if(table=="undefined"||id=="undefined") {
            res.status(500).send(`table=${table},id=${id}`);
            return;
        }
        await DB.Update(table,id,req.body);
        res.sendStatus(200);
    }
    catch(er) {console.error(er);res.status(500).send("lastcandle");}
});
app.post("/symbols_health",async(req,res)=>{
    try
    {
        let symbolsArray = req.body;
        let toReturn = [];
        for(let s of symbolsArray)
        {
            let symba = await DB.GetSymbolById(s);
            let eInfo = {sid:s};
            let t_srv = tSrvs.find(a=>a.Symbol.id == s);
            if(!t_srv) eInfo.real = {style:"btn-secondary",text:"Fut R Off"}
            else {
                if((new Date().getTime() - t_srv.LastRealCandleTime)<2000) eInfo.real = {style:"btn-success",text:"Fut R <2s"}
                else if((new Date().getTime() - t_srv.LastRealCandleTime)<5000) eInfo.real = {style:"btn-warning",text:"Fut R <5s"}
                else eInfo.real = {style:"btn-danger",text:"Fut R -"+((new Date().getTime() - t_srv.LastRealCandleTime)/60000).toFixed(1)+"m"};
            }

            let h_srv = hSrvs.find(a=>a.Symbol.id == s);
            if(!h_srv) eInfo.hist = {style:"btn-secondary",text:"Fut H Off"}
            else {
                if(h_srv.HistoryTimeLeft!=null) {
                    //calc time left
                    let speed = (h_srv.HistoryTimeLeft.lastGapStartFrom - h_srv.HistoryTimeLeft.lastGapClose)/(new Date().getTime() - h_srv.HistoryTimeLeft.lastGapStartTime);
                    let timeLeft = (h_srv.HistoryTimeLeft.lastGapClose - h_srv.HistoryTimeLeft.timeWhenStop)/speed;
                    eInfo.hist = {style:"btn-warning",text:"H "+(timeLeft/60000).toFixed(1)+"m " + speed.toFixed(0)+"r/s"};
                } 
                else eInfo.hist = {style:"btn-success",text:"Fut H"};
            }

            let s_t_srv = tSrvs.find(a=>a.Symbol.id == symba.pair);
            if(!s_t_srv) eInfo.sreal = {style:"btn-secondary",text:"Spt R Off"}
            else {
                if((new Date().getTime() - s_t_srv.LastRealCandleTime)<2000) eInfo.sreal = {style:"btn-success",text:"Spt R <2s"}
                else if((new Date().getTime() - s_t_srv.LastRealCandleTime)<5000) eInfo.sreal = {style:"btn-warning",text:"Spt R <5s"}
                else eInfo.sreal = {style:"btn-danger",text:"Spt R -"+((new Date().getTime() - s_t_srv.LastRealCandleTime)/60000).toFixed(1)+"m"};
            }

            let s_h_srv = hSrvs.find(a=>a.Symbol.id == symba.pair);
            if(!s_h_srv) eInfo.shist = {style:"btn-secondary",text:"Spt H Off"}
            else {
                if(s_h_srv.HistoryTimeLeft!=null) {
                    //calc time left
                    let speed = (s_h_srv.HistoryTimeLeft.lastGapStartFrom - s_h_srv.HistoryTimeLeft.lastGapClose)/(new Date().getTime() - s_h_srv.HistoryTimeLeft.lastGapStartTime);
                    let timeLeft = (s_h_srv.HistoryTimeLeft.lastGapClose - s_h_srv.HistoryTimeLeft.timeWhenStop)/speed;
                    eInfo.shist = {style:"btn-warning",text:"H "+(timeLeft/60000).toFixed(1)+"m " + speed.toFixed(0)+"r/s"};
                } 
                else eInfo.shist = {style:"btn-success",text:"Spt H"};
            }

            let i_t_srv = iSrvs.find(a=>a.Symbol.id == symba.id);
            if(!i_t_srv) eInfo.ireal = {style:"btn-secondary",text:"Int R Off"}
            else {
                if((new Date().getTime() - i_t_srv.LastRealInterestTime)<2000) eInfo.ireal = {style:"btn-success",text:"Int R <2s"}
                else if((new Date().getTime() - i_t_srv.LastRealInterestTime)<5000) eInfo.ireal = {style:"btn-warning",text:"Int R <5s"}
                else eInfo.ireal = {style:"btn-danger",text:"Int R -"+((new Date().getTime() - i_t_srv.LastRealInterestTime)/60000).toFixed(1)+"m"};
            }

            let i5_t_srv = i5Srvs.find(a=>a.Symbol.id == symba.id);
            if(!i5_t_srv) eInfo.i5real = {style:"btn-secondary",text:"I5m R Off"}
            else {
                if((new Date().getTime() - i5_t_srv.LastRealInterestTime)<60000) eInfo.i5real = {style:"btn-success",text:"I5m R <1m"}
                else if((new Date().getTime() - i5_t_srv.LastRealInterestTime)<300000) eInfo.i5real = {style:"btn-warning",text:"I5m R <5m"}
                else eInfo.i5real = {style:"btn-danger",text:"I5m R -"+((new Date().getTime() - i5_t_srv.LastRealInterestTime)/60000).toFixed(1)+"m"};
            }

            let i_h_srv = ihSrvs.find(a=>a.Symbol.id == symba.id);
            if(!i_h_srv) eInfo.ihist = {style:"btn-secondary",text:"Int H Off"}
            else {
                if(i_h_srv.HistoryTimeLeft!=null) {
                    let speed = (i_h_srv.HistoryTimeLeft.lastGapStartFrom - i_h_srv.HistoryTimeLeft.lastGapClose)/(new Date().getTime() - i_h_srv.HistoryTimeLeft.lastGapStartTime);
                    let timeLeft = (i_h_srv.HistoryTimeLeft.lastGapClose - i_h_srv.HistoryTimeLeft.timeWhenStop)/speed;
                    eInfo.ihist = {style:"btn-warning",text:"H "+(timeLeft/60000).toFixed(1)+"m " + speed.toFixed(0)+"r/s"};
                } 
                else eInfo.ihist = {style:"btn-success",text:"Int H"};
            }

            toReturn.push(eInfo); 
        }

        res.json(toReturn);
    }
    catch(er) {console.error(er);res.status(500).send("symbol_health");}
});
app.get("/pushservice",async(req,res)=>{
    try
    {
        let srvName = req.query.srvname;
        let symbolid = req.query.symbolid;
        if(srvName=="trade") {
            let symb = await DB.GetSymbolById(symbolid);
            if(tSrvs.some(a=>a.Symbol.id==symbolid)){
                tSrvs.find(a=>a.Symbol.id==symbolid).Stop();
                tSrvs = tSrvs.filter(a=>a.Symbol.id!=symbolid);
            }
            else
            {
                let tS = new TradeUploadService(Market,DB,1000,symb);
                tS.Start();
                tSrvs.push(tS);
            }
        }
        if(srvName=="hist") {
            let symb = await DB.GetSymbolById(symbolid);
            if(hSrvs.some(a=>a.Symbol.id==symbolid)){
                hSrvs.find(a=>a.Symbol.id==symbolid).Stop();
                hSrvs = hSrvs.filter(a=>a.Symbol.id!=symbolid);
            }
            else
            {
                let hS = new HistUploadService(Market,DB,1000,symb);
                hS.Start();
                hSrvs.push(hS);
            }
        }
        if(srvName=="trades") {
            let symbex = await DB.GetSymbolById(symbolid);
            let symb = await DB.GetSymbolById(symbex.pair);
            if(tSrvs.some(a=>a.Symbol.id==symbolid)){
                tSrvs.find(a=>a.Symbol.id==symbolid).Stop();
                tSrvs = tSrvs.filter(a=>a.Symbol.id!=symbolid);
            }
            else
            {
                let tS = new TradeUploadService(Market,DB,500,symb);
                tS.Start();
                tSrvs.push(tS);
            }
        }
        if(srvName=="hists") {
            let symbex = await DB.GetSymbolById(symbolid);
            let symb = await DB.GetSymbolById(symbex.pair);
            if(hSrvs.some(a=>a.Symbol.id==symbolid)){
                hSrvs.find(a=>a.Symbol.id==symbolid).Stop();
                hSrvs = hSrvs.filter(a=>a.Symbol.id!=symbolid);
            }
            else
            {
                let hS = new HistUploadService(Market,DB,1000,symb);
                hS.Start();
                hSrvs.push(hS);
            }
        }
        if(srvName=="interest") {
            let symb = await DB.GetSymbolById(symbolid);
            if(iSrvs.some(a=>a.Symbol.id==symbolid)){
                iSrvs.find(a=>a.Symbol.id==symbolid).Stop();
                iSrvs = iSrvs.filter(a=>a.Symbol.id!=symbolid);
            }
            else
            {
                let tS = new InsterestUploadService(Market,DB,500,symb);
                tS.Start();
                iSrvs.push(tS);
            }
        }
        if(srvName=="interesthist") {
            let symb = await DB.GetSymbolById(symbolid);
            if(ihSrvs.some(a=>a.Symbol.id==symbolid)){
                ihSrvs.find(a=>a.Symbol.id==symbolid).Stop();
                ihSrvs = ihSrvs.filter(a=>a.Symbol.id!=symbolid);
            }
            else
            {
                let hS = new InterestHistUploadService(Market,DB,1000,symb);
                hS.Start();
                ihSrvs.push(hS);
            }
        }
        if(srvName=="interest5m") {
            let symb = await DB.GetSymbolById(symbolid);
            if(i5Srvs.some(a=>a.Symbol.id==symbolid)){
                i5Srvs.find(a=>a.Symbol.id==symbolid).Stop();
                i5Srvs = iSrvs.filter(a=>a.Symbol.id!=symbolid);
            }
            else
            {
                let tS = new Insterest5mUploadService(Market,DB,60000,symb);
                tS.Start();
                i5Srvs.push(tS);
            }
        }
        if(srvName=="exchangeInfoFut")
        {
            bi.futures.exchangeInfo().then(info=>{
                let symbolInfo = info.symbols.filter(a=>a.quoteAsset=='USDT').map(s=>({
                    symbol:s.symbol,
                    isfutures:true, 
                    mintick: s.filters.find(f=>f.filterType=='PRICE_FILTER').tickSize, 
                    tickprecision:s.filters.find(f=>f.filterType=='PRICE_FILTER').tickSize.includes(".")?s.filters.find(f=>f.filterType=='PRICE_FILTER').tickSize.split(".")[1].indexOf('1'):'0',
                    minquantity:s.filters.find(f=>f.filterType=='LOT_SIZE').minQty, 
                    quantityprecision:s.filters.find(f=>f.filterType=='LOT_SIZE').minQty.includes(".")?s.filters.find(f=>f.filterType=='LOT_SIZE').minQty.split(".")[1].indexOf('1'):'0',
                    minnotal:s.filters.find(f=>f.filterType=='MIN_NOTIONAL').notional
                }));
                DB.InsertUpdateSymbols('Binance',symbolInfo).then(()=>console.log("Binance futures symbols info updated"));
            });
        }
        if(srvName=="exchangeInfoSpot")
        {
            bi.spot.exchangeInfo().then(info=>{
                let symbolInfo = info.symbols.filter(a=>a.quoteAsset=='USDT').map(s=>({
                    symbol:s.symbol,
                    isfutures:false, 
                    mintick: s.filters.find(f=>f.filterType=='PRICE_FILTER').tickSize, 
                    tickprecision:s.filters.find(f=>f.filterType=='PRICE_FILTER').tickSize.includes(".")?s.filters.find(f=>f.filterType=='PRICE_FILTER').tickSize.split(".")[1].indexOf('1'):'0',
                    minquantity:s.filters.find(f=>f.filterType=='LOT_SIZE').minQty, 
                    quantityprecision:s.filters.find(f=>f.filterType=='LOT_SIZE').minQty.includes(".")?s.filters.find(f=>f.filterType=='LOT_SIZE').minQty.split(".")[1].indexOf('1'):'0',
                    minnotal:s.filters.find(f=>f.filterType=='MIN_NOTIONAL').minNotional
                }));
                DB.InsertUpdateSymbols('Binance',symbolInfo).then(()=>console.log("Binance spot symbols info updated"));
            });
        }
        res.sendStatus(200);
    }
    catch(er) {console.error(er);res.status(500).send("pushservice");}
});

