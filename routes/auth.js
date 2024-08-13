const express = require("express");

// Middlewares
const { requireSignin, isAdmin } = require("../middlewares");

// Controllers
const {
  register,
  login,
  currentUser,
  forgotPassword,
  profileUpdate,
  findPeople,
  addfollower,
  userFollowing,
  userFollowingList,
  userFollowersList,
  removefollower,
  userUnfollow,
  searchUser,
  getUser,
} = require("../controllers/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/current-user", requireSignin, currentUser);
router.post("/forgot-password", forgotPassword);

router.put("/profile-update", requireSignin, profileUpdate);

router.get("/find-people", requireSignin, findPeople);

router.put("/user-follow", requireSignin, addfollower, userFollowing);
router.put("/user-unfollow", requireSignin, removefollower, userUnfollow);

router.get("/user-following", requireSignin, userFollowingList);
router.get("/user-follower", requireSignin, userFollowersList);

router.get("/search-user/:query", searchUser);
router.get("/user/:username", getUser);

router.get("/current-admin", requireSignin, isAdmin, currentUser)

module.exports = router;
