'use client';

export default function SpeckleEmbed({ height = '600px' }: { height?: string }) {
  const embedUrl =
    'https://app.speckle.systems/projects/5631f759bb/models/4253c60680#embed=%7B%22isEnabled%22%3Atrue%2C%22isTransparent%22%3Atrue%2C%22hideControls%22%3Atrue%2C%22hideSelectionInfo%22%3Atrue%7D';

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        height,
        borderRadius: '12px',
        boxShadow: '0 0 20px rgba(0,0,0,0.08)',
      }}
    >
      <iframe
        src={embedUrl}
        title="Speckle Viewer"
        width="100%"
        height={height}
        style={{ border: 'none' }}
        allowFullScreen
      />
    </div>
  );
}
