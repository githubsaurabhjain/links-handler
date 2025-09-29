import { Router } from "express";
import {
  addUrl,
  addUser,
  getAppUrl,
  getReports,
  shareUrl,
  updateUrl,
  urlList,
  userList,
} from "./controller";

const router = Router();
// router.use("/account/verifySsoLogin", verifySsoLogin);
router.use("/urls", urlList);
router.use("/url/share", shareUrl);
router.use("/url/add", addUrl);
router.use("/url/update", updateUrl);

router.use("/appUrl", getAppUrl);

router.use("/users", userList);
router.use("/user/add", addUser);

router.use("/reports", getReports);

export default router;
