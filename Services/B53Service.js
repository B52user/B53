class B53Service
{
    #_freq;
    #_service;
    #_name;
    Actions;
    LastTimeActive;
    static Srvs = [];
    constructor(name,freq){
        this.#_freq = freq;
        this.#_name = name;
        this.Actions = [];
        this.LastTimeActive = new Date().getTime();
    }
    Start() {
		let that = this;
        if(this.#_service!=null) this.Stop();
		this.#_service = setInterval(()=>{
			for (let i = 0; i < that.Actions.length; i++) {
 			   that.Actions[i]();
			}
            that.LastTimeActive = new Date().getTime();
		}
        , this.#_freq);
        B52Service.Srvs.push({name:this.#_name,id:this.#_service});
	}
	Stop() {
        B52Service.Srvs = B52Service.Srvs.filter(a=>a.id!=this.#_service);
		clearInterval(this.#_service);
	}
}