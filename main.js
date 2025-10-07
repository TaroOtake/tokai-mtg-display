// URLからクエリパラメータを読み込み、会議室を切り替える
async function loadRoomFromQuery() {
  const urlParams = new URLSearchParams(window.location.search)
  const roomIdFromUrl = urlParams.get("room")

  if (roomIdFromUrl && allRoomData[roomIdFromUrl]) {
    currentRoomId = roomIdFromUrl
  } else {
    // クエリパラメータがない、または無効な場合はデフォルトの会議室を使用
    currentRoomId = "roomA"
  }

  // APIから会議室データを取得
  await updateRoomDataFromAPI(currentRoomId)

  // ページタイトルと会議室名を更新
  document.getElementById("pageTitle").textContent = `${currentRoomData.name} - 予約状況`
  document.getElementById("roomTitle").textContent = currentRoomData.name
}

// 初期化
async function init() {
  // CSS変数で長押し時間を設定
  document.documentElement.style.setProperty('--long-press-duration', `${LONG_PRESS_DURATION}ms`);

  await loadRoomFromQuery() // まず会議室データを読み込む
  updateTimeDisplay()
  updateStatusDisplay() // 会議室データに基づいてステータスを判定
  updateBookingButtons()
  updateMeetingsList()
  setupLongPressEvents() // 長押しイベントを設定

  // 1秒ごとに時刻と表示を更新
  setInterval(() => {
    updateTimeDisplay()
    updateStatusDisplay() // リアルタイムでステータスを更新
    updateBookingButtons() // 時間が変わったらボタンも更新
  }, 1000)

  // APIを使用する場合の定期更新
  setInterval(async () => {
    await updateRoomDataFromAPI(currentRoomId)
    updateStatusDisplay()
    updateMeetingsList()
  }, 60000)
}

// ページ読み込み完了時に初期化
document.addEventListener("DOMContentLoaded", init)
