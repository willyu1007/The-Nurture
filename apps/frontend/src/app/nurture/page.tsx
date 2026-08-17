import { redirect } from "next/navigation";

// `/nurture` is this surface's declared route namespace, so it resolves instead
// of 404-ing. Nothing links here — the sidebar's home points at the root — but a
// namespace root that dead-ends is a papercut for anyone who trims the URL.
export default function NurtureRoot() {
  redirect("/nurture/overview");
}
