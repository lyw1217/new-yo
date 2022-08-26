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

const db_root = "newyo/db/";
const comm_db = db_root + "comm/";
const apikey_db = comm_db + "apikey";
const admin_db = db_root + "comm/admin";
const ban_sender_db = db_root + "comm/ban_sender";
const room_ctx_db = db_root + "room/%s/ctx";
const room_run_db = db_root + "room/%s/run";

/* newyo */
const subslist_db = db_root + "subslist";

/* stock */
const kakao_apikey_db = comm_db + "kakao_apikey";
const kakao_email_db = comm_db + "kakao_email";
const kakao_passwd_db = comm_db + "kakao_passwd";
const kakaoApiKey = getKakaoApiKey();
const kakaoEmail = getKakaoEmail();
const kakaoPasswd = getKakaoPasswd();

/* fun */
const fun_db = db_root + "fun/";
const learn_db = db_root + "learn/";
const learn_db_list = db_root + "learn_list/words";
const musume_db = db_root + "room/%s/musume";
const nonsense_db = db_root + "room/%s/nonsense";
const naver_id_db = comm_db + "naver_id";
const naver_secret_db = comm_db + "naver_secret";
const naverId = getNaverId();
const naverSecret = getNaverSecret();
const mining_db = db_root + "mining/%s/%s";

/* tunibridge */
const room_emotion_db = db_root + "room/%s/emotion";

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

function getNaverId() {
  const k = DataBase.getDataBase(naver_id_db);
  if (k == null) {
    Log.e("Naver ID is Null. Check ID DB!!", true);
    return "";
  }
  return k.replace(/[\n\t\r]/g, "");
}

function getNaverSecret() {
  const k = DataBase.getDataBase(naver_secret_db);
  if (k == null) {
    Log.e("Naver Secret is Null. Check Secret DB!!", true);
    return "";
  }
  return k.replace(/[\n\t\r]/g, "");
}

const onStartCompile = () => {
  clearInterval(INTER);

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
  
  apikey_qry = "";
  apikey = getApiKey();

  kakaoApiKey = getKakaoApiKey();
  kakaoEmail = getKakaoEmail();
  kakaoPasswd = getKakaoPasswd();

  naverId = getNaverId();
  naverSecret = getNaverSecret();
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

let kimchi_count = 0;

function printMainHelp() {
  let temp_str = "";
  temp_str += "🦾 영우로봇 기능 🦿\n" + Lw;
  temp_str += "--------------------------------\n\n";
  temp_str += printNewsHelp();
  temp_str += "\n\n";
  
  temp_str += printWeatherHelp();
  temp_str += "\n\n";

  temp_str += printFcstHelp();
  temp_str += "\n\n";
  
  temp_str += printFunHelp();
  temp_str += "\n\n";

  temp_str += printOjeomMuHelp();
  temp_str += "\n\n";

  temp_str += printMusumeHelp();
  temp_str += "\n\n";

  temp_str += printNonsenseHelp();
  temp_str += "\n\n";

  temp_str += printAiHelp();
  temp_str += "\n\n";

  temp_str += "--------------------------------\n";
  temp_str += "  `ㅇ그만`, `ㅇ시작`으로 로봇을 멈추거나 시작할 수 있어요.\n";
  return temp_str;
}

function printNewsHelp() {
  let temp_str = "";
  temp_str += "📰 일일 요약 뉴스 조회 기능 📰\n";
  temp_str += "□ `ㅇ뉴스`\n    - 전체 조회\n";
  temp_str += "□ `ㅇ한경`\n    - 한국경제 Issue Today 조회\n";
  temp_str += "□ `ㅇ매경`\n    - 매일경제 매.세.지 조회\n";
  temp_str += "□ `ㅇ간추린`\n    - 간추린뉴스 조회\n";
  temp_str += "--------------------------------";
  //temp_str += "□ `ㅇ구독`\n\t 개인톡으로 매일 8시 30분에 뉴스를 제공\n";
  //temp_str += "□ `ㅇ구독해제`\n\t 뉴스 구독 해제";

  return temp_str;
}

function printWeatherHelp() {
  let temp_str = "";
  temp_str += "🌤 날씨 🌤\n";
  temp_str += "현재 시간을 기준으로 날씨 정보를 알려줍니다.\n";
  temp_str += "□ `ㅇ날씨 (동네)`\n    - 지금 날씨 조회(네이버/구글 검색)\n";
  temp_str += "□ `ㅇ주간 (동네)`\n    - 오늘/내일 날씨 조회(네이버 검색)\n";
  temp_str += "□ `ㅇ지금 (동네) 날씨`\n    - 지금 날씨 조회(기상청 API)\n";
  temp_str += "□ `ㅇ예보`\n    - 예보 조회 가능 지역 확인\n";
  temp_str += "    - `ㅇ예보 (지역)` : 오늘의 기상 예보 조회\n";
  temp_str += "[예시]\n";
  temp_str += "    ㅇ날씨 판교\n";
  temp_str += "    ㅇ주간 을지로\n";
  temp_str += "    ㅇ지금 서현 날씨\n";
  temp_str += "    ㅇ예보 서울\n";
  temp_str += "--------------------------------\n";
  temp_str += "`ㅇ지금` 명령어의 동네 키워드는 최대 3개까지 가능합니다.";

  return temp_str;
}

function printFcstHelp() {
  let temp_str = "";
  temp_str += "🌞 예보 🌞\n";
  temp_str += "오늘의 기상 중기 예보를 알려줍니다.\n";
  temp_str += "□ `ㅇ예보 (지역)`\n\t  오늘의 기상 예보 조회\n";
  temp_str += "[예시]\n";
  temp_str += "    ㅇ예보 서울\n";
  temp_str += "--------------------------------\n";
  temp_str += "<지역>\n";
  temp_str += "    전국, 서울, 경기, 강원\n";
  temp_str += "    충북, 대전, 세종, 충남\n";
  temp_str += "    전북, 광주, 전남, 대구\n";
  temp_str += "    경북, 부산, 울산, 경남\n";
  temp_str += "    제주";

  return temp_str;
}

function printFunHelp() {
  let temp_str = "";
  temp_str += "◤ 소소한 기능 ◥\n" + Lw;
  temp_str += "□ `ㅇ로또`\n    - 최근 로또 당첨번호 조회\n";
  temp_str += "    - `ㅇ로또 생성` : 랜덤 번호 생성\n";
  temp_str += "□ `ㅇ가르치기 A=B`\n    - A는 B라고 가르치기\n";
  temp_str += "□ `ㅇ학습제거 A`\n    - A라고 가르친 단어 잊게 하기\n";
  temp_str += "□ `ㅇ로마 (이름)`\n    - 한글 이름을 로마자로 변환\n";
  temp_str += "□ `ㅇ번역 (텍스트)`\n    - 파파고 자동 번역(하루 10,000자 제한)\n";
  temp_str += "□ `ㅇ오점무`\n    - 오점무 사용방법 조회\n";
  temp_str += "    -`ㅇ오점무 (지역/건물명)` : 반경 500미터 내 맛집 추천\n";
  temp_str += "□ `ㅇ운세 (띠/별자리)`\n    - 띠/별자리 오늘의 운세 조회\n";
  temp_str += "□ `ㅇ환율`\n    - 달러 실시간 환율 조회\n";
  temp_str += "    - `ㅇ환율 (지역/화폐)` : 지역/화폐 실시간 환율 조회\n";
  temp_str += "□ `ㅈ(종목명)`\n    - 주식 종목 현재가 조회\n";
  temp_str += "□ `ㅇ무스메`\n    - 랜덤뽑기\n";
  temp_str += "□ `ㅇ넌센스`\n    - 넌센스 문제!\n";
  temp_str += "    - `ㅇ넌센스 포기` : 넌센스 문제를 시작한 사람만 포기 가능\n";
  temp_str += "--------------------------------";

  return temp_str;
}

function printOjeomMuHelp() {
  let temp_str = "";
  temp_str += "🍝 오점무 카테고리 🍝\n";
  temp_str += "□ 아무거나　　　□ 한식\n";
  temp_str += "□ 중식　　　　　□ 일식\n";
  temp_str += "□ 양식　　　　　□ 분식\n";
  temp_str += "□ 아시아음식　　□ 도시락\n";
  temp_str += "□ 육류/고기　 　□ 치킨\n";
  temp_str += "□ 패스트푸드　　□ 술집\n";
  temp_str += "-------------------------------\n";
  temp_str += "- 사용 방법 : `ㅇ오점무 {지역}@{카테고리}`\n";
  temp_str += "- 예시 >  `ㅇ오점무 판교역@고기`\n";
  temp_str += "- 카테고리 미입력시 기본 값은 '아무거나' 입니다.";

  return temp_str;
}

function printMusumeHelp() {
  let temp_str = "";
  temp_str += "🎰 무스메 사용 방법 🎲\n";
  temp_str += "□ `ㅇ무스메 초기화`\n    - 무스메 설정 초기화\n";
  temp_str += "□ `ㅇ무스메 추가 (인원1) (인원2)...`\n    - 무스메 참가 인원 추가\n";
  temp_str += "□ `ㅇ무스메 삭제 (인원)`\n    - 무스메 참가 인원에서 제외\n";
  temp_str += "□ `ㅇ무스메 인원`\n    - 무스메 참가 인원 확인\n";
  temp_str += "□ `ㅇ무스메 시작 (당첨인원 수)`\n    - 당첨인원 수 만큼 랜덤 뽑기 시작\n";
  temp_str += "-------------------------------\n";
  temp_str += "- 띄어쓰기로 구분하여 한 번에 추가 가능\n";
  temp_str += "- 삭제는 한 명씩 가능";

  return temp_str;
}

function printNonsenseHelp() {
  let temp_str = "";
  temp_str += "💡 넌센스 문제 맞추기 💡\n";
  temp_str += "□ `ㅇ넌센스`\n    - 넌센스 문제 만들기\n";
  temp_str += "□ `ㅇ넌센스 포기`\n    - 문제 포기하기 (문제를 시작한 사람과 방장만 가능)\n";
  temp_str += "□ `ㅇ넌센스 랭킹`\n    - 랭킹 확인하기(매일 0시 초기화)\n";
  temp_str += "□ `ㅇ넌센스 랭킹 어제`\n    - 어제 랭킹 확인하기\n";
  temp_str += "-------------------------------\n";
  temp_str += "정답을 맞추면 1점 획득!\n";
  temp_str += "10% 확률로 +2점, 1% 확률로 +5점, 0.1% 확률로 +10점 획득 가능";

  return temp_str;
}

function printAiHelp(){
  let temp_str = "";
  temp_str += "🤖 AI 기능 🤖\n";
  temp_str += "TUNiBridge Demos(https://tunibridge.ai/)\n";
  temp_str += "□ `ㅇ엔행시 (단어)`\n    - n행시 만들기\n";
  temp_str += "□ `ㅇ사투리 (source) (target) (문장)`\n    - source에서 target으로 방언 번역\n";
  temp_str += "□ `ㅇ감정` : 감정 예측\n";
  temp_str += "    - `ㅇ감정 시작` : 다음 메시지부터 감정 예측 시작\n";
  temp_str += "    - `ㅇ감정 종료` : 감정 예측 종료\n";
  temp_str += "    - `ㅇ감정 분석 (문장)` : 문장의 감정 예측\n";
  temp_str += "--------------------------------\n";
  temp_str += "<사투리 지역>\n";
  temp_str += "    표준어, 경상도, 전라도\n";
  temp_str += "    강원도, 제주도, 충청도";

  return temp_str;
}

function pad(n, width) {
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;

}
function getDataTimeStr() {
  let d = new Date();
  return (
    "[" +
    d.getFullYear().toString() +
    "-" +
    pad((d.getMonth() + 1).toString(), 2) +
    "-" +
    pad(d.getDate().toString(), 2) +
    "_" +
    pad(d.getHours().toString(), 2) +
    ":" +
    pad(d.getMinutes().toString(), 2) +
    ":" +
    pad(d.getSeconds().toString(), 2) +
    "." +
    pad(d.getMilliseconds().toString(), 2) +
    "] "
  );
}

/* usage : toStringByFormatting(new Date(2021, 0, 1)); */
function toStringByFormatting(source, delimiter) {
  const year = source.getFullYear();
  const month = pad(source.getMonth() + 1, 2);
  const day = pad(source.getDate(), 2);

  return [year, month, day].join(delimiter);
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

  let run = DataBase.getDataBase(sprintf(room_run_db, room));
  if (run == null) {
    DataBase.setDataBase(sprintf(room_run_db, room), "t");
  }

  if (DataBase.getDataBase(sprintf(room_ctx_db, room)) == null) {
    DataBase.setDataBase(sprintf(room_ctx_db, room), getDataTimeStr() + room + "\n");
  }

  DataBase.appendDataBase(
    sprintf(room_ctx_db, room),
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
      DataBase.setDataBase(sprintf(room_run_db, room), "f");
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
      DataBase.setDataBase(sprintf(room_run_db, room), "t");
    }
  }

  if (run == "t") {
    try {
      if (msg.startsWith("ㅇ기능") || msg.startsWith("ㅇ헬프") || msg.startsWith("ㅇhelp") || msg.startsWith("ㅇh") || msg.startsWith("ㅇ도움")) {
        const input_help = msg.split(" ")[1];
        if (typeof input_help == "undefined" || input_help == null || input_help == "") {
          resp += printMainHelp();
        } else {
          if (input_help.trim().includes("1")) {
            resp += printNewsHelp();
          } else if (input_help.trim().includes("2")) {
            resp += printWeatherHelp();
          } else if (input_help.trim().includes("3")) {
            resp += printFunHelp();
          } else {
            resp += printMainHelp();
          }
        }
      } else if (msg == "ㅇ날씨") {
        resp += printWeatherHelp();

      } else if (msg == "ㅇ예보") {
        resp += printFcstHelp();

      } else if (msg == "ㅇ오점무") {
        resp += printOjeomMuHelp();

      } else if (msg == "ㅇ무스메") {
        resp += printMusumeHelp();

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

function onStart(activity) { }
function onResume(activity) { }
function onPause(activity) { }
function onStop(activity) { }

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

/* https://github.com/naijun0403/kakaolink */
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


/* https://stackoverflow.com/questions/7790811/how-do-i-put-variables-inside-javascript-strings */
function sprintf(str) {
  var args = [].slice.call(arguments, 1), i = 0;

  return str.replace(/%s/g, () => args[i++]);
}

Api.reload();

let reload_flag = DataBase.getDataBase(comm_db + "reload");
if (reload_flag == null) DataBase.setDataBase(comm_db + "reload", "false");
let old_hour = -1;
const reload_hour = 6;
const INTER = setInterval(() => {
  let date = new Date();

  let cur_hour = date.getHours();
  
  if (cur_hour != old_hour) {
    old_hour = cur_hour;
    Log.i("getBuild() = " + Device.getBuild().toString());
    Log.i("getAndroidVersionCode() = " + Device.getAndroidVersionCode().toString());
    Log.i("getAndroidVersionName() = " + Device.getAndroidVersionName().toString());
    Log.i("getPhoneBrand() = " + Device.getPhoneBrand().toString());
    Log.i("getPhoneModel() = " + Device.getPhoneModel().toString());
    Log.i("isCharging() = " + Device.isCharging().toString());
    Log.i("getPlugType() = " + Device.getPlugType().toString());
    Log.i("getBatteryLevel() = " + Device.getBatteryLevel().toString());
    Log.i("getBatteryHealth() = " + Device.getBatteryHealth().toString());
    Log.i("getBatteryTemperature() = " + Device.getBatteryTemperature().toString());
    Log.i("getBatteryVoltage() = " + Device.getBatteryVoltage().toString());
    Log.i("getBatteryStatus() = " + Device.getBatteryStatus().toString());
    function byteCalculation(bytes) {
      var bytes = parseInt(bytes);
      var s = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
      var e = Math.floor(Math.log(bytes) / Math.log(1024));

      if (e == "-Infinity") return "0 " + s[0];
      else
        return (bytes / Math.pow(1024, Math.floor(e))).toFixed(2) + "" + s[e];
    }

    function getMemoryInfo() {
      var am = Api.getContext().getSystemService(Api.getContext().ACTIVITY_SERVICE);
      var mem = new android.app.ActivityManager.MemoryInfo();
      am.getMemoryInfo(mem);

      var useMem = Math.floor(mem.totalMem - mem.availMem);

      var percent = Math.floor((useMem / mem.totalMem) * 100);

      return byteCalculation(useMem) + " / " + byteCalculation(mem.totalMem) + "(" + percent + "%)";
    }
    Log.i(getMemoryInfo());
  }

  reload_flag = DataBase.getDataBase(comm_db + "reload");
  if (cur_hour % reload_hour == 0 && reload_flag.includes("false")) {
    Api.reload();
    reload_flag = DataBase.setDataBase(comm_db + "reload", "true");
  }
  if ( cur_hour % reload_hour != 0 ) {
    reload_flag = DataBase.setDataBase(comm_db + "reload", "false");
  }
}, 60000);