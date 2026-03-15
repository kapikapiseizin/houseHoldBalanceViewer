import { useState } from "react";
import "./App.css";

import AccessAccount, { type LoginInfo } from "./AccessAccount";
import AccessSheet from "./AccessSheet";
import LoginContent from "./LoginContent";

export default function App() {
  const LAST_LOGIN_EMAIL_KEY = "lastLoginEmail";

  const [phase, setPhase] = useState<"loginRequired" | "sheetRequired" | "ready">("loginRequired");

  const [accountCredential, setAccountCredential] = useState<any>({});
  const [sheetCredential, setSheetCredential] = useState<any>({});
  const [lastLoginEmail, setLastLoginEmail] = useState<string | undefined>(undefined);

  const handleLoginSuccess = (credential: any) => {
    console.log("handleLoginSuccess");
    setAccountCredential(credential);
    setPhase("sheetRequired");
  };

  const handleSheetSuccess = (credential: any) => {
    console.log("handleSheetSuccess");
    setSheetCredential(credential);
    setPhase("ready");
  };

  const tryLoadLastLoginEmail = () => {
    const email = localStorage.getItem(LAST_LOGIN_EMAIL_KEY);
    if (email) {
      setLastLoginEmail(email);
      return email;
    }

    return undefined;
  };

  const storeLastLoginEmail = (email: string | undefined) => {
    setLastLoginEmail(email);
    if (email) {
      localStorage.setItem(LAST_LOGIN_EMAIL_KEY, email);
    }
  };

  const storeLoginInfo = (loginInfo: LoginInfo) => {
    if (loginInfo.email) {
      storeLastLoginEmail(loginInfo.email);
    }
  };

  return (
    <>
      {phase === "loginRequired" && <AccessAccount onSuccess={handleLoginSuccess} loginHintEmail={tryLoadLastLoginEmail()} onNewLogin={storeLoginInfo} />}
      {phase === "sheetRequired" && <AccessSheet accountCredential={accountCredential} onSuccess={handleSheetSuccess} />}
      {phase === "ready" && <LoginContent accountCredential={accountCredential} sheetCredential={sheetCredential} />}
    </>
  );
}
