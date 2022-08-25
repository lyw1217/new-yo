

importClass(org.jsoup.Jsoup);

const Key = "7ee0c38c43714d7880df96e885ce3f27";

const { stringify, parse } = JSON,
    url = [
        "mealServiceDietInfo",
        "schoolInfo",
        "SchoolSchedule",
        "elsTimetable",
        "misTimetable",
        "hisTimetable"
    ].map(v => "https://open.neis.go.kr/hub/" + v),
    regexp = [/^!급식 (강원|경기|경상남도|경상북도|광주|대구|대전|부산|서울|세종|울산|인천|전라남도|전라북도|제주|충청남도|충청북도) ([가-힣]+(초등|중|고등)학교) (어제|오늘|내일|\d{4}\.\d{1,2}\.\d{1,2})( ~ \d{4}\.\d{1,2}\.\d{1,2})?$/, /^!학교 (강원|경기|경상남도|경상북도|광주|대구|대전|부산|서울|세종|울산|인천|전라남도|전라북도|제주|충청남도|충청북도) ([가-힣]+(초등|중|고등)학교)$/, /\./g, /([(가-힣\/#& )]+[(\d\.a-z가-힣)]+[\/가-힣]*[(\d\.a-z가-힣)]* )/i, /([(가-힣 )]+: [(가-힣)]+ )/, /([가-힣a-z(a-z\.)]+ : [\d\.]+ )/i, /(\d{4})(\d{2})(\d{2})/, /^!학사일정 (강원|경기|경상남도|경상북도|광주|대구|대전|부산|서울|세종|울산|인천|전라남도|전라북도|제주|충청남도|충청북도) ([가-힣]+(초등|중|고등)학교) (\d{4})$/, /^!시간표 (강원|경기|경상남도|경상북도|광주|대구|대전|부산|서울|세종|울산|인천|전라남도|전라북도|제주|충청남도|충청북도) ([가-힣]+(초등|중|고등)학교) (어제|오늘|내일|\d{4}\.\d{1,2}\.\d{1,2}) (\d-\d{1,2})$/],
    st = str => str + "\u200b".repeat(500) + "\n" + "─".repeat(22),
    code = {
        "강원": "K10",
        "경기": "J10",
        "경상남도": "S10",
        "경상북도": "R10",
        "광주": "F10",
        "대구": "D10",
        "대전": "G10",
        "부산": "C10",
        "서울": "B10",
        "세종": "I10",
        "울산": "H10",
        "인천": "E10",
        "전라남도": "Q10",
        "전라북도": "P10",
        "제주": "T10",
        "충청남도": "N10",
        "충청북도": "M10"
    },
    grade = {
        "ONE": "1학년",
        "TW": "2학년",
        "THREE": "3학년",
        "FR": "4학년",
        "FIV": "5학년",
        "SIX": "6학년"
    },
    TTU = {
        "초등": url[3],
        "중": url[4],
        "고등": url[5]
    };


function responseFix(room, msg, sender, isGroupChat, replier, imageDB, packageName) {

    const test = num => regexp[num].test(msg);

    if (msg == "!도움말") replier.reply(text([
        "!급식 (지역) (학교이름) (어제 or 오늘 or 내일 or 날짜( ex)2022.1.1 )",
        "!급식 (지역) (학교이름) (어제 or 오늘 or 내일 or 날짜( ex)2022.1.1 ) ~ (날짜)",
        "!학교 (지역) (학교이름)",
        "!학사일정 (지역) (학교이름) (년도)",
        "!시간표 (지역) (학교이름) (어제 or 오늘 or 내일 or 날짜) (학년)-(반)"
    ]));

    if (test(0)) {
        let $1 = RegExp.$1,
            $2 = RegExp.$2,
            $3 = RegExp.$3,
            $4 = RegExp.$4,
            $5 = RegExp.$5,
            schoolInfo = getSchoolInfo($1, $2, $3),
            date = Number("" + Date().slice(11, 15) + (dd = new Date().getMonth(), (dd > 9 ? dd : "0" + ("" + (dd + 1)))) + Date().slice(8, 10));
        if (!!schoolInfo.RESULT) {
            replier.reply("[ " + $2 + " ] 학교를 찾을 수 없어요.");
            return;
        }
        switch ($4) {
            case "어제":
                $4 = String(date - 1);
                break;
            case "오늘":
                $4 = String(date);
                break;
            case "내일":
                $4 = String(date + 1)
                break;
            default:
                $4 = O($4)
                break;
        }
        if (!!$5) {
            $5 = O($5.slice(3));
        }
        const mealInfo = parse(
            Jsoup.connect(url[0])
                .data("KEY", Key)
                .data("Type", "json")
                .data("ATPT_OFCDC_SC_CODE", code[$1])
                .data("SD_SCHUL_CODE", schoolInfo.schoolInfo[1].row[0].SD_SCHUL_CODE)
                .data(!$5 ? "MLSV_YMD" : "MLSV_FROM_YMD", $4)
                .data(!$5 ? "MLSV_YMD" : "MLSV_TO_YMD", !$5 ? $4 : $5)
                .get()
                .text()
        );
        if (!!mealInfo.RESULT) {
            replier.reply("해당 날짜의 데이터를 가져오지 못했어요.");
            return;
        }
        if (!$5) replier.reply(text([
            st("🍽급식   "),
            "\n"
        ]) + text(mealInfo.mealServiceDietInfo[1].row.map(v => text([
            "《《《《《 🍽" + v.MMEAL_SC_NM + "🍽 》》》》》",
            "",
            m(v),
            "\n",
            "\n"
        ]))));
        else replier.reply((() => {
            if (String(date) == $5) return "이렇게 입력하시면 오류가 나요...ㅜ";
            const mi = mealInfo.mealServiceDietInfo[1].row,
                len = Number($5) - Number($4);
            let arr = [];
            mi.forEach((v, id) => {
                let ous = mi.filter(v => v.MLSV_YMD == String(Number($4) + id));
                arr.push([
                    ous[0],
                    ous[1],
                    ous[2]
                ]);
            });
            arr = arr.map(v => v.filter(vv => !!vv)).filter(v => !!v[0]);
            arr = arr.map(v =>
                v.map(v => text([
                    "《《《《《 🍽" + v.MMEAL_SC_NM + "🍽 》》》》》",
                    "",
                    m(v),
                    "\n",
                    "\n",
                    "\n"
                ])).join(""));
            let txt = text([
                st("🍽급식   "),
                "\n",
                "\n",
                "\n"
            ]);
            arr.forEach((v, id) => {
                txt += text([
                    "--------------- " + d(String(Number($4) + id)) + " ---------------",
                    "\n",
                    "",
                    v,
                    "\n",
                    "\n",
                    ""
                ]);
            });
            return txt;
        })());
    }

    if (test(1)) {
        let schoolInfo = getSchoolInfo(RegExp.$1, RegExp.$2, RegExp.$3);
        if (!!schoolInfo.RESULT) {
            replier.reply("[ " + RegExp.$2 + " ] 학교를 찾을 수 없어요.");
            return;
        }
        const si = schoolInfo.schoolInfo[1].row[0];
        replier.reply(text([
            st("🏫학교정보"),
            "\n",
            " [ " + RegExp.$2 + " ]",
            "├🌐 " + si.ATPT_OFCDC_SC_NM,
            "├⚒️ " + d(si.FOND_YMD),
            "├🔨 " + si.FOND_SC_NM,
            "├👤 " + si.COEDU_SC_NM,
            "├🏫 " + (!si.HS_SC_NM ? "-" : si.HS_SC_NM),
            "├📫 " + si.ORG_RDNMA,
            "├       " + si.ORG_RDNDA,
            "├☎️ " + si.ORG_TELNO,
            "├📠 " + si.ORG_FAXNO,
            "└🖥 " + si.HMPG_ADRES
        ]));
    }

    if (test(7)) {
        let $1 = RegExp.$1,
            $2 = RegExp.$2,
            $3 = RegExp.$3,
            $4 = RegExp.$4,
            schoolInfo = getSchoolInfo($1, $2, $3);
        if (!!schoolInfo.RESULT) {
            replier.reply("[" + $2 + "] 학교를 찾을 수 없어요.");
            return;
        }
        const schoolSchedule = parse(
            Jsoup.connect(url[2])
                .data("KEY", Key)
                .data("Type", "JSON")
                .data("ATPT_OFCDC_SC_CODE", code[$1])
                .data("SD_SCHUL_CODE", schoolInfo.schoolInfo[1].row[0].SD_SCHUL_CODE)
                .data("AA_FROM_YMD", $4 + "0101")
                .data("AA_TO_YMD", $4 + "1231")
                .get()
                .text()
        );
        if (!!schoolSchedule.RESULT) {
            replier.reply($4 + "년 학사일정을 찾을 수 없어요.");
            return;
        }
        const ss = schoolSchedule.SchoolSchedule[1].row.filter(v => !["휴가", "휴업", "방학", "퇴사"].map(vv => v.EVENT_NM.includes(vv)).includes(true) && !["공휴", "휴업"].map(vv => v.SBTR_DD_SC_NM.includes(vv)).includes(true));
        if (!ss[0]) {
            replier.reply("아직 일정 공개가 덜 되어서 없거나, " + $4 + "년에는 특별한 일정이 없어요.");
            return;
        }
        replier.reply(text([
            st("🗓학사일정"),
            "\n",
            ss.map(v => text([
                "--------------- " + d(v.AA_YMD) + " ---------------",
                "《《《《 " + v.EVENT_NM + " 》》》》",
                " " + Object.keys(v).filter(vv => vv.includes("GRADE_EVENT")).map(vv => v[vv] == "Y" ? " , [ " + grade[vv.split("_")[0]] + " ]" : "").join("").slice(3),
                "\n",
            ])).join("\n")
        ]));
    }

    if (test(8)) {
        let $1 = RegExp.$1,
            $2 = RegExp.$2,
            $3 = RegExp.$3,
            $4 = RegExp.$4,
            $5 = RegExp.$5,
            o = $5.split("-"),
            schoolInfo = getSchoolInfo($1, $2, $3),
            date = Number("" + Date().slice(11, 15) + (dd = new Date().getMonth(), (dd > 9 ? dd : "0" + ("" + (dd + 1)))) + Date().slice(8, 10));
        if (!!schoolInfo.RESULT) {
            replier.reply("[" + $2 + "] 학교를 찾을 수 없어요.");
            return;
        }
        switch ($4) {
            case "어제":
                $4 = String(date - 1);
                break;
            case "오늘":
                $4 = String(date);
                break;
            case "내일":
                $4 = String(date + 1)
                break;
            default:
                $4 = O($4);
                break;
        }
        const timeTable = parse(
            Jsoup.connect(TTU[$3])
                .data("KEY", Key)
                .data("Type", "json")
                .data("ATPT_OFCDC_SC_CODE", code[$1])
                .data("AY", $4.substring(0, 4))
                .data("SD_SCHUL_CODE", schoolInfo.schoolInfo[1].row[0].SD_SCHUL_CODE)
                .data("ALL_TI_YMD", $4)
                .data("GRADE", o[0])
                .data("CLASS_NM", o[1])
                .get()
                .text()
        );
        if (!!timeTable.RESULT) {
            replier.reply("데이터를 가져오지 못했어요.");
            return;
        }
        const tt = timeTable[TTU[$3].slice(28)][1].row;
        replier.reply(text([
            st("🕒시간표"),
            "\n",
            tt.map(v => v.PERIO + "교시 : " + v.ITRT_CNTNT.replace("-", "")).join("\n")
        ]));
    }

}


function text(arr) {
    return arr.join("\n");
}

function del(arr) {
    return arr.filter(v => v !== "");
}

function m(v) {
    return text([
        "[ 📜메뉴📜 ]",
        text(del(v.DDISH_NM.split(regexp[3]))),
        "",
        "[ 🌍원산지🌏 ]",
        text(del(v.ORPLC_INFO.split(regexp[4]))),
        "",
        "[ 🔥칼로리🔥 ]",
        v.CAL_INFO,
        "",
        "[ 💪영양정보💪 ]",
        text(del(v.NTR_INFO.split(regexp[5])))
    ]);
}

function d(s) {
    return s.replace(regexp[6], "$1.$2.$3");
}

function getSchoolInfo(AOSC, SN, SKSN) {
    return parse(
        Jsoup.connect(url[1])
            .data("KEY", Key)
            .data("Type", "json")
            .data("ATPT_OFCDC_SC_CODE", code[AOSC])
            .data("SCHUL_NM", SN)
            .data("SCHUL_KND_SC_NM", SKSN + "학교")
            .get()
            .text()
    );
}

function O(str) {
    return str.split(".").map(v => Number(v) > 9 ? v : "0" + v).join("");
}


if(!Key || Key == "ApiKey") throw new Error("ApiKey를 입력해 주세요.")


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