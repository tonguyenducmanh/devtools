export default {
  i18nCommon: {
    typeInput: "値を入力",
    history: "履歴",
    deleteAll: "すべて削除",
    uploadFile: "ファイルをアップロード",
    createbyAuthor: "tdmanhが愛を込めて作成",
    welcomeTextOne: "開発者のための",
    welcomeTextTwo: "必須の",
    welcomeTextThree: "ユーティリティツール",
    sidebar: {
      filter: "ツールを検索",
      menu: {
        show: "メニューを表示",
        hide: "メニューを隠す"
      },
      theme: {
        light: "ダークテーマに切り替え",
        dark: "ライトテーマに切り替え"
      },
      language: {
        switch: "言語を切り替え"
      }
    },
    feature: {
      welcome: "ようこそ",
      oneTimePassword: "ワンタイムパスワード",
      textCompress: "テキスト圧縮",
      compareCode: "コード比較",
      colorPicker: "カラーピッカー",
      JSONParser: "JSONパーサー",
      JSONToPostgreSQL: "JSON to PostgreSQL",
      JSONMapping: "JSONマッピング",
      JSONToExcel: "JSON to Excel",
      CodeFormatter: "コードフォーマッター",
      ImageFromBase64: "Base64から画像",
      ImageToBase64: "画像からBase64",
      QRCodeFromText: "テキストからQRコード",
      QRCodeToText: "QRコードからテキスト",
      DownloadVSCodeExtension: "VSCode拡張機能をダウンロード",
      UUIDV4Generator: "UUIDv4ジェネレーター",
    },
    example: "例",
    base64ToImage: {
      title: "Base64から画像に変換するツール！",
      donwloadImage: "画像をダウンロード",
      convert: "変換",
      placeHolder: "Base64文字列をここに貼り付け",
      result: "変換結果",
    },
    codeFormatter: {
      title: "コードフォーマッターツール！",
      typeOfCode: "コードの種類",
      inputCode: "コードを入力",
      outputCode: "出力コード",
      formatCode: "コードをフォーマット",
      copyOutput: "出力をコピー",
    },
    colorPicker: {
      title: "カラーピッカーツール！",
      uploadLabel: "画像を選択またはここにドラッグ（PNG、JPG、GIF、最大10MB）",
      uploadButton: "アップロード",
      colorPalette: "カラーパレット",
      selectedColor: "選択した色",
      copyColor: "色をコピー",
      uploadNewImage: "新しい画像をアップロード"
    },
    compareCode: {
      title: "ファイル比較（差分）ツール！",
      firstFile: "比較する1つ目のコードファイル",
      secondFile: "比較する2つ目のコードファイル",
      compareStyle: "比較スタイル（trueは並列、falseは行ごと）",
      compare: "差分を比較",
      example: "例"
    },
    downloadVSCodeExt: {
      title: "marketplace.visualstudio.comからVSCode拡張機能をダウンロード！",
      subtitle: "Microsoftが削除した従来のダウンロード用",
      itemName: "アイテム名",
      version: "バージョン",
      downloadLink: "ダウンロードリンク",
      generateLink: "ダウンロードリンクを生成",
      copyLink: "リンクをコピー",
      example: "例"
    },
    imageToBase64: {
      title: "画像からBase64に変換するツール！",
      dropZone: "ここに画像を貼り付け（Ctrl+V）またはドラッグ＆ドロップ",
      placeHolder: "Base64の出力がここに表示されます",
      copyButton: "Base64をコピー"
    },
    jsonParser: {
      title: "JSONを再帰的オブジェクトに変換！",
      inputPlaceholder: "オブジェクトに変換するJSON",
      recursiveParser: "再帰的JSONパース処理",
      showCollapseIcon: "オブジェクト折りたたみアイコンを表示",
      showLineNumber: "行番号を表示",
      showLength: "キー/要素数を表示",
      showScroll: "スクロールバーを表示",
      showFullPath: "選択したノードのフルパスを表示",
      showSelectedNode: "選択したノードを表示",
      convertButton: "JSONからオブジェクトへ",
      example: "例",
      copySelected: "選択したノードをコピー",
      copyStringify: "ソース文字列をコピー",
      toggleNode: "すべてのノードを切り替え",
      selectedNode: "選択中のノード",
      noSelection: "ノードが選択されていません"
    },
    jsonToExcel: {
      title: "JSON配列オブジェクトをExcelファイルに変換！",
      inputLabel: "JSONを入力、レベル1のキーが列名として使用されます",
      inputPlaceholder: "ここにJSONを入力...",
      boldColumns: "列名を太字に",
      fitColumns: "列幅を調整",
      freezeRow: "最初の行を固定",
      convert: "変換",
      example: "例"
    },
    jsonToPostgreSQL: {
      title: "JSONをPostgreSQLに変換するツール！",
      schemaName: "スキーマ名",
      tableName: "テーブル名",
      primaryKey: "主キー列",
      inputLabel: "JSONを入力",
      inputPlaceholder: "ここにJSONを入力...",
      outputLabel: "SQL結果",
      outputPlaceholder: "SQLがここに表示されます...",
      createTable: "テーブル作成スクリプトを追加",
      deleteOld: "古いデータ削除スクリプトを追加",
      convert: "変換",
      copy: "コピー",
      example: "例"
    },
    jsonMapping: {
      title: "JSONオブジェクトAからBへの再帰的な値マッピング！",
      sourcePlaceholder: "マッピングが必要なオブジェクト",
      sourceLabel: "マッピングオブジェクト",
      targetLabel: "コピーオブジェクト",
      targetPlaceholder: "コピー先の値",
      resultPlaceholder: "マッピング後の結果",
      resultLabel: "マッピング結果",
      errorPlaceholder: "キー値マッピングエラー",
      errorLabel: "エラー",
      mappingButton: "マッピングを実行",
      formatButton: "結果をフォーマット",
      copyResultButton: "結果をコピー",
      copyErrorButton: "エラーをコピー",
      example: "例"
    },
    textCompress: {
      title: "テキスト圧縮アルゴリズム！",
      input: {
        compress: "圧縮するテキスト",
        decompress: "圧縮されたテキスト",
        algorithm: "圧縮アルゴリズム"
      },
      buttons: {
        compress: "圧縮",
        decompress: "解凍",
        example: "例",
        copyInput: "入力をコピー",
        copyOutput: "出力をコピー"
      },
      stats: {
        ratio: "圧縮率 {0}%",
        inputLength: "入力テキスト長 {0}",
        outputLength: "出力テキスト長 {0}"
      }
    },
    uuidGenerator: {
      title: "UUIDv4生成ツール！",
      input: {
        result: "結果"
      },
      buttons: {
        generate: "生成",
        copy: "コピー"
      }
    },
    textToQRCode: {
      title: "テキストからQRコードを生成するツール！",
      input: {
        placeholder: "QRコードを生成するテキストを入力...",
        maxLength: "QRコード1つあたりの最大文字数"
      },
      buttons: {
        generate: "QRコードを生成",
        downloadAll: "すべてダウンロード",
        download: "ダウンロード",
        example: "例"
      },
      part: "パート {0}/{1}"
    },
    qrCodeToText: {
      title: "QRコードからテキストに変換するツール！",
      note: "注意：アップロード順序はコンピュータの並び順に基づきます。正しいファイル連結のため、日付の昇順で並べ替えてください",
      dropZone: {
        placeholder: "画像をここにドロップまたはCtrl+Vで貼り付け",
        label: "QRコード画像を選択"
      },
      convert: "変換",
      copy: "コピー",
      result: "画像を貼り付けると結果が表示されます"
    },
    oneTimePassword: {
      title: "時間ベース（TOTP）とHMACベース（HOTP）のワンタイムパスワード！",
      sourceLabel: "データソース",
      importOptions: {
        googleQR: "Google認証システムのQRコード",
        google: "Google認証システム",
        manual: "手動入力"
      },
      dropZone: {
        label: "QRコード画像を選択",
        placeholder: "画像をここにドロップまたはアップロード"
      },
      auth: {
        username: "ユーザー名を入力",
        password: "認証リストの保存/読み込み用パスワードを入力",
        open: "開く",
        save: "保存",
        add: "追加"
      },
      inputs: {
        issuer: "発行者",
        name: "名前",
        secret: "シークレット"
      },
      urlPlaceholder: "Google認証システムの移行URL例: otpauth-migration://offline?data=CjcKFFkwYrPBscVsQXM",
      decodeData: "Google認証システムのデコードデータ",
      remove: {
        filter: "削除する認証名を正確に入力、{0}を入力してすべて削除",
        button: "削除"
      }
    },
  },
};
