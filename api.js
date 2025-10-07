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

    // APIリクエスト中のモーダルを表示
    showApiRequestModal();

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
  } finally {
    // APIリクエスト中のモーダルを非表示
    hideApiRequestModal();
  }
}
