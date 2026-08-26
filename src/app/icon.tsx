
import { ImageResponse } from 'next/og';

/**
 * @fileOverview Dynamic Favicon generator for numcheckr.
 * Generates a high-quality 32x32 PNG icon using brand colors.
 */

export const runtime = 'edge';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      // Favicon JSX element
      <div
        style={{
          fontSize: 22,
          background: 'linear-gradient(to bottom right, #7155FF, #3B82F6)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '6px',
          fontWeight: 900,
          fontStyle: 'italic',
          fontFamily: 'sans-serif',
          boxShadow: 'inset 0 0 5px rgba(0,0,0,0.2)',
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
