/* 도미 doami 틱택토 v 2.0 https://cafe.naver.com/nameyee/38726 */
const Stone = '⬜';
const P_Stone = '⚫';
const B_Stone = '✖';

let T3 = {
    'Start' : false,
    'Player' : null,
    'Turn' : null, 
    'Board' : Array(3).fill().map(_ => Array(3).fill(Stone))
};

function responseFix(room, msg, sender, igc, replier) {
    if (msg.startsWith('ㅇ틱택토')) {
        let input = msg.substring(4).trim();
        switch (input) {
            case '':
                replier.reply([
                '[ 틱택토 도움말 ]',
                '• ㅇ틱택토 시작',
                '• ㅇ틱택토 종료'
                ].join('\n'));
                break;
            case '시작':
                if (T3.Start) {
                    replier.reply('• 게임이 이미 시작되었습니다!');
                    return;
                }
                T3.Start = true;
                T3.Player = sender;
                T3.Turn = 'PB'[Math.random() * 2 | 0];
                replier.reply('• ' + (T3.Turn == 'P' ? sender : 'Bot') + ' 님의 차례입니다!\nㅇ(숫자) 형식으로 입력해 주세요.');
                if (T3.Turn == 'B') {
                    let Chances = [];
                    for (let x = 0; x < 3; x++) {
                        for (let y = 0; y < 3; y++) {
                            if (T3.Board[y][x] == Stone) Chances.push([x, y]);
                        }
                    }
                    let Chance = Chances[Math.random() * Chances.length|0];
                    T3.Board[Chance[1]][Chance[0]] = B_Stone;
                    T3.Turn = 'P';
                    replier.reply(Combine(T3.Board));
                    replier.reply('• ' + T3.Player + ' 님의 차례입니다.');
                }
                break;
            case '종료':
                if (T3.Player != sender) return;
                if (!T3.Start) {
                    replier.reply('• 게임이 이미 종료되었습니다.');
                    return;
                }
                Reset();
                replier.reply('• 게임이 종료되었습니다.');
                break;
            default:
                replier.reply('• 잘못된 명령어 입니다.');
        }
    }
    if (T3.Start && T3.Turn == 'P') {
        if (msg[0] != 'ㅇ' || msg[2]) return;
        let coor = Number(msg[1]);
        if (isNaN(coor) || coor < 1 || coor > 9) {
            replier.reply('• 잘못된 좌표 형식입니다.');
            return;
        }
        let x = coor <= 3 ? coor : (coor <= 6 ? coor - 3 : coor - 6);
        let y = coor <= 3 ? 1 : (coor <= 6 ? 2 : 3);
        if (T3.Board[y-1][x-1] != Stone) {
            replier.reply('• 이미 돌이 놓여져 있습니다.');
            return;
        }
        T3.Board[y-1][x-1] = P_Stone;
        replier.reply(Combine(T3.Board));
        let Result = CheckWinner();
        if (Result) {
            if (Result == 'P' || Result == 'B') {
                replier.reply('• ' + (Result == 'P' ? T3.Player : 'Bot') + ' 님의 승리입니다!');
            } else if (Result == 'D') {
                replier.reply('• 무승부 입니다!');
            }
            Reset();
            return;
        }
        
        replier.reply('• Bot 님의 차례입니다.');
        let Chances = [];
        for (let x = 0; x < 3; x++) {
            for (let y = 0; y < 3; y++) {
                if (T3.Board[y][x] == Stone) Chances.push([x, y]);
            }
        }
        let Chance = Chances[Math.random() * Chances.length|0];
        T3.Board[Chance[1]][Chance[0]] = B_Stone;
        T3.Turn = 'P';
        replier.reply(Combine(T3.Board));
        let Result2 = CheckWinner();
        if (Result2) {
            if (Result2 == 'P' || Result2 == 'B') {
                replier.reply('• ' + (Result2 == 'P' ? T3.Player : 'Bot') + ' 님의 승리입니다!');
            } else if (Result == 'D') {
                replier.reply('• 무승부 입니다!');
            }
            Reset();
            return;
        }
        replier.reply('• ' + T3.Player + ' 님의 차례입니다.');
    }
}

const Lines = [
[[1, 1], [2, 1], [3, 1]],
[[1, 2], [2, 2], [3, 2]],
[[1, 3], [2, 3], [3, 3]],
[[1, 1], [1, 2], [1, 3]],
[[2, 1], [2, 2], [2, 3]],
[[3, 1], [3, 2], [3, 3]],
[[1, 1], [2, 2], [3, 3]],
[[3, 1], [2, 2], [1, 3]]
];

function Combine (Board) {
    return Board.map(e => e.join('')).join('\n');
}

function CheckWinner () {
    let Line = '';
    let Result = '';
    Lines.forEach(e => {
        e.forEach(r => Line += T3.Board[r[1]-1][r[0]-1]);
        switch (Line) {
            case P_Stone.repeat(3) :
                Result = 'P';
                break;
            case B_Stone.repeat(3) :
                Result = 'B';
                break;
        }
        Line = "";
    });
    if (Result) return Result;
    let Map = T3.Board.map(e => e.join("")).join("");
    const regex = new RegExp("[" + P_Stone + B_Stone + "]", "g");
    if ( Map.match(regex).length >= 9 ) return "D";
}

function Reset () {
    T3 = {
        'Start' : false,
        'Player' : null,
        'Turn' : null, 
        'Board' : Array(3).fill().map(_ => Array(3).fill(Stone))
    };
}

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