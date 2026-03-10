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
            <div
                style={{
                    fontSize: 300,
                    background: '#ffffff',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '112px',
                    border: '4px solid #f4f4f5'
                }}
            >
                <svg
                    width="70%"
                    height="70%"
                    viewBox="0 0 40 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M10 32H24"
                        stroke="#0f172a"
                        strokeWidth="5"
                        strokeLinecap="round"
                    />
                    <path
                        d="M10 32V8M10 8L5 13M10 8L15 13"
                        stroke="#10b981"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M32 8V32M32 8L28 12"
                        stroke="#1e40af"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
        ),
        { ...size }
    );
}
