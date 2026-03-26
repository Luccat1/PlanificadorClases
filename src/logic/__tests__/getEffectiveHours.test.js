import { getEffectiveHours } from '../../logic/utils.js'

describe('getEffectiveHours', () => {
    describe('chronological mode', () => {
        it('returns hours unchanged (multiplier 1)', () => {
            expect(getEffectiveHours(2, 'chronological')).toBe(2)
        })

        it('returns zero for zero input', () => {
            expect(getEffectiveHours(0, 'chronological')).toBe(0)
        })
    })

    describe('pedagogical mode', () => {
        it('multiplies by 60/45', () => {
            expect(getEffectiveHours(1, 'pedagogical')).toBeCloseTo(60 / 45)
        })

        it('scales linearly: 2 hours pedagogical', () => {
            expect(getEffectiveHours(2, 'pedagogical')).toBeCloseTo(2 * 60 / 45)
        })
    })

    describe('dgai mode', () => {
        it('multiplies by 60/35', () => {
            expect(getEffectiveHours(1, 'dgai')).toBeCloseTo(60 / 35)
        })

        it('scales linearly: 2 hours dgai', () => {
            expect(getEffectiveHours(2, 'dgai')).toBeCloseTo(2 * 60 / 35)
        })
    })

    describe('unknown mode fallback', () => {
        it('falls back to multiplier 1 for unknown mode', () => {
            expect(getEffectiveHours(3, 'unknown')).toBe(3)
        })

        it('falls back to multiplier 1 for undefined mode', () => {
            expect(getEffectiveHours(5, undefined)).toBe(5)
        })
    })
})
