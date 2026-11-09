
/* ==========================================
   CINEMATIC ARCHIVE - LP GALLERY
   js/record.js
========================================== */

// 갤러리 요소
const lpGallery = document.getElementById("lpGallery");
const addLpBtn = document.getElementById("addLpBtn");
const editOrderBtn = document.getElementById("editOrderBtn");
const emptyMessage = document.getElementById("emptyMessage");

// 생성 팝업 요소
const lpModal = document.getElementById("lpModal");
const lpNameInput = document.getElementById("lpNameInput");
const lpCreateForm = document.getElementById("lpCreateForm");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");

let isEditingOrder = false;
let draggedLPId = null;
let pendingDeleteId = null;

/* ==========================================
   1. 데이터 저장 / 불러오기
========================================== */

let lpList = [];

function showSaveError(error) {
  console.error("LP 저장 실패:", error);
  alert(error.message || "저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
}

function getSortedLPs() {
  return [...lpList].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );
}

/* ==========================================
   2. LP 커버 디자인 생성
========================================== */

function createCover(lp) {
  const front = lp.front || {};

  const validTemplates = [
    "minimal",
    "photo",
    "typography"
  ];

  const template = validTemplates.includes(front.template)
    ? front.template
    : "minimal";

  const card = document.createElement("div");

  card.className = `lp-card template-${template}`;

  card.style.backgroundColor =
    front.backgroundColor || "#dddddd";

  card.style.color =
    front.textColor || "#222222";

  // 업로드한 커버 이미지
  if (lp.coverImage) {
    card.style.backgroundImage =
      `url("${lp.coverImage}")`;

    card.style.backgroundSize = "cover";
    card.style.backgroundPosition = "center";
  }

  // 편집기와 동일한 텍스트 구성
  const content = document.createElement("div");
  content.className = "cover-content";

  const smallText = document.createElement("span");
  smallText.className = "cover-small-text";
  smallText.textContent = "CINEMATIC ARCHIVE";

  const title = document.createElement("h2");
  title.textContent =
    front.text ?? lp.title ?? "Untitled LP";

  const number = document.createElement("span");
  number.className = "cover-number";
  number.textContent = "SIDE A · 001";

  content.appendChild(smallText);
  content.appendChild(title);
  content.appendChild(number);

  card.appendChild(content);

  return card;
}

/* ==========================================
   3. LP 카드 생성
========================================== */

function createLPCard(lp) {
  const item = document.createElement("div");
  item.className = "lp-item";

  const card = createCover(lp);

  // LP 클릭 시 감상 화면으로 이동
  card.addEventListener("click", () => {
    if (isEditingOrder) return;

    window.location.href =
      `record-editor.html?id=${encodeURIComponent(lp.id)}`;
  });

  // 키보드 접근
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `${lp.title} LP 열기`);

  card.addEventListener("keydown", (event) => {
    if (isEditingOrder) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      window.location.href =
        `record-editor.html?id=${encodeURIComponent(lp.id)}`;
    }
  });

  const title = document.createElement("p");
  title.className = "lp-title";
  title.textContent = lp.title;

  item.appendChild(card);
  item.appendChild(title);

  if (lp.isPublic === false) {
    const badge = document.createElement("span");
    badge.className = "lp-private-badge";
    badge.textContent = "PRIVATE";
    item.appendChild(badge);
  }

  /* ======================================
     순서 편집 모드
  ====================================== */

  if (isEditingOrder) {
    card.draggable = true;

    card.addEventListener("dragstart", (event) => {
      draggedLPId = lp.id;

      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", lp.id);

      item.classList.add("dragging");
    });

    item.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";

      if (draggedLPId && draggedLPId !== lp.id) {
        item.classList.add("drag-over");
      }
    });

    item.addEventListener("dragleave", (event) => {
      if (!item.contains(event.relatedTarget)) {
        item.classList.remove("drag-over");
      }
    });

    item.addEventListener("drop", (event) => {
      event.preventDefault();
      event.stopPropagation();

      item.classList.remove("drag-over");

      if (!draggedLPId || draggedLPId === lp.id) {
        return;
      }

      swapLP(draggedLPId, lp.id);
    });

    card.addEventListener("dragend", () => {
      draggedLPId = null;

      document
        .querySelectorAll(".dragging, .drag-over")
        .forEach(element => {
          element.classList.remove(
            "dragging",
            "drag-over"
          );
        });
    });

    // 삭제 버튼
    const controls = document.createElement("div");
    controls.className = "lp-edit-controls";

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-lp-btn";
    deleteBtn.textContent = "×";
    deleteBtn.title = "LP 삭제";

    deleteBtn.setAttribute(
      "aria-label",
      `${lp.title} 삭제`
    );

    deleteBtn.addEventListener("click", () => {
      openDeleteModal(lp.id);
    });

    controls.appendChild(deleteBtn);
    item.appendChild(controls);
  }

  return item;
}

/* ==========================================
   4. 갤러리 화면 출력
========================================== */

function renderGallery() {
  lpGallery.innerHTML = "";

  const sortedLPs = getSortedLPs();

  emptyMessage.hidden = sortedLPs.length !== 0;

  lpGallery.classList.toggle(
    "order-editing",
    isEditingOrder
  );

  const LP_PER_ROW = 5;

  for (
    let i = 0;
    i < sortedLPs.length;
    i += LP_PER_ROW
  ) {
    const row = document.createElement("div");
    row.className = "lp-row";

    const rowLPs = sortedLPs.slice(
      i,
      i + LP_PER_ROW
    );

    rowLPs.forEach(lp => {
      row.appendChild(createLPCard(lp));
    });

    lpGallery.appendChild(row);
  }
}

/* ==========================================
   5. 순서 편집
========================================== */

function toggleOrderEditing() {
  isEditingOrder = !isEditingOrder;

  editOrderBtn.textContent = isEditingOrder
    ? "Done Editing"
    : "Edit Order";

  editOrderBtn.classList.toggle(
    "is-active",
    isEditingOrder
  );

  draggedLPId = null;
  renderGallery();
}

async function swapLP(sourceId, targetId) {
  const sorted = getSortedLPs();

  const sourceIndex = sorted.findIndex(
    lp => lp.id === sourceId
  );

  const targetIndex = sorted.findIndex(
    lp => lp.id === targetId
  );

  if (
    sourceIndex < 0 ||
    targetIndex < 0 ||
    sourceIndex === targetIndex
  ) {
    return;
  }

  // 두 위치를 서로 교환
  [
    sorted[sourceIndex],
    sorted[targetIndex]
  ] = [
    sorted[targetIndex],
    sorted[sourceIndex]
  ];

  const updated = sorted.map((lp, index) => ({
    ...lp,
    order: index
  }));

  try {
    await API.lps.reorder(updated.map(lp => lp.id));
    lpList = updated;
    renderGallery();
  } catch (error) {
    showSaveError(error);
  }

  draggedLPId = null;
}

/* ==========================================
   6. 새 LP 생성
========================================== */

function openLPModal() {
  lpNameInput.value = "";
  lpModal.hidden = false;
  lpNameInput.focus();
}

function closeLPModal() {
  lpModal.hidden = true;
  lpNameInput.value = "";
  addLpBtn.focus();
}

async function createNewLP(event) {
  event.preventDefault();

  const title = lpNameInput.value.trim();

  if (!title) {
    lpNameInput.focus();
    return;
  }

  const nextOrder = lpList.reduce(
    (max, lp) => Math.max(max, lp.order ?? -1),
    -1
  ) + 1;

  const newLP = {
    title: title,
    coverImage: "",
    isPublic: true,

    front: {
      template: "minimal",
      backgroundColor: "#d3d3d3",
      textColor: "#222222",
      text: title
    },

    back: {
      backgroundColor: "#777777",
      textColor: "#ffffff",
      text: ""
    },

    order: nextOrder
  };

  try {
    const created = await API.lps.create(newLP);

    // 새 LP는 즉시 편집 모드로 이동
    window.location.href =
      `record-editor.html?id=${encodeURIComponent(created.id)}&mode=edit`;
  } catch (error) {
    showSaveError(error);
  }
}

/* ==========================================
   7. LP 삭제 팝업
========================================== */

function createDeleteModal() {
  const modal = document.createElement("div");

  modal.id = "deleteLpModal";
  modal.className = "delete-modal";
  modal.hidden = true;

  modal.innerHTML = `
    <div class="delete-modal-content"
         role="dialog"
         aria-modal="true"
         aria-labelledby="deleteModalTitle">

      <h2 id="deleteModalTitle">LP 삭제하기</h2>

      <p id="deleteModalMessage"></p>

      <div class="delete-modal-actions">
        <button type="button"
                id="cancelDeleteBtn"
                class="modal-cancel">
          취소
        </button>

        <button type="button"
                id="confirmDeleteBtn"
                class="delete-confirm-btn">
          삭제
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document
    .getElementById("cancelDeleteBtn")
    .addEventListener("click", closeDeleteModal);

  document
    .getElementById("confirmDeleteBtn")
    .addEventListener("click", deleteLP);

  modal.addEventListener("click", event => {
    if (event.target === modal) {
      closeDeleteModal();
    }
  });
}

function openDeleteModal(lpId) {
  const lp = lpList.find(item => item.id === lpId);

  if (!lp) return;

  pendingDeleteId = lpId;

  document.getElementById("deleteModalMessage")
    .textContent =
      `"${lp.title}" LP를 정말 삭제하시겠습니까? ` +
      "삭제한 LP는 복구할 수 없습니다.";

  document.getElementById("deleteLpModal").hidden = false;
}

function closeDeleteModal() {
  document.getElementById("deleteLpModal").hidden = true;

  pendingDeleteId = null;
}

async function deleteLP() {
  if (!pendingDeleteId) return;

  const deleteId = pendingDeleteId;

  const updated = getSortedLPs()
    .filter(lp => lp.id !== deleteId)
    .map((lp, index) => ({
      ...lp,
      order: index
    }));

  try {
    await API.lps.remove(deleteId);
    await API.lps.reorder(updated.map(lp => lp.id));

    lpList = updated;

    closeDeleteModal();
    renderGallery();
  } catch (error) {
    showSaveError(error);
  }
}

/* ==========================================
   8. 이벤트 연결
========================================== */

addLpBtn.addEventListener("click", openLPModal);

lpCreateForm.addEventListener(
  "submit",
  createNewLP
);

closeModalBtn.addEventListener(
  "click",
  closeLPModal
);

cancelModalBtn.addEventListener(
  "click",
  closeLPModal
);

lpModal.addEventListener("click", event => {
  if (event.target === lpModal) {
    closeLPModal();
  }
});

editOrderBtn.addEventListener(
  "click",
  toggleOrderEditing
);

document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;

  const deleteModal =
    document.getElementById("deleteLpModal");

  if (deleteModal && !deleteModal.hidden) {
    closeDeleteModal();
  } else if (!lpModal.hidden) {
    closeLPModal();
  }
});

/* ==========================================
   9. 최초 실행
========================================== */

createDeleteModal();

async function loadGallery() {
  try {
    lpList = await API.lps.list();
  } catch (error) {
    console.error("LP 불러오기 실패:", error);
    emptyMessage.textContent = "LP를 불러오지 못했습니다. 새로고침 해주세요.";
    lpList = [];
  }

  renderGallery();
}

loadGallery();
