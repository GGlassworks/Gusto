;(() => {
  const style = document.createElement("style")
  style.innerHTML = `
    #gusto-toggle {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.2);
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }
    #gusto-toggle img {
      width: 28px;
      height: 28px;
      object-fit: contain;
      border-radius: 4px;
    }

    #gusto-widget {
      position: fixed;
      bottom: 88px;
      right: 24px;
      width: 360px;
      height: 520px;
      max-width: 95vw;
      max-height: 80vh;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(12px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.25);
      overflow: hidden;
      z-index: 9999;
      display: none;
    }

    #gusto-widget iframe {
      width: 100%;
      height: 100%;
      border: none;
      background: transparent;
    }

    @media (max-width: 768px) {
      #gusto-widget {
        width: 92vw;
        height: 60vh;
        right: 4vw;
      }
    }
  `
  document.head.appendChild(style)

  const toggleBtn = document.createElement("button")
  toggleBtn.id = "gusto-toggle"
  toggleBtn.innerHTML = `<img src="https://gustogg.vercel.app/Favicon-192x192.jpg" alt="Gusto" style="width: 28px; height: 28px;" />`
  document.body.appendChild(toggleBtn)

  const widget = document.createElement("div")
  widget.id = "gusto-widget"
  widget.innerHTML = `
    <iframe 
      src="https://gustogg.vercel.app/"
      allow="microphone; camera"
      loading="lazy"
      title="Gusto Chat">
    </iframe>
  `
  document.body.appendChild(widget)

  toggleBtn.addEventListener("click", () => {
    const open = widget.style.display === "block"
    widget.style.display = open ? "none" : "block"
    toggleBtn.innerHTML = open
      ? `<img src="https://gustogg.vercel.app/Favicon-192x192.jpg" alt="Gusto" style="width: 28px; height: 28px;" />`
      : "✖️"
  })

  // Optional: auto-open after delay
  window.addEventListener("load", () => {
    setTimeout(() => {
      widget.style.display = "block"
      toggleBtn.innerText = "✖️"
    }, 10000)
  })
})()
