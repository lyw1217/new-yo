const db_root = "newyo/db/";
const comm_db = db_root + "comm/";
const apikey_db = comm_db + "apikey";
const admin_db = db_root + "comm/admin";
const ban_sender_db = db_root + "comm/ban_sender";
const room_db = db_root + "room/";
const subslist_db = db_root + "subslist";
const subs_hour = 23;
const subs_min = 8;

const bot = BotManager.getCurrentBot();

/**
 * (string) msg.content: 메시지의 내용
 * (string) msg.room: 메시지를 받은 방 이름
 * (User) msg.author: 메시지 전송자
 * (string) msg.author.name: 메시지 전송자 이름
 * (Image) msg.author.avatar: 메시지 전송자 프로필 사진
 * (string) msg.author.avatar.getBase64()
 * (boolean) msg.isGroupChat: 단체/오픈채팅 여부
 * (boolean) msg.isDebugRoom: 디버그룸에서 받은 메시지일 시 true
 * (string) msg.packageName: 메시지를 받은 메신저의 패키지명
 * (void) msg.reply(string): 답장하기
 */
function onMessage(msg) {}
bot.addListener(Event.MESSAGE, onMessage);


/**
 * (string) msg.content: 메시지의 내용
 * (string) msg.room: 메시지를 받은 방 이름
 * (User) msg.author: 메시지 전송자
 * (string) msg.author.name: 메시지 전송자 이름
 * (Image) msg.author.avatar: 메시지 전송자 프로필 사진
 * (string) msg.author.avatar.getBase64()
 * (boolean) msg.isDebugRoom: 디버그룸에서 받은 메시지일 시 true
 * (boolean) msg.isGroupChat: 단체/오픈채팅 여부
 * (string) msg.packageName: 메시지를 받은 메신저의 패키지명
 * (void) msg.reply(string): 답장하기
 * (string) msg.command: 명령어 이름
 * (Array) msg.args: 명령어 인자 배열
 */
function onCommand(msg) {}
bot.setCommandPrefix("/"); //@로 시작하는 메시지를 command로 판단
bot.addListener(Event.COMMAND, onCommand);


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

function onRestart(activity) {}

function onDestroy(activity) {}

function onBackPressed(activity) {}

bot.addListener(Event.Activity.CREATE, onCreate);
bot.addListener(Event.Activity.START, onStart);
bot.addListener(Event.Activity.RESUME, onResume);
bot.addListener(Event.Activity.PAUSE, onPause);
bot.addListener(Event.Activity.STOP, onStop);
bot.addListener(Event.Activity.RESTART, onRestart);
bot.addListener(Event.Activity.DESTROY, onDestroy);
bot.addListener(Event.Activity.BACK_PRESSED, onBackPressed);


function getApiKey() {
  if ( !Database.exists(apikey_db) ) {
    Database.writeString(apikey_db, "영우로봇");
  }
  
  const k = Database.readString(apikey_db);
  if (k == null) {
    Log.e("API Key is Null. Check API Key DB!!", true);
    return "";
  } else {
    apikey_qry = "&auth=" + k;
  }

  return k;
}
let apikey = getApiKey();
let apikey_qry = "&auth=" + apikey;

const onStartCompile = () => {
  clearInterval(INTER);

  send_flag = true;
  
  apikey = getApiKey();


};


let send_flag = true;
const INTER = setInterval(() => {
  date = new Date();
  let data;
  let resp = "";

  if (date.getHours() == subs_hour && date.getMinutes() == subs_min) {
    if (send_flag) {
      Log.d("구독 전송 시도");
      send_flag = false;
      try {
        try {
          Log.d("hankyung");
          data = Utils.parse(
            url + article_qry + "hankyung" + apikey_qry
          ).text();
          data = JSON.parse(data);
          resp +=
            "[ " +
            data.contents[0].paper +
            " ]\n" +
            data.contents[0].content +
            "\n\n";
        } catch (error) {}

        try {
          data = Utils.parse(
            url + article_qry + "maekyung" + apikey_qry
          ).text();
          data = JSON.parse(data);
          resp +=
            "[ " +
            data.contents[0].paper +
            " ]\n" +
            data.contents[0].content +
            "\n\n";
        } catch (error) {}

        try {
          data = Utils.parse(
            url + article_qry + "quicknews" + apikey_qry
          ).text();
          data = JSON.parse(data);
          resp +=
            "[ " + data.contents[0].paper + " ]\n" + data.contents[0].content;
        } catch (error) {}
        Log.d(resp.length);
        if (resp.length > 0) {
          let ssl = Database.readString(subslist_db);
          Log.d(ssl);
          let subs_send_list = ssl.split("\n");
          for (let ss of subs_send_list) {
            let canrpy = bot.canReply(ss)
            Log.d(ss + "에게 구독 전송 가능 여부 :" + canrpy.toString());
            if (canrpy) {
              Log.d(ss + "에게 구독 전송 성공 여부 : " + bot.send(ss, resp).toString());
            }
          }
        }
      } catch (error) {
        Log.e("전송 실패");
        resp = "";
      }
    }
  }

  if (date.getHours() == subs_hour && date.getMinutes() == subs_min + 1) {
    send_flag = true;
  }
}, 1000);