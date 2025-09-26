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
    const { linkID } = req.body;
    const record = await Repository.findRecordThroughLinkId(linkID);
    if (record.length) {
      throw new Error("Link Id already exist");
    }
    await Repository.addNewURL(req.body);
    await Repository.insertLinkAccessRecords([["LN-1001", linkID, "Owner"]]);

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

export const updateUrl = async (req: Request, res: Response) => {
  try {
    await Repository.updateURL({ ...req.body });
    res.json({
      status: true,
      message: "Url updated successfully",
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

export const shareUrl = async (req: Request, res: Response) => {
  try {
    const { linkID, users, role: accessGranted, newUser = null } = req.body;
    let newUserId = null;
    if (newUser) {
      newUserId = await createNewUser({
        ssoEmail: newUser,
        role: "User",
      });
    }
    let records: any[] = [];
    for (let i of users) {
      const temp = [i, linkID, accessGranted];
      records = [...records, temp];
    }

    if (newUserId) {
      records.push([newUserId, linkID, accessGranted]);
    }

    await Repository.insertLinkAccessRecords(records);

    res.json({
      status: true,
      message: "Url shared successfully",
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
      req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
      req.socket?.remoteAddress ||
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
    await createNewUser(req.body);

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

const createNewUser = async (payload: any) => {
  const { ssoEmail } = payload;
  const userRecord = await Repository.findUserByEmail(ssoEmail);

  if (userRecord.length) {
    throw new Error("User Already Exist");
  }

  let userID;
  const lastInsertedRecord = (await Repository.fetchLastInsertedMaxId()) as any;
  let maxInsertedId = lastInsertedRecord[0].maxId;
  if (!maxInsertedId) {
    maxInsertedId = 1000;
  }
  userID = `LN-${maxInsertedId + 1}`;

  await Repository.addNewUser({ ...payload, userID, fullName: "" });
  return userID;
};

export const getReports = async (req: Request, res: Response) => {
  try {
    const record = await Repository.getReports();
    res.json({
      status: true,
      message: "Reports fetched",
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
