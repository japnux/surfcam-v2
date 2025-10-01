import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const spot = searchParams.get('spot') || 'Spot de Surf'
    const region = searchParams.get('region') || 'France'

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            backgroundImage: 'linear-gradient(to bottom right, #0f172a, #1e293b)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
            }}
          >
            <div
              style={{
                fontSize: 72,
                fontWeight: 'bold',
                color: '#ffffff',
                textAlign: 'center',
                marginBottom: 20,
              }}
            >
              {spot}
            </div>
            <div
              style={{
                fontSize: 36,
                color: '#94a3b8',
                textAlign: 'center',
                marginBottom: 40,
              }}
            >
              {region}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                backgroundColor: '#0ea5e9',
                padding: '20px 40px',
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 'bold',
                  color: '#ffffff',
                }}
              >
                🌊 Webcam en direct & Prévisions
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('OG image error:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
