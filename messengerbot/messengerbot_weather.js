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

let comm_db = Bridge.getScopeOf("comm").comm_db;
let apikey_db = Bridge.getScopeOf("comm").apikey;
let room_ctx_db = Bridge.getScopeOf("comm").room_ctx_db;
let room_run_db = Bridge.getScopeOf("comm").room_run_db;

let apikey = Bridge.getScopeOf("comm").apikey
let apikey_qry = Bridge.getScopeOf("comm").apikey_qry
let Lw = Bridge.getScopeOf("comm").Lw

const onStartCompile = () => {
  if (!Bridge.isAllowed("comm")) {
    Api.compile("comm");
  }
  apikey = Bridge.getScopeOf("comm").getApiKey();
};

/* https://cafe.naver.com/nameyee/32361 */
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

/*
input : array | split된 키워드 문자열 배열
return : object | {array 파싱된 키워드, string 응답 문자열}
응답 문자열의 길이가 0 보다 큰 경우 키워드 파싱 오류
*/
function parseKeywords(input) {
  let k = ["", "", ""];
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
    k: k,
    response_data: response_data
  };
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
  const url = "http://mumeog.site:30100";
  const weather_qry = "/weather?";
  let data;
  let resp = "";

  let run = DataBase.getDataBase(Bridge.getScopeOf("comm").sprintf(Bridge.getScopeOf("comm").room_run_db, room));
  if (run == null) {
    DataBase.setDataBase(Bridge.getScopeOf("comm").sprintf(Bridge.getScopeOf("comm").room_run_db, room), "t");
  }

  if (run == "t") {
    try {
      if (msg.startsWith("ㅇ지금") && msg.includes("날씨")) {
        const input_now_keywords = msg.split(" ");
        if (input_now_keywords.length < 3) {
          return;
        }
        let keywords = parseKeywords(input_now_keywords);
        resp += keywords.response_data;

        if (keywords.response_data.length == 0) {
          const tod_params =
            "k1=" +
            keywords.k[0] +
            "&k2=" +
            keywords.k[1] +
            "&k3=" +
            keywords.k[2] +
            "&p=0";
          try {
            data = Utils.parse(url + weather_qry + tod_params + apikey_qry).text();
            resp += data.split("@").join("\n");
          } catch (error) {
            resp += "지역을 찾지 못했습니다.";
          }
        }
        if (resp != "") {
          replier.reply(resp);
        }
      } else if (msg.includes("ㅇ예보")) {
        const input_fcst_keywords = msg.split(" ");

        if (input_fcst_keywords.length > 1) {
          try {
            data = Utils.parse(
              url + weather_qry + "mid=" + input_fcst_keywords[1] + apikey_qry
            ).text();
            split_data = data.split("@");
            split_data.splice(1, 0, Lw);
            resp += split_data.join("\n");
          } catch (error) {
            resp += "'ㅇ예보' 를 입력해서 지역을 확인해보세요.";
            Log.d(error, true);
          }
        }
        if (resp != "") {
          replier.reply(resp);
        }
      } else if (msg.startsWith("ㅇ날씨 ")) {
        if (msg == "ㅇ날씨 ") {
          return;
        }
        naver_resp = org.jsoup.Jsoup.connect('http://search.naver.com/search.naver?query=' + msg.slice(4) + '+날씨').get();
        if (!naver_resp.select("._area_panel > .title").isEmpty()) {
          sky_sts = naver_resp.select(".weather_main > i").first().attr("class").split(" ")[1];
          /*
          sky_img_url = "https://ssl.pstatic.net/sstatic/keypage/outside/scui/weather_new_new/img/weather_svg_v2/icon_flat_%s.svg";
          thu = Bridge.getScopeOf("comm").sprintf(sky_img_url, sky_sts.slice(-3));
          */
          thu = Bridge.getScopeOf("comm").sprintf("https://mumeog.site/weather?query=%s%s", sky_sts.slice(6), apikey_qry);
          lnk = 'http://search.naver.com/search.naver?query=' + msg.slice(4) + '+날씨';
          loc = naver_resp.select("._area_panel > .title").first().text();
          temp = naver_resp.select(".temperature_text").first().text().slice("현재 온도".length);
          sky = "";
          temp_summary = naver_resp.select(".temperature_info > .summary").first().text().split(" ");
          time = Bridge.getScopeOf("comm").sprintf("%s %s%s %s", temp_summary[0], temp_summary[1], (temp_summary[2].includes("높") ? "↑" : "↓"), temp_summary[3]);

          summary = naver_resp.select(".summary_list");
          dt = summary.select("dt").eachText();
          dd = summary.select("dd").eachText();
          for (let i = 0; i < dt.length && i < dd.length; i++) {
            tmp_dt = dt[i].trim();
            if (tmp_dt.includes("습도")) {
              hum_tit = tmp_dt;
              hum = dd[i];
            } else if (tmp_dt.includes("바람")) {
              wind_tit = tmp_dt;
              wind = dd[i];
            } else if (tmp_dt.includes("체감")) {
              pro_tit = tmp_dt;
              pro = dd[i];
            }
          }

          resp += loc + "\n";
          resp += time + "\n";
          resp += "기온 : " + temp + "C" + "\n";
          resp += Bridge.getScopeOf("comm").sprintf("%s : ", hum_tit) + hum + "\n";
          resp += Bridge.getScopeOf("comm").sprintf("%s : ", wind_tit) + wind + "\n";
          resp += Bridge.getScopeOf("comm").sprintf("%s : ", pro_tit) + pro + "C" + "\n";

          let mise = "";
          let cho = "";
          let misecho = "";
          li = naver_resp.select(".today_chart_list > li").eachText();
          for (let i = 0; i < li.length; i++) {
            if (li[i].startsWith("미세먼지")) {
              mise = "미세 : " + li[i].slice(4).trim();
            } else if (li[i].startsWith("초미세먼지")) {
              cho = "초미세 : " + li[i].slice(5).trim();
            }
          }

          if (mise.length > 0) {
            resp += mise + "\n";
            misecho += mise + ", ";
          }
          if (cho.length > 0) {
            resp += cho + "\n";
            misecho += cho;
          }

          Bridge.getScopeOf("comm").Kakao.sendLink(
            room,
            {
              template_id: 81752,
              template_args: {
                "THU": thu,
                "LNK": lnk,
                "LOC": loc,
                "TIME": time,
                "SKY": sky,
                "TEMP_TIT": "기온",
                "TEMP": temp + "C",
                "PRO_TIT": pro_tit,
                "PRO": pro + "C",
                "HUM_TIT": hum_tit,
                "HUM": hum,
                "WIND_TIT": wind_tit,
                "WIND": wind,
                "MISECHO": misecho,
              },
            },
            "custom"
          )
            .then((e) => {
            })
            .catch((e) => {
              Log.e("카카오링크 전송 에러 : " + e);
              if (resp != "") {
                replier.reply(resp);
              }
            });

        } else {
          jsoup_resp = org.jsoup.Jsoup.connect('https://www.google.com/search?q=' + msg.slice(4) + '+날씨').get();
          if (!jsoup_resp.select("#wob_wc").isEmpty()) {
            date = new Date();
            thu = "https:" + jsoup_resp.select(".UQt4rd > img").first().attr("src") + "?" + date.getMinutes().toString() + date.getSeconds().toString();
            lnk = 'https://www.google.com/search?q=' + msg.slice(4) + '+날씨';
            loc = jsoup_resp.select(".wob_loc").first().text();
            time = jsoup_resp.select(".wob_dts").first().text();
            sky = jsoup_resp.select("#wob_dc").first().text();
            temp = jsoup_resp.select("#wob_tm").first().text();
            pro = jsoup_resp.select("#wob_pp").first().text();
            hum = jsoup_resp.select("#wob_hm").first().text();
            wind = jsoup_resp.select("#wob_ws").first().text();

            resp += loc + "\n";
            resp += time + "\n";
            resp += "기상 : " + sky + "\n";
            resp += "기온 : " + temp + "°C" + "\n";
            resp += "습도 : " + hum + "\n";
            resp += "풍속 : " + wind + "\n";
            resp += "강수확률 : " + pro + "\n";

            let misecho = "";

            Bridge.getScopeOf("comm").Kakao.sendLink(
              room,
              {
                template_id: 81752,
                template_args: {
                  "THU": thu,
                  "LNK": lnk,
                  "LOC": loc,
                  "TIME": time,
                  "SKY": sky,
                  "TEMP_TIT": "기온",
                  "TEMP": temp + "°C",
                  "PRO_TIT": "강수확률",
                  "PRO": pro,
                  "HUM_TIT": "습도",
                  "HUM": hum,
                  "WIND_TIT": "풍속",
                  "WIND": wind,
                  "MISECHO": misecho,
                },
              },
              "custom"
            )
              .then((e) => {
              })
              .catch((e) => {
                Log.e("카카오링크 전송 에러 : " + e);
                if (resp != "") {
                  replier.reply(resp);
                }
              });
          }
        }
      } else if (msg.startsWith("ㅇ주간 ")) {
        if (msg == "ㅇ주간 ") {
          return;
        }
        naver_resp = org.jsoup.Jsoup.connect('http://search.naver.com/search.naver?query=' + msg.slice(4) + '+날씨').get();
        if (!naver_resp.select("._area_panel > .title").isEmpty() || !naver_resp.select(".weekly_forecast_area").isEmpty()) {
          sky_sts = naver_resp.select(".weather_main > i").first().attr("class").split(" ")[1];
          thu = Bridge.getScopeOf("comm").sprintf("https://mumeog.site/weather?query=%s%s", sky_sts.slice(6), apikey_qry);
          lnk = 'http://search.naver.com/search.naver?query=' + msg.slice(4) + '+날씨';
          loc = naver_resp.select("._area_panel > .title").first().text();
          temp = naver_resp.select(".temperature_text").first().text().slice("현재 온도".length);
          sky = "";
          temp_summary = naver_resp.select(".temperature_info > .summary").first().text().split(" ");
          time = Bridge.getScopeOf("comm").sprintf("%s %s%s %s", temp_summary[0], temp_summary[1], (temp_summary[2].includes("높") ? "↑" : "↓"), temp_summary[3]);

          summary = naver_resp.select(".summary_list");
          dt = summary.select("dt").eachText();
          dd = summary.select("dd").eachText();
          for (let i = 0; i < dt.length && i < dd.length; i++) {
            tmp_dt = dt[i].trim();
            if (tmp_dt.includes("습도")) {
              hum_tit = tmp_dt;
              hum = dd[i];
            } else if (tmp_dt.includes("바람")) {
              wind_tit = tmp_dt;
              wind = dd[i];
            } else if (tmp_dt.includes("체감")) {
              pro_tit = tmp_dt;
              pro = dd[i];
            }
          }

          resp += loc + "\n";
          resp += time + "\n";
          resp += "기온 : " + temp + "C" + "\n";
          resp += Bridge.getScopeOf("comm").sprintf("%s : ", hum_tit) + hum + "\n";
          resp += Bridge.getScopeOf("comm").sprintf("%s : ", wind_tit) + wind + "\n";
          resp += Bridge.getScopeOf("comm").sprintf("%s : ", pro_tit) + pro + "C" + "\n";

          let mise = "";
          let cho = "";
          let misecho = "";
          li = naver_resp.select(".today_chart_list > li").eachText();
          for (let i = 0; i < li.length; i++) {
            if (li[i].startsWith("미세먼지")) {
              mise = "미세 : " + li[i].slice(4).trim();
            } else if (li[i].startsWith("초미세먼지")) {
              cho = "초미세 : " + li[i].slice(5).trim();
            }
          }

          if (mise.length > 0) {
            resp += mise + "\n";
            misecho += mise + ", ";
          }
          if (cho.length > 0) {
            resp += cho + "\n";
            misecho += cho;
          }


          week_list = naver_resp.select(".week_list").first();
          td_li = week_list.select('.week_item').first();
          td_date = td_li.select(".day_data > .cell_date > .date_inner > .date").eachText()[0];
          td_am_pro = td_li.select(".day_data > .cell_weather > .weather_inner").first().select(".weather_left > .rainfall").text();
          td_l_temp_tit = "최저";
          td_l_temp = td_li.select(".day_data > .cell_temperature > .temperature_inner > .lowest").first().text().slice(4);
          td_h_temp_tit = "최고";
          td_h_temp = td_li.select(".day_data > .cell_temperature > .temperature_inner > .highest").first().text().slice(4);
          sky_sts = td_li.select(".day_data > .cell_weather > .weather_inner > i").first().attr("class").split(" ")[1];
          thu_2 = Bridge.getScopeOf("comm").sprintf("https://mumeog.site/weather?query=%s%s", sky_sts.slice(6), apikey_qry);

          td_pm_pro = td_li.select(".day_data > .cell_weather > .weather_inner").get(1).select(".weather_left > .rainfall").text();
          sky_sts = td_li.select(".cell_weather > .weather_inner > i").get(1).attr("class").split(" ")[1];
          thu_3 = Bridge.getScopeOf("comm").sprintf("https://mumeog.site/weather?query=%s%s", sky_sts.slice(6), apikey_qry);



          tm_li = week_list.select('.week_item').get(1);
          tm_date = tm_li.select(".day_data > .cell_date > .date_inner > .date").eachText()[0];
          tm_am_pro = tm_li.select(".day_data > .cell_weather > .weather_inner").first().select(".weather_left > .rainfall").text();
          tm_l_temp_tit = "최저";
          tm_l_temp = tm_li.select(".day_data > .cell_temperature > .temperature_inner > .lowest").first().text().slice(4);
          tm_h_temp_tit = "최고";
          tm_h_temp = tm_li.select(".day_data > .cell_temperature > .temperature_inner > .highest").first().text().slice(4);
          sky_sts = tm_li.select(".day_data > .cell_weather > .weather_inner > i").first().attr("class").split(" ")[1];
          thu_4 = Bridge.getScopeOf("comm").sprintf("https://mumeog.site/weather?query=%s%s", sky_sts.slice(6), apikey_qry);

          tm_pm_pro = tm_li.select(".day_data > .cell_weather > .weather_inner").get(1).select(".weather_left > .rainfall").text();
          sky_sts = tm_li.select(".cell_weather > .weather_inner > i").get(1).attr("class").split(" ")[1];
          thu_5 = Bridge.getScopeOf("comm").sprintf("https://mumeog.site/weather?query=%s%s", sky_sts.slice(6), apikey_qry);
          
          /*
          Log.d("td_date = " + td_date);
          Log.d("td_am_pro = " + td_am_pro);
          Log.d("td_l_temp_tit = " + td_l_temp_tit);
          Log.d("td_l_temp = " + td_l_temp);
          Log.d("td_h_temp_tit = " + td_h_temp_tit);
          Log.d("td_h_temp = " + td_h_temp);
          Log.d("sky_sts = " + sky_sts);
          Log.d("thu_2 = " + thu_2);
          Log.d("td_pm_pro = " + td_pm_pro);
          Log.d("sky_sts = " + sky_sts);
          Log.d("thu_3 = " + thu_3);
          Log.d("tm_date = " + tm_date);
          Log.d("tm_am_pro = " + tm_am_pro);
          Log.d("tm_l_temp_tit = " + tm_l_temp_tit);
          Log.d("tm_l_temp = " + tm_l_temp);
          Log.d("tm_h_temp_tit = " + tm_h_temp_tit);
          Log.d("tm_h_temp = " + tm_h_temp);
          Log.d("sky_sts = " + sky_sts);
          Log.d("thu_4 = " + thu_4);
          Log.d("tm_pm_pro = " + tm_pm_pro);
          Log.d("tm_l_temp_tit = " + tm_l_temp_tit);
          Log.d("tm_l_temp = " + tm_l_temp);
          Log.d("tm_h_temp_tit = " + tm_h_temp_tit);
          Log.d("tm_h_temp = " + tm_h_temp);
          Log.d("sky_sts = " + sky_sts);
          Log.d("thu_5 = " + thu_5);
          */

          Bridge.getScopeOf("comm").Kakao.sendLink(
            room,
            {
              template_id: 81750,
              template_args: {
                "THU": thu,
                "LNK": lnk,
                "LOC": loc,
                "TIME": time,
                "SKY": sky,
                "TEMP_TIT": "기온",
                "TEMP": temp + "C",
                "HUM_TIT": hum_tit,
                "HUM": hum,
                "TD_DATE" : td_date,
                "TD_AM_PRO" : td_am_pro,
                "TD_L_TEMP_TIT" : td_l_temp_tit,
                "TD_L_TEMP" : td_l_temp,
                "TD_H_TEMP_TIT" : td_h_temp_tit,
                "TD_H_TEMP" : td_h_temp,
                "THU_2" : thu_2,

                "TD_PM_PRO" : td_pm_pro,
                "THU_3" : thu_3,

                "TM_DATE" : tm_date,
                "TM_AM_PRO" : tm_am_pro,
                "TM_L_TEMP_TIT" : tm_l_temp_tit,
                "TM_L_TEMP" : tm_l_temp,
                "TM_H_TEMP_TIT" : tm_h_temp_tit,
                "TM_H_TEMP" : tm_h_temp,
                "THU_4" : thu_4,

                "TM_PM_PRO" : tm_pm_pro,
                "THU_5" : thu_5,
              },
            },
            "custom"
          )
            .then((e) => {
            })
            .catch((e) => {
              Log.e("카카오링크 전송 에러 : " + e);
              if (resp != "") {
                replier.reply(resp);
              }
            });

        } 
      }
    } catch (error) {
      Log.e("에러 발생.\n err : " + error);
      replier.reply("날씨를 가져오지 못했어요.");
    }
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
