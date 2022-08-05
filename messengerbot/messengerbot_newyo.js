const scriptName = "newyo";
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
 let room_db = db_root + "room/";
 let user_db = db_root + "user/";
let kimchi_count = 0 ;

function printMainHelp() {
  let temp_str = "";
  temp_str += "--------  영우로봇 기능  -------\n\u200b";
  temp_str += "  1. 일일 요약 뉴스 조회 기능\n";
  temp_str += "  2. 지금 날씨 조회 기능\n";
  temp_str += "  3. 소소한 기능들\n";
  temp_str += "  '/기능 (숫자)'로 자세한 설명을 볼 수 있어요.";
  return temp_str;
}
function printNewsHelp() {
  let temp_str = "";
  temp_str += "------------  뉴스  ------------\n\u200b";
  temp_str += "- '/뉴스'\n\t 전체 조회\n";
  temp_str += "- '/한경'\n\t 한경 Issue Today 조회\n";
  temp_str += "- '/매경'\n\t 매경 매.세.지 조회\n";
  temp_str += "- '/간추린'\n\t 간추린뉴스 조회";

  return temp_str;
}

function printWeatherHelp() {

  let temp_str = "";
  temp_str += "------------  날씨  ------------\n\u200b";
  temp_str += "현재 시간을 기준으로 날씨 정보를 알려줍니다.\n";
  temp_str += "- '/지금 (동네) 날씨'\n\t - 지금 날씨 조회\n";
  temp_str += "- '/예보 (지역)'\n\t - 오늘의 기상 예보 조회\n";
  //temp_str += "'/오늘 (동네) 날씨'\n\t - 오늘 날씨 조회(미지원)\n";
  //temp_str += "'/내일 (동네) 날씨'\n\t - 내일 날씨 조회(미지원)\n";
  temp_str += "[예시]\n";
  temp_str += "\t/지금 서현 날씨\n";
  temp_str += "\t/예보 서울\n";
  //temp_str += "\t/오늘 성남 분당 날씨(미지원)\n";
  //temp_str += "\t/내일 경기 하남 위례 날씨(미지원)\n";
  temp_str += "------------------------------\n";
  temp_str += "띄어쓰기로 명령어와 동네 키워드들을 구분해주세요.\n";
  temp_str += "동네 키워드는 최대 3개까지 가능합니다.\n";
  temp_str += "예보 제공사 : 기상청";

  return temp_str;
}

function printFcstHelp() {

  let temp_str = "";
  temp_str += "------------  예보  ------------\n\u200b";
  temp_str += "오늘의 기상 중기 예보를 알려줍니다.\n";
  temp_str += "- '/예보 (지역)'\n\t - 오늘의 기상 예보 조회\n";
  temp_str += "[예시]\n";
  temp_str += "\t/예보 서울\n";
  temp_str += "------------------------------\n";
  temp_str += "띄어쓰기로 명령어와 지역 키워드를 구분해주세요.\n";
  temp_str += "지역 : 전국, 서울, 경기, 강원, 충북, 대전\n";
  temp_str += "       세종, 충남, 전북, 광주, 전남, 대구\n";
  temp_str += "       경북, 부산, 울산, 경남, 제주\n";
  temp_str += "예보 제공사 : 기상청";

  return temp_str;
}

function printFunHelp() {
  let temp_str = "";
  temp_str += "------------  소소  ------------\n\u200b";
  temp_str += "- '/로또' : 최근 로또 당첨번호 조회\n";
  temp_str += "\t - '/로또 생성' : 랜덤 번호 생성\n";
  temp_str += "- '/가르치기' : 단어 가르치기\n";
  temp_str += "\t - '/가르치기 A=B' : A는 B라고 가르치기\n";
  temp_str += "- '/학습제거' : 가르친 단어 잊게 하기\n";
  temp_str += "\t - '/학습제거 A' : A라고 가르친 단어 제거";

  return temp_str;
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
  let url = "http://mumeog.site:30100";
  let article_qry = "/article?paper=";
  let data;
  let resp = "";
  let run = DataBase.getDataBase(comm_db + "run");
  if ( run == null) {
    DataBase.setDataBase(comm_db + "run", "t");
  }

  if (msg.includes("/그만") || msg.includes("/stop")) {
    if ( sender.includes("지훈") && kimchi_count < 2) {
      resp += "삐빅- 김지훈의 말은 듣지 않는다.";
      kimchi_count += 1;
    } else {
      if ( sender.includes("지훈") && kimchi_count >= 2 ) {
        resp += "삑- 한번 들어줌. ";
        kimchi_count = 0;
      }
      resp += "그만쓰";
      DataBase.setDataBase(comm_db + "run", "f");
    }
  } else if (msg.includes("/시작") || msg.includes("/start")) {
    if ( sender.includes("지훈") && kimchi_count < 2) {
      resp += "삐빅- 김지훈의 말은 듣지 않는다.";
      kimchi_count += 1;
    } else {
      if ( sender.includes("지훈") && kimchi_count >= 2 ) {
        resp += "삑- 한번 들어줌. ";
        kimchi_count = 0;
      }
      resp += "시작쓰";
      DataBase.setDataBase(comm_db + "run", "t");
    }
  }

  if (run == "t") {
    try {
      if (msg.includes("/뉴스")) {
        try {
          data = Utils.parse(url + "/article").text();
          data = JSON.parse(data);
          for (let i = 0; i < data.contents.length; i++) {
            resp +=
              "[ " + data.contents[i].paper + " ]\n" + data.contents[i].content;
            if (i != data.contents.length - 1) {
              resp += "\n\n";
            }
          }
        } catch (error) {
          resp += "뉴스를 조회하지 못했습니다.";
        }
      }

      // 한경
      else if (msg.includes("/한경")) {
        try {
          data = Utils.parse(url + article_qry + "hankyung").text();
          data = JSON.parse(data);
          resp = data.contents[0].content;  
        } catch (error) {
          resp += "뉴스를 조회하지 못했습니다.";
        }
      }
      
      // 매경
      else if (msg.includes("/매경")) {
        try {
          data = Utils.parse(url + article_qry + "maekyung").text();
          data = JSON.parse(data);
          resp = data.contents[0].content;  
        } catch (error) {
          resp += "뉴스를 조회하지 못했습니다.";
        }
      }
      
      // 간추린뉴스
      else if (msg.includes("/간추린")) {
        try {
          data = Utils.parse(url + article_qry + "quicknews").text();
          data = JSON.parse(data);
          resp = data.contents[0].content;  
        } catch (error) {
          resp += "뉴스를 조회하지 못했습니다.";
        }
      }
      
      // HELP
      else if ( msg.includes("/기능") ) {
        if ( msg != "/기능" ) {
          const input_help = msg.substring("/기능 ".length).trim();
          if ( input_help.includes("1") ) {
            resp += printNewsHelp();
          } else if ( input_help.includes("2") ) {
            resp += printWeatherHelp();
          } else if ( input_help.includes("3") ) {
            resp += printFunHelp();
          }
        } else {
          resp += printMainHelp();
        }
      }
      
      else if ( msg == "/날씨" ) {
        resp += printWeatherHelp();
      }

      else if ( msg == "/예보" ) {
        resp += printFcstHelp();
      }
    } catch (error) {
      resp = "에러 발생.\n err : " + error;
    }
  }

  if (resp != "") {
    replier.reply(resp);
  }
}

const INTER = setInterval(() => {
  date = new Date();
  let url = "http://mumeog.site:30100/article";
  let data;
  let resp = "";
  
  if (date.getHours() == 8 && date.getMinutes() == 30 && date.getSeconds() == 0) {
    try {
      data = Utils.parse(url).text();
      data = JSON.parse(data);
      for (let i = 0; i < data.contents.length; i++) {
        resp +=
          "[ " + data.contents[i].paper + " ]\n" + data.contents[i].content;
        if (i != data.contents.length - 1) {
          resp += "\n\n";
        }
      }

      Api.replyRoom("master", resp);  
    } catch (error) {
      resp = "";
    }
  }
}, 1000);

//아래 4개의 메소드는 액티비티 화면을 수정할때 사용됩니다.
function onCreate(savedInstanceState, activity) {
  var textView = new android.widget.TextView(activity);
  textView.setText("Hello, World!");
  textView.setTextColor(android.graphics.Color.DKGRAY);
  activity.setContentView(textView);
}
const onStartCompile = () => clearInterval(INTER);

function onStart(activity) {}
function onResume(activity) {}
function onPause(activity) {}
function onStop(activity) {}
