function mySimpleEncoder(str) {
  let result = "";

  for (let i = 0; i < str.length; i++) {
    let char = str[i];
    if (/[0-9]/.test(char)) {
      let digit = parseInt(char, 10);
      let encodedChar = String.fromCharCode(digit + 65);
      result += encodedChar;
    } else {
      result += char;
    }
  }
  return result;
}

function mySimpleDecoder(str) {
  let result = "";

  for (let i = 0; i < str.length; i++) {
    let char = str[i];
    if (/[A-Z]/.test(char)) {
      let encodedChar = char.charCodeAt(0) - 65;
      result += encodedChar;
    } else {
      result += char;
    }
  }
  return result;
}

module.exports = { mySimpleEncoder, mySimpleDecoder };
