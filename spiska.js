const GroupStudentPay = require('./models/GroupStudentPay')

function generateRandomNumber() {
   return Math.floor(100000 + Math.random() * 900000); // 6 xonali raqam generatsiya qiladi
}

async function isNumberInDatabase(number) {
   const db = await GroupStudentPay.query().findOne('code', number)
   if (db) {
      return true
   } else {
      return false
   }
   // Bazada mavjudligini tekshiradi
}

function generateUniqueRandomNumber() {
   let randomNumber;
   do {
      randomNumber = generateRandomNumber();
   } while (isNumberInDatabase(randomNumber)); // Bazada bor bo'lsa, qayta generatsiya qiladi
   return randomNumber;
}

// module.exports = generateUniqueRandomNumber

console.log(isNumberInDatabase(1231231))