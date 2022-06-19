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
    GetLastTrade:(tableName) => `
        select *
        from dbo.${tableName}
        order by id desc
        limit 1
    `,
    InsertTrade:(tableName,trade) => `
        INSERT INTO dbo.${tableName}(id, buy, price, quantity, "time")
        VALUES (${trade.id}, ${trade.buy}, ${trade.price}, ${trade.quantity}, ${trade.time});
    `,
};

module.exports = Queries_Trades;