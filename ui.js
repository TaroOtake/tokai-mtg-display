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
