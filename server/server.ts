import { createServer } from "http";
import { Server } from "socket.io";
import { GameData, GameStages, PlacedChip, ValueType, Winner} from "../src/Global";
import { Timer } from "easytimer.js";
import mongoose from 'mongoose';
import { User } from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ruleta')
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error conectando a MongoDB:', err));

/** Server Handling */
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000"
  }
});
var timer = new Timer();
var users = new Map<string, string>();
let gameData = {} as GameData;
let usersData = new Map<string, PlacedChip[]>();
let wins = [] as Winner[];
timer.addEventListener('secondsUpdated', function (e: any) {
  var currentSeconds = timer.getTimeValues().seconds;
  gameData.time_remaining = currentSeconds
  if (currentSeconds == 1) {
    console.log("Place bet");
    usersData = new Map()
    gameData.stage = GameStages.PLACE_BET
    wins = []
    sendStageEvent(gameData)
  } else if (currentSeconds == 20) {
    gameData.stage = GameStages.NO_MORE_BETS
    const randomValue = getRandomNumberInt(0, 36);
    gameData.value = randomValue;
    console.log("No More Bets")
    sendStageEvent(gameData)

    for(let key of Array.from(usersData.keys())) {
      var username = users.get(key) || "Guest";
      var chipsPlaced = usersData.get(key) as PlacedChip[]
      if (chipsPlaced && gameData.value !== undefined) {
        var sumWon = calculateWinnings(gameData.value, chipsPlaced)
        updateWinnings(key, sumWon);
        wins.push({
          username: username,
          sum: sumWon
        });
      }
    }

  } else if (currentSeconds == 25) {
    console.log("Winners")
    gameData.stage = GameStages.WINNERS
    if (gameData.history == undefined) {
      gameData.history = []
    } 
    if (gameData.value !== undefined) {
      gameData.history.push(gameData.value)

      if (gameData.history.length > 10) {
        gameData.history.shift();
      }
    }
    gameData.wins = wins.sort((a,b) => b.sum - a.sum);
    sendStageEvent(gameData)
  }

});

io.on("connection", (socket) => {
  
  socket.on('enter', async (username: string) => {
    try {
      // Buscar usuario o crear si no existe
      let user = await User.findOne({ username });
      if (!user) {
        user = await User.create({ username });
      }
      users.set(socket.id, username);
      // Enviar los créditos actuales al cliente
      socket.emit('credits-update', user.credits);
      sendStageEvent(gameData);
    } catch (error) {
      console.error('Error al procesar entrada de usuario:', error);
    }
  });

  socket.on('place-bet', async (data: string) => {
    try {
      const gameData = JSON.parse(data) as PlacedChip[];
      const username = users.get(socket.id);
      if (!username) return;

      const user = await User.findOne({ username });
      if (!user) return;

      // Calcular total de apuestas
      const totalBet = gameData.reduce((sum, chip) => sum + chip.sum, 0);

      // Verificar si tiene suficientes créditos
      if (user.credits < totalBet) {
        socket.emit('bet-error', 'No tienes suficientes créditos');
        return;
      }

      // Restar créditos y guardar apuesta
      user.credits -= totalBet;
      await user.save();
      
      usersData.set(socket.id, gameData);
      socket.emit('credits-update', user.credits);
    } catch (error) {
      console.error('Error al procesar apuesta:', error);
    }
  });
  socket.on("disconnect", (reason) => {
    users.delete(socket.id);
    usersData.delete(socket.id);
  });
});

httpServer.listen(8000, () =>{

  console.log(`Server is running on port 8000`);
  
  timer.start({precision: 'seconds'});
});

function getRandomNumberInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sendStageEvent(_gameData: GameData) { 
  var json = JSON.stringify(_gameData)
  console.log(json)
  io.emit('stage-change', json);
}

var blackNumbers = [ 2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 29, 28, 31, 33, 35 ];
var redNumbers = [ 1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36 ];

function calculateWinnings(winningNumber: number, placedChips: PlacedChip[]) { 
  var win = 0;
  var arrayLength = placedChips.length;
  for (var i = 0; i < arrayLength; i++) {
     
      var placedChip = placedChips[i]
      var placedChipType = placedChip.item.type
      var placedChipValue = placedChip.item.value
      var placedChipSum = placedChip.sum
      
      if (placedChipType === ValueType.NUMBER &&  placedChipValue === winningNumber)
      {
          win += placedChipSum * 36;
      }
      else if (placedChipType === ValueType.BLACK && blackNumbers.includes(winningNumber))
      { // if bet on black and win
          win += placedChipSum * 2;
      }
      else if (placedChipType === ValueType.RED && redNumbers.includes(winningNumber))
      { // if bet on red and win
          win += placedChipSum * 2;
      }
      else if (placedChipType === ValueType.NUMBERS_1_18 && (winningNumber >= 1 && winningNumber <= 18))
      { // if number is 1 to 18
          win += placedChipSum * 2;
      }
      else if (placedChipType === ValueType.NUMBERS_19_36 && (winningNumber >= 19 && winningNumber <= 36))
      { // if number is 19 to 36
          win += placedChipSum * 2;
      }
      else if (placedChipType === ValueType.NUMBERS_1_12 && (winningNumber >= 1 && winningNumber <= 12))
      { // if number is within range of row1
          win += placedChipSum * 3;
      }
      else if (placedChipType === ValueType.NUMBERS_2_12 && (winningNumber >= 13 && winningNumber <= 24))
      { // if number is within range of row2
          win += placedChipSum * 3;
      }
      else if (placedChipType === ValueType.NUMBERS_3_12 && (winningNumber >= 25 && winningNumber <= 36))
      { // if number is within range of row3
          win += placedChipSum * 3;
      }
      else if (placedChipType === ValueType.EVEN || placedChipType === ValueType.ODD)
      { 
        if ( winningNumber % 2 == 0) {
             // if number even
            win += placedChipSum * 2;
        } else {
            // if number is odd
            win += placedChipSum * 2;
        }
      }
  }

  return win;
}

async function updateWinnings(socketId: string, winAmount: number) {
  try {
    const username = users.get(socketId);
    if (!username) return;

    const user = await User.findOne({ username });
    if (!user) return;

    user.credits += winAmount;
    await user.save();

    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit('credits-update', user.credits);
    }
  } catch (error) {
    console.error('Error al actualizar ganancias:', error);
  }
}