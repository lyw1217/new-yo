(function() {
    const timer = new java.util.Timer();
    let counter = 1;
    const ids = {};
    function  setTimeout(fn, delay) {
        let id = counter;
        counter += 1;
        const arg = Array.from(arguments).slice(2)
        ids[id] = new JavaAdapter(java.util.TimerTask, { 
           run : fn.apply.bind(fn,this,arg) });
        timer.schedule(ids[id], delay);
        return id;
    };

    function clearTimeout(id) {
        ids[id].cancel();
        timer.purge();
        delete ids[id];
    };

    function setInterval(fn, delay) {
        let id = counter;
        counter += 1;
        const arg = Array.from(arguments).slice(2)
        
        ids[id] = new JavaAdapter(java.util.TimerTask, { run : fn.apply.bind(fn,this,arg) });
        timer.schedule(ids[id], delay, delay);
        return id;
    };
    function  stopAll(){
    	for(let i in ids){
    	      clearTimeout(i);
          
        }
    
    
    }
    exports.setTimeout = setTimeout;
    exports.clearTimeout = clearTimeout;
    exports.setInterval = setInterval;
    exports.stopAll = stopAll;
})()