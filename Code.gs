// ドロップダウンの選択肢と保存先フォルダの紐付け設定
const TARGET_CONFIGS = {
  'diary': { label: '日記', folderId: 'YOUR_DIARY_FOLDER_ID_HERE', pattern: 'diary' },
  'scrap': { label: '記事スクラップ', folderId: 'YOUR_SCRAP_FOLDER_ID_HERE', pattern: 'scrap' }
};

function doGet(e) {
  // index.html をテンプレートとして評価
  const template = HtmlService.createTemplateFromFile('index');
  
  // 設定からドロップダウン表示用のリストを生成
  template.targetOptions = Object.keys(TARGET_CONFIGS).map(key => ({
    value: key,
    label: TARGET_CONFIGS[key].label
  }));

  return template.evaluate()
    .setTitle('メモアプリ')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
}

function saveMemo(data) {
  const { target, title, date, tags, source, content } = data;
  
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

  const config = TARGET_CONFIGS[target];
  if (!config) {
    throw new Error('無効な保存先が選択されました。');
  }

  // 保存するテキストとファイル名の構築
  let textToAppend = '';
  let fileName = '';
  let fileHeader = '';

  if (config.pattern === 'diary') {
    textToAppend += `## ${timeStr} ${title}\n`;
    fileName = `${date}.md`;
    fileHeader = `# ${date}\n\n`;
  } else {
    fileName = `${title}.md`;
    fileHeader = `# ${title}\n\n`;
  }

  if (formattedTags) {
    textToAppend += `${formattedTags}\n\n`;
  }
  if (source && source.trim() !== '') {
    textToAppend += `**引用元**: ${source}\n\n`;
  }
  
  textToAppend += `${content}\n\n---\n\n`;

  // フォルダの取得
  let folder;
  try {
    folder = DriveApp.getFolderById(config.folderId);
  } catch (e) {
    throw new Error(`指定されたフォルダID (${config.label}用) が見つからないか、アクセス権がありません。`);
  }
  
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
    const initialContent = fileHeader + textToAppend;
    file = folder.createFile(fileName, initialContent, MimeType.PLAIN_TEXT);
  }

  return { success: true, message: '保存しました！' };
}
