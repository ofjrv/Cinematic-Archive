const welcomeButton = document.querySelector("#welcome-button");
const statusMessage = document.querySelector("#status-message");

welcomeButton.addEventListener("click", () => {
    statusMessage.textContent = "아카이브가 준비되었습니다.";
});
