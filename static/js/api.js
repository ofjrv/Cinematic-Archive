
const API_BASE_URL = "";
const USE_MOCK = true;

const TOKEN_KEY = "cinematicArchiveToken";
const LP_STORAGE_KEY = "cinematicArchiveLPs";

async function apiRequest(path, { method = "GET", body, isForm = false } = {}) {
  const headers = {};
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body && !isForm) headers["Content-Type"] = "application/json";

  const res = await fetch(API_BASE_URL + path, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined
  });

  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
  }

  if (!res.ok) {
    let message = `요청 실패 (${res.status})`;
    try { message = (await res.json()).message || message; } catch (e) {}
    throw new Error(message);
  }

  return res.status === 204 ? null : res.json();
}

const mock = {
  wait: (data) => new Promise((r) => setTimeout(() => r(structuredClone(data)), 150)),
  user: { id: "u-me", userId: "nuri", name: "Nuri" },
  friends: [
    { id: "u-minji", userId: "minji_film", name: "Minji", lpCount: 3 },
    { id: "u-jun", userId: "jun.archive", name: "Jun", lpCount: 2 },
    { id: "u-sora", userId: "sora_scene", name: "Sora", lpCount: 4 }
  ],
  friendLPs: {
    "u-minji": [
      { id: "lp-m1", title: "La La Land", order: 0, isPublic: true, createdAt: "2026-10-12", coverImage: "images/Dune_Part_2_.jpg", front: { template: "photo", backgroundColor: "#1d1d1d", textColor: "#ffffff" } },
      { id: "lp-m2", title: "Her", order: 1, isPublic: false, createdAt: "2026-09-28", front: { template: "typography", backgroundColor: "#e9e4da", textColor: "#111111" } },
      { id: "lp-m3", title: "Past Lives", order: 2, isPublic: true, createdAt: "2026-09-03", front: { template: "minimal", backgroundColor: "#d3d3d3", textColor: "#222222" } },
      { id: "lp-m4", title: "Inception", order: 3, isPublic: true, createdAt: "2026-08-20", coverImage: "images/Inception.jpg", front: { template: "photo", backgroundColor: "#222222", textColor: "#ffffff" } },
      { id: "lp-m5", title: "Columbus", order: 4, isPublic: true, createdAt: "2026-08-02", front: { template: "typography", backgroundColor: "#111111", textColor: "#ffffff" } }
    ],
    "u-jun": [
      { id: "lp-j1", title: "Interstellar", order: 0, isPublic: true, createdAt: "2026-10-30", front: { template: "typography", backgroundColor: "#111111", textColor: "#ffffff" } },
      { id: "lp-j2", title: "Whiplash", order: 1, isPublic: true, createdAt: "2026-10-02", coverImage: "images/One_Battle_After_Another.jpg", front: { template: "photo", backgroundColor: "#333333", textColor: "#ffffff" } }
    ],
    "u-sora": [
      { id: "lp-s1", title: "Little Women", order: 0, isPublic: true, createdAt: "2026-11-01", front: { template: "minimal", backgroundColor: "#e9e4da", textColor: "#111111" } },
      { id: "lp-s2", title: "Aftersun", order: 1, isPublic: true, createdAt: "2026-10-21", coverImage: "images/Sympathy_for_Mr._Vengeance.jpg", front: { template: "photo", backgroundColor: "#222222", textColor: "#ffffff" } },
      { id: "lp-s3", title: "Amélie", order: 2, isPublic: false, createdAt: "2026-10-05", front: { template: "typography", backgroundColor: "#d3d3d3", textColor: "#111111" } },
      { id: "lp-s4", title: "Paterson", order: 3, isPublic: true, createdAt: "2026-09-17", front: { template: "minimal", backgroundColor: "#cfcfcf", textColor: "#111111" } }
    ]
  },
  received: [
    { id: "req-1", from: { id: "u-hana", userId: "hana.reel", name: "Hana" }, createdAt: "2026-11-07" },
    { id: "req-2", from: { id: "u-taeo", userId: "taeo_cut", name: "Taeo" }, createdAt: "2026-11-06" }
  ],
  sent: [
    { id: "req-9", to: { id: "u-yuna", userId: "yuna_frame", name: "yuna_frame" }, status: "PENDING", createdAt: "2026-11-06" }
  ],
  connections: [
    { provider: "google", label: "Google", connected: true, email: "nuri@gmail.com" },
    { provider: "kakao", label: "Kakao", connected: false, email: "" },
    { provider: "apple", label: "Apple", connected: false, email: "" }
  ],
  fullLP(lp) {
    return {
      coverImage: "",
      ...lp,
      front: { template: "minimal", backgroundColor: "#d3d3d3", textColor: "#222222", ...lp.front, text: lp.title },
      back: { backgroundColor: "#777777", textColor: "#ffffff", text: `${lp.title} 를 보고 남긴 기록입니다.`, ...lp.back }
    };
  },
  publicLPs(friendId) {
    return (this.friendLPs[friendId] || [])
      .filter((lp) => lp.isPublic !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((lp) => this.fullLP(lp));
  },
  loadLPs() {
    try { return JSON.parse(localStorage.getItem(LP_STORAGE_KEY)) || []; } catch (e) { return []; }
  },
  saveLPs(lps) { localStorage.setItem(LP_STORAGE_KEY, JSON.stringify(lps)); }
};

const API = {
  auth: {
    async login(userId, password) {
      const data = USE_MOCK
        ? await mock.wait({ token: "mock-token", user: { ...mock.user, userId } })
        : await apiRequest("/auth/login", { method: "POST", body: { userId, password } });
      localStorage.setItem(TOKEN_KEY, data.token);
      return data.user;
    },
    async signup({ userId, name, email, password }) {
      const data = USE_MOCK
        ? await mock.wait({ token: "mock-token", user: { id: `u-${userId}`, userId, name } })
        : await apiRequest("/auth/signup", { method: "POST", body: { userId, name, email, password } });
      if (USE_MOCK) Object.assign(mock.user, data.user);
      localStorage.setItem(TOKEN_KEY, data.token);
      return data.user;
    },
    checkUserId(userId) {
      if (!USE_MOCK) return apiRequest(`/auth/check-id?userId=${encodeURIComponent(userId)}`);
      const taken = ["nuri", "minji_film", "jun.archive", "sora_scene", "admin"].includes(userId);
      return mock.wait({ available: !taken });
    },
    async logout() {
      if (!USE_MOCK) await apiRequest("/auth/logout", { method: "POST" });
      localStorage.removeItem(TOKEN_KEY);
    },
    async me() {
      if (!localStorage.getItem(TOKEN_KEY)) return null;
      if (USE_MOCK) return mock.wait(mock.user);
      try { return await apiRequest("/users/me"); } catch (e) { return null; }
    },
    isLoggedIn: () => !!localStorage.getItem(TOKEN_KEY)
  },

  account: {
    connections: () => USE_MOCK ? mock.wait(mock.connections) : apiRequest("/users/me/connections"),
    async connect(provider) {
      if (!USE_MOCK) {
        const { url } = await apiRequest(`/users/me/connections/${provider}`, { method: "POST" });
        window.location.href = url;
        return;
      }
      const c = mock.connections.find((x) => x.provider === provider);
      c.connected = true; c.email = `nuri@${provider}.com`;
      return mock.wait(c);
    },
    async disconnect(provider) {
      if (!USE_MOCK) return apiRequest(`/users/me/connections/${provider}`, { method: "DELETE" });
      const c = mock.connections.find((x) => x.provider === provider);
      c.connected = false; c.email = "";
      return mock.wait(null);
    },
    async changeUserId(userId) {
      if (!USE_MOCK) return apiRequest("/users/me/user-id", { method: "PATCH", body: { userId } });
      mock.user.userId = userId;
      return mock.wait(mock.user);
    },
    async changePassword(currentPassword, newPassword) {
      if (!USE_MOCK) return apiRequest("/users/me/password", { method: "PATCH", body: { currentPassword, newPassword } });
      return mock.wait(null);
    },
    async remove(password) {
      if (!USE_MOCK) await apiRequest("/users/me", { method: "DELETE", body: { password } });
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
  },

  support: {
    send: (subject, message) => USE_MOCK ? mock.wait(null) : apiRequest("/support", { method: "POST", body: { subject, message } })
  },

  lps: {
    list: () => USE_MOCK ? mock.wait(mock.loadLPs()) : apiRequest("/lps"),
    get: (id) => USE_MOCK ? mock.wait(mock.loadLPs().find((lp) => lp.id === id) || null) : apiRequest(`/lps/${id}`),
    async create(lp) {
      if (!USE_MOCK) return apiRequest("/lps", { method: "POST", body: lp });
      const lps = mock.loadLPs();
      const created = { ...lp, id: `lp-${crypto.randomUUID()}`, createdAt: new Date().toISOString() };
      mock.saveLPs([...lps, created]);
      return mock.wait(created);
    },
    async update(id, lp) {
      if (!USE_MOCK) return apiRequest(`/lps/${id}`, { method: "PUT", body: lp });
      const lps = mock.loadLPs().map((x) => (x.id === id ? { ...x, ...lp, id } : x));
      mock.saveLPs(lps);
      return mock.wait(lps.find((x) => x.id === id));
    },
    async remove(id) {
      if (!USE_MOCK) return apiRequest(`/lps/${id}`, { method: "DELETE" });
      mock.saveLPs(mock.loadLPs().filter((x) => x.id !== id));
      return mock.wait(null);
    },
    async reorder(ids) {
      if (!USE_MOCK) return apiRequest("/lps/order", { method: "PATCH", body: { ids } });
      const lps = mock.loadLPs().map((x) => ({ ...x, order: ids.indexOf(x.id) }));
      mock.saveLPs(lps);
      return mock.wait(null);
    },
    async uploadCover(file) {
      if (USE_MOCK) {
        return new Promise((r) => { const fr = new FileReader(); fr.onload = () => r({ url: fr.result }); fr.readAsDataURL(file); });
      }
      const form = new FormData();
      form.append("file", file);
      return apiRequest("/uploads/cover", { method: "POST", body: form, isForm: true });
    }
  },

  friends: {
    list: () => USE_MOCK
      ? mock.wait(mock.friends.map((f) => ({ ...f, lpCount: mock.publicLPs(f.id).length })))
      : apiRequest("/friends"),
    featuredLPs(friendId, limit = 3) {
      if (!USE_MOCK) return apiRequest(`/friends/${friendId}/lps?featured=true&limit=${limit}`);
      return mock.wait(mock.publicLPs(friendId).slice(0, limit));
    },
    allLPs(friendId) {
      if (!USE_MOCK) return apiRequest(`/friends/${friendId}/lps`);
      return mock.wait(mock.publicLPs(friendId));
    },
    getLP(friendId, lpId) {
      if (!USE_MOCK) return apiRequest(`/friends/${friendId}/lps/${lpId}`);
      const lp = mock.publicLPs(friendId).find((x) => x.id === lpId);
      return mock.wait(lp || null);
    },
    async remove(friendId) {
      if (!USE_MOCK) return apiRequest(`/friends/${friendId}`, { method: "DELETE" });
      mock.friends = mock.friends.filter((f) => f.id !== friendId);
      return mock.wait(null);
    }
  },

  requests: {
    received: () => USE_MOCK ? mock.wait(mock.received) : apiRequest("/friend-requests/received"),
    sent: () => USE_MOCK ? mock.wait(mock.sent) : apiRequest("/friend-requests/sent"),
    async send(userId) {
      if (!USE_MOCK) return apiRequest("/friend-requests", { method: "POST", body: { userId } });
      const req = { id: `req-${Date.now()}`, to: { id: `u-${userId}`, userId, name: userId }, status: "PENDING", createdAt: new Date().toISOString() };
      mock.sent.unshift(req);
      return mock.wait(req);
    },
    async accept(requestId) {
      if (!USE_MOCK) return apiRequest(`/friend-requests/${requestId}/accept`, { method: "POST" });
      const req = mock.received.find((r) => r.id === requestId);
      mock.received = mock.received.filter((r) => r.id !== requestId);
      const friend = { ...req.from, lpCount: 0 };
      mock.friends.push(friend);
      mock.friendLPs[friend.id] = [];
      return mock.wait(friend);
    },
    async decline(requestId) {
      if (!USE_MOCK) return apiRequest(`/friend-requests/${requestId}/decline`, { method: "POST" });
      mock.received = mock.received.filter((r) => r.id !== requestId);
      return mock.wait(null);
    }
  }
};
