
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

loadLP();
setEditMode(isEditMode);
