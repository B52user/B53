const express = require('express');
const app = express();
app.set('view engine', 'ejs');;
app.listen(3000);


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
