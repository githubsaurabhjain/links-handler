import { Request, Response } from "express";
import { Repository } from "./repository";
import DeviceDetector from "device-detector-js";

export const urlList = async (req: Request, res: Response) => {
  try {
    const record = await Repository.getUrls();
    res.json({
      status: true,
      message: "Records fetched successfully",
      output: record,
    });
  } catch (error) {
    res.json({
      status: false,
      message:
        (error instanceof Error && error.message) || "SOMETHING_WENT_WRONG",
      error: error instanceof Error && error.message,
    });
  }
};

export const addUrl = async (req: Request, res: Response) => {
  try {
    await Repository.addNewURL(req.body);
    res.json({
      status: true,
      message: "Url added successfully",
      output: {},
    });
  } catch (error) {
    res.json({
      status: false,
      message:
        (error instanceof Error && error.message) || "SOMETHING_WENT_WRONG",
      error: error instanceof Error && error.message,
    });
  }
};

export const getAppUrl = async (req: Request, res: Response) => {
  try {
    const { linkID } = req.body;
    const record = await Repository.getAppUrl(linkID);
    const userAgent = req.headers["user-agent"] || "";
    const deviceDetector = new DeviceDetector();

    const result = deviceDetector.parse(userAgent);
    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0] || // if behind proxy
      req.socket?.remoteAddress || // fallback
      "";
    const data = {
      linkID,
      ipAddress: ip,
      userAgent: userAgent,
      deviceType: result.device?.type || "",
      deviceName: result.device?.model || "",
      osName: result.os?.name || "",
      osVersion: result.os?.version || "",
      browserName: result.client?.name || "",
    };

    await Repository.addAccessLog(data);
    res.json({
      status: true,
      message: "Records fetched successfully",
      output: record[0].linkUrl,
    });
  } catch (error) {
    res.json({
      status: false,
      message:
        (error instanceof Error && error.message) || "SOMETHING_WENT_WRONG",
      error: error instanceof Error && error.message,
    });
  }
};

export const userList = async (req: Request, res: Response) => {
  try {
    const record = await Repository.getAllUsers();
    res.json({
      status: true,
      message: "Records fetched",
      output: record,
    });
  } catch (error) {
    res.json({
      status: false,
      message:
        (error instanceof Error && error.message) || "SOMETHING_WENT_WRONG",
      error: error instanceof Error && error.message,
    });
  }
};

export const addUser = async (req: Request, res: Response) => {
  try {
    const { ssoEmail, ...rest } = req.body;

    const userRecord = await Repository.findUserByEmail(ssoEmail);

    if (userRecord.length) {
      throw new Error("User Already Exist");
    }

    let userID;
    const lastInsertedRecord =
      (await Repository.fetchLastInsertedMaxId()) as any;
    let maxInsertedId = lastInsertedRecord[0].max_lp_id;
    if (!maxInsertedId) {
      maxInsertedId = 1000;
    }
    userID = `LN-${maxInsertedId + 1}`;

    await Repository.addNewUser({ ...req.body, userID, fullName: "" });
    res.json({
      status: true,
      message: "User added successfully",
      output: {},
    });
  } catch (error) {
    res.json({
      status: false,
      message:
        (error instanceof Error && error.message) || "SOMETHING_WENT_WRONG",
      error: error instanceof Error && error.message,
    });
  }
};
