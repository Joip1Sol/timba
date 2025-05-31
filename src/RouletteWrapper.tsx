import React from "react";
import Wheel from "./Wheel";
import Board from "./Board";
import { List, Button, Progress } from '@mantine/core';
import { Item, PlacedChip, RouletteWrapperState, GameData, GameStages, Winner } from "./Global";
import { Timer } from "easytimer.js";
import WebApp from '@twa-dev/sdk';
import classNames from "classnames";
import { io } from "socket.io-client";
import anime from "animejs";
import ProgressBarRound from "./ProgressBar";

class RouletteWrapper extends React.Component<any, any> {
  rouletteWheelNumbers = [ 
    0, 32, 15, 19, 4, 21, 2, 25,
    17, 34, 6, 27, 13, 36, 11,
    30, 8, 23,10, 5, 24, 16, 33,
    1, 20, 14, 31, 9, 22, 18, 29,
    7, 28, 12, 35, 3, 26
  ];

  timer = new Timer();
  numberRef = React.createRef<HTMLInputElement>();
  state: RouletteWrapperState = {
    rouletteData: {
      numbers: this.rouletteWheelNumbers
    },
    chipsData: {
      selectedChip: null,
      placedChips: new Map()
    },
    number: {
      next: null
    },
    winners: [],
    history: [],
    stage: GameStages.NONE,
    username: WebApp.initDataUnsafe.user?.username || "Guest",
    endTime: 0,
    progressCountdown: 0,
    time_remaining: 0,
    credits: 0,
  };
  socketServer: any;
  animateProgress: any;

  blackNumbers = [ 2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 29, 28, 31, 33, 35 ];
  
  constructor(props: any) {
    super(props);

    this.onSpinClick = this.onSpinClick.bind(this);
    this.onChipClick = this.onChipClick.bind(this);
    this.getChipClasses = this.getChipClasses.bind(this);
    this.onCellClick = this.onCellClick.bind(this);
    this.placeBet = this.placeBet.bind(this);
    this.clearBet = this.clearBet.bind(this);

    // Usar la URL del servidor desde las variables de entorno
    this.socketServer = io(process.env.REACT_APP_SERVER_URL || "http://localhost:8000");
  }

  componentDidMount() {
    if (this.socketServer) {
      this.socketServer.open();
      this.socketServer.on('stage-change', (data: string) => {
        try {
          const gameData = JSON.parse(data);
          
          this.setState({
            stage: gameData.stage || GameStages.NONE,
            time_remaining: gameData.time_remaining || 0,
            winners: gameData.wins || [],
            history: gameData.history || [],
            number: {
              ...this.state.number,
              next: gameData.value !== undefined ? gameData.value.toString() : null
            }
          });
        } catch (error) {
          console.error('Error parsing game data:', error);
        }
      });

      this.socketServer.on("credits-update", (credits: number) => {
        this.setState({ credits });
      });

      this.socketServer.on("bet-error", (message: string) => {
        alert(message);
      });

      this.socketServer.on("connect", () => {
        if (this.socketServer && this.state.username) {
          this.socketServer.emit("enter", this.state.username);
          
          // Notificar a Telegram que la app está lista
          WebApp.ready();
          
          // Configurar el tema según Telegram
          if (WebApp.backgroundColor) {
            document.body.style.backgroundColor = WebApp.backgroundColor;
          }
          if (WebApp.colorScheme) {
            document.body.classList.add(WebApp.colorScheme);
          }
        }
      });

      // Expandir la webapp a pantalla completa
      WebApp.expand();
    }
  }

  componentWillUnmount() {
    this.socketServer.close();
  }

  setGameData(gameData: GameData) { 
    // Validación inicial de datos
    if (!gameData || typeof gameData.time_remaining !== 'number' || !gameData.stage) {
      console.error('Datos de juego inválidos recibidos');
      WebApp.showAlert('Error al recibir datos del juego');
      return;
    }

    const timeRemaining = gameData.time_remaining;
    const stage = gameData.stage;
    let endTime = 25; // valor por defecto para PLACE_BET

    let stateUpdate: Partial<RouletteWrapperState> = {
      time_remaining: timeRemaining,
      stage
    };

    if (stage === GameStages.NO_MORE_BETS) {
      endTime = 35;
      stateUpdate = {
        ...stateUpdate,
        endTime,
        progressCountdown: endTime - timeRemaining,
        number: { next: gameData.value?.toString() || null }
      };
    } else if (stage === GameStages.WINNERS) {
      endTime = 59;
      stateUpdate = {
        ...stateUpdate,
        endTime,
        progressCountdown: endTime - timeRemaining,
        history: Array.isArray(gameData.history) ? gameData.history : [],
        winners: Array.isArray(gameData.wins) ? gameData.wins : []
      };
    } else {
      stateUpdate = {
        ...stateUpdate,
        endTime,
        progressCountdown: endTime - timeRemaining
      };
    }

    try {
      this.setState(stateUpdate, () => {
        // Notificar a Telegram que los datos se han actualizado
        if (WebApp.isVersionAtLeast('6.1') && WebApp.HapticFeedback) {
          WebApp.HapticFeedback.notificationOccurred('success');
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error al actualizar el estado:', errorMessage);
      WebApp.showAlert('Error al actualizar el estado del juego');
    }
  }

  onCellClick(item: Item) {
    var currentChips = this.state.chipsData.placedChips;
    var chipValue = this.state.chipsData.selectedChip;
    
    if (chipValue === 0 || chipValue === null) {
      return;
    }

    const currentChip: PlacedChip = {
      item: item,
      sum: chipValue
    };

    console.log(this.state.chipsData.placedChips);
    console.log(item);
    
    const existingChip = currentChips.get(item);
    if (existingChip) {
      currentChip.sum += existingChip.sum;
    }

    currentChips.set(item, currentChip);
    this.setState({
      chipsData: {
        selectedChip: this.state.chipsData.selectedChip,
        placedChips: currentChips
      }
    });
  }

  onChipClick(chip: number | null) {
    if (chip != null) {
      this.setState({
        chipsData: {
          selectedChip: chip,
          placedChips: this.state.chipsData.placedChips
        }
      });
    }
  }
  
  getChipClasses(chip: number) {
    var cellClass = classNames({
      chip_selected: chip === this.state.chipsData.selectedChip,
      "chip-100": chip === 100,
      "chip-20": chip === 20,
      "chip-10": chip === 10,
      "chip-5": chip === 5
    });

    return cellClass;
  }

  onSpinClick() {
    const nextNumber = this.numberRef?.current?.value;
    if (nextNumber) {
      this.setState({ number: { next: nextNumber } });
    }
  }

  placeBet() { 
    const placedChipsMap = this.state.chipsData.placedChips;
    const chips: PlacedChip[] = [];
    
    for(const key of Array.from(placedChipsMap.keys())) {
      const chipsPlaced = placedChipsMap.get(key);
      if (chipsPlaced) {
        console.log("place chips");
        console.log(chips);
        console.log(chipsPlaced);
        console.log(chips.length);
        chips.push(chipsPlaced);
      }
    }
    this.socketServer.emit("place-bet", JSON.stringify(chips));
  }

  clearBet() { 
    this.setState({
      chipsData: {
        placedChips: new Map()
      }
    });
  }

  render() {
    return (
      <div>
        <div className="credits-display" style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '10px 20px',
          backgroundColor: '#2C2E43',
          borderRadius: '8px',
          color: '#FFD700',
          fontSize: '1.2em',
          fontWeight: 'bold',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          Créditos: {this.state.credits}
        </div>
        <div>
          <table className={"rouletteWheelWrapper"}>
            <tr>
            <td className={"winnersBoard"}>
            <div className={"winnerItemHeader hideElementsTest"} >WINNERS</div>
              { 
                this.state.winners.map((entry, index) => {
                    return (<div className="winnerItem">{index+1}. {entry.username} won {entry.sum}$</div>);
                })
              }
            </td>
            <td><Wheel rouletteData={this.state.rouletteData} number={this.state.number} /></td>
            <td>
              <div className={"winnerHistory hideElementsTest"}>
              { 
                this.state.history.map((entry, index) => {
                  if (entry === 0) {
                    return (<div className="green">{entry}</div>);
                  } else if (this.blackNumbers.includes(entry)) {
                    return (<div className="black">{entry}</div>);
                  } else {
                    return (<div className="red">{entry}</div>);
                  }
                })
              }
              </div>
            </td>
              
            </tr>
          </table>
          <Board
            onCellClick={this.onCellClick}
            chipsData={this.state.chipsData}
            rouletteData={this.state.rouletteData}
          />
        </div>
        <div className={"progressBar hideElementsTest"}>
          <ProgressBarRound stage={this.state.stage} maxDuration={this.state.endTime} currentDuration={this.state.time_remaining} />
        </div>
        <div className="roulette-actions hideElementsTest">
          <ul>
            <li>
            <Button  variant="gradient" gradient={{ from: '#ed6ea0', to: '#ec8c69', deg: 35 }} size="xl" onClick={() => this.clearBet()} >Clear Bet</Button>
            </li>
            <li className={"board-chip"}>
              <div
                key={"chip_100"}
                className={this.getChipClasses(100)}
                onClick={() => this.onChipClick(100)}
              >
                100
              </div>
            </li>
            <li className={"board-chip"}>
              <span key={"chip_20"}>
                <div
                  className={this.getChipClasses(20)}
                  onClick={() => this.onChipClick(20)}
                >
                  20
                </div>
              </span>
            </li>
            <li className={"board-chip"}>
              <span key={"chip_10"}>
                <div
                  className={this.getChipClasses(10)}
                  onClick={() => this.onChipClick(10)}
                >
                  10
                </div>
              </span>
            </li>
            <li className={"board-chip"}>
              <span key={"chip_5"}>
                <div
                  className={this.getChipClasses(5)}
                  onClick={() => this.onChipClick(5)}
                >
                  5
                </div>
              </span>
            </li>
            <li>
            <Button disabled={this.state.stage === GameStages.PLACE_BET ? false : true}
            variant="gradient" gradient={{ from: 'orange', to: 'red' }} size="xl" onClick={() => this.placeBet()} >Place Bet</Button>
            </li>
          </ul>
        </div>
      </div>
    );
  }
}

export default RouletteWrapper;
