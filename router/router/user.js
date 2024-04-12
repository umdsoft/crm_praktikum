const UserController = require("../../controller/User");
const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");
const { role } = require("../../middleware/role");

router.post("/register", authMiddleware, UserController.register);
router.post("/login", UserController.login);

router.post("/refresh-token", UserController.refreshToken);
router.put(
  "/edit-user",
  authMiddleware,
  role("admin"),
  UserController.editUser
);
router.get("/me", authMiddleware, UserController.me);
// admin
router.get("/get-all", authMiddleware, UserController.getAllUsers);
router.get("/get-role", authMiddleware, UserController.getRole);

module.exports = router;
