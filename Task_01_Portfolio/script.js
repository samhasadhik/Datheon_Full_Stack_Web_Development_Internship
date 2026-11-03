// --- 1. Theme Toggle Logic ---
const themeToggleBtn = document.getElementById('theme-toggle');
const body = document.body;

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') body.classList.add('dark-mode');

themeToggleBtn.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
});

// --- 2. Scroll Reveal Animation ---
const observerOptions = { root: null, rootMargin: '0px', threshold: 0.15 };
const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.section-reveal').forEach(section => {
    observer.observe(section);
});

// --- 3. 3D Tilt Effect for Project Cards ---
// Load vanilla-tilt dynamically
const script = document.createElement('script');
script.src = "https://cdnjs.cloudflare.com/ajax/libs/vanilla-tilt/1.8.0/vanilla-tilt.min.js";
script.onload = () => {
    VanillaTilt.init(document.querySelectorAll("[data-tilt]"), {
        max: 10,          // Max tilt rotation (degrees)
        speed: 400,       // Speed of the enter/exit transition
        glare: true,      // Add a glare effect
        "max-glare": 0.2, // Max glare opacity
        scale: 1.02       // Slight scale up on hover
    });
};
document.body.appendChild(script);

// --- 4. Magnetic Button Hover Effect ---
const magneticElements = document.querySelectorAll('.magnetic');
magneticElements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });
    el.addEventListener('mouseleave', () => {
        el.style.transform = `translate(0px, 0px)`;
        el.style.transition = 'transform 0.3s ease-out';
    });
    el.addEventListener('mouseenter', () => {
        el.style.transition = 'none';
    });
});