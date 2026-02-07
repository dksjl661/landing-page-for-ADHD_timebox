const yearNode = document.querySelector("#current-year");
if (yearNode) {
  yearNode.textContent = `${new Date().getFullYear()} `;
}

const getAppButton = document.querySelector("#get-app-btn");
const topDownloadButton = document.querySelector("#top-download-btn");
const fileModeInstallerPath =
  "https://github.com/dksj661/landing-page-for-ADHD_timebox/releases/download/v0.3.0/ADHD-Timebox-v.3.0-arm64.dmg";

if (window.location.protocol === "file:") {
  if (getAppButton) {
    getAppButton.href = fileModeInstallerPath;
    getAppButton.removeAttribute("download");
    getAppButton.title = "Opens a local DMG in ./downloads.";
  }
  if (topDownloadButton) {
    topDownloadButton.href = fileModeInstallerPath;
    topDownloadButton.title = "Opens a local DMG in ./downloads.";
  }
}
