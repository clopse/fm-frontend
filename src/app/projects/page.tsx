'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, BedDouble, Menu } from 'lucide-react';
import ProjectsSidebar from '@/components/projects/ProjectsSidebar';
import NewProjectModal from '@/components/projects/NewProjectModal';
import { PROJECTS, type ProjectConfig } from '@/data/projects';
import { useMyPermissions } from '@/lib/permissions';
import styles from '@/styles/projects.module.css';

// ─── Badge configs ────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  'pre-opening': { bg: '#fef3c7', text: '#d97706', label: 'Pre-Opening' },
  'operational': { bg: '#dcfce7', text: '#16a34a', label: 'Open' },
};

const SUSTAINABILITY_BADGE: Record<string, { bg: string; text: string }> = {
  'LEED Gold':          { bg: '#dcfce7', text: '#16a34a' },
  'LEED Platinum':      { bg: '#bbf7d0', text: '#15803d' },
  'LEED Silver':        { bg: '#d1fae5', text: '#059669' },
  'BREEAM Excellent':   { bg: '#e0f2fe', text: '#0284c7' },
  'BREEAM Outstanding': { bg: '#bae6fd', text: '#0369a1' },
  'BREEAM Very Good':   { bg: '#dbeafe', text: '#1d4ed8' },
};

function defaultBadge(label: string): { bg: string; text: string } {
  return SUSTAINABILITY_BADGE[label] ?? { bg: '#f1f5f9', text: '#64748b' };
}

// ─── Project card ─────────────────────────────────────────────────────────────

function ProjectCard({ project, onClick }: { project: ProjectConfig; onClick: () => void }) {
  const statusStyle = STATUS_BADGE[project.status] ?? { bg: '#f1f5f9', text: '#64748b', label: project.status };
  const sustainability = project.sustainability ?? [];

  return (
    <div
      onClick={onClick}
      className={styles.projectCard}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb',
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
        {statusStyle.label}
      </span>

      {/* Name */}
      <p
        style={{
          margin: '0 0 5px',
          fontSize: 18,
          fontWeight: 700,
          color: '#0f172a',
          letterSpacing: '-0.02em',
          lineHeight: 1.25,
          paddingRight: 100,
        }}
      >
        {project.name}
      </p>

      {/* Brand · Location */}
      <p style={{ margin: '0 0 18px', fontSize: 13, color: '#64748b', lineHeight: 1.4 }}>
        {project.brand}
        <span style={{ margin: '0 6px', color: '#cbd5e1' }}>·</span>
        {project.location}
      </p>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: '#e5e7eb', marginBottom: 16 }} />

      {/* Bottom row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {project.rooms && project.rooms > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#64748b', marginRight: 4 }}>
            <BedDouble size={14} style={{ color: '#94a3b8' }} />
            {project.rooms} rooms
          </div>
        ) : null}

        {sustainability.map((label) => {
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile,    setIsMobile]    = useState(false);
  const [modalOpen,   setModalOpen]   = useState(false);
  const { permissions } = useMyPermissions();

  const visibleProjects = useMemo(() => {
    if (!permissions) return PROJECTS;
    const { role, admin_hotel_id, grants } = permissions;
    if (role === 'system_admin' || role === 'group_admin') return PROJECTS;
    if (role === 'hotel_admin') return PROJECTS.filter(p => p.id === admin_hotel_id);
    const grantedIds = new Set(grants.filter(g => g.module === 'projects').map(g => g.hotel_id));
    return PROJECTS.filter(p => grantedIds.has(p.id));
  }, [permissions]);

  useEffect(() => {
    const initialised = { current: false };
    function check() {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!initialised.current) {
        setSidebarOpen(!mobile);
        initialised.current = true;
      }
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('new') === '1') {
      setModalOpen(true);
      router.replace('/projects', { scroll: false });
    }
  }, [router]);

  return (
    <div data-theme="light" style={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%', backgroundColor: '#f9fafb' }}>
      {/* Sidebar */}
      <ProjectsSidebar
        isOpen={sidebarOpen}
        isMobile={isMobile}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '24px 20px' : '44px 48px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#d1d5db transparent',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 36, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            title="Toggle sidebar"
            className={styles.themeToggle}
            style={{ marginTop: 4, flexShrink: 0 }}
          >
            <Menu size={18} />
          </button>
          <div>
            <h1
              style={{
                margin: '0 0 6px',
                fontSize: 28,
                fontWeight: 700,
                color: '#0f172a',
                letterSpacing: '-0.03em',
                lineHeight: 1.2,
              }}
            >
              Projects
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
              Development &amp; Pre-Opening
            </p>
          </div>
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
          {visibleProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => router.push(project.href)}
            />
          ))}
        </div>

        {/* New Project */}
        <button
          onClick={() => setModalOpen(true)}
          className={styles.newProjectButton}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '11px 20px',
            border: '1px dashed #d1d5db',
            borderRadius: 12,
            backgroundColor: 'transparent',
            color: '#9ca3af',
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

      <NewProjectModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
