import { useState } from "react";
import "./App.css";

import AccessAccount, { type LoginInfo } from "./AccessAccount";
import AccessSheet from "./AccessSheet";
import LoginContent from "./LoginContent";

export default function App() {
  const LAST_LOGIN_EMAIL_KEY = "lastLoginEmail";

  const [phase, setPhase] = useState<"loginRequired" | "sheetRequired" | "ready">("loginRequired");

  const [access_token, setAccessToken] = useState<string>("");
  const [spreadsheetId, setSpreadsheetId] = useState<string>("");

  const handleLoginSuccess = (access_token: string) => {
    console.log("handleLoginSuccess");
    setAccessToken(access_token);
    setPhase("sheetRequired");
  };

  const handleSheetSuccess = (spreadsheetId: string | undefined) => {
    if (!spreadsheetId) {
      console.log("handleSheetSuccess:failed");
      return;
    }

    console.log("handleSheetSuccess:success", spreadsheetId);
    setSpreadsheetId(spreadsheetId);
    setPhase("ready");
  };

  const tryLoadLastLoginEmail = () => {
    const email = localStorage.getItem(LAST_LOGIN_EMAIL_KEY);
    if (email) {
      console.log("tryLoadLastLoginEmail:success", email);
      return email;
    }
    console.log("tryLoadLastLoginEmail:failed");
    return undefined;
  };

  const storeLastLoginEmail = (email: string | undefined) => {
    if (email) {
      console.log("storeLastLoginEmail:success", email);
      localStorage.setItem(LAST_LOGIN_EMAIL_KEY, email);
    } else {
      console.log("storeLastLoginEmail:failed");
    }
  };

  const storeLoginInfo = (loginInfo: LoginInfo) => {
    console.log("storeLoginInfo", loginInfo);
    if (loginInfo.email) {
      console.log("storeLoginInfo:success", loginInfo.email);
      storeLastLoginEmail(loginInfo.email);
    }
  };

  return (
    <>
      {phase === "loginRequired" && <AccessAccount onSuccess={handleLoginSuccess} loginHintEmail={tryLoadLastLoginEmail()} onNewLogin={storeLoginInfo} />}
      {phase === "sheetRequired" && <AccessSheet accessToken={access_token} onSuccess={handleSheetSuccess} />}
      {phase === "ready" && <LoginContent accessToken={access_token} spreadsheetId={spreadsheetId} />}
    </>
  );
}
