const Queries_Trades = {
    GetTradesToUploadByMarket:(marketName) => `
        select 
            c.id,
            c.symbol,
            c.isfutures
        from dbo.b53tradeupload a join dbo.b53markets b
        on a.marketid = b.id
        join dbo.b53symbols c on a.symbolid = c.id
        where b.name = '${marketName}'
    `,
};

module.exports = Queries_Trades;