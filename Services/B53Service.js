class B53Service
{
    #_freq;
    static Srvs = [];
    constructor(name,freq){
        this.#_freq = freq;
        this.Name = name;
        this.Actions = [];
        this.LastTimeRun = new Date().getTime();
        this.Service = null;
        this.lock = false;
    }
    Start() {
		let that = this;
        if(this.Service!=null) this.Stop();
		this.Service = setInterval(async()=>{
            if(that.lock) return;
            that.lock = true;
            that.LastTimeRun = new Date().getTime();
			for (let i = 0; i < that.Actions.length; i++) {
 			   await that.Actions[i]();
			}
            that.lock = false;
		}
        , this.#_freq);
        B53Service.Srvs.push({name:this.Name,id:this.Service});
	}
	Stop() {
        B53Service.Srvs = B52Service.Srvs.filter(a=>a.id!=this.Service);
		clearInterval(this.Service);
	}
}

module.exports = B53Service;