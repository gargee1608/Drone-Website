import { Router } from "express";
import { body } from "express-validator";
import {
  sendOtp,
  verifyOtp,
  login,
  register,
} from "../controllers/authController.js";

const router = Router();

router.post(
  "/send-otp",
  [
    body("identifier")
      .trim()
      .notEmpty()
      .withMessage("Email or mobile is required"),
  ],
  sendOtp
);

router.post(
  "/verify-otp",
  [
    body("identifier")
      .trim()
      .notEmpty()
      .withMessage("Email or mobile is required"),
    body("otp").trim().notEmpty().withMessage("OTP is required"),
  ],
  verifyOtp
);

router.post(
  "/login",
  [
    body("identifier")
      .trim()
      .notEmpty()
      .withMessage("Email or mobile is required"),
    body("password").notEmpty().withMessage("Password is required"),
    body("role")
      .optional()
      .isIn(["user", "admin"])
      .withMessage("role must be user or admin"),
  ],
  login
);

router.post(
  "/register",
  [
    body("identifier")
      .trim()
      .notEmpty()
      .withMessage("Email or mobile is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("role").optional().isIn(["user", "admin"]),
  ],
  register
);

export default router;
