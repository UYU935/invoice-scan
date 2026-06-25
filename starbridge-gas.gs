/**
 * スターブリッジ 請求書・レシート受信用 GAS (Google Apps Script)
 * ------------------------------------------------------------
 * HTML側 (starbridge.html) が送ってくる形式:
 *   POST (Content-Type: text/plain)
 *   body = JSON 文字列 { files: [ { name, data(Base64), mimeType } ], memo }
 *
 * 役割: 受け取った各ファイルをBase64デコードし、指定ドライブフォルダに保存する。
 *
 * 【設置手順】
 *   1. このコードを丸ごとコピーして、新しいGASプロジェクトに貼り付ける
 *   2. 下の FOLDER_ID を、保存先ドライブフォルダのIDに書き換える
 *      (フォルダをブラウザで開いたURL末尾の文字列がフォルダID:
 *       https://drive.google.com/drive/folders/【ここがフォルダID】 )
 *   3. デプロイ → 新しいデプロイ → 種類「ウェブアプリ」
 *      - 実行ユーザー: 自分
 *      - アクセスできるユーザー: 全員        ← 必ず「全員」(匿名OK)
 *   4. 表示された /exec URL を starbridge.html の APPS_SCRIPT_URL に貼る
 */

// ★ 保存先フォルダIDをここに設定 ★
var FOLDER_ID = "1jzl5tYZJ9ajJ-mxsW4-R0bE5cXh8Gvcf";

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut({ status: "error", message: "リクエスト本文がありません" });
    }

    var payload = JSON.parse(e.postData.contents);
    var files = payload.files || [];
    var memo  = payload.memo || "";

    if (files.length === 0) {
      return jsonOut({ status: "error", message: "ファイルが含まれていません" });
    }

    var folder = DriveApp.getFolderById(FOLDER_ID);
    var saved = [];

    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      var name = f.name || ("file_" + (i + 1));
      var mime = f.mimeType || "application/octet-stream";

      // Base64 → バイナリ
      var bytes = Utilities.base64Decode(f.data);
      var blob = Utilities.newBlob(bytes, mime, name);

      var created = folder.createFile(blob);
      saved.push(created.getName());
    }

    return jsonOut({
      status: "success",
      message: saved.length + "件保存しました",
      saved: saved
    });

  } catch (err) {
    return jsonOut({ status: "error", message: String(err) });
  }
}

// 動作確認用 (ブラウザでURLを開いたとき)
function doGet() {
  return jsonOut({ status: "ok", message: "スターブリッジ受信GAS 稼働中" });
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
