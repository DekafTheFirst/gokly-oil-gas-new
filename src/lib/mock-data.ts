import pipeline from "@/assets/course-pipeline.jpg";
import hazmat from "@/assets/course-hazmat.jpg";
import subsea from "@/assets/course-subsea.jpg";
import rig from "@/assets/course-rig.jpg";

export const COURSES = [
  { id: 1, title: "Well Control Management & Emergency Protocols", category: "Technical", tier: "T1 Certified", rating: 4.8, hours: 32, image: pipeline, blurb: "Master the critical systems and manual overrides required for high-pressure well control scenarios." },
  { id: 2, title: "Hazardous Materials Handling & Disposal", category: "HSE Standards", tier: "Compliance Required", rating: 4.9, hours: 12, image: hazmat, blurb: "Protocols for the safe transport and chemical neutralization of regulated industrial substances." },
  { id: 3, title: "Subsea Infrastructure Maintenance", category: "Offshore Ops", tier: "Specialist Tier", rating: 5.0, hours: 45, image: subsea, blurb: "Advanced robotics and manual inspection techniques for deepwater pipeline assets." },
  { id: 4, title: "Advanced Deep-Sea Pressure Protocols", category: "Technical", tier: "Standard Tier", rating: 4.7, hours: 18, image: rig, blurb: "Pressure modeling and drilling fluid dynamics for sub-2000m operations." },
  { id: 5, title: "Incident Commander Training", category: "Leadership", tier: "Managerial", rating: 4.5, hours: 8, image: hazmat, blurb: "Decision-making under pressure and team coordination for site-wide HSE incidents." },
  { id: 6, title: "Emission Reduction & Carbon Capture", category: "Environmental", tier: "ESG Tier", rating: 4.9, hours: 24, image: pipeline, blurb: "Implementing green technologies within existing midstream infrastructure." },
];

export const TRAINEES = [
  { initials: "JM", name: "James Miller", id: "OGP-88392", course: "H2S Safety & Emergency Response", score: 98, date: "Oct 24, 2023", status: "Issued" as const },
  { initials: "SA", name: "Sarah Ahmed", id: "OGP-89104", course: "Advanced Offshore Firefighting", score: 92, date: "Oct 26, 2023", status: "Pending" as const },
  { initials: "RK", name: "Robert King", id: "OGP-87212", course: "Subsea Well Control Level 4", score: 87, date: "Oct 25, 2023", status: "Issued" as const },
  { initials: "LC", name: "Laila Chen", id: "OGP-90112", course: "Industrial Hygiene & Gas Detection", score: 95, date: "Oct 27, 2023", status: "Pending" as const },
];

export const ACTIVITY = [
  { initials: "JS", name: "Jacob Simmons", role: "Senior Driller — Rig 04", module: "Offshore Safety II", time: "14:22 PM (EST)", certId: "CRT-OG-882190", status: "Issued" as const },
  { initials: "MR", name: "Maria Rodriguez", role: "HSE Officer — Terminal 4", module: "Spill Containment", time: "12:10 PM (EST)", certId: "CRT-OG-991204", status: "In Progress" as const },
  { initials: "BT", name: "Bill Thompson", role: "Logistics Manager", module: "Cold Zone Ops", time: "09:45 AM (EST)", certId: "CRT-OG-112344", status: "Issued" as const },
];

export const TRENDS = [
  { m: "JAN", v: 42 }, { m: "FEB", v: 58 }, { m: "MAR", v: 38 }, { m: "APR", v: 70 },
  { m: "MAY", v: 76 }, { m: "JUN", v: 96 }, { m: "JUL", v: 60 }, { m: "AUG", v: 64 }, { m: "SEP", v: 78 },
];
