const announcementList = document.querySelector("#announcementList");

function renderAnnouncementPage() {
  if (!announcementList) return;

  announcementList.replaceChildren();

  window.ANNOUNCEMENTS.forEach((announcement) => {
    const article = document.createElement("article");
    article.className = "announcement-item";

    const meta = document.createElement("p");
    meta.className = "announcement-meta";
    meta.textContent = `${announcement.date} / ${announcement.category}`;

    const title = document.createElement("h2");
    title.textContent = announcement.title;

    const body = document.createElement("p");
    body.textContent = announcement.body;

    article.append(meta, title, body);

    if (announcement.link) {
      const link = document.createElement("a");
      link.href = announcement.link;
      link.textContent = announcement.linkLabel || "詳しく見る";
      article.append(link);
    }

    announcementList.append(article);
  });
}

renderAnnouncementPage();
