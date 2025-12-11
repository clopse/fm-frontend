// src/app/hotels/[hotelId]/compliance/page.tsx

import ComplianceClient from "./ComplianceClient";

type CompliancePageProps = {
  params: {
    hotelId: string;
  };
};

export default function CompliancePage({ params }: CompliancePageProps) {
  const { hotelId } = params;

  return <ComplianceClient hotelId={hotelId} />;
}
