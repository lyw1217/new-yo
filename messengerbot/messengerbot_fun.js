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
let musume_db = Bridge.getScopeOf("comm").musume_db;
let nonsense_db = Bridge.getScopeOf("comm").nonsense_db;
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
  const newyo_commands = ["ㅇ뉴스", "ㅇ한경", "ㅇ매경", "ㅇ간추린", "ㅇ구독"];
  const comm_commands = ["ㅇ시작", "ㅇ그만", "ㅇ기능", "ㅇ날씨", "ㅇ예보", "ㅇ루트"];
  const fun_commands = ["ㅇ로또", "ㅇ가르치기", "ㅇ학습제거", "ㅇ학습리스트", "ㅇ로마", "ㅇ번역", "ㅇ오점무", "ㅇ운세", "ㅇ무스메", "ㅇ넌센스", "힌트"];
  if (regex.test(str)) return true;
  if (newyo_commands.includes(str) > -1) return true;
  if (comm_commands.includes(str) > -1) return true;
  if (fun_commands.includes(str) > -1) return true;

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

function makeRankingStr(rank) {
  let str = "";
  str += "🏆넌센스 랭킹\n";
  str += "-------------------\n";

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
    person = person.padEnd(7, '　') + " : " + items[i][1] + "점\n";
    str += person;
  }
  str += "-------------------\n";

  return str;
}

function saveRanking(room) {
  let str = "";

  let rank_list = DataBase.getDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/rank").split('\n');
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

  str += makeRankingStr(rank);

  DataBase.setDataBase(
    Bridge.getScopeOf("comm").sprintf(nonsense_db, room) +
    "/rank_" + Bridge.getScopeOf("comm").toStringByFormatting(new Date(), '-')
    , str);
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

  let run = DataBase.getDataBase(Bridge.getScopeOf("comm").sprintf(Bridge.getScopeOf("comm").room_run_db, room));
  if (run == null) {
    DataBase.setDataBase(Bridge.getScopeOf("comm").sprintf(Bridge.getScopeOf("comm").room_run_db, room), "t");
  }

  if (DataBase.getDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/flag") == "true") {

    acc = getAccuracy(msg, DataBase.getDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/answer"));
    if (acc > 82.0) {
      resp += sender + "님, 정답이에요! (정확도:" + acc.toString() + "%)\n";
      resp += DataBase.getDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/why");
      DataBase.setDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/flag", "false");
      luck_point = Math.random();

      if (luck_point < 0.0001) {
        for (let i = 0; i < 100; i++) {
          DataBase.appendDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/rank", sender + "\n");
        }
        resp += "\n🎊0.01% 확률 당첨! +100점";
      } else if (luck_point < 0.001) {
        for (let i = 0; i < 20; i++) {
          DataBase.appendDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/rank", sender + "\n");
        }
        resp += "\n🎉0.1% 확률 당첨! +20점";
      } else if (luck_point < 0.01) {
        for (let i = 0; i < 10; i++) {
          DataBase.appendDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/rank", sender + "\n");
        }
        resp += "\n🎈1% 확률 당첨! +10점";
      }
      else if (luck_point < 0.1) {
        for (let i = 0; i < 5; i++) {
          DataBase.appendDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/rank", sender + "\n");
        }
        resp += "\n🎁10% 확률 당첨! +5점";
      }
      else if (luck_point < 0.2) {
        for (let i = 0; i < 3; i++) {
          DataBase.appendDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/rank", sender + "\n");
        }
        resp += "\n✨20% 확률 당첨! +3점";
      }
      else if (luck_point < 0.3) {
        for (let i = 0; i < 2; i++) {
          DataBase.appendDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/rank", sender + "\n");
        }
        resp += "\n★30% 확률 당첨! +2점";
      } else {
        DataBase.appendDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/rank", sender + "\n");
      }
      
      saveRanking(room);
    } else if (msg.includes("힌트")) {
      resp += "힌트는 " + DataBase.getDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/hint");
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
          if (DataBase.getDataBase(Bridge.getScopeOf("comm").sprintf(musume_db, room)) == null) {
            DataBase.setDataBase(Bridge.getScopeOf("comm").sprintf(musume_db, room), "");
          }

          if (msg.slice(5).startsWith("초기화") || msg.slice(5).startsWith("리셋")) {
            resp += "무스메를 초기화합니다.";
            DataBase.setDataBase(Bridge.getScopeOf("comm").sprintf(musume_db, room), "");

          }

          else if (msg.slice(5).startsWith("확인") || msg.slice(5).startsWith("인원") || msg.slice(5).startsWith("현황")) {
            p_list = DataBase.getDataBase(Bridge.getScopeOf("comm").sprintf(musume_db, room)).split('\n');
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
              p_list = DataBase.getDataBase(Bridge.getScopeOf("comm").sprintf(musume_db, room)).split('\n');
              if (p_list == null) {
                p_list = DataBase.setDataBase(Bridge.getScopeOf("comm").sprintf(musume_db, room), '\n');
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
                DataBase.appendDataBase(Bridge.getScopeOf("comm").sprintf(musume_db, room), p.join('\n') + "\n");
                resp += "무스메 인원 추가 : " + p.join(" ") + " (+" + num.toString() + "명 / 총 " + (num + total_num).toString() + "명)";
              } else {
                resp += "중복되는 인원(" + dup_person.join(", ") + ")이 있어요.";
              }
            } else {
              resp += "`ㅇ무스메 추가 (인원1) (인원2)...` 형식에 맞게 인원을 추가해주세요.";
            }
          }

          else if (msg.slice(5).startsWith("삭제") | msg.slice(5).startsWith("제거") | msg.slice(5).startsWith("제외")) {
            p_list = DataBase.getDataBase(Bridge.getScopeOf("comm").sprintf(musume_db, room)).split('\n');
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
                  Bridge.getScopeOf("comm").sprintf(musume_db, room),
                  filtered_list.join("\n") + "\n"
                );
                resp += input_p + " :  무스메에서 제외했어요.";
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
              p_list = DataBase.getDataBase(Bridge.getScopeOf("comm").sprintf(musume_db, room)).split('\n');
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

        else if (msg.startsWith('ㅇ넌센스')) {
          if (DataBase.getDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/flag") == null) {
            DataBase.setDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/flag", "false");
          }

          if (msg == 'ㅇ넌센스') {
            if (DataBase.getDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/flag") == "false") {
              if (DataBase.getDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/rank") == null) {
                DataBase.setDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/rank", "\n");
              }
              try {
                quiz = Game.setNewQuestion();
                DataBase.setDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/sender", sender);
                DataBase.setDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/question", quiz.question);
                DataBase.setDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/answer", quiz.answer);
                DataBase.setDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/hint", quiz.hint);
                DataBase.setDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/why", quiz.why);
                DataBase.setDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/flag", "true");
                resp += quiz.question + "\n> 정답을 바로 이야기해보세요. 잘 모르겠으면 '힌트'";

                if (DataBase.getDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) +
                  "/rank_" + Bridge.getScopeOf("comm").toStringByFormatting(new Date(), '-')) == null) {
                  DataBase.setDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/rank", "\n");
                  Log.d("넌센스 랭킹 초기화");
                }
              } catch (error) {
                Log.e(error);
                resp += "넌센스 문제를 가져오지 못했어요.";
              }

            } else {
              resp += "[" + DataBase.getDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/question") + "] 문제가 진행 중이에요.\n";
              resp += "다른 문제를 풀고 싶으시면 문제를 시작하신 분이 `ㅇ넌센스 포기` 라고 말씀해주세요.";
            }

          }
          else if (msg.slice(5).startsWith("정답") && Bridge.getScopeOf("comm").isAdmin(sender)) {
            replier.reply(sender, "정답은\n" + DataBase.getDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/answer"));
          }
          else if ((msg.slice(5).startsWith("그만") || msg.slice(5).startsWith("중지") || msg.slice(5).startsWith("멈춰") || msg.slice(5).startsWith("포기"))
            && (Bridge.getScopeOf("comm").isAdmin(sender) || (sender == DataBase.getDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/sender")))) {
            DataBase.setDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/flag", "false");
            resp += "아쉽네요. 정답은\n";
            resp += DataBase.getDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/answer") + "\n";
            resp += DataBase.getDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/why");
          }
          else if (msg.slice(5).startsWith("랭킹")) {
            if (msg.slice(8).startsWith("초기화") && Bridge.getScopeOf("comm").isAdmin(sender)) {
              DataBase.setDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/rank", "\n");
              resp += "넌센스 랭킹을 초기화했어요.";
            }
            else if (msg.slice(8).startsWith("어제")) {
              tmp_str = DataBase.getDataBase(
                Bridge.getScopeOf("comm").sprintf(nonsense_db, room) +
                "/rank_" + Bridge.getScopeOf("comm").toStringByFormatting(new Date(new Date().setDate(new Date().getDate() - 1)), '-'));
              if (tmp_str != null) {
                resp += tmp_str;
              } else {
                resp += "어제 넌센스 랭킹을 조회할 수 없어요.";
              }
            }
            else {
              if (DataBase.getDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) +
                "/rank_" + Bridge.getScopeOf("comm").toStringByFormatting(new Date(), '-')) == null) {
                DataBase.setDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/rank", "\n");
                Log.d("넌센스 랭킹 초기화");
              }

              if (DataBase.getDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/rank") == null) {
                DataBase.setDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/rank", "\n");
                resp += "넌센스가 한 번도 진행되지 않았어요. `ㅇ넌센스`로 시작해보세요.";
              } else {

                rank_list = DataBase.getDataBase(Bridge.getScopeOf("comm").sprintf(nonsense_db, room) + "/rank").split('\n');
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

                  resp += makeRankingStr(rank);
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