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
          fontSize: 120,
          background: 'linear-gradient(to bottom right, #7155FF, #3B82F6)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '40px',
          fontWeight: 900,
          fontStyle: 'italic',
          fontFamily: 'sans-serif',
        }}
      >
        N
      </div>
    ),
    {
      ...size,
    }
  );
}
