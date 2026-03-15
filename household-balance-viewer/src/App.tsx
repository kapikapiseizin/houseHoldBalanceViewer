import { useState } from "react";
import "./App.css";

import AccessAccount from "./AccessAccount";
import AccessSheet from "./AccessSheet";
import LoginContent from "./LoginContent";

export default function App() {
  const [phase, setPhase] = useState<"checkingLogin" | "loginRequired" | "checkingSheet" | "sheetRequired" | "ready">("checkingLogin");

  const [accountCredential, setAccountCredential] = useState<{}>({});
  const [sheetCredential, setSheetCredential] = useState<{}>({});

  // Simulate initial phase transition
  if (phase === "checkingLogin") {
    setTimeout(() => setPhase("loginRequired"), 0);
  }

  const handleLoginSuccess = (credential: {}) => {
    setAccountCredential(credential);
    setPhase("sheetRequired");
  };

  const handleSheetSuccess = (credential: {}) => {
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
