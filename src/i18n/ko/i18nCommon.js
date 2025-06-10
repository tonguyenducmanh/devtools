export default {
  i18nCommon: {
    typeInput: "값 입력",
    history: "기록",
    deleteAll: "전체 삭제",
    uploadFile: "파일 업로드",
    createbyAuthor: "tdmanh가 사랑을 담아 만듦",
    welcomeTextOne: "개발자를 위한",
    welcomeTextTwo: "필수",
    welcomeTextThree: "유틸리티 도구",
    sidebar: {
      filter: "도구 검색",
      menu: {
        show: "메뉴 표시",
        hide: "메뉴 숨기기"
      },
      theme: {
        light: "다크 테마로 전환",
        dark: "라이트 테마로 전환"
      },
      language: {
        switch: "언어 전환"
      }
    },
    feature: {
      welcome: "환영합니다",
      oneTimePassword: "일회용 비밀번호",
      textCompress: "텍스트 압축",
      compareCode: "코드 비교",
      colorPicker: "색상 선택기",
      JSONParser: "JSON 파서",
      JSONToPostgreSQL: "JSON to PostgreSQL",
      JSONMapping: "JSON 매핑",
      JSONToExcel: "JSON to Excel",
      CodeFormatter: "코드 포맷터",
      ImageFromBase64: "Base64에서 이미지로",
      ImageToBase64: "이미지에서 Base64로",
      QRCodeFromText: "텍스트에서 QR코드로",
      QRCodeToText: "QR코드에서 텍스트로",
      DownloadVSCodeExtension: "VSCode 확장 프로그램 다운로드",
      UUIDV4Generator: "UUIDv4 생성기",
    },
    example: "예시",
    base64ToImage: {
      title: "Base64를 이미지로 변환하는 도구!",
      donwloadImage: "이미지 다운로드",
      convert: "변환",
      placeHolder: "Base64 문자열을 여기에 붙여넣기",
      result: "변환 결과",
    },
    codeFormatter: {
      title: "코드 포맷터 도구!",
      typeOfCode: "코드 유형",
      inputCode: "코드 입력",
      outputCode: "출력 코드",
      formatCode: "코드 포맷",
      copyOutput: "출력 복사",
    },
    colorPicker: {
      title: "색상 선택 도구!",
      uploadLabel: "이미지를 선택하거나 여기로 드래그 (PNG, JPG, GIF 최대 10MB)",
      uploadButton: "업로드",
      colorPalette: "색상 팔레트",
      selectedColor: "선택된 색상",
      copyColor: "색상 복사",
      uploadNewImage: "새 이미지 업로드"
    },
    compareCode: {
      title: "파일 비교(diff) 도구!",
      firstFile: "비교할 첫 번째 코드 파일",
      secondFile: "비교할 두 번째 코드 파일",
      compareStyle: "비교 스타일 (true는 나란히, false는 줄 단위)",
      compare: "차이점 비교",
      example: "예시"
    },
    downloadVSCodeExt: {
      title: "marketplace.visualstudio.com에서 VSCode 확장 프로그램 다운로드!",
      subtitle: "Microsoft가 제거한 레거시 다운로드용",
      itemName: "항목 이름",
      version: "버전",
      downloadLink: "다운로드 링크",
      generateLink: "다운로드 링크 생성",
      copyLink: "링크 복사",
      example: "예시"
    },
    imageToBase64: {
      title: "이미지를 Base64로 변환하는 도구!",
      dropZone: "여기에 이미지 붙여넣기(Ctrl+V) 또는 드래그 앤 드롭",
      placeHolder: "Base64 출력이 여기에 표시됩니다",
      copyButton: "Base64 복사"
    },
    jsonParser: {
      title: "JSON을 재귀적 객체로 변환!",
      inputPlaceholder: "객체로 변환할 JSON",
      recursiveParser: "재귀적 JSON 파싱 처리",
      showCollapseIcon: "객체 접기 아이콘 표시",
      showLineNumber: "줄 번호 표시",
      showLength: "키/요소 수 표시",
      showScroll: "스크롤바 표시",
      showFullPath: "선택된 노드의 전체 경로 표시",
      showSelectedNode: "선택된 노드 표시",
      convertButton: "JSON을 객체로",
      example: "예시",
      copySelected: "선택된 노드 복사",
      copyStringify: "소스 문자열 복사",
      toggleNode: "모든 노드 토글",
      selectedNode: "선택된 노드",
      noSelection: "선택된 노드 없음"
    },
    jsonToExcel: {
      title: "JSON 배열 객체를 Excel 파일로 변환!",
      inputLabel: "JSON 입력, 레벨 1 키가 열 이름으로 사용됨",
      inputPlaceholder: "여기에 JSON 입력...",
      boldColumns: "열 이름 굵게",
      fitColumns: "열 너비 맞춤",
      freezeRow: "첫 행 고정",
      convert: "변환",
      example: "예시"
    },
    jsonToPostgreSQL: {
      title: "JSON을 PostgreSQL로 변환하는 도구!",
      schemaName: "스키마 이름",
      tableName: "테이블 이름",
      primaryKey: "기본 키 열",
      inputLabel: "JSON 입력",
      inputPlaceholder: "여기에 JSON 입력...",
      outputLabel: "SQL 결과",
      outputPlaceholder: "SQL이 여기에 표시됩니다...",
      createTable: "테이블 생성 스크립트 추가",
      deleteOld: "이전 데이터 삭제 스크립트 추가",
      convert: "변환",
      copy: "복사",
      example: "예시"
    },
    jsonMapping: {
      title: "JSON 객체 A에서 B로 재귀적 값 매핑!",
      sourcePlaceholder: "매핑이 필요한 객체",
      sourceLabel: "매핑 객체",
      targetLabel: "복사 객체",
      targetPlaceholder: "복사할 값",
      resultPlaceholder: "매핑 후 결과",
      resultLabel: "매핑 결과",
      errorPlaceholder: "키 값 매핑 오류",
      errorLabel: "오류",
      mappingButton: "매핑 실행",
      formatButton: "결과 포맷",
      copyResultButton: "결과 복사",
      copyErrorButton: "오류 복사",
      example: "예시"
    },
    textCompress: {
      title: "텍스트 압축 알고리즘!",
      input: {
        compress: "압축할 텍스트",
        decompress: "압축된 텍스트",
        algorithm: "압축 알고리즘"
      },
      buttons: {
        compress: "압축",
        decompress: "압축 해제",
        example: "예시",
        copyInput: "입력 복사",
        copyOutput: "출력 복사"
      },
      stats: {
        ratio: "압축률 {0}%",
        inputLength: "입력 텍스트 길이 {0}",
        outputLength: "출력 텍스트 길이 {0}"
      }
    },
    uuidGenerator: {
      title: "UUIDv4 생성 도구!",
      input: {
        result: "결과"
      },
      buttons: {
        generate: "생성",
        copy: "복사"
      }
    },
    textToQRCode: {
      title: "텍스트를 QR코드로 변환하는 도구!",
      input: {
        placeholder: "QR코드로 변환할 텍스트 입력...",
        maxLength: "QR코드당 최대 문자 수"
      },
      buttons: {
        generate: "QR코드 생성",
        downloadAll: "전체 다운로드",
        download: "다운로드",
        example: "예시"
      },
      part: "파트 {0}/{1}"
    },
    qrCodeToText: {
      title: "QR코드를 텍스트로 변환하는 도구!",
      note: "참고: 업로드 순서는 컴퓨터 정렬 순서를 기반으로 합니다. 올바른 파일 연결을 위해 날짜 오름차순으로 정렬하세요",
      dropZone: {
        placeholder: "이미지를 여기에 드롭하거나 Ctrl+V로 붙여넣기",
        label: "QR코드 이미지 선택"
      },
      convert: "변환",
      copy: "복사",
      result: "이미지를 붙여넣으면 결과가 표시됩니다"
    },
    oneTimePassword: {
      title: "시간 기반(TOTP) 및 HMAC 기반(HOTP) 일회용 비밀번호!",
      sourceLabel: "데이터 소스",
      importOptions: {
        googleQR: "Google 인증기 QR코드",
        google: "Google 인증기",
        manual: "수동 입력"
      },
      dropZone: {
        label: "QR코드 이미지 선택",
        placeholder: "이미지를 여기에 드롭하거나 업로드"
      },
      auth: {
        username: "사용자 이름 입력",
        password: "인증 목록 저장/불러오기용 비밀번호 입력",
        open: "열기",
        save: "저장",
        add: "추가"
      },
      inputs: {
        issuer: "발급자",
        name: "이름",
        secret: "비밀 키"
      },
      urlPlaceholder: "Google 인증기 마이그레이션 URL 예시: otpauth-migration://offline?data=CjcKFFkwYrPBscVsQXM",
      decodeData: "Google 인증기 디코딩 데이터",
      remove: {
        filter: "삭제할 인증 이름을 정확히 입력하거나, {0}을 입력하여 모두 삭제",
        button: "삭제"
      }
    },
  },
};
