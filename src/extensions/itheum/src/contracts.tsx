import React from 'react'
import { Config } from './config'
import { ProposalAction } from '@peerme/core-ts'
import { ClaimActionPreview } from './previews/ClaimActionPreview'
import { AddOfferActionPreview } from './previews/AddOfferActionPreview'
import { AcceptOfferActionPreview } from './previews/AcceptOfferActionPreview'
import { Network, ExtensionScInfo, ExtensionConfig } from '../../../shared/types'

const getClaimsContractAddress = (network: Network) => {
  if (network === 'devnet') return 'erd1qqqqqqqqqqqqqpgqd8vswwygp8sgmm6rd2x4rfgxjvv4fa93fsxsks7y6q'
  if (network === 'testnet') return '#'
  return 'erd1qqqqqqqqqqqqqpgqnsmrn5q08eqth3fy8el87sgdj0mkhwdwl2jqnf59cg'
}

const getMarketContractAddress = (network: Network) => {
  if (network === 'devnet') return 'erd1qqqqqqqqqqqqqpgqrwtl03qdxjv2e52ta5ry4rg0z7l95neqfsxsp4y4xh'
  if (network === 'testnet') return '#'
  return 'erd1qqqqqqqqqqqqqpgqay2r64l9nhhvmaqw4qanywfd0954w2m3c77qm7drxc'
}

export const Contracts = (config: ExtensionConfig): ExtensionScInfo => ({
  // Claims
  Claim: {
    Address: getClaimsContractAddress(config.network),
    Endpoint: 'claim',
    ActionPreview: (action: ProposalAction) => <ClaimActionPreview action={action} />,
  },
  ViewClaimWithDate: {
    Address: getClaimsContractAddress(config.network),
    Endpoint: 'viewClaimWithDate',
    AbiUrl: Config.Abis.Claims,
  },
  // Market
  AddOffer: {
    Address: getMarketContractAddress(config.network),
    Endpoint: 'addOffer',
    AbiUrl: Config.Abis.Marketplace,
    ActionPreview: (action: ProposalAction) => <AddOfferActionPreview action={action} />,
  },
  AcceptOffer: {
    Address: getMarketContractAddress(config.network),
    Endpoint: 'acceptOffer',
    AbiUrl: Config.Abis.Marketplace,
    ActionPreview: (action: ProposalAction) => <AcceptOfferActionPreview action={action} config={config} />,
  },
  ViewMarketRequirements: {
    Address: getMarketContractAddress(config.network),
    Endpoint: 'viewRequirements',
    AbiUrl: Config.Abis.Marketplace,
  },
  ViewOffer: {
    Address: getMarketContractAddress(config.network),
    Endpoint: 'viewOffer',
    AbiUrl: Config.Abis.Marketplace,
  },
  ViewPagedOffers: {
    Address: getMarketContractAddress(config.network),
    Endpoint: 'viewPagedOffers',
    AbiUrl: Config.Abis.Marketplace,
  },
})
