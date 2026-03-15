import { useState } from "react";
import "./App.css";

import AccessAccount from "./AccessAccount";
import AccessSheet from "./AccessSheet";
import LoginContent from "./LoginContent";

export default function App() {
  const [phase, setPhase] = useState<"checkingLogin" | "loginRequired" | "checkingSheet" | "sheetRequired" | "ready">("checkingLogin");

  const [accountCredential, setAccountCredential] = useState<any>({});
  const [sheetCredential, setSheetCredential] = useState<any>({});

  // Simulate initial phase transition
  if (phase === "checkingLogin") {
    setTimeout(() => setPhase("loginRequired"), 0);
  }

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
