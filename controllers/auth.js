const User = require("../models/user");
const { hashPassword, comparePassword } = require("../helpers/auth");
const jwt = require("jsonwebtoken");
const ShortUniqueId = require("short-unique-id");
const { Error } = require("mongoose");
const uid = new ShortUniqueId({ length: 10 });

const register = async (req, res) => {
  // console.log("Register Endpoint", req.body);
  const { name, email, password, secret } = req.body;

  // Validating the details of the user
  if (!name) {
    return res.json({
      error: "Name is required",
    });
  }
  if (!email) {
    return res.json({
      error: "Email is required",
    });
  }
  if (!password || password.length < 6) {
    return res.json({
      error: "Password is required and it should at least contain 6 character",
    });
  }
  if (!secret) {
    return res.json({
      error: "Secret Message is required",
    });
  }
  const exist = await User.findOne({ email });
  if (exist) {
    return res.json({
      error: "User is already registered",
    });
  }

  // Hashing the password
  const hashedPassword = await hashPassword(password);

  const user = new User({
    name,
    email,
    password: hashedPassword,
    secret,
    username: uid.rnd(),
  });
  try {
    user.save();
    // console.log("User Registered", user);
    return res.json({ ok: true });
  } catch (error) {
    console.log("Register Failed", error);
    return res.status(400).send("Error. Try Again.");
  }
};

const login = async (req, res) => {
  // console.log(req.body)
  try {
    const { email, password } = req.body;
    // Check if user exists with that email
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        error: "User is not registered",
      });
    }
    // Check password
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.json({
        error: "Wrong Password",
      });
    }
    // Create signed in token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d", // For 30 sec timeout = 30*60 = 1800
    });
    user.password = undefined;
    user.secret = undefined;
    res.json({
      token,
      user,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).send("Error While Logging, Try again");
  }
};

const currentUser = async (req, res) => {
  try {
    const user = await User.findById(req.auth._id);
    // res.json(user);
    res.json({ ok: true });
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
};

const forgotPassword = async (req, res) => {
  // console.log(req.body)
  const { email, newPassword, secret } = req.body;
  // Validating
  if (!newPassword || !newPassword.length > 6) {
    return res.json({
      error: "New Password is required and should be minimum of 6 character",
    });
  }
  if (!secret) {
    return res.json({
      error: "Secret answer is required",
    });
  }
  const user = await User.findOne({ email, secret });
  if (!user) {
    return res.json({
      error: "User is not registered with this email or the secret answer is wrong.",
    });
  }

  try {
    const hashed = await hashPassword(newPassword);
    await User.findByIdAndUpdate(user._id, { password: hashed });
    return res.json({
      success: "Now you can login with your new password",
    });
  } catch (error) {
    console.log(error);
    return res.json({
      error: "Something went wrong, try again",
    });
  }
};

const profileUpdate = async (req, res) => {
  try {
    // console.log("Profile update data check", req.body)
    const data = {};

    if (req.body.username) {
      data.username = req.body.username;
    }

    if (req.body.about) {
      data.about = req.body.about;
    }

    if (req.body.name) {
      data.name = req.body.name;
    }

    if (req.body.password) {
      if (req.body.password.length < 6) {
        res.json({
          error:
            "Password is required and should atleast contain more than 6 character",
        });
      } else {
        data.password = await hashPassword(req.body.password);
      }
    }

    if (req.body.secret) {
      data.secret = req.body.secret;
    }

    if (req.body.image) {
      data.image = req.body.image;
    }

    let user = await User.findByIdAndUpdate(req.auth._id, data, { new: true });
    // console.log("Updated user data", user);
    user.password = undefined;
    user.secret = undefined;
    res.json(user);
  } catch (error) {
    if (error.code == 11000) {
      res.json("Username already taken");
    }
    console.log(error);
  }
};

const findPeople = async (req, res) => {
  try {
    const user = await User.findById(req.auth._id);
    // User is following
    let following = user.following;
    following.push(user._id);
    const people = await User.find({ _id: { $nin: following } })
      .select("-password -secret")
      .limit(10);
    res.json(people);
  } catch (error) {
    console.log(error);
  }
};

const addfollower = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.body._id, {
      $addToSet: { followers: req.auth._id },
    });
    next();
  } catch (error) {
    console.log(error);
  }
};

const userFollowing = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.auth._id,
      {
        $addToSet: { following: req.body._id },
      },
      { new: true }
    ).select("-password -secret");
    res.json(user);
  } catch (error) {
    console.log(error);
  }
};

const userFollowingList = async (req, res) => {
  try {
    const user = await User.findById(req.auth._id);
    const following = await User.find({ _id: user.following }).limit(200);
    res.json(following);
  } catch (error) {
    console.log(error);
  }
};

const userFollowersList = async (req, res) => {
  try {
    const user = await User.findById(req.auth._id);
    const followers = await User.find({ _id: user.followers }).limit(200);
    res.json(followers);
  } catch (error) {
    console.log(error);
  }
};

const removefollower = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.body._id, {
      $pull: {
        followers: req.auth._id,
      },
    });
    next();
  } catch (error) {
    console.log(error);
  }
};

const userUnfollow = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.auth._id,
      {
        $pull: { following: req.body._id },
      },
      { new: true }
    ).select("-password -secret");
    res.json(user);
  } catch (error) {
    console.log(error);
  }
};

const searchUser = async (req, res) => {
  const { query } = req.params;
  if (!query) return;
  try {
    const user = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
      ],
    }).select("-secret -password");
    // console.log(user)
    res.json(user);
  } catch (error) {
    console.log(error);
  }
};

const getUser = async (req, res) => {
  const username = req.params.username;
  try {
    const user = await User.findOne({ username }).select("-password -secret");
    res.json(user);
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
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
};
