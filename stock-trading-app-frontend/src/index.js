function plotData(prices,ticker){
  let layout = {
    title: {
      text:`${ticker}`,
      font: {
        // family: 'Courier New, monospace',
        size: 24
      }
    }
  }
  Plotly.newPlot('chart',[{
      x:[getTimes(prices)][0].reverse(),
      y:[getPrices(prices)][0].reverse(),
      type:'scatter',
      connectgaps: false,
      transforms: [{
        type: 'filter',
        target: 'x',
        operation: '!=',
        value: null
      }]
  }],layout);
  console.log(getTimes(prices))
  console.log(getPrices(prices))
}

function getTimes(prices){
  let times = prices.map(function(obj){
    return obj.timestamp
  })
  return times.filter(filterOutGaps) //returns the array of timestamps, to be used in initial plot creation
}

function filterOutGaps(timestamp)  {
  var date = new Date(timestamp);
  var hour = date.getHours();

  return (hour<= 8 && hour>16 ) ? null : timestamp;
}

function getPrices(prices){
  let ticks = prices.map(function(obj){
    return obj.price
  })
  return ticks //returns array of prices, to be used in initial plot creation
}


var cnt = 0 //to be used in addNewPrices(), which is called in updateChart()
const MarketOpen = '093000'
const MarketClose = '160000'


function getNewPrice(prices){
  let last = prices[0]
  let lastPrice=last.price
  let lastTime=last.timestamp
  return last //return last object within the api
}

async function addNewPrices(){
  console.log(ticker.value)
  let newLink=`https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${ticker.value}&interval=1min&apikey=ZREIW6HJ1LEBYBQT`;
  const newResp = await fetch(newLink)
  const newJson = await newResp.json()
  const newTimeSeries= await newJson['Time Series (1min)']
  let newPrices= await Object.keys(newTimeSeries).map(function(key){
    return Object.assign({},{
      timestamp: key,
      price: newTimeSeries[key]["4. close"]
    })
  })
  console.log('new price added')
  console.log(newPrices)
  console.log(getNewPrice(newPrices).timestamp)
  console.log(getNewPrice(newPrices).price)

  updateRealTimePrice(getNewPrice(newPrices).price) //to update realTimePrice div
  //update unrealized profit here
  Plotly.extendTraces('chart',{ x:[[getNewPrice(newPrices).timestamp]], y:[[getNewPrice(newPrices).price]]}, [0]);
  cnt++;
  if(cnt > 500) {
      Plotly.relayout('chart',{
          xaxis: {
              range: [cnt-500,cnt] //setting the range of x-axis
          }
      });
  }
}



function updateChart(){
  let current=time()
  if (current>MarketOpen && current<MarketClose){
    addNewPrices()
  }
}

function updateRealTimePrice(price){ //to be initiated once ticker is submitted
  console.log('inside updateRealTimePrice')
  let realTimePrice=document.getElementById('real-time-price')
  realTimePrice.innerText=`${ticker.value}: ${price}`
  //function to update innerText of realtimeprice div
  //leverage addNewPrices to prevent duplicating fetch requests
  updateUnrealized(price)
}

function updateUnrealized(price){
  if (!!document.getElementById('logout-button')){ //determine if user is logged in
    let ticker=document.getElementById('ticker').value
    let username=document.querySelector('#logged-in-user').innerText.split(' ')[1]
    let update=new Position(username,ticker,price)
    update.postUpdatedPrice()
  }
}

async function getLongAPI(ticker){
  let longLink=`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&outputsize=compact&apikey=ZREIW6HJ1LEBYBQT`;
  const longResp = await fetch(longLink)
  const longJson = await longResp.json()
  const longTimeseries= await longJson['Time Series (Daily)']
  let longPrices= await Object.keys(longTimeseries).map(function(key){
    return Object.assign({},{
      timestamp: key,
      price: longTimeseries[key]["4. close"]
    })
  })
  console.log('inside getAPI')
  console.log(getNewPrice(longPrices).timestamp)
  plotData(longPrices,ticker)
  addRealTimePriceDiv(longPrices)
  setInterval(updateChart,60000) //setting interval here to call updateRealTimePrice which sits within updateChart
}

async function getAPI(ticker){
  let link=`https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${ticker}&interval=1min&outputsize=compact&apikey=ZREIW6HJ1LEBYBQT`;
  const resp = await fetch(link)
  const json = await resp.json()
  const timeseries= await json['Time Series (1min)']
  console.log(timeseries)
  let prices= await Object.keys(timeseries).map(function(key){
    return Object.assign({},{
      timestamp: key,
      price: timeseries[key]["4. close"]
    })
  })
  console.log('inside getAPI')
  console.log(getNewPrice(prices).timestamp)
  plotData(prices,ticker)
}

document.getElementById('insert-ticker').addEventListener('submit',function(event){
  let ticker=document.getElementById('ticker').value
  getLongAPI(ticker)
  setDivTicker(ticker) //adding ticker attribute to the chart div
  displayButtons() //create toggle buttons for 5m and intraday prices
  if (!!document.getElementById('logout-button')){
    addBuySellBtns()
  }
  event.preventDefault()
})

function addBuySellBtns(){
  if (!document.getElementById('buy-btn')){ //if buttons already exist then we need not add them again
    let elem=document.getElementById('buy-sell-btns')
    elem.innerHTML+=`<button id='buy-btn' class='buy-sell'>Buy</button>
    <button id='sell-btn' class='buy-sell'>Sell</button>
    `
  }
}

function setDivTicker(ticker){
  let chartDiv=document.querySelector('#chart')
  chartDiv.setAttribute("ticker",`${ticker}`)
}

function addRealTimePriceDiv(prices){
  console.log('addRealTimePriceDiv running')
  let last=getNewPrice(prices)
  let realTimePrice=document.getElementById('real-time-price')
  realTimePrice.innerText=`${ticker.value}: ${last.price}`
}

let body=document.querySelector('body')
body.addEventListener('click',function(event){
  if(event.target.id==='5m'){
    let ticker=document.getElementById('ticker').value
    getLongAPI(ticker)
  }else if(event.target.id==='intraday'){
    let ticker=document.getElementById('ticker').value
    getAPI(ticker)
    // setInterval(updateChart,40000)
    console.log('clicking on intraday')
  }
})

//create 5m button and intraday button to toggle chart format
//only set interval for updateChart if the intraday button is clicked on to render the intraday chart
//but in the background we should setInterval to update realtimeprices

function time() {
  let newdate = new Date();
  let seconds = modNumber(newdate.getSeconds());
  let minutes = modNumber(newdate.getMinutes());
  let hours = newdate.getHours() > 12 ? modNumber((newdate.getHours()-12)) : modNumber((newdate.getHours()+12))
  let current = `${hours}${minutes}${seconds}`
  return current
}

function modNumber(num){
  return num.toString().length===2 ? num.toString() : `0${num}`
}

//login function
function displayLogin(){
  if (!document.getElementById('login')){
    document.getElementById('user-login').innerHTML+=`
      <form id="login" action="http://localhost:3000/users" method="post">
        <label for="username">Username: </label>
        <input id="username" name="username">
        <input type="submit" value="Submit">
      </form>
    `
  }
}

function displayButtons(){
  if(!document.getElementById('5m')){ //condition to detect if the buttons have already been created
    document.getElementById('toggle-time').innerHTML+=`
    <button id='5m'>5 Months</button>
    <button id='intraday'>Intraday</button>
  `
  }
}

class User{
  constructor(username){
    this.username=username
  }

  postUser(){
    fetch("http://localhost:3000/users",{
      method:'POST',
      headers: {
        "Content-Type":"application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(this)
    })
    .then(resp=>resp.json())
    .then(user=>displayCashBalance(user))
  }
}

function displayCashBalance(user){
  let div=document.getElementById('cash')
  div.innerHTML+=`
  <label id="cash-balance">Cash Balance: ${user['cash_balance']}</label>
  <button id='deposit-cash'>Deposit</button>
  <button id='withdraw-cash'>Withdraw</button>
  `
}

let cashModal = document.querySelector(".cash-modal")
document.addEventListener('click',function(event){
  if (event.target.id==='deposit-cash'){
    //function to render deposit form
    cashTransferForm("Deposit")
  }else if(event.target.id==='withdraw-cash'){
    //function to render withdraw form
    cashTransferForm("Withdrawal")
  }
})

function cashTransferForm(direction){
  cashModal.style.display="block"
  let content=document.querySelector('.cash-modal-content')
  content.innerHTML=`
  <form action="#" method="POST" class="cash-transfer-form" id="${direction.toLowerCase()}-cash">
    <label for="transfer-amount">${direction} Amount (USD): </label>
    <input name="transfer-amount" type="number" id="transfer-amount">
    <input type="submit" value="Submit">
  </form>
  `
  addListenerToTransferForm()
}

function addListenerToTransferForm(){
  document.querySelector('.cash-transfer-form').addEventListener('submit',function(event){
    let username=document.querySelector('#logged-in-user').innerText.split(' ')[1]
    if(event.target.id==="deposit-cash"){
      let transfer= new Transfer(username,"deposit",document.getElementById('transfer-amount').value)
      transfer.postTransfer()
    }else if(event.target.id=="withdrawal-cash"){
      let transfer= new Transfer(username,"withdraw",document.getElementById('transfer-amount').value)
      transfer.postTransfer()
    }
    cashModal.style.display="none"
    event.preventDefault()
  })
}

class Transfer{
  constructor(username,direction,amount){
    this.username=username
    this.direction=direction
    this.amount=amount
  }

  postTransfer(){
    fetch("http://localhost:3000/users/update",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(this)
    })
    .then(resp=>resp.json())
    .then(json=>updateCashInDOM(json)) //reflect new cash balance in DOM
  }
}

function updateCashInDOM(user_json){
  let div=document.getElementById('cash-balance')
  div.innerText=`Cash Balance: ${Number(user_json.cash_balance).toFixed(2)}`
}


displayLogin()
document.getElementById('login').addEventListener('submit',function(event){
  console.log(this.parentElement)
  let username=document.getElementById('username').value
  let user=new User(username)
  user.postUser() //creating or finding user in the backend
  this.parentElement.innerHTML+=`<label id="logged-in-user">Account: ${username}   </label>`
  removeLoginForm()
  addLogoutButton()
  renderPortfolioView()
  event.preventDefault()
})

function removeLoginForm(){
  let elem = document.getElementById('login')
  elem.remove()
}

function addLogoutButton(){
  let elem=document.getElementById('user-login') //maybe place logout button elsewhere
  elem.innerHTML+="<button id='logout-button'>Logout</button>"
}

function renderPortfolioView(){ //render trading functions, portfolio view
  let username=document.querySelector('#logged-in-user').innerText.split(' ')[1]
  if (!!document.getElementById('ticker').value){
    addBuySellBtns()
  }
  fetch("http://localhost:3000/positions",{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({username: username})
  })
  .then(resp=>resp.json())
  .then(positionArray=>fetchLatestPrices(positionArray))
  .then(json=>createPositionTable(json))
}

function fetchLatestPrices(positionArray){ //note: there is a limit of 5 requests per minute where one request has to be sent per stock
  let username=document.querySelector('#logged-in-user').innerText.split(' ')[1]
  positionArray.forEach(pos=>{
    fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${pos.stock.ticker}&apikey=ZREIW6HJ1LEBYBQT`)
    .then(resp=>resp.json())
    .then(json=>updatePricesInBackend(username,pos.stock.ticker,json["Global Quote"]["05. price"]))
  })
  return positionArray //return in the end to be used by createPositionTable() in the next .then
}

function updatePricesInBackend(username,ticker,price){ //used in the fetchLatestPrices() above
  let position= new Position(username,ticker,price)
  position.updatePositionPrice()
}

function createPositionTable(array){ //array of position objects
  console.log(array)
  console.log('position table being created')
  let div=document.querySelector('#portfolio-positions')
  div.innerHTML+="<h3>Portfolio Positions</h3>"
  let table=document.createElement('table')
  table.innerHTML+=`
    <tr>
      <th>Ticker</th>
      <th>Latest Price</th>
      <th>Size</th>
      <th>Cost</th>
      <th>Value</th>
      <th>Unrealized Profit</th>
      <th>Realized Profit</th>
    </tr>
  `
  array.forEach(pos=>{
    table.innerHTML+=`
      <tr id=${pos.stock.ticker}-position-details>
        <td>${pos.stock.ticker}</td>
        <td id="${pos.stock.ticker}-price">${Number(pos.value/pos.size).toFixed(2)}</td>
        <td id="${pos.stock.ticker}-size">${pos.size}</td>
        <td id="${pos.stock.ticker}-cost">${Number(pos.cost).toFixed(2)}</td>
        <td id="${pos.stock.ticker}-value">${Number(pos.value).toFixed(2)}</td>
        <td id="${pos.stock.ticker}-unrealized-profit">${Number(pos.unrealized).toFixed(2)}</td>
        <td id="${pos.stock.ticker}-realized">${Number(pos.realized).toFixed(2)}</td>
      </tr>
    `
  })
  div.appendChild(table)
  createPieChart(array)
}

function createPieChart(array){ //array of position objects
  let tickers=array.map(pos=>pos.stock.ticker)
  let values=array.map(pos=>Number(pos.value))
  console.log(values)
  console.log(tickers)
  let data = [{
    values: values,
    labels: tickers,
    type: 'pie'
  }];

  let layout = {
    height: 400,
    width: 500
  };

  Plotly.newPlot('pie-chart', data, layout);

}

//CREATING MODAL

let modal = document.querySelector(".modal")
let closeBtn = document.querySelector(".close-btn")

document.getElementById('buy-sell-btns').addEventListener('click',function(event){
  if(event.target.className==='buy-sell'){
    modal.style.display='block'
    console.log(event.target.id)
    if(event.target.id==='buy-btn'){
      addStockTradeForm('Buy')
    }else if(event.target.id==='sell-btn'){
      addStockTradeForm('Sell')
    }
  }
})

let closeBtns=document.getElementsByClassName('close-btn')
for (let i=0; i<closeBtns.length;i++){
  closeBtns[i].addEventListener('click',function(){
    modal.style.display="none"
    cashModal.style.display="none"
  })
}
//
// closeBtns.forEach(btn=>{
//   btn.addEventListener('click',function(){
//     modal.style.display="none"
//     cashModal.style.display="none"
//   })
// })

// closeBtn.onclick = function() {
//   modal.style.display = "none";
// }

function addStockTradeForm(direction){
  let ticker=document.getElementById('ticker').value
  let modal=document.getElementsByClassName('modal-content')[0]
  let tradePrice=document.getElementById('real-time-price').innerText.split(' ')[1] //removing the "TICKER: " portion of the innerText
  modal.innerHTML=`
  <h3>${direction} ${ticker} at ${tradePrice} per share</h3>
  <form action=# method='POST' id='trader-order'>
    <label for="quantity">Number of Shares: </label>
    <input name='quantity' type="number" id='number-of-shares'>
    <input type="submit" value="Submit Order">
  </form>
  `
}

class Trade{
  constructor(ticker,username,price,direction,quantity){
    this.ticker=ticker
    this.username=username
    this.price=price
    this.direction=direction
    this.quantity=quantity
  }

  postTrade(){
    fetch("http://localhost:3000/trades",{
      method:'POST',
      headers: {
        "Content-Type":"application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(this) //use .then over here to update table contents and render new trade onto DOM
    })
    .then(resp=>resp.json())
    .then(json=>newTradeUpdateTable(json))
    .then(userjson=>updateCashInDOM(userjson))
    .then(updatePieChart)
  }
}

function newTradeUpdateTable(position){
  console.log('updating table after trade submitted')
  let ticker=position.stock.ticker
  if(!!document.getElementById(`${ticker}-size`)){
    let latest_price=document.getElementById(`${ticker}-price`)
    let size=document.getElementById(`${ticker}-size`)
    let cost=document.getElementById(`${ticker}-cost`)
    let value=document.getElementById(`${ticker}-value`)
    let unrealized=document.getElementById(`${ticker}-unrealized-profit`)
    let realized=document.getElementById(`${ticker}-realized`)
    latest_price.innerText=Number(position.value/position.size).toFixed(2)
    size.innerText=position.size
    cost.innerText=Number(position.cost).toFixed(2)
    value.innerText=Number(position.value).toFixed(2)
    unrealized.innerText=Number(position.unrealized).toFixed(2)
    realized.innerText=Number(position.realized).toFixed(2)
  }else{
    let table=document.querySelector('table')
    table.innerHTML+=`
      <tr id=${ticker}-position-details>
        <td>${ticker}</td>
        <td id="${ticker}-price">${Number(position.value/position.size).toFixed(2)}</td>
        <td id="${ticker}-size">${position.size}</td>
        <td id="${ticker}-cost">${Number(position.cost).toFixed(2)}</td>
        <td id="${ticker}-value">${Number(position.value).toFixed(2)}</td>
        <td id="${ticker}-unrealized-profit">${Number(position.unrealized).toFixed(2)}</td>
        <td id="${ticker}-realized">${Number(position.realized).toFixed(2)}</td>
      </tr>
    `
  }
  return position.user //to be used in updateCashInDOM()
}

class Position{//to be used in updateRealTimePrice
  constructor(username,ticker,price){
    this.username=username
    this.ticker=ticker
    this.price=price
  }

  postUpdatedPrice(){
    fetch("http://localhost:3000/positions/update",{
      method:'POST',
      headers: {
        "Content-Type":"application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(this)
    })
    .then(resp=>resp.json()) //retrieving the render json at the end of show
    .then(json=>updateUnrealizedAndValueInTable(json)) //now just need to replace this with a function to update unrealized profit on the DOM
  }

  updatePositionPrice(){ //just for updating the price and value in the backend but not rendering anything new on the HTML
    fetch("http://localhost:3000/positions/update",{
      method:'POST',
      headers: {
        "Content-Type":"application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(this)
    })
  }
}

function updateUnrealizedAndValueInTable(position){
  console.log('updating unrealized profit in table')
  let ticker=position.stock.ticker
  let unrealized=document.querySelector(`#${ticker}-unrealized-profit`)
  let value=document.querySelector(`#${ticker}-value`)
  unrealized.innerText=Number(position.unrealized).toFixed(2)
  value.innerText=Number(position.value).toFixed(2)
}

document.getElementsByClassName('modal-content')[0].addEventListener('submit',function(event){
  console.log('trade form submit button working')
  let ticker=document.querySelector('.modal-content h3').innerText.split(' ')[1]
  let direction=document.querySelector('.modal-content h3').innerText.split(' ')[0]
  let username=document.querySelector('#logged-in-user').innerText.split(' ')[1]
  let tradePrice=document.getElementById('real-time-price').innerText.split(' ')[1]
  let quantity=document.getElementById('number-of-shares').value
  let trade=new Trade(ticker,username,tradePrice,direction,quantity)
  trade.postTrade()
  modal.style.display="none"
  event.preventDefault()
})

function updatePieChart(){ //fetches json of all existing positions and creates new pie chart with them
  fetch("http://localhost:3000/positions")
  .then(resp=>resp.json())
  .then(json=>createPieChart(json))
}

//Creating news sidebar
function topNews(){
  let url = 'https://newsapi.org/v2/top-headlines?' +
          'country=us&' +
          'apiKey=93db96180ea548c082a15c7b1a985770';
  let req = new Request(url);
  fetch(url)
  .then(resp=>resp.json())
  .then(json=>addArticlesToNewsbar(json["articles"]))
}

function addArticlesToNewsbar(array){
  let bar=document.getElementById('news-column')
  let articles=document.getElementsByClassName('articles')
  while(articles[0]){
    articles[0].parentNode.removeChild(articles[0]);
  }
  array.forEach(article=>{
    bar.innerHTML+=`
      <div class="articles">
        <a href="${article.url}">${article.title}</a>
        <div class="article-des">${article.description}</div>
        <div class="published-time">Published at: ${new Date(article.publishedAt)}</div>
        <br>
      </div>
    `
  })
}

topNews() //initiate top news from the moment the page is opened

let countries={
  "United Arab Emirates":"ae",
  "Argentina":"ar",
  "Austria":"at",
  "Australia":"au",
  "Belgium":"be",
  "Bulgaria":"bg",
  "Brazil":"br",
  "Canada":"ca",
  "Switzerland":"ch",
  "China":"cn",
  "Colombia":"co",
  "Cuba":"cu",
  "Czech Republic":"cz",
  "Germany":"de",
  "Egypt":"eg",
  "France":"fr",
  "United Kingdom":"gb",
  "Greece":"gr",
  "Hong Kong":"hk",
  "Hungary":"hu",
  "Indonesia":"id",
  "Ireland":"ie",
  "Israel":"il",
  "India":"in",
  "Italy":"it",
  "Japan":"jp",
  "South Korea":"kr",
  "Lithuania":"lt",
  "Latvia":"lv",
  "Morocco":"ma",
  "Mexico":"mx",
  "Malaysia":"my",
  "Nigeria":"ng",
  "Netherlands":"nl",
  "Norway":"no",
  "New Zealand":"nz",
  "Philippines":"ph",
  "Poland":"pl",
  "Portugal":"pt",
  "Romania":"ro",
  "Serbia":"rs",
  "Russia":"ru",
  "Saudi Arabia":"sa",
  "Sweden":"se",
  "Singapore":"sg",
  "Slovenia":"si",
  "Slovakia":"sk",
  "Thailand":"th",
  "Turkey":"tr",
  "Taiwan":"tw",
  "Ukraine":"ua",
  "United States":"us",
  "Venezuela":"ve",
  "South Africa":"za"
}

document.getElementById('newsbar').addEventListener('submit',function(event){
  if(event.target.id==="topic-news"){
    let topic=document.getElementById('topic').value
    let url = 'https://newsapi.org/v2/everything?' +
              `q=${topic}&` +
              // 'from=2019-09-10&' + leave date as optional for now
              'sortBy=popularity&' +
              'apiKey=93db96180ea548c082a15c7b1a985770';
    fetch(url)
    .then(resp=>resp.json())
    .then(json=>addArticlesToNewsbar(json["articles"]))
  }
  event.preventDefault()
})

function addCountrySelectors(){
  //adding options for each country
  let countryOptions=document.getElementById('country-select')
  for (key in countries){
    countryOptions.innerHTML+=`
    <option value=${key}>${key}</option>
    `
    }
  countryOptions.addEventListener('change',function(){
    console.log('inside country select event listener')
    let box=document.getElementById('country-select')
    let countryName=box.options[box.selectedIndex].text
    newsByCountry(countries[countryName])
  })
}

function newsByCountry(name){
  let url='https://newsapi.org/v2/top-headlines?'+
          `country=${name}&category=business`+
          `&apiKey=93db96180ea548c082a15c7b1a985770`
  fetch(url)
  .then(resp=>resp.json())
  .then(json=>addArticlesToNewsbar(json["articles"]))
}


addCountrySelectors()
