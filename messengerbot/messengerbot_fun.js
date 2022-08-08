const scriptName = "fun";
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

let admin = getAdminUser();
let ban_sender = getBanUser();
let apikey = getApiKey();
let apikey_qry = "&auth=" + apikey;

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

function getAdminUser () {
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

function getBanUser () {
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

const onStartCompile = () => {
  admin = getAdminUser();
  ban_sender = getBanUser();
  apikey = getApiKey();
};

let fun_db = db_root + "fun/";
let learn_db = db_root + "learn/";
let learn_db_list = db_root + "learn_list/words";
let drwNo = 0;
let lottoUrl =
  "http://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=";
let data;
const url = "http://mumeog.site:30100";
const roman_qry = "/romanization?query=";
const papago_qry = "/papago?text=";
let words_list = getLearnedListArr();

const MAX_LEARN_NUM = 500;

function findNotPermitWords(str) {
  const regex = /[\|\\\\\?\*\<\"\:\>\/]/g;

  return regex.test(str);
}

function getDrwNo(r) {
  if (r == 0) {
    let dbDrwNo = DataBase.getDataBase(fun_db + "drwNo");
    if (dbDrwNo == null) {
      DataBase.setDataBase(fun_db + "drwNo", 1025);
    }
    drwNo = parseInt(dbDrwNo);
  }

  try {
    data = Utils.parse(lottoUrl + drwNo.toString()).text();
    data = JSON.parse(data);

    if (data.returnValue == "success") {
      drwNo += 1;
      getDrwNo(1);
    } else {
      drwNo = drwNo - 1;
      DataBase.setDataBase(fun_db + "drwNo", drwNo);
    }
  } catch (error) {
    Log.e("Failed to get drxNo." + error, true);
  }
}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //최댓값도 포함, 최솟값도 포함
}

function getLearnedListArr() {
  let db_word = DataBase.getDataBase(learn_db_list);
  if (db_word == null) {
    DataBase.setDataBase(learn_db_list, "\n");
  }

  return db_word.split("\n");
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
  let resp = "";

  let run = DataBase.getDataBase(comm_db + "run");
  if (run == null) {
    DataBase.setDataBase(comm_db + "run", "t");
  }

  if (run == "t") {
    words_list = getLearnedListArr();
    if (words_list.length > 0 && words_list.includes(msg)) {
      resp += DataBase.getDataBase(learn_db + msg);
    } else {
      try {
        if (msg.includes("/로또")) {
          if (msg.includes("생성")) {
            let numbers = new Set();
            while (numbers.size < 6) {
              numbers.add(getRandomIntInclusive(1, 45));
            }

            const arr_numbers = Array.from(numbers);
            arr_numbers.sort(function (a, b) {
              return a - b;
            });

            resp += "이번 주 ";
            for (let n of arr_numbers) resp += n.toString() + " ";
            resp += "하쉴?";
          } else {
            getDrwNo(0);

            try {
              data = Utils.parse(lottoUrl + drwNo).text();
              data = JSON.parse(data);
              if (data.returnValue == "success") {
                resp +=
                  data.drwNo +
                  "회차 (" +
                  data.drwNoDate +
                  ")\n당첨 번호 : " +
                  data.drwtNo1.toString() +
                  ", " +
                  data.drwtNo2.toString() +
                  ", " +
                  data.drwtNo3.toString() +
                  ", " +
                  data.drwtNo4.toString() +
                  ", " +
                  data.drwtNo5.toString() +
                  ", " +
                  data.drwtNo6.toString() +
                  " + " +
                  data.bnusNo.toString();
              } else {
                resp += "로또 회차 정보를 조회하지 못했어요.";
              }
            } catch (error) {
              resp += "로또 회차 정보를 조회하지 못했어요.";
            }
          }
        } else if (msg.includes("/가르치기")) {
          if (msg.includes("영우")) {
            resp += "어허!";
          } else if (msg != "/가르치기 ") {
            const input_learn_words = msg.substring("/가르치기 ".length).trim();
            if (input_learn_words.includes("=")) {
              const words = input_learn_words.split("=");
              const word1 = words[0].trim();
              const word2 = words[1].trim();
              if (findNotPermitWords(word1)) {
                resp += "가르칠 수 없는 단어가 포함되어 있어요.";
              } else {
                let f_already = false;
                words_list = getLearnedListArr();
                if (words_list.length > 0) {
                  for (let w of words_list) {
                    if (w == word1) {
                      f_already = true;
                      break;
                    }
                  }
                }

                if (!f_already) {
                  if (words_list.length > MAX_LEARN_NUM) {
                    resp += "너무 많이 배웠어요.";
                  } else {
                    DataBase.setDataBase(learn_db + word1, word2);
                    DataBase.appendDataBase(learn_db_list, word1 + "\n");
                    resp += word1 + "을(를) ";
                    resp += word2 + "(으)로 학습했어요.";
                  }
                } else {
                  resp += word1 + "은(는) 이미 ";
                  resp +=
                    DataBase.getDataBase(learn_db + word1) +
                    "(으)로 학습되어 있어요.";
                }
              }
            }
          }
        } else if (msg.includes("/학습제거")) {
          if (msg.substr(0, "/학습제거 ".length) == "/학습제거 ") {
            const input_del_words = msg.substring("/학습제거 ".length).trim();
            let db_word = DataBase.getDataBase(learn_db + input_del_words);
            if (db_word != null) {
              try {
                if (DataBase.removeDataBase(learn_db + input_del_words)) {
                  words_list = getLearnedListArr();
                  if (words_list.length > 0) {
                    let filtered_list = words_list.filter(
                      (element) => element !== input_del_words
                    );
                    DataBase.setDataBase(
                      learn_db_list,
                      filtered_list.join("\n")
                    );
                    resp += input_del_words + " 단어 학습 내용을 제거했어요.";
                  } else {
                    resp +=
                      "제거할 " +
                      input_del_words +
                      "이(가) list에 존재하지 않아요.";
                  }
                } else {
                  resp +=
                    input_del_words +
                    " 단어 학습 내용을 제거하는데 실패했어요.";
                }
              } catch (error) {
                resp +=
                  input_del_words + " 단어 학습 내용을 제거하는데 실패했어요.";
              }
            } else {
              resp += input_del_words + " 단어는 학습하지 않았어요.";
            }
          }
        } else if (msg.includes("/학습리스트") && isAdmin(sender)) {
          if (msg.includes("제거")) {
            const del_count = parseInt(
              msg.substring("/학습리스트 제거 ".length).trim()
            );
            words_list = getLearnedListArr();
            if (words_list.length > 0) {
              words_list.splice(0, del_count);
              DataBase.setDataBase(learn_db_list, words_list.join("\n"));
              resp +=
                "오래된 " +
                del_count.toString() +
                "개 단어들의 학습 내용을 제거했어요.";
            }
          } else {
            words_list = getLearnedListArr();
            if (words_list.length > 1) {
              for (let v of words_list) {
                if (v.length > 0)
                  resp +=
                    v + " => " + DataBase.getDataBase(learn_db + v) + "\n";
              }
            } else {
              resp += "학습한 내용이 없어요.";
            }
          }
        } else if (msg.includes("/루트") && isAdmin(sender)) {
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
        } else if (msg.includes("/로마")) {
          if (msg.substr(0, "/로마 ".length) == "/로마 ") {
            const input_name_words = msg.substring("/로마 ".length).trim();
            try {
              data = Utils.parse(url + roman_qry + input_name_words + apikey_qry).text();
              //resp += data.split("@").join("\n");
              resp += data;
            } catch (error) {
              resp += "로마자 변환을 하지 못했어요.";
            }
          }
        } else if (msg.includes("/번역")) {
          if (msg.substr(0, "/번역 ".length) == "/번역 ") {
            const input_trans_words = msg.substring("/번역 ".length).trim();
            try {
              data = Utils.parse(url + papago_qry + input_trans_words + apikey_qry).text();
              resp += data;
            } catch (error) {
              resp += "파파고 번역을 하지 못했어요.";
            }
          }
        }
      } catch (error) {
        resp += "에러 발생.\n err : " + error;
      }
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