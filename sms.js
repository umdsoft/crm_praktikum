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
        const message = `Maktabni bitirib nima qilsam ekan?

        Agar siz ham shuni o'ylayotgan bo'lsangiz Praktikum Academy Mobilografiya, SMM va Dasturlash kurslariga qabulni ochdik!
        
        Ro'yhatdan o'tish: https://forms.gle/zs8jXNnYgrBVq4hK8
        
        Telefon: +998781137008
`;
       axios
          .post(
            "https://notify.eskiz.uz/api/message/sms/send",
            {
              mobile_phone: `998${con[i].phone}`,
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
            console.log(response.data);
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
