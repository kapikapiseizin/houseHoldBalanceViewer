import { useState } from "react";

import AccessAccount, { type LoginInfo } from "./AccessAccount";
import AccessSheet from "./AccessSheet";
import LoginContent from "./login_content/LoginContent";
import { GoogleSheetOperator } from "./GoogleSheetOperator";

export default function App() {
  const LAST_LOGIN_EMAIL_KEY = "lastLoginEmail";
  const LAST_SPREADSHEET_ID_KEY = "lastSpreadsheetId";

  const [phase, setPhase] = useState<"loginRequired" | "sheetRequired" | "ready">("loginRequired");

  const [access_token, setAccessToken] = useState<string>("");
  const [spreadsheetId, setSpreadsheetId] = useState<string>("");

  const handleLoginSuccess = (access_token: string) => {
    console.log("handleLoginSuccess");
    setAccessToken(access_token);
    setPhase("sheetRequired");
  };

  const handleSheetSuccess = (spreadsheetId: string) => {
    console.log("handleSheetSuccess:success", spreadsheetId);
    setSpreadsheetId(spreadsheetId);
    storeLastSpreadsheetId(spreadsheetId);
    setPhase("ready");
  };

  const handleSheetFailure = () => {
    console.log("handleSheetFailure");
    setPhase("sheetRequired");
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

  const tryLoadLastSpreadsheetId = () => {
    const spreadsheetId = localStorage.getItem(LAST_SPREADSHEET_ID_KEY);
    if (spreadsheetId) {
      console.log("tryLoadLastSpreadsheetId:success", spreadsheetId);
      return spreadsheetId;
    }
    console.log("tryLoadLastSpreadsheetId:failed");
    return undefined;
  };

  const storeLastSpreadsheetId = (spreadsheetId: string | undefined) => {
    if (spreadsheetId) {
      console.log("storeLastSpreadsheetId:success", spreadsheetId);
      localStorage.setItem(LAST_SPREADSHEET_ID_KEY, spreadsheetId);
    } else {
      console.log("storeLastSpreadsheetId:failed");
    }
  };

  const handleLogout = () => {
    console.log("handleLogout");
    localStorage.removeItem(LAST_LOGIN_EMAIL_KEY);
    localStorage.removeItem(LAST_SPREADSHEET_ID_KEY);
    setPhase("loginRequired");
  }

  return (
    <>
      {phase === "loginRequired" && <AccessAccount onSuccess={handleLoginSuccess} loginHintEmail={tryLoadLastLoginEmail()} onNewLogin={storeLoginInfo} />}
      {phase === "sheetRequired" && <AccessSheet accessToken={access_token} onSuccess={handleSheetSuccess} onFailure={handleSheetFailure} onLogout={handleLogout} initializeSpreadSheetID={tryLoadLastSpreadsheetId()} />}
      {phase === "ready" && <LoginContent sheetOperator={new GoogleSheetOperator(access_token, spreadsheetId)} onLogout={handleLogout} />}
    </>
  );
}
