.card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  padding: 16px;
  margin: 12px;
  width: 280px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  transition: box-shadow 0.2s ease-in-out;
}

.card:hover {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
}

.cardHeader {
  font-weight: 600;
  font-size: 1rem;
  color: #1a1a1a;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.mIcon {
  background-color: #0053a6;
  color: #fff;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
}

.cardFooter {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.scoreBadge {
  font-weight: bold;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  background-color: #eee;
  color: #333;
}

.green {
  background-color: #28a745;
  color: white;
}

.yellow {
  background-color: #ffc107;
  color: #212529;
}

.red {
  background-color: #dc3545;
  color: white;
}
