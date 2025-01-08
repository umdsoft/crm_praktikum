const con = require("./spiska");

const axios = require("axios");

const sendSms = async () => {
  let sum = 0;
  axios
    .post("https://notify.eskiz.uz/api/auth/login", {
      email: "ujumaniyozov@ya.ru",
      password: "kLTqmxUmFqOibxPCsDQuZ2mAnQFdGHgvfnfzXIds",
    })
    .then(function (response) {
      for (let i = 0; i < con.length; i++) {
        const message = `Ingliz (IELTS 7+) va Rus tilini mukammal bilasizmi? Urganch shahridagi Praktikum Academy siz dars bera olasiz! Qiziqarli jamoa va qulay sharoitlar sizni kutmoqda! 
        Hoziroq ro'yhatdan o'ting va ishga joylashing: 
        https://forms.gle/naEYtfuBg9xpVYf27`;
        axios
          .post(
            "https://notify.eskiz.uz/api/message/sms/send",
            {
              mobile_phone: `${con[i].phone}`,
              message: message,
              from: "4546",
            },
            {
              headers: {
                Authorization: `Bearer ${response.data.data.token}`,
              },
            }
          )
          .then(function (response) {
            sum = sum + 1;
            console.log("success");
          })
          .catch(function (error) {
            console.log(error);
          });
      }
    })
    .catch(function (error) {
      console.log(error);
    });
  console.log("Umumiy:", sum);
};

sendSms();
