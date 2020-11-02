require('dotenv').config()
const moment = require('moment-timezone')
const contracts = require('./contracts')
const web3 = contracts.web3

const { ChainId, Fetcher, WETH, Route } = require('@uniswap/sdk')
const chainId = ChainId.MAINNET

// SERVER CONFIG

let priceMonitor
let monitoringPrice = false

async function monitorPrice() {
  if (monitoringPrice) {
    return
  }

  console.log('Checking prices...')
  monitoringPrice = true

  try {
    // ADD YOUR CUSTOM TOKEN PAIRS HERE!!!

    await checkPairV2({
      inputTokenSymbol: 'WETH',
      inputTokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      outputTokenSymbol: 'MKR',
      outputTokenAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
      inputAmount: web3.utils.toWei('1', 'ETHER'),
    })

    await checkPairV2({
      inputTokenSymbol: 'WETH',
      inputTokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      outputTokenSymbol: 'DAI',
      outputTokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
      inputAmount: web3.utils.toWei('1', 'ETHER'),
    })

    await checkPairV2({
      inputTokenSymbol: 'WETH',
      inputTokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      outputTokenSymbol: 'KNC',
      outputTokenAddress: '0xdd974d5c2e2928dea5f71b9825b8b646686bd200',
      inputAmount: web3.utils.toWei('1', 'ETHER'),
    })

    await checkPairV2({
      inputTokenSymbol: 'WETH',
      inputTokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      outputTokenSymbol: 'LINK',
      outputTokenAddress: '0x514910771af9ca656af840dff83e8264ecf986ca',
      inputAmount: web3.utils.toWei('1', 'ETHER'),
    })
  } catch (error) {
    console.error(error)
    monitoringPrice = false
    clearInterval(priceMonitor)
    return
  }

  monitoringPrice = false
}

async function checkPair(args) {
  const {
    inputTokenSymbol,
    inputTokenAddress,
    outputTokenSymbol,
    outputTokenAddress,
    inputAmount,
  } = args

  const exchangeAddress = await contracts.uniswapFactoryContract.methods
    .getExchange(outputTokenAddress)
    .call()

  const uniswapResult = await contracts
    .exchangeContract(exchangeAddress)
    .methods.getEthToTokenInputPrice(inputAmount)
    .call()
  let kyberResult = await contracts.kyberRateContract.methods
    .getExpectedRate(inputTokenAddress, outputTokenAddress, inputAmount, true)
    .call()

  console.table([
    {
      'Input Token': inputTokenSymbol,
      'Output Token': outputTokenSymbol,
      'Input Amount': web3.utils.fromWei(inputAmount, 'Ether'),
      'Uniswap Return': web3.utils.fromWei(uniswapResult, 'Ether'),
      'Kyber Expected Rate': web3.utils.fromWei(
        kyberResult.expectedRate,
        'Ether'
      ),
      'Kyber Min Return': web3.utils.fromWei(kyberResult.slippageRate, 'Ether'),
      Timestamp: moment().tz('America/Chicago').format(),
    },
  ])
}

async function checkPairV2(args) {
  const {
    inputTokenSymbol,
    inputTokenAddress,
    outputTokenSymbol,
    outputTokenAddress,
    inputAmount,
  } = args

  const inputToken = await Fetcher.fetchTokenData(chainId, inputTokenAddress)
  const outputToken = await Fetcher.fetchTokenData(chainId, outputTokenAddress)
  const pair = await Fetcher.fetchPairData(inputToken, outputToken)
  const route = new Route([pair], inputToken, outputToken)

  let kyberResult = await contracts.kyberRateContract.methods
    .getExpectedRate(inputTokenAddress, outputTokenAddress, inputAmount, true)
    .call()

  console.table([
    {
      'Input Token': inputTokenSymbol,
      'Output Token': outputTokenSymbol,
      'Input Amount': web3.utils.fromWei(inputAmount, 'Ether'),
      'UniswapV2 Return': route.midPrice.toSignificant(6),
      'Kyber Expected Rate': web3.utils.fromWei(
        kyberResult.expectedRate,
        'Ether'
      ),
      'Kyber Min Return': web3.utils.fromWei(kyberResult.slippageRate, 'Ether'),
      Timestamp: moment().tz('America/Chicago').format(),
    },
  ])
}

// Check markets every n seconds
const POLLING_INTERVAL = process.env.POLLING_INTERVAL || 3000 // 3 Seconds
priceMonitor = setInterval(async () => {
  await monitorPrice()
}, POLLING_INTERVAL)
const init = async () => {
  await checkPairV2({
    inputTokenSymbol: 'WETH',
    inputTokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    outputTokenSymbol: 'DAI',
    outputTokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
    inputAmount: web3.utils.toWei('1', 'ETHER'),
  })
}

// init()
