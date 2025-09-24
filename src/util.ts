import { Request, Response } from "express";

export const generateCreateRecordParams = (data: any) => {
  const columns = Object.keys(data).join(", ");
  const placeholders = Object.keys(data)
    .map(() => "?")
    .join(", ");
  const values = [...Object.values(data)] as any[];
  return { columns, placeholders, values };
};

export const generateUpdateRecordParams = (data: any) => {
  const setClause = Object.keys(data)
    .map((column) => `${column === "id" ? "sno" : column} = ?`)
    .join(", ");
  const values = [...Object.values(data)] as any[];
  return { setClause, values };
};

export const generateParams = (keys: any[], operator: string = "") => {
  if (!keys.length) return "";
  return keys
    .map(
      (key, index) =>
        `${key} = ?${index < keys.length - 1 ? ` ${operator} ` : ""}`
    )
    .join(" ");
};

export const getPlaceHolder = (list: any): string => {
  return list.map(() => "?").join(", ");
};

// export const generateAccessToken = (data: any) => {
//   return jwt.sign(data, process.env.JWT_SECRET_KEY!, { expiresIn: "25h" });
// };

export const generateRandomString = () =>
  Math.random().toString(36).slice(2).toUpperCase();

export const generateRandomNonRepeatingString = () =>
  `${Math.random()
    .toString(36)
    .slice(2)}${Date.now().toString()}`.toUpperCase();


