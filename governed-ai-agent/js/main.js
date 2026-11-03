
const navLinks = document.querySelectorAll("[data-view]");
const pageViews = document.querySelectorAll(".page-view");
const pageTitle = document.getElementById("pageTitle");

navLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
        event.preventDefault();

        const viewName = link.dataset.view;

        pageViews.forEach(function (view) {
            view.hidden = view.id !== `${viewName}View`;
        });

        document.querySelectorAll(".nav-link").forEach(function (navLink) {
            navLink.classList.remove("active");
        });

        document.querySelectorAll(`.nav-link[data-view="${viewName}"]`)
            .forEach(function (navLink) {
                navLink.classList.add("active");
            });

        const titles = {
            dashboard: "Dashboard",
            tasks: "Tasks",
            approvals: "Approvals",
            policies: "Policies",
            evaluations: "Evaluations"
        };

        pageTitle.textContent = titles[viewName] || "Dashboard";
    });
});
