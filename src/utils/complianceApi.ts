// src/utils/complianceApi.ts

export interface UploadResponse {
  id: string;
  message: string;
  score: {
    score: number;
    max_score: number;
    percent: number;
    month: string;
    task_breakdown: Record<string, any>;
  };
}

export async function getDueTasks(hotelId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/due-tasks/${hotelId}`);
  if (!res.ok) throw new Error('Failed to fetch due tasks');
  return res.json();
}

export async function fetchComplianceScore(hotelId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/score/${hotelId}`);
  if (!res.ok) throw new Error('Failed to fetch compliance score');
  return res.json();
}

export async function acknowledgeTask(hotelId: string, taskId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/acknowledge-task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hotel_id: hotelId, task_id: taskId }),
  });
  if (!res.ok) throw new Error('Failed to acknowledge task');
}

export async function uploadComplianceFile(
  hotelId: string,
  taskId: string,
  file: File,
  reportDate: Date
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('hotel_id', hotelId);
  formData.append('task_id', taskId);
  formData.append('report_date', reportDate.toISOString().split('T')[0]);
  formData.append('file', file);

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/uploads/compliance`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`File upload failed: ${errText}`);
  }

  return res.json();
}

export async function deleteHistoryEntry(
  hotelId: string,
  taskId: string,
  timestamp: string
) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hotel_id: hotelId, task_id: taskId, timestamp }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to delete history entry: ${errText}`);
  }
}
