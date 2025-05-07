export async function getDueTasks(hotelId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/due-tasks/${hotelId}`);
  if (!res.ok) throw new Error('Failed to fetch due tasks');
  return res.json();
}

export async function acknowledgeTask(hotelId: string, task_id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/acknowledge-task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ hotel_id: hotelId, task_id }),
  });

  if (!res.ok) throw new Error('Failed to acknowledge task');
}

export async function getComplianceScore(hotelId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/score/${hotelId}`);
  if (!res.ok) throw new Error('Failed to fetch compliance score');
  return res.json();
}
