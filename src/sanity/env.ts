export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-05-11'

export const dataset = assertValue(
  process.env.NEXT_PUBLIC_SANITY_DATASET,
  'Missing environment variable: NEXT_PUBLIC_SANITY_DATASET'
)

export const projectId = assertValue(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  'Missing environment variable: NEXT_PUBLIC_SANITY_PROJECT_ID'
)

export const useCdn = false

// AdSense Configuration
export const adsenseClientId = assertValue(
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID,
  'Missing environment variable: NEXT_PUBLIC_ADSENSE_CLIENT_ID'
)

export const adsenseTopSlot = assertValue(
  process.env.NEXT_PUBLIC_ADSENSE_TOP_SLOT,
  'Missing environment variable: NEXT_PUBLIC_ADSENSE_TOP_SLOT'
)

export const adsenseBottomSlot = assertValue(
  process.env.NEXT_PUBLIC_ADSENSE_BOTTOM_SLOT,
  'Missing environment variable: NEXT_PUBLIC_ADSENSE_BOTTOM_SLOT'
)

function assertValue<T>(v: T | undefined, errorMessage: string): T {
  if (v === undefined) {
    throw new Error(errorMessage)
  }

  return v
}
