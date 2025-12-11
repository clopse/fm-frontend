// @ts-nocheck

import ComplianceClient from "./ComplianceClient";

export default function CompliancePage({ params }: any) {
  const { hotelId } = params;

  return <ComplianceClient hotelId={hotelId} />;
}
