export enum GameStages {
  NONE = "NONE",
  PLACE_BET = "PLACE_BET",
  NO_MORE_BETS = "NO_MORE_BETS",
  WINNERS = "WINNERS"
}

export enum ValueType {
  NUMBER = "NUMBER",
  RED = "RED",
  BLACK = "BLACK",
  EVEN = "EVEN",
  ODD = "ODD",
  NUMBERS_1_18 = "NUMBERS_1_18",
  NUMBERS_19_36 = "NUMBERS_19_36",
  NUMBERS_1_12 = "NUMBERS_1_12",
  NUMBERS_2_12 = "NUMBERS_2_12",
  NUMBERS_3_12 = "NUMBERS_3_12",
  DOUBLE_SPLIT = "DOUBLE_SPLIT",
  QUAD_SPLIT = "QUAD_SPLIT",
  TRIPLE_SPLIT = "TRIPLE_SPLIT",
  EMPTY = "EMPTY"
}

export interface Item {
  type: ValueType;
  value?: number;
  valueSplit: number[];
}

export interface PlacedChip {
  item: Item;
  sum: number;
}

export interface Winner {
  username: string;
  sum: number;
}

export interface GameData {
  stage: GameStages;
  value?: number;
  time_remaining: number;
  wins?: Winner[];
  history?: number[];
}

export interface WheelNumber {
  next: string | null;
}

export interface rouletteData {
  numbers: number[];
}

export interface chipsData {
  selectedChip: number | null;
  placedChips: Map<Item, PlacedChip>;
}

export interface RouletteWrapperState {
  rouletteData: rouletteData;
  chipsData: chipsData;
  number: WheelNumber;
  winners: Winner[];
  history: number[];
  stage: GameStages;
  username: string;
  endTime: number;
  progressCountdown: number;
  time_remaining: number;
  credits: number;
} 