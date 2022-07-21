const SQL = require('../SQLScripts/SQL.js');
const B53Settings = require('../B53Settings.js');
const {Client} = require('pg');

class B53DBAdapter_PG
{
    constructor(db=null){
        /*if(db)
        {
            this.DB = db;
        }
        else
        {
            const connectionString = B53Settings.pg_connection_string;
            this.DB = new Client({connectionString});
            this.DB.connect();
        }*/
        const connectionString = B53Settings.pg_connection_string;
        this.DB = new Client({connectionString});
        this.DB.connect();
    }
    async _db_table_exists(name) {
        const eQuery = `
            SELECT EXISTS (
                SELECT FROM 
                    pg_tables
                WHERE 
                    schemaname = 'dbo' AND 
                    tablename  = '${name.toLowerCase()}'
                );
        `;
        let res = await this.DB.query(eQuery);
        return res.rows[0].exists;
    }
    _db_trade_table(marketName,symbol) {return "b53_" + marketName + "_" + (symbol.isfutures?"F":"S") + "_" + symbol.symbol;}

    async GetTradesGap(marketName,symbol,from) {
        let tableName = this._db_trade_table(marketName,symbol);
        let itExists = await this._db_table_exists(tableName);
        if(!itExists) {await this.DB.query(SQL.CREATE.CreateSymbolTrade(tableName));}

        let resTo = await this.DB.query(SQL.SELECT.SELECT_Trades_GetGapTo(tableName,from));
        let toReturn = {to:null};
        if(resTo.rowCount==1) {
            toReturn.to = resTo.rows[0].id;
            toReturn.toTime = resTo.rows[0].time;
            let resFrom = await this.DB.query(SQL.SELECT.SELECT_Trades_GetGapFrom(tableName,from,toReturn.to));
            if(resFrom.rowCount==1){
                toReturn.from = resFrom.rows[0].id;
            }
        }
        return toReturn;
    }
    async AddTrades(marketName,symbol,trades) {
        let tableName = this._db_trade_table(marketName,symbol);
        let itExists = await this._db_table_exists(tableName);
        if(!itExists) {await this.DB.query(SQL.CREATE.CreateSymbolTrade(tableName));}

        for (const t of trades) {
            await this.DB.query(SQL.INSERT.INSERT_Trade(tableName,t));
        }
    }
    async GetCandles(marketName,symbol,timeMS,timeFrom=null) {
        let tableName = this._db_trade_table(marketName,symbol);
        let itExists = await this._db_table_exists(tableName);
        if(!itExists) {await this.DB.query(SQL.CREATE.CreateSymbolTrade(tableName));}

        let candleRequest = await this.DB.query(SQL.SELECT.SELECT_Trades_GetCandles(tableName,timeMS,timeFrom));
        let toReturn = [];
        candleRequest.rows.forEach((r)=>{
            toReturn.push({
                time: r.candletime, 
                open: parseFloat(r.startprice), 
                high: parseFloat(r.maxshadow), 
                low: parseFloat(r.minshadow), 
                close: parseFloat(r.endprice)
            });
        });
        return toReturn;
    }

    async GetIndicator_Volume(marketName,symbol,timeMS,timeFrom=null) {
        let tableName = this._db_trade_table(marketName,symbol);
        let itExists = await this._db_table_exists(tableName);
        if(!itExists) {await this.DB.query(SQL.CREATE.CreateSymbolTrade(tableName));}

        let candleRequest = await this.DB.query(SQL.SELECT.SELECT_Trades_GetVolumes(tableName,timeMS,timeFrom));
        let toReturn = [];
        candleRequest.rows.forEach((r)=>{
            toReturn.push({
                time: r.candletime, 
                value: parseFloat(r.volume)
            });
        });
        return toReturn;
    }

    async GetIndicator_SellVolume(marketName,symbol,timeMS,timeFrom=null) {
        let tableName = this._db_trade_table(marketName,symbol);
        let itExists = await this._db_table_exists(tableName);
        if(!itExists) {await this.DB.query(SQL.CREATE.CreateSymbolTrade(tableName));}

        let candleRequest = await this.DB.query(SQL.SELECT.SELECT_Trades_GetSellVolumes(tableName,timeMS,timeFrom));
        let toReturn = [];
        candleRequest.rows.forEach((r)=>{
            toReturn.push({
                time: r.candletime, 
                value: parseFloat(r.volume)
            });
        });
        return toReturn;
    }

    async GetIndicator_TradeFreq(marketName,symbol,timeMS,timeFrom=null) {
        let tableName = this._db_trade_table(marketName,symbol);
        let itExists = await this._db_table_exists(tableName);
        if(!itExists) {await this.DB.query(SQL.CREATE.CreateSymbolTrade(tableName));}

        let candleRequest = await this.DB.query(SQL.SELECT.SELECT_Trades_GetFreq(tableName,timeMS,timeFrom));
        let toReturn = [];
        candleRequest.rows.forEach((r)=>{
            toReturn.push({
                time: r.candletime, 
                value: parseInt(r.countdown)
            });
        });
        return toReturn;
    }
    async GetIndicator_VirtVolume(marketName,symbol,fromTimeCandle,toTimeCandle,fromPrice,toPrice,priceTick,precision) {
        let tableName = this._db_trade_table(marketName,symbol);
        let itExists = await this._db_table_exists(tableName);
        if(!itExists) {await this.DB.query(SQL.CREATE.CreateSymbolTrade(tableName));}

        let candleRequest = (await this.DB.query(SQL.SELECT.SELECT_Trades_VertVolume(tableName,fromTimeCandle,toTimeCandle,fromPrice,toPrice))).rows;
        let candlesConverted = candleRequest.map(a=>({price:parseFloat(a.price).toFixed(precision),volume:parseFloat(a.volume)}));
        let volmax = Math.max(...candlesConverted.map(a=>a.volume));
        let toReturn = [];
        for(let i=parseFloat(fromPrice);i<=parseFloat(toPrice);i=i+parseFloat(priceTick)) {
            let currVolO = candlesConverted.find(a=>a.price==i.toFixed(precision));
            let currVol = currVolO?currVolO.volume:0;
            if(!currVol) currVol = 0;
            toReturn.push({
                price:i.toFixed(precision),
                prec:100-(Math.round(100*currVol/volmax))
            });
        }
        return toReturn;
    }
    async GetLastCandle(marketName,symbol,timeMS) {
        let tableName = this._db_trade_table(marketName,symbol);
        let itExists = await this._db_table_exists(tableName);
        if(!itExists) {await this.DB.query(SQL.CREATE.CreateSymbolTrade(tableName));}

        let candle = (await this.DB.query(SQL.SELECT.SELECT_Trades_GetLastCandle(tableName,timeMS))).rows[0];
        return {
                time: candle.candletime, 
                open: parseFloat(candle.startprice), 
                high: parseFloat(candle.maxshadow), 
                low: parseFloat(candle.minshadow), 
                close: parseFloat(candle.endprice)
        };
    }

    async InsertUpdateSymbols(marketName,symbolsInfo) {
        let marketid = await this.DB.query("select id from dbo.b53markets where name='"+marketName+"'");
        for (const s of symbolsInfo) {
            let query = SQL.INSERT.INSERT_UPDATE_Symbol(marketid.rows[0].id,s);
            await this.DB.query(query);
        }
    }

    async GetMarkets() {
        let markets = await this.DB.query("select * from dbo.b53markets");
        return markets.rows;
    }

    async GetSymbolsByTypeAndMarket(martketName,isfutures){
        let symbols = await this.DB.query(SQL.SELECT.SELECT_Symbol_ByTypeAndMarket(martketName,isfutures));
        return symbols.rows;
    }

    async Update(table,id,payload){
        let quert = SQL.UPDATE.Update(table,id,payload);
        await this.DB.query(quert);
    }

    async GetActiveSymbols(){
        let query = `select a.* from dbo.b53symbols a where a.ismainlist=true order by a.symbol asc`;
        let res = await this.DB.query(query);
        return res.rows;
    }

    async GetSymbolById(id){
        let query = `
        select
            b.name as marketname,
            c.symbol as pairname,
            a.*
        from dbo.b53symbols a inner join dbo.b53markets b
        on a.market = b.id
        left join dbo.b53symbols c on a.pair = c.id
        where a.id = ${id};
        `;
        let res = await this.DB.query(query);
        return res.rows[0];
    }

    async GetLastTrade(marketName,symbol){
        let tableName = this._db_trade_table(marketName,symbol);
        let itExists = await this._db_table_exists(tableName);
        if(!itExists) {await this.DB.query(SQL.CREATE.CreateSymbolTrade(tableName));}
        let lastTrade = await this.DB.query(`
            select *
            from dbo.${tableName}
            order by id desc
            limit 1
        `);
        if(lastTrade.rowCount==0) return {
            id:0
        };
        return lastTrade.rows[0];
    }
    
}

module.exports = B53DBAdapter_PG;