import { useEffect, useRef } from "react";

declare const google: any;

type AccountCredential = {
  accessToken: string;
};

type AccessAccountProps = {
  onSuccess: (credential: AccountCredential) => void;
};

export default function AccessAccount({ onSuccess }: AccessAccountProps) {
  const tokenClientRef = useRef<any>(null);

  useEffect(() => {
    tokenClientRef.current = google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      callback: (response: any) => {
        if (response.error !== undefined) {
          throw response;
        }
        console.log("Google login success");
        onSuccess({
          accessToken: response.access_token,
        });
      },
    });
  }, [onSuccess]);

  return (
    <div>
      <button onClick={() => tokenClientRef.current?.requestAccessToken()}>
        Login with Google
      </button>
    </div>
  );
}
