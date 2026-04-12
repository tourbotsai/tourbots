import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveAppContext, getLiveVenueTours, type LiveAppContext, type LiveTour } from '@/tests/helpers/live-app-context'

let ctx: LiveAppContext
let tours: LiveTour[]

beforeAll(async () => {
  ctx = await getLiveAppContext()
  tours = await getLiveVenueTours(ctx)
  if (tours.length === 0) {
    throw new Error('Tour viewer test requires at least one active tour')
  }
}, 30_000)

describe('live app tour viewer smoke', () => {
  it('loads viewer-compatible tour model data for the venue', () => {
    const firstTour = tours[0]

    expect(firstTour.id).toBeTruthy()
    expect(firstTour.title).toBeTruthy()
    expect(firstTour.matterport_tour_id).toBeTruthy()
    expect(firstTour.is_active).toBe(true)
    expect(['primary', 'secondary', null, undefined]).toContain(firstTour.tour_type)
  })
})
