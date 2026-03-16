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

export default function AccessAccount({ onSuccess, loginHintEmail, onNewLogin }: AccessAccountProps) {
  const tokenClientRef = useRef<any>(null);
  const initialized = useRef(false);
  const fetchEmailByToken = async (accessToken: string) => {
    const response = await fetch("https://www.googleapis.com/oauth2/v1/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await response.json();
    return data.email;
  };

  useEffect(() => {
    if (initialized.current) {
      return;
    }
    initialized.current = true;

    // display origin
    console.log(location.origin);

    tokenClientRef.current = google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: "openid email profile https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive",
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
      tokenClientRef.current?.requestAccessToken({ prompt: "", login_hint: loginHintEmail });
    } else {
      // silent login
      tokenClientRef.current?.requestAccessToken({ prompt: "" });
    }
  }, [onSuccess, onNewLogin, loginHintEmail]);

  return (
    <div>
      <button onClick={() => tokenClientRef.current?.requestAccessToken({ prompt: "" })}>
        Login with Google
      </button>
    </div>
  );
}
