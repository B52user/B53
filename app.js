const express = require('express');
const app = express();
const { Client } = require('pg');
const connectionString = 'postgresql://b53:Pa$$w0rd@localhost:5432/B53';
const db = new Client({connectionString});

app.set("view engine", "ejs");;
app.listen(3000);
db.connect();

//routes
app.use("/static",express.static("static"));
app.get('/', function(req, res) {
    res.render("report");
});
app.get('/report', function(req, res) {
    res.render("report");
});
app.get('/data', function(req, res) {
    res.render("data");
});
app.get('/service', function(req, res) {
    res.render("service");
});
app.get('/settings', function(req, res) {
    res.render("settings");
});
app.get('/back', function(req, res) {
    res.render("back");
});

//services
db.query('select * from dbo.b53settings',(err,res)=>{
    if (err) {
        console.log(err.stack)
      } else {
        console.log(res)
      }
});