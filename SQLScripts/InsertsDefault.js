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
    ,SymobolUpdateInsert:(marketid,symbol)=>`
        
        update dbo.b53symbols set 
            mintick = ${symbol.mintick},
            tickprecision = ${symbol.tickprecision},
            minquantity = ${symbol.minquantity},
            quantityprecision = ${symbol.quantityprecision},
            minnotal = ${symbol.minnotal}
        where symbol='${symbol.symbol}' and isfutures=${symbol.isfutures} and market=${marketid} ;

        insert into dbo.b53symbols(
            symbol, 
            isfutures, 
            mintick, 
            tickprecision, 
            minquantity, 
            quantityprecision, 
            minnotal,
            market)
        select '${symbol.symbol}', ${symbol.isfutures}, ${symbol.mintick}, ${symbol.tickprecision}, ${symbol.minquantity}, ${symbol.quantityprecision}, ${symbol.minnotal}, ${marketid}
        where not exists (select * from dbo.b53symbols where symbol='${symbol.symbol}' and isfutures=${symbol.isfutures} and market=${marketid}) ;
    `
};

module.exports = InsertsDefault;