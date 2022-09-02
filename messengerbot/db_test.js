const scriptName = "db_test";

// root 권한 부여 
//java.lang.Runtime.getRuntime().exec('su').waitFor()

const SQLiteDatabase = android.database.sqlite.SQLiteDatabase;

let db = null;
let db2 = null;

function updateDB() {
    db = SQLiteDatabase.openDatabase("/data/data/com.kakao.talk/databases/KakaoTalk.db", null, SQLiteDatabase.CREATE_IF_NECESSARY);
    db2 = SQLiteDatabase.openDatabase("/data/data/com.kakao.talk/databases/KakaoTalk2.db", null, SQLiteDatabase.CREATE_IF_NECESSARY);
}

updateDB();

function response(room, msg, sender, isGroupChat, replier, imageDB, packageName) {

}