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
        SELECT_Trades_GetLastCandle:(tableName,timeFrameMS) => `
            with ctime as(
                select 
                    CEIL(a."time"/${timeFrameMS})*${timeFrameMS/1000} as candletime, 
                    a.id,
                    a.buy,
                    a.price,
                    a."time" 
                from dbo.${tableName} a
                order by a.id desc limit 10000
                ), candle as(
                select
                    a.candletime,
                    max(a.id) as endid,
                    min(a.id) as startid,
                    max(a.price) as maxshadow,
                    min(a.price) as minshadow
                from ctime a
                where a.candletime = (select max(candletime) from ctime)
                group by a.candletime
                )
                select 
                    a.candletime,
                    a.maxshadow,
                    a.minshadow,
                    b.price as startprice,
                    c.price as endprice
                from candle a left join ctime b on a.startid=b.id left join ctime c on a.endid = c.id
        `,
        SELECT_Trades_GetCandles: (tableName,timeFrameMS,timeFrom=null) => `
        with ctime as(
            select 
                distinct
                CEIL(a."time"/${timeFrameMS})*${timeFrameMS/1000} as candletime, 
                a.id,
                a.buy,
                a.price,
                a."time" 
            from dbo.${tableName} a
            ${(timeFrom==null?"":"where a.time>"+timeFrom)}
            order by a.id desc
            ), precandle as(
            select
                a.candletime,
                max(a.price) as maxShadow,
                min(a.price) as minShadow,
                max(a.id) as endid,
                min(a.id) as startid
            from ctime a
            group by a.candleTime
            ), candle as(
            select
                a.candletime,
                a.maxShadow,
                a.minShadow,
                b.price as endprice,
                c.price as startprice
            from precandle a left join ctime b on a.endid = b.id
            left join ctime c on a.startid = c.id
            )
            select 
                a.candletime,
                a.maxshadow,
                a.minshadow,
                a.endprice,
                coalesce(b.endprice,a.startprice) as startprice
            from candle a left join candle b on b.candletime = (a.candletime-${timeFrameMS/1000})
            order by 1 asc
            `,
        SELECT_Trades_GetVolumes: (tableName,timeFrameMS,timeFrom=null) => `
        with ctime as(
            select 
                distinct
                CEIL(a."time"/${timeFrameMS})*${timeFrameMS/1000} as candletime, 
                a.quantity,
				a.id
            from dbo.${tableName} a
            ${(timeFrom==null?"":"where a.time>"+timeFrom)}
            order by a.id desc
            )
            select 
                a.candletime,
                sum(a.quantity) as volume
            from ctime a 
            group by a.candletime
            order by 1 asc
            `,
        SELECT_Trades_GetSellVolumes: (tableName,timeFrameMS,timeFrom=null) => `
            with ctime as(
                select 
                    distinct
                    CEIL(a."time"/${timeFrameMS})*${timeFrameMS/1000} as candletime, 
                    a.quantity,
                    a.id
                from dbo.${tableName} a
                where a.buy = false ${(timeFrom==null?"":" and a.time>"+timeFrom)}
                order by a.id desc
                )
                select 
                    a.candletime,
                    sum(a.quantity) as volume
                from ctime a 
                group by a.candletime
                order by 1 asc
                `,
        SELECT_Trades_GetFreq: (tableName,timeFrameMS,timeFrom=null) => `
            with ctime as(
                select 
                    distinct
                    CEIL(a."time"/${timeFrameMS})*${timeFrameMS/1000} as candletime, 
                    a.id
                from dbo.${tableName} a
                 ${(timeFrom==null?"":"where a.time>"+timeFrom)}
                order by a.id desc
                )
                select 
                    a.candletime,
                    count(a.id) as countdown
                from ctime a 
                group by a.candletime
                order by 1 asc
                `,
        SELECT_Trades_VertVolume: (tableName,timefrom,timeto,pricefrom,priceto) => `
                with ctime as(
                    select 
                        distinct
                        a.price,
                        a.buy,
                        a.quantity,
                        a.id
                    from dbo.${tableName} a
                    where a."time">${timefrom}000 and a."time"<=${timeto}000
                    and a.price>=${pricefrom} and a.price<=${priceto}
                    order by a.id desc
                )
                select 
                a.price,
                sum(a.quantity) as volume
                from ctime a 
                group by a.price
                order by 1 asc
            `,
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