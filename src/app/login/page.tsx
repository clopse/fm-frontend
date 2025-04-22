'use client';

import { useState } from 'react';
import styles from '@/styles/LoginPage.module.css';
import Image from 'next/image';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Logging in with', username, password);
    // TODO: Redirect to dashboard if valid
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.loginBox}>
      <Image src="/jmk-logo2.png" alt="JMK Logo" width={300} height={100} className={styles.logo} />
      <h2 className={styles.subtitle}>Facilities</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}
