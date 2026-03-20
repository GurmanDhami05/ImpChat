const socket = io(window.location.origin);

let username = "";
let room = "";

const chat = document.getElementById("chat");
const input = document.getElementById("messageInput");

function joinRoom() {
  username = document.getElementById("usernameInput").value.trim();
  room = document.getElementById("roomInput").value.trim();

  if (!username || !room) return;

  socket.emit("join_room", { username, room });
}

socket.on("error_msg", (msg) => {
  document.getElementById("joinError").innerText = msg;
});

socket.on("join_success", () => {
  document.getElementById("joinError").innerText = "";
  document.querySelector(".joinSection").style.display = "none";
  document.querySelector(".chatSection").style.display = "flex";

  const userPanel = document.querySelector(".userPanel");
  userPanel.style.display = "flex";
  const roomBadge = document.querySelector("#roomBadge");
  roomBadge.style.display = "block";
  roomBadge.innerText = room;
});

socket.on("user_joined", (msg) => {
  addMessage(msg, "system");
});

socket.on("room_users", (data) => {
  console.log("room_users recieved: ", data);
  updateUsers(data.users);
});

function sendMessage() {
  const message = input.value.trim();

  if (message === "") return;

  socket.emit("send_message", {
    username,
    message,
    room,
  });

  input.value = "";
}

socket.on("receive_message", (data) => {
  document.querySelector("#typingIndicator").innerText = "";
  const isMine = data.username === username;
  addMessage(data.message, isMine ? "mine" : "theirs", data.username);
});

function updateUsers(users) {
  const userSection = document.querySelector(".userPanel");
  userSection.innerHTML = `<p class="roomLabel">Crewmates</p>`;
  users.forEach((user) => {
    const div = document.createElement("div");
    div.classList.add("userItem");

    const avatar = document.createElement("div");
    avatar.classList.add("userAvatar");
    avatar.style.background = getColor(user);
    avatar.innerText = user[0].toUpperCase();

    const name = document.createElement("span");
    name.classList.add("userName");
    name.innerText = user;

    if (user === username) {
      name.style.color = "#9b59b6";
      div.style.background = "rgba(155, 89, 182, 0.15)";
    } else {
      div.onclick = () => openDM(user);
    }
    div.appendChild(avatar);
    div.appendChild(name);
    userSection.appendChild(div);
  });
  // always append leave button at the end
  const leaveBtn = document.createElement("button");
  leaveBtn.classList.add("leaveBtn");
  leaveBtn.innerText = "Leave Room";
  leaveBtn.onclick = leaveRoom;
  userSection.appendChild(leaveBtn);
}

socket.on("user_left", (msg) => {
  addMessage(msg, "system");
});

socket.on("private_message", (data) => {
  const dmMessages = document.getElementById("dmMessages");

  if (data.isSender) {
    addMessage(data.message, "mine", username, dmMessages);
  } else {
    addMessage(data.message, "theirs", data.fromUsername, dmMessages);
    openDM(data.fromUsername);
  }

  dmMessages.scrollTop = dmMessages.scrollHeight;
});

function addMessage(text, type = "", senderName = "", container = chat) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("message");
  if (type) wrapper.classList.add(type);

  if (type === "system") {
    const msgText = document.createElement("span");
    msgText.classList.add("messageText");
    msgText.innerText = text;
    wrapper.appendChild(msgText);
  } else {
    const avatar = document.createElement("div");
    avatar.classList.add("messageAvatar");
    avatar.style.background = getColor(senderName);
    avatar.innerText = senderName[0].toUpperCase();
    const bubble = document.createElement("div");
    bubble.classList.add("messageBubble");
    const sender = document.createElement("span");
    sender.classList.add("messageSender");
    sender.style.color = getColor(senderName);
    sender.innerText = senderName;
    const msgText = document.createElement("span");
    msgText.classList.add("messageText");
    msgText.innerText = text;
    bubble.appendChild(sender);
    bubble.appendChild(msgText);
    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
  }

  container.appendChild(wrapper);
  container.scrollTop = container.scrollHeight;
}

function getColor(name) {
  const colors = [
    "#e74c3c",
    "#3498db",
    "#2ecc71",
    "#e67e22",
    "#1abc9c",
    "#e91e63",
  ];
  let total = 0;
  for (let i = 0; i < name.length; i++) {
    total += name.charCodeAt(i);
  }
  return colors[total % colors.length];
}

function leaveRoom() {
  socket.emit("leave_room");
  username = "";
  room = "";
  chat.innerHTML = "";

  // hide the panel entirely
  document.querySelector(".userPanel").style.display = "none";

  // hide room badge
  const roomBadge = document.getElementById("roomBadge");
  roomBadge.style.display = "none";
  roomBadge.innerText = "";

  // switch back to join screen
  document.querySelector(".chatSection").style.display = "none";
  document.querySelector(".joinSection").style.display = "flex";
}

let typingTimeout;

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    sendMessage();
    socket.emit("stop_typing");
    clearTimeout(typingTimeout);
    return;
  }

  socket.emit("typing");
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit("stop_typing");
  }, 500);
});

input.addEventListener("blur", () => {
  socket.emit("stop_typing");
  clearTimeout(typingTimeout);
});

socket.on("typing", (username) => {
  document.querySelector("#typingIndicator").innerText =
    `${username} is typing...`;
});

socket.on("stop_typing", () => {
  document.querySelector("#typingIndicator").innerText = "";
});

function openDM(targetUser) {
  const overlay = document.querySelector(".overlay");
  const title = document.querySelector("#dmTitle");
  title.innerText = targetUser;
  overlay.classList.add("active");
}

function closeDM() {
  const overlay = document.querySelector(".overlay");
  const title = document.querySelector("#dmTitle");
  title.innerText = "";
  overlay.classList.remove("active");
}

function sendDM() {
  const message = document.querySelector("#dmInput").value;
  const targetUser = document.querySelector("#dmTitle").innerText;
  if (!message || message.trim() === "") return;

  socket.emit("private_message", {
    toUsername: targetUser,
    message: message.trim(),
  });

  document.querySelector("#dmInput").value = "";
}
