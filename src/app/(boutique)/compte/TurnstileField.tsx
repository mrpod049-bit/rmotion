"use client";
import { useState } from "react";
import Turnstile from "@/components/Turnstile";

// Captcha Turnstile pour les formulaires « server action » : le jeton est
// transmis dans un champ caché (vérifié côté serveur par verifyTurnstile).
export default function TurnstileField() {
  const [token, setToken] = useState("");
  return (
    <>
      <Turnstile onToken={(t) => setToken(t ?? "")} locale="fr" />
      <input type="hidden" name="cf_token" value={token} />
    </>
  );
}
