import { Request, Response } from "express";
import { Repository } from "./repository";
import DeviceDetector from "device-detector-js";
import { generateAccessToken } from "./util";

export const generateSSORequest = async (req: Request, res: Response) => {
  try {
    const { appRedirectUri, appScope } = req.body;
    const reqObj = {
      appRedirectUri,
      appScope,
      appId: "global-portal-link",
    };

    const response = await fetch(
      `${process.env.GB_API_URL}/auth/generateSSORequest`,
      {
        method: "POST",
        body: JSON.stringify(reqObj),
        headers: {
          "Content-Type": "application/json",
          tokenKey: process.env.GB_TOKEN_KEY!,
          devKey: process.env.GB_DEV_KEY!,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        "Error occurred while processing request, please try again"
      );
    }
    const data = await response.json();

    res.status(200).json(data);
  } catch (err) {
    throw Error("Error occurred while processing request, please try again");
  }
};

export const verifyAuthToken = async (req: Request, res: Response) => {
  try {
    const { requestID, token } = req.body;
    const reqObj = {
      requestID,
      token,
    };
    const response = await fetch(
      `${process.env.GB_API_URL}/auth/verifyAuthToken`,
      {
        method: "POST",
        body: JSON.stringify(reqObj),
        headers: {
          "Content-Type": "application/json",
          tokenKey: process.env.GB_TOKEN_KEY!,
          devKey: process.env.GB_DEV_KEY!,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Unable to Authenticate User`);
    }
    const data = await response.json();

    const { email, picture, name } = data?.output?.ssoResponse;

    const userRecord = await Repository.findUserByEmail(email);

    if (
      !userRecord.length ||
      (userRecord.length && userRecord[0].status === "Inactive")
    ) {
      throw Error(
        "You don't have access to the system right now, pleases contact admin"
      );
    }
    const { userID, ssoEmail, avatar, fullName, role } = userRecord[0];
    if (!fullName.length || !avatar) {
      await Repository.updateUser({ userID, avatar: picture, fullName: name });
    }

    const authToken = generateAccessToken({
      userID,
      email: ssoEmail,
      role,
      time: new Date().getTime(),
    });

    await Repository.updateLoginToken({
      token: authToken,
      userID,
      ssoEmail,
      actionType: "Login",
    });

    res.status(200).json({
      output: {
        ...userRecord[0],
        fullName: name,
        avatar: picture,
        token: authToken,
      },
      status: true,
      message: "User verified successfully",
    });
  } catch (error) {
    res.json({
      status: false,
      message:
        (error instanceof Error && error.message) ||
        "Unable to Authenticate User",
      error: "Unable to Authenticate User",
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { userID, email } = req.body;
    await Repository.updateLoginToken({ userID, token: null, ssoEmail: email, actionType: "Logout" });

    res
      .status(200)
      .json({ message: "Logout successfully", output: {}, status: true });
  } catch (error) {
    console.log(error);
    res.status(200).json({
      message: "Logout failed , try again later",
      error: "Something went wrong, please try again later",
      status: false,
    });
  }
};

export const verifySession = async (req: Request, res: Response) => {
  try {
    const { userID, email } = req.body;
    const userData = await Repository.findUserByEmail(email);
    console.log(userData);
    res.status(200).json({
      message: "user details fetched",
      output: userData[0],
      status: true,
    });
  } catch (error) {
    res.json({
      status: false,
      message:
        (error instanceof Error && error.message) ||
        "Unable to Authenticate User",
      error: "Unable to Authenticate User",
    });
  }
};

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
    await Repository.insertLinkAccessRecords([["LN-1001", linkID, "Editor"]]);

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
    const { linkID, users, role: accessGranted } = req.body;
    let newUserIds = [];
    const existingUsers = users.filter((item: string) =>
      item.startsWith("LN-")
    );
    const newUsers = users.filter((item: string) =>
      item.includes("@heromotocorp.com")
    );
    if (newUsers.length) {
      for (let email of newUsers) {
        const id = await createNewUser(
          {
            ssoEmail: email,
            role: "User",
          },
          true
        );
        if (id) newUserIds.push(id);
      }
    }

    const allUserIds = [...existingUsers, ...newUserIds];
    const records: [string, string, string][] = allUserIds.map((userId) => [
      userId,
      linkID,
      accessGranted,
    ]);

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

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { userID, role, status } = req.body;
    await Repository.updateUser({
      userID,
      role,
      status: status ? "Active" : "Inactive",
    });

    res.json({
      status: true,
      message: "User updated successfully",
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

const createNewUser = async (payload: any, sharedUser = false) => {
  const { ssoEmail } = payload;
  const userRecord = await Repository.findUserByEmail(ssoEmail);

  if (userRecord.length && !sharedUser) {
    throw new Error("User Already Exist");
  }

  if (userRecord.length && sharedUser) {
    return false;
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
    console.log(error);
    res
      .json({
        status: false,
        message:
          (error instanceof Error && error.message) || "SOMETHING_WENT_WRONG",
        error: error instanceof Error && error.message,
      })
      .status(500);
  }
};
