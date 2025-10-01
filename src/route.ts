import { Router } from "express";
import {
  addUrl,
  addUser,
  generateSSORequest,
  getAppUrl,
  getReports,
  logout,
  shareUrl,
  updateUrl,
  updateUser,
  urlList,
  userList,
  verifyAuthToken,
  verifySession,
} from "./controller";
import { verifySessionToken } from "./middleware";

const router = Router();
router.use("/auth/generateSSORequest", generateSSORequest);
router.use("/auth/verifyAuthToken", verifyAuthToken);
router.use("/auth/logout", verifySessionToken, logout);
router.use("/auth/verifySession", verifySessionToken, verifySession);

router.use("/urls", verifySessionToken, urlList);
router.use("/url/share", verifySessionToken, shareUrl);
router.use("/url/add", verifySessionToken, addUrl);
router.use("/url/update", verifySessionToken, updateUrl);

router.use("/appUrl", getAppUrl);

router.use("/users", verifySessionToken, userList);
router.use("/user/add", verifySessionToken, addUser);
router.use("/user/update", verifySessionToken, updateUser);

router.use("/reports", verifySessionToken, getReports);

export default router;
