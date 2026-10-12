import { ImageResponse } from 'next/og';

/**
 * @fileOverview Dynamic Open Graph Image for numcheckr.
 * Recreates the landing page hero design for social media previews.
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
          background: '#06080F',
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
        {/* Subtle Background Glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(113, 85, 255, 0.1) 0%, rgba(0,0,0,0) 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Central Logo & Brand */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
          {/* Logo Icon */}
          <div style={{ marginBottom: '20px', display: 'flex' }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <path
                d="M30 30V70L55 30V70"
                stroke="white"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M80 40C75 32 65 28 58 28C45 28 35 40 35 50C35 60 45 72 58 72C65 72 75 68 80 60"
                stroke="#7155FF"
                strokeWidth="12"
                strokeLinecap="round"
              />
            </svg>
          </div>
          
          {/* Brand Name */}
          <h1
            style={{
              fontSize: '110px',
              fontWeight: '900',
              fontStyle: 'italic',
              color: 'white',
              margin: '0',
              letterSpacing: '-0.05em',
              display: 'flex',
              textShadow: '0 10px 30px rgba(0,0,0,0.5)',
            }}
          >
            num<span style={{ color: '#7155FF' }}>checkr</span>
          </h1>
        </div>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '32px',
            color: '#94A3B8',
            maxWidth: '900px',
            textAlign: 'center',
            lineHeight: '1.4',
            margin: '0 0 50px 0',
            fontWeight: '400',
          }}
        >
          Verify, validate, and clean your business leads with AI-powered precision. The ultimate tool for modern lead generation.
        </p>

        {/* Mock Buttons */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '80px' }}>
          <div style={{
            background: '#7155FF',
            padding: '16px 40px',
            borderRadius: '16px',
            color: 'white',
            fontSize: '24px',
            fontWeight: '700',
          }}>
            Get Started Free →
          </div>
          <div style={{
            border: '2px solid #1E293B',
            padding: '16px 40px',
            borderRadius: '16px',
            color: 'white',
            fontSize: '24px',
            fontWeight: '700',
          }}>
            View Pricing
          </div>
        </div>

        {/* Features Bottom Row */}
        <div style={{ display: 'flex', gap: '60px', opacity: '0.8' }}>
          {[
            { label: '99.9% Accuracy' },
            { label: 'Real-time API' },
            { label: 'Secure Data' },
            { label: 'Global Coverage' }
          ].map((feat, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid rgba(113, 85, 255, 0.3)', display: 'flex' }} />
              <span style={{ color: 'white', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {feat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
