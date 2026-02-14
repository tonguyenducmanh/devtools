class TDMockTextGenerate {
  generateLoremIpsum(paragraphs = 1) {
    const loremWords = [
      "lorem",
      "ipsum",
      "dolor",
      "sit",
      "amet",
      "consectetur",
      "adipiscing",
      "elit",
      "sed",
      "do",
      "eiusmod",
      "tempor",
      "incididunt",
      "ut",
      "labore",
      "et",
      "dolore",
      "magna",
      "aliqua",
      "ut",
      "enim",
      "ad",
      "minim",
      "veniam",
      "quis",
      "nostrud",
      "exercitation",
      "ullamco",
      "laboris",
      "nisi",
      "ut",
      "aliquip",
      "ex",
      "ea",
      "commodo",
      "consequat",
    ];

    function randomSentence() {
      const length = Math.floor(Math.random() * 8) + 8; // 8–15 từ
      let sentence = [];
      for (let i = 0; i < length; i++) {
        sentence.push(
          loremWords[Math.floor(Math.random() * loremWords.length)],
        );
      }
      let s = sentence.join(" ");
      return s.charAt(0).toUpperCase() + s.slice(1) + ".";
    }

    function randomParagraph() {
      const sentenceCount = Math.floor(Math.random() * 3) + 3; // 3–5 câu
      let paragraph = [];
      for (let i = 0; i < sentenceCount; i++) {
        paragraph.push(randomSentence());
      }
      return paragraph.join(" ");
    }

    let result = [];
    for (let i = 0; i < paragraphs; i++) {
      result.push(randomParagraph());
    }

    return result.join("\n\n");
  }

  generateLoremWords(wordCount = 50) {
    const words = [
      "lorem",
      "ipsum",
      "dolor",
      "sit",
      "amet",
      "consectetur",
      "adipiscing",
      "elit",
      "sed",
      "do",
      "eiusmod",
      "tempor",
      "incididunt",
      "ut",
      "labore",
      "et",
      "dolore",
      "magna",
      "aliqua",
    ];

    let result = [];
    for (let i = 0; i < wordCount; i++) {
      result.push(words[Math.floor(Math.random() * words.length)]);
    }

    let text = result.join(" ");
    return text.charAt(0).toUpperCase() + text.slice(1) + ".";
  }
  generateClassicLorem(paragraphs = 1) {
    const firstSentence =
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
    let text = generateLoremIpsum(paragraphs);
    return firstSentence + "\n\n" + text;
  }
}
export default new TDMockTextGenerate();
