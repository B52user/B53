//import
const B53Settings = require('./B53Settings.js');
const B53DBAdapter_PG = require('./Adapters/B53DBAdapter_PG.js');
const B53MarketAdapter_Binance = require('./Adapters/B53MarketAdapter_Binance.js');
const TradeUploadService = require('./Services/TradesUploadService.js');
const express = require('express');
const {Client} = require('pg');
const Binance = require('node-binance-api-ext');
//init web
const app = express();
app.set("view engine", "ejs");;
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
//init Logic
const DB = new B53DBAdapter_PG(pg_db);
const Market = new B53MarketAdapter_Binance(bi);

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
app.get('/', function(req, res) {res.render("report");});
app.get('/s_d', function(req, res) {res.render("symbol_dashboard");});
app.get('/symbols', function(req, res) {res.render("symbols");});
/*
app.get('/data', function(req, res) {res.render("data");});
app.get('/service', function(req, res) {res.render("service");});
app.get('/settings', function(req, res) {res.render("settings");});
*/

//controllers
app.get("/candles",async(req,res)=>{
    //get vars
    let market = req.query.market;
    let from = req.query.from;
    let to = req.query.to;
    let time = req.query.time;
    let symbol = req.query.symbol;
    let isfutures = req.query.isfutures;
    res.json(await DB.GetCandles(market,{isfutures:isfutures,symbol:symbol},time)); 
});