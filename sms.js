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
        const message = `Ramazon oyi yakuniga qadar yangi kasb egasiga aylaning! Bizning 2 yillik tajribamizni 1 oyda o'rganib, daromad olishni boshlang. Batafsil https://target.umdsoft.uz`;
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
