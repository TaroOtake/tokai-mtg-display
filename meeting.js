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

// インスタント予約処理
async function handleInstantBooking(endTimeString) {
  // 既に処理中の場合は何もしない
  if (isBookingInProgress) {
    return;
  }
  
  const newMeeting = createMeetingData(endTimeString);
  await createMeetingViaAPI(newMeeting);
}
