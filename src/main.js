import './style.css'


const inputEl = document.getElementById("search");
const surrencyEl = document.getElementById("currency");
const limitel = document.getElementById("limit");
const mensajeEl = document.getElementById("mensajes");
const tbodyEl = document.getElementById("crypto-body");
const marketCapEl = document.getElementById("market-cap");
const volume24hEl = document.getElementById("24h-volume");
const btcDomEl = document.getElementById("btc-dominance");

let state={
  coins:[],
  global: null,
  query: "",
  currency: "usd",
  limit: 50,
  status: "idle",
  loading: false,
  error: null,
  lastUpdated: null
}


function buildCoinsUrl(state) {
  const baseUrl = "https://api.coingecko.com/api/v3/coins/markets";

  const params = new URLSearchParams({
    vs_currency: state.currency,
    order: "market_cap_desc",
    per_page: state.limit,
    page: 1,
    sparkline: false,
    price_change_percentage: "24h"
  });

  return `${baseUrl}?${params.toString()}`;
}

function formatCurrency(value, currency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase()
  }).format(value);
}


function setMessage(message, type= "info"){
  mensajeEl.textContent = message;
  mensajeEl.className = `msg ${type}`
}

function setLoading(isLoading){
  inputEl.disabled = isLoading;
  surrencyEl.disabled = isLoading;
  limitel.disabled = isLoading;
}

function renderStats(global) {
  if (!global) {
    marketCapEl.textContent = "Market Cap: --";
    volume24hEl.textContent = "24h Volume: --";
    btcDomEl.textContent = "BTC Dominance: --";
    return;
  }

  const marketCap = global.total_market_cap?.[state.currency];
  const volume24h = global.total_volume?.[state.currency];
  const btcDom = global.market_cap_percentage?.btc;

  marketCapEl.textContent = `Market Cap: ${typeof marketCap === "number" ? formatCurrency(marketCap, state.currency) : "--"}`;
  volume24hEl.textContent = `24h Volume: ${typeof volume24h === "number" ? formatCurrency(volume24h, state.currency) : "--"}`;
  btcDomEl.textContent = `BTC Dominance: ${typeof btcDom === "number" ? formatPercent(btcDom) : "--"}`;
}

function formatPercent(value) {
  return `${value.toFixed(2)}%`;
}

function renderCoins(coins) {
  tbodyEl.innerHTML = "";

  coins.forEach((coin) => {
    const change24h =
      typeof coin.price_change_percentage_24h === "number"
        ? formatPercent(coin.price_change_percentage_24h)
        : "N/A";

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${coin.market_cap_rank ?? "-"}</td>
      <td>
        <div class="coin-cell">
          <img src="${coin.image}" alt="${coin.name}" width="20" height="20" />
          <span>${coin.name} <small>(${coin.symbol?.toUpperCase()})</small></span>
        </div>
      </td>
      <td>${formatCurrency(coin.current_price, state.currency)}</td>
      <td>${change24h}</td>
      <td>${formatCurrency(coin.market_cap, state.currency)}</td>
    `;

    tbodyEl.appendChild(row);
  });
}

async function fetchGlobal() {
  const url = "https://api.coingecko.com/api/v3/global";

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} (global)`);

    const json = await response.json();

    state.global = json.data ?? null;

    renderStats(state.global);
  } catch (err) {
    
    state.global = null;
    renderStats(null);
    
  }
}

async function loadData() {
  await Promise.all([fetchGlobal(), fetchCoins()]);
}


async function fetchCoins() {
  setLoading(true);
  state.error = null;
  state.status = "loading";
  setMessage("Cargando monedas...", "info");

  const url = buildCoinsUrl(state);
  const API_KEY = import.meta.env.VITE_COINGECKO_KEY;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    state.coins = data;
    renderCoins(state.coins);
    state.lastUpdated = new Date().toISOString();
    state.status = "success";
    setMessage("Datos cargados correctamente", "success");

  } catch (err) {
    state.error = err.message;
    state.status = "error";
    setMessage(`Error: ${err.message}`, "error");
  } finally {
    state.loading = false;
    setLoading(false);
  }
}

function applyFilters(){
  const q = state.query;
  if(!q) return renderCoins(state.coins);
  const filtered = state.coins.filter((c)=> c.name.toLowerCase().includes(q)
  || c.symbol.toLowerCase().includes(q)
  );
  renderCoins(filtered);
}

function bindEvents(){
  inputEl.addEventListener("input", (e)=>{
    state.query = inputEl.value.trim().toLowerCase();
    applyFilters();
  });
  surrencyEl.addEventListener("change", (e)=>{
    state.currency = surrencyEl.value;
    loadData();
  });
  limitel.addEventListener("change", (e)=>{
    state.limit = Number(limitel.value);
    fetchCoins();
  });
}



bindEvents();

loadData();













