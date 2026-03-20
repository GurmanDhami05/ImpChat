const users = {};

export function addUser(socketId, username, room) {
  users[socketId] = { username, room };
}

export function removeUser(socketId) {
  delete users[socketId];
}

export function getUser(socketId) {
  return users[socketId];
}

export function getUsersInRoom(room) {
  return Object.values(users)
    .filter((user) => user.room === room)
    .map((user) => user.username);
}

export function isDuplicate(username, room) {
  return Object.values(users).some(
    (user) => user.room === room && user.username === username,
  );
}

export function getUserbyName(username, room) {
  return Object.entries(users).find(
    ([id, user]) => user.room === room && user.username === username,
  );
}
