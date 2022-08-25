/* 파댕리 - 오목 v2 https://cafe.naver.com/nameyee/33111 */
var line = 9;/*판 크기 설정값*/
/*
5부터 10까지 가능은 하나 10부터는 숫자가 1부터 다시 표시됩니다.
5 미만은 오목이 만들어지지 않기 때문에 사용이 불가합니다.
line에 설정한 겂에 따라 판의 크기가 결정됩니다.
9x9가 판을 출력할 때에 잘리지 않아서 편합니다.
11부터는 전체보기가 적용되어 가독성이 매우 안좋습니다.
block_arr의 말은 같은 사이즈에 한해 변경이 가능합니다.
밑의 함수부분만 잘 건들면 틱택토도 만들 수 있습니다(?). 
제작자 : 파댕리, 아래 명시된 대로 라이센스가 적용됩니다.
-> 주석 제거 금지, 상업적 이용 금지, 비상업적 배포 및 공유 가능, 도용 금지
*/
var xmok = 5;
var omokturn = 1;
var isOmokOn = false;
var access_room = ["넌센스방", "coretex"];
var omokmember = ["u"];
var usedwhere = [];
var line_arr = ["0", "1", "2"];
var block_arr = ["🟨"/*판 색*/, "⚪"/*방장 말*/, "⚫"/*참가자 말*/];
var line_number = "1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣8️⃣9️⃣0️⃣1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣8️⃣9️⃣0️⃣";
var startpan = (line_arr[0].repeat(line) + "\n").repeat(line);
function responseFix(room, msg, sender, isGroupChat, replier, imageDB, packageName) {
    if (access_room.indexOf(room) > -1) {
        function line_is(str) {
            var lh_bool = false;
            for (i = 0; i < line * line; i++) {
                if (str.substr(i).startsWith(omokturn) && str.substr(i + 1 * (line + 1)).startsWith(omokturn) && str.substr(i + 2 * (line + 1)).startsWith(omokturn) && str.substr(i + 3 * (line + 1)).startsWith(omokturn) && str.substr(i + 4 * (line + 1)).startsWith(omokturn)) return lh_bool = true;
                else if (str.substr(i).startsWith(omokturn) && str.substr(i + 1 * (line + 2)).startsWith(omokturn) && str.substr(i + 2 * (line + 2)).startsWith(omokturn) && str.substr(i + 3 * (line + 2)).startsWith(omokturn) && str.substr(i + 4 * (line + 2)).startsWith(omokturn)) return lh_bool = true;
                else if (str.substr(i + 1 * line - 1).startsWith(omokturn) && str.substr(i + 2 * line - 1).startsWith(omokturn) && str.substr(i + 3 * line - 1).startsWith(omokturn) && str.substr(i + 4 * line - 1).startsWith(omokturn) && str.substr(i + 5 * line - 1).startsWith(omokturn)) return lh_bool = true;
                else if (str.includes(String(omokturn).repeat(xmok))) lh_bool = true;
            }
            return lh_bool;
        }
        if (msg == "ㅇ오목 참가") {
            if (!isOmokOn) {
                if (omokmember.length < 2) {
                    replier.reply("방장으로 참가했습니다. 'ㅇ오목 참가'로 참가해주세요.");
                    omokmember.push(sender);
                } else if (omokmember.length < 3) {
                    if (!omokmember.includes(sender)) {
                        omokmember.push(sender);
                        replier.reply("2명이 참가해 게임을 시작합니다. " + omokmember.join(" > ").replace("u > ", "") + " 순서로 진행해주세요.\n돌 놓기 : '(가로줄번호) (세로줄번호)'\n돌 : [" + block_arr[omokturn] + "]");
                        isOmokOn = true;
                    } else replier.reply("이미 참가했습니다.");
                }
            } else replier.reply("이미 게임이 진행중입니다.");
        } else if (msg == "ㅇ오목 포기") {
            if (isOmokOn) {
                if (omokmember.includes(sender)) {
                    isOmokOn = false;
                    omokmember.splice(omokmember.indexOf(sender), 1);
                    replier.reply(omokmember.join("").substr(1) + "님의 승리입니다.");
                    startpan = (line_arr[0].repeat(line) + "\n").repeat(line);
                    omokmember = ["u"];
                    usedwhere = [];
                    omokturn = 1;
                } else replier.reply("참가자가 아닙니다.");
            } else replier.reply("진행중인 게임이 없습니다.");
        } else {
            if (isOmokOn) {
                if (omokmember.includes(sender)) {
                    if (omokmember[omokturn].includes(sender)) {
                        if ( (!isNaN(msg.split(" ")[1]) && !isNaN(msg.split(" ")[0])) && (parseInt(msg.split(" ")[1]) > 0 || parseInt(msg.split(" ")[0]) > 0 )) {
                            if (Number(msg.split(" ")[1]) <= line && Number(msg.split(" ")[0]) <= line) {
                                if (!usedwhere.includes(msg)) {
                                    usedwhere.push(msg);
                                    startpan = setblockon(startpan, Number(msg.split(" ")[0]), Number(msg.split(" ")[1]));
                                    if (!startpan.includes("0")) {
                                        isOmokOn = false;
                                        omokmember = ["u"];
                                        usedwhere = [];
                                        omokturn = 1;
                                        replier.reply(putnumber(startpan) + "\n무승부입니다.");
                                        startpan = (line_arr[0].repeat(line) + "\n").repeat(line);
                                    } else if (!line_is(startpan)) {
                                        omokturn++;
                                        if (omokturn > 2) omokturn = 1;
                                        var oturn = omokmember[omokturn];
                                        replier.reply(putnumber(startpan) + "\n" + oturn + "님의 차례입니다.\n돌 : [" + block_arr[omokturn] + "]");
                                    } else {
                                        isOmokOn = false;
                                        omokmember = ["u"];
                                        usedwhere = [];
                                        replier.reply(putnumber(startpan).split(block_arr[omokturn]).join("🔴") + "\n" + sender + "님의 승리입니다.\n돌 : [" + block_arr[omokturn] + "]");
                                        omokturn = 1;
                                        startpan = (line_arr[0].repeat(line) + "\n").repeat(line);
                                    }
                                } else replier.reply("이미 사용된 자리입니다.");
                            } else replier.reply("존재하지 않는 위치입니다.");
                        } else replier.reply("'(가로숫자) (세로숫자)' 형태만 입력 가능합니다.");
                    } else replier.reply("다른 사람의 차례입니다. 현재 차례 : " + omokmember[omokturn]);
                } else Log.d("참가자가 아닙니다. 현재 참가자 : " + omokmember.join(", "));
            } else Log.d("게임이 시작되지 않았습니다.");
        }
    }

}
function setblockon(str, x, y) {
    var blockarr = [];
    for (i = 0; i < str.length; i++) blockarr.push(str.slice(i, i + 1));
    blockarr.splice((y - 1) * (line + 1) + x - 1, 1, String(omokturn));
    return blockarr.join("");
}
function putnumber(str) {
    str = str.split("1").join("일").split("0").join("이").split("2").join("삼");
    str = "1️⃣" + str;
    for (i = 1; i < line; i++) str = str.replace("\n", "h" + line_number.slice(i * 3, (i + 1) * 3));
    var sa = str.split("h").join("\n").split("일").join(block_arr[1]).split("이").join(block_arr[0]).split("삼").join(block_arr[2]);
    return "*️⃣" + line_number.slice(0, line * 3) + "\n" + sa;
}

function onNotificationPosted(sbn, sm) {
    var packageName = sbn.getPackageName();
    if (!packageName.startsWith("com.kakao.tal")) return;
    var actions = sbn.getNotification().actions;
    if (actions == null) return;
    var userId = sbn.getUser().hashCode();
    for (var n = 0; n < actions.length; n++) {
        var action = actions[n];
        if (action.getRemoteInputs() == null) continue;
        var bundle = sbn.getNotification().extras;

        var msg = bundle.get("android.text").toString();
        var sender = bundle.getString("android.title");
        var room = bundle.getString("android.subText");
        if (room == null) room = bundle.getString("android.summaryText");
        var isGroupChat = room != null;
        if (room == null) room = sender;
        var replier = new com.xfl.msgbot.script.api.legacy.SessionCacheReplier(packageName, action, room, false, "");
        var icon = bundle.getParcelableArray("android.messages")[0].get("sender_person").getIcon().getBitmap();
        var image = bundle.getBundle("android.wearable.EXTENSIONS");
        if (image != null) image = image.getParcelable("background");
        var imageDB = new com.xfl.msgbot.script.api.legacy.ImageDB(icon, image);
        com.xfl.msgbot.application.service.NotificationListener.Companion.setSession(packageName, room, action);
        if (this.hasOwnProperty("responseFix")) {
            responseFix(room, msg, sender, isGroupChat, replier, imageDB, packageName, userId != 0);
        }
    }
}
