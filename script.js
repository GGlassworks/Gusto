document.getElementById("leadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = {
    fullName: form.fullName.value,
    email: form.email.value,
    phone: form.phone.value,
    address: form.address.value,
    notes: form.notes.value
  };
  const res = await fetch("/api/pipedrive", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  document.getElementById("response").innerText = result.success ? "Submitted!" : "Error submitting form.";
});