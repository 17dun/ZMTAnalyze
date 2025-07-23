// // 保存配置
// function showSuccessMessage() {
//   const message = document.createElement('div');
//   message.textContent = '保存成功！';
//   message.style.position = 'fixed';
//   message.style.top = '50%';
//   message.style.left = '50%';
//   message.style.transform = 'translate(-50%, -50%)';
//   message.style.backgroundColor = '#4CAF50';
//   message.style.color = 'white';
//   message.style.padding = '10px 20px';
//   message.style.borderRadius = '4px';
//   message.style.zIndex = '1000';
//   document.body.appendChild(message);
//   setTimeout(() => message.remove(), 2000);
// }

// 分析按钮点击事件
document.getElementById('analyze').addEventListener('click', async () => {
  try {
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    await chrome.scripting.executeScript({
      target: {tabId: tabs[0].id},
      files: ['content.js']
    });
    await chrome.scripting.executeScript({
      target: {tabId: tabs[0].id},
      function: () => {
        analyze(true);
      }
    });
  } catch (error) {
    console.log('', error);
  }
});

// 自动保存配置
function saveSettings() {
  const autoAnalyze = document.getElementById('autoAnalyze').checked;
  const threshold = document.getElementById('threshold').value;
  const apiToken = document.getElementById('apiToken').value;
  
  chrome.storage.sync.set({
    autoAnalyze,
    threshold,
    apiToken
  }, () => {
    
  });
}

// 自动分析模式切换事件
document.getElementById('autoAnalyze').addEventListener('change', saveSettings);

// 滑块值变化事件
document.getElementById('threshold').addEventListener('input', (e) => {
  document.querySelector('.value-display').textContent = `${e.target.value}%`;
  saveSettings();
});

// API Token 输入事件
document.getElementById('apiToken').addEventListener('input', saveSettings);

// 加载保存的设置
chrome.storage.sync.get(['autoAnalyze', 'threshold', 'apiToken'], (result) => {
  if (result.autoAnalyze !== undefined) {
    document.getElementById('autoAnalyze').checked = result.autoAnalyze;
    // 如果启用了自动分析，执行分析逻辑
    if (result.autoAnalyze) {
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.scripting.executeScript({
          target: {tabId: tabs[0].id},
          files: ['content.js']
        }).then(() => {
          chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            function: () => {
              analyze(true);
            }
          });
        });
      });
    }
  }
  if (result.threshold !== undefined) {
    document.getElementById('threshold').value = result.threshold;
    document.querySelector('.value-display').textContent = `${result.threshold}%`;
  }
  if (result.apiToken !== undefined) {
    document.getElementById('apiToken').value = result.apiToken;
    // If a token exists, automatically check the balance
    if (result.apiToken) {
      checkBalance();
    }
  }
});

// --- Balance Check ---
async function checkBalance() {
  console.log('checkBalance');
  const { apiToken } = await new Promise(resolve => chrome.storage.sync.get('apiToken', resolve));
  const balanceContainer = document.getElementById('balance-container');
  const balanceDisplay = document.getElementById('balance-display');
  const usageDisplay = document.getElementById('usage-display');
  const errorDisplay = document.getElementById('balance-error');

  // Reset UI
  balanceContainer.style.display = 'block';
  balanceDisplay.textContent = 'Loading...';
  usageDisplay.textContent = 'Loading...';
  errorDisplay.textContent = '';

  if (!apiToken) {
    errorDisplay.textContent = 'API Token is not set.';
    balanceDisplay.textContent = 'N/A';
    usageDisplay.textContent = 'N/A';
    return;
  }

  const url = 'https://zmt-server.vercel.app/api/v1/balance';

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log(result)

    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }

    if (result.success) {
      balanceDisplay.textContent = result.balance;
      usageDisplay.textContent = result.usage;
    } else {
      throw new Error(result.message || 'Failed to retrieve balance.');
    }
  } catch (error) {
    console.error('Error checking balance:', error);
    errorDisplay.textContent = error.message;
    balanceDisplay.textContent = 'Error';
    usageDisplay.textContent = 'Error';
  }
}

document.getElementById('checkBalance').addEventListener('click', checkBalance);

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'analysisComplete') {
    // Check balance when analysis is complete
    checkBalance();
  }
});


// 滑块值变化事件
document.getElementById('threshold').addEventListener('input', (e) => {
  document.querySelector('.value-display').textContent = `${e.target.value}%`;
});
