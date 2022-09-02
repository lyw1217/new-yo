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
const naverId = Bridge.getScopeOf("comm").naverId;
const naverSecret = Bridge.getScopeOf("comm").naverSecret;
const fun_db = Bridge.getScopeOf("comm").fun_db;
const learn_db = Bridge.getScopeOf("comm").learn_db;
const learn_db_list = Bridge.getScopeOf("comm").learn_db_list;
const musume_db = Bridge.getScopeOf("comm").musume_db;
const nonsense_db = Bridge.getScopeOf("comm").nonsense_db;
const mining_db = Bridge.getScopeOf("comm").mining_db;

/* functions */
const isAdmin = Bridge.getScopeOf("comm").isAdmin;
const sprintf = Bridge.getScopeOf("comm").sprintf;
const toStringByFormatting = Bridge.getScopeOf("comm").toStringByFormatting;
const priceToString = Bridge.getScopeOf("comm").priceToString;

const naverSearchBookUrl = "https://openapi.naver.com/v1/search/book.json";
const lottoUrl =
  "http://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=";
let drwNo = 0;
let data;
const url = "http://mumeog.site:30100";
const roman_qry = "/romanization?query=";
const papago_qry = "/papago?text=";
let words_list = getLearnedListArr();

const MAX_LEARN_NUM = 500;

function findNotPermitWords(str) {
  const regex = /[\|\\\\\?\*\<\"\:\>\/]/g;
  const newyo_commands = ["ㅇ뉴스", "ㅇ한경", "ㅇ매경", "ㅇ간추린", "ㅇ구독"];
  const comm_commands = ["ㅇ시작", "ㅇ그만", "ㅇ기능", "ㅇ날씨", "ㅇ예보", "ㅇ루트"];
  const fun_commands = ["ㅇ로또", "ㅇ가르치기", "ㅇ학습제거", "ㅇ학습리스트", "ㅇ로마", "ㅇ번역", "ㅇ오점무", "ㅇ운세", "ㅇ무스메", "ㅇ넌센스", "힌트"];
  if (regex.test(str)) return true;
  if (newyo_commands.includes(str)) return true;
  if (comm_commands.includes(str)) return true;
  if (fun_commands.includes(str)) return true;
  

  return false;
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

function makeRankingStr(rank, opt) {
  let str = "";

  /* https://stackoverflow.com/questions/25500316/sort-a-dictionary-by-value-in-javascript */
  let items = Object.keys(rank).map(function (key) {
    return [key, rank[key], 1];
  });

  items.sort(function (first, second) {
    return second[1] - first[1];
  });

  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < items.length; j++) {
      if (items[i][1] < items[j][1]) items[i][2]++;
    }
  }

  let medals = ["🥇", "🥈", "🥉"];
  let medal_cnt = 0;
  for (let i = 0; i < items.length; i++) {
    let person = "";
    if (i > 0) {

      if (items[i - 1][2] != items[i][2]) medal_cnt += 1;

      if (medal_cnt <= 2) {
        person += medals[medal_cnt];
      } else {
        person += items[i][2].toString() + ".  ";
      }
    } else {
      person += medals[medal_cnt];
    }
    person += items[i][0];
    person = person.padEnd(7, '　') + " : " + priceToString(items[i][1]) + (opt == "nonsense" ? "점" : "원") + "\n";
    str += person;
  }

  return str;
}

function saveRanking(room) {
  let str = "";

  let rank_list = DataBase.getDataBase(sprintf(nonsense_db, room) + "/rank").split('\n');
  let rank = {};
  for (let i = 0; i < rank_list.length; i++) {
    if (rank_list[i].length > 0) {
      if (rank_list[i] in rank) {
        rank[rank_list[i]] += 1;
      } else {
        rank[rank_list[i]] = 1;
      }
    }
  }

  str += "🏆넌센스 랭킹\n";
  str += "-------------------\n";
  str += makeRankingStr(rank, "nonsense");
  str += "-------------------";

  DataBase.setDataBase(
    sprintf(nonsense_db, room) +
    "/rank_" + toStringByFormatting(new Date(), '-')
    , str);
}

function miningSomething(sender) {
  mining = Math.random();
  tmp_str = "[" + sender + "] ";
  if (mining <= 0.001) { // 0.1%
    DataBase.appendDataBase(sprintf(mining_db, sender, "gemstones"), "1");
    tmp_str += "💍다이아몬드💍를 캤다!";
  }
  else if (mining < 0.011) { // 1%
    DataBase.appendDataBase(sprintf(mining_db, sender, "gemstones"), "2");
    tmp_str += "🎉사파이어🎉를 캤다!";
  }
  else if (mining < 0.061) { // 5%
    DataBase.appendDataBase(sprintf(mining_db, sender, "gemstones"), "3");
    tmp_str += "✨루비✨를 캤다!";
  }
  else if (mining < 0.161) { // 10%
    DataBase.appendDataBase(sprintf(mining_db, sender, "gemstones"), "4");
    tmp_str += "💵가넷을 캤다!";
  }
  else if (mining < 0.311) { // 15%
    DataBase.appendDataBase(sprintf(mining_db, sender, "gemstones"), "5");
    tmp_str += "🪙금을 캤다!";
  }
  else if (mining < 0.501) { // 19%
    DataBase.appendDataBase(sprintf(mining_db, sender, "gemstones"), "6");
    tmp_str += "🥄은을 캤다!";
  }
  else if (mining < 0.701) { // 20%
    DataBase.appendDataBase(sprintf(mining_db, sender, "gemstones"), "7");
    tmp_str += "동을 캤다!";
  }
  else { // 29.9%
    DataBase.appendDataBase(sprintf(mining_db, sender, "gemstones"), "8");
    tmp_str += "와. 짱돌을 얻으셨어요.";
  }

  return tmp_str;
}

function response(room, msg, sender, isGroupChat, replier, imageDB, packageName) {
  let resp = "";

  let run = DataBase.getDataBase(sprintf(room_run_db, room));
  if (run == null) {
    DataBase.setDataBase(sprintf(room_run_db, room), "t");
  }

  if (DataBase.getDataBase(sprintf(nonsense_db, room) + "/flag") == "true") {

    acc = getAccuracy(msg, DataBase.getDataBase(sprintf(nonsense_db, room) + "/answer"));
    if (acc > 82.0) {
      resp += sender + "님, 정답이에요! (정확도:" + acc.toString() + "%)\n";
      resp += DataBase.getDataBase(sprintf(nonsense_db, room) + "/why");
      DataBase.setDataBase(sprintf(nonsense_db, room) + "/flag", "false");

      luck_point = Math.random();
      luck_money = 0;
      if (luck_point < 0.001) {
        for (let i = 0; i < 100; i++) {
          DataBase.appendDataBase(sprintf(nonsense_db, room) + "/rank", sender + "\n");
        }
        resp += "\n🎊0.1% 확률 당첨! +100점🎊 +100000원";
        luck_money = 100000;
      } else if (luck_point < 0.011) {
        for (let i = 0; i < 20; i++) {
          DataBase.appendDataBase(sprintf(nonsense_db, room) + "/rank", sender + "\n");
        }
        resp += "\n🎉1% 확률 당첨! +20점🎉 +10000원";
        luck_money = 10000;
      } else if (luck_point < 0.061) {
        for (let i = 0; i < 10; i++) {
          DataBase.appendDataBase(sprintf(nonsense_db, room) + "/rank", sender + "\n");
        }
        resp += "\n🎈5% 확률 당첨! +10점🎈 +5000원";
        luck_money = 5000;
      }
      else if (luck_point < 0.161) {
        for (let i = 0; i < 5; i++) {
          DataBase.appendDataBase(sprintf(nonsense_db, room) + "/rank", sender + "\n");
        }
        resp += "\n🎁10% 확률 당첨! +5점 +3000원";
        luck_money = 3000;
      }
      else if (luck_point < 0.361) {
        for (let i = 0; i < 3; i++) {
          DataBase.appendDataBase(sprintf(nonsense_db, room) + "/rank", sender + "\n");
        }
        resp += "\n✨20% 확률 당첨! +3점 +2000원";
        luck_money = 2000;
      }
      else if (luck_point < 0.661) {
        for (let i = 0; i < 2; i++) {
          DataBase.appendDataBase(sprintf(nonsense_db, room) + "/rank", sender + "\n");
        }
        resp += "\n★30% 확률 당첨! +2점 +1000원";
        luck_money = 1000;
      } else {
        DataBase.appendDataBase(sprintf(nonsense_db, room) + "/rank", sender + "\n");
      }

      saveRanking(room);

      coin = DataBase.getDataBase(sprintf(mining_db, sender, "money"));
      if (coin != null) {
        coin = (parseInt(coin) + 1400 + luck_money).toString();
        resp += Lw + "\n" + sender + "님의 돈 : " + priceToString(coin) + "원 (+1400, +" + luck_money.toString() + ")\n";
        DataBase.setDataBase(sprintf(mining_db, sender, "money"), coin);
      }

    } else if (msg.includes("힌트")) {
      coin = DataBase.getDataBase(sprintf(mining_db, sender, "money"));
      if (coin != null) {
        if (parseInt(coin) >= 500) {
          resp += "힌트는 " + DataBase.getDataBase(sprintf(nonsense_db, room) + "/hint");

          coin = (parseInt(coin) - 500).toString();
          resp += "\n" + Lw + sender + "님의 돈 : " + priceToString(coin) + "원 (-500)\n";
          DataBase.setDataBase(sprintf(mining_db, sender, "money"), coin);
        } else {
          resp += "거지는 힌트 받을 생각 마세요.";
          resp += Lw + "\n" + sender + "님의 돈 : " + priceToString(coin) + "원\n";
        }
      } else {
        resp += "힌트는 " + DataBase.getDataBase(sprintf(nonsense_db, room) + "/hint");
      }
    }
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
        } else if (msg.startsWith("ㅇ학습리스트") && isAdmin(sender)) {
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

            input_words = msg.substring("ㅇ오점무 ".length).trim();
            if (input_words.includes("@")) {
              input_ojeommu_words = input_words.split("@")[0];
              input_cat_words = input_words.split("@")[1];
            } else {
              input_ojeommu_words = input_words;
              input_cat_words = "";
            }

            try {
              data = Utils.parse("http://mumeog.site/ojeommu?query=" + input_ojeommu_words + "&cat=" + parseCategory(input_cat_words) + apikey_qry).text();
              //data = Utils.parse("https://ojeommu.herokuapp.com/api?query="+ input_ojeommu_words + "&cat=" + parseCategory(input_cat_words)).text();
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

        else if (msg.startsWith("ㅇ오점네 ")) {
          input_words = msg.slice(5).trim();

          try {
            data = Utils.parse("http://mumeog.site/ojeommu?query=" + input_words + apikey_qry + "&target=naver").text();
            data = JSON.parse(data);

            date = new Date();
            if (date.getHours() > 15 && date.getHours() < 21) {
              tit = "오늘 저녁은 '" + data.hdr + "' 어떠세요?";
            } else if (date.getHours() > 22 && date.getHours() < 8) {
              tit = "오늘 야식은 '" + data.hdr + "' 어떠세요?";
            } else {
              tit = "오늘 점심은 '" + data.hdr + "' 어떠세요?";
            }

            if (Bridge.isAllowed("comm")) {
              Bridge.getScopeOf("comm").Kakao.sendLink(
                room,
                {
                  template_id: 81646,
                  template_args: {
                    "HDR": data.hdr,
                    "TIT": tit,
                    "LNK": data.lnk,
                    "CAT": data.cat,
                  },
                },
                "custom"
              )
                .then((e) => {
                })
                .catch((e) => {
                  resp += data.hdr + "\n";
                  resp += data.cat + "\n";
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

        else if (msg.startsWith('ㅇ무스메 ')) {
          if (DataBase.getDataBase(sprintf(musume_db, room)) == null) {
            DataBase.setDataBase(sprintf(musume_db, room), "");
          }

          if (msg.slice(5).startsWith("초기화") || msg.slice(5).startsWith("리셋")) {
            resp += "무스메를 초기화합니다.";
            DataBase.setDataBase(sprintf(musume_db, room), "");

          }

          else if (msg.slice(5).startsWith("확인") || msg.slice(5).startsWith("인원") || msg.slice(5).startsWith("현황")) {
            p_list = DataBase.getDataBase(sprintf(musume_db, room)).split('\n');
            resp += "[무스메 참가 인원]\n";
            num = 0;
            for (let i = 0; i < p_list.length; i++) {
              if (p_list[i].length > 0) {
                num += 1;
                resp += num.toString() + ". " + p_list[i] + "\n";
              }
            }
            resp += "총 " + num.toString() + "명";

          }

          else if (msg.slice(5).startsWith("추가") | msg.slice(5).startsWith("참여") | msg.slice(5).startsWith("참가")) {
            input_p = msg.slice(8).split(" ");
            num = 0;
            p = [];
            for (let i = 0; i < input_p.length; i++) {
              if (input_p[i].length > 0) {
                if (!p.includes(input_p[i])) {
                  num += 1;
                  p.push(input_p[i]);
                }
              }
            }

            if (num > 0) {
              p_list = DataBase.getDataBase(sprintf(musume_db, room)).split('\n');
              if (p_list == null) {
                p_list = DataBase.setDataBase(sprintf(musume_db, room), '\n');
              }
              total_num = 0;
              dup_flag = false;
              dup_person = [];
              for (let i = 0; i < p_list.length; i++) {
                if (p_list[i].length > 0) {
                  total_num += 1;
                  if (p.includes(p_list[i])) {
                    dup_flag = true;
                    dup_person.push(p_list[i]);
                  }
                }
              }

              if (!dup_flag) {
                DataBase.appendDataBase(sprintf(musume_db, room), p.join('\n') + "\n");
                resp += "무스메 인원 추가 : " + p.join(" ") + " (+" + num.toString() + "명 / 총 " + (num + total_num).toString() + "명)";
              } else {
                resp += "중복되는 인원(" + dup_person.join(", ") + ")이 있어요.";
              }
            } else {
              resp += "`ㅇ무스메 추가 (인원1) (인원2)...` 형식에 맞게 인원을 추가해주세요.";
            }
          }

          else if (msg.slice(5).startsWith("삭제") | msg.slice(5).startsWith("제거") | msg.slice(5).startsWith("제외")) {
            p_list = DataBase.getDataBase(sprintf(musume_db, room)).split('\n');
            total_num = 0;
            p = [];
            for (let i = 0; i < p_list.length; i++) {
              if (p_list[i].length > 0) {
                total_num += 1;
                p.push(p_list[i]);
              }
            }

            find_flag = false;
            input_p = msg.slice(8);
            for (let i = 0; i < p.length; i++) {
              if (input_p == p[i]) {
                find_flag = true;
                filtered_list = p.filter(
                  (element) => element !== input_p
                );
                DataBase.setDataBase(
                  sprintf(musume_db, room),
                  filtered_list.join("\n") + "\n"
                );
                resp += input_p + " : 무스메에서 제외했어요.";
                break;
              }
            }

            if (!find_flag) {
              resp += input_p + " : 무스메 참여 인원이 아니에요.";
            }
          }

          else if (msg.slice(5).startsWith("시작") | msg.slice(5).startsWith("진행") | msg.slice(5).startsWith("출발")) {
            input_num = msg.slice(8);
            n = parseInt(input_num);
            if (!isNaN(n)) {
              p_list = DataBase.getDataBase(sprintf(musume_db, room)).split('\n');
              total_num = 0;
              p = [];
              for (let i = 0; i < p_list.length; i++) {
                if (p_list[i].length > 0) {
                  total_num += 1;
                  p.push(p_list[i]);
                }
              }

              if (total_num >= n) {
                if (total_num > 0) {
                  rand_num_list = [];
                  for (let i = 0; i < n; i++) {
                    for (let j = 0; ; j++) {
                      if (j > 10000) break;
                      rand_num = getRandomIntInclusive(0, total_num - 1);
                      if (!rand_num_list.includes(rand_num)) {
                        rand_num_list.push(rand_num);
                        break;
                      }
                    }
                    resp += "[" + p[rand_num] + "] ";
                  }
                  resp += "당첨!";
                } else {
                  resp += "`ㅇ무스메 추가` 명령어로 인원을 추가해보세요.";
                }
              } else {
                resp += "무스메 참여 인원(" + total_num.toString() + ") 보다 많은 숫자는 안돼요.";
              }
            } else {
              resp += "`ㅇ무스메 시작 (당첨인원 수)`로 무스메를 시작해보세요.";
            }
          }
        }

        else if (msg.startsWith('ㅇ넌센스') || msg.startsWith('ㄴㅅㅅ')) {
          if (DataBase.getDataBase(sprintf(nonsense_db, room) + "/flag") == null) {
            DataBase.setDataBase(sprintf(nonsense_db, room) + "/flag", "false");
          }

          if (msg == 'ㅇ넌센스' || msg == 'ㄴㅅㅅ') {
            if (DataBase.getDataBase(sprintf(nonsense_db, room) + "/flag") == "false") {
              if (DataBase.getDataBase(sprintf(nonsense_db, room) + "/rank") == null) {
                DataBase.setDataBase(sprintf(nonsense_db, room) + "/rank", "\n");
              }

              coin = DataBase.getDataBase(sprintf(mining_db, sender, "money"));

              if (coin != null) {
                if (parseInt(coin) >= 1000) {
                  try {
                    quiz = Game.setNewQuestion();
                    DataBase.setDataBase(sprintf(nonsense_db, room) + "/sender", sender);
                    DataBase.setDataBase(sprintf(nonsense_db, room) + "/question", quiz.question);
                    DataBase.setDataBase(sprintf(nonsense_db, room) + "/answer", quiz.answer);
                    DataBase.setDataBase(sprintf(nonsense_db, room) + "/hint", quiz.hint);
                    DataBase.setDataBase(sprintf(nonsense_db, room) + "/why", quiz.why);
                    DataBase.setDataBase(sprintf(nonsense_db, room) + "/flag", "true");
                    resp += quiz.question + "\n> 정답을 바로 이야기해보세요. 잘 모르겠으면 '힌트'";

                    if (DataBase.getDataBase(sprintf(nonsense_db, room) +
                      "/rank_" + toStringByFormatting(new Date(), '-')) == null) {
                      DataBase.setDataBase(sprintf(nonsense_db, room) + "/rank", "\n");
                      Log.d("넌센스 랭킹 초기화");
                    }
                  } catch (error) {
                    Log.e(error);
                    resp += "넌센스 문제를 가져오지 못했어요.";
                  }

                  coin = (parseInt(coin) - 1000).toString()
                  DataBase.setDataBase(sprintf(mining_db, sender, "money"), coin);

                  resp += "\n" + sender + "님의 남은 돈 : " + priceToString(coin) + "원 (-1000원)";
                } else {
                  resp += "거지는 넌센스 자격이 없습니다." + Lw;
                  resp += sender + "님의 돈 : " + priceToString(coin) + "원";
                }
              } else {
                resp += "'ㅇ채굴'로 돈을 모아 넌센스를 시작해보세요.";
              }
            } else {
              resp += "[" + DataBase.getDataBase(sprintf(nonsense_db, room) + "/question") + "] 문제가 진행 중이에요.\n";
              resp += "다른 문제를 풀고 싶으시면 문제를 시작하신 분이 `ㅇ넌센스 포기` 라고 말씀해주세요.";
            }

          }
          else if (msg.slice(5).startsWith("정답") && isAdmin(sender)) {
            replier.reply(sender, "정답은\n" + DataBase.getDataBase(sprintf(nonsense_db, room) + "/answer"));
          }
          else if ((msg.slice(5).startsWith("그만") || msg.slice(5).startsWith("중지") || msg.slice(5).startsWith("멈춰") || msg.slice(5).startsWith("포기"))
            && (isAdmin(sender) || (sender == DataBase.getDataBase(sprintf(nonsense_db, room) + "/sender")))) {
            DataBase.setDataBase(sprintf(nonsense_db, room) + "/flag", "false");
            resp += "아쉽네요. 정답은\n";
            resp += DataBase.getDataBase(sprintf(nonsense_db, room) + "/answer") + "\n";
            resp += DataBase.getDataBase(sprintf(nonsense_db, room) + "/why");
          }
          else if (msg.slice(5).startsWith("랭킹")) {
            if (msg.slice(8).startsWith("초기화") && isAdmin(sender)) {
              DataBase.setDataBase(sprintf(nonsense_db, room) + "/rank", "\n");
              resp += "넌센스 랭킹을 초기화했어요.";
            }
            else if (msg.slice(8).startsWith("어제")) {
              tmp_str = DataBase.getDataBase(
                sprintf(nonsense_db, room) +
                "/rank_" + toStringByFormatting(new Date(new Date().setDate(new Date().getDate() - 1)), '-'));
              if (tmp_str != null) {
                resp += tmp_str;
              } else {
                resp += "어제 넌센스 랭킹을 조회할 수 없어요.";
              }
            }
            else {
              if (DataBase.getDataBase(sprintf(nonsense_db, room) +
                "/rank_" + toStringByFormatting(new Date(), '-')) == null) {
                DataBase.setDataBase(sprintf(nonsense_db, room) + "/rank", "\n");
                Log.d("넌센스 랭킹 초기화");
              }

              if (DataBase.getDataBase(sprintf(nonsense_db, room) + "/rank") == null) {
                DataBase.setDataBase(sprintf(nonsense_db, room) + "/rank", "\n");
                resp += "넌센스가 한 번도 진행되지 않았어요. `ㅇ넌센스`로 시작해보세요.";
              } else {

                rank_list = DataBase.getDataBase(sprintf(nonsense_db, room) + "/rank").split('\n');
                rank = {};
                for (let i = 0; i < rank_list.length; i++) {
                  if (rank_list[i].length > 0) {
                    if (rank_list[i] in rank) {
                      rank[rank_list[i]] += 1;
                    } else {
                      rank[rank_list[i]] = 1;
                    }
                  }
                }

                if (Object.keys(rank).length > 0) {
                  date = new Date();

                  resp += "🏆넌센스 랭킹\n";
                  resp += "-------------------\n";
                  resp += makeRankingStr(rank, "nonsense");
                  resp += "-------------------\n";
                  resp += "초기화 ";
                  if (23 - date.getHours() > 0) {
                    resp += (23 - date.getHours()).toString() + "시간 ";
                  }
                  resp += (60 - date.getMinutes()).toString() + "분 전";
                } else {
                  resp += "아직 아무도 맞춘 적이 없네요. `ㅇ넌센스`로 시작해보세요.";
                }
              }
            }
          }
        }
        else if (msg.startsWith('ㅇ책 ')) {
          try {
            input = msg.slice(3);
            if (input.startsWith("검색")) {
              input_title = input.slice(2).trim();
              if (input_title.length > 0) {
                const book_json = org.jsoup.Jsoup.connect(naverSearchBookUrl + "?sort=date&display=5&query=" + input_title)
                  .header("X-Naver-Client-Id", naverId)
                  .header("X-Naver-Client-Secret", naverSecret)
                  .ignoreContentType(true).get().text();

                const book_obj = JSON.parse(book_json);

                if (parseInt(book_obj['total']) > 0) {
                  hdr = input_title;
                  tit = [];
                  ctx = [];
                  thu = [];
                  lnk = [];
                  for (let i = 0; i < book_obj['items'].length; i++) {
                    tit.push(book_obj['items'][i]['title']);
                    ctx.push(book_obj['items'][i]['author'].replace(/\^/gi, ",") + ", " + book_obj['items'][i]['publisher']);
                    thu.push(book_obj['items'][i]['image']);
                    lnk.push(book_obj['items'][i]['link']);
                  }
                  all_link = 'https://msearch.shopping.naver.com/book/search?query=' + input_title;

                  book_result = "";
                  book_result += "책 이름 : " + book_obj['items'][0]['title'] + "\n";
                  book_result += "저자 : " + book_obj['items'][0]['author'] + "\n";
                  if (book_obj['items'][0]['discount'] == null || book_obj['items'][0]['discount'] == undefined) {
                    book_result += "가격 : 가격 정보 없음\n";
                  } else {
                    book_result += "가격 : " + book_obj['items'][0]['discount'] + "\n";
                  }
                  book_result += "출판사 : " + book_obj['items'][0]['publisher'] + "\n";
                  book_result += "출판일 : " + book_obj['items'][0]['pubdate'] + "\n";
                  book_result += "요약 : " + book_obj['items'][0]['description'] + "\n";
                  book_result += "링크 : " + book_obj['items'][0]['link'] + "\n";

                  Bridge.getScopeOf("comm").Kakao.sendLink(
                    room,
                    {
                      template_id: 82041,
                      template_args: {
                        "HDR": hdr,
                        "LNK": all_link,
                        "THU_1": thu[0],
                        "TIT_1": tit[0],
                        "CTX_1": ctx[0],
                        "LNK_1": lnk[0],
                        "THU_2": thu[1],
                        "TIT_2": tit[1],
                        "CTX_2": ctx[1],
                        "LNK_2": lnk[1],
                        "THU_3": thu[2],
                        "TIT_3": tit[2],
                        "CTX_3": ctx[2],
                        "LNK_3": lnk[2],
                        "THU_4": thu[3],
                        "TIT_4": tit[3],
                        "CTX_4": ctx[3],
                        "LNK_4": lnk[3],
                        "THU_5": thu[4],
                        "TIT_5": tit[4],
                        "CTX_5": ctx[4],
                        "LNK_5": lnk[4],
                      },
                    },
                    "custom"
                  )
                    .then((e) => {
                    })
                    .catch((e) => {
                      replier.reply(book_result);
                    });

                } else {
                  resp += "책 검색결과가 없어요.";
                }
              } else {
                resp += "책 이름이 올바르지 않아요.";
              }
            }
          } catch (error) {
            resp += "책 검색을 실패했어요.";
            Log.e(error);
          }
        } else if (msg.startsWith("ㅇ채굴") || msg.startsWith("ㅇㅊㄱ")) {

          coin = DataBase.getDataBase(sprintf(mining_db, sender, "money"));

          if (msg == "ㅇ채굴" || msg == "ㅇㅊㄱ") {
            if (coin != null) {
              DataBase.setDataBase(sprintf(mining_db, sender, "del_flag"), "false");
              resp += miningSomething(sender);
            } else {
              resp += sender + "님은 채굴중이지 않습니다. 'ㅇ채굴 가입'으로 채굴을 시작해보세요.";
            }
          } else if (msg.slice(4).startsWith("가입") || msg.slice(4).startsWith("시작")) {
            if (coin != null) {
              resp += sender + "님은 이미 채굴 중입니다. 'ㅇ채굴(ㅊㄱ)' 로 채굴해보세요.";
            } else {
              DataBase.setDataBase(sprintf(mining_db, sender, "money"), "0");
              DataBase.setDataBase(sprintf(mining_db, sender, "gemstones"), "\n");
              DataBase.setDataBase(sprintf(mining_db, sender, "del_flag"), "false");
              resp += sender + "님, 이제 'ㅇ채굴(ㅊㄱ)' 로 채굴해보세요.";
              resp += "\n주의!" + "\n너무 많이, 빠르게 채굴하면 카톡 정지당할 수 있어요.";
            }
          }
          else if (msg.slice(4).startsWith("확인") || msg.slice(4).startsWith("현황") || msg.slice(4).startsWith("기록")) {
            if (coin != null) {
              DataBase.setDataBase(sprintf(mining_db, sender, "del_flag"), "false");

              gemstones = DataBase.getDataBase(sprintf(mining_db, sender, "gemstones"));
              diamond = (gemstones.match(/1/g) || []).length;
              sapphire = (gemstones.match(/2/g) || []).length;
              ruby = (gemstones.match(/3/g) || []).length;
              garnet = (gemstones.match(/4/g) || []).length;
              gold = (gemstones.match(/5/g) || []).length;
              silver = (gemstones.match(/6/g) || []).length;
              bronze = (gemstones.match(/7/g) || []).length;
              stone = (gemstones.match(/8/g) || []).length;

              resp += sender + "님의 돈 : " + priceToString(coin) + "원" + Lw + "\n";
              resp += "------------------------------\n";
              resp += "다이아몬드\t: " + diamond + "개\n";
              resp += "사파이어\t: " + sapphire + "개\n";
              resp += "루비\t\t: " + ruby + "개\n";
              resp += "가넷\t\t: " + garnet + "개\n";
              resp += "금\t\t: " + gold + "개\n";
              resp += "은\t\t: " + silver + "개\n";
              resp += "동\t\t: " + bronze + "개\n";
              resp += "짱돌\t\t: " + stone + "개\n";
              resp += "------------------------------\n";
              resp += "'ㅇ채굴 판매' 로 원석들을 팔아 돈을 모아보세요.";
            } else {
              resp += sender + "님은 채굴중이지 않습니다. 'ㅇ채굴 가입'으로 채굴을 시작해보세요.";
            }
          }
          else if (msg.slice(4).startsWith("판매") || msg.slice(4).startsWith("팔기")) {
            if (coin != null) {
              DataBase.setDataBase(sprintf(mining_db, sender, "del_flag"), "false");

              gemstones = DataBase.getDataBase(sprintf(mining_db, sender, "gemstones"));
              diamond = (gemstones.match(/1/g) || []).length;
              sapphire = (gemstones.match(/2/g) || []).length;
              ruby = (gemstones.match(/3/g) || []).length;
              garnet = (gemstones.match(/4/g) || []).length;
              gold = (gemstones.match(/5/g) || []).length;
              silver = (gemstones.match(/6/g) || []).length;
              bronze = (gemstones.match(/7/g) || []).length;
              stone = (gemstones.match(/8/g) || []).length;

              sales =
                parseInt(diamond) * 100000 +
                parseInt(sapphire) * 7000 +
                parseInt(ruby) * 5000 +
                parseInt(garnet) * 3000 +
                parseInt(gold) * 1000 +
                parseInt(silver) * 300 +
                parseInt(bronze) * 200 +
                parseInt(stone) * 100;
              if (sales > 0) {
                coin = (parseInt(coin) + sales).toString();
                resp += "원석들을 전부 판매해서 " + priceToString(sales) + "원을 벌었어요.\n";
                resp += sender + "님의 돈 : " + priceToString(coin) + "원\n" + Lw;
                DataBase.setDataBase(sprintf(mining_db, sender, "money"), coin);
                DataBase.setDataBase(sprintf(mining_db, sender, "gemstones"), "\n");

                resp += "판매 목록\n";
                resp += "------------------------------\n";
                resp += "다이아몬드\t: " + diamond + "개, " + priceToString(parseInt(diamond) * 100000) + "원\n";
                resp += "사파이어\t: " + sapphire + "개, " + priceToString(parseInt(sapphire) * 7000) + "원\n";
                resp += "루비\t\t: " + ruby + "개, " + priceToString(parseInt(ruby) * 5000) + "원\n";
                resp += "가넷\t\t: " + garnet + "개, " + priceToString(parseInt(garnet) * 3000) + "원\n";
                resp += "금\t\t: " + gold + "개, " + priceToString(parseInt(gold) * 1000) + "원\n";
                resp += "은\t\t: " + silver + "개, " + priceToString(parseInt(silver) * 300) + "원\n";
                resp += "동\t\t: " + bronze + "개, " + priceToString(parseInt(bronze) * 200) + "원\n";
                resp += "짱돌\t\t: " + stone + "개, " + priceToString(parseInt(stone) * 100) + "원\n";
              } else {
                resp += "원석이 없어요. 'ㅇ채굴(ㅊㄱ)'로 채굴해보세요.";
              }

            } else {
              resp += sender + "님은 채굴중이지 않습니다. 'ㅇ채굴 가입'으로 채굴을 시작해보세요.";
            }
          } else if (msg.slice(4).startsWith("초기화") || msg.slice(4).startsWith("삭제")) {
            if (coin != null) {
              del_flag = DataBase.getDataBase(sprintf(mining_db, sender, "del_flag"));
              if (del_flag.includes("false")) {
                del_flag = DataBase.setDataBase(sprintf(mining_db, sender, "del_flag"), "true");
                resp += "채굴 기록을 초기화하려면 한 번 더 'ㅇ채굴 초기화' 하세요.";
              } else if (del_flag.includes("true")) {
                resp += sender + "님의 채굴 기록을 초기화합니다.";
                DataBase.setDataBase(sprintf(mining_db, sender, "money"), "0");
                DataBase.setDataBase(sprintf(mining_db, sender, "gemstones"), "\n");
                DataBase.setDataBase(sprintf(mining_db, sender, "del_flag"), "false");
              }
            }
          }
          else if (msg.slice(4).startsWith("랭킹")) {
            if (msg.slice(7).startsWith("등록") || msg.slice(7).startsWith("참가") || msg.slice(7).startsWith("가입")) {
              mining_ranking = DataBase.getDataBase(sprintf(mining_db, "room/" + room, "rank"));
              if (mining_ranking == null) {
                DataBase.setDataBase(sprintf(mining_db, "room/" + room, "rank"), "\n");
                mining_ranking = DataBase.getDataBase(sprintf(mining_db, "room/" + room, "rank"));
              }
              if (!mining_ranking.includes(sender)) {
                DataBase.appendDataBase(sprintf(mining_db, "room/" + room, "rank"), sender + "\n");
                resp += "랭킹에 등록했습니다. 'ㅇ채굴 랭킹'으로 확인해보세요.";
              } else {
                resp += "이미 랭킹에 등록되어있어요.";
              }
            }
            else {
              if (DataBase.getDataBase(sprintf(mining_db, "room/" + room, "rank")) == null) {
                resp += "랭킹에 아무도 등록하지 않았어요. 'ㅇ채굴 랭킹 등록'으로 등록해보세요.";
              } else {
                rank_list = DataBase.getDataBase(sprintf(mining_db, "room/" + room, "rank")).split('\n');

                rank = {};
                for (let i = 0; i < rank_list.length; i++) {
                  if (rank_list[i].length > 0) {
                    m = DataBase.getDataBase(sprintf(mining_db, rank_list[i], "money"));
                    if (m != null) {
                      rank[rank_list[i]] = m;
                    }
                  }
                }

                if (Object.keys(rank).length > 0) {
                  date = new Date();

                  resp += "🏆채굴 랭킹\n";
                  resp += "-------------------------\n";
                  resp += makeRankingStr(rank, "mining");
                  resp += "-------------------------";
                } else {
                  resp += "아직 아무도 채굴하지 않았네요. `ㅇ채굴(ㅊㄱ)`로 채굴해보세요.";
                }
              }
            }
          }
          else {
            if (coin != null) {
              DataBase.setDataBase(sprintf(mining_db, sender, "del_flag"), "false");
              resp += miningSomething(sender);
            } else {
              resp += sender + "님은 채굴중이지 않습니다. 'ㅇ채굴 가입'으로 채굴을 시작해보세요.";
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
*/
/* 사로로 - 네이버 넌센스 퀴즈 모듈 https://cafe.naver.com/nameyee/37912 */
const { NonSenseGame } = require('nonsense');
const Game = new NonSenseGame();

/* 허허허 - 타자게임 https://cafe.naver.com/nameyee/39390 */
function getAccuracy(str1, str2) {
  str1 = str1.split("");
  str2 = str2.split("");
  let dp = [];
  dp[0] = [];
  for (let i = 0; i < str1.length; i++) {
    dp[i + 1] = [];
    for (let t = 0; t < str2.length; t++) {
      if (str1[i] == str2[t]) {
        dp[i + 1][t + 1] = (dp[i][t] == undefined ? 0 : dp[i][t]) + 1;
      } else {
        dp[i + 1][t + 1] = Math.max((dp[i + 1][t] == undefined ? 0 : dp[i + 1][t]), (dp[i][t + 1] == undefined ? 0 : dp[i][t + 1]));
      }
    }
  }
  let sum = dp[str1.length][str2.length];
  sum = sum / Math.max(str1.length, str2.length) * 100;
  return sum.toFixed(1);
}