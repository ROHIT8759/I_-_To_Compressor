import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 512,
  height: 512,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 320,
          background: '#0f172a', /* slate-900 to match theme */
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6366f1', /* indigo-500 to match theme */
          borderRadius: '20%', 
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{ width: '60%', height: '60%' }} // Adjusted size relative to container
        >
          <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" />
        </svg>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  );
}
