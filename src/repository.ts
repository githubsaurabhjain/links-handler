import { QueryResult } from "mysql2";
import pool from "../config/pool";
import { generateCreateRecordParams } from "./util";

export class Repository {
  constructor() {}

  public static getAllUsers = async () => {
    const query = `SELECT sno ,userID, ssoEmail as email, fullName as name, role as userType , status FROM user_master;`;
    const [records] = await pool.query(query);
    return records as QueryResult;
  };

  public static getUrls = async () => {
    const query = `SELECT sno ,linkID, linkName, linkUrl, tags, expiryTime FROM link_master;`;
    const [records] = await pool.query(query);
    return records as QueryResult;
  };

  public static getAppUrl = async (linkID: string) => {
    return Repository.findRecord({
      columnName: "linkID",
      value: linkID,
      model: "link_master",
      selectParam: "linkUrl",
    });
  };

  public static findUserByEmail = async (email: string) => {
    return Repository.findRecord({
      columnName: "ssoEmail",
      value: email,
      model: "user_master",
    });
  };

  public static findRecordThroughLinkId = async (linkId: string) => {
    return Repository.findRecord({
      columnName: "linkID",
      value: linkId,
      model: "link_master",
    });
  };

  public static async fetchLastInsertedMaxId() {
    let query = `SELECT MAX(CAST(SUBSTRING(userID, 4) AS UNSIGNED)) AS maxId
FROM user_master;`;
    const [results] = await pool.query(query);
    return results as QueryResult;
  }

  public static findRecord = async ({
    columnName,
    value,
    model,
    selectParam = "*",
  }: any): Promise<any> => {
    const query = `SELECT ${selectParam} from ${model} WHERE ${columnName} = ?;`;
    const [record] = await pool.query(query, [value]);
    return record as QueryResult;
  };
  public static addNewUser = async (payload: any) => {
    const { columns, placeholders, values } =
      generateCreateRecordParams(payload);
    const query = `INSERT INTO user_master(${columns}) VALUES(${placeholders});`;
    return await pool.query(query, values);
  };

  public static addNewURL = async (payload: any) => {
    const { columns, placeholders, values } =
      generateCreateRecordParams(payload);
    const query = `INSERT INTO link_master(${columns}) VALUES(${placeholders});`;
    return await pool.query(query, values);
  };

  public static addAccessLog = async (payload: any) => {
    const { columns, placeholders, values } =
      generateCreateRecordParams(payload);
    const query = `INSERT INTO link_access_log(${columns}) VALUES(${placeholders});`;
    return await pool.query(query, values);
  };

  public static getReports = async () => {
    const query = `SELECT 
    lm.linkID, 
    lm.linkName, 
    lm.expiryTime, 
    lm.tags, 
    lm.linkUrl,
    COUNT(ll.linkID) AS clicked
FROM 
    link_db.link_master lm
LEFT JOIN 
    link_db.link_access_log ll 
    ON lm.linkID = ll.linkID
GROUP BY 
    lm.linkID, lm.linkName, lm.expiryTime, lm.tags, lm.linkUrl;`;
    const [records] = await pool.query(query);
    return records as QueryResult;
  };
}
