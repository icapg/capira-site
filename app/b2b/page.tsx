import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = {
  title: "B2B",
  robots: {
    index: false,
    follow: true,
  },
};

export default function B2BRedirectPage() {
  permanentRedirect("/comercios");
}
