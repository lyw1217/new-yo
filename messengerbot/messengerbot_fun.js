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


let db_root = "newyo/db/"
let comm_db = db_root + "comm/";
let fun_db = db_root + "fun/"
let room_db = db_root + "room/";
let user_db = db_root + "user/";
let learn_db = db_root + "learn/";
let learn_db_list = db_root + "learn_list/words";
let kimchi_count = 0 ;

let drwNo = 0;
let lottoUrl = "http://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=";
let data;

let words_list = getLearnedListArr();
const MAX_LEARN_NUM = 500;

function getDrwNo( r ){
  if ( r == 0 ) {
    let dbDrwNo = DataBase.getDataBase(fun_db + "drwNo");
    if ( dbDrwNo == null ) {
      DataBase.setDataBase(fun_db + "drwNo", 1025);
    }
    drwNo = parseInt(dbDrwNo);
  }
  
  try {
    data = Utils.parse(lottoUrl + drwNo.toString()).text();
    data = JSON.parse(data);

    if ( data.returnValue == "success" ) {
      drwNo += 1;
      getDrwNo(1);
    } else {
      drwNo = drwNo - 1;
      DataBase.setDataBase(fun_db + "drwNo", drwNo);
    }
  } catch (error) {
    Log.e("Failed to get drxNo." + error , true);
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
    return null;
  }
  
  return db_word.split('\n');
}

function response(
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
  if ( run == null) {
    DataBase.setDataBase(comm_db + "run", "t");
  }

  if (run == "t") {
    words_list = getLearnedListArr();
    if ( words_list.includes(msg) ) {
      resp += DataBase.getDataBase(learn_db + msg);
    } else {   
      try {
        if (msg.includes("/로또")) {
          if (msg.includes("생성")) {
            let numbers = new Set();
            while ( numbers.size < 6 ) {
              numbers.add(getRandomIntInclusive(1,45));
            }

            const arr_numbers = Array.from(numbers);
            arr_numbers.sort(function(a, b){
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
              if ( data.returnValue == "success" ){
                resp += data.drwNo + "회차 (" + data.drwNoDate + ")\n당첨 번호 : "
                + data.drwtNo1.toString() + ", "
                + data.drwtNo2.toString() + ", "
                + data.drwtNo3.toString() + ", "
                + data.drwtNo4.toString() + ", "
                + data.drwtNo5.toString() + ", "
                + data.drwtNo6.toString() + " + "
                + data.bnusNo.toString();
              } else {
                resp += "로또 회차 정보를 조회하지 못했어요.";  
              }
            } catch (error) {
              resp += "로또 회차 정보를 조회하지 못했어요.";
            }
          }
        } else if (msg.includes("/가르치기")) {
          
          if ( msg.includes("영우") ) {
            resp += "어허!";
          } else if ( msg != "/가르치기 " ) {
            const input_learn_words = msg.substring("/가르치기 ".length).trim();
            if ( input_learn_words.includes("=")) {
              const words = input_learn_words.split("=");
              const word1 = words[0].trim();
              const word2 = words[1].trim();
              let f_already = false;
              words_list = getLearnedListArr();
              if ( words_list != null ) {
                for (let w of words_list) {
                  if ( w == word1 ) {
                    f_already = true;
                    break;
                  }
                }
              }

              if ( !f_already ) {
                if ( words_list.length > MAX_LEARN_NUM ) {
                  resp += "너무 많이 배웠어요.";  
                } else {
                  DataBase.setDataBase(learn_db + word1, word2);
                  DataBase.appendDataBase(learn_db_list, word1 + "\n");
                  resp += word1 + "을(를) ";
                  resp += word2 + "(으)로 학습했어요.";
                }
              } else {
                resp += word1 + "은(는) 이미 ";
                resp += DataBase.getDataBase(learn_db + word1) + "(으)로 학습되어 있어요.";
              }
            }
          }
        } else if (msg.includes("/학습제거")) {
          if ( msg != "/학습제거 " ) {
            const input_del_words = msg.substring("/학습제거 ".length).trim();
            let db_word = DataBase.getDataBase(learn_db + input_del_words);
            if ( db_word != null ) {
              if ( DataBase.removeDataBase(learn_db + input_del_words) ) {
                words_list = getLearnedListArr();
                if ( words_list != null ) {
                  let filtered_list = words_list.filter((element) => element !== input_del_words);
                  DataBase.setDataBase(learn_db_list, filtered_list.join('\n'));
                  resp += input_del_words + " 단어 학습 내용을 제거했어요.";
                } else {
                  resp += "제거할 " + input_del_words + "이(가) list에 존재하지 않아요.";
                }
              } else {
                resp += input_del_words + " 단어 학습 내용을 제거하는데 실패했어요.";
              }
            } else {
              resp += input_del_words + " 단어는 학습하지 않았어요.";
            }
          }
        } else if (msg.includes("/학습리스트") && sender.includes("master")) {
          if ( msg.includes("제거") ) {
            const del_count = parseInt(msg.substring("/학습리스트 제거 ".length).trim());
            words_list = getLearnedListArr();
            if ( words_list != null ) {
              words_list.splice(0, del_count);
              DataBase.setDataBase(learn_db_list, words_list.join('\n'));
              resp += "오래된 " + del_count.toString() + "개 단어들의 학습 내용을 제거했어요.";
            }
          } else {
            words_list = getLearnedListArr();
            if ( words_list.length > 1) {
              for ( let v of words_list ) {
                if ( v.length > 0)
                  resp += v + " => " + DataBase.getDataBase(learn_db + v) + '\n';
              }
            } else {
              resp += "학습한 내용이 없어요.";
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

function onStart(activity) {
  words_list = getLearnedListArr();
}
function onResume(activity) {}
function onPause(activity) {}
function onStop(activity) {}