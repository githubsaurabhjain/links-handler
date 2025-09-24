import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./src/route";
import path from "path";
import fs from "fs";
// import {
//   handleGoogleAuthentication,
//   handleSocialAuthentication,
// } from "./src/applications/shared/Google/google-auth.service";
if (fs.existsSync("./.env")) {
  dotenv.config({ path: "./.env" });
}

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.static(path.join(__dirname, "link-app/www")));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use(cors());
// app.get("/sso-social-authentication", handleGoogleAuthentication);
// app.get("/sso-authentication", handleSocialAuthentication);

// app.get("/server-time", (req, res) => {
//   res.json({ startTime: serverStartTime.format("DD-MMM-YYYY HH:mm:ss") });
// });
app.use(routes);
app.listen(PORT, () => {
  return console.log(`Server is listening at http://localhost:${PORT} 🥳`);
});
