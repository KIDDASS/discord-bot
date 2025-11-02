<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Discord VC Live</title>
<style>
  body {
    background-color: #23272A;
    color: #fff;
    font-family: 'Space Grotesk', sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px;
  }
  h1 { color: #7289DA; }
  #vc-users { margin-top: 20px; display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
  .user {
    background-color: #2C2F33;
    border-radius: 12px;
    padding: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 150px;
    animation: fadeIn 0.5s;
  }
  .user img { border-radius: 50%; width: 40px; height: 40px; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity:1; transform: translateY(0);} }
</style>
</head>
<body>
<h1>Discord VC Live</h1>
<div id="vc-users">Loading...</div>

<script>
const API_URL = "https://YOUR_BOT_API_URL_HERE/api/voice";

let lastUsers = {};

async function fetchVC() {
  const container = document.getElementById("vc-users");
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    const users = Object.values(data).flat();

    if (users.length === 0) {
      container.innerHTML = "No one is in VC right now.";
      lastUsers = {};
      return;
    }

    const html = users.map(u => {
      const joinedAt = new Date(u.joinedAt);
      const seconds = Math.floor((Date.now() - joinedAt) / 1000);
      const minutes = Math.floor(seconds / 60);
      const displayTime = `${minutes}m ${seconds % 60}s`;

      return `<div class="user" id="${u.name}">
                <img src="${u.avatar}" alt="${u.name}" />
                <div>
                  <strong>${u.name}</strong><br/>
                  <small>${displayTime}</small>
                </div>
              </div>`;
    }).join('');

    container.innerHTML = html;
    lastUsers = users.map(u => u.name);
  } catch(e) {
    container.innerHTML = "Error: Failed to fetch API.";
    console.error(e);
  }
}

fetchVC();
setInterval(fetchVC, 5000);
</script>
</body>
</html>
