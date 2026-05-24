"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function DeleteRowSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      className="h-8 rounded-lg"
      disabled={pending}
      aria-disabled={pending}
    >
      {pending ? "Deleting..." : "Delete"}
    </Button>
  );
}
