class WSSService
{
    static Subscriptions = [];
    constructor(options)
    {
        this.Options = options;
        this.Actions = [];
        this.Subscriber = null;
        if(options.subscriber) this.Subscriber = options.subscriber;
    }
    async Start() {
        this.Subscriber().then(async(r)=>{
            for (let i = 0; i < that.Actions.length; i++) {
 			   await that.Actions[i](r);
			}
        })
        WSSService.Subscriptions.push(this);
	}
	Stop() {
        WSSService.Subscriptions = WSSService.Subscriptions.filter(a=>a.Options.name!=this.Options.name);
		//kill
	}
}

module.exports = WSSService;