'use client'

import { Drawer } from '@base-ui/react/drawer'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Loader2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { addRewardAction } from '@/lib/actions/points'
import { useRouter } from 'next/navigation'

const schema = z.object({
  name: z.string().min(1, 'Reward name is required.').max(60, 'Name must be 60 characters or less.'),
  pointCost: z.coerce
    .number({ message: 'Enter a whole number.' })
    .int('Enter a whole number.')
    .min(1, 'Cost must be at least 1 point.'),
})

type FormData = z.infer<typeof schema>

export function AddRewardDrawer() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const router = useRouter()

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    mode: 'onSubmit' as const,
  })

  function onSubmit(data: Record<string, unknown>) {
    const parsed = data as FormData
    setServerError(null)
    startTransition(async () => {
      const result = await addRewardAction({ name: parsed.name, pointCost: parsed.pointCost })
      if ('error' in result) {
        setServerError(result.error ?? 'Failed to add reward. Please try again.')
      } else {
        reset()
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger
        className="bg-secondary text-on-secondary rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg min-w-[44px] min-h-[44px]"
        aria-label="Add reward"
      >
        <Plus size={18} />
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className="bg-black/50 fixed inset-0 z-40" />
        <Drawer.Popup className="fixed bottom-0 left-0 right-0 bg-surface-container-high rounded-t-2xl p-6 space-y-4 pb-safe z-50">
          {/* Handle bar */}
          <div className="w-10 h-1 bg-outline-variant rounded-full mx-auto mb-4" />

          <Drawer.Title className="text-xl font-bold text-on-surface">Add a Reward</Drawer.Title>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Reward name */}
            <div className="space-y-1.5">
              <label htmlFor="reward-name" className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                Reward name
              </label>
              <input
                id="reward-name"
                {...register('name')}
                placeholder="e.g. Movie night pick"
                className="bg-surface-container rounded-xl px-4 py-3 text-base text-on-surface placeholder:text-on-surface-variant border border-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/30 outline-none w-full"
                maxLength={60}
              />
              {errors.name && <p className="text-error text-sm mt-1">{errors.name.message}</p>}
            </div>

            {/* Point cost */}
            <div className="space-y-1.5">
              <label htmlFor="reward-cost" className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                Point cost
              </label>
              <div className="relative">
                <input
                  id="reward-cost"
                  {...register('pointCost')}
                  type="number"
                  inputMode="numeric"
                  placeholder="e.g. 3"
                  className="bg-surface-container rounded-xl px-4 py-3 pr-12 text-base text-on-surface placeholder:text-on-surface-variant border border-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/30 outline-none w-full"
                  min={1}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">pts</span>
              </div>
              {errors.pointCost && <p className="text-error text-sm mt-1">{errors.pointCost.message}</p>}
            </div>

            {serverError && <p className="text-error text-sm">{serverError}</p>}

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { reset(); setOpen(false) }}
                className="text-on-surface-variant font-bold px-4 py-2 rounded-full"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="bg-secondary text-on-secondary font-bold rounded-full px-6 py-2 flex items-center justify-center disabled:opacity-50"
                aria-busy={isPending}
              >
                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Add'}
              </button>
            </div>
          </form>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
