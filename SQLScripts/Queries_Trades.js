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
    GetGap:(tableName,timeFrom) => `
        select id, buy, price, quantity, "time"
        from dbo.${tableName} a
        where 
            a."time" > ${timeFrom}
            and
            (not exists (
                select id from dbo.${tableName} b
                where b.id = a.id - 1
                limit 1
            )
            or
            not exists (
                select id from dbo.${tableName} c
                where c.id = a.id + 1
                limit 1
            ))
        order by a.id desc
        limit 3
    `,
};

module.exports = Queries_Trades;