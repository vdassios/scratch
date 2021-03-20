const grid = document.querySelector(".grid");
const final = document.querySelector("#final");
const reset = document.querySelector("#reset");
const root = document.documentElement;
const serial = document.querySelector(".serial");
const ref = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const profit = document.querySelector(".profit");
const loss = document.querySelector(".loss");
const payoff = document.querySelector(".payoff");
const printed = document.querySelector(".printed");
//regex for capturing digits from the url strings
const digitReg = /\d+/;

//initialize an array to store every ticket you create
const ticketStore = [];

//declare probabilities
const p1 = 0.09;
const p2 = 0.06809186788787122;
const p5 = 0.04453927282819872;
const p10 = 0.012515496345637894;
const p15 = 0.0008342584882967897;
const p20 = 0.0002777777777777778;
const p50 = 0.00013738551207327228;
const p100 = 0.00005550929780738274;
const p200 = 0.00002775464890369137;
const p10k = 0.00000046257748172818;

//counting winner occurences
//as the user asks/simulates tickets
let winnerCount = {
  a: 0,
  1: 0,
  2: 0,
  5: 0,
  10: 0,
  15: 0,
  20: 0,
  50: 0,
  100: 0,
  200: 0,
  10000: 0,
};

//for pie chart real time
let ticketTrack = { winningTickets: 0, losingTickets: 0 };
//store total results for final bar chart
let finalObj = {
  //0: 0,
  1: 0,
  2: 0,
  5: 0,
  10: 0,
  15: 0,
  20: 0,
  50: 0,
  100: 0,
  200: 0,
  10000: 0,
};

//prize paired /w respective probability
let colorProb = [
  ['url("1.png")', p1],
  ['url("2.png")', p2],
  ['url("5.png")', p5],
  ['url("10.png")', p10],
  ['url("15.png")', p15],
  ['url("20.png")', p20],
  ['url("50.png")', p50],
  ['url("100.png")', p100],
  ['url("200.png")', p200],
  ['url("10000.png")', p10k],
];

//off setting probabilities by a factor of 100
colorProb.forEach((p) => {
  p[1] *= 10;
});
//prize options
const colors = [
  'url("1.png")',
  'url("2.png")',
  'url("5.png")',
  'url("10.png")',
  'url("15.png")',
  'url("20.png")',
  'url("50.png")',
  'url("100.png")',
  'url("200.png")',
  'url("10000.png")',
];

//define a zip function
const zip = (a, b) => a.map((k, i) => [k, b[i]]);

//random number from 0 to n-1 inclusive
//rewrite this with a default param = 9, and conditionally n
let rand = (n) => Math.floor(Math.random() * n);

//for readme
//assign stored positions their png values
//so even tho you generate arbitrary numbers of tickets
//you only produce visuals for as many as the user
//requests to play

//populate the scratchable layer
// 300 cells for now
// care to change cell width in css if
// you plan to mess with this
//to be used with caution in the autoplay function
//cannot be called with 0 if not called with 1 first
function gridView(toggle) {
  if (toggle === 1) {
    //add grid to DOM
    for (let j = 0; j < 299; j++) {
      let cell = document.createElement("div");
      cell.id = `${j}`; //give each cell a unique ID serving as a coordinate
      cell.className = "cell";
      grid.appendChild(cell);
    }
  } else if (toggle === 0) {
    //remove grid from DOM
    grid.querySelectorAll(".cell").forEach((cell) => cell.remove());
  }

  //might prove usefull, remove otherwise
  else {
    return;
  }
}

gridView(1);

//creates the illusion of scratching
//by opacity manipulation
//to do: change mouseover to mousedown ?

//generate, say, 1k tickets
function ticketPrinter(n) {
  //for probability bar outcomes
  finalObj = {
    // 0: 0,
    1: 0,
    2: 0,
    5: 0,
    10: 0,
    15: 0,
    20: 0,
    50: 0,
    100: 0,
    200: 0,
    10000: 0,
  };
  for (let i = 0; i < n; i++) {
    let ind = Math.floor(Math.random() * 10);
    //this is not quite right
    //the probabilities thus generated are off by an order of 10^-1
    //beacause you're actually uniformly picking 1 entry out of 10
    //and then trialing for thresholds. So make sure to scale
    //finalObj etc by an order of 10 at the end.
    pCheck(colorProb[ind][0], colorProb[ind][1]);
    if (ticketStore[i].winner !== null) {
      let w = ticketStore[i].winner.match(digitReg)[0] * 1;
      finalObj[w] += 1;
    }
  }
  //why? i don't remember
  return finalObj;
}

//print 10k tickets for playability + simulation
ticketPrinter(10000);

//then, print millions more but only keeping track
//of the bare essentials
const max = 4.5 * 10e5;
const min = 4 * 10e5;
//print a variable amount each time, from 4 to 4.5 mil
let ticketTotal = Math.floor(Math.random() * (max - min) + min);
printed.textContent = numberWithCommas(ticketTotal);

function printRest() {
  for (let i = 10000; i < ticketTotal; i++) {
    let ind = Math.floor(Math.random() * 10);
    if (prob(colorProb[ind][1])) {
      let w = colorProb[ind][0].match(digitReg)[0] * 1;
      finalObj[w] += 1;
    }
  }
}

printRest();

function pCheck(url, p) {
  //if the threshold passes, arrange accordingly
  if (prob(p)) {
    const winner = url;
    const msg = `You've won ${winner.match(digitReg)[0] * 1} euros!`;
    const wPos = winnerPos();
    //safeguard against mutable state
    //delete winner data from the pool
    let colorClone = [...colors];
    colorClone.splice(colors.indexOf(url), 1);
    //instructions for positions in grid & what png's to place therein
    //using removePos so as to not generate a fourth winning png for instance
    const otherPos = zip(removePos(ref, wPos), fillRest(colorClone, 6));
    //generate a ticket object to hold all the data
    //this clearly isn't the best choice, as i've had to split
    //the bulk of the simulation into chunks with way less data anyway
    let ticket = new Ticket(winner, wPos, colorClone, otherPos, null, msg);
    ticketStore.push(ticket);
    //if no prize wins
  } else {
    const msg = "Better luck next time.";
    //same as otherPos, but without any restrictions
    //just 9 grid positions & png values of multiplicity at most 2
    const lostPos = zip(ref, fillRest(colors, 9));
    let ticket = new Ticket(null, null, null, null, lostPos, msg);
    ticketStore.push(ticket);
  }
}

//keep track of winnings
let profitCount = 0;
//ticketIdx counts how many tickets the user has asked so far
let ticketIdx = 0;
//winning positions as numbers
//completely unecessary, only for readability
let wp = [];
//this can also be a 2d array
//object for now for readability
//original coarser grid coordinates
//keeping this just in case
//let coord = {
//  0: [58, 59, 81, 82],
//  1: [61, 62, 84, 85],
//  2: [64, 65, 87, 88],
//  3: [104, 105, 127, 128],
//  4: [107, 108, 130, 131],
//  5: [110, 111, 133, 134],
//  6: [150, 151, 173, 174],
//  7: [153, 154, 176, 177],
//  8: [156, 157, 179, 180],
//};
let coord = {
  0: [58, 59],
  1: [61, 62],
  2: [64, 65],
  3: [104, 105],
  4: [107, 108],
  5: [110, 111],
  6: [150, 151],
  7: [153, 154],
  8: [156, 157],
};

//this basically puts togethere the graphic of the ticket
function generateTicket() {
  let t = ticketStore[ticketIdx];
  //check if the ticket wins or loses
  //and generate it accordingly
  if (t.winner !== null) {
    t.wPos.forEach((pos) => {
      //pos is simply an array of ints
      //have declared 9 css variables --pic#
      //to act as grid coordinates
      root.style.setProperty(`--pic${pos}`, t.winner);
      //if the ticket wins..
      wp = t.wPos;
      //add a border around wijning elements
      //but this raises alignment issues
      //need to correct for border width
      //document.querySelector(`#a${pos}`).style.border = "solid green 2px";
    });
    t.otherPos.forEach((pos) => {
      //pos is a 2d iarray of positions(int) & png values (str)
      root.style.setProperty(`--pic${pos[0]}`, pos[1]);
    });
    //get the winner value as int
    let profitNum = t.winner.match(digitReg)[0] * 1;
    //increment winning # of tickets
    ticketTrack["winningTickets"] += 1;
    //increment the winner count object
    winnerCount[profitNum] += 1;
    //add the value of the winner
    profitCount += profitNum;
    //replace these with fancy celebratory pop ups etc
    //outcome cheatsheet
    console.log(t.message);
  } else {
    t.lostPos.forEach((pos) => {
      root.style.setProperty(`--pic${pos[0]}`, pos[1]);
    });
    //add the cost of the ticket
    ticketTrack["losingTickets"] += 1;
    //alert(t.message);
  }
  //update serial #
  //atm this just counts linearly
  //but can be used to encrypt unique tickets
  serial.textContent = ticketIdx;
  ticketIdx += 1;
}

//
//hover tracking illusion
//only target grid cells
grid.addEventListener("mouseover", function (e) {
  if (e.target && e.target.className === "cell") {
    e.target.style.opacity = 0;
  }
});
//
//
//flag logic as follows:
//9 pairs of 0, each to be switched to 1 as
//coordinates are hovered over
//last pair tracks if all the previous coordinates
//have been visited or not, if yes turns 1 into 2
//
let wflags = [
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [1, 2], //this is for the final check, and also so i can flatten without issues
];

let lflags = [
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [1, 2],
];

function updateText() {
  //update profit
  profit.textContent = `${profitCount} euros`;
  //update cost
  loss.textContent = `${ticketIdx} euros`;
  //calculate payoff %
  payoff.textContent = `${((profitCount / ticketIdx) * 100).toFixed(2)} %`;
}

//this checks scratching patterns
//fires a msg on revealing the 3rd winning entry
//or on the final block if the ticket is not a winner
//updates charts & text accordingly
//tried to listen on the whole grid & use delegation
//dunnon how optimal this is
grid.addEventListener("mouseover", function (e) {
  if (wp.length && wflags[9][0] !== 2) {
    if (e.target) {
      //listen in on winners being hovered
      for (let i = 0; i < 3; i++) {
        if (coord[wp[i]][0] === e.target.id * 1) {
          wflags[i][0] = 1;
        }
        if (coord[wp[i]][1] === e.target.id * 1) {
          wflags[i][1] = 1;
        }
      }
      //check if every winner pos has been visited
      if (
        !wflags
          .reduce((a, b) => a.concat(b))
          .slice(0, 6)
          .includes(0)
      ) {
        // flatten &
        //check the first 3 pair-chunks to see
        //if everything was hit
        alert(ticketStore[ticketIdx - 1].message);
        updatePie();
        updateBar();
        updateText();
        wflags[9][0] = 2;
        wp = [];
      }
    }
    //same exact logic, but for losing tickets
  } else if (!wp.length && lflags[9][0] !== 2) {
    if (e.target) {
      for (let i = 0; i < 9; i++) {
        if (coord[i][0] === e.target.id * 1) {
          lflags[i][0] = 1;
        }
        if (coord[i][1] === e.target.id * 1) {
          lflags[i][1] = 1;
        }
      }
      //this time no splice necessary, just flatten and check
      if (!lflags.reduce((a, b) => a.concat(b)).includes(0)) {
        alert(ticketStore[ticketIdx - 1].message);
        updatePie();
        updateText();
        lflags[9][0] = 2;
      }
    }
  }
});
//
//
//

let finalFlag = 0;
finalFlag = 0;
function resetTicket() {
  //check if final data has been clicked
  //if yes, reload the page (generate new data)
  if (finalFlag === 1) {
    location.reload();
    return false;
  }
  //
  //
  wflags = [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [1, 2],
  ];
  lflags = [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [1, 2],
  ];
  //
  //reset the grid before generating new
  //re apply the overlay img
  document.querySelectorAll(".cell").forEach((div) => {
    div.style.opacity = 1;
  });
  //clear png values
  for (let i = 0; i < 9; i++) {
    root.style.setProperty(`--pic${i}`, "");
  }
  //generate the next ticket
  generateTicket();
}

reset.addEventListener("click", resetTicket);

final.addEventListener(
  "click",
  function () {
    //a flag to reload the page on the next action
    finalFlag = 1;
    finalData();
  },
  { once: true }
);

let interval;
//auto-play function
function autoPlay() {
  //uncover horse shoe graphic
  if (grid.childElementCount > 1) {
    gridView(0);
  }
  interval = setInterval(function () {
    resetTicket();
    updateBar();
    updatePie();
    updateText();
  }, 5);
}

//clean these buttons up at the end
//delegated under a unified event listener
const auto = document.querySelector("#autoplay");
auto.addEventListener("click", autoPlay, { once: true });

//stop auto & put the hood back on
const stop = document.querySelector("#stop");
stop.addEventListener("click", function () {
  clearInterval(interval);
  //if overlay is uncovered, cover it
  if (grid.childElementCount === 1) {
    gridView(1);
  }
});

//helper functions
//
//
function prob(threshold) {
  return Math.random() < threshold;
}

//returns 3 UNIQUE positions from {0,...,8}
function winnerPos() {
  let posLog = [];
  while (posLog.length < 3) {
    let r = rand(9);
    if (posLog.indexOf(r) == -1) {
      posLog.push(r);
    }
  }
  return posLog;
}
//fill the rest of the grid
//with fodder of multiplicity at most 2
//from array of size n
function fillRest(array, n) {
  let B = [];
  while (B.length < n) {
    let slot = array[rand(n)];
    if (indexCount(slot, B) < 2) {
      B.push(slot);
    }
  }
  return B;
}

//count appearances of element in array
function indexCount(element, array) {
  let idx = array.indexOf(element);
  let count = 0;
  while (idx != -1) {
    count += 1;
    idx = array.indexOf(element, idx + 1);
  }
  return count;
}

//the ticket object, kinda janky way of storing data tbh
//think of a better way?
function Ticket(winner, wPos, colorClone, otherPos, lostPos, message) {
  this.winner = winner;
  this.wPos = wPos;
  this.colorClone = colorClone;
  this.otherPos = otherPos;
  this.lostPos = lostPos;
  this.message = message;
}

//takes two arrays, where array2 is a subset
//of array2, and returns their difference
function removePos(array1, array2) {
  return array1.filter((x) => !array2.includes(x));
}
//formating bigger numbers to apper with commas
function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
//data visualization stuff
//
//
//
//
//initialize bar chart

const xVal = [
  //"0€ ",
  "1€",
  "2€",
  "5€",
  "10€",
  "15€",
  "20€",
  "50€",
  "100€",
  "200€",
  "10000€",
];
let yValFinal = [
  //finalObj[0],
  finalObj[1],
  finalObj[2],
  finalObj[5],
  finalObj[10],
  finalObj[15],
  finalObj[20],
  finalObj[50],
  finalObj[100],
  finalObj[200],
  finalObj[10000],
];
// 0 - wins , 1 - losses
let ticketTotalFinal = [
  yValFinal.reduce((a, b) => a + b, 0),
  ticketTotal - yValFinal.reduce((a, b) => a + b, 0),
];

//total profit
let totalProfit =
  1 * finalObj[1] +
  2 * finalObj[2] +
  5 * finalObj[5] +
  10 * finalObj[10] +
  15 * finalObj[15] +
  20 * finalObj[20] +
  50 * finalObj[50] +
  100 * finalObj[100] +
  200 * finalObj[200] +
  10000 * finalObj[10000];

const layout = {
  title: "Distribution of winners",
  font: {
    family: "Raleway, sans-serif",
  },
  showlegend: false,
  yaxis: {
    zeroline: false,
    gridwidth: 2,
  },
  bargap: 0.05,
};

let barDataTr = {
  x: xVal,
  y: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  type: "bar",
  textposition: "auto",
  marker: {
    color: "rgb(143,124,195)",
    opacity: 0.6,
    line: {
      color: "rgb(8,48,107)",
      width: 1.5,
    },
  },
};
const barData = [barDataTr];
Plotly.newPlot("box", barData, layout);

//plot the final bar tally
let traceF = {
  x: xVal,
  y: yValFinal,
  type: "bar",
  text: yValFinal.map((x) => ((x / ticketTotal) * 100).toFixed(4) + "%"),
  textposition: "auto",
  marker: {
    color: "rgb(143,124,195)",
    opacity: 0.6,
    line: {
      color: "rgb(8,48,107)",
      width: 1.5,
    },
  },
};

const barFData = [traceF];

//initial pie data
const pieData = [
  {
    values: [ticketTrack["winningTickets"], ticketTrack["losingTickets"]],
    labels: ["At least one winner", "No winner"],

    type: "pie",
    marker: {
      colors: ["rgba(206,32, 83, 0.8)", "rgb(143,124,195)"],
      opacity: 0.6,
    },
  },
];

const pieLayout = {
  height: 600,
  width: 600,
};

Plotly.newPlot("pie", pieData, pieLayout);
//final pie chart
const pieFData = [
  {
    values: [ticketTotalFinal[0], ticketTotalFinal[1]],
    labels: ["At least one winner", "No winner"],
    type: "pie",
    marker: {
      colors: ["rgba(206,32, 83, 0.8)", "rgb(143,124,195)"],
      opacity: 0.6,
      //  line: {
      //    color: "rgb(8,48,107)",
      //    width: 1.5,
      //  },
    },
  },
];

//animate real time pie
function updatePie() {
  Plotly.animate(
    "pie",
    {
      data: [
        {
          values: [ticketTrack["winningTickets"], ticketTrack["losingTickets"]],
        },
      ],
      layout: {},
    },
    {
      transition: {
        duration: 1,
      },
      frame: {
        duration: 1,
      },
    }
  );
}

//animate real time bar data
function updateBar() {
  Plotly.animate(
    "box",
    {
      data: [
        {
          y: [
            winnerCount[1],
            winnerCount[2],
            winnerCount[5],
            winnerCount[10],
            winnerCount[15],
            winnerCount[20],
            winnerCount[50],
            winnerCount[100],
            winnerCount[200],
            winnerCount[10000],
          ],
          text: [
            winnerCount[1],
            winnerCount[2],
            winnerCount[5],
            winnerCount[10],
            winnerCount[15],
            winnerCount[20],
            winnerCount[50],
            winnerCount[100],
            winnerCount[200],
            winnerCount[10000],
          ].map((x) => ((x / ticketIdx) * 100).toFixed(4) + "%"),
        },
      ],
      layout: {},
    },
    {
      transition: {
        duration: 5,
      },
      frame: {
        duration: 5,
      },
    }
  );
}
// display the final stats
function finalData() {
  //bar final
  Plotly.newPlot("box", barFData, layout);
  //pie final
  Plotly.newPlot("pie", pieFData, pieLayout);
  //update the final text values
  profit.textContent = numberWithCommas(totalProfit) + " euros";
  loss.textContent = numberWithCommas(ticketTotal) + " euros";
  serial.textContent = ticketTotal;
  payoff.textContent = ((totalProfit / ticketTotal) * 100).toFixed(2) + " %";
}
generateTicket();
