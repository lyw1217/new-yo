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

let comm_db = Bridge.getScopeOf("comm").comm_db;
let apikey_db = Bridge.getScopeOf("comm").apikey;
let admin_db = Bridge.getScopeOf("comm").admin_db;
let ban_sender_db = Bridge.getScopeOf("comm").ban_sender_db;
let room_ctx_db = Bridge.getScopeOf("comm").room_ctx_db;
let room_run_db = Bridge.getScopeOf("comm").room_run_db;

let admin = Bridge.getScopeOf("comm").admin
let ban_sender = Bridge.getScopeOf("comm").ban_sender
let apikey = Bridge.getScopeOf("comm").apikey
let apikey_qry = Bridge.getScopeOf("comm").apikey_qry
let Lw = Bridge.getScopeOf("comm").Lw

let fun_db = Bridge.getScopeOf("comm").fun_db;
let learn_db = Bridge.getScopeOf("comm").learn_db;
let learn_db_list = Bridge.getScopeOf("comm").learn_db_list;
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

function parseCategory(c) {
  switch (c) {
    case "아무거나":
      return "anything";
    case "한식":
      return "korea";
    case "중식":
      return "china";
    case "일식":
      return "japan";
    case "양식":
      return "western";
    case "분식":
      return "flour";
    case "아시아음식":
      return "asia";
    case "도시락":
      return "lunchbox";
    case "육류":
      return "meat";
    case "고기":
      return "meat";
    case "치킨":
      return "chicken";
    case "패스트푸드":
      return "fastfood";
    case "술집":
      return "bar";
    default:
      return "anything";
  }
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

  let run = DataBase.getDataBase(Bridge.getScopeOf("comm").parse(Bridge.getScopeOf("comm").room_run_db, room));
  if (run == null) {
    DataBase.setDataBase(Bridge.getScopeOf("comm").parse(Bridge.getScopeOf("comm").room_run_db, room), "t");
  }

  if (run == "t") {
    words_list = getLearnedListArr();
    if (words_list.length > 0 && words_list.includes(msg)) {
      resp += DataBase.getDataBase(learn_db + msg);
    } else {
      try {
        if (msg.startsWith("ㅇ로또")) {
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
        } else if (msg.startsWith("ㅇ가르치기")) {
          if (msg.includes("영우")) {
            resp += "어허!";
          } else if (msg != "ㅇ가르치기 ") {
            const input_learn_words = msg.substring("ㅇ가르치기 ".length).trim();
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
                    resp += word1 + "$를 ";
                    resp += word2 + "$로 학습했어요.";
                    resp = resp.postposition();
                  }
                } else {
                  resp += word1 + "$는 이미 ";
                  resp +=
                    DataBase.getDataBase(learn_db + word1) +
                    "$로 학습되어 있어요.";
                  resp = resp.postposition();
                }
              }
            }
          }
        } else if (msg.startsWith("ㅇ학습제거")) {
          if (msg.substr(0, "ㅇ학습제거 ".length) == "ㅇ학습제거 ") {
            const input_del_words = msg.substring("ㅇ학습제거 ".length).trim();
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
                      "가 list에 존재하지 않아요.";
                    resp = resp.postposition();
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
        } else if (msg.startsWith("ㅇ학습리스트") && Bridge.getScopeOf("comm").isAdmin(sender)) {
          if (msg.includes("제거")) {
            const del_count = parseInt(
              msg.substring("ㅇ학습리스트 제거 ".length).trim()
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
        } else if (msg.startsWith("ㅇ로마")) {
          if (msg.substr(0, "ㅇ로마 ".length) == "ㅇ로마 ") {
            const input_name_words = msg.substring("ㅇ로마 ".length).trim();
            try {
              data = Utils.parse(url + roman_qry + input_name_words + apikey_qry).text();
              resp += data;
            } catch (error) {
              resp += "로마자 변환을 하지 못했어요.";
            }
          }
        } else if (msg.startsWith("ㅇ번역")) {
          if (msg.substr(0, "ㅇ번역 ".length) == "ㅇ번역 ") {
            const input_trans_words = msg.substring("ㅇ번역 ".length).trim();
            try {
              data = Utils.parse(url + papago_qry + input_trans_words + apikey_qry).text();
              resp += data;
            } catch (error) {
              resp += "파파고 번역을 하지 못했어요.";
            }
          }
        }

        else if (msg.startsWith("ㅇ오점무")) {
          if (msg.substr(0, "ㅇ오점무 ".length) == "ㅇ오점무 ") {
            const input_words = msg.substring("ㅇ오점무 ".length).trim();
            if (input_words.includes("@")) {
              input_ojeommu_words = input_words.split("@")[0];
              input_cat_words = input_words.split("@")[1];
            } else {
              input_ojeommu_words = input_words;
              input_cat_words = "";
            }

            try {
              data = Utils.parse("http://mumeog.site/ojeommu?query=" + input_ojeommu_words + "&cat=" + parseCategory(input_cat_words) + apikey_qry).text();
              data = JSON.parse(data);

              date = new Date();
              if (date.getHours() > 15 && date.getHours() < 21) {
                tit = "오늘 저녁은 '" + data.hdr + "' 어떠세요?";
              } else if (date.getHours() > 22 && date.getHours() < 8) {
                tit = "오늘 야식은 '" + data.hdr + "' 어떠세요?";
              } else {
                tit = "오늘 점심은 '" + data.hdr + "' 어떠세요?";
              }
              ctx = data.place + "$로부터 거리는 약 " + data.d + "m 에요.";
              try {
                jsoup_resp = org.jsoup.Jsoup.connect(data.lnk + "?service=search_pc").get();
                thu = jsoup_resp.select("meta[property=og:image]").first().attr("content").toString();
              } catch (error) {
                thu = "";
                Log.d(error);
              }

              if (Bridge.isAllowed("comm")) {
                Bridge.getScopeOf("comm").Kakao.sendLink(
                  room,
                  {
                    template_id: 81646,
                    template_args: {
                      "HDR": data.hdr,
                      "TIT": tit,
                      "CTX": ctx.postposition(),
                      "LNK": data.lnk,
                      "CAT": data.cat,
                      "THU": thu,
                    },
                  },
                  "custom"
                )
                  .then((e) => {
                  })
                  .catch((e) => {
                    resp += data.hdr + "\n";
                    resp += data.ctx.postposition() + "\n";
                    resp += data.lnk;
                    replier.reply(resp);
                  });
              }

            } catch (error) {
              resp += "조건에 맞는 맛집을 구하지 못했어요.";
              if (error != null) {
                Log.e(error);
              }
            }
          }
        }

        else if (msg.startsWith('ㅇ운세')) {
          if (msg == "ㅇ운세") {
            resp += "'ㅇ운세 (띠/별자리)' 로 오늘의 운세를 확인해보세요.";
          } else if (msg.startsWith('ㅇ운세 ')) {
            try {
              jsoup_resp = org.jsoup.Jsoup.connect('http://search.naver.com/search.naver?query=' + msg.slice(4) + '+운세').get();

              if (jsoup_resp.select('.api_title').first().text() == "운세") {
                resp += "[ 오늘의 " + msg.slice(4) + " 운세 ]\n";
                resp += jsoup_resp.select('._cs_fortune_text').first().text();

                if (!jsoup_resp.select('.lst_infor').isEmpty()) {
                  lst_info = jsoup_resp.select('.lst_infor').first();
                  dt = lst_info.select('dt').eachText();
                  dd = lst_info.select('dd').eachText();

                  resp += "\n" + Lw + "\n";
                  for (let i = 0; i < dt.length && i < dd.length; i++) {
                    resp += dt[i] + " | ";
                    resp += dd[i] + "\n";
                  }
                }
              } else {
                resp = "";
                resp += "운세 정보를 가져오지 못했어요.";
              }
            } catch (error) {
              Log.e(error, true);
              resp = "";
              resp += "운세 정보를 가져오지 못했어요.";
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

function onStart(activity) { }
function onResume(activity) { }
function onPause(activity) { }
function onStop(activity) { }
const onStartCompile = () => {
  if (!Bridge.isAllowed("comm")) {
    Api.compile("comm");
  }
};

/* https://cafe.naver.com/nameyee/32361 */
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