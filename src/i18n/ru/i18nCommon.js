export default {
  i18nCommon: {
    typeInput: "Введите значение",
    history: "История",
    deleteAll: "Удалить всё",
    uploadFile: "Загрузить файл",
    createbyAuthor: "Создано tdmanh с любовью",
    welcomeTextOne: "Всё",
    welcomeTextTwo: "необходимое",
    welcomeTextThree: "для разработчика",
    sidebar: {
      filter: "Поиск инструментов",
      menu: {
        show: "Показать меню",
        hide: "Скрыть меню"
      },
      theme: {
        light: "Переключить на тёмную тему",
        dark: "Переключить на светлую тему"
      },
      language: {
        switch: "Сменить язык"
      }
    },
    feature: {
      welcome: "Добро пожаловать",
      oneTimePassword: "Одноразовый пароль",
      textCompress: "Сжатие текста",
      compareCode: "Сравнение кода",
      colorPicker: "Выбор цвета",
      JSONParser: "JSON парсер",
      JSONToPostgreSQL: "JSON в PostgreSQL",
      JSONMapping: "Маппинг JSON",
      JSONToExcel: "JSON в Excel",
      CodeFormatter: "Форматирование кода",
      ImageFromBase64: "Изображение из Base64",
      ImageToBase64: "Изображение в Base64",
      QRCodeFromText: "QR-код из текста",
      QRCodeToText: "Текст из QR-кода",
      DownloadVSCodeExtension: "Загрузка расширений VSCode",
      UUIDV4Generator: "Генератор UUIDv4",
    },
    example: "пример",
    base64ToImage: {
      title: "Конвертер Base64 в изображение!",
      donwloadImage: "Скачать изображение",
      convert: "Конвертировать",
      placeHolder: "Вставьте сюда строку Base64",
      result: "Результат конвертации",
    },
    codeFormatter: {
      title: "Инструмент форматирования кода!",
      typeOfCode: "Тип кода",
      inputCode: "Входной код",
      outputCode: "Выходной код",
      formatCode: "Форматировать код",
      copyOutput: "Копировать результат",
    },
    colorPicker: {
      title: "Инструмент выбора цвета!",
      uploadLabel: "Выберите или перетащите изображение (PNG, JPG, GIF до 10MB)",
      uploadButton: "Загрузить",
      colorPalette: "Палитра цветов",
      selectedColor: "Выбранный цвет",
      copyColor: "Копировать цвет",
      uploadNewImage: "Загрузить новое изображение"
    },
    compareCode: {
      title: "Инструмент сравнения файлов (diff)!",
      firstFile: "Первый файл для сравнения",
      secondFile: "Второй файл для сравнения",
      compareStyle: "стиль сравнения (true - рядом, false - построчно)",
      compare: "Сравнить изменения",
      example: "Пример"
    },
    downloadVSCodeExt: {
      title: "Загрузка расширений VSCode с marketplace.visualstudio.com!",
      subtitle: "Для устаревших расширений, удалённых Microsoft",
      itemName: "Название элемента",
      version: "Версия",
      downloadLink: "Ссылка для загрузки",
      generateLink: "Сгенерировать ссылку",
      copyLink: "Копировать ссылку",
      example: "Пример"
    },
    imageToBase64: {
      title: "Конвертер изображений в Base64!",
      dropZone: "Вставьте изображение сюда (Ctrl+V) или перетащите",
      placeHolder: "Здесь появится Base64 код",
      copyButton: "Копировать Base64"
    },
    jsonParser: {
      title: "Конвертер JSON в рекурсивный объект!",
      inputPlaceholder: "JSON для преобразования в объект",
      recursiveParser: "Рекурсивный парсинг JSON",
      showCollapseIcon: "показать иконку сворачивания",
      showLineNumber: "показать номера строк",
      showLength: "показать количество ключей/элементов",
      showScroll: "показать полосу прокрутки",
      showFullPath: "показать полный путь выбранного узла",
      showSelectedNode: "показать выбранный узел",
      convertButton: "JSON в объект",
      example: "Пример",
      copySelected: "Копировать выбранный узел",
      copyStringify: "Копировать исходный текст",
      toggleNode: "Свернуть/развернуть все узлы",
      selectedNode: "Выбранный узел",
      noSelection: "Узел не выбран"
    },
    jsonToExcel: {
      title: "Конвертер массива JSON в Excel!",
      inputLabel: "Введите JSON, ключи первого уровня станут названиями столбцов",
      inputPlaceholder: "Введите JSON здесь...",
      boldColumns: "Жирные заголовки",
      fitColumns: "Подогнать ширину столбцов",
      freezeRow: "Закрепить первую строку",
      convert: "Конвертировать",
      example: "Пример"
    },
    jsonToPostgreSQL: {
      title: "Конвертер JSON в PostgreSQL!",
      schemaName: "Имя схемы",
      tableName: "Имя таблицы",
      primaryKey: "Столбец первичного ключа",
      inputLabel: "Введите JSON",
      inputPlaceholder: "Введите JSON здесь...",
      outputLabel: "Результат SQL",
      outputPlaceholder: "Здесь появится SQL...",
      createTable: "Добавить скрипт создания таблицы",
      deleteOld: "Добавить скрипт удаления старых данных",
      convert: "Конвертировать",
      copy: "Копировать",
      example: "Пример"
    },
    jsonMapping: {
      title: "Рекурсивное отображение значений из JSON A в JSON B!",
      sourcePlaceholder: "Объект для отображения",
      sourceLabel: "Исходный объект",
      targetLabel: "Целевой объект",
      targetPlaceholder: "Значения для копирования",
      resultPlaceholder: "Результат отображения",
      resultLabel: "Результат",
      errorPlaceholder: "Ошибка отображения",
      errorLabel: "Ошибка",
      mappingButton: "Выполнить отображение",
      formatButton: "Форматировать результат",
      copyResultButton: "Копировать результат",
      copyErrorButton: "Копировать ошибку",
      example: "Пример"
    },
    textCompress: {
      title: "Алгоритмы сжатия текста!",
      input: {
        compress: "Текст для сжатия",
        decompress: "Сжатый текст",
        algorithm: "Алгоритм сжатия"
      },
      buttons: {
        compress: "Сжать",
        decompress: "Распаковать",
        example: "Пример",
        copyInput: "Копировать ввод",
        copyOutput: "Копировать вывод"
      },
      stats: {
        ratio: "Степень сжатия {0}%",
        inputLength: "Длина входного текста {0}",
        outputLength: "Длина выходного текста {0}"
      }
    },
    uuidGenerator: {
      title: "Генератор UUIDv4!",
      input: {
        result: "Результат"
      },
      buttons: {
        generate: "Сгенерировать",
        copy: "Копировать"
      }
    },
    textToQRCode: {
      title: "Конвертер текста в QR-код!",
      input: {
        placeholder: "Введите текст для создания QR-кода...",
        maxLength: "Максимальное количество символов на QR-код"
      },
      buttons: {
        generate: "Создать QR-код",
        downloadAll: "Скачать все",
        download: "Скачать",
        example: "Пример"
      },
      part: "Часть {0}/{1}"
    },
    qrCodeToText: {
      title: "Конвертер QR-кода в текст!",
      note: "Примечание: порядок загрузки основан на сортировке компьютера, для правильного объединения файлов сортируйте по возрастанию даты",
      dropZone: {
        placeholder: "Перетащите изображения сюда или используйте Ctrl+V",
        label: "Выберите QR-код"
      },
      convert: "Конвертировать",
      copy: "Копировать",
      result: "Результат появится после вставки изображения"
    },
    oneTimePassword: {
      title: "Одноразовые пароли на основе времени (TOTP) и HMAC (HOTP)!",
      sourceLabel: "Источник данных",
      importOptions: {
        googleQR: "QR-код Google Authenticator",
        google: "Google Authenticator",
        manual: "Ручной ввод"
      },
      dropZone: {
        label: "Выберите QR-код",
        placeholder: "Перетащите изображение или загрузите"
      },
      auth: {
        username: "Введите имя пользователя",
        password: "Введите пароль для сохранения/загрузки списка аутентификации",
        open: "Открыть",
        save: "Сохранить",
        add: "Добавить"
      },
      inputs: {
        issuer: "Издатель",
        name: "Имя",
        secret: "Секретный ключ"
      },
      urlPlaceholder: "Пример URL миграции Google Authenticator: otpauth-migration://offline?data=CjcKFFkwYrPBscVsQXM",
      decodeData: "Декодированные данные Google Authenticator",
      remove: {
        filter: "Введите точное имя для удаления, введите {0} для удаления всех",
        button: "Удалить"
      }
    },
  },
};
