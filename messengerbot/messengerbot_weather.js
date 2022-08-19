const scriptName = "weather";
/**
 * (string) room
 * (string) sender
 * (boolean) isGroupChat
 * (void) replier.reply(message)
 * (boolean) replier.reply(room, message, hideErrorToast = false) // 전송 성공시 true, 실패시 false 반환
 * (string) imageDB.getProfileBase64()
 * (string) packageName
 */

let comm_db = Bridge.getScopeOf("comm").comm_db;
let apikey_db = Bridge.getScopeOf("comm").apikey;
let room_ctx_db = Bridge.getScopeOf("comm").room_ctx_db;
let room_run_db = Bridge.getScopeOf("comm").room_run_db;

let apikey = Bridge.getScopeOf("comm").apikey
let apikey_qry = Bridge.getScopeOf("comm").apikey_qry
let Lw = Bridge.getScopeOf("comm").Lw

const onStartCompile = () => {
  if (!Bridge.isAllowed("comm")) {
    Api.compile("comm");
  }
  apikey = Bridge.getScopeOf("comm").getApiKey();
};

/* https://cafe.naver.com/nameyee/32361 */
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

/*
input : array | split된 키워드 문자열 배열
return : object | {array 파싱된 키워드, string 응답 문자열}
응답 문자열의 길이가 0 보다 큰 경우 키워드 파싱 오류
*/
function parseKeywords(input) {
  let k = ["", "", ""];
  let response_data = "";

  switch (input.length) {
    case 5:
      if (!input[3].includes("날씨")) {
        k[2] = input[3];
      }

    case 4:
      if (!input[2].includes("날씨")) {
        k[1] = input[2];
      }
    case 3:
      if (!input[1].includes("날씨")) {
        k[0] = input[1];
      }
      break;
    default:
      response_data += "키워드를 올바르게 입력해주세요.";
      break;
  }

  return {
    k: k,
    response_data: response_data
  };
}

function responseFix(
  room,
  msg,
  sender,
  isGroupChat,
  replier,
  imageDB,
  packageName
) {
  const url = "http://mumeog.site:30100";
  const weather_qry = "/weather?";
  let data;
  let resp = "";

  let run = DataBase.getDataBase(Bridge.getScopeOf("comm").parse(Bridge.getScopeOf("comm").room_run_db, room));
  if (run == null) {
    DataBase.setDataBase(Bridge.getScopeOf("comm").parse(Bridge.getScopeOf("comm").room_run_db, room), "t");
  }

  if (run == "t") {
    try {
      if (msg.startsWith("ㅇ지금") && msg.includes("날씨")) {
        const input_now_keywords = msg.split(" ");
        if (input_now_keywords.length < 3) {
          return;
        }
        let keywords = parseKeywords(input_now_keywords);
        resp += keywords.response_data;

        if (keywords.response_data.length == 0) {
          const tod_params =
            "k1=" +
            keywords.k[0] +
            "&k2=" +
            keywords.k[1] +
            "&k3=" +
            keywords.k[2] +
            "&p=0";
          try {
            data = Utils.parse(url + weather_qry + tod_params + apikey_qry).text();
            resp += data.split("@").join("\n");
          } catch (error) {
            resp += "지역을 찾지 못했습니다.";
          }
        }
      } else if (msg.includes("ㅇ예보")) {
        const input_fcst_keywords = msg.split(" ");

        if (input_fcst_keywords.length > 1) {
          try {
            data = Utils.parse(
              url + weather_qry + "mid=" + input_fcst_keywords[1] + apikey_qry
            ).text();
            split_data = data.split("@");
            split_data.splice(1, 0, Lw);
            resp += split_data.join("\n");
          } catch (error) {
            resp += "'ㅇ예보' 를 입력해서 지역을 확인해보세요.";
            Log.d(error, true);
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