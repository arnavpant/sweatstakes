'use client'

import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { updateWeeklyGoalAction } from '@/lib/actions/check-ins'

interface GoalStepperProps {
  currentGoal: number
}

export function GoalStepper({ currentGoal }: GoalStepperProps) {
  const [goal, setGoal] = useState(currentGoal)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleChange(newGoal: number) {
    // Clamp 1-7
    const clamped = Math.max(1, Math.min(7, newGoal))
    if (clamped === goal) return

    const previousGoal = goal

    // Optimistic update
    setGoal(clamped)
    setError(null)
    setLoading(true)

    const result = await updateWeeklyGoalAction(clamped)

    if ('error' in result) {
      // Revert on failure
      setGoal(previousGoal)
      setError(result.error ?? 'Failed to update goal')
    }

    setLoading(false)
  }

  return (
    <div className="bg-surface-container rounded-xl p-5 w-full space-y-3">
      <h2 className="text-base font-bold text-on-surface">Weekly Goal</h2>
      <p className="text-sm text-on-surface-variant">
        How many days per week do you want to work out?
      </p>

      {/* Stepper row */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-6">
          {/* Minus button */}
          <button
            type="button"
            onClick={() => handleChange(goal - 1)}
            disabled={goal === 1 || loading}
            aria-label="Decrease goal"
            className="flex items-center justify-center w-11 h-11 rounded-full bg-surface-container-high text-on-surface disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            <Minus className="h-5 w-5" />
          </button>

          {/* Current goal number */}
          <span
            className={`text-5xl font-bold text-on-surface tabular-nums transition-opacity ${
              loading ? 'opacity-60' : ''
            }`}
          >
            {goal}
          </span>

          {/* Plus button */}
          <button
            type="button"
            onClick={() => handleChange(goal + 1)}
            disabled={goal === 7 || loading}
            aria-label="Increase goal"
            className="flex items-center justify-center w-11 h-11 rounded-full bg-surface-container-high text-on-surface disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Label */}
        <span className="text-sm text-on-surface-variant">days per week</span>
      </div>

      {/* Error display */}
      {error && (
        <p role="alert" className="text-sm text-error text-center">
          {error}
        </p>
      )}
    </div>
  )
}
