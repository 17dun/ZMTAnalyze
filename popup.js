document.getElementById('analyze').addEventListener('click', async () => {
  try {
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    // 先注入内容脚本
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
