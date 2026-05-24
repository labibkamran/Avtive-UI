"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { useDemoSession } from "@/app/providers/demoSessionProvider";
import { LoginFormCard } from "@/components/login/loginFormCard";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { signIn } = useDemoSession();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      return;
    }

    signIn(email);
    setPassword("");
    router.push("/transfer");
  };

  return (
    <LoginFormCard
      email={email}
      password={password}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
    />
  );
}
