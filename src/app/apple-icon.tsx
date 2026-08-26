import { ImageResponse } from 'next/og';

/**
 * @fileOverview High-resolution Apple Touch Icon for numcheckr.
 */

export const runtime = 'edge';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #0F172A, #1E293B)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '40px',
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 100 100"
        >
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
    ),
    {
      ...size,
    }
  );
}
