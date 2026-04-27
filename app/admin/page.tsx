"use client";

import * as React from "react";
import dynamic from "next/dynamic";

const FirebaseAdminPanel = dynamic(() => import("./firebaseAdmin"), { ssr: false });

export default function AdminPage() {
  return (
    <FirebaseAdminPanel />
  );
}

