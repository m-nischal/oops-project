// src/pages/_app.js
import '@/styles/globals.css' // Or whatever your CSS file is named
import React from "react";
// import LeftSidebar from "../components/LeftSidebar";

export default function App({ Component, pageProps }) {
  return (
    <>
      {/*<LeftSidebar />*/}
      <Component {...pageProps} />
    </>
  );
}
