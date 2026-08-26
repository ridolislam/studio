import { ImageResponse } from 'next/og';

/**
 * @fileOverview Dynamic Favicon generator for numcheckr.
 * Generates a high-quality 48x48 PNG icon matching the brand identity.
 */

export const runtime = 'edge';

export const size = {
  width: 48,
  height: 48,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0F172A',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '12px',
          position: 'relative',
        }}
      >
        {/* Simplified SVG version of the Logo for Favicon */}
        <svg
          width="36"
          height="36"
          viewBox="0 0 100 100"
          style={{ display: 'flex' }}
        >
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
    ),
    {
      ...size,
    }
  );
}
