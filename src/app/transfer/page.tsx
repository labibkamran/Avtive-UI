"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useDemoSession } from "@/app/providers/demoSessionProvider";
import { TransferWorkspace } from "@/components/transfer/transferWorkspace";

export default function TransferPage() {
  const router = useRouter();
  const { email, signOut } = useDemoSession();
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!email) {
      router.replace("/login");
    }
  }, [email, router]);

  if (!email) {
    return null;
  }

  return (
    <TransferWorkspace
      email={email}
      message={message}
      onLogout={() => {
        signOut();
        router.push("/login");
      }}
      onTransfer={() => setMessage("Data transferred successfully.")}
    />
  );
}
