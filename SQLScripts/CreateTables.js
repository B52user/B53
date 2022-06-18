var B53CreateTablesSQL = {
    CreateMarkets:`
        CREATE TABLE IF NOT EXISTS dbo.B53Markets
        (
            id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
            name character varying(50) COLLATE pg_catalog."default" NOT NULL
        );`
    ,CreateSymbols:`
        CREATE TABLE IF NOT EXISTS dbo.B53Symbols
        (
            id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
            symbol character varying(50) COLLATE pg_catalog."default" NOT NULL,
            isfutures boolean NOT NULL
        ); 
    `
    ,CreateTradeUpload:`
        CREATE TABLE IF NOT EXISTS dbo.b53tradeupload
        (
            id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
            marketid bigint NOT NULL,
            symbolid bigint NOT NULL
        );
    `
    ,
};