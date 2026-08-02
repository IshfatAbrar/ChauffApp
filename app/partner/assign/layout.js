import FleetShell from "../../../components/Fleet/FleetShell";

export const dynamic = "force-dynamic";

export default function FleetAssignLayout({ children }) {
  return <FleetShell>{children}</FleetShell>;
}
