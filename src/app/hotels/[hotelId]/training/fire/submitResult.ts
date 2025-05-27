export default async function submitResult(hotelId: string, result: any) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/training/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotel_id: hotelId, ...result })
    });

    if (!res.ok) {
      console.error('Failed to submit result:', await res.text());
    }
  } catch (err) {
    console.error('Submit error:', err);
  }
}
