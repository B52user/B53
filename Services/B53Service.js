class B53Service
{
    #_freq;
    Service;
    Name;
    Actions;
    LastTimeRun;
    static Srvs = [];
    constructor(name,freq){
        this.#_freq = freq;
        this.Name = name;
        this.Actions = [];
        this.LastTimeRun = new Date().getTime();
    }
    Start() {
		let that = this;
        if(this.Service!=null) this.Stop();
		this.Service = setInterval(()=>{
			for (let i = 0; i < that.Actions.length; i++) {
 			   that.Actions[i]();
			}
            that.LastTimeRun = new Date().getTime();
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