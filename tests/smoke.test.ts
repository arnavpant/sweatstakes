import { describe, it, expect } from 'vitest'

describe('Project smoke test', () => {
  it('vitest runs successfully', () => {
    expect(true).toBe(true)
  })

  it('environment variables template exists', async () => {
    const fs = await import('fs')
    const envExample = fs.readFileSync('.env.local.example', 'utf-8')
    expect(envExample).toContain('NEXT_PUBLIC_SUPABASE_URL')
    expect(envExample).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  })
})
