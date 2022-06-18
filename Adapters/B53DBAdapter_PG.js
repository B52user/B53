const B53CreateTablesSQL = require('../SQLScripts/CreateTables.js');
const InsertsDefault = require('../SQLScripts/InsertDefault.js');
const Queries_Trades= require('../SQLScripts/Queries_Trades.js');

class B53DBAdapter_PG
{
    constructor(db){
        this.DB = db;
    }
}

module.exports = B53DBAdapter_PG;