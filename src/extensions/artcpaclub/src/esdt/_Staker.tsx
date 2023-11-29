import { EsdtPool } from '../types'
import { Contracts } from '../contracts'
import React, { SyntheticEvent, useState } from 'react'
import { TokenTransfer } from '@multiversx/sdk-core/out'
import { useApp } from '../../../../shared/hooks/useApp'
import { AppSection } from '../../../../shared/ui/elements'
import { Button, EntityTransferSelector } from '@peerme/web-ui'

type Props = {
  pool: EsdtPool
  className?: string
}

export function _Staker(props: Props) {
  const app = useApp()
  const [payment, setPayment] = useState<TokenTransfer | null>(null)
  const isSubmitDisabled = !payment

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault()
    if (!payment) return
    const value = payment.isEgld() ? payment.amountAsBigInteger : 0
    const tokenTransfers = payment.isEgld() ? [] : [payment]

    app.requestProposalAction(
      Contracts(app.config).UserStake.Address,
      Contracts(app.config).UserStake.Endpoint,
      value,
      [props.pool.pool_id],
      tokenTransfers
    )
  }

  return (
    <AppSection title="Stake now" className={props.className}>
      <form onSubmit={handleSubmit}>
        <EntityTransferSelector
          config={app.config.walletConfig}
          entity={app.config.entity}
          permissions={[]}
          onSelected={(val) => setPayment(val)}
          tokenIdWhitelist={[props.pool.stake_token_id]}
          className="mb-8"
        />
        <Button color="blue" className="block w-full" disabled={isSubmitDisabled} submit>
          Add Stake Action to Proposal
        </Button>
      </form>
    </AppSection>
  )
}
