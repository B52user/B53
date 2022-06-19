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
    async GetTradeUploadSymbolsByMarketName(marketName) {
        const theRes = await this.DB.query(Queries_Trades.GetTradesToUploadByMarket(marketName));
        return theRes.rows;
    }
    async GetLastTrade(marketName,symbol) {
        let tableName = "b53_" + marketName + "_" + (symbol.isfutures?"F":"S") + "_" + symbol.symbol;
        if(!this._db_table_exists(tableName)) {await this.DB.query(B53CreateTablesSQL.CreateSymbolTrade(tableName));}
    }
    async GetTradesGap(marketName,symbol,from) {

    }
    async AddTrades(marketName,symbol,trades) {

    }
    
}

module.exports = B53DBAdapter_PG;