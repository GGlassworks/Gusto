;(() => {
  const imageUrl = "https://gustogg.vercel.app/Favicon-512x512.png"

  const style = document.createElement("style")
  style.innerHTML = `
    #gusto-chat-container {
      position: fixed;
      bottom: 0;
      right: 0;
      width: 25vw;
      height: 25vh;
      max-width: 100%;
      max-height: 100%;
      background: transparent !important;
      opacity: 1 !important;
      border-radius: 16px 0 0 0;
      z-index: 9999;
      box-shadow: 0 8px 30px rgba(0,0,0,0.2);
      overflow: hidden;
    }

    #gusto-chat-iframe {
      width: 100%;
      height: 100%;
      border: none;
      z-index: 10000;
      background-color: transparent;
    }

    @media (max-width: 768px) {
      #gusto-chat-container {
        width: 100vw;
        height: 40vh;
        border-radius: 16px 16px 0 0;
      }
    }
  `
  document.head.appendChild(style)

  const container = document.createElement("div")
  container.id = "gusto-chat-container"

  const iframe = document.createElement("iframe")
  iframe.id = "gusto-chat-iframe"
  iframe.src = "https://gustogg.vercel.app/"
  iframe.allow = "microphone; camera"

  container.appendChild(iframe)
  document.body.appendChild(container)
})()
