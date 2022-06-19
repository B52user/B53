const InsertsDefault = {
    MarketsDefaults:`
        INSERT INTO dbo.B53Markets(name) VALUES ('Binance');
        INSERT INTO dbo.B53Markets(name) VALUES ('FTX');
        `
    ,SymbolsDefault:`
        INSERT INTO dbo.B53Symbols(symbol,isfutures) VALUES ('API3USDT',false);
        INSERT INTO dbo.B53Symbols(symbol,isfutures) VALUES ('API3USDT',true);
    `
    ,TradeUploadDefault:`
        INSERT INTO dbo.b53tradeupload(marketid,symbolid) VALUES (1,1);
        INSERT INTO dbo.b53tradeupload(marketid,symbolid) VALUES (1,2);
    `
};

module.exports = InsertsDefault;