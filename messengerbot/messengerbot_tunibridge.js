const scriptName = "tunibridge";
/**
 * (string) room
 * (string) sender
 * (boolean) isGroupChat
 * (void) replier.reply(message)
 * (boolean) replier.reply(room, message, hideErrorToast = false) // 전송 성공시 true, 실패시 false 반환
 * (string) imageDB.getProfileBase64()
 * (string) packageName
 */

const comm_db = Bridge.getScopeOf("comm").comm_db;
const apikey_db = Bridge.getScopeOf("comm").apikey;
const admin_db = Bridge.getScopeOf("comm").admin_db;
const ban_sender_db = Bridge.getScopeOf("comm").ban_sender_db;
const room_ctx_db = Bridge.getScopeOf("comm").room_ctx_db;
const room_run_db = Bridge.getScopeOf("comm").room_run_db;

const admin = Bridge.getScopeOf("comm").admin;
const ban_sender = Bridge.getScopeOf("comm").ban_sender;
const apikey = Bridge.getScopeOf("comm").apikey;
const apikey_qry = Bridge.getScopeOf("comm").apikey_qry;
const Lw = Bridge.getScopeOf("comm").Lw;

const room_emotion_db = Bridge.getScopeOf("comm").room_emotion_db;

let data;
let emotion_flag = "false";

function responseFix(
    room,
    msg,
    sender,
    isGroupChat,
    replier,
    imageDB,
    packageName
) {
    let resp = "";

    let run = DataBase.getDataBase(Bridge.getScopeOf("comm").sprintf(Bridge.getScopeOf("comm").room_run_db, room));
    if (run == null) {
        DataBase.setDataBase(Bridge.getScopeOf("comm").sprintf(Bridge.getScopeOf("comm").room_run_db, room), "t");
    }

    if (run == "t") {

        try {
            emotion_flag = DataBase.getDataBase(Bridge.getScopeOf("comm").sprintf(Bridge.getScopeOf("comm").room_emotion_db, room));
            if (emotion_flag == "true") {
                if (!msg.startsWith("ㅇ")) {
                    replier.reply(emotion_prediction(msg));
                    return;
                }
            }
        } catch (error) {
            replier.reply("감정 분석 실패, " + String(error));
        }
        try {
            // n행시 깔끔버전 (카카오톡 봇 커뮤니티) | 밥풀 https://cafe.naver.com/nameyee/40306
            if (msg.startsWith('ㅇ엔행시 ')) {
                if (msg.startsWith("ㅇ엔행시 ")) {
                    try {
                        const user_input = msg.slice(5);

                        if (user_input.match(/^[가-힣|a-z|A-Z|]+$/g) === null) {
                            replier.reply("한글 또는 영문만 입력 가능합니다.");
                            return;
                        }

                        const jsonText = org.jsoup.Jsoup.connect("https://demo.tunib.ai/api/text/nverse")
                            .header("Content-Type", "application/json")
                            .requestBody(
                                JSON.stringify({ user_input: user_input })
                            )
                            .ignoreContentType(true).post().text();

                        const obj = JSON.parse(jsonText);

                        if (obj['error'] !== null) {
                            replier.reply('오류가 발생했습니다.' + '\u200d'.repeat(500) + '\n' + obj['error']);
                            return;
                        }

                        let str = "";

                        user_input.split('').forEach((char, index) => {
                            str += char + ": " + obj['outputs'][index];
                            if (index !== user_input.length - 1) {
                                str += '\n';
                            }
                        });

                        replier.reply(str);
                    } catch (e) {
                        replier.reply(String(e));
                    }
                }
            }

            // 사투리 번역 소스 (카카오톡 봇 커뮤니티) | archethic https://cafe.naver.com/nameyee/40313
            // source, target : 표준어, 경상도, 전라도, 강원도, 제주도, 충청도
            else if (msg.startsWith('ㅇ사투리 ')) {
                try {
                    const ref = msg.slice(5).split(' ');

                    const [source, target] = ref;
                    const dialect_input = ref.slice(2);

                    const dialect_json = org.jsoup.Jsoup.connect("https://demo.tunib.ai/api/text/dialect")
                        .header("Content-Type", "application/json")
                        .requestBody(
                            JSON.stringify({ source: source, target: target, dialect_input: dialect_input.join(' ') })
                        )
                        .ignoreContentType(true).post().text();

                    const dialect_obj = JSON.parse(dialect_json);

                    if (dialect_obj['error'] !== null) {
                        resp += ('오류가 발생했습니다.' + '\u200d'.repeat(500) + '\n' + dialect_obj['error']);
                    } else {
                        resp += (dialect_obj['outputs']);
                    }
                } catch (e) {
                    resp += String(e);
                }
            }

            // https://tunibridge.ai/emotion
            else if (msg.startsWith('ㅇ감정 ')) {
                try {
                    if (msg.slice(4).startsWith("시작")) {
                        emotion_flag = DataBase.setDataBase(Bridge.getScopeOf("comm").sprintf(room_emotion_db, room), "true");
                        resp += "다음 대화부터 감정 분석을 시작합니다.";
                    } else if (msg.slice(4).startsWith("종료")) {
                        emotion_flag = DataBase.setDataBase(Bridge.getScopeOf("comm").sprintf(room_emotion_db, room), "false");
                        resp += "감정 분석을 종료했습니다.";
                    } else if (msg.slice(4).startsWith("분석")) {
                        emotion_input = msg.slice(4);

                        resp += emotion_prediction(emotion_input);
                    }
                } catch (error) {
                    resp += String(error);
                }
            }
        } catch (error) {
            resp += "에러 발생.\n err : " + error;
        }
    }

    if (resp != "") {
        replier.reply(resp);
    }
}

function emotion_prediction(message) {
    emotions = "";

    emotion_json = org.jsoup.Jsoup.connect("https://demo.tunib.ai/api/text/emotion")
        .header("Content-Type", "application/json")
        .requestBody(
            JSON.stringify({ user_input: message })
        )
        .ignoreContentType(true).post().text();

    emotion_obj = JSON.parse(emotion_json);

    if (emotion_obj['error'] !== null) {
        emotions += ('오류가 발생했습니다.' + '\u200d'.repeat(500) + '\n' + emotion_obj['error']);
    } else {
        emotions += (emotion_obj['outputs'].join(', ').replace("_", " "));
    }

    return emotions;
}

//아래 4개의 메소드는 액티비티 화면을 수정할때 사용됩니다.
function onCreate(savedInstanceState, activity) {
    var textView = new android.widget.TextView(activity);
    textView.setText("Hello, World!");
    textView.setTextColor(android.graphics.Color.DKGRAY);
    activity.setContentView(textView);
}

function onStart(activity) { }
function onResume(activity) { }
function onPause(activity) { }
function onStop(activity) { }
const onStartCompile = () => {
    if (!Bridge.isAllowed("comm")) {
        Api.compile("comm");
    }
};

/* 냥 - 조사 변경 소스 https://cafe.naver.com/nameyee/32361 */
const Postposition = [['를', '을'], ['가', '이가'], ['는', '은'], ['와', '과'], ['로', '으로']];
String.prototype.postposition = function () {
    let content = this.replace(/(.)\$(.)/g, function (str, point, position) {
        if (/[ㄱ-힣]/.test(point)) {
            const pointLen = point.normalize('NFD').split('').length;
            const find = Postposition.find(b => b[0] == position);
            if (find) {
                if (pointLen < 2) {
                    return point + position;
                }
                return point + find[pointLen - 2];
            } else {
                return point + position;
            }
        } else {
            return str;
        }
    })

    return content;
};

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