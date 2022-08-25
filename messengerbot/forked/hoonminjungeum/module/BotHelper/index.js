(function() {
    function BotHelper() {
        function _sprintf() {
            return arguments[0].replace(/{(\d+)}/g, (match, p1) => arguments[+p1 + 1])
        }
        let _stack = [];
        let _prefixStack = [];

        function _escapeRegExp(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        function run(obj) {
            let regexTest;
            try{
                obj.replyf = function(){
                  this.reply(_sprintf.apply(null, arguments));
                }
            }
            catch(e){
              
            }
            for (let stk of _stack) {

                if (regexTest = obj.content.match(stk.pattern)) {
                    const res = regexTest.slice(1)
                    stk.function.apply(this, [obj].concat(res));
                }
            }
        }

        function addEvent(pattern, func) {
            let comd = _prefixStack.join("") + pattern;
            comd = comd.replace(/\(%n\+\)/g, "__number+").replace(/\(%s\+\)/g, "__string+")
            comd = comd.replace(/\(%n\*\)/g, "__number*").replace(/\(%s\*\)/g, "__string*")

            comd = _escapeRegExp(comd).replace(/__string\\+/g, "(.+)").replace(/__string\\*/g, "(.*)")
            comd = comd.replace(/__number\\+/g, "(\\s*[-+]?\\d+\\s*)").replace(/__number\\*/g, "(\\s*[-+]?\\d*)\\s*")


            _stack.push({
                "pattern": new RegExp("^" + comd + "$"),
                "function": func
            })




        }

        function addGroup(pattern, func) {
            _prefixStack.push(pattern);
            func();
            _prefixStack.pop()
        }
        return {
            "add": function(pattern, func) {
                return addEvent(pattern, func)
            },
            "run": function(obj) {
                return run(obj)
            },
            "group": function(pattern, func) {
                return addGroup(pattern, func)
            }
            
        }
    }
    exports.BotHelper = BotHelper;



})()