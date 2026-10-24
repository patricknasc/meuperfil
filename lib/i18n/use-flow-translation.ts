"use client";
import { useParams } from "next/navigation";
import { flowTranslator } from "./flows";
export function useFlowTranslation() {
  const { lang } = useParams<{ lang: string }>();
  return flowTranslator(lang);
}
