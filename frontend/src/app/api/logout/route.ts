import { NextResponse } from 'next/server'

export function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete('ontickets_authenticated')
  return response
}
