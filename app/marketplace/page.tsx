import { redirect } from "next/navigation";

/** Marketplace route removed; old links go home. */
export default function MarketplacePage() {
  redirect("/");
}
