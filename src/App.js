import "./App.css";
import React, { useState, useEffect } from "react";
import axios from "axios";

const dexAddresses = {
  'uni':"https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2",
  'pancake':"https://api.thegraph.com/subgraphs/name/pancakeswap/exchange",
  'sushi':"https://api.thegraph.com/subgraphs/name/croco-finance/sushiswap",
  'mDex':"https://graph.mdex.cc/subgraphs/name/mdex/swap",
  'balancer':"https://api.thegraph.com/subgraphs/name/balancer-labs/balancer",
  'bancor':"https://api.thegraph.com/subgraphs/name/blocklytics/bancor"
};
const cexIds = [
  'binance',
  'kraken',
  'gdax',
  'bitfinex',
  'huobi'
];

const fetchDexData = async (address,days) => {
  let startDate = new Date();
  startDate.setDate(startDate.getDate()-days);
  try {
    let res = await axios.post(address, {
        operationName: `uniswapDayDatas`,
        query: `query uniswapDayDatas($startTime: Int!, $skip: Int!) {
            uniswapDayDatas(first: 1000, skip: $skip, where: {date_gt: $startTime}, orderBy: date, orderDirection: asc) {
              id
              date
              totalVolumeUSD
              dailyVolumeUSD
              dailyVolumeETH
              totalLiquidityUSD
              totalLiquidityETH
              txCount
            }
          }
          
            `,
        variables: {
          startTime: Math.round(startDate.getTime()/1000),
          skip: 0
        }
      });
      console.log(res.data.data);
      return res.data.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

const fetchCexData = async(cexName,days) => {
  try{
    let res = await axios.get(`https://api.coingecko.com/api/v3/exchanges/${cexName}/volume_chart?days=${days}`);
    console.log(res.data);
    return res.data;
  } catch(err) {
    console.log(err);
    return null;
  }
};

const fetchSwaps = async(address, days) => {
  let startDate = new Date();
  startDate.setDate(startDate.getDate()-days);

  try {
    let res = await axios.post(address, {
        operationName: `swapData`,
        query: `query swapData($startTime: Int!, $skip: Int!){
          swaps(first: 1000, skip: $skip, where: {timestamp_gt:$startTime}, orderBy: timestamp, orderDirection: asc) {
            value,
            feeValue,
            timestamp
          }  
        }
            `,
        variables: {
          startTime: Math.round(startDate.getTime()/1000),
          skip: 0
        }
      });
      console.log(res.data.data);
      return res.data.data;
  } catch (error) {
    console.log(error);
    return null;
  }
}

export default function App() {
  const [data, setData] = useState(null);
  const [selected, select] = useState('uni');
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(720);
  const [fetching, setFetching] = useState(true);
  const handleClick = async () => {
    const blob = new Blob([JSON.stringify(data[selected])],{type:'application/json'});
    const href = await URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download =`${selected}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  useEffect(() => {
    const fetchData = async() => {
      let uniData = await fetchDexData(dexAddresses['uni'],days);
      let sushiData = await fetchDexData(dexAddresses['sushi'],days);
      let pancakeData = await fetchDexData(dexAddresses['pancake'],days);
      let mDexData = await fetchDexData(dexAddresses['mDex'],days);
      let balancerData = await fetchSwaps(dexAddresses['balancer'],days);
      let binanceData = await fetchCexData('binance',days);
      let krakenData = await fetchCexData('kraken',days);
      let coinbaseData = await fetchCexData('gdax',days);
      let bitfinexData = await fetchCexData('bitfinex',days);
      let huobiData = await fetchCexData('huobi',days);
      setData({
        'uni':uniData,
        'sushi':sushiData,
        'pancake':pancakeData,
        'mDex':mDexData,
        'balancer':balancerData,
        'binance':binanceData,
        'kraken':krakenData,
        'gdax':coinbaseData,
        'bitfinex':bitfinexData,
        'huobi':huobiData
      });
      setLoading(false);
      setFetching(false);
    }
    fetchData();
  },[]);

  const refetchDex = async() => {
    setFetching(true);
    let newData = data;
    for(const key of Object.keys(dexAddresses)) {
      newData[key] = await fetchDexData(dexAddresses[key],days);
    }
    setData(newData);
    setFetching(false);
  }

  const refetchCex = async() => {
    setFetching(true);
    let newData = data;
    for(const id of cexIds) {
      newData[id] = await fetchCexData(id,days);
    }
    setData(newData);
    setFetching(false);
  }

  if(loading) {
    return <div className="loader">Loading...</div>
  }

  return (
    <div className="App">
      <div className="selectors">
        <span className="row-span">
          <label>CEX # of days:</label>
          <input type="number" className="row" value={days} onChange={e => setDays(parseInt(e.target.value,10))}/>
        </span>
        <span className="row-span">
          <label>Exchange:</label>
          <select name="data-selecet" id="data-select" value={selected} className="data-selector" onChange={(e) => select(e.target.value)} required>
            <option value="dex" disabled>DEX</option>
            <option value="uni">UniSwap</option>
            <option value="sushi">SushiSwap</option>
            <option value="pancake">PancakeSwap</option>
            <option value="mDex">mDex</option>
            <option value="balancer">Balancer</option>
            <option value="cex" disabled>CEX</option>
            <option value="binance">Binance</option>
            <option value="kraken">Kraken</option>
            <option value="gdax">Coinbase Pro</option>
            <option value="bitfinex">Bitfinex</option>
            <option value="huobi">Huobi Global</option>
          </select>
        </span>
      </div>
      <h2>Preview</h2>
      <p className="preview">
        {JSON.stringify(data[selected], 2, null).length > 1000
          ? JSON.stringify(data[selected], 2, null).substr(0, 1000)
          : JSON.stringify(data[selected], 2, null)}
      </p>
      <div className='refetch-btns'>
        <button className={`btn btn--large btn--primary ${fetching ? 'dis' : 'en'}`} onClick={refetchDex} disabled={fetching}> Refetch DEX </button>
        <button className={`btn btn--large btn--primary ${fetching ? 'dis' : 'en'}`} onClick={refetchCex} disabled={fetching}> Refetch CEX </button>
      </div>
      <button className='btn btn--large btn--primary en' onClick={handleClick}> Download </button>
    </div>
  );
}

