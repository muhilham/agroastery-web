import { ImageResponse } from "@vercel/og";

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "1200px",
          height: "630px",
        }}
      >
        <img
          src="https://github.com/user-attachments/assets/79b22a6a-f341-40f6-ac74-27c6af123b7e"
          alt="og"
          style={{
            objectFit: "cover",
            width: "100%",
            height: "100%",
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
