class TDMockTextGenerate {
  constructor() {
    // Tập hợp từ vựng đầy đủ hơn theo chuẩn Cicero
    this.loremVocabulary = [
      "a",
      "ac",
      "accumsan",
      "ad",
      "adipiscing",
      "aenean",
      "aliquam",
      "aliquet",
      "amet",
      "ante",
      "aptent",
      "arcu",
      "at",
      "auctor",
      "augue",
      "bibendum",
      "blandit",
      "class",
      "commodo",
      "condimentum",
      "congestue",
      "consectetur",
      "consequat",
      "conubia",
      "convallis",
      "curabitur",
      "curae",
      "cursus",
      "dapibus",
      "diam",
      "dictum",
      "dictumst",
      "dignissim",
      "dis",
      "dolor",
      "donec",
      "dui",
      "duis",
      "efficitur",
      "egestas",
      "eget",
      "eleifend",
      "elementum",
      "elit",
      "enim",
      "erat",
      "eros",
      "est",
      "et",
      "etiam",
      "eu",
      "euismod",
      "facilisi",
      "facilisis",
      "fames",
      "faucibus",
      "felis",
      "fermentum",
      "feugiat",
      "fringilla",
      "fusce",
      "habitant",
      "habitasse",
      "hac",
      "hendrerit",
      "himenaeos",
      "iaculis",
      "id",
      "imperdiet",
      "in",
      "inceptos",
      "integer",
      "interdum",
      "ipsum",
      "isthmus",
      "justo",
      "lacinia",
      "lacus",
      "laoreet",
      "lectus",
      "leo",
      "libero",
      "ligula",
      "litora",
      "lobortis",
      "lorem",
      "luctus",
      "maecenas",
      "magna",
      "malesuada",
      "massa",
      "mattis",
      "mauris",
      "maximus",
      "metus",
      "mi",
      "molestie",
      "mollis",
      "montes",
      "morbi",
      "mus",
      "nam",
      "nasetur",
      "natoque",
      "nec",
      "neque",
      "netus",
      "nibh",
      "nisi",
      "nisl",
      "non",
      "nostra",
      "nulla",
      "nullam",
      "nunc",
      "odio",
      "orci",
      "ornare",
      "paretra",
      "parturient",
      "pelle tesque",
      "per",
      "phasellus",
      "placerat",
      "platea",
      "porta",
      "porttitor",
      "posuere",
      "potenti",
      "praesent",
      "pretium",
      "primis",
      "proin",
      "pulvinar",
      "purus",
      "quam",
      "quis",
      "quisque",
      "rhoncus",
      "ridiculus",
      "risus",
      "rutrum",
      "sagittis",
      "sapien",
      "scelerisque",
      "sed",
      "sem",
      "semper",
      "senectus",
      "sit",
      "sociosqu",
      "sodales",
      "sollicitudin",
      "suscipit",
      "suspendisse",
      "tellus",
      "tempor",
      "tempus",
      "tincidunt",
      "tortor",
      "tristique",
      "turpis",
      "ullamcorper",
      "ultrices",
      "ultricies",
      "urna",
      "ut",
      "varius",
      "ve",
      "vehicula",
      "vel",
      "velit",
      "venenatis",
      "vestibulum",
      "vitae",
      "vivamus",
      "viverra",
      "volutpat",
      "vulputate",
    ];
  }

  // Hàm bổ trợ lấy từ ngẫu nhiên
  _getRandomWord() {
    return this.loremVocabulary[
      Math.floor(Math.random() * this.loremVocabulary.length)
    ];
  }

  generateSentence(minWords = 5, maxWords = 15) {
    const length =
      Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
    let words = [];
    for (let i = 0; i < length; i++) {
      words.push(this._getRandomWord());
    }
    let sentence = words.join(" ");
    return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
  }

  generateParagraph(minSentences = 4, maxSentences = 8) {
    const count =
      Math.floor(Math.random() * (maxSentences - minSentences + 1)) +
      minSentences;
    let sentences = [];
    for (let i = 0; i < count; i++) {
      sentences.push(this.generateSentence());
    }
    return sentences.join(" ");
  }

  /**
   * Tạo các đoạn văn bản Lorem Ipsum
   * @param {number} paragraphs Số đoạn văn
   * @param {boolean} startWithStandard Cấu mốc "Lorem ipsum..." ở đầu?
   */
  generateLoremIpsum(paragraphs = 1, startWithStandard = false) {
    let result = [];
    for (let i = 0; i < paragraphs; i++) {
      result.push(this.generateParagraph());
    }

    if (startWithStandard && result.length > 0) {
      const standard =
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ";
      result[0] = standard + result[0];
    }

    return result.join("\n\n");
  }

  // Tạo một chuỗi từ ngẫu nhiên không ngắt đoạn
  generateLoremWords(wordCount = 50) {
    let words = [];
    for (let i = 0; i < wordCount; i++) {
      words.push(this._getRandomWord());
    }
    let text = words.join(" ");
    return text.charAt(0).toUpperCase() + text.slice(1) + ".";
  }
}

export default new TDMockTextGenerate();
