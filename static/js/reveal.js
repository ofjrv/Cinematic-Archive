document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".reveal-group").forEach((group) => {
    group.querySelectorAll(".reveal").forEach((el, i) => {
      el.style.setProperty("--reveal-delay", 0.05 + i * 0.08 + "s");
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -10% 0px" }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
});
