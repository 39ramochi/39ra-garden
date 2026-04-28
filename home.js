const homeAnnouncementList = document.querySelector("#homeAnnouncementList");

function renderHomeAnnouncements() {
  if (!homeAnnouncementList) return;

  homeAnnouncementList.replaceChildren();

  window.ANNOUNCEMENTS.slice(0, 3).forEach((announcement) => {
    const item = document.createElement("li");

    const meta = document.createElement("span");
    meta.textContent = `${announcement.date} / ${announcement.category}`;

    const title = document.createElement("strong");
    title.textContent = announcement.title;

    const body = document.createElement("small");
    body.textContent = announcement.body;

    item.append(meta, title, body);
    homeAnnouncementList.append(item);
  });
}

renderHomeAnnouncements();
