import { notFound } from "next/navigation";

// Menangkap path tak dikenal di bawah /[locale] agar memakai not-found lokal.
export default function CatchAll() {
  notFound();
}
