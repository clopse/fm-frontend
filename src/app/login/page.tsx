'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/LoginPage.module.css';
import Image from 'next/image';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (username === 'admin' && password === '1234') {
      localStorage.setItem('auth', 'true');
      router.push('/hotels'); // 🔁 redirect after login
    } else {
      alert('Incorrect username or password');
    }
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
