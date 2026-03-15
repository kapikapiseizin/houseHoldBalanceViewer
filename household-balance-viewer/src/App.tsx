import { useState } from "react";
import "./App.css";

import AccessAccount from "./AccessAccount";
import AccessSheet from "./AccessSheet";
import LoginContent from "./LoginContent";

export default function App() {
  const [phase, setPhase] = useState<"loginRequired" | "sheetRequired" | "ready">("loginRequired");

  const [accountCredential, setAccountCredential] = useState<any>({});
  const [sheetCredential, setSheetCredential] = useState<any>({});

  const handleLoginSuccess = (credential: any) => {
    setAccountCredential(credential);
    setPhase("sheetRequired");
  };

  const handleSheetSuccess = (credential: any) => {
    setSheetCredential(credential);
    setPhase("ready");
  };

  return (
    <>
      {phase === "loginRequired" && <AccessAccount onSuccess={handleLoginSuccess} />}
      {phase === "sheetRequired" && <AccessSheet accountCredential={accountCredential} onSuccess={handleSheetSuccess} />}
      {phase === "ready" && <LoginContent accountCredential={accountCredential} sheetCredential={sheetCredential} />}
    </>
  );
}
