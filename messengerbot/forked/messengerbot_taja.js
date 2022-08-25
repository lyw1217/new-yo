// White Tornado, 타자게임 https://cafe.naver.com/nameyee/32932
var taja_gameon = false;
var taja_wordpush = null;
var taja_sentence = null;
var ta_s = null;
var player = null;
var taja_soonwi = { "8": [], "20": [], "35": [] };

function taja_word(a) {
    var taja_list = [];
    for (ta = 0; ta < a; ta++) {
        var ta_num = Math.floor(Math.random() * 11171) + 44032;
        taja_list.push(String.fromCharCode(ta_num));
    }

    return taja_list;
}

function responseFix(room, msg, sender, isGroupChat, replier, imageDB, packageName) {
    if (msg.startsWith("ㅇ타자 ") && !msg.endsWith("포기")) {
        if (!taja_gameon) {
            if (player == null) {
                switch (msg.substr(4)) {
                    case "쉬움":
                        taja_sentence = taja_word(8);
                        replier.reply(sender + "님의 제시 문장 : " + taja_sentence.join("\u200b"));
                        ta_s = Date.now();
                        player = sender;
                        taja_gameon = true;
                        break;

                    case "보통":
                        taja_sentence = taja_word(20);
                        replier.reply(sender + "님의 제시 문장 : " + taja_sentence.join("\u200b"));
                        ta_s = Date.now();
                        player = sender;
                        taja_gameon = true;
                        break;

                    case "어려움":
                        taja_sentence = taja_word(35);
                        replier.reply(sender + "님의 제시 문장 : " + taja_sentence.join("\u200b"));
                        ta_s = Date.now();
                        player = sender;
                        taja_gameon = true;
                        break;

                    default: replier.reply("난이도는 쉬움/보통/어려움 선택 가능합니다.\nex) ㅇ타자 보통");
                        break;
                }
            } else replier.reply("이미 게임이 진행중입니다.");
        } else replier.reply("다른 참가자가 진행중입니다.");
    }

    if (taja_gameon && sender == player && !msg.startsWith("ㅇ타자 ")) {
        if (msg == taja_sentence.join("")) {
            var ta_s1 = Date.now();
            var ta_s2 = ((ta_s1 - ta_s) / 1000);
            replier.reply("정답입니다! 게임을 종료합니다.\n응답 시간 : " + ta_s2 + "초");
            if (Number(taja_soonwi[String(msg.length)]) <= ta_s2) {
                taja_soonwi[String(msg.length)] = [ta_s2];
                replier.reply("현재 기록 1등입니다.");
            }
            taja_gameon = false;
            taja_wordpush = null;
            taja_sentence = null;
            player = null;
            ta_s = null;
        } else replier.reply("틀렸습니다!");
    }

    if (msg == "ㅇ타자 포기") {
        if (taja_gameon) {
            if (sender == player || Bridge.getScopeOf("comm").isAdmin(sender)) {
                taja_gameon = false;
                taja_wordpush = null;
                taja_sentence = null;
                player = null;
                ta_s = null;
                replier.reply("타자게임이 종료되었습니다.");
            } else replier.reply("참가자가 아닙니다.");
        } else replier.reply("진행중인 타자게임이 없습니다.");
    }
}



/* Dark Tornado - https://cafe.naver.com/nameyee/39192 */
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
        var replier = new com.xfl.msgbot.script.api.legacy.SessionCacheReplier(
            packageName,
            action,
            room,
            false,
            ""
        );
        var icon = bundle
            .getParcelableArray("android.messages")[0]
            .get("sender_person")
            .getIcon()
            .getBitmap();
        var image = bundle.getBundle("android.wearable.EXTENSIONS");
        if (image != null) image = image.getParcelable("background");
        var imageDB = new com.xfl.msgbot.script.api.legacy.ImageDB(icon, image);
        com.xfl.msgbot.application.service.NotificationListener.Companion.setSession(
            packageName,
            room,
            action
        );
        if (this.hasOwnProperty("responseFix")) {
            responseFix(
                room,
                msg,
                sender,
                isGroupChat,
                replier,
                imageDB,
                packageName,
                userId != 0
            );
        }
    }
}
