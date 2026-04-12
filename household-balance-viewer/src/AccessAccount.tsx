import { useEffect, useRef } from "react";

declare const google: any;

export type LoginInfo = {
  email?: string;
};

type AccessAccountProps = {
  onSuccess: (accessToken: string) => void;
  loginHintEmail?: string;
  onNewLogin: (loginInfo: LoginInfo) => void;
};

export default function AccessAccount({
  onSuccess,
  loginHintEmail,
  onNewLogin,
}: AccessAccountProps) {
  const tokenClientRef = useRef<any>(null);
  const initialized = useRef(false);

  const fetchEmailByToken = async (accessToken: string) => {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    const data = await response.json();
    return data.email;
  };

  const loadGoogleScript = async (): Promise<void> => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  };

  const initializeTokenClient = async () => {
    await loadGoogleScript();

    tokenClientRef.current = google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope:
        "openid email profile https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.metadata.readonly",
      callback: async (response: any) => {
        if (response.error !== undefined) {
          window.confirm("Google login failed: " + response.error);
          throw response;
        }

        console.log("Google login success");

        const accessToken = response.access_token;
        if (typeof accessToken !== "string") {
          const accessTokenTypeError = "Access token is not a string";
          window.confirm(accessTokenTypeError);
          throw new Error(accessTokenTypeError);
        }

        // fetch email
        const email = await fetchEmailByToken(accessToken);
        console.log("Email: ", email);

        if (loginHintEmail) {
          if (loginHintEmail !== email) {
            // login different account
            onNewLogin({ email });
          }
        } else {
          // no hint login
          onNewLogin({ email });
        }

        // fire success callback
        onSuccess(accessToken);
      },
    });

    if (loginHintEmail) {
      // silent login with hint
      tokenClientRef.current?.requestAccessToken({
        prompt: "",
        login_hint: loginHintEmail,
      });
    } else {
      // silent login
      tokenClientRef.current?.requestAccessToken({ prompt: "" });
    }
  };

  useEffect(() => {
    if (initialized.current) {
      return;
    }
    initialized.current = true;

    initializeTokenClient();
  }, [onSuccess, onNewLogin, loginHintEmail]);

  return (
    <div
      style={{
        backgroundColor: "#F8FAFC",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "16px",
        boxSizing: "border-box",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          padding: "24px",
          border: "1px solid #E5E7EB",
          width: "100%",
          maxWidth: "400px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "24px",
          boxShadow:
            "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#111827",
              margin: "0 0 8px 0",
            }}
          >
            Household Balance
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "#6B7280",
              margin: 0,
            }}
          >
            Welcome back. Please login with Google.
          </p>
        </div>
        <button
          onClick={() =>
            tokenClientRef.current?.requestAccessToken({ prompt: "" })
          }
          style={{
            backgroundColor: "#5FBDFF",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "8px",
            padding: "12px 16px",
            fontSize: "16px",
            fontWeight: 700,
            cursor: "pointer",
            width: "100%",
            height: "44px",
          }}
        >
          Login with Google
        </button>
      </div>
    </div>
  );
}
