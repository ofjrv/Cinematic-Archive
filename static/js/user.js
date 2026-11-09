const EYE_OPEN = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_OFF = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7c1.6 0 3-.4 4.3-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';

function addPasswordToggles(root = document) {
  root.querySelectorAll('input[type="password"]').forEach((input) => {
    if (input.parentElement.classList.contains("user-pw-wrap")) return;

    const wrap = document.createElement("div");
    wrap.className = "user-pw-wrap";
    input.before(wrap);
    wrap.appendChild(input);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "user-pw-toggle";
    btn.innerHTML = EYE_OPEN;
    btn.setAttribute("aria-label", "비밀번호 보기");
    wrap.appendChild(btn);

    btn.addEventListener("click", () => {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.innerHTML = show ? EYE_OFF : EYE_OPEN;
      btn.setAttribute("aria-label", show ? "비밀번호 숨기기" : "비밀번호 보기");
      input.focus();
    });
  });
}

function resetPasswordToggles(root) {
  root.querySelectorAll(".user-pw-wrap input").forEach((input) => { input.type = "password"; });
  root.querySelectorAll(".user-pw-toggle").forEach((btn) => {
    btn.innerHTML = EYE_OPEN;
    btn.setAttribute("aria-label", "비밀번호 보기");
  });
}

addPasswordToggles();


const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const loginButton = document.getElementById("loginButton");

function showUser(user) {
  document.getElementById("userAvatar").textContent = user ? user.name[0].toUpperCase() : "U";
  document.getElementById("userName").textContent = user ? user.name : "Guest User";
  document.getElementById("userSub").textContent = user ? "@" + user.userId : "Sign in to your archive";
  document.getElementById("userStatus").textContent = user ? "MEMBER" : "GUEST";
  document.getElementById("authTabs").hidden = !!user;
  if (user) {
    loginForm.hidden = true;
    signupForm.hidden = true;
  } else {
    switchAuth("signin");
  }
  logoutButton.hidden = !user;
}

const signupForm = document.getElementById("signupForm");
const signupError = document.getElementById("signupError");
const signupButton = document.getElementById("signupButton");
const signupIdInput = document.getElementById("signup-id");
const signupIdHint = document.getElementById("signupIdHint");
let checkedUserId = null;

function switchAuth(mode) {
  document.querySelectorAll(".user-auth-tab").forEach((tab) => {
    const on = tab.dataset.auth === mode;
    tab.classList.toggle("is-active", on);
    tab.setAttribute("aria-selected", on);
  });
  loginForm.hidden = mode !== "signin";
  signupForm.hidden = mode !== "signup";
  loginError.hidden = true;
  signupError.hidden = true;
  document.getElementById("userSub").textContent =
    mode === "signup" ? "Create your archive" : "Sign in to your archive";
}

document.querySelectorAll(".user-auth-tab").forEach((tab) => {
  tab.addEventListener("click", () => switchAuth(tab.dataset.auth));
});

function setIdHint(text, ok) {
  signupIdHint.textContent = text;
  signupIdHint.classList.toggle("is-ok", !!ok);
}

signupIdInput.addEventListener("input", () => {
  checkedUserId = null;
  setIdHint("");
});

document.getElementById("checkIdButton").addEventListener("click", async () => {
  const userId = signupIdInput.value.trim();
  if (!signupIdInput.checkValidity()) {
    setIdHint("영문 소문자, 숫자, . _ 로 4~20자 입력해주세요.");
    return;
  }
  try {
    const { available } = await API.auth.checkUserId(userId);
    checkedUserId = available ? userId : null;
    if (available) signupError.hidden = true;
    setIdHint(available ? "사용할 수 있는 아이디예요." : "이미 사용 중인 아이디예요.", available);
  } catch (err) {
    setIdHint(err.message || "확인에 실패했습니다.");
  }
});

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  signupError.hidden = true;

  const userId = signupIdInput.value.trim();
  const password = document.getElementById("signup-password").value;

  if (checkedUserId !== userId) {
    signupError.textContent = "아이디 중복 확인(CHECK)을 해주세요.";
    signupError.hidden = false;
    return;
  }
  if (password !== document.getElementById("signup-confirm").value) {
    signupError.textContent = "비밀번호가 서로 다릅니다.";
    signupError.hidden = false;
    return;
  }

  signupButton.disabled = true;
  signupButton.textContent = "CREATING...";
  try {
    const user = await API.auth.signup({
      userId,
      name: document.getElementById("signup-name").value.trim(),
      email: document.getElementById("signup-email").value.trim(),
      password
    });
    signupForm.reset();
    resetPasswordToggles(signupForm);
    checkedUserId = null;
    setIdHint("");
    showUser(user);
  } catch (err) {
    signupError.textContent = err.message || "회원가입에 실패했습니다.";
    signupError.hidden = false;
  } finally {
    signupButton.disabled = false;
    signupButton.textContent = "CREATE ACCOUNT";
  }
});

const logoutButton = document.createElement("button");
logoutButton.type = "button";
logoutButton.className = "user-login-button";
logoutButton.textContent = "SIGN OUT";
logoutButton.style.marginTop = "28px";
logoutButton.hidden = true;
document.getElementById("signupForm").after(logoutButton);

logoutButton.addEventListener("click", async () => {
  await API.auth.logout();
  showUser(null);
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.hidden = true;
  loginButton.disabled = true;
  loginButton.textContent = "SIGNING IN...";

  try {
    const user = await API.auth.login(
      document.getElementById("user-id").value.trim(),
      document.getElementById("user-password").value
    );
    loginForm.reset();
    resetPasswordToggles(loginForm);
    showUser(user);
  } catch (err) {
    loginError.textContent = err.message || "로그인에 실패했습니다.";
    loginError.hidden = false;
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "SIGN IN";
  }
});

API.auth.me().then(showUser);

const settingModal = document.getElementById("settingModal");
const settingTitle = document.getElementById("settingTitle");
const settingBody = document.getElementById("settingBody");

const escHTML = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function openSetting(title, html) {
  settingTitle.textContent = title;
  settingBody.innerHTML = html;
  addPasswordToggles(settingBody);
  settingModal.hidden = false;
  const first = settingBody.querySelector("input, textarea, button");
  if (first) first.focus();
}

function closeSetting() {
  settingModal.hidden = true;
  settingBody.innerHTML = "";
}

function setMsg(text, ok = false) {
  const msg = settingBody.querySelector(".user-modal-msg");
  msg.textContent = text;
  msg.classList.toggle("is-ok", ok);
  msg.hidden = false;
}

async function withLoading(button, label, task) {
  button.disabled = true;
  const original = button.textContent;
  button.textContent = label;
  try { await task(); } catch (err) { setMsg(err.message || "요청에 실패했습니다."); }
  finally { button.disabled = false; button.textContent = original; }
}

async function showConnections() {
  openSetting("CONNECTED ACCOUNTS", '<p class="user-modal-desc">불러오는 중...</p>');
  try {
    const list = await API.account.connections();
    settingBody.innerHTML = `
      <p class="user-modal-desc">소셜 계정을 연결하면 간편하게 로그인할 수 있어요.</p>
      <ul class="user-connect-list">
        ${list.map((c) => `
          <li>
            <div><p>${escHTML(c.label)}</p><span>${c.connected ? escHTML(c.email) : "Not connected"}</span></div>
            <button type="button" class="${c.connected ? "user-btn-line" : "user-btn-dark"}" data-provider="${escHTML(c.provider)}" data-connected="${c.connected}">
              ${c.connected ? "DISCONNECT" : "CONNECT"}
            </button>
          </li>`).join("")}
      </ul>
      <p class="user-modal-msg" hidden></p>`;
  } catch (err) {
    settingBody.innerHTML = `<p class="user-modal-msg">${escHTML(err.message)}</p>`;
  }
}

settingBody.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-provider]");
  if (!btn) return;
  withLoading(btn, "...", async () => {
    if (btn.dataset.connected === "true") await API.account.disconnect(btn.dataset.provider);
    else await API.account.connect(btn.dataset.provider);
    await showConnections();
  });
});

function showPassword() {
  openSetting("ID / PASSWORD", `
    <form class="user-modal-form" id="idForm">
      <label for="newUserId">NEW ID</label>
      <div class="user-modal-row">
        <input type="text" id="newUserId" placeholder="New ID" autocomplete="username" required>
        <button type="submit" class="user-btn-dark">CHANGE</button>
      </div>
    </form>

    <form class="user-modal-form" id="pwForm">
      <label for="currentPw">CURRENT PASSWORD</label>
      <input type="password" id="currentPw" autocomplete="current-password" required>
      <label for="newPw">NEW PASSWORD</label>
      <input type="password" id="newPw" autocomplete="new-password" minlength="8" placeholder="8자 이상" required>
      <label for="confirmPw">CONFIRM PASSWORD</label>
      <input type="password" id="confirmPw" autocomplete="new-password" required>
      <button type="submit" class="user-btn-dark user-btn-full">CHANGE PASSWORD</button>
    </form>
    <p class="user-modal-msg" hidden></p>`);

  document.getElementById("idForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const btn = e.submitter;
    withLoading(btn, "SAVING...", async () => {
      const user = await API.account.changeUserId(document.getElementById("newUserId").value.trim());
      showUser(user);
      setMsg("아이디가 변경되었습니다.", true);
    });
  });

  document.getElementById("pwForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const newPw = document.getElementById("newPw").value;
    if (newPw !== document.getElementById("confirmPw").value) {
      setMsg("새 비밀번호가 서로 다릅니다.");
      return;
    }
    const btn = e.submitter;
    withLoading(btn, "SAVING...", async () => {
      await API.account.changePassword(document.getElementById("currentPw").value, newPw);
      e.target.reset();
      setMsg("비밀번호가 변경되었습니다.", true);
    });
  });
}

function showSupport() {
  const faqs = [
    ["LP는 어떻게 만들어요?", "Record 페이지에서 + ADD LP 를 누르고 이름을 입력하면 편집 화면으로 이동해요."],
    ["친구는 어떻게 추가해요?", "Friends → REQUESTS 탭에서 친구 아이디를 입력하고 SEND REQUEST 를 눌러요."],
    ["친구가 내 LP를 볼 수 있나요?", "친구로 연결되면 최근 LP 3개가 친구의 Friends 페이지에 보여요."]
  ];
  openSetting("HELP & SUPPORT", `
    <div class="user-faq">
      ${faqs.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("")}
    </div>
    <form class="user-modal-form" id="supportForm">
      <label for="supportSubject">SUBJECT</label>
      <input type="text" id="supportSubject" maxlength="80" required>
      <label for="supportMessage">MESSAGE</label>
      <textarea id="supportMessage" rows="4" maxlength="1000" required></textarea>
      <button type="submit" class="user-btn-dark user-btn-full">SEND</button>
    </form>
    <p class="user-modal-msg" hidden></p>`);

  document.getElementById("supportForm").addEventListener("submit", (e) => {
    e.preventDefault();
    withLoading(e.submitter, "SENDING...", async () => {
      await API.support.send(
        document.getElementById("supportSubject").value.trim(),
        document.getElementById("supportMessage").value.trim()
      );
      e.target.reset();
      setMsg("문의가 접수되었습니다. 답변은 이메일로 보내드려요.", true);
    });
  });
}

function showDelete() {
  openSetting("DELETE ACCOUNT", `
    <p class="user-modal-desc">탈퇴하면 모든 LP와 친구 목록이 삭제되고 복구할 수 없습니다.<br>계속하려면 아래에 <b>DELETE</b> 를 입력하고 비밀번호를 확인해주세요.</p>
    <form class="user-modal-form" id="deleteForm">
      <label for="deleteConfirm">TYPE "DELETE"</label>
      <input type="text" id="deleteConfirm" autocomplete="off" required>
      <label for="deletePw">PASSWORD</label>
      <input type="password" id="deletePw" autocomplete="current-password" required>
      <button type="submit" class="user-btn-dark user-btn-full" id="deleteSubmit" disabled>DELETE MY ACCOUNT</button>
    </form>
    <p class="user-modal-msg" hidden></p>`);

  const confirmInput = document.getElementById("deleteConfirm");
  const submit = document.getElementById("deleteSubmit");
  confirmInput.addEventListener("input", () => { submit.disabled = confirmInput.value !== "DELETE"; });

  document.getElementById("deleteForm").addEventListener("submit", (e) => {
    e.preventDefault();
    withLoading(submit, "DELETING...", async () => {
      await API.account.remove(document.getElementById("deletePw").value);
      closeSetting();
      showUser(null);
      alert("탈퇴가 완료되었습니다.");
    });
  });
}

const settingActions = { connections: showConnections, password: showPassword, support: showSupport, delete: showDelete };

function handleSetting(item) {
  const key = item.dataset.setting;
  if (key !== "support" && !API.auth.isLoggedIn()) {
    openSetting("SIGN IN REQUIRED", '<p class="user-modal-desc">로그인 후 이용할 수 있어요.</p>');
    return;
  }
  settingActions[key]();
}

document.querySelectorAll(".user-setting-item[data-setting]").forEach((item) => {
  item.addEventListener("click", () => handleSetting(item));
  item.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSetting(item); }
  });
});

document.getElementById("settingClose").addEventListener("click", closeSetting);
settingModal.addEventListener("click", (e) => { if (e.target === settingModal) closeSetting(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !settingModal.hidden) closeSetting(); });
