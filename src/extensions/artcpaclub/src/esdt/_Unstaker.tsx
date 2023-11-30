import { Contracts } from '../contracts'
import { Button, Input } from '@peerme/web-ui'
import { sanitizeNumeric } from '@peerme/core-ts'
import { EsdtPool, EsdtPoolOnChain } from '../types'
import React, { SyntheticEvent, useState } from 'react'
import { useApp } from '../../../../shared/hooks/useApp'
import { AppSection } from '../../../../shared/ui/elements'

type Props = {
  pool: EsdtPool
  poolOnChain: EsdtPoolOnChain
  className?: string
}

export function _Unstaker(props: Props) {
  const app = useApp()
  const [amount, setAmount] = useState('0')
  const balanceDenominated = props.poolOnChain.user_stake_amount.shiftedBy(-props.pool.stake_token_decimal)

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault()

    app.requestProposalAction(
      Contracts(app.config).UserUnstake.Address,
      Contracts(app.config).UserUnstake.Endpoint,
      0,
      [props.pool.pool_id],
      []
    )
  }

  return (
    <AppSection title="Unstake" className={props.className}>
      <form onSubmit={handleSubmit}>
        <label htmlFor="amount" className="mb-2 pl-1 text-xl text-gray-800 dark:text-gray-200">
          Amount
        </label>
        <div className="relative">
          <Input
            id="amount"
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(val) => setAmount(sanitizeNumeric(val))}
            className="mb-2"
            autoComplete="off"
          />
          {+amount !== +balanceDenominated && (
            <div className="absolute bottom-1/2 right-4 translate-y-1/2 transform">
              <button
                type="button"
                onClick={() => setAmount(balanceDenominated.toString())}
                className="rounded-xl bg-gray-800 px-3 py-1 uppercase text-gray-100 shadow-lg transition duration-300 hover:bg-gray-900"
              >
                Max
              </button>
            </div>
          )}
        </div>
        <Button color="blue" className="block w-full" submit>
          Add Unstake Action
        </Button>
      </form>
    </AppSection>
  )
}
