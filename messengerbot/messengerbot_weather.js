const scriptName = "weather";
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

/*
-- 서버단에서 파싱하는 것으로 변경
input : json_object, day(0:오늘, 1:내일)
return : string | 파싱된 문자열
*/
function parseWeather(
  data,
  day
) {
  let parsed_data = ""
  // 0: 1시간 기온, 5: 하늘 상태, 6: 강수 형태, 7: 강수 확률, 9: 강수량, 10: 습도, 11: 1시간 신적설
  parsed_data += data.contents[day][0].fcstDate.substr(0,4) + "년 " + data.contents[day][0].fcstDate.substr(4,2) + "월 " + data.contents[day][0].fcstDate.substr(6,2) + "일 " + "\n";
  parsed_data += data.contents[day][0].fcstTime + "\n";
  parsed_data += data.contents[day][0].category + ' : ';
  parsed_data += data.contents[day][0].fcstValue + "\n";
  parsed_data += data.contents[day][5].category + '   : ';
  parsed_data += data.contents[day][5].fcstValue + "\n";
  parsed_data += data.contents[day][6].category + '   : ';
  parsed_data += data.contents[day][6].fcstValue + "\n";
  parsed_data += data.contents[day][7].category + '   : ';
  parsed_data += data.contents[day][7].fcstValue + "\n";
  parsed_data += data.contents[day][9].category + '       : ';
  parsed_data += data.contents[day][9].fcstValue + "\n";
  parsed_data += data.contents[day][10].category + '          : ';
  parsed_data += data.contents[day][10].fcstValue ;
  if (data.contents[day][11].fcstValue != "적설없음") {
    parsed_data += "\n";
    parsed_data += data.contents[day][11].category + ': ';
    parsed_data += data.contents[day][11].fcstValue;
  }

  return parsed_data;
}

/*
input : array | split된 키워드 문자열 배열
return : object | {array 파싱된 키워드, string 응답 문자열}
응답 문자열의 길이가 0 보다 큰 경우 키워드 파싱 오류
*/
function parseKeywords(
  input
) {
  let k = ["", "", ""] ;
  let response_data = "";
  
  switch (input.length) {
    case 5:
      if (!input[3].includes("날씨")) {
        k[2] = input[3];
      }
      
    case 4:
      if (!input[2].includes("날씨")) {
        k[1] = input[2];
      }
    case 3:
      if (!input[1].includes("날씨")) {
        k[0] = input[1];
      }
      break;
    default:
      response_data += "키워드를 올바르게 입력해주세요.";
      break;
  }

  return {
    k : k,
    response_data : response_data
  };
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
  const url = "http://mumeog.site:30100";
  const weather_qry = "/weather?";
  let data;
  let resp = "";
  
  let run = DataBase.getDataBase(comm_db + "run");
  if ( run == null) {
    DataBase.setDataBase(comm_db + "run", "t");
  }

  if (run == "t") {
    try {
      if (msg.includes("/지금") && msg.includes("날씨")) {
        const input_now_keywords = msg.split(' ');
        if ( input_now_keywords.length < 3 ) {
          return;
        }
        let keywords = parseKeywords(input_now_keywords);
        resp += keywords.response_data;

        if ( keywords.response_data.length == 0 ) {
          const tod_params = "&k1=" + keywords.k[0] + "&k2=" + keywords.k[1] + "&k3=" + keywords.k[2] + "&p=0";
          try {
            data = Utils.parse(url + weather_qry + tod_params).text();
            resp += data.split('@').join('\n');
          } catch (error) {
            resp += "지역을 찾지 못했습니다.";
          }
        }
      }

      else if (msg.includes("/예보")) {

        const input_fcst_keywords = msg.split(' ');

        if (input_fcst_keywords.length > 1) {
          try {
            data = Utils.parse(url + weather_qry + "mid=" + input_fcst_keywords[1]).text();
            resp += data.split('@').join('\n');
          } catch (error) {
            resp += "'/예보' 로 가능한 지역을 확인해보세요.";
            Log.d(error, true);
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
