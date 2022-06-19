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
const bi = Binance();
//init Logic
const DB = new B53DBAdapter_PG(pg_db);
const Market = new B53MarketAdapter_Binance(bi);

//start tradeupload

let tSrvs = [];
(async()=>{
    let tradiesTonight = await DB.GetTradeUploadSymbolsByMarketName(Market.Name);
    tradiesTonight.forEach(t => {
        let tS = new TradeUploadService(Market,DB,5000,t);
        tS.Start();
        tSrvs.push(tS);
    });
    console.log(tSrvs);
})();

//init routes
app.use("/static",express.static("static"));
app.get('/', function(req, res) {res.render("report");});
app.get('/report', function(req, res) {res.render("report");});
app.get('/data', function(req, res) {res.render("data");});
app.get('/service', function(req, res) {res.render("service");});
app.get('/settings', function(req, res) {res.render("settings");});
app.get('/back', function(req, res) {res.render("back");});