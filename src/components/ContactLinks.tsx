"use client";
import Image from "next/image";

export default function ContactLinks({
  imgClassName = "h-5 w-auto",
  light = false,
}: {
  imgClassName?: string;
  light?: boolean;
}) {
  const suffix = light ? "-light" : "";
  // Adresse et numéro assemblés au clic → absents du HTML source (anti-scraping).
  const openMail = () => {
    window.location.href = "mailto:" + ["contact", "rmotion.fr"].join("@");
  };
  const openTel = () => {
    window.location.href = "tel:" + ["+33", "7", "81", "49", "26", "85"].join("");
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={openMail}
        aria-label="Envoyer un email à Rmotion"
        className="block hover:opacity-70 transition-opacity cursor-pointer"
      >
        <Image src={`/contact-email${suffix}.png`} alt="Adresse email Rmotion" width={439} height={49} className={imgClassName} />
      </button>
      <button
        type="button"
        onClick={openTel}
        aria-label="Appeler Rmotion"
        className="block hover:opacity-70 transition-opacity cursor-pointer"
      >
        <Image src={`/contact-phone${suffix}.png`} alt="Numéro de téléphone Rmotion" width={417} height={39} className={imgClassName} />
      </button>
    </div>
  );
}
