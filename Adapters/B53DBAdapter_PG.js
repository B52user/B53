const B53CreateTablesSQL = require('../SQLScripts/CreateTables.js');
const InsertsDefault = require('../SQLScripts/InsertsDefault.js')
const Queries_Trades= require('../SQLScripts/Queries_Trades.js');
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
        this._db_check_create();
    }
    async _db_table_exists(name) {
        const eQuery = `
            SELECT EXISTS (
                SELECT FROM 
                    pg_tables
                WHERE 
                    schemaname = 'dbo' AND 
                    tablename  = '${name}'
                );
        `;
        let res = await this.DB.query(eQuery);
        return res.rows[0].exists;
    }
    async _db_check_create() {
        if(!this._db_table_exists("b53markets")) {await this.DB.query(B53CreateTablesSQL.CreateMarkets);await this.DB.query(InsertsDefault.MarketsDefaults);}
        if(!this._db_table_exists("b53symbols")) {await this.DB.query(B53CreateTablesSQL.CreateSymbols);await this.DB.query(InsertsDefault.SymbolsDefault);}
        if(!this._db_table_exists("b53tradeupload")) {await this.DB.query(B53CreateTablesSQL.CreateTradeUpload);await this.DB.query(InsertsDefault.TradeUploadDefault);}
    }
    _db_trade_table(marketName,symbol) {return "b53_" + marketName + "_" + (symbol.isfutures?"F":"S") + "_" + symbol.symbol;}

    async GetTradeUploadSymbolsByMarketName(marketName) {
        const theRes = await this.DB.query(Queries_Trades.GetTradesToUploadByMarket(marketName));
        return theRes.rows;
    }
    async GetLastTrade(marketName,symbol) {
        let tableName = this._db_trade_table(marketName,symbol);
        let itExists = await this._db_table_exists(tableName);
        if(!itExists) {await this.DB.query(B53CreateTablesSQL.CreateSymbolTrade(tableName));}
        let lastTrade = await this.DB.query(Queries_Trades.GetLastTrade(tableName));
        if(lastTrade.rowCount==0) return {
            id:0
        };
        return lastTrade.rows[0];
    }
    async GetTradesGap(marketName,symbol,from) {

    }
    async AddTrades(marketName,symbol,trades) {
        let tableName = this._db_trade_table(marketName,symbol);
        let itExists = await this._db_table_exists(tableName);
        if(!itExists) {await this.DB.query(B53CreateTablesSQL.CreateSymbolTrade(tableName));}

        trades.forEach(async(t) => {
            await this.DB.query(Queries_Trades.InsertTrade(tableName,t));
        });
    }
    
}

module.exports = B53DBAdapter_PG;