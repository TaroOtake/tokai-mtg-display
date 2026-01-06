// 会議室データ（クエリパラメータで切り替えるためのデータ構造）
const allRoomData = {
  roomA: {
    name: "会議室A"
  },
  roomB: {
    name: "会議室B"
  },
  roomC: {
    name: "会議室C"
  },
  president: {
    name: "プレジデントルーム"
  },
  trainingRoomA: {
    name: "社内会議室A"
  },
  trainingRoomB: {
    name: "社内会議室B"
  },
  test: {
    name: "大竹テスト用"
  }
}

// 長押し設定
const LONG_PRESS_DURATION = 2000 // 長押し時間（ミリ秒）

// API設定
const API_BASE_URL = 'http://localhost:8787' // ローカル開発環境のURL
//const API_BASE_URL = 'https://room-status-api.taro-otake.workers.dev' // Cloudflare Workersの本番URL

// グローバル変数
let currentRoomId = "roomA" // デフォルトの会議室ID
let currentRoomData = { name: "会議室A", meetings: [] }
let currentTime = new Date()
let roomStatus = "available" // 'available' or 'occupied'
let isBookingInProgress = false // 予約処理中フラグ

// 長押しタイマー関連の変数
let longPressTimer = null;
let isLongPressing = false;
