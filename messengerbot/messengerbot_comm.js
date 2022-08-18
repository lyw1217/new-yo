const scriptName = "comm";
/**
 * (string) room
 * (string) sender
 * (boolean) isGroupChat
 * (void) replier.reply(message)
 * (boolean) replier.reply(room, message, hideErrorToast = false) // 전송 성공시 true, 실패시 false 반환
 * (string) imageDB.getProfileBase64()
 * (string) packageName
 */

let db_root = "newyo/db/";
let comm_db = db_root + "comm/";
let apikey_db = comm_db + "apikey";
let admin_db = db_root + "comm/admin";
let ban_sender_db = db_root + "comm/ban_sender";
let room_db = db_root + "room/";

/* newyo */
let subslist_db = db_root + "subslist";

/* stock */
let kakao_apikey_db = comm_db + "kakao_apikey";
let kakao_email_db = comm_db + "kakao_email";
let kakao_passwd_db = comm_db + "kakao_passwd";
const kakaoApiKey = getKakaoApiKey();
const kakaoEmail = getKakaoEmail();
const kakaoPasswd = getKakaoPasswd();

/* fun */
let fun_db = db_root + "fun/";
let learn_db = db_root + "learn/";
let learn_db_list = db_root + "learn_list/words";

let admin = getAdminUser();
let ban_sender = getBanUser();
let apikey = getApiKey();

let Lw = '\u200b'.repeat(500);

function isAdmin(sender) {
  admin = getAdminUser();

  if (admin.indexOf(sender.trim()) > -1) {
    return true;
  }
  return false;
}

function isBanned(sender) {
  ban_sender = getBanUser();

  if (ban_sender.indexOf(sender) > -1) {
    return true;
  }
  return false;
}

function getAdminUser() {
  const a = DataBase.getDataBase(admin_db);
  if (a == null) {
    DataBase.setDataBase(admin_db, "master\n");
    admin = DataBase.getDataBase(admin_db).split("\n").pop();
  } else {
    admin = a.split("\n");
    admin.pop();
  }
  return admin;
}

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


function getKakaoApiKey() {
    const k = DataBase.getDataBase(kakao_apikey_db);
    if (k == null) {
      Log.e("Kakao API Key is Null. Check API Key DB!!", true);
      return "";
    }
    return k.replace(/[\n\t\r]/g, "");
  }
  
  function getKakaoEmail() {
    const k = DataBase.getDataBase(kakao_email_db);
    if (k == null) {
      Log.e("Kakao Email is Null. Check Email DB!!", true);
      return "";
    }
    return k.replace(/[\n\t\r]/g, "");
  }
  
  function getKakaoPasswd() {
    const k = DataBase.getDataBase(kakao_passwd_db);
    if (k == null) {
      Log.e("Kakao Passwd is Null. Check Passwd DB!!", true);
      return "";
    }
    return k.replace(/[\n\t\r]/g, "");
  }

const onStartCompile = () => {
    a = DataBase.getDataBase(admin_db);
    if (a == null) {
      DataBase.setDataBase(admin_db, "master\n");
    }
    admin = a.split("\n");
  
    b = DataBase.getDataBase(ban_sender_db);
    if (b == null) {
      DataBase.setDataBase(ban_sender_db, "김지훈\n");
    } else {
      ban_sender = b.split("\n");
    }
    
    apikey = getApiKey();
    kakaoApiKey = getKakaoApiKey();
    kakaoEmail = getKakaoEmail();
    kakaoPasswd = getKakaoPasswd();
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

let kimchi_count = 0;

function printMainHelp() {
  let temp_str = "";
  temp_str += "--------  영우로봇 기능  -------\n\u200b";
  temp_str += "  1. 일일 요약 뉴스 조회 기능\n";
  temp_str += "  2. 지금 날씨 조회 기능\n";
  temp_str += "  3. 소소한 기능들\n";
  temp_str += "--------------------------------\n";
  temp_str += "  'ㅇ기능 (숫자)'로 자세한 설명을 볼 수 있어요.\n";
  temp_str += "  'ㅇ그만', 'ㅇ시작'으로 로봇을 멈추거나 시작할 수 있어요.";
  return temp_str;
}

function printNewsHelp() {
  let temp_str = "";
  temp_str += "------------  뉴스  ------------\n\u200b";
  temp_str += "◻ 'ㅇ뉴스'\n\t 전체 조회\n";
  temp_str += "◻ 'ㅇ한경'\n\t 한국경제 Issue Today 조회\n";
  temp_str += "◻ 'ㅇ매경'\n\t 매일경제 매.세.지 조회\n";
  temp_str += "◻ 'ㅇ간추린'\n\t 간추린뉴스 조회\n";
  temp_str += "--------------------------------\n";
  temp_str += "◻ 'ㅇ구독'\n\t 개인톡으로 매일 8시 30분에 뉴스를 제공\n";
  temp_str += "◻ 'ㅇ구독해제'\n\t 뉴스 구독 해제";

  return temp_str;
}

function printWeatherHelp() {
  let temp_str = "";
  temp_str += "------------  날씨  ------------\n\u200b";
  temp_str += "현재 시간을 기준으로 날씨 정보를 알려줍니다.\n";
  temp_str += "◻ 'ㅇ지금 (동네) 날씨'\n    지금 날씨 조회\n";
  temp_str += "◻ 'ㅇ예보 (지역)'\n    오늘의 기상 예보 조회\n";
  //temp_str += "'ㅇ오늘 (동네) 날씨'\n\t - 오늘 날씨 조회(미지원)\n";
  //temp_str += "'ㅇ내일 (동네) 날씨'\n\t - 내일 날씨 조회(미지원)\n";
  temp_str += "[예시]\n";
  temp_str += "  ㅇ지금 서현 날씨\n";
  temp_str += "  ㅇ예보 서울\n";
  //temp_str += "\tㅇ오늘 성남 분당 날씨(미지원)\n";
  //temp_str += "\tㅇ내일 경기 하남 위례 날씨(미지원)\n";
  temp_str += "--------------------------------\n";
  temp_str += "띄어쓰기로 명령어와 동네 키워드들을 구분해주세요.\n";
  temp_str += "동네 키워드는 최대 3개까지 가능합니다.\n";
  temp_str += "예보 제공사 : 기상청";

  return temp_str;
}

function printFcstHelp() {
  let temp_str = "";
  temp_str += "------------  예보  ------------\n\u200b";
  temp_str += "오늘의 기상 중기 예보를 알려줍니다.\n";
  temp_str += "◻ 'ㅇ예보 (지역)'\n\t  오늘의 기상 예보 조회\n";
  temp_str += "[예시]\n";
  temp_str += "  ㅇ예보 서울\n";
  temp_str += "--------------------------------\n";
  temp_str += "띄어쓰기로 명령어와 지역 키워드를 구분해주세요.\n";
  temp_str += "지역 : 전국, 서울, 경기, 강원\n";
  temp_str += "       충북, 대전, 세종, 충남\n";
  temp_str += "       전북, 광주, 전남, 대구\n";
  temp_str += "       경북, 부산, 울산, 경남\n";
  temp_str += "       제주\n";

  return temp_str;
}

function printFunHelp() {
  let temp_str = "";
  temp_str += "------------  소소  ------------\n"; 
  temp_str += "◻ 'ㅇ로또' : 최근 로또 당첨번호 조회\n";
  temp_str += "    'ㅇ로또 생성' : 랜덤 번호 생성\n";
  temp_str += "◻ 'ㅇ가르치기' : 단어 가르치기\n";
  temp_str += "    'ㅇ가르치기 A=B' : A는 B라고 가르치기\n";
  temp_str += "◻ 'ㅇ학습제거' : 가르친 단어 잊게 하기\n";
  temp_str += "    'ㅇ학습제거 A' : A라고 가르친 단어 제거\n";
  temp_str += "◻ 'ㅇ로마' : 한글 인명-로마자 변환\n";
  temp_str += "    'ㅇ로마 (이름)' : 한글 이름을 로마자로 변환\n";
  temp_str += "◻ 'ㅇ번역' : 파파고 번역(하루 10,000자 제한)\n";
  temp_str += "    'ㅇ번역 (텍스트)' : 파파고 자동 번역\n";
  temp_str += "◻ 'ㅇ오점무' : 오늘 점심 뭐먹을지 추천\n";
  temp_str += "    'ㅇ오점무 (지역/건물명)' : 반경 500미터 내 맛집 추천\n";
  temp_str += "◻ 'ㅇ운세' : 오늘 운세 조회\n";
  temp_str += "    'ㅇ운세 (띠/별자리)' : 띠/별자리 오늘의 운세 조회\n";

  return temp_str;
}

function printOjeomMuHelp() {
  let temp_str = "";
  temp_str += "------  오점무 카테고리  ------\n";
  temp_str += "◻ 아무거나\t\t\t◻ 한식\n";
  temp_str += "◻ 중식\t\t\t\t\t◻ 일식\n";
  temp_str += "◻ 양식\t\t\t\t\t◻ 분식\n";
  temp_str += "◻ 아시아음식\t\t◻ 도시락\n";
  temp_str += "◻ 육류 / 고기\t\t◻ 치킨\n";
  temp_str += "◻ 패스트푸드\t\t◻ 술집\n";
  temp_str += "-------------------------------\n";
  temp_str += "- 'ㅇ오점무 {지역}@{카테고리}'\n";
  temp_str += "- 예시 >  'ㅇ오점무 판교역@고기'\n";
  temp_str += "- 기본 값은 '아무거나' 입니다.";

  return temp_str;
}

function getDataTimeStr() {
  let d = new Date();
  return (
    "[" +
    d.getFullYear().toString() +
    "-" +
    d.getMonth().toString() +
    "-" +
    d.getDay().toString() +
    "_" +
    d.getHours().toString() +
    ":" +
    d.getMinutes().toString() +
    ":" +
    d.getSeconds().toString() +
    "." +
    d.getMilliseconds().toString() +
    "] "
  );
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
  let data;
  let resp = "";
  let run = DataBase.getDataBase(comm_db + "run");
  if (run == null) {
    DataBase.setDataBase(comm_db + "run", "t");
  }

  if (DataBase.getDataBase(room_db + room) == null) {
    DataBase.setDataBase(room_db + room, getDataTimeStr() + room + "\n");
  }
  DataBase.appendDataBase(
    room_db + room,
    getDataTimeStr() + sender + " : " + msg + "\n"
  );

  if (msg.startsWith("ㅇ그만") || msg.startsWith("ㅇstop")) {
    if (isBanned(sender) && kimchi_count < 2) {
      resp += "삐빅-";
      resp += sender + "의 말은 듣지 않는다.";
      kimchi_count += 1;
    } else {
      if (isBanned(sender) && kimchi_count >= 2) {
        resp += "삑- 한번 들어줌. ";
        kimchi_count = 0;
      }
      resp += "그만쓰";
      DataBase.setDataBase(comm_db + "run", "f");
    }
  } else if (msg.startsWith("ㅇ시작") || msg.startsWith("ㅇstart")) {
    if (isBanned(sender) && kimchi_count < 2) {
      resp += "삐빅-";
      resp += sender + "의 말은 듣지 않는다.";
      kimchi_count += 1;
    } else {
      if (isBanned(sender) && kimchi_count >= 2) {
        resp += "삑- 한번 들어줌. ";
        kimchi_count = 0;
      }
      resp += "시작쓰";
      DataBase.setDataBase(comm_db + "run", "t");
    }
  }

  if (run == "t") {
    try {
      if (msg.startsWith("ㅇ기능") || msg.startsWith("ㅇ?") || msg.startsWith("ㅇhelp") || msg.startsWith("ㅇh") || msg.startsWith("ㅇ도움")) {
        if (msg.startsWith("ㅇ기능")) {
          const input_help = msg.substring("ㅇ기능 ".length).trim();
          if (input_help.includes("1")) {
            resp += printNewsHelp();
          } else if (input_help.includes("2")) {
            resp += printWeatherHelp();
          } else if (input_help.includes("3")) {
            resp += printFunHelp();
          } else {
            resp += printMainHelp();  
          }
        } else {
          resp += printMainHelp();
        }
      } else if (msg == "ㅇ날씨") {
        resp += printWeatherHelp();

      } else if (msg == "ㅇ예보") {
        resp += printFcstHelp();

      } else if (msg == "ㅇ오점무") {
        resp += printOjeomMuHelp();

      } else if (msg.startsWith("ㅇ루트") && isAdmin(sender)) {
        if (msg.includes("밴")) {
          if (msg.includes("추가")) {
            const input_add_user = msg.split(" ");
            DataBase.appendDataBase(
              ban_sender_db,
              input_add_user[input_add_user.length - 1] + "\n"
            );
            b = DataBase.getDataBase(ban_sender_db);
            ban_sender = b.split("\n");
            resp += "[밴 유저 목록]\n";
            resp += b;
          } else if (msg.includes("삭제")) {
            const input_del_user = msg.split(" ");
            b = DataBase.getDataBase(ban_sender_db);
            ban_sender = b.split("\n");
            for (var i = 0; i < ban_sender.length; i++) {
              if (ban_sender[i] == input_del_user[3]) {
                ban_sender.splice(i, 1);
                break;
              }
            }
            DataBase.setDataBase(ban_sender_db, ban_sender.join("\n"));
            b = DataBase.getDataBase(ban_sender_db);
            resp += "[밴 유저 목록]\n";
            resp += b;
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

function onStart(activity) {}
function onResume(activity) {}
function onPause(activity) {}
function onStop(activity) {}

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

const { KakaoApiService, KakaoLinkClient } = require("kakaolink");

const Kakao = new KakaoLinkClient();

KakaoApiService.createService()
  .login({
    email: kakaoEmail,
    password: kakaoPasswd,
    keepLogin: true,
  })
  .then((e) => {
    Kakao.login(e, {
      apiKey: kakaoApiKey,
      url: "https://mumeog.site",
    });
  })
  .catch((e) => {
    Log.e(e);
  });
