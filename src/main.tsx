
  import { createRoot } from "react-dom/client";
  import App from "./App.jsx";
  import "./styles/index.css";
  import { GoogleOAuthProvider } from '@react-oauth/google';

  createRoot(document.getElementById("root")!).render(
    <GoogleOAuthProvider clientId="835159735649-9u4pk3u3qvfv51bpq7d5v30r10cji318.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  );
