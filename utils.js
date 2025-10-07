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

// APIリクエスト中のモーダルを表示する関数
function showApiRequestModal() {
  const modal = document.getElementById('apiRequestModal');
  modal.classList.add('show');
}

// APIリクエスト中のモーダルを非表示にする関数
function hideApiRequestModal() {
  const modal = document.getElementById('apiRequestModal');
  modal.classList.remove('show');
}
