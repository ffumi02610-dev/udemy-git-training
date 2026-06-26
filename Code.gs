// Google Driveの保存先フォルダID（ご自身のフォルダIDに書き換えてください）
const TARGET_FOLDER_ID = 'YOUR_FOLDER_ID_HERE';

function doGet(e) {
  // index.html を評価して返す
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('メモアプリ')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
}

function saveMemo(data) {
  const { title, date, tags, content } = data;
  
  if (!title || !date || !content) {
    throw new Error('必須項目が入力されていません。');
  }

  // タグのフォーマット処理
  let formattedTags = '';
  if (tags && tags.trim() !== '') {
    // カンマ、句読点、スペース（半角・全角）で分割
    const tagArray = tags.split(/[,\.、。，．\s　]+/).filter(t => t !== '');
    formattedTags = tagArray.map(t => `#${t}`).join(' ');
  }

  // 現在時刻の取得 (HH:mm)
  const now = new Date();
  const timeStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm');

  // 保存するテキストの構築
  let textToAppend = `## ${timeStr} ${title}\n`;
  if (formattedTags) {
    textToAppend += `${formattedTags}\n\n`;
  } else {
    textToAppend += `\n`;
  }
  textToAppend += `${content}\n\n---\n\n`;

  // フォルダの取得
  let folder;
  try {
    folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
  } catch (e) {
    throw new Error('指定されたフォルダIDが見つからないか、アクセス権がありません。');
  }

  const fileName = `${date}.md`;
  
  // 同名ファイルの検索
  const files = folder.getFilesByName(fileName);
  let file;
  
  if (files.hasNext()) {
    // ファイルが既に存在する場合：末尾に追記
    file = files.next();
    const currentContent = file.getBlob().getDataAsString('utf-8');
    file.setContent(currentContent + textToAppend);
  } else {
    // ファイルが存在しない場合：新規作成
    const initialContent = `# ${date}\n\n${textToAppend}`;
    file = folder.createFile(fileName, initialContent, MimeType.PLAIN_TEXT);
  }

  return { success: true, message: '保存しました！' };
}
