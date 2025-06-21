document.getElementById("ask").addEventListener("click", async () => {
  const input = document.getElementById("message").value;
  const res = await fetch("/api/knowledge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: input })
  });
  const data = await res.json();
  document.getElementById("reply").innerText = data.reply;
});