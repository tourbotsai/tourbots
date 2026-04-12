import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveAppContext, getLiveVenueTours, type LiveAppContext, type LiveTour } from '@/tests/helpers/live-app-context'

let ctx: LiveAppContext
let tours: LiveTour[]

beforeAll(async () => {
  ctx = await getLiveAppContext()
  tours = await getLiveVenueTours(ctx)
  if (tours.length === 0) {
    throw new Error('Tour locations test requires at least one active tour')
  }
}, 30_000)

describe('live app tour locations and models smoke', () => {
  it('returns location/model structure expected by tour locations UI', () => {
    const locationTours = tours.filter((tour) => !tour.tour_type || tour.tour_type === 'primary')
    const secondaryTours = tours.filter((tour) => tour.tour_type === 'secondary')

    expect(locationTours.length).toBeGreaterThan(0)
    expect(tours.every((tour) => Boolean(tour.id))).toBe(true)
    expect(tours.every((tour) => Boolean(tour.title))).toBe(true)
    expect(tours.every((tour) => Boolean(tour.matterport_tour_id))).toBe(true)

    for (let i = 1; i < tours.length; i += 1) {
      const prevOrder = Number(tours[i - 1].display_order || 0)
      const nextOrder = Number(tours[i].display_order || 0)
      expect(prevOrder).toBeLessThanOrEqual(nextOrder)
    }

    if (secondaryTours.length > 0) {
      const locationIds = new Set(locationTours.map((tour) => tour.id))
      const hasParentLinkedSecondary = secondaryTours.some(
        (tour) => Boolean(tour.parent_tour_id && locationIds.has(tour.parent_tour_id))
      )
      expect(hasParentLinkedSecondary || locationTours.length === 1).toBe(true)
    }
  })
})
