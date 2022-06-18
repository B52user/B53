const InsertsDefault = {
    MarketsDefaults:`
        INSERT INTO dbo.B53Markets(name) VALUES ('Binance');
        INSERT INTO dbo.B53Markets(name) VALUES ('FTX');
        `
    ,SymbolsDefault:`
        INSERT INTO dbo.B53Symbols(symbol,isfutures) VALUES ('BTCUSDT',false);
        INSERT INTO dbo.B53Symbols(symbol,isfutures) VALUES ('BTCUSDT',true);
        INSERT INTO dbo.B53Symbols(symbol,isfutures) VALUES ('API3USDT',false);
        INSERT INTO dbo.B53Symbols(symbol,isfutures) VALUES ('API3USDT',true);
    `
};

module.exports = InsertsDefault;