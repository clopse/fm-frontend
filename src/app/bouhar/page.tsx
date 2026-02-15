<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bouhar Ltd – Professional Cleaning. Powerful Results.</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --green-deepest: #041f15;
    --green-dark: #0a2e1f;
    --green-mid: #0f3d2a;
    --green-accent: #1a5c3f;
    --gold: #c9a84c;
    --gold-light: #dfc06a;
    --gold-pale: #f0dea0;
    --cream: #faf6ee;
    --cream-dark: #f0ece2;
    --white: #ffffff;
    --text-light: #e8e4dc;
    --text-muted: #a8a298;
    --text-dark: #2a2a2a;
    --shadow-gold: rgba(201, 168, 76, 0.15);
    --shadow-dark: rgba(0, 0, 0, 0.4);
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }

  body {
    font-family: 'Montserrat', sans-serif;
    color: var(--text-light);
    background: var(--green-deepest);
    overflow-x: hidden;
  }

  /* ── Subtle texture overlay ── */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9a84c' fill-opacity='0.015'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 0;
  }

  /* ── HEADER / NAV ── */
  header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background: linear-gradient(180deg, rgba(4,31,21,0.97) 0%, rgba(10,46,31,0.95) 100%);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(201,168,76,0.15);
    transition: box-shadow 0.3s ease;
  }
  header.scrolled { box-shadow: 0 4px 30px rgba(0,0,0,0.3); }

  .nav-container {
    max-width: 1280px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 40px;
    height: 80px;
  }

  .logo-area {
    display: flex;
    align-items: center;
    gap: 14px;
    text-decoration: none;
  }

  /* SVG shield logo */
  .shield-logo {
    width: 52px;
    height: 58px;
    flex-shrink: 0;
  }

  .logo-text {
    display: flex;
    flex-direction: column;
  }
  .logo-text .brand-name {
    font-family: 'Montserrat', sans-serif;
    font-weight: 700;
    font-size: 22px;
    letter-spacing: 3px;
    color: var(--gold);
    line-height: 1;
  }
  .logo-text .brand-tagline {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 11px;
    color: var(--gold-light);
    letter-spacing: 1px;
    margin-top: 2px;
  }

  nav { display: flex; align-items: center; gap: 8px; }
  nav a {
    font-family: 'Montserrat', sans-serif;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-light);
    text-decoration: none;
    padding: 8px 18px;
    border-radius: 4px;
    transition: color 0.3s, background 0.3s;
    position: relative;
  }
  nav a:hover { color: var(--gold); }
  nav a.active { color: var(--gold); }
  nav a.active::after {
    content: '';
    position: absolute;
    bottom: 2px;
    left: 18px;
    right: 18px;
    height: 1px;
    background: var(--gold);
  }

  .btn-quote {
    font-family: 'Montserrat', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--green-deepest);
    background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%);
    border: none;
    padding: 12px 26px;
    border-radius: 4px;
    cursor: pointer;
    text-decoration: none;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 2px 12px var(--shadow-gold);
  }
  .btn-quote:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 20px var(--shadow-gold);
  }

  /* ── Mobile nav toggle ── */
  .mobile-toggle {
    display: none;
    flex-direction: column;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
  }
  .mobile-toggle span {
    width: 26px;
    height: 2px;
    background: var(--gold);
    transition: 0.3s;
  }

  /* ── HERO ── */
  .hero {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    padding: 120px 40px 80px;
    overflow: hidden;
    background: linear-gradient(165deg, var(--green-deepest) 0%, var(--green-dark) 40%, var(--green-mid) 100%);
  }

  /* Decorative glow */
  .hero::before {
    content: '';
    position: absolute;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%);
    top: 20%;
    left: 50%;
    transform: translate(-50%, -30%);
    pointer-events: none;
  }

  /* Animated sparkle line */
  .hero::after {
    content: '';
    position: absolute;
    bottom: 180px;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, var(--gold) 30%, var(--gold-light) 50%, var(--gold) 70%, transparent 100%);
    opacity: 0.3;
    animation: shimmer 4s ease-in-out infinite;
  }
  @keyframes shimmer {
    0%, 100% { opacity: 0.15; }
    50% { opacity: 0.4; }
  }

  .hero-inner {
    position: relative;
    z-index: 1;
    max-width: 1280px;
    margin: 0 auto;
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    align-items: center;
  }

  .hero-content { animation: fadeInUp 1s ease-out; }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .hero-content h1 {
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-size: clamp(36px, 5vw, 56px);
    line-height: 1.15;
    color: var(--white);
    margin-bottom: 24px;
  }
  .hero-content h1 span { color: var(--gold); }

  .hero-content p {
    font-size: 16px;
    font-weight: 300;
    line-height: 1.7;
    color: var(--text-muted);
    max-width: 460px;
    margin-bottom: 36px;
  }

  .hero-image {
    position: relative;
    animation: fadeInUp 1s ease-out 0.2s both;
  }

  .hero-image-frame {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(201,168,76,0.2);
    box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 40px var(--shadow-gold);
    aspect-ratio: 16/10;
    background: var(--green-dark);
  }

  /* IMAGE PLACEHOLDER — replace src with your actual hero image */
  .hero-image-frame img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .hero-image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 12px;
    background: linear-gradient(135deg, var(--green-dark) 0%, var(--green-mid) 100%);
    color: var(--gold);
    font-size: 14px;
    letter-spacing: 1px;
    text-transform: uppercase;
    min-height: 280px;
  }
  .hero-image-placeholder svg { opacity: 0.5; }

  /* Floating logo badge on hero image */
  .hero-badge {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 100px;
    height: 100px;
    background: linear-gradient(135deg, rgba(10,46,31,0.92) 0%, rgba(4,31,21,0.95) 100%);
    border: 1px solid rgba(201,168,76,0.3);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(8px);
    box-shadow: 0 8px 30px rgba(0,0,0,0.3);
  }
  .hero-badge .shield-logo { width: 36px; height: 40px; }
  .hero-badge span {
    font-size: 8px;
    font-weight: 600;
    letter-spacing: 2px;
    color: var(--gold);
    text-transform: uppercase;
    margin-top: 4px;
  }

  /* ── THREE PILLARS ── */
  .pillars {
    position: relative;
    z-index: 1;
    background: var(--green-dark);
    border-top: 1px solid rgba(201,168,76,0.12);
    border-bottom: 1px solid rgba(201,168,76,0.12);
    padding: 70px 40px;
  }

  .pillars-grid {
    max-width: 1100px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 40px;
  }

  .pillar {
    text-align: center;
    padding: 20px;
    animation: fadeInUp 0.8s ease-out both;
  }
  .pillar:nth-child(2) { animation-delay: 0.15s; }
  .pillar:nth-child(3) { animation-delay: 0.3s; }

  .pillar-icon {
    width: 44px;
    height: 44px;
    margin: 0 auto 18px;
    color: var(--gold);
  }

  .pillar h3 {
    font-family: 'Montserrat', sans-serif;
    font-weight: 600;
    font-size: 16px;
    letter-spacing: 1px;
    color: var(--white);
    margin-bottom: 12px;
  }

  .pillar p {
    font-size: 13px;
    font-weight: 300;
    line-height: 1.7;
    color: var(--text-muted);
    max-width: 280px;
    margin: 0 auto;
  }

  /* ── ELEVATED CLEANLINESS SECTION ── */
  .elevated {
    position: relative;
    z-index: 1;
    background: var(--cream);
    padding: 80px 40px 90px;
    text-align: center;
  }

  .elevated h2 {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-weight: 500;
    font-size: clamp(28px, 3.5vw, 42px);
    color: var(--text-dark);
    margin-bottom: 12px;
  }

  .elevated .subtitle {
    font-size: 14px;
    font-weight: 400;
    letter-spacing: 2px;
    color: #888;
    text-transform: uppercase;
    margin-bottom: 50px;
    position: relative;
    display: inline-block;
  }
  .elevated .subtitle::before,
  .elevated .subtitle::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 40px;
    height: 1px;
    background: #ccc;
  }
  .elevated .subtitle::before { right: calc(100% + 16px); }
  .elevated .subtitle::after { left: calc(100% + 16px); }

  .showcase-grid {
    max-width: 1100px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }

  .showcase-card {
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    background: var(--white);
    transition: transform 0.3s, box-shadow 0.3s;
  }
  .showcase-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 36px rgba(0,0,0,0.12);
  }

  .showcase-card .card-img {
    aspect-ratio: 4/3;
    background: linear-gradient(135deg, var(--cream-dark) 0%, #e8e4dc 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #aaa;
    font-size: 13px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .showcase-card .card-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* ── SERVICES ── */
  .services {
    position: relative;
    z-index: 1;
    background: linear-gradient(180deg, var(--green-deepest) 0%, var(--green-dark) 100%);
    padding: 100px 40px;
  }

  .section-header {
    text-align: center;
    margin-bottom: 60px;
  }
  .section-header .overline {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 12px;
  }
  .section-header h2 {
    font-family: 'Playfair Display', serif;
    font-weight: 600;
    font-size: clamp(28px, 3.5vw, 40px);
    color: var(--white);
    margin-bottom: 16px;
  }
  .section-header p {
    font-size: 15px;
    font-weight: 300;
    color: var(--text-muted);
    max-width: 560px;
    margin: 0 auto;
    line-height: 1.7;
  }

  .services-grid {
    max-width: 1100px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 28px;
  }

  .service-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(201,168,76,0.1);
    border-radius: 12px;
    padding: 40px 30px;
    text-align: center;
    transition: border-color 0.3s, background 0.3s, transform 0.3s;
  }
  .service-card:hover {
    border-color: rgba(201,168,76,0.3);
    background: rgba(201,168,76,0.04);
    transform: translateY(-3px);
  }

  .service-icon {
    width: 56px;
    height: 56px;
    margin: 0 auto 20px;
    background: linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.05) 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--gold);
  }

  .service-card h3 {
    font-family: 'Montserrat', sans-serif;
    font-weight: 600;
    font-size: 15px;
    color: var(--white);
    margin-bottom: 10px;
    letter-spacing: 0.5px;
  }
  .service-card p {
    font-size: 13px;
    font-weight: 300;
    color: var(--text-muted);
    line-height: 1.7;
  }

  /* ── ABOUT / WHY US ── */
  .about {
    position: relative;
    z-index: 1;
    background: var(--green-mid);
    padding: 100px 40px;
  }

  .about-inner {
    max-width: 1100px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 70px;
    align-items: center;
  }

  .about-image {
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(201,168,76,0.15);
    box-shadow: 0 16px 50px rgba(0,0,0,0.3);
  }
  .about-image .placeholder-img {
    aspect-ratio: 4/3;
    background: linear-gradient(135deg, var(--green-dark) 0%, var(--green-accent) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--gold);
    font-size: 13px;
    letter-spacing: 1px;
    text-transform: uppercase;
    flex-direction: column;
    gap: 8px;
  }
  .about-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .about-content .overline {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 16px;
  }
  .about-content h2 {
    font-family: 'Playfair Display', serif;
    font-weight: 600;
    font-size: clamp(26px, 3vw, 36px);
    color: var(--white);
    margin-bottom: 20px;
    line-height: 1.3;
  }
  .about-content p {
    font-size: 14px;
    font-weight: 300;
    color: var(--text-muted);
    line-height: 1.8;
    margin-bottom: 28px;
  }

  .stats-row {
    display: flex;
    gap: 40px;
  }
  .stat {
    text-align: center;
  }
  .stat .number {
    font-family: 'Playfair Display', serif;
    font-size: 36px;
    font-weight: 700;
    color: var(--gold);
    line-height: 1;
  }
  .stat .label {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-top: 6px;
  }

  /* ── TESTIMONIALS ── */
  .testimonials {
    position: relative;
    z-index: 1;
    background: var(--cream);
    padding: 90px 40px;
    text-align: center;
  }

  .testimonials .section-header h2 { color: var(--text-dark); }
  .testimonials .section-header .overline { color: var(--green-mid); }
  .testimonials .section-header p { color: #777; }

  .testimonial-cards {
    max-width: 900px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 28px;
  }

  .testimonial-card {
    background: var(--white);
    border-radius: 12px;
    padding: 36px 30px;
    text-align: left;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    border: 1px solid rgba(0,0,0,0.04);
    transition: transform 0.3s;
  }
  .testimonial-card:hover { transform: translateY(-3px); }

  .stars {
    color: var(--gold);
    font-size: 16px;
    letter-spacing: 2px;
    margin-bottom: 14px;
  }
  .testimonial-card blockquote {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 17px;
    line-height: 1.7;
    color: #555;
    margin-bottom: 18px;
  }
  .testimonial-card .author {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-dark);
  }
  .testimonial-card .author span {
    font-weight: 400;
    color: #999;
  }

  /* ── CONTACT / CTA ── */
  .cta {
    position: relative;
    z-index: 1;
    background: linear-gradient(135deg, var(--green-deepest) 0%, var(--green-dark) 50%, var(--green-mid) 100%);
    padding: 100px 40px;
    text-align: center;
    overflow: hidden;
  }
  .cta::before {
    content: '';
    position: absolute;
    width: 500px;
    height: 500px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .cta-inner { position: relative; z-index: 1; }

  .cta h2 {
    font-family: 'Playfair Display', serif;
    font-weight: 600;
    font-size: clamp(28px, 3.5vw, 42px);
    color: var(--white);
    margin-bottom: 16px;
  }
  .cta p {
    font-size: 15px;
    font-weight: 300;
    color: var(--text-muted);
    max-width: 500px;
    margin: 0 auto 36px;
    line-height: 1.7;
  }

  .cta-buttons { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }

  .btn-outline {
    font-family: 'Montserrat', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--gold);
    background: transparent;
    border: 1px solid var(--gold);
    padding: 14px 32px;
    border-radius: 4px;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.3s, color 0.3s;
  }
  .btn-outline:hover {
    background: var(--gold);
    color: var(--green-deepest);
  }

  /* ── FOOTER ── */
  footer {
    position: relative;
    z-index: 1;
    background: var(--green-deepest);
    border-top: 1px solid rgba(201,168,76,0.1);
    padding: 60px 40px 30px;
  }

  .footer-inner {
    max-width: 1100px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 40px;
    margin-bottom: 50px;
  }

  .footer-brand .logo-area { margin-bottom: 16px; }
  .footer-brand p {
    font-size: 13px;
    font-weight: 300;
    color: var(--text-muted);
    line-height: 1.7;
    max-width: 280px;
  }

  .footer-col h4 {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 18px;
  }
  .footer-col ul { list-style: none; }
  .footer-col li { margin-bottom: 10px; }
  .footer-col a {
    font-size: 13px;
    font-weight: 300;
    color: var(--text-muted);
    text-decoration: none;
    transition: color 0.3s;
  }
  .footer-col a:hover { color: var(--gold); }

  .footer-bottom {
    max-width: 1100px;
    margin: 0 auto;
    padding-top: 24px;
    border-top: 1px solid rgba(255,255,255,0.06);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }
  .footer-bottom p {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 300;
  }
  .footer-socials {
    display: flex;
    gap: 14px;
  }
  .footer-socials a {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid rgba(201,168,76,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--gold);
    text-decoration: none;
    transition: background 0.3s, border-color 0.3s;
    font-size: 14px;
  }
  .footer-socials a:hover {
    background: rgba(201,168,76,0.1);
    border-color: var(--gold);
  }

  /* ── RESPONSIVE ── */
  @media (max-width: 968px) {
    .hero-inner { grid-template-columns: 1fr; text-align: center; }
    .hero-content p { margin: 0 auto 36px; }
    .hero-image { max-width: 560px; margin: 0 auto; }
    .pillars-grid { grid-template-columns: 1fr; max-width: 400px; }
    .showcase-grid { grid-template-columns: 1fr; max-width: 400px; margin: 0 auto; }
    .services-grid { grid-template-columns: 1fr; max-width: 360px; margin: 0 auto; }
    .about-inner { grid-template-columns: 1fr; text-align: center; }
    .about-content .overline { text-align: center; }
    .stats-row { justify-content: center; }
    .testimonial-cards { grid-template-columns: 1fr; }
    .footer-inner { grid-template-columns: 1fr 1fr; }
  }

  @media (max-width: 640px) {
    .nav-container { padding: 0 20px; }
    nav { display: none; }
    .mobile-toggle { display: flex; }
    .hero { padding: 100px 20px 60px; }
    .pillars { padding: 50px 20px; }
    .elevated { padding: 60px 20px; }
    .services { padding: 70px 20px; }
    .about { padding: 70px 20px; }
    .testimonials { padding: 70px 20px; }
    .cta { padding: 70px 20px; }
    footer { padding: 40px 20px 20px; }
    .footer-inner { grid-template-columns: 1fr; }
    .footer-bottom { flex-direction: column; text-align: center; }
  }
</style>
</head>
<body>

<!-- ═══════ HEADER ═══════ -->
<header id="header">
  <div class="nav-container">
    <a href="#" class="logo-area">
      <!-- Shield Logo SVG -->
      <svg class="shield-logo" viewBox="0 0 52 58" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M26 2L4 12V28C4 42.4 13.6 51.6 26 56C38.4 51.6 48 42.4 48 28V12L26 2Z" fill="url(#shieldGrad)" stroke="#c9a84c" stroke-width="1.5"/>
        <defs><linearGradient id="shieldGrad" x1="4" y1="2" x2="48" y2="56"><stop stop-color="#0f3d2a"/><stop offset="1" stop-color="#0a2e1f"/></linearGradient></defs>
        <text x="26" y="38" text-anchor="middle" fill="#c9a84c" font-family="Playfair Display, serif" font-weight="700" font-size="26">B</text>
      </svg>
      <div class="logo-text">
        <span class="brand-name">BOUHAR LTD</span>
        <span class="brand-tagline">Professional Cleaners</span>
      </div>
    </a>

    <nav>
      <a href="#" class="active">Home</a>
      <a href="#about-section">About</a>
      <a href="#services-section">Services</a>
      <a href="#contact-section">Contact</a>
      <a href="#contact-section" class="btn-quote">Get a Quote</a>
    </nav>

    <button class="mobile-toggle" onclick="document.querySelector('nav').classList.toggle('open')">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>

<!-- ═══════ HERO ═══════ -->
<section class="hero">
  <div class="hero-inner">
    <div class="hero-content">
      <h1>Professional Cleaning.<br><span>Powerful Results.</span></h1>
      <p>Bouhar Ltd creates immaculate spaces for successful businesses and luxury homes.</p>
      <a href="#contact-section" class="btn-quote">Get a Quote</a>
    </div>
    <div class="hero-image">
      <div class="hero-image-frame">
        <!-- ✏️ REPLACE: Add your hero image here -->
        <!-- <img src="your-hero-image.jpg" alt="Luxury clean interior"> -->
        <div class="hero-image-placeholder">
          <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
          <span>Hero Image</span>
          <span style="font-size:11px; opacity:0.6;">Replace with luxury interior photo</span>
        </div>
        <div class="hero-badge">
          <svg class="shield-logo" viewBox="0 0 52 58" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M26 2L4 12V28C4 42.4 13.6 51.6 26 56C38.4 51.6 48 42.4 48 28V12L26 2Z" fill="url(#shieldGrad2)" stroke="#c9a84c" stroke-width="1.5"/>
            <defs><linearGradient id="shieldGrad2" x1="4" y1="2" x2="48" y2="56"><stop stop-color="#0f3d2a"/><stop offset="1" stop-color="#0a2e1f"/></linearGradient></defs>
            <text x="26" y="38" text-anchor="middle" fill="#c9a84c" font-family="Playfair Display, serif" font-weight="700" font-size="26">B</text>
          </svg>
          <span>Bouhar Ltd</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══════ THREE PILLARS ═══════ -->
<section class="pillars">
  <div class="pillars-grid">
    <div class="pillar">
      <svg class="pillar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/>
      </svg>
      <h3>Reliability &amp; Trust</h3>
      <p>Registered professionals committed to the highest standards. Your space, our reputation.</p>
    </div>
    <div class="pillar">
      <svg class="pillar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/>
        <path d="M12 6l1.5 3.06 3.38.5-2.44 2.38.58 3.36L12 13.27l-3.02 2.03.58-3.36-2.44-2.38 3.38-.5L12 6z" fill="currentColor" opacity="0.3"/>
      </svg>
      <h3>Top-Level Quality</h3>
      <p>Dedicated teams using premium products and methods, ensuring an impeccable finish every time.</p>
    </div>
    <div class="pillar">
      <svg class="pillar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
      <h3>Prosperity &amp; Success</h3>
      <p>Reliability, professionalism, and cleanliness that elevates businesses and homes alike.</p>
    </div>
  </div>
</section>

<!-- ═══════ ELEVATED CLEANLINESS ═══════ -->
<section class="elevated">
  <h2>Elevated Cleanliness for Successful Living</h2>
  <p class="subtitle">Trusted by Prestige Businesses &amp; High-End Homes</p>
  <div class="showcase-grid">
    <div class="showcase-card">
      <!-- ✏️ REPLACE: Showcase image 1 -->
      <!-- <div class="card-img"><img src="showcase1.jpg" alt="Luxury living room"></div> -->
      <div class="card-img">Showcase Image 1</div>
    </div>
    <div class="showcase-card">
      <!-- ✏️ REPLACE: Showcase image 2 -->
      <div class="card-img">Showcase Image 2</div>
    </div>
    <div class="showcase-card">
      <!-- ✏️ REPLACE: Showcase image 3 -->
      <div class="card-img">Showcase Image 3</div>
    </div>
  </div>
</section>

<!-- ═══════ SERVICES ═══════ -->
<section class="services" id="services-section">
  <div class="section-header">
    <p class="overline">What We Do</p>
    <h2>Our Services</h2>
    <p>Premium cleaning solutions tailored to your exact requirements.</p>
  </div>
  <div class="services-grid">
    <div class="service-card">
      <div class="service-icon">
        <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </div>
      <h3>Residential Cleaning</h3>
      <p>Deep cleaning, regular maintenance, and move-in/move-out services for luxury homes and apartments.</p>
    </div>
    <div class="service-card">
      <div class="service-icon">
        <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
      </div>
      <h3>Commercial Cleaning</h3>
      <p>Offices, retail spaces, and corporate environments kept to the highest professional standards.</p>
    </div>
    <div class="service-card">
      <div class="service-icon">
        <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
      </div>
      <h3>End of Tenancy</h3>
      <p>Thorough deep cleans that guarantee full deposit returns and property readiness.</p>
    </div>
    <div class="service-card">
      <div class="service-icon">
        <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
      </div>
      <h3>Specialist Services</h3>
      <p>Carpet cleaning, window cleaning, post-construction, and bespoke cleaning packages.</p>
    </div>
    <div class="service-card">
      <div class="service-icon">
        <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      </div>
      <h3>Hygiene &amp; Sanitisation</h3>
      <p>Medical-grade sanitisation for healthcare, hospitality, and sensitive environments.</p>
    </div>
    <div class="service-card">
      <div class="service-icon">
        <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
      <h3>Regular Contracts</h3>
      <p>Scheduled weekly, bi-weekly, or monthly cleaning programmes with dedicated teams.</p>
    </div>
  </div>
</section>

<!-- ═══════ ABOUT ═══════ -->
<section class="about" id="about-section">
  <div class="about-inner">
    <div class="about-image">
      <!-- ✏️ REPLACE: Team/van image -->
      <!-- <img src="team-photo.jpg" alt="Bouhar Ltd team"> -->
      <div class="placeholder-img">
        <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
        <span>Team / Van Image</span>
      </div>
    </div>
    <div class="about-content">
      <p class="overline">About Bouhar Ltd</p>
      <h2>Dedicated to Excellence in Every Detail</h2>
      <p>Bouhar Ltd is a professional cleaning company serving prestige businesses and high-end homes. Our fully vetted, trained teams deliver consistent, exceptional results using premium products and proven methods.</p>
      <div class="stats-row">
        <div class="stat">
          <div class="number">500+</div>
          <div class="label">Happy Clients</div>
        </div>
        <div class="stat">
          <div class="number">10+</div>
          <div class="label">Years Experience</div>
        </div>
        <div class="stat">
          <div class="number">100%</div>
          <div class="label">Satisfaction</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══════ TESTIMONIALS ═══════ -->
<section class="testimonials">
  <div class="section-header">
    <p class="overline">Client Reviews</p>
    <h2>What Our Clients Say</h2>
    <p>Trusted by Dublin's finest businesses and residences.</p>
  </div>
  <div class="testimonial-cards">
    <div class="testimonial-card">
      <div class="stars">★★★★★</div>
      <blockquote>"Bouhar Ltd transformed our office space. Their attention to detail is remarkable, and the team is always professional and punctual."</blockquote>
      <p class="author">Sarah M. <span>– Business Owner</span></p>
    </div>
    <div class="testimonial-card">
      <div class="stars">★★★★★</div>
      <blockquote>"We've used Bouhar for our home for over a year. The consistency and quality is outstanding. Highly recommended."</blockquote>
      <p class="author">James K. <span>– Residential Client</span></p>
    </div>
  </div>
</section>

<!-- ═══════ CTA ═══════ -->
<section class="cta" id="contact-section">
  <div class="cta-inner">
    <h2>Ready for a Cleaner Space?</h2>
    <p>Get in touch today for a free, no-obligation quote. Experience the Bouhar Ltd difference.</p>
    <div class="cta-buttons">
      <a href="mailto:info@bouharltd.ie" class="btn-quote">Get a Quote</a>
      <a href="tel:+353000000000" class="btn-outline">Call Us</a>
    </div>
  </div>
</section>

<!-- ═══════ FOOTER ═══════ -->
<footer>
  <div class="footer-inner">
    <div class="footer-brand">
      <div class="logo-area">
        <svg class="shield-logo" viewBox="0 0 52 58" fill="none" style="width:40px;height:44px;">
          <path d="M26 2L4 12V28C4 42.4 13.6 51.6 26 56C38.4 51.6 48 42.4 48 28V12L26 2Z" fill="url(#shieldGrad3)" stroke="#c9a84c" stroke-width="1.5"/>
          <defs><linearGradient id="shieldGrad3" x1="4" y1="2" x2="48" y2="56"><stop stop-color="#0f3d2a"/><stop offset="1" stop-color="#0a2e1f"/></linearGradient></defs>
          <text x="26" y="38" text-anchor="middle" fill="#c9a84c" font-family="Playfair Display, serif" font-weight="700" font-size="26">B</text>
        </svg>
        <div class="logo-text">
          <span class="brand-name" style="font-size:18px;">BOUHAR LTD</span>
          <span class="brand-tagline">Professional Cleaning. Powerful Results.</span>
        </div>
      </div>
      <p>Creating immaculate spaces for successful businesses and luxury homes across Dublin and beyond.</p>
    </div>
    <div class="footer-col">
      <h4>Services</h4>
      <ul>
        <li><a href="#">Residential Cleaning</a></li>
        <li><a href="#">Commercial Cleaning</a></li>
        <li><a href="#">End of Tenancy</a></li>
        <li><a href="#">Specialist Services</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Company</h4>
      <ul>
        <li><a href="#">About Us</a></li>
        <li><a href="#">Our Team</a></li>
        <li><a href="#">Careers</a></li>
        <li><a href="#">Blog</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Contact</h4>
      <ul>
        <li><a href="mailto:info@bouharltd.ie">info@bouharltd.ie</a></li>
        <li><a href="tel:+353000000000">+353 00 000 0000</a></li>
        <li><a href="#">Dublin, Ireland</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <p>&copy; 2026 Bouhar Ltd. All rights reserved.</p>
    <div class="footer-socials">
      <a href="#" aria-label="Facebook">f</a>
      <a href="#" aria-label="Instagram">ig</a>
      <a href="#" aria-label="LinkedIn">in</a>
    </div>
  </div>
</footer>

<script>
  // Header scroll effect
  window.addEventListener('scroll', () => {
    document.getElementById('header').classList.toggle('scrolled', window.scrollY > 50);
  });

  // Simple scroll-reveal
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; }});
  }, { threshold: 0.1 });

  document.querySelectorAll('.service-card, .showcase-card, .testimonial-card, .pillar').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
</script>

</body>
</html>
