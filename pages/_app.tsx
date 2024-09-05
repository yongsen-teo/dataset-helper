// pages/_app.tsx
import "../styles/globals.css";
import type { AppProps } from "next/app";

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;

// NEW CODE for supabase
// import { AppProps } from "next/app";
// import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
// import { SessionContextProvider } from "@supabase/auth-helpers-react";
// import { useState } from "react";
//
// function MyApp({ Component, pageProps }: AppProps) {
//   const [supabaseClient] = useState(() => createBrowserSupabaseClient());
//
//   return (
//     <SessionContextProvider
//       supabaseClient={supabaseClient}
//       initialSession={pageProps.initialSession}
//     >
//       <Component {...pageProps} />
//     </SessionContextProvider>
//   );
// }
//
// export default MyApp;
