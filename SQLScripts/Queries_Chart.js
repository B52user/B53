const Queries_Chart = {
    GetCandles: (tableName,timeFrameMS) => `
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
};

module.exports = Queries_Chart;