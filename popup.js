document.addEventListener('DOMContentLoaded', function() {
    const websiteForm = document.getElementById('website-form');
    const websiteList = document.getElementById('website-list');
  
    // Load websites from storage
    chrome.storage.sync.get('websites', function(data) {
      const websites = data.websites || [];
      websites.forEach(function(website) {
        addWebsiteToList(website);
      });
    });
  
    // Add website to the list
    websiteForm.addEventListener('submit', function(event) {
      event.preventDefault();
      const websiteName = document.getElementById('website-name').value.trim();
      const websiteUrl = document.getElementById('website-url').value.trim();
      const reminderDays = document.getElementById('reminder-days').value;
  
      if (websiteName && websiteUrl && reminderDays) {
        const website = { name: websiteName, url: websiteUrl, reminderDays: reminderDays };
        addWebsiteToList(website);
        saveWebsitesToStorage();
        websiteForm.reset();
      }
    });
  
    // Remove website from the list
    websiteList.addEventListener('click', function(event) {
      if (event.target.classList.contains('remove')) {
        const websiteItem = event.target.parentElement;
        websiteList.removeChild(websiteItem);
        saveWebsitesToStorage();
      }
    });
  
    // Add website to the list
    function addWebsiteToList(website) {
      const listItem = document.createElement('li');
      listItem.textContent = `${website.name} (${website.url}) - Reminder: ${website.reminderDays} days`;
      const removeButton = document.createElement('button');
      removeButton.textContent = 'Remove';
      removeButton.classList.add('remove');
      listItem.appendChild(removeButton);
      websiteList.appendChild(listItem);
    }
  
    // Save websites to storage
    function saveWebsitesToStorage() {
      const websites = Array.from(websiteList.children).map(function(item) {
        const [name, url, reminderDays] = item.textContent.split(' - Reminder: ');
        return { name: name.slice(0, -1), url: url.slice(1, -1), reminderDays: parseInt(reminderDays) };
      });
      chrome.storage.sync.set({ websites: websites });
    }
  });