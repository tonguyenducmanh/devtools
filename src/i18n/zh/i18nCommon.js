export default {
  i18nCommon: {
    typeInput: "输入值",
    history: "历史记录",
    deleteAll: "全部删除",
    uploadFile: "上传文件",
    createbyAuthor: "由tdmanh倾情制作",
    welcomeTextOne: "为开发者打造的",
    welcomeTextTwo: "必备",
    welcomeTextThree: "实用工具",
    sidebar: {
      filter: "筛选工具",
      menu: {
        show: "显示菜单",
        hide: "隐藏菜单"
      },
      theme: {
        light: "切换到深色主题",
        dark: "切换到浅色主题"
      },
      language: {
        switch: "切换语言"
      }
    },
    feature: {
      welcome: "欢迎",
      oneTimePassword: "一次性密码",
      textCompress: "文本压缩",
      compareCode: "代码比较",
      colorPicker: "颜色选择器",
      JSONParser: "JSON解析器",
      JSONToPostgreSQL: "JSON转PostgreSQL",
      JSONMapping: "JSON映射",
      JSONToExcel: "JSON转Excel",
      CodeFormatter: "代码格式化",
      ImageFromBase64: "Base64转图片",
      ImageToBase64: "图片转Base64",
      QRCodeFromText: "文本转二维码",
      QRCodeToText: "二维码转文本",
      DownloadVSCodeExtension: "下载VSCode扩展",
      UUIDV4Generator: "UUIDv4生成器",
    },
    example: "示例",
    base64ToImage: {
      title: "Base64转图片工具！",
      donwloadImage: "下载图片",
      convert: "转换",
      placeHolder: "在此粘贴Base64字符串",
      result: "转换结果",
    },
    codeFormatter: {
      title: "代码格式化工具！",
      typeOfCode: "代码类型",
      inputCode: "输入代码",
      outputCode: "输出代码",
      formatCode: "格式化代码",
      copyOutput: "复制输出",
    },
    colorPicker: {
      title: "颜色选择器工具！",
      uploadLabel: "选择或拖放图片至此，支持PNG、JPG、GIF，最大10MB",
      uploadButton: "上传",
      colorPalette: "调色板",
      selectedColor: "已选颜色",
      copyColor: "复制颜色",
      uploadNewImage: "上传新图片"
    },
    compareCode: {
      title: "文件对比(差异)工具！",
      firstFile: "要比较的第一个代码文件",
      secondFile: "要比较的第二个代码文件",
      compareStyle: "对比样式（true为并排，false为行对行）",
      compare: "比较差异",
      example: "示例"
    },
    downloadVSCodeExt: {
      title: "从marketplace.visualstudio.com下载VSCode扩展！",
      subtitle: "用于Microsoft已移除的旧版下载",
      itemName: "项目名称",
      version: "版本",
      downloadLink: "下载链接",
      generateLink: "生成下载链接",
      copyLink: "复制链接",
      example: "示例"
    },
    imageToBase64: {
      title: "图片转Base64工具！",
      dropZone: "在此粘贴图片(Ctrl+V)或拖放",
      placeHolder: "Base64输出将显示在此处",
      copyButton: "复制Base64"
    },
    jsonParser: {
      title: "将JSON转换为递归对象！",
      inputPlaceholder: "要转换为对象的JSON",
      recursiveParser: "处理递归JSON解析",
      showCollapseIcon: "显示对象折叠图标",
      showLineNumber: "显示行号",
      showLength: "显示键/元素数量",
      showScroll: "显示滚动条",
      showFullPath: "显示选中节点的完整路径",
      showSelectedNode: "显示选中节点",
      convertButton: "JSON转对象",
      example: "示例",
      copySelected: "复制选中节点",
      copyStringify: "复制源字符串",
      toggleNode: "切换所有节点",
      selectedNode: "选中的节点",
      noSelection: "未选中节点"
    },
    jsonToExcel: {
      title: "JSON数组对象转Excel文件！",
      inputLabel: "输入JSON，一级键将用作列名",
      inputPlaceholder: "在此输入JSON...",
      boldColumns: "列名加粗",
      fitColumns: "调整列宽",
      freezeRow: "冻结首行",
      convert: "转换",
      example: "示例"
    },
    jsonToPostgreSQL: {
      title: "JSON转PostgreSQL工具！",
      schemaName: "模式名称",
      tableName: "表名",
      primaryKey: "主键列",
      inputLabel: "输入JSON",
      inputPlaceholder: "在此输入JSON...",
      outputLabel: "SQL结果",
      outputPlaceholder: "SQL将显示在此处...",
      createTable: "添加建表脚本",
      deleteOld: "添加删除旧数据脚本",
      convert: "转换",
      copy: "复制",
      example: "示例"
    },
    jsonMapping: {
      title: "JSON对象A到B的递归值映射！",
      sourcePlaceholder: "需要映射的对象",
      sourceLabel: "映射对象",
      targetLabel: "复制对象",
      targetPlaceholder: "复制的值",
      resultPlaceholder: "映射后的结果",
      resultLabel: "映射结果",
      errorPlaceholder: "键值映射错误",
      errorLabel: "错误",
      mappingButton: "执行映射",
      formatButton: "格式化结果",
      copyResultButton: "复制结果",
      copyErrorButton: "复制错误",
      example: "示例"
    },
    textCompress: {
      title: "文本压缩算法！",
      input: {
        compress: "要压缩的文本",
        decompress: "已压缩的文本",
        algorithm: "压缩算法"
      },
      buttons: {
        compress: "压缩",
        decompress: "解压",
        example: "示例",
        copyInput: "复制输入",
        copyOutput: "复制输出"
      },
      stats: {
        ratio: "压缩率 {0}%",
        inputLength: "输入文本长度 {0}",
        outputLength: "输出文本长度 {0}"
      }
    },
    uuidGenerator: {
      title: "UUIDv4生成器！",
      input: {
        result: "结果"
      },
      buttons: {
        generate: "生成",
        copy: "复制"
      }
    },
    textToQRCode: {
      title: "文本转二维码工具！",
      input: {
        placeholder: "输入要生成二维码的文本...",
        maxLength: "每个二维码的最大字符数"
      },
      buttons: {
        generate: "生成二维码",
        downloadAll: "全部下载",
        download: "下载",
        example: "示例"
      },
      part: "第 {0}/{1} 部分"
    },
    qrCodeToText: {
      title: "二维码转文本工具！",
      note: "注意：上传顺序基于计算机排序顺序，请按日期升序排序以正确连接文件",
      dropZone: {
        placeholder: "在此拖放图片或使用Ctrl+V粘贴",
        label: "选择二维码图片"
      },
      convert: "转换",
      copy: "复制",
      result: "粘贴图片后将显示结果"
    },
    oneTimePassword: {
      title: "基于时间(TOTP)和基于HMAC(HOTP)的一次性密码！",
      sourceLabel: "数据来源",
      importOptions: {
        googleQR: "Google验证器二维码",
        google: "Google验证器",
        manual: "手动输入"
      },
      dropZone: {
        label: "选择二维码图片",
        placeholder: "在此拖放或上传图片"
      },
      auth: {
        username: "输入用户名",
        password: "输入密码以保存/加载验证列表",
        open: "打开",
        save: "保存",
        add: "添加"
      },
      inputs: {
        issuer: "发行方",
        name: "名称",
        secret: "密钥"
      },
      urlPlaceholder: "Google验证器迁移URL示例: otpauth-migration://offline?data=CjcKFFkwYrPBscVsQXM",
      decodeData: "Google验证器解码数据",
      remove: {
        filter: "输入要删除的验证名称，输入{0}删除全部",
        button: "删除"
      }
    },
  },
};
