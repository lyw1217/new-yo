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


let comm_db_root = "newyo/db/comm/";
let room_db_root = "newyo/db/room/";
let user_db_root = "newyo/db/user/";
let kimchi_count = 0 ;

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
  let run = DataBase.getDataBase(comm_db_root + "run");
  if ( run == null) {
    DataBase.setDataBase(comm_db_root + "run", "t");
  }

  if (msg.includes("/그만") || msg.includes("/stop")) {
    if ( sender.includes("지훈") && kimchi_count < 3) {
      resp += "삐빅- 김지훈의 말은 듣지 않는다.";
      kimchi_count += 1;
    } else {
      if ( sender.includes("지훈") && kimchi_count >= 3 ) {
        resp += "삑- 한번 들어줌. ";
        kimchi_count = 0;
      }
      resp += "그만쓰";
      DataBase.setDataBase(comm_db_root + "run", "f");
    }
  } else if (msg.includes("/시작") || msg.includes("/start")) {
    if ( sender.includes("지훈") && kimchi_count < 3) {
      resp += "삐빅- 김지훈의 말은 듣지 않는다.";
      kimchi_count += 1;
    } else {
      if ( sender.includes("지훈") && kimchi_count >= 3 ) {
        resp += "삑- 한번 들어줌. ";
        kimchi_count = 0;
      }
      resp += "시작쓰";
      DataBase.setDataBase(comm_db_root + "run", "t");
    }
  }

  if (run == "t") {
    try {
      if (msg.includes("/뉴스") || msg.includes("/1")) {
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
      else if (msg.includes("/한경") || msg.includes("/2")) {
        try {
          data = Utils.parse(url + article_qry + "hankyung").text();
          data = JSON.parse(data);
          resp = data.contents[0].content;  
        } catch (error) {
          resp += "뉴스를 조회하지 못했습니다.";
        }
      }
      
      // 매경
      else if (msg.includes("/매경") || msg.includes("/3")) {
        try {
          data = Utils.parse(url + article_qry + "maekyung").text();
          data = JSON.parse(data);
          resp = data.contents[0].content;  
        } catch (error) {
          resp += "뉴스를 조회하지 못했습니다.";
        }
      }
      
      // 간추린뉴스
      else if (msg.includes("/간추린") || msg.includes("/4")) {
        try {
          data = Utils.parse(url + article_qry + "quicknews").text();
          data = JSON.parse(data);
          resp = data.contents[0].content;  
        } catch (error) {
          resp += "뉴스를 조회하지 못했습니다.";
        }
      }
      
      // HELP
      else if ( msg.includes("/기능") || msg.includes("/?") || msg.includes("/h") ) {
        resp += "------------  기능  ------------\n\u200b";
        resp += "1. '/뉴스'\n\t 전체 조회\n";
        resp += "2. '/한경'\n\t 한경 Issue Today 조회\n";
        resp += "3. '/매경'\n\t 매경 매.세.지 조회\n";
        resp += "4. '/간추린'\n\t 간추린뉴스 조회\n";
        resp += "-. '/지금 [동네] 날씨'\n\t 오늘 날씨 조회\n";
        resp += "-. '/내일 [동네] 날씨'\n\t 내일 날씨 조회\n";
        resp += "--------------------------------\n";
        resp += "'/숫자'로 기능을 사용할 수도 있습니다.\n";
        resp += "'/날씨'로 날씨 기능을 확인할 수 있습니다.";
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

      Api.replyRoom("이영우", resp);  
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
