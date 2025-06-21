const chatbox = document.getElementById('chatbox');
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello!' })
})
.then(res => res.json())
.then(data => {
  chatbox.innerHTML = "<p><strong>Bot:</strong> " + data.reply + "</p>";
});