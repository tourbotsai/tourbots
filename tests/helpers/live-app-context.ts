import { signInFirebasePassword } from '@/tests/helpers/live-auth'

export interface LiveAppContext {
  baseUrl: string
  idToken: string
  venueId: string
  tourId: string
}

export interface LiveChatbotContext extends LiveAppContext {
  chatbotConfigId: string
}

export interface LiveTour {
  id: string
  title?: string | null
  description?: string | null
  matterport_tour_id?: string | null
  matterport_url?: string | null
  tour_type?: 'primary' | 'secondary' | null
  parent_tour_id?: string | null
  display_order?: number | null
  is_active?: boolean
}

export async function getLiveAppContext(): Promise<LiveAppContext> {
  const { baseUrl, idToken } = await signInFirebasePassword()

  const userResponse = await fetch(`${baseUrl}/api/auth/check-user`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  })
  if (!userResponse.ok) {
    throw new Error(`Failed to resolve user context: ${userResponse.status}`)
  }

  const userPayload = await userResponse.json()
  const venueId: string | undefined = userPayload?.user?.venue_id || userPayload?.user?.venue?.id
  if (!venueId) {
    throw new Error('Live tests require a user linked to a venue')
  }

  const toursResponse = await fetch(`${baseUrl}/api/app/tours/venue/${venueId}/all`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  })
  if (!toursResponse.ok) {
    throw new Error(`Failed to fetch tours: ${toursResponse.status}`)
  }

  const tours = await toursResponse.json()
  if (!Array.isArray(tours) || tours.length === 0 || !tours[0]?.id) {
    throw new Error('Live tests require at least one active tour with an id')
  }

  return {
    baseUrl,
    idToken,
    venueId,
    tourId: tours[0].id as string,
  }
}

export async function getLiveVenueTours(context: LiveAppContext): Promise<LiveTour[]> {
  const toursResponse = await fetch(`${context.baseUrl}/api/app/tours/venue/${context.venueId}/all`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${context.idToken}`,
    },
  })

  if (!toursResponse.ok) {
    throw new Error(`Failed to fetch tours: ${toursResponse.status}`)
  }

  const toursPayload = await toursResponse.json()
  if (!Array.isArray(toursPayload)) {
    throw new Error('Tours response is not an array')
  }

  return toursPayload as LiveTour[]
}

export async function getLiveChatbotContext(): Promise<LiveChatbotContext> {
  const appContext = await getLiveAppContext()

  const configQuery = new URLSearchParams({
    venueId: appContext.venueId,
    tourId: appContext.tourId,
    chatbotType: 'tour',
  })

  const configResponse = await fetch(`${appContext.baseUrl}/api/app/chatbots/config?${configQuery.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${appContext.idToken}`,
    },
  })

  if (!configResponse.ok) {
    throw new Error(`Failed to fetch chatbot config: ${configResponse.status}`)
  }

  const configPayload = await configResponse.json()
  const chatbotConfigId: string | undefined = configPayload?.id
  if (!chatbotConfigId) {
    throw new Error('Live chatbot tests require an existing chatbot config for the selected tour')
  }

  return {
    ...appContext,
    chatbotConfigId,
  }
}
