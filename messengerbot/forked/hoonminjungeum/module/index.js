
let {Humin} = require("Humin");
Humin = new Humin();
const Timer = require("Timer");
const {BotHelper} = require("BotHelper");
const router =new BotHelper();
const BOT = BotManager.getCurrentBot();


let  state = 0;
let roomKeeper = "";
let timerTime = 0;
function reset(){
    state = 0;
    roomKeeper = "";
    Humin.reset();
    Timer.stopAll();
    timerTime = 0;
}
const GAME_TIMER_OUT = 15;

router.group("/훈민정음 ", ()=>{
    router.add("만들기", (chat)=>{
        if(roomKeeper !== ""){
            chat.reply("이미 방이 있어여");
            return
        }
        roomKeeper = chat.author.name;
        Humin.addPlayer(chat);
        chat.reply("방을 만들었어요\n참가를 원하시면 '/훈민정음 참가'를 해주세요\n시작하려면 '/훈민정음 시작'을 해주세요");
    });
    router.add("취소", (chat)=>{
        if(roomKeeper !== ""){
            if(chat.author.name === roomKeeper){
                reset();
                chat.reply("취소했어요");
                return;
            }
            chat.reply("방장만 취소 가능해요");
        }
        else{
            chat.reply("방이 없네요");
        }

        

    });
    router.add("참가" ,(chat)=>{
        if(state !==0) return;
        if(roomKeeper !== ""){
            const res = Humin.addPlayer(chat);
            if(res){
                chat.reply(chat.author.name+"님이 참가하셨습니다");
            }
            else{
                chat.reply("이미 참가하였습니다");
            }
        }
        else{
            chat.reply("참가할 방이 없어요")
        }

    });
    router.add("시작", (chat)=>{
        if(roomKeeper === chat.author.name){
            if(state === 0){
                const res = Humin.startGame(chat);
                if(res){
                    Timer.setInterval(() => {
                        let unitlTime = GAME_TIMER_OUT - ((Humin.getPeriod()/2) |0);
                        if(unitlTime  < 7){
                            unitlTime = 7;
                        }
                        if(timerTime > unitlTime && !Humin.isSearching()){
                            let banPlayer = Humin.removeCurrentPlayer();
                            if(Humin.getUserList().length <2){
                                chat.reply(banPlayer+"님 탈락");
                                chat.reply(Humin.getCurrentUser().name+"님 최후의 1인 축하드립니다");
                                reset();
                                return;
                            }
                            timerTime =0;
                            chat.reply(banPlayer+"님 탈락 \n다음 차례는 "+Humin.getCurrentUser().name+"님 차례입니다");
                        }
                        else if(timerTime == unitlTime -5){
                            chat.reply("5초 남았습니다");
                        }
                        timerTime++;
                    }, 1000);
                    const assignWord = Humin.getWord();
                    const currentPlayer =Humin.getCurrentUser();
                    chat.reply("제시어는 "+assignWord+"입니다\n순서 : "+   Humin.getUserList().join(",")+"\n"+currentPlayer.name+"님 부터 시작입니다");
                    state = 1;
                }
                else{
                    chat.reply("한명에선 시작할 수 없습니다");
                }
    
            }
            else{
                chat.reply("이미 시작되어있네요");
            }
        }

    })

})
router.add(".(%s+)", (chat, str)=>{
    if(state ===1){
        str = ""+str;
        const res = Humin.sayWord(chat,str);
        if(res){
            timerTime = 0;
            chat.reply(chat.author.name+"님 통과 \n"+Humin.getCurrentUser().name+"님 차례입니다");
        }
    }
});


function onMessage(msg) {
    router.run(msg);
}
BOT.addListener(Event.MESSAGE, onMessage);
BOT.addListener(Event.START_COMPILE,  Timer.stopAll)