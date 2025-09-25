import { Router } from "express";
import {
  addUrl,
  addUser,
  getAppUrl,
  getReports,
  urlList,
  userList,
} from "./controller";

const router = Router();
router.use("/urls", urlList);
router.use("/url/add", addUrl);
router.use("/appUrl", getAppUrl);

router.use("/users", userList);
router.use("/user/add", addUser);

router.use("/reports", getReports);

export default router;
