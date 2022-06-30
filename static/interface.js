$(()=>{
    //attach events
    $("#B53_Symbols_New").on("mouseup",()=>{
        B53_New_Symbol();
    });
    $("#B53_Symbols_Delete").on("mouseup",()=>{
        
    });
    $("#B53_Symbols_Refresh").on("mouseup",()=>{
        location.reload();
    });
    $("#b53_1000btcusdt_colapse").on("mouseup",()=>{
        if($("#b53_1000btcusdt_colapse").attr("aria-expanded")=="true")
        {
            $("#b53_1000btcusdt_body").html("Loading....");
        }
        else
        {
            fetch("/s_d?s="+"1000btcusdt")
            .then((r) => r.text())
            .then((h) => {
                $("#b53_1000btcusdt_body").html(h);
            })
            .catch((er) => {
                console.warn(er);
            });
        }
    });
})

function B53_New_Symbol(){
    //b53_newCoin
}
function B53_Delete_Symbol(){}