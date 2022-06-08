const express = require('express');
const app = express();
const { MainClient } = require('binance');
const client = new MainClient();
/*{
  api_key: API_KEY,
  api_secret: API_SECRET,
});*/

client.getExchangeInfo()
  .then(result => {
    console.log("getExchangeInfo inverse result: ", result);
  })
  .catch(err => {
    console.error("getExchangeInfo inverse error: ", err);
  });
