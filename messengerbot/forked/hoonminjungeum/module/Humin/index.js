/**
MIT License

Copyright (c) 2022 saroro

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. 
**/


(function(){
    function Humin(){
        let participant = [];
        let usedWord = [];
        let turn = 0;
        let assignWord = "";

        let period = 0;
        let isSearching = false;
        function reset(){
            participant = [];
            usedWord = [];
            turn = 0;
            period = 0;
            assignWord = "";
        }

        const word =["ㄱ","ㄴ","ㄷ","ㄹ","ㅁ","ㅂ","ㅅ","ㅇ","ㅈ","ㅊ"];

        function makeChosung(){  //랜덤한  초성을 생성합니다
            const len = word.length;
            assignWord += word[(Math.random()*len | 0)];
            assignWord += word[(Math.random()*len | 0)];
        }
        function removeCurrentPlayer(){ //현재 플레이어를 지웁니다
            const curpl = participant[turn];
            participant = participant.filter( (e)=> e.hash != curpl.hash);
            if(turn >= participant.length){
                turn =0;
            }
            return curpl.name;
        }
        function getChosung(str) { //단어의 초성을 얻습니다
            const cho = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
            let result = "";
            for(let i=0;i<str.length;i++) {
              code = str.charCodeAt(i)-44032;
              if(code>-1 && code<11172) result += cho[Math.floor(code/588)];
              else result += str.charAt(i);
            }
            return result;
        } 

        function sayWord(chat, str){ // 유저가 단어를 외칠 때

            const name = chat.author.name;
            const namehash = java.lang.String(name+chat.author.avatar.getBase64).hashCode();
            const currPlayer = participant[turn];
            if(currPlayer.hash === namehash ){
                if(usedWord.includes(str)){
                    chat.reply("이미 사용한 단어입니다");
                    return false;
                }
                if(getChosung(str) === assignWord){
                    const isReal = isValid(str);
                    if(isReal ==="ok"){
                        usedWord.push(str);
                        turn++;
                        turn %= participant.length;
                        if(turn ===0){
                            period++;
                        }
                        return true;
                        
                    }
                    else if(isReal ==="NotFound"){
                        chat.reply("찾을 수 없는 단어입니다");
                        return false;
                    }
                    else if(isReal === "NotNoun"){ 
                        chat.reply("명사가 아닙니다");
                        return false;
                    }
                }
                
                
            }
            
            return false;
            
        }
        function addPlayer(chat){ //참가자를 추가합니다
            const name = chat.author.name;
            const namehash = java.lang.String(name+chat.author.avatar.getBase64).hashCode();
            if(participant.some((e)=> e.name ===name && e.hash === namehash)){
                return false;
            }
            participant.push({"name" : name, "hash" : namehash});
            return true;
        }
        function getCurrentUser(){  //현재 턴 유저를 가져옵니다
            return participant[turn];
        }

        function startGame(chatData){  //겜을 시작합니다
            if(participant.length <2){
                return false;
            }
            shuffle(participant);
            makeChosung();
            return true;
        }
        function isValid(word){ // 단어가 존재하는지 검사합니다
            isSearching = true;
            let res = JSON.parse(org.jsoup.Jsoup.connect("https://saroro.dev/dict/word/"+word).ignoreContentType(true).execute().body());
            isSearching  = false;
            if(res.total === 0){
                return "NotFound"
            }
            res = res.items.filter( (e)=> e.pof === "명사" )
            if(res.length ===0){
                return "NotNoun";
            }
            return "ok";
        }
        function shuffle(array) {
            let index = array.length;
            let ranIndex = 0;
            if (index !== 0) {
                ranIndex = (Math.random() * index)|0;
                index--;
                [array[index], array[ranIndex]] = [
                    array[ranIndex], array[index]];
            }
            return array;
        }


        return {
            "reset" : ()=>reset(),
            "sayWord" : (chatData, str) => sayWord(chatData,str),
            "startGame" : (chatData) => startGame(chatData),
            "getCurrentUser" : ()=>getCurrentUser(),
            "removeCurrentPlayer" : ()=>removeCurrentPlayer(),
            "addPlayer" : (chatData)=>addPlayer(chatData),
            "getWord" : ()=>assignWord,
            "getPeriod" : ()=>period,
            "isFin" : ()=>participant.length ===1,
            "isSearching" :  ()=>isSearching,
            "getUserList" :() => participant.map( (e)=> e.name),
        }
    }

    exports.Humin = Humin


}) ();