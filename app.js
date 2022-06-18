const B53Settings = require('./B53Settings.js');
const express = require('express');
const {Client} = require('pg');
const Binance = require('node-binance-api-ext');

const app = express();
let connectionString = B53Settings.pg_connection_string;
const pg_db = new Client({connectionString});
const bi = Binance();

app.set("view engine", "ejs");;
app.listen(3000);
pg_db.connect();

//const binanceWorkBooksUploadService = new WorkBookUploadService("Binance",pg_db,1000);
//binanceWorkBooksUploadService.Start();

//routes
app.use("/static",express.static("static"));
app.get('/', function(req, res) {res.render("report");});
app.get('/report', function(req, res) {res.render("report");});
app.get('/data', function(req, res) {res.render("data");});
app.get('/service', function(req, res) {res.render("service");});
app.get('/settings', function(req, res) {res.render("settings");});
app.get('/back', function(req, res) {res.render("back");});

//services
pg_db.query('select * from dbo.b53markets',(err,res)=>{
    if (err) {
        console.log(err.stack)
      } else {
        console.log(res)
      }
});

bi.futures.exchangeInfo().then(a=>
    {
        console.log(a);
    })

bi.spot.exchangeInfo().then(b=>{
    console.log(b);
});