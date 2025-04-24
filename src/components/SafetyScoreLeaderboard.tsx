export function SafetyScoreLeaderboard({ data }: { data: { hotel: string; score: number }[] }) {
  return (
    <div>
      <ul>
        {data.map((item, index) => (
          <li key={index}>
            <strong>{item.hotel}</strong>: {item.score}%
          </li>
        ))}
      </ul>
    </div>
  );
}
