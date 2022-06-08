const Binance = require('node-binance-api');
const express = require('express');
const app = express();
app.set('view engine', 'ejs');;
app.listen(3000);
const bi = new Binance();

app.get('/', function(req, res) {
  bi.futuresExchangeInfo()
  .then(result => {
    console.log("result: ", result);
    bi.exchangeInfo()
    .then(res2 => {
      console.log("result2: ", res2);
      res.render("pages/index",{binares:"YES!!!",info:"YES"});
    })
    .catch(err => {
      console.error("result inverse error: ", err);
      res.render("pages/index",{binares:"YES!!!!!",info:"NO"});
    });
  })
  .catch(err => {
    console.error("result inverse error: ", err);
    res.render("pages/index",{binares:"NO!!!!!",info:"NO!"});
  });
  
});