const scriptName = "stock";
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
let room_db = Bridge.getScopeOf("comm").room_db;

let apikey = Bridge.getScopeOf("comm").apikey
let apikey_qry = Bridge.getScopeOf("comm").apikey_qry
let Lw = Bridge.getScopeOf("comm").Lw

const onStartCompile = () => {
  if (!Bridge.isAllowed("comm")) {
    Api.compile("comm");
  }
  admin = Bridge.getScopeOf("comm").getAdminUser();
  ban_sender = Bridge.getScopeOf("comm").getBanUser();
  apikey = Bridge.getScopeOf("comm").getApiKey();
};

/* https://cafe.naver.com/nameyee/32361 */
const Postposition = [['를','을'],['가','이가'], ['는','은'], ['와', '과'], ['로', '으로']];
String.prototype.postposition = function() {
    let content = this.replace( /(.)\$(.)/g, function (str, point, position) {
        if( /[ㄱ-힣]/.test(point) ) {
            const pointLen = point.normalize('NFD').split('').length;
            const find = Postposition.find( b => b[0] == position );
            if( find ) {
                return point + find[pointLen-2];
            } else return point + position;
        } else {
            return str;
        }
    })
    return content;
};

let daumstockUrl = "https://search.daum.net/search?nil_suggest=btn&w=tot&DA=SBC&q=";
let data;

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

  let run = DataBase.getDataBase(comm_db + "run");
  if (run == null) {
    DataBase.setDataBase(comm_db + "run", "t");
  }

  if (run == "t") {
    try {
      if (msg.startsWith("ㅈ")) {
        jsoup_resp = org.jsoup.Jsoup.connect(
          daumstockUrl + msg.slice(1) + "+주가"
        ).get();

        if (!jsoup_resp.select(".num_stock").isEmpty()) {
          date = new Date();
          thu = jsoup_resp.select(".img_stock > .thumb > .thumb_img").first().attr("src") + "?" + date.getSeconds().toString();
          lnk = jsoup_resp.select(".img_stock > .thumb").first().attr("href");
          hdr = jsoup_resp.select(".icon_stock").text() == "상승" ? "📈 " : "📉 " + jsoup_resp.select(".tit_company").text();
          price = jsoup_resp.select(".num_stock").first().text() +
            (jsoup_resp.select(".txt_currency").isEmpty()
              ? "원"
              : jsoup_resp.select(".txt_currency").text());
          ctx = (jsoup_resp.select(".num_rate").first().text().substr(0, 2) ==
            "상승"
            ? "▲"
            : jsoup_resp.select(".num_rate").first().text().substr(0, 2) ==
              "하락"
              ? "▼"
              : "-") + jsoup_resp.select(".num_rate").first().text().slice(2);
          
          updown_item = jsoup_resp
            .select(".wrap_stock")
            .not(".hide")
            .select(".updown_item");

          dt = updown_item.select("dt").eachText();
          dd = updown_item.select("dd").eachText();

          resp += hdr + "\n";
          resp += "💵" + price + " | ";
          resp += ctx;
          resp += Lw + "\n\n";
          for (let i = 0; i < dt.length && i < dd.length; i++) {
            resp += dt[i] + " | ";
            resp += dd[i] + "\n";
          }
          
          Bridge.getScopeOf("comm").Kakao.sendLink(
            room,
            {
              template_id: 81621,
              template_args: {
                "THU": thu,
                "LNK": lnk,
                "HDR": hdr,
                "PRICE": price,
                "CTX": ctx,
                "SP": dd[0],
                "HP": dd[1],
                "LP": dd[2],
                "VOL": dd[4],
              },
            },
            "custom"
          )
            .then((e) => {
            })
            .catch((e) => {
              replier.reply(resp);
            });
        }
      }
    } catch (error) {
      resp += "에러 발생.\n err : " + error;
    }
  }
  /*
  if (resp != "") {
    replier.reply(resp);
  }
  */
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

