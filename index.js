const express = require('express');
const app = express();
app.set('view engine', 'ejs');;
app.listen(3000);
const { MainClient } = require('binance');
const client = new MainClient();
/*{
  api_key: API_KEY,
  api_secret: API_SECRET,
});*/
/*
client.getExchangeInfo()
  .then(result => {
    console.log("getExchangeInfo inverse result: ", result);
  })
  .catch(err => {
    console.error("getExchangeInfo inverse error: ", err);
  });*/

  app.get('/', function(req, res) {
    client.getExchangeInfo()
    .then(result => {
      console.log("getExchangeInfo inverse result: ", result);
      res.render("pages/index",{binares:"Success!"});
    })
    .catch(err => {
      console.error("getExchangeInfo inverse error: ", err);
      res.render("pages/index",{binares:"NO!!!!!"});
    });
  });