import { BigNumber } from 'bignumber.js'
import { XBulkConfig } from './config'
import { useApp } from '../../../shared/hooks/useApp'
import React, { SyntheticEvent, useState } from 'react'
import { TokenPayment, Address } from '@multiversx/sdk-core'
import { Button, Switch, Textarea, showToast, PaymentSelector } from '@peerme/web-ui'

export const _BulkTransactions = () => {
  const app = useApp()
  const [payment, setPayment] = useState<TokenPayment | null>(null)
  // const [token, setToken] = useState<string>('') TODO
  const [userTxList, setUserTxList] = useState<string>('')
  const [useSameAmount, setUseSameAmount] = useState<boolean>(false)

  const isValid = () => {
    // Get an array containing all the lines of the user input
    if (userTxList.trim() === '') {
      return false
    }
    const lines = userTxList.trim().split(/[\r\n]+/)
    if (lines.length > 100) {
      return false
    }
    return true
  }

  // TODO
  // const createTokenPayment = (amount) => {
  //   if (useSameAmount) {
  //     if (payment.isEgld()) {
  //       return TokenPayment.egldFromAmount(amount)
  //     }
  //     return TokenPayment.fungibleFromAmount(payment.tokenIdentifier, amount, payment.numDecimals)
  //   } else {
  //     if (token === 'EGLD') {
  //       return TokenPayment.egldFromAmount(amount)
  //     } else {
  //       return TokenPayment.fungibleFromAmount(token, amount, 18)
  //     }
  //   }
  // }

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault()
    if (!payment) {
      showToast('Please select a token', 'error')
      return
    }

    let errors = ''

    // Get an array containing all the lines of the user input
    const lines = userTxList.trim().split(/[\r\n]+/)

    // Prepare the arguments for the transaction
    let callAmount = new BigNumber(0)
    let args = Array<string>()

    lines.forEach((line, i) => {
      try {
        const [receiver, amount] = line.split(';')

        // Check if the address and amount are valid
        const address = Address.fromBech32(receiver)
        if (!useSameAmount && isNaN(Number(amount))) {
          throw Error(`"${amount}" is not a valid number`)
        }

        // Add the transaction to the list
        args.push(address.bech32())
        if (!useSameAmount) {
          callAmount = callAmount.plus(amount)
          args.push(amount)
        } else {
        }
      } catch (error: any) {
        errors += `Line ${i + 1}: ${error.message}\n`
      }
    })

    // Stop if there are errors
    if (errors) {
      showToast(errors, 'error')
      return
    }

    const value = payment.isEgld() ? payment.amountAsBigInteger : 0
    const tokenPayments = payment.isEgld() ? [] : [payment]

    app.requestProposalAction(
      XBulkConfig.ContractAddress(app.config.network),
      useSameAmount ? XBulkConfig.Endpoints.BulkSendSameAmount : XBulkConfig.Endpoints.BulkSend,
      value,
      args,
      tokenPayments
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center space-x-4 py-4 mb-4">
        <Switch
          label="Use the same amount for each transaction"
          checked={useSameAmount}
          onChange={(val) => setUseSameAmount(val)}
        />
        <span className="text-xl text-gray-700 dark:text-gray-200">Use the same amount for each transaction</span>
      </div>

      {useSameAmount ? (
        <>
          <label htmlFor="recipient" className="text-xl text-gray-700 dark:text-gray-200">
            Select the token and amount you want to send:
          </label>
          <PaymentSelector
            config={app.config.walletConfig}
            entity={app.config.entity}
            permissions={[]}
            onSelected={(val) => setPayment(val)}
            className="mb-4 mt-2"
          />
        </>
      ) : (
        <>
          <label htmlFor="recipient" className="text-xl text-gray-700 dark:text-gray-200">
            Select the token you want to send:
          </label>
          <PaymentSelector
            config={app.config.walletConfig}
            entity={app.config.entity}
            permissions={[]}
            onSelected={(val) => setPayment(val)}
            className="mb-4 mt-2"
          />
        </>
      )}

      <label htmlFor="transactions" className="text-xl text-gray-700 dark:text-gray-200 mb-4">
        Enter the list of the transactions:
      </label>
      <Textarea
        placeholder={'address' + (useSameAmount ? '' : ';amount')}
        className="mb-4 mt-2"
        style={{ height: '180px' }}
        value={userTxList}
        onChange={(val) => setUserTxList(val)}
      />

      {/**
       * TODO: Add File Input
       */}

      <Button color="blue" className="block w-full" disabled={!isValid()} submit>
        Add Bulk transaction
      </Button>
    </form>
  )
}
