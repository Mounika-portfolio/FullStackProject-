const socket = io(); // connect to server

function showMenu(category) {
  const sections = document.querySelectorAll('.menu-section');
  sections.forEach(sec => sec.classList.remove('active'));
  document.getElementById(category).classList.add('active');
}

function itemClicked(itemName) {
  const order = { item: itemName, time: new Date().toLocaleTimeString() };
  socket.emit("newOrder", order);
  alert("✅ Your order for " + itemName + " has been placed!");
}
