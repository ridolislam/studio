import { ImageResponse } from 'next/og';

/**
 * @fileOverview Dynamic Open Graph Image for numcheckr.
 * Generates a high-resolution 1200x630 image for social media sharing.
 */

export const runtime = 'edge';

export const alt = 'numcheckr - AI-Powered Phone Number & Lead Verification Tool';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #0F172A, #1E293B)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Glow Effects */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '20%',
            width: '300px',
            height: '300px',
            background: 'rgba(113, 85, 255, 0.15)',
            filter: 'blur(100px)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            right: '20%',
            width: '300px',
            height: '300px',
            background: 'rgba(59, 130, 246, 0.15)',
            filter: 'blur(100px)',
            borderRadius: '50%',
          }}
        />

        {/* Logo Section */}
        <div style={{ display: 'flex', marginBottom: '20px' }}>
          <svg width="120" height="120" viewBox="0 0 100 100">
            <path
              d="M30 30V70L55 30V70"
              stroke="white"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M80 40C75 32 65 28 58 28C45 28 35 40 35 50C35 60 45 72 58 72C65 72 75 68 80 60"
              stroke="#7155FF"
              strokeWidth="14"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Brand Name */}
        <h1
          style={{
            fontSize: '100px',
            fontWeight: '900',
            fontStyle: 'italic',
            color: 'white',
            margin: '0',
            letterSpacing: '-0.05em',
            display: 'flex',
          }}
        >
          num<span style={{ color: '#7155FF' }}>checkr</span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '32px',
            color: '#94A3B8',
            maxWidth: '800px',
            textAlign: 'center',
            lineHeight: '1.4',
            marginTop: '20px',
          }}
        >
          Verify, validate, and clean your business leads with AI-powered precision. The ultimate tool for modern lead generation.
        </p>

        {/* Feature Badges */}
        <div style={{ display: 'flex', gap: '40px', marginTop: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#7155FF' }} />
            <span style={{ color: 'white', fontSize: '18px', fontWeight: '700' }}>99.9% ACCURACY</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#7155FF' }} />
            <span style={{ color: 'white', fontSize: '18px', fontWeight: '700' }}>REAL-TIME API</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#7155FF' }} />
            <span style={{ color: 'white', fontSize: '18px', fontWeight: '700' }}>GLOBAL COVERAGE</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
