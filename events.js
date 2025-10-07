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
    // プログレスバーを非表示にして、APIリクエスト中のモーダルを表示
    endLongPress();
    endMeetingViaAPI();
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
