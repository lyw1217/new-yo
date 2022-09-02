const scriptName = "newyo";
/**
 * (string) room
 * (sBridge.getScopeOf("comm").ctring) sender
 * (boolean) isGroupChat
 * (void) replier.reply(message)
 * (boolean) replier.reply(room, message, hideErrorToast = false) // 전송 성공시 true, 실패시 false 반환
 * (string) imageDB.getProfileBase64()
 * (string) packageName
 */

let comm_db = Bridge.getScopeOf("comm").comm_db;
let apikey_db = Bridge.getScopeOf("comm").apikey;
let admin_db = Bridge.getScopeOf("comm").admin_db;
let ban_sender_db = Bridge.getScopeOf("comm").ban_sender_db;
let room_ctx_db = Bridge.getScopeOf("comm").room_ctx_db;
let room_run_db = Bridge.getScopeOf("comm").room_run_db;
let subslist_db = Bridge.getScopeOf("comm").subslist_db;

const sprintf = Bridge.getScopeOf("comm").sprintf;

const subs_hour = 8;
const subs_min = 30;
let url = "http://mumeog.site:30100";
let article_qry = "/article?paper=";

let admin = Bridge.getScopeOf("comm").admin
let ban_sender = Bridge.getScopeOf("comm").ban_sender
let apikey = Bridge.getScopeOf("comm").apikey
let apikey_qry = Bridge.getScopeOf("comm").apikey_qry
let Lw = Bridge.getScopeOf("comm").Lw

function getBanUser() {
  const b = DataBase.getDataBase(ban_sender_db);
  if (b == null) {
    DataBase.setDataBase(ban_sender_db, "김지훈\n");
    ban_sender = DataBase.getDataBase(ban_sender_db).split("\n").pop();
  } else {
    ban_sender = b.split("\n");
    ban_sender.pop();
  }

  return ban_sender;
}

function getApiKey() {
  const k = DataBase.getDataBase(apikey_db);
  if (k == null) {
    Log.e("API Key is Null. Check API Key DB!!", true);
    return "";
  } else {
    apikey_qry = "&auth=" + k;
  }

  return k;
}

function sendErrorAdmin(type, msg) {
  admin = Bridge.getScopeOf("comm").getAdminUser();
  for (let a of admin) {
    Api.replyRoom(a, type + "에서 에러 발생: " + msg);
  }
}

const onStartCompile = () => {
  if (!Bridge.isAllowed("comm")) {
    Api.compile("comm");
  }
  clearInterval(INTER);

  send_flag = true;
};

/* 냥 - 조사 변경 소스 https://cafe.naver.com/nameyee/32361 */
const Postposition = [['를', '을'], ['가', '이가'], ['는', '은'], ['와', '과'], ['로', '으로']];
String.prototype.postposition = function () {
  let content = this.replace(/(.)\$(.)/g, function (str, point, position) {
    if (/[ㄱ-힣]/.test(point)) {
      const pointLen = point.normalize('NFD').split('').length;
      const find = Postposition.find(b => b[0] == position);
      if (find) {
        return point + find[pointLen - 2];
      } else return point + position;
    } else {
      return str;
    }
  })
  return content;
};

function response(
  room,
  msg,
  sender,
  isGroupChat,
  replier,
  imageDB,
  packageName
) {
  let data;
  let resp = "";
  let run = DataBase.getDataBase(sprintf(room_run_db, room));
  if (run == null) {
    DataBase.setDataBase(sprintf(room_run_db, room), "t");
  }

  if (run == "t") {
    try {
      if (msg.startsWith("ㅇ뉴스")) {
        let flag = false;
        try {
          try {
            data = Utils.parse(
              url + article_qry + "hankyung" + apikey_qry
            ).text();
            data = JSON.parse(data);
            resp = "";
            resp +=
              "[ " +
              data.contents[0].paper +
              " ]\n" + Lw +
              data.contents[0].content +
              "\n\n";
            replier.reply(resp);
            resp = "";
            flag = true;
          } catch (error) { }

          try {
            data = Utils.parse(
              url + article_qry + "maekyung" + apikey_qry
            ).text();
            data = JSON.parse(data);
            resp = "";
            resp +=
              "[ " +
              data.contents[0].paper +
              " ]\n" + Lw +
              data.contents[0].content +
              "\n\n";
            replier.reply(resp);
            resp = "";
            flag = true;
          } catch (error) { }

          try {
            data = Utils.parse(
              url + article_qry + "quicknews" + apikey_qry
            ).text();
            data = JSON.parse(data);
            resp = "";
            resp +=
              "[ " + data.contents[0].paper + " ]\n" + Lw + data.contents[0].content;
            replier.reply(resp);
            resp = "";
            flag = true;
          } catch (error) { }

          if (resp.length == 0 && flag == false) {
            resp += "오늘자 요약 뉴스가 없어요.";
          }
        } catch (error) {
          resp += "뉴스를 조회하지 못했어요.";
        }
      }

      // 한경
      else if (msg.startsWith("ㅇ한경")) {
        try {
          data = Utils.parse(
            url + article_qry + "hankyung" + apikey_qry
          ).text();
          data = JSON.parse(data);
          resp += "[한국경제 Issue Today]\n" + Lw;
          resp += data.contents[0].content;
        } catch (error) {
          resp += "뉴스를 조회하지 못했어요.";
        }
      }

      // 매경
      else if (msg.startsWith("ㅇ매경")) {
        try {
          data = Utils.parse(
            url + article_qry + "maekyung" + apikey_qry
          ).text();
          data = JSON.parse(data);
          resp += "[매일경제 매.세.지]\n" + Lw;
          resp += data.contents[0].content;
        } catch (error) {
          resp += "뉴스를 조회하지 못했어요.";
        }
      }

      // 간추린뉴스
      else if (msg.startsWith("ㅇ간추린")) {
        try {
          data = Utils.parse(
            url + article_qry + "quicknews" + apikey_qry
          ).text();
          data = JSON.parse(data);
          resp += "[간추린아침뉴스]\n" + Lw;
          resp += data.contents[0].content;
        } catch (error) {
          resp += "뉴스를 조회하지 못했어요.";
        }
      }

      // 구독
      else if (msg.startsWith("ㅇ구독")) {
        if (isGroupChat) {
          resp += "구독/구독해지는 개인톡으로 해주세요.";
        } else {
          try {
            if (
              msg.includes("해지") ||
              msg.includes("삭제") ||
              msg.includes("해제")
            ) {
              let s = DataBase.getDataBase(subslist_db);
              let subs_list = s.split("\n");
              for (var i = 0; i < subs_list.length; i++) {
                if (subs_list[i] == sender) {
                  subs_list.splice(i, 1);
                  break;
                }
              }
              DataBase.setDataBase(subslist_db, subs_list.join("\n"));
              resp += "구독을 해지했어요. ";
            } else {
              let s = DataBase.getDataBase(subslist_db);
              let subs_list = s.split("\n");
              let subs_flag = false;
              for (var j = 0; j < subs_list.length; j++) {
                if (subs_list[j] == sender) {
                  subs_flag = true;
                  break;
                }
              }
              if (subs_flag) {
                resp += "이미 구독 중이에요.";
              } else {
                DataBase.appendDataBase(subslist_db, room + "\n");
                resp +=
                  "구독했어요. 매일 아침 " +
                  subs_hour.toString() +
                  "시 " +
                  subs_min.toString() +
                  "분에 뉴스를 보내드릴게요.";
              }
            }
          } catch (error) {
            resp += "실패했어요. 다시 시도해주세요.";
            sendErrorAdmin("구독", error);
          }
        }
      }
    } catch (error) {
      resp = "에러 발생.\n err : " + error;
    }
  }

  if (resp != "") {
    replier.reply(resp);
  }
}

let send_flag = true;
let old_hour = -1;
const INTER = setInterval(() => {
  let date = new Date();
  let data;
  let resp = "";

  let cur_hour = date.getHours();
  let cur_min = date.getMinutes();
  let cur_sec = date.getSeconds();

  if (cur_sec % 5 == 0) {
    if (!Bridge.isAllowed("comm") && !Api.isCompiling("comm")) {
      try {
        Log.i("TRY API RELOAD!");
        Api.reload("comm", true);
        Log.i("API RELOAD COMPLETE!!");
      } catch (error) {
        Log.e("Api.reload Error. " + error);
      }

    }
  }

  if (cur_hour == subs_hour && cur_min == subs_min) {
    if (send_flag) {
      Log.d("구독 전송 시도");
      send_flag = false;
      try {
        try {
          data = Utils.parse(
            url + article_qry + "hankyung" + apikey_qry
          ).text();
          data = JSON.parse(data);
          resp = "";
          resp +=
            "[ " +
            data.contents[0].paper +
            " ]\n" + Lw +
            data.contents[0].content +
            "\n\n";
          replier.reply(resp);
          resp = "";
          flag = true;
        } catch (error) { }

        try {
          data = Utils.parse(
            url + article_qry + "maekyung" + apikey_qry
          ).text();
          data = JSON.parse(data);
          resp = "";
          resp +=
            "[ " +
            data.contents[0].paper +
            " ]\n" + Lw +
            data.contents[0].content +
            "\n\n";
          replier.reply(resp);
          resp = "";
          flag = true;
        } catch (error) { }

        try {
          data = Utils.parse(
            url + article_qry + "quicknews" + apikey_qry
          ).text();
          data = JSON.parse(data);
          resp = "";
          resp +=
            "[ " + data.contents[0].paper + " ]\n" + Lw + data.contents[0].content;
          replier.reply(resp);
          resp = "";
          flag = true;
        } catch (error) { }

        if (resp.length > 0) {
          let ssl = DataBase.getDataBase(subslist_db);
          let subs_send_list = ssl.split("\n");
          for (let ss of subs_send_list) {
            let canrpy = Api.canReply(ss)
            Log.d(ss + "에게 구독 전송 가능 여부 :" + canrpy.toString());
            if (canrpy) {
              Log.d(ss + "에게 구독 전송 성공 여부 : " + Api.replyRoom(ss, resp, true).toString());
            }
          }
        }
      } catch (error) {
        Log.e("전송 실패");
        resp = "";
      }
    }
  }

  if (date.getHours() == subs_hour && date.getMinutes() == subs_min + 1) {
    send_flag = true;
  }
}, 1000);

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

/* Dark Tornado - https://cafe.naver.com/nameyee/39192 */
/*
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
*/