/**
 * スターブリッジ 請求書・レシート受信用 GAS (Google Apps Script)
 * ------------------------------------------------------------
 * HTML側 (starbridge.html) が送ってくる形式:
 *   POST (Content-Type: text/plain)
 *   body = JSON 文字列 { files: [ { name, data(Base64), mimeType } ], memo }
 *
 * 役割:
 *   受け取った各ファイルを、指定したドライブフォルダに保存するだけ。
 *   （Chatworkへの通知は行いません。先方へはドライブのフォルダリンクを
 *     手動で送る運用です。）
 *
 * ============================================================
 * 【設定する箇所は1つだけ】
 *   ① FOLDER_ID … 保存先ドライブフォルダID（設定済み）
 * ============================================================
 *
 * 【設置手順】
 *   1. このコードを丸ごとGASプロジェクトに貼り付ける
 *   2. デプロイ → デプロイを管理 → 鉛筆マーク →
 *      バージョン「新バージョン」→ デプロイ
 *      （既存デプロイを更新すれば starbridge.html のURLはそのまま）
 *      - 実行ユーザー: 自分
 *      - アクセスできるユーザー: 全員        ← 必ず「全員」(匿名OK)
 */

// ① 保存先フォルダID（設定済み）
var FOLDER_ID = "1jzl5tYZJ9ajJ-mxsW4-R0bE5cXh8Gvcf";


function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut({ status: "error", message: "リクエスト本文がありません" });
    }

    var payload = JSON.parse(e.postData.contents);
    var files = payload.files || [];

    if (files.length === 0) {
      return jsonOut({ status: "error", message: "ファイルが含まれていません" });
    }

    var saved = [];
    var folder = DriveApp.getFolderById(FOLDER_ID);

    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      var name = f.name || ("file_" + (i + 1));
      var mime = f.mimeType || "application/octet-stream";

      // Base64 → バイナリ → ドライブに保存
      var bytes = Utilities.base64Decode(f.data);
      var blob = Utilities.newBlob(bytes, mime, name);
      folder.createFile(blob);
      saved.push(name);
    }

    return jsonOut({
      status: "success",
      message: saved.length + "件 ドライブに保存しました",
      saved: saved
    });

  } catch (err) {
    return jsonOut({ status: "error", message: String(err) });
  }
}

// 動作確認用（ブラウザでURLを開いたとき）
function doGet() {
  return jsonOut({ status: "ok", message: "スターブリッジ受信GAS 稼働中" });
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
