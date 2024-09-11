const GroupStudentPay = require('../models/GroupStudentPay')

function generateRandomNumber() {
    return Math.floor(100000 + Math.random() * 900000); // 6 xonali raqam generatsiya qiladi
}

async function isNumberInDatabase(number) {
    const db = await GroupStudentPay.query().select('code')
    return db.some(item => item.code === number);  // Bazada mavjudligini tekshiradi
}

function generateUniqueRandomNumber(database) {
    let randomNumber;
    do {
        randomNumber = generateRandomNumber();
    } while (isNumberInDatabase(randomNumber, database)); // Bazada bor bo'lsa, qayta generatsiya qiladi
    return randomNumber;
}

// module.exports = generateUniqueRandomNumber

// console.log(generateUniqueRandomNumber())