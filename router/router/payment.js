const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");
const Payment = require('../../controller/Payment')

router.get('/all-payment', authMiddleware, Payment.getAllPayment)
router.get('/one-student-pay', authMiddleware, Payment.getOneStudentPay)
router.get('/pay-statistic',authMiddleware, Payment.paymetStatistic)
router.post("/pay/:id", authMiddleware, Payment.createPay);
router.get('/one-pay/:id', authMiddleware, Payment.getOnePaymentDetail)
router.get("/get-pay-type", authMiddleware, Payment.getPayType)


module.exports = router