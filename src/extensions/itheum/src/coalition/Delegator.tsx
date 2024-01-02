import clsx from 'clsx'
import collect from 'collect.js'
import React, { useEffect, useState } from 'react'
import { ScInfo, useScQuery } from '@peerme/core-ts'
import { useApp } from '../../../../shared/hooks/useApp'
import { AppContextValue } from '../../../../shared/types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { fetchDataNftsByIds, fetchDataNftsOfAccount } from '../api'
import { Contracts, getCoalitionContractAddress } from '../contracts'
import { faLock, faLockOpen } from '@fortawesome/free-solid-svg-icons'
import { Button, Select, SelectOption, Theme, Tooltip } from '@peerme/web-ui'
import { toNftId, toTypedAggregatorAppInfo, toTypedAggregatorDelegation } from '../helpers'
import { AggregatorAppInfo, AggregatorDelegation, CoalitionInfo, DataNftMetadata } from '../types'
import {
  Address,
  BytesValue,
  Interaction,
  AddressValue,
  TokenTransfer,
  SmartContract,
  ContractFunction,
  U64Value,
} from '@multiversx/sdk-core'

type Props = {
  info: CoalitionInfo
  className?: string
}

export function Delegator(props: Props) {
  const app = useApp()
  const [appInfo, setAppInfo] = useState<AggregatorAppInfo | null>(null)
  const [selectedDelegate, setSelectedDelegate] = useState<Record<string, DataNftMetadata[]>>({})
  const [selectedUndelegate, setSelectedUndelegate] = useState<Record<string, DataNftMetadata[]>>({})
  const [delegations, setDelegations] = useState<AggregatorDelegation[]>([])
  const [userCollections, setUserCollections] = useState<Record<string, DataNftMetadata[]>>({})
  const [category, setCategory] = useState<string | null>(null)
  const hasSelectedDelegate = Object.keys(selectedDelegate).length > 0
  const hasSelectedUndelegate = Object.keys(selectedUndelegate).length > 0

  const appInfoScInfo: ScInfo = { ...Contracts(app.config).GetAppInfo, Address: props.info.aggregator }
  const appInfoScQuery = useScQuery(app.config.walletConfig, appInfoScInfo)

  const delegationsScInfo: ScInfo = { ...Contracts(app.config).GetDelegationsByUser, Address: props.info.aggregator }
  const delegationsQuery = useScQuery(app.config.walletConfig, delegationsScInfo)

  // fetch aggregator data
  useEffect(() => {
    if (!app.config.user) return
    appInfoScQuery.query([props.info.aggregatorApp]).then((data) => {
      const value = data.firstValue?.valueOf()
      if (!value) return
      setAppInfo(toTypedAggregatorAppInfo(value))
    })
    delegationsQuery.query([props.info.aggregatorApp, app.config.user.address]).then(async (data) => {
      const values: AggregatorDelegation[] = data.firstValue?.valueOf()?.map(toTypedAggregatorDelegation) || []
      const populated = await getPopulatedDelegations(app, values)
      setDelegations(populated)
    })
  }, [app.config.user])

  useEffect(() => {
    if (!appInfo) return
    fetchDataNftsOfAccount(app, appInfo?.dataCollections).then((data) => {
      const allowed = collect(data).filter((x) => appInfo.dataCollections.includes(x.collection))
      setUserCollections(allowed.groupBy('collection').all() as any)
    })
  }, [appInfo])

  const toggleDelegate = (nft: DataNftMetadata) => {
    setSelectedUndelegate({})
    if (!selectedDelegate[nft.collection]) {
      setSelectedDelegate({ ...selectedDelegate, [nft.collection]: [nft] })
    } else if (isSelectedDelegate(nft)) {
      setSelectedDelegate({
        ...selectedDelegate,
        [nft.collection]: selectedDelegate[nft.collection].filter((d) => d.nonce !== nft.nonce),
      })
    } else {
      setSelectedDelegate({ ...selectedDelegate, [nft.collection]: [...selectedDelegate[nft.collection], nft] })
    }
  }

  const toggleUndelegate = (nft: DataNftMetadata) => {
    setSelectedDelegate({})
    if (!selectedUndelegate[nft.collection]) {
      setSelectedUndelegate({ ...selectedUndelegate, [nft.collection]: [nft] })
    } else if (isSelectedUndelegate(nft)) {
      setSelectedUndelegate({
        ...selectedUndelegate,
        [nft.collection]: selectedUndelegate[nft.collection].filter((d) => d.nonce !== nft.nonce),
      })
    } else {
      setSelectedUndelegate({ ...selectedUndelegate, [nft.collection]: [...selectedUndelegate[nft.collection], nft] })
    }
  }

  const isSelectedDelegate = (nft: DataNftMetadata) =>
    !!selectedDelegate[nft.collection]?.find((d) => d.nonce === nft.nonce)

  const isSelectedUndelegate = (nft: DataNftMetadata) =>
    !!selectedUndelegate[nft.collection]?.find((d) => d.nonce === nft.nonce)

  const handleDelegate = () => {
    if (!app.config.user || !category || !hasSelectedDelegate) return
    const amount = 1 // default for NFTs, and for SFTs only 1 is allowed since data stream is equal
    const nfts = Object.values(selectedDelegate).flat(1)
    const transferables = nfts.map((nft) => TokenTransfer.semiFungible(nft.collection, nft.nonce, amount))
    const contract = new SmartContract({ address: Address.fromBech32(getCoalitionContractAddress(app.config.network)) })
    const tx = new Interaction(contract, new ContractFunction('grantAccess'), [
      new AddressValue(Address.fromBech32(app.config.entity.address)),
      BytesValue.fromUTF8(category),
    ])
      .withChainID(app.config.walletConfig.ChainId)
      .withSender(new Address(app.config.user.address))
      .withGasLimit(50_000_000)
      .withMultiESDTNFTTransfer(transferables)
      .buildTransaction()
    app.requestUserAction(tx)
  }

  const handleUnelegate = () => {
    if (!app.config.user || !hasSelectedUndelegate) return
    const nfts = Object.values(selectedUndelegate).flat(1)
    const nftsArg = nfts.map((nft) => [BytesValue.fromUTF8(nft.collection), new U64Value(nft.nonce)]).flat(1)
    const contract = new SmartContract({ address: Address.fromBech32(getCoalitionContractAddress(app.config.network)) })
    const tx = new Interaction(contract, new ContractFunction('revokeAccess'), [
      new AddressValue(Address.fromBech32(app.config.entity.address)),
      ...nftsArg,
    ])
      .withChainID(app.config.walletConfig.ChainId)
      .withSender(new Address(app.config.user.address))
      .withGasLimit(50_000_000)
      .buildTransaction()
    app.requestUserAction(tx)
  }

  return (
    <div className={props.className}>
      <h2 className="mb-2">Delegate Data to {app.config.entity.name}</h2>
      <p className="mb-4">Grant access to the Data Coalition to use your data. You can revoke access at any time.</p>
      <ul className="space-y-4 overflow-y-auto" style={{ maxHeight: '80vh' }}>
        {Object.entries(userCollections).map(([collection, nfts]) => (
          <li key={collection} className={clsx('px-6 py-4', Theme.Background.Subtle, Theme.BorderRadius.Subtle)}>
            <h3 className="mb-2">
              <span>{collection.split('-')[0]}</span>
              <span className="text-base opacity-60">-{collection.split('-')[1]}</span>
            </h3>
            <ul className="flex flex-wrap gap-2">
              {nfts.map((nft) => (
                <li key={nft.nonce}>
                  <_Delegatable nft={nft} selected={isSelectedDelegate(nft)} onClick={() => toggleDelegate(nft)} />
                </li>
              ))}
              {delegations.map((nft) => (
                <li key={nft.nonce}>
                  <_Delegatable
                    nft={nft.metadata!}
                    selected={isSelectedUndelegate(nft.metadata!)}
                    delegated
                    onClick={() => toggleUndelegate(nft.metadata!)}
                  />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      {hasSelectedDelegate && (
        <div className="mt-4">
          <label
            htmlFor="category"
            className="mb-2 pl-1 text-base sm:text-lg text-gray-800 dark:text-gray-200 md:text-xl"
          >
            Category
          </label>
          <Select
            id="category"
            options={toCategoryOptions(props.info.categories)}
            onSelect={(val) => setCategory(val)}
          />
        </div>
      )}
      {hasSelectedDelegate && (
        <Button color="blue" onClick={handleDelegate} className="block w-full mt-4" disabled={!category}>
          Delegate
        </Button>
      )}
      {hasSelectedUndelegate && (
        <Button color="blue" onClick={handleUnelegate} className="block w-full mt-4">
          Undelegate
        </Button>
      )}
    </div>
  )
}

function _Delegatable(props: { nft: DataNftMetadata; delegated?: boolean; selected?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={props.onClick} className="relative block">
      <Tooltip tip={`${props.nft.title} (Nonce: ${props.nft.nonce})`}>
        <img
          src={props.nft.nftImgUrl}
          alt={props.nft.title}
          className={clsx(
            'duration-400 h-16 w-16 transform rounded-lg transition active:translate-y-1 cursor-pointer hover:shadow-lg',
            props.delegated ? 'opacity-50 grayscale' : '',
            props.selected ? 'shadow-xl' : 'opacity-25 shadow-inner'
          )}
        />
      </Tooltip>
      {props.delegated && (
        <span className="absolute inset-0 flex justify-center pt-4">
          {props.selected ? (
            <FontAwesomeIcon icon={faLockOpen} className="text-2xl text-yellow-400 opacity-75" />
          ) : (
            <FontAwesomeIcon icon={faLock} className="text-2xl text-green-400 opacity-75" />
          )}
        </span>
      )}
    </button>
  )
}

const getPopulatedDelegations = async (app: AppContextValue, delegations: AggregatorDelegation[]) => {
  const nftIds = delegations.map((d) => toNftId(d.collection, d.nonce))
  const nftsMetadata = await fetchDataNftsByIds(app, nftIds)
  delegations.forEach((d) => {
    d.metadata = nftsMetadata.find((n) => n.collection === d.collection && n.nonce == d.nonce) || null
  })
  return delegations.filter((d) => !!d.metadata)
}

const toCategoryOptions = (categories: string[]): SelectOption[] => {
  const options = categories.map((category) => ({
    value: category,
    name: category,
  }))

  return [{ value: '-', name: 'Select Category' }, ...options]
}
