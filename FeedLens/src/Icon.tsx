import React from 'react'
const paths: Record<string, React.ReactNode> = {
  earth: <><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></>,
  cities: <><path d="M3 21h18M5 21V8h6v13m0-18h7v18M7 11h2m-2 4h2m4-9h3m-3 4h3m-3 4h3"/></>,
  space: <><circle cx="12" cy="12" r="6"/><ellipse cx="12" cy="12" rx="11" ry="3.5" transform="rotate(-35 12 12)"/></>,
  dislike: <path d="M10 14v4c0 3 3 3 4 1l3-6V4H7L4 12q-1 2 2 2h4Zm7-10h4v9h-4"/>,
  scan: <><path d="M3 8V4h5m8 0h5v4M3 16v4h5m8 0h5v-4M5 12q7-9 14 0-7 9-14 0Z"/><circle cx="12" cy="12" r="2"/></>,
  feed: <><rect x="4" y="4" width="16" height="16" rx="4"/><path d="m10 8 6 4-6 4Z"/></>,
  reset: <><path d="M3 10a9 9 0 1 1 1 8M3 4v6h6"/></>,
  help: <><circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 5 2c-1 1-2 1-2 3m0 3h.01"/></>,
  heart: <path d="M20 5c-3-2-6-1-8 2-2-3-5-4-8-2-5 4-1 9 8 16 9-7 13-12 8-16Z"/>,
  skip: <><path d="m4 5 12 7-12 7ZM20 5v14"/></>,
  play: <path d="m7 4 13 8-13 8Z"/>, pause: <><path d="M8 5v14m8-14v14" strokeWidth="4"/></>,
  eye: <><path d="M2 12q10-15 20 0-10 15-20 0Z"/><circle cx="12" cy="12" r="3"/></>,
  sliders: <><path d="M3 7h6m5 0h7M3 17h10m5 0h3"/><circle cx="11.5" cy="7" r="2.5"/><circle cx="15.5" cy="17" r="2.5"/></>,
  signal: <><path d="M4 18v-5m5 5V9m5 9V5m5 13v-8"/></>,
  sport: <><circle cx="12" cy="12" r="9"/><path d="m5 5 14 14M5 19 19 5M3 10q9 1 11 11M10 3q1 9 11 11"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/></>,
  chevron: <path d="m6 9 6 6 6-6"/>, close: <path d="m6 6 12 12M6 18 18 6"/>,
  queue: <><path d="M3 5h16M3 10h12M3 15h7m5-2 6 4-6 4Z"/></>,
  spark: <path d="m12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4Z"/>,
  wave: <path d="M2 12h5l3-7 4 14 3-7h5"/>,
}
export function Icon({name, size=20}: {name: string; size?: number}) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}
