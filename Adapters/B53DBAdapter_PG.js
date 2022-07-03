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
            await this.DB.query(Queries_Trades.InsertTrade(tableName,t));
        }
    }
    async GetCandles(marketName,symbol,timeMS) {
        let tableName = this._db_trade_table(marketName,symbol);
        let itExists = await this._db_table_exists(tableName);
        if(!itExists) {await this.DB.query(SQL.CREATE.CreateSymbolTrade(tableName));}

        let candleRequest = await this.DB.query(SQL.SELECT.SELECT_Trades_GetCandles(tableName,timeMS));
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
    
}

module.exports = B53DBAdapter_PG;