'use client';

import { useRouter } from 'next/navigation';
import { Plus, BedDouble } from 'lucide-react';
import ProjectsSidebar from '@/components/projects/ProjectsSidebar';
import styles from '@/styles/projects.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id:              string;
  name:            string;
  brand:           string;
  country:         string;
  rooms:           number;
  sustainability:  string[];
  status:          string;
}

// ─── Hardcoded data (replace with GET /api/brain/projects when ready) ─────────

const PROJECTS: Project[] = [
  {
    id:             'galway',
    name:           'Aloft Bohermore',
    brand:          'Marriott Aloft',
    country:        'Ireland',
    rooms:          163,
    sustainability: ['LEED Gold', 'BREEAM Excellent'],
    status:         'Pre-Opening',
  },
];

// ─── Badge configs ────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  'Pre-Opening': { bg: 'rgba(245,158,11,0.18)',  text: '#fbbf24' },
  'Open':        { bg: 'rgba(34,197,94,0.18)',   text: '#4ade80' },
  'Planning':    { bg: 'rgba(156,163,175,0.18)', text: '#9ca3af' },
  'On Hold':     { bg: 'rgba(239,68,68,0.18)',   text: '#f87171' },
};

const SUSTAINABILITY_BADGE: Record<string, { bg: string; text: string }> = {
  'LEED Gold':        { bg: 'rgba(34,197,94,0.15)',   text: '#4ade80' },
  'LEED Platinum':    { bg: 'rgba(34,197,94,0.22)',   text: '#86efac' },
  'LEED Silver':      { bg: 'rgba(34,197,94,0.10)',   text: '#6ee7b7' },
  'BREEAM Excellent': { bg: 'rgba(56,189,248,0.15)',  text: '#7dd3fc' },
  'BREEAM Outstanding':{ bg: 'rgba(56,189,248,0.22)', text: '#bae6fd' },
  'BREEAM Very Good': { bg: 'rgba(56,189,248,0.10)',  text: '#93c5fd' },
};

function defaultBadge(label: string): { bg: string; text: string } {
  return SUSTAINABILITY_BADGE[label] ?? { bg: 'rgba(156,163,175,0.15)', text: '#9ca3af' };
}

// ─── Project card ─────────────────────────────────────────────────────────────

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const statusStyle = STATUS_BADGE[project.status] ?? { bg: 'rgba(156,163,175,0.18)', text: '#9ca3af' };

  return (
    <div
      onClick={onClick}
      className={styles.projectCard}
      style={{
        backgroundColor: '#252525',
        borderRadius: 16,
        padding: '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* Status badge — top right */}
      <span
        style={{
          position: 'absolute',
          top: 18,
          right: 18,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: statusStyle.text,
          backgroundColor: statusStyle.bg,
          padding: '3px 9px',
          borderRadius: 5,
        }}
      >
        {project.status}
      </span>

      {/* Name */}
      <p
        style={{
          margin: '0 0 5px',
          fontSize: 18,
          fontWeight: 700,
          color: '#f0f0f0',
          letterSpacing: '-0.02em',
          lineHeight: 1.25,
          paddingRight: 100, // keep clear of status badge
        }}
      >
        {project.name}
      </p>

      {/* Brand · Country */}
      <p
        style={{
          margin: '0 0 18px',
          fontSize: 13,
          color: '#666',
          lineHeight: 1.4,
        }}
      >
        {project.brand}
        <span style={{ margin: '0 6px', color: '#404040' }}>·</span>
        {project.country}
      </p>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: '#333', marginBottom: 16 }} />

      {/* Bottom row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {/* Room count */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 13,
            color: '#888',
            marginRight: 4,
          }}
        >
          <BedDouble size={14} style={{ color: '#555' }} />
          {project.rooms} rooms
        </div>

        {/* Sustainability pills */}
        {project.sustainability.map((label) => {
          const badge = defaultBadge(label);
          return (
            <span
              key={label}
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: badge.text,
                backgroundColor: badge.bg,
                padding: '3px 9px',
                borderRadius: 5,
              }}
            >
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const router = useRouter();

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' }}>
      {/* ── Sidebar ─────────────────────────────────── */}
      <ProjectsSidebar />

      {/* ── Main content ────────────────────────────── */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '44px 48px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#333 transparent',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <h1
            style={{
              margin: '0 0 6px',
              fontSize: 28,
              fontWeight: 700,
              color: '#f0f0f0',
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
            }}
          >
            Projects
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: '#555' }}>
            Development &amp; Pre-Opening
          </p>
        </div>

        {/* Cards grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
            maxWidth: 960,
            marginBottom: 32,
          }}
        >
          {PROJECTS.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => router.push(`/projects/${project.id}`)}
            />
          ))}
        </div>

        {/* New Project */}
        <button
          className={styles.newProjectButton}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '11px 20px',
            border: '1px dashed #2e2e2e',
            borderRadius: 12,
            backgroundColor: 'transparent',
            color: '#444',
            cursor: 'pointer',
            fontSize: 14,
            fontFamily: 'inherit',
            transition: 'border-color 0.15s, color 0.15s',
          }}
        >
          <Plus size={15} />
          New Project
        </button>
      </main>
    </div>
  );
}
