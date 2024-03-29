// let id = ["999999AB"];

function strGen(number) {
  var baseChar = "A".charCodeAt(0),
    letters = "";
  do {
    number -= 1;
    letters = String.fromCharCode(baseChar + (number % 26)) + letters;
    number = (number / 26) >> 0;
  } while (number > 0);

  return letters;
}

exports.genNumber = (last_id) => {
  if (last_id[0].length == 8) {
    const alpha = "-ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let num = Number(last_id[0].slice(0, -2));
    let str = last_id[0].slice(-2);
    let first = str[0];
    let last = str[1];
    if (
      alpha.indexOf(first) + alpha.indexOf(last) == 26 + alpha.indexOf(first) &&
      num == 999999
    ) {
      num = 100000;
      return num + strGen((alpha.indexOf(first) + 1) * 26 + 1);
    } else if (
      alpha.indexOf(first) + alpha.indexOf(last) !==
        26 + alpha.indexOf(first) &&
      num == 999999
    ) {
      num = 100000;
      return num + strGen(alpha.indexOf(first) * 26 + alpha.indexOf(last) + 1);
    } else {
      num += 1;
      return num + strGen(alpha.indexOf(first) * 26 + alpha.indexOf(last));
    }
  } else {
    return 0;
  }
};
