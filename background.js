chrome.runtime.onInstalled.addListener(initialize);
chrome.runtime.onStartup.addListener(initialize);

async function initialize() {
  try {
    const websites = await getWebsitesFromStorage();
    setupListeners(websites);
  } catch (error) {
    console.error('Error initializing:', error);
  }
}

async function getWebsitesFromStorage() {
  try {
    const { websites } = await chrome.storage.sync.get('websites');
    return websites || [];
  } catch (error) {
    console.error('Error getting websites from storage:', error);
    return [];
  }
}

function setupListeners(websites) {
  if (!chrome.alarms) {
    console.error('Failed to set up alarms and listeners: chrome.alarms API is not available.');
    return;
  }

  chrome.alarms.onAlarm.addListener(handleAlarm);
  chrome.storage.onChanged.addListener(handleStorageChange);
  setupAlarms(websites);
}

function setupAlarms(websites) {
  websites.forEach(website => {
    const reminderDays = parseInt(website.reminderDays);
    if (isNaN(reminderDays) || reminderDays <= 0) {
      console.error(`Invalid reminderDays value for website ${website.name}: ${website.reminderDays !== undefined ? website.reminderDays : 'undefined'}`);
      return;
    }

    const reminderTime = reminderDays * 24 * 60 * 60 * 1000;
    const delayInMinutes = Math.floor(reminderTime / (60 * 1000));

    chrome.alarms.create(`reminder-${website.url}`, {
      delayInMinutes,
      periodInMinutes: delayInMinutes
    });
  });
}

async function handleAlarm(alarm) {
  try {
    const url = alarm.name.split('-')[1];
    const websites = await getWebsitesFromStorage();
    const website = websites.find(site => site.url === url);

    if (website) {
      const notificationOptions = {
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Password Refresh Reminder',
        message: `It's time to refresh your password for ${website.name} (${website.url})!`
      };
      chrome.notifications.create(`reminder-${website.url}`, notificationOptions);
    }
  } catch (error) {
    console.error('Error handling alarm:', error);
  }
}

async function handleStorageChange(changes, areaName) {
  try {
    if (areaName === 'sync' && changes.websites) {
      const websites = changes.websites.newValue || [];
      const existingAlarms = await chrome.alarms.getAll();
      const existingUrls = existingAlarms.map(alarm => alarm.name.split('-')[1]);

      websites.forEach(website => {
        const reminderDays = parseInt(website.reminderDays);
        if (isNaN(reminderDays) || reminderDays <= 0) {
          console.error(`Invalid reminderDays value for website ${website.name}: ${website.reminderDays}`);
          return;
        }

        const reminderTime = reminderDays * 24 * 60 * 60 * 1000;
        const delayInMinutes = Math.floor(reminderTime / (60 * 1000));
        const url = website.url;

        if (!existingUrls.includes(url)) {
          chrome.alarms.create(`reminder-${url}`, {
            delayInMinutes,
            periodInMinutes: delayInMinutes
          });
        }
      });

      for (const alarm of existingAlarms) {
        const url = alarm.name.split('-')[1];
        if (!websites.find(site => site.url === url)) {
          await chrome.alarms.clear(alarm.name);
        }
      }
    }
  } catch (error) {
    console.error('Error handling storage change:', error);
  }
}
