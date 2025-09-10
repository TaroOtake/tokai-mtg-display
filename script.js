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

// グローバル変数
let currentRoomId = "roomA" // デフォルトの会議室ID
let currentRoomData = { name: "会議室A", meetings: [] }
let currentTime = new Date()
let roomStatus = "available" // 'available' or 'occupied'
let isBookingInProgress = false // 予約処理中フラグ

// 長押し設定
const LONG_PRESS_DURATION = 1000 // 長押し時間（ミリ秒）

// CSS変数で長押し時間を設定
document.documentElement.style.setProperty('--long-press-duration', `${LONG_PRESS_DURATION}ms`);

// API設定
//const API_BASE_URL = 'http://localhost:8787' // ローカル開発環境のURL
const API_BASE_URL = 'https://room-status-api.taro-otake.workers.dev' // Cloudflare Workersの本番URL

// APIから会議データを取得
async function fetchMeetingsFromAPI(roomId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/meetings`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const meetings = await response.json();
    return meetings;
  } catch (error) {
    console.error('APIからのデータ取得に失敗:', error);
    return [];
  }
}

// 会議室データを更新（ダミーデータを使用）
function updateRoomData(roomId) {
  currentRoomData = {
    name: allRoomData[roomId]?.name || `会議室${roomId}`,
    meetings: allRoomData[roomId]?.meetings || []
  };
}

// APIを使用する場合の会議室データ更新
async function updateRoomDataFromAPI(roomId) {
  const meetings = await fetchMeetingsFromAPI(roomId);
  currentRoomData = {
    name: allRoomData[roomId]?.name || `会議室${roomId}`,
    meetings: meetings
  };
  // APIデータ取得時に更新時刻を更新
  document.getElementById("lastUpdated").textContent = formatTime(new Date());
}

// 時刻フォーマット関数
function formatTime(date) {
  return date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function formatDate(date) {
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  })
}

// 次の時間帯を生成（既存の会議予定と重複しないもののみ）
function getNextTimeSlots(currentTime) {
  const slots = []
  const now = new Date(currentTime)

  // 現在時刻を30分単位で切り上げ
  const minutes = now.getMinutes()
  const roundedMinutes = minutes <= 30 ? 30 : 60

  now.setMinutes(roundedMinutes, 0, 0)

  // 既存の会議予定の開始時刻を取得（現在時刻より後のもののみ）
  const upcomingMeetings = currentRoomData.meetings
    .map(meeting => {
      const [startH, startM] = meeting.startTime.split(":").map(Number)
      const meetingStartTime = new Date(now)
      meetingStartTime.setHours(startH, startM, 0, 0)
      return {
        startTime: meetingStartTime,
        startTimeString: meeting.startTime
      }
    })
    .filter(meeting => meeting.startTime > currentTime)
    .sort((a, b) => a.startTime - b.startTime)

  // 30分刻みで3つの時間帯を生成
  for (let i = 0; i < 3; i++) {
    const endTime = new Date(now.getTime() + i * 30 * 60000)
    const endTimeString = endTime.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    })

    // 既存の会議予定と重複するかチェック
    if (!isTimeSlotConflicting(currentTime, endTimeString)) {
      slots.push({
        endTime: endTimeString,
        duration: Math.round((endTime.getTime() - currentTime.getTime()) / 60000),
      })
    }
  }

  // 既存の会議予定の開始時刻までの予約も追加（最大3つまで）
  upcomingMeetings.slice(0, 3).forEach(meeting => {
    const endTimeString = meeting.startTimeString
    
    // 既に30分刻みで追加済みの場合はスキップ
    if (!slots.some(slot => slot.endTime === endTimeString)) {
      // 既存の会議予定と重複するかチェック
      if (!isTimeSlotConflicting(currentTime, endTimeString)) {
        const duration = Math.round((meeting.startTime.getTime() - currentTime.getTime()) / 60000)
        slots.push({
          endTime: endTimeString,
          duration: duration,
        })
      }
    }
  })

  // 時間順でソートして最大3つまで返す
  return slots
    .sort((a, b) => a.endTime.localeCompare(b.endTime))
    .slice(0, 3)
}

// 指定された時間帯が既存の会議予定と重複するかチェック
function isTimeSlotConflicting(startTime, endTimeString) {
  const currentMinutes = startTime.getHours() * 60 + startTime.getMinutes()
  const [endH, endM] = endTimeString.split(":").map(Number)
  const endMinutes = endH * 60 + endM

  // 既存の会議予定と重複するかチェック
  return currentRoomData.meetings.some(meeting => {
    const [meetingStartH, meetingStartM] = meeting.startTime.split(":").map(Number)
    const [meetingEndH, meetingEndM] = meeting.endTime.split(":").map(Number)
    const meetingStartMinutes = meetingStartH * 60 + meetingStartM
    const meetingEndMinutes = meetingEndH * 60 + meetingEndM

    // 予約時間帯が会議時間と重複するかチェック
    return (currentMinutes < meetingEndMinutes && endMinutes > meetingStartMinutes)
  })
}

// 時刻表示を更新
function updateTimeDisplay() {
  currentTime = new Date()
  document.getElementById("currentTime").textContent = formatTime(currentTime)
  document.getElementById("currentDate").textContent = formatDate(currentTime)
  // lastUpdatedはAPIデータ取得時のみ更新するため、ここでは更新しない
}

// 状況表示を更新
function updateStatusDisplay() {
  const indicator = document.getElementById("statusIndicator")
  const text = document.getElementById("statusText")
  const instantBooking = document.getElementById("instantBooking")

  // 長押し中の場合は更新をスキップ
  if (isLongPressing) {
    return;
  }

  // 現在の会議室の予約状況を判定
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  let isOccupied = false

  currentRoomData.meetings.forEach((meeting) => {
    const [startH, startM] = meeting.startTime.split(":").map(Number)
    const [endH, endM] = meeting.endTime.split(":").map(Number)
    const meetingStartMinutes = startH * 60 + startM
    const meetingEndMinutes = endH * 60 + endM

    if (currentMinutes >= meetingStartMinutes && currentMinutes < meetingEndMinutes) {
      isOccupied = true
      meeting.isActive = true // 進行中の会議をアクティブに設定
    } else {
      meeting.isActive = false
    }
  })

  roomStatus = isOccupied ? "occupied" : "available"

  if (roomStatus === "available") {
    indicator.className = "status-indicator available"
    text.innerHTML = `<div class="status-dot available"></div><span class="inline-text">利用可能</span>`
    instantBooking.classList.remove("hidden")
  } else {
    indicator.className = "status-indicator occupied"
    text.innerHTML = `
      <div class="status-main">
        <div class="status-dot occupied"></div><span class="inline-text">使用中</span>
      </div>
      <div class="status-hint">💡長押しで会議終了</div>
    `
    instantBooking.classList.add("hidden")
  }
}

// インスタント予約ボタンを生成
function updateBookingButtons() {
  const container = document.getElementById("bookingButtons")
  const timeSlots = getNextTimeSlots(currentTime)

  container.innerHTML = ""

  timeSlots.forEach((slot) => {
    const button = document.createElement("button")
    button.className = isBookingInProgress ? "booking-btn disabled" : "booking-btn"
    button.disabled = isBookingInProgress
    button.innerHTML = `
            <span class="booking-time">~${slot.endTime}</span>
            <span class="booking-duration">(${slot.duration}分)</span>
        `
    button.onclick = () => handleInstantBooking(slot.endTime)
    container.appendChild(button)
  })
}

// 予約データを作成する関数
function createMeetingData(endTimeString) {
  const now = new Date()
  const [hours, minutes] = endTimeString.split(":").map(Number)
  const endTime = new Date()
  endTime.setHours(hours, minutes, 0, 0)

  // 翌日の場合の処理
  if (endTime <= now) {
    endTime.setDate(endTime.getDate() + 1)
  }

  const duration = Math.round((endTime.getTime() - now.getTime()) / 60000)

  return {
    title: `インスタント予約 (${duration}分)`,
    date: now.toISOString().split('T')[0], // YYYY-MM-DD形式
    startTime: now.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    endTime: endTime.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }
}

// APIに予約を作成する関数
async function createMeetingViaAPI(meetingData) {
  try {
    // 予約処理開始フラグを設定
    isBookingInProgress = true;
    
    const response = await fetch(`${API_BASE_URL}/api/rooms/${currentRoomId}/meetings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(meetingData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const createdMeeting = await response.json();
    console.log('予約が作成されました:', createdMeeting);
    
    // 予約作成後、データを再取得して表示を更新
    await updateRoomDataFromAPI(currentRoomId);
    updateStatusDisplay();
    updateMeetingsList();
    
  } catch (error) {
    console.error('予約作成に失敗:', error);
    alert('予約の作成に失敗しました。もう一度お試しください。');
  } finally {
    // 予約処理終了フラグをリセット
    isBookingInProgress = false;
  }
}

// インスタント予約処理
async function handleInstantBooking(endTimeString) {
  // 既に処理中の場合は何もしない
  if (isBookingInProgress) {
    return;
  }
  
  const newMeeting = createMeetingData(endTimeString);
  await createMeetingViaAPI(newMeeting);
}

// 通知を表示する関数
function showNotification(message, isError = false) {
  const notification = document.getElementById('notification');
  const notificationText = notification.querySelector('.notification-text');
  const notificationIcon = notification.querySelector('.notification-icon');
  
  notificationText.textContent = message;
  
  // エラーの場合はアイコンとスタイルを変更
  if (isError) {
    notificationIcon.textContent = '❌';
    notification.style.backgroundColor = '#ef4444';
    notification.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
  } else {
    notificationIcon.textContent = '✅';
    notification.style.backgroundColor = '#10b981';
    notification.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
  }
  
  notification.classList.add('show');
  
  // 3秒後に通知を非表示
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

// 現在進行中の会議のIDを取得する関数
function getCurrentMeetingId() {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  for (const meeting of currentRoomData.meetings) {
    const [startH, startM] = meeting.startTime.split(":").map(Number);
    const [endH, endM] = meeting.endTime.split(":").map(Number);
    const meetingStartMinutes = startH * 60 + startM;
    const meetingEndMinutes = endH * 60 + endM;
    
    if (currentMinutes >= meetingStartMinutes && currentMinutes < meetingEndMinutes) {
      return meeting.id; // Graph APIの実際のID
    }
  }
  
  return null;
}

// APIで会議を終了する関数
async function endMeetingViaAPI() {
  try {
    // 現在進行中の会議のIDを取得
    const meetingId = getCurrentMeetingId();
    
    if (!meetingId) {
      throw new Error('現在進行中の会議が見つかりません');
    }

    const response = await fetch(`${API_BASE_URL}/api/rooms/${currentRoomId}/meetings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ meetingId: meetingId })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const endedMeeting = await response.json();
    console.log('会議が終了されました:', endedMeeting);
    
    // 会議終了後、データを再取得して表示を更新
    await updateRoomDataFromAPI(currentRoomId);
    updateStatusDisplay();
    updateMeetingsList();
    
    // 成功通知を表示
    showNotification('会議終了しました');
    
  } catch (error) {
    console.error('会議終了に失敗:', error);
    
    // エラー通知を表示
    showNotification('会議終了に失敗しました', true);
  }
}

// 長押しタイマー関連の変数
let longPressTimer = null;
let isLongPressing = false;

// 長押し開始
function startLongPress() {
  if (roomStatus !== 'occupied') return;
  
  isLongPressing = true;
  const indicator = document.getElementById("statusIndicator");
  indicator.classList.add("pressing");
  
  // プログレスバーを追加
  const progressBar = document.createElement("div");
  progressBar.className = "long-press-progress";
  indicator.appendChild(progressBar);
  
  // 長押し時間後に会議終了
  longPressTimer = setTimeout(() => {
    endMeetingViaAPI();
    endLongPress();
  }, LONG_PRESS_DURATION);
}

// 長押し終了
function endLongPress() {
  if (!isLongPressing) return;
  
  isLongPressing = false;
  const indicator = document.getElementById("statusIndicator");
  indicator.classList.remove("pressing");
  
  // プログレスバーを削除
  const progressBar = indicator.querySelector(".long-press-progress");
  if (progressBar) {
    progressBar.remove();
  }
  
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
  
  // 長押し終了後、状態表示を更新
  updateStatusDisplay();
}

// 長押しイベントリスナーを設定
function setupLongPressEvents() {
  const indicator = document.getElementById("statusIndicator");
  
  // マウスイベント
  indicator.addEventListener('mousedown', startLongPress);
  indicator.addEventListener('mouseup', endLongPress);
  indicator.addEventListener('mouseleave', endLongPress);
  
  // タッチイベント
  indicator.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startLongPress();
  });
  indicator.addEventListener('touchend', (e) => {
    e.preventDefault();
    endLongPress();
  });
  indicator.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    endLongPress();
  });
}

// 会議一覧を更新
function updateMeetingsList() {
  const container = document.getElementById("meetingsList")

  if (currentRoomData.meetings.length === 0) {
    container.innerHTML = '<div class="no-meetings">今日の予約はありません</div>'
    return
  }

  container.innerHTML = ""

  currentRoomData.meetings.forEach((meeting) => {
    const meetingDiv = document.createElement("div")
    meetingDiv.className = `meeting-item ${meeting.isActive ? "active" : ""}`

    meetingDiv.innerHTML = `
            <div class="meeting-header">
                <h3 class="meeting-title">${meeting.title}</h3>
                ${meeting.isActive ? '<span class="meeting-badge">進行中</span>' : ""}
            </div>
            <div class="meeting-details">
                <div class="meeting-time">
                    🕐 ${meeting.startTime} - ${meeting.endTime}
                </div>
            </div>
        `

    container.appendChild(meetingDiv)
  })
}

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
