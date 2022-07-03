const SQL = {
    SELECT:{
        SELECT_Symbol_ByTypeAndMarket:(martketName,isfutures) => `
            select
                b.name as marketname,
                a.*
            from dbo.b53symbols a inner join dbo.b53markets b
            on a.market = b.id
            where b.name = '${martketName}' and a.isfutures=${isfutures}
            order by a.symbol asc
        `,
        SELECT_Trades_GetGapTo:(tableName,timeFrom) => `
            select id, buy, price, quantity, "time"
            from dbo.${tableName} a
            where 
                a."time" > ${timeFrom}
                and
                not exists (
                    select id from dbo.${tableName} b
                    where b.id = a.id - 1
                    limit 1
                )
            order by a.id desc
            limit 1
        `,
        SELECT_Trades_GetGapFrom:(tableName,timeFrom,toId) => `
            select id, buy, price, quantity, "time"
            from dbo.${tableName} a
            where a.id<${toId}	and a."time" > ${timeFrom}
            order by a.id desc
            limit 1
        `,
        SELECT_Trades_GetCandles: (tableName,timeFrameMS) => `
            with b as(
                select 
                    CEIL(a."time"/${timeFrameMS})*${timeFrameMS/1000} as candleTime, 
                    a.id,
                    a.buy,
                    a.price,
                    a."time" 
                from dbo.${tableName} a
                order by 1,2 asc
            ),
            c as(
            select distinct 
                    x.candleTime,
                    x.maxShadow,
                    x.minShadow,
                    y.price as endPrice,
                    z.price as startPrice
                from 
                    (select
                        distinct 
                        b.candleTime,
                        max(b.price) as maxShadow,
                        min(b.price) as minShadow,
                        max(b.id) as endId,
                        min(b.id) as startId
                    from b
                    group by b.candleTime) x
                    left join b y on x.endId = y.id
                    left join b z on x.startId = z.id
                order by x.candleTime asc
            )
            select 
            n.candletime,
            n.maxshadow,
            n.minshadow,
            n.endprice,
            coalesce(m.endprice,n.startprice) as startprice
            from c n left join c m on n.candletime = (m.candletime-${timeFrameMS/1000})
            `
    },
    INSERT:{
        INSERT_Default_Market:`
            INSERT INTO dbo.B53Markets(name) VALUES ('Binance');
            INSERT INTO dbo.B53Markets(name) VALUES ('FTX');
            `
        ,INSERT_UPDATE_Symbol:(marketid,symbol)=>`
            
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
        `,
        INSERT_Trade:(tableName,trade) => `
            INSERT INTO dbo.${tableName}(id, buy, price, quantity, "time")
            VALUES (${trade.id}, ${trade.buy}, ${trade.price}, ${trade.quantity}, ${trade.time});
        `,
    },
    UPDATE:{
        Update:(tableName,id,values)=>`
            update ${tableName} set 
                ` +
                values.map(v=>`,${v.name}=${v.value}`).join('').substring(1)
                + `
            where id=${id}
        `,
    },
    CREATE:{
        CREATE_Default:`
            CREATE TABLE IF NOT EXISTS dbo.B53Markets
            (
                id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
                name character varying(50) COLLATE pg_catalog."default" NOT NULL
            );
            CREATE TABLE IF NOT EXISTS dbo.B53Symbols
            (
                id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
                symbol character varying(50) COLLATE pg_catalog."default" NOT NULL,
                isfutures boolean NOT NULL
            ); 
        `
        ,CreateSymbolTrade:(tablename)=>`
            CREATE TABLE IF NOT EXISTS dbo.${tablename}
            (
                id bigint NOT NULL,
                buy boolean NOT NULL,
                price numeric(12,8) NOT NULL,
                quantity numeric(24,12) NOT NULL,
                time bigint NOT NULL
            );
        `
        ,
    }
};

module.exports = SQL;