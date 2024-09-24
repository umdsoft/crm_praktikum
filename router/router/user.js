const UserController = require("../../controller/User");
const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");
const { checkRole } = require("../../middleware/role");

router.post("/register", authMiddleware, UserController.register);
router.post("/login", UserController.login);

router.post("/refresh-token", UserController.refreshToken);
router.put(
  "/edit-user",
  authMiddleware,
  checkRole("admin"),
  UserController.editUser
);
router.get("/me", authMiddleware, UserController.me);
// admin
router.get("/get-all", authMiddleware, UserController.getAllUsers);
router.get("/get-role", authMiddleware, UserController.getRole);
router.post(
  "/change-password",
  authMiddleware,
  checkRole("admin"),
  UserController.changePassword
);

module.exports = router;
