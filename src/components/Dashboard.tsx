'use client';

import styles from '../styles/Dashboard.module.css'; // Correct path to the CSS module

export default function Home() {
  return (
    <div>
      <main className={styles.container}>
        <h1 className={styles.heading}>Welcome to HotelOps</h1>
        <p className={styles.paragraph}>
          This is the homepage. Use the sidebar to navigate between sections.
        </p>
      </main>
    </div>
  );
}
