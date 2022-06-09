const express = require('express');
const app = express();
app.set('view engine', 'ejs');;
app.listen(3000);
app.get('/', function(req, res) {
    res.render("index",{page:"report"});
});
app.get('/report', function(req, res) {
    res.render("index",{page:"report"});
});
app.use("/static",express.static("static"));