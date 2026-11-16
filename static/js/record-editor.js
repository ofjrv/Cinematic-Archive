
/* ==========================================
   CINEMATIC ARCHIVE - LP EDITOR
   js/record-editor.js
========================================== */

/* ==========================================
   1. HTML 요소
========================================== */

const titleInput = document.getElementById("lpTitle");
const memoInput = document.getElementById("lpMemo");
const imageInput = document.getElementById("lpImage");

const templateInput = document.getElementById("frontTemplate");
const frontBgInput = document.getElementById("frontBg");
const frontTextInput = document.getElementById("frontTextColor");
const backBgInput = document.getElementById("backBg");
const backTextInput = document.getElementById("backTextColor");

const previewTitle = document.getElementById("previewTitle");
const previewMemo = document.getElementById("previewMemo");

const lpFront = document.getElementById("lpFront");
const lpBack = document.getElementById("lpBack");

const saveButton = document.getElementById("saveButton");
const visibilityInputs = document.querySelectorAll('input[name="visibility"]');
const visibilityHint = document.getElementById("visibilityHint");

function getIsPublic() {
  return document.querySelector('input[name="visibility"]:checked')?.value !== "private";
}

function setIsPublic(isPublic) {
  visibilityInputs.forEach(input => {
    input.checked = input.value === (isPublic ? "public" : "private");
  });
  visibilityHint.textContent = isPublic
    ? "친구에게 이 LP가 보여요."
    : "나만 볼 수 있어요. 친구에게는 보이지 않아요.";
}

visibilityInputs.forEach(input => {
  input.addEventListener("change", () => setIsPublic(getIsPublic()));
});
const editorPanel = document.querySelector(".editor-panel");
const editorPage = document.querySelector(".lp-editor");

/* ==========================================
   2. URL 정보
========================================== */

const urlParams = new URLSearchParams(window.location.search);

const editingId = urlParams.get("id");
const requestedEditMode = urlParams.get("mode") === "edit";

// 새 LP이거나 mode=edit이면 편집 모드
let isEditMode = !editingId || requestedEditMode;

// 현재 LP 데이터
let currentLP = null;

// 업로드한 이미지 데이터
let currentCoverImage = "";

/* ==========================================
   3. 데이터 불러오기
========================================== */

/* ==========================================
   4. LP 미리보기 갱신
========================================== */

function updatePreview() {
  // 제목
  previewTitle.textContent =
    titleInput.value || "Untitled LP";

  // 뒷면 기록
  previewMemo.textContent = memoInput.value;

  // 배경색
  lpFront.style.backgroundColor = frontBgInput.value;
  lpBack.style.backgroundColor = backBgInput.value;

  // 글자색
  lpFront.style.color = frontTextInput.value;
  lpBack.style.color = backTextInput.value;

  // 이미지
  if (currentCoverImage) {
    lpFront.style.backgroundImage =
      `url("${currentCoverImage}")`;
  } else {
    lpFront.style.backgroundImage = "none";
  }

  lpFront.style.backgroundSize = "cover";
  lpFront.style.backgroundPosition = "center";

  // 템플릿
  lpFront.classList.remove(
    "template-minimal",
    "template-photo",
    "template-typography"
  );

  const validTemplates = [
    "minimal",
    "photo",
    "typography"
  ];

  const selectedTemplate = validTemplates.includes(
    templateInput.value
  )
    ? templateInput.value
    : "minimal";

  lpFront.classList.add(`template-${selectedTemplate}`);
}

/* ==========================================
   5. 편집 모드 / 감상 모드
========================================== */

function setEditMode(editing) {
  isEditMode = editing;

  // 감상 모드면 편집 패널 숨기기
  editorPanel.hidden = !editing;

  // 상단 버튼 변경
  saveButton.textContent = editing
    ? "SAVE LP"
    : "EDIT LP";

  // CSS 클래스
  editorPage.classList.toggle(
    "view-mode",
    !editing
  );

  editorPage.classList.toggle(
    "edit-mode",
    editing
  );

  if (typeof renderViewSoundtracks === "function") {
    renderViewSoundtracks();
  }
}

/* ==========================================
   6. 기존 LP 불러오기
========================================== */

async function loadLP() {
  if (!editingId) {
    // ID가 없으면 새 LP
    updatePreview();
    return;
  }

  let lp = null;

  try {
    lp = await API.lps.get(editingId);
  } catch (error) {
    console.error("LP 불러오기 실패:", error);
  }

  if (!lp) {
    alert("해당 LP를 찾을 수 없습니다.");
    window.location.href = "record.html";
    return;
  }

  currentLP = lp;

  // 제목과 기록
  titleInput.value = lp.title || "";
  selectedTracks = Array.isArray(lp.soundtracks) ? lp.soundtracks : [];
  memoInput.value = lp.back?.text || "";

  // 템플릿
  templateInput.value =
    lp.front?.template || "minimal";

  // 색상
  frontBgInput.value =
    lp.front?.backgroundColor || "#d3d3d3";

  frontTextInput.value =
    lp.front?.textColor || "#222222";

  backBgInput.value =
    lp.back?.backgroundColor || "#777777";

  backTextInput.value =
    lp.back?.textColor || "#ffffff";

  // 커버 이미지
  currentCoverImage = lp.coverImage || "";

  setIsPublic(lp.isPublic !== false);

  updatePreview();
}

/* ==========================================
   7. 입력 이벤트
========================================== */

titleInput.addEventListener("input", updatePreview);
memoInput.addEventListener("input", updatePreview);

templateInput.addEventListener(
  "change",
  updatePreview
);

frontBgInput.addEventListener(
  "input",
  updatePreview
);

frontTextInput.addEventListener(
  "input",
  updatePreview
);

backBgInput.addEventListener(
  "input",
  updatePreview
);

backTextInput.addEventListener(
  "input",
  updatePreview
);

/* ==========================================
   8. 이미지 업로드
========================================== */

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("이미지 파일만 업로드할 수 있습니다.");
    imageInput.value = "";
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    alert("10MB 이하의 이미지를 선택해주세요.");
    imageInput.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");

      canvas.width = 600;
      canvas.height = 600;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        alert("이미지를 처리할 수 없습니다.");
        return;
      }

      // 정사각형으로 중앙 크롭
      const size = Math.min(image.width, image.height);
      const x = (image.width - size) / 2;
      const y = (image.height - size) / 2;

      ctx.drawImage(
        image,
        x, y, size, size,
        0, 0, 600, 600
      );

      try {
        currentCoverImage =
          canvas.toDataURL("image/jpeg", 0.8);

        updatePreview();
      } catch (error) {
        console.error(error);
        alert("이미지 변환에 실패했습니다.");
      }
    };

    image.onerror = () => {
      alert("이미지를 읽을 수 없습니다.");
    };

    image.src = reader.result;
  };

  reader.onerror = () => {
    alert("파일 읽기에 실패했습니다.");
  };

  reader.readAsDataURL(file);
});

/* ==========================================
   9. LP 저장
========================================== */

async function uploadCoverIfNeeded(image) {
  if (!image || !image.startsWith("data:")) return image;

  const blob = await (await fetch(image)).blob();
  const result = await API.lps.uploadCover(blob);

  return result.url;
}

async function saveLP() {
  const title =
    titleInput.value.trim() || "Untitled LP";

  saveButton.disabled = true;
  saveButton.textContent = "SAVING...";

  try {
    const coverImage =
      await uploadCoverIfNeeded(currentCoverImage);

    let order = currentLP?.order;

    if (order === undefined) {
      const lps = await API.lps.list();
      order = lps.length
        ? Math.max(...lps.map(lp => lp.order ?? 0)) + 1
        : 0;
    }

    const lpData = {
      // 기존 데이터의 추가 속성이 있다면 유지
      ...(currentLP || {}),

      title: title,
      coverImage: coverImage,
      isPublic: getIsPublic(),
      soundtracks: selectedTracks,

      front: {
        ...(currentLP?.front || {}),

        template: templateInput.value,
        backgroundColor: frontBgInput.value,
        textColor: frontTextInput.value,
        text: title
      },

      back: {
        ...(currentLP?.back || {}),

        backgroundColor: backBgInput.value,
        textColor: backTextInput.value,
        text: memoInput.value
      },

      order: order
    };

    if (currentLP) {
      await API.lps.update(currentLP.id, lpData);
    } else {
      await API.lps.create(lpData);
    }

    // 저장 후 갤러리로 이동
    window.location.href = "record.html";
  } catch (error) {
    console.error("LP 저장 실패:", error);
    alert(error.message || "저장에 실패했습니다. 잠시 후 다시 시도해주세요.");

    saveButton.disabled = false;
    saveButton.textContent = "SAVE LP";
  }
}

/* ==========================================
   10. 상단 버튼 이벤트
========================================== */

saveButton.addEventListener("click", () => {
  // 감상 모드: EDIT LP
  if (!isEditMode) {
    setEditMode(true);

    editorPanel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    return;
  }

  // 편집 모드: SAVE LP
  saveLP();
});

/* ==========================================
   11. 최초 실행
========================================== */

/* ==========================================
   OST 추천 / 검색
========================================== */

let selectedTracks = [];
let recommendTimer = null;

const escapeHTML = text => String(text ?? "").replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

function buildSoundtrackField() {
  const titleGroup = titleInput.closest(".field-group");
  if (!titleGroup) return;

  const group = document.createElement("div");
  group.className = "field-group full-width soundtrack-field";
  group.innerHTML = `
    <span class="field-label">SOUNDTRACK</span>

    <div class="ost-block">
      <div class="ost-block-head">
        <p class="ost-subtitle" id="ostRecommendTitle">RECOMMENDED</p>
        <span class="ost-note">영화 제목에 맞춰 추천돼요</span>
      </div>
      <div class="ost-list is-single" id="ostRecommendList"></div>
    </div>

    <div class="ost-block">
      <div class="ost-block-head">
        <p class="ost-subtitle">SELECTED <span id="ostSelectedCount">00</span></p>
        <button type="button" class="ost-open-search" id="ostOpenSearch">+ SEARCH OST</button>
      </div>
      <div class="ost-list is-selected" id="ostSelectedList"></div>
    </div>
  `;
  titleGroup.after(group);

  const modal = document.createElement("div");
  modal.className = "ost-modal";
  modal.id = "ostSearchModal";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="ost-modal-content" role="dialog" aria-modal="true" aria-labelledby="ostModalTitle">
      <div class="ost-modal-header">
        <h2 id="ostModalTitle">SEARCH OST</h2>
        <button type="button" class="ost-modal-close" data-ost-close aria-label="닫기">&times;</button>
      </div>
      <p class="ost-modal-desc">영화 OST 중에서 찾아 LP에 추가해요.</p>
      <form class="ost-search" id="ostSearchForm">
        <input type="search" id="ostSearchInput" placeholder="영화 제목, 곡 이름, 아티스트로 검색" autocomplete="off">
        <button type="submit">SEARCH</button>
      </form>
      <div class="ost-list is-modal" id="ostSearchList"></div>
      <div class="ost-modal-footer">
        <span class="ost-note">선택한 곡 <b id="ostModalCount">00</b></span>
        <button type="button" class="ost-done" data-ost-close>DONE</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const openSearch = () => {
    modal.hidden = false;
    document.getElementById("ostSearchInput").focus();
  };
  const closeSearch = () => {
    modal.hidden = true;
    document.getElementById("ostOpenSearch").focus();
  };

  document.getElementById("ostOpenSearch").addEventListener("click", openSearch);

  modal.addEventListener("click", event => {
    if (event.target === modal || event.target.closest("[data-ost-close]")) closeSearch();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.hidden) closeSearch();
  });

  document.getElementById("ostSearchForm").addEventListener("submit", event => {
    event.preventDefault();
    searchTracks(document.getElementById("ostSearchInput").value);
  });

  modal.addEventListener("click", handleTrackAction);
  group.addEventListener("click", handleTrackAction);

  function handleTrackAction(event) {
    const button = event.target.closest("[data-track-action]");
    if (!button) return;

    const card = button.closest(".ost-card");
    const track = JSON.parse(card.dataset.track);

    if (button.dataset.trackAction === "add") addTrack(track);
    else removeTrack(track.id);
  }

  titleInput.addEventListener("input", () => {
    clearTimeout(recommendTimer);
    recommendTimer = setTimeout(loadRecommendations, 500);
  });
}

function trackCardHTML(track, mode) {
  const isSelected = selectedTracks.some(t => t.id === track.id);
  const cover = track.coverUrl
    ? `<img src="${escapeHTML(track.coverUrl)}" alt="">`
    : `<span class="ost-cover-empty">${escapeHTML((track.albumTitle || "?").charAt(0))}</span>`;

  let action = "";
  if (mode === "view") {
    action = "";
  } else if (mode === "selected") {
    action = `<button type="button" class="ost-action is-remove" data-track-action="remove" aria-label="${escapeHTML(track.trackName)} 빼기">×</button>`;
  } else if (isSelected) {
    action = `<span class="ost-action is-done">ADDED</span>`;
  } else {
    action = `<button type="button" class="ost-action" data-track-action="add" aria-label="${escapeHTML(track.trackName)} 추가">+ ADD</button>`;
  }

  return `
    <div class="ost-card" data-track='${escapeHTML(JSON.stringify(track))}'>
      <div class="ost-cover">${cover}</div>
      <div class="ost-info">
        <p class="ost-track">${escapeHTML(track.trackName)}</p>
        <p class="ost-album">${escapeHTML(track.albumTitle)}</p>
        ${track.recommended ? '<span class="ost-badge">RECOMMENDED</span>' : ""}
      </div>
      ${action}
    </div>`;
}

function renderTrackList(listId, tracks, mode, emptyText) {
  const list = document.getElementById(listId);
  if (!list) return;
  list.innerHTML = tracks.length
    ? tracks.map(track => trackCardHTML(track, mode)).join("")
    : `<p class="ost-empty">${emptyText}</p>`;
}

let lastRecommended = [];
let lastSearched = [];

function renderSoundtracks() {
  renderTrackList("ostRecommendList", lastRecommended, "add",
    titleInput.value.trim() ? "추천할 OST를 찾지 못했어요. 아래에서 직접 검색해보세요." : "LP TITLE에 영화 제목을 입력하면 추천돼요.");
  renderTrackList("ostSearchList", lastSearched, "add", "검색어를 입력해 OST를 찾아보세요.");
  renderTrackList("ostSelectedList", selectedTracks, "selected", "아직 고른 곡이 없어요.");

  const count = document.getElementById("ostSelectedCount");
  if (count) count.textContent = String(selectedTracks.length).padStart(2, "0");
  const modalCount = document.getElementById("ostModalCount");
  if (modalCount) modalCount.textContent = String(selectedTracks.length).padStart(2, "0");

  renderViewSoundtracks();
}

async function loadRecommendations() {
  const title = titleInput.value.trim();
  const heading = document.getElementById("ostRecommendTitle");
  if (heading) heading.textContent = title ? `RECOMMENDED FOR "${title.toUpperCase()}"` : "RECOMMENDED";

  try {
    lastRecommended = title ? await API.music.recommend(title, 1) : [];
  } catch (error) {
    console.error("OST 추천 실패:", error);
    lastRecommended = [];
  }
  renderSoundtracks();
}

async function searchTracks(query) {
  if (!query.trim()) {
    lastSearched = [];
    renderSoundtracks();
    return;
  }
  try {
    lastSearched = await API.music.search(query);
    renderSoundtracks();
    if (!lastSearched.length) {
      document.getElementById("ostSearchList").innerHTML =
        '<p class="ost-empty">검색 결과가 없어요.</p>';
    }
  } catch (error) {
    console.error("OST 검색 실패:", error);
    document.getElementById("ostSearchList").innerHTML =
      '<p class="ost-empty">검색에 실패했어요. 잠시 후 다시 시도해주세요.</p>';
  }
}

function addTrack(track) {
  if (selectedTracks.some(t => t.id === track.id)) return;
  selectedTracks.push(track);
  renderSoundtracks();
}

function removeTrack(trackId) {
  selectedTracks = selectedTracks.filter(t => t.id !== trackId);
  renderSoundtracks();
}

function renderViewSoundtracks() {
  const preview = document.querySelector(".lp-preview");
  if (!preview) return;

  let box = document.getElementById("viewSoundtracks");
  if (!box) {
    box = document.createElement("section");
    box.id = "viewSoundtracks";
    box.className = "view-soundtracks";
    preview.after(box);
  }

  box.hidden = isEditMode || selectedTracks.length === 0;
  box.innerHTML = `
    <p class="ost-subtitle">SOUNDTRACK</p>
    <div class="ost-list">
      ${selectedTracks.map(track => trackCardHTML(track, "view")).join("")}
    </div>`;
}

buildSoundtrackField();

loadLP().then(() => {
  renderSoundtracks();
  loadRecommendations();
});
setEditMode(isEditMode);
