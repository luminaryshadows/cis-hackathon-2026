import React from 'react'
import {currentPost, watchDislikeBalance} from './session'
import type {Session} from './session'

const signed = new Intl.NumberFormat('en', {signDisplay:'exceptZero', maximumSignificantDigits:4})

export function WatchDislike({session}:{session:Session}) {
  const balance = watchDislikeBalance(session)
  if (!balance) return null
  const {watch, penalty} = balance
  const net = Math.abs(balance.net) < 1e-10 ? 0 : balance.net
  return <div className="watch-balance" role="group" aria-label="Watch time versus dislike">
    <strong>{net > 0 ? 'Watch time outweighs your dislike.' :
      net < 0 ? 'Your dislike outweighs watch time.' : 'The two signals balance.'}</strong>
    <div className="watch-balance-values">
      <span>Watch <b>{signed.format(watch)}</b></span>
      <span>Dislike <b>{signed.format(penalty)}</b></span>
      <span>{currentPost(session).topic} <b>{signed.format(net)}</b></span>
    </div>
    <small>Interest points this visit</small>
  </div>
}
