import { Suspense } from "react";

import { ContactInquiriesView } from "@/components/dashboard/contact-inquiries-view";

export const metadata = {
  title: "Hire A Drone | Contact inquiries",
  description: "Contact form submissions for the admin command center.",
};

export default function ContactInquiriesPage() {
  return (
    <Suspense>
      <ContactInquiriesView />
    </Suspense>
  );
}
