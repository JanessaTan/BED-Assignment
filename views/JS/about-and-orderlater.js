document.addEventListener('DOMContentLoaded', function () {

    // Helper function to make elements clickable
    function makeClickable(selector, page) {
        document.querySelectorAll(selector).forEach(el => {
            el.style.cursor = 'pointer';
            el.addEventListener('click', () => {
                window.location.href = page;
            });
        });
    }

    // Social icons
    makeClickable('.social-icons img', 'Dummy.html');

    // Contact (top bar)
    makeClickable('.top-bar .contact span', 'Contact.html');

    // Explore section
    makeClickable('.About-explore h3', 'Stalls.html');
    makeClickable('.About-explore p', 'Contact.html');

    // 6 stalls info box
    document.querySelectorAll('.info-box').forEach(box => {
        if (box.textContent.includes('Stalls')) {
            box.style.cursor = 'pointer';
            box.addEventListener('click', () => {
                window.location.href = 'Stalls.html';
            });
        }
    });

    // More button
    makeClickable('.more-btn button', 'Feedback.html');

    // Footer brand
    makeClickable('.footer-brand h3', 'Dummy.html');

    // Footer utility
    makeClickable('.FooterUtility p', 'Dummy.html');

    // Rating page
    makeClickable('.FooterUtility .rating', 'rating.html');

    // Navbar links
    let navLinks = document.querySelectorAll('.nav-links a');
    let pages = ["Home.html", "About.html", "Stalls.html", "Promotion.html", "Contact.html"];

    navLinks.forEach((link, i) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = pages[i];
        });
    });

    // Footer pages
    let footerPages = document.querySelectorAll('.footerPage p');
    let pageMap = [
        "Home.html",
        "About.html",
        "Stalls.html",
        "Menu.html",
        "Feedback.html",
        "Promotion.html",
        "Contact.html"
    ];

    footerPages.forEach((p, i) => {
        p.style.cursor = 'pointer';
        p.addEventListener('click', () => {
            window.location.href = pageMap[i];
        });
    });

    // Order button
    makeClickable('.order-btn button', 'Order.html');

   //order later form

    let orderForm = document.getElementById('ol');
    let pickupInput = document.getElementById('pickupTime');
    let scheduleBtn = document.querySelector('.scheduleBtn');

    if (orderForm) {
        orderForm.addEventListener('submit', function (e) {
            e.preventDefault();

            let time = pickupInput.value;

            if (!time) {
                alert("Please select a pickup time!");
                return;
            }

            // Save to localStorage
            setOrder({
            type: "later",
            pickupTime: time
        });

            window.location.href = 'Stalls.html';
        });
    }

    if (scheduleBtn) {
        scheduleBtn.style.cursor = 'pointer';
        scheduleBtn.addEventListener('click', function (e) {
            e.preventDefault();
            window.location.href = 'Stalls.html';
        });
    }

});