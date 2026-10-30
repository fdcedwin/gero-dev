const menuToggle = document.getElementById("menu-toggle");
const header = document.getElementById("header");
const headerContainer = document.getElementById("header__container");
const navList = document.getElementById("header__nav-btn-wrapper");

// Toggles menu on mobile
function toggleMenu() {
  if (header && navList && menuToggle) {
    navList.classList.toggle("open");
    header.classList.toggle("open");
    headerContainer.classList.toggle("open");
    menuToggle.classList.toggle("cross");
  } else {
    // Handle the error appropriately
    console.error("One or more elements are not found.");
  }
}

// Closes menu on mobile when a navList child is clicked
function closeMenu() {
  if (header && navList) {
    navList.classList.remove("open");
    header.classList.remove("open");
    menuToggle.classList.remove("cross");
  } else {
    console.error("One or more elements are not found.");
  }
}

// Event delegation to listen for clicks on any nav-list item
navList.addEventListener("click", function (event) {
  if (event.target.classList.contains("header__nav-list-item")) {
    console.log("Clicked on a nav-link");
    closeMenu();
  }
});


menuToggle.addEventListener("click", toggleMenu);
navList.addEventListener("click", closeMenu);


// Add the current year to the footer
const copyrightYear = document.getElementById("copyright-year");
if (copyrightYear) {
  copyrightYear.textContent = new Date().getFullYear();
}