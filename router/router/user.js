const UserController = require("../../controller/User");
const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");
router.post("/register", UserController.register);
router.post("/login", UserController.login);

router.post("/refresh-token", UserController.refreshToken);
router.put("/edit-user", authMiddleware, UserController.editUser);
router.get("/me", authMiddleware, UserController.me);
// admin
router.get("/get-all", authMiddleware, UserController.getAllUsers);

module.exports = router;
