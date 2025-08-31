// UppalCRM Marketing Website JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initNavigation();
    initSmoothScrolling();
    initTrialForm();
    initPricingInteractions();
    initAnimations();
    initMobileNavigation();
});

// Navigation functionality
function initNavigation() {
    const navbar = document.querySelector('.navbar');
    let lastScrollY = window.scrollY;

    // Add scroll effect to navbar
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Hide navbar when scrolling down, show when scrolling up
        if (currentScrollY > lastScrollY && currentScrollY > 200) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }

        lastScrollY = currentScrollY;
    });
}

// Mobile navigation
function initMobileNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });

        // Close mobile menu when clicking on links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        });
    }
}

// Smooth scrolling for anchor links
function initSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80; // Account for fixed navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Trial form handling
function initTrialForm() {
    const form = document.getElementById('trialForm');
    
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Validate form
        const validation = validateTrialForm(data);
        if (!validation.isValid) {
            showFormErrors(validation.errors);
            return;
        }
        
        // Clear any existing errors
        clearFormErrors();
        
        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.classList.add('loading');
        submitButton.textContent = 'Creating Account...';
        submitButton.disabled = true;
        
        try {
            // Make real API call to registration endpoint
            const result = await simulateTrialSignup(data);
            
            // Show success message with login details
            const loginUrl = `https://uppalcrm-frontend.onrender.com/login?org=${result.organizationSlug}`;
            const successMessage = `
                <div class="success-details">
                    <h4>🎉 Account Created Successfully!</h4>
                    <p><strong>Your CRM is ready to use:</strong></p>
                    <div class="login-details">
                        <p><strong>Login URL:</strong> <a href="${loginUrl}" target="_blank">${loginUrl}</a></p>
                        <p><strong>Email:</strong> ${data.email}</p>
                        <p><strong>Temporary Password:</strong> <code>${result.temporaryPassword}</code></p>
                        <p><strong>Organization:</strong> ${data.company}</p>
                    </div>
                    <div class="next-steps">
                        <p><strong>Next Steps:</strong></p>
                        <ol>
                            <li>Click the login URL above to access your CRM</li>
                            <li>Use the temporary password to log in</li>
                            <li>Change your password in the settings</li>
                            <li>Start adding your leads and team members!</li>
                        </ol>
                    </div>
                    <p><em>💡 Bookmark the login URL for easy access later</em></p>
                </div>
            `;
            showFormSuccess(successMessage);
            
            // Reset form
            form.reset();
            
            // Track conversion event
            trackConversion('trial_signup', {
                ...data,
                organizationSlug: result.organizationSlug,
                loginUrl: loginUrl
            });
            
        } catch (error) {
            console.error('Trial signup error:', error);
            showFormError(error.message || 'Something went wrong. Please try again or contact support.');
        } finally {
            // Reset button state
            submitButton.classList.remove('loading');
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    });
}

// Form validation
function validateTrialForm(data) {
    const errors = {};
    
    // Required fields
    const required = ['firstName', 'lastName', 'email', 'company'];
    required.forEach(field => {
        if (!data[field] || data[field].trim() === '') {
            errors[field] = `${formatFieldName(field)} is required`;
        }
    });
    
    // Email validation
    if (data.email && !isValidEmail(data.email)) {
        errors.email = 'Please enter a valid email address';
    }
    
    // Website validation (if provided)
    if (data.website && data.website.trim() !== '' && !isValidURL(data.website)) {
        errors.website = 'Please enter a valid website URL';
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors: errors
    };
}

// Helper functions for validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidURL(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

function formatFieldName(fieldName) {
    return fieldName
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
}

// Form error handling
function showFormErrors(errors) {
    clearFormErrors();
    
    Object.keys(errors).forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (field) {
            const formGroup = field.closest('.form-group');
            formGroup.classList.add('error');
            
            // Add error message
            const errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            errorElement.textContent = errors[fieldName];
            formGroup.appendChild(errorElement);
        }
    });
}

function clearFormErrors() {
    const errorGroups = document.querySelectorAll('.form-group.error');
    errorGroups.forEach(group => {
        group.classList.remove('error');
        const errorElement = group.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    });
    
    // Remove any global error/success messages
    const existingMessages = document.querySelectorAll('.form-error, .form-success');
    existingMessages.forEach(msg => msg.remove());
}

function showFormError(message) {
    const form = document.getElementById('trialForm');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.textContent = message;
    form.insertBefore(errorDiv, form.firstChild);
}

function showFormSuccess(message) {
    const form = document.getElementById('trialForm');
    const successDiv = document.createElement('div');
    successDiv.className = 'form-success';
    successDiv.innerHTML = message;
    form.insertBefore(successDiv, form.firstChild);
    
    // Scroll to success message
    successDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Generate secure temporary password
function generateSecurePassword() {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one of each type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special char
    
    // Fill remaining length
    for (let i = password.length; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Generate slug from company name (alphanumeric only)
function generateSlug(companyName) {
    return companyName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, '') // Remove all special characters
        .replace(/\s+/g, '') // Remove all spaces
        .replace(/[^a-z0-9]/g, ''); // Keep only alphanumeric characters
}

// Real API call for trial signup
async function simulateTrialSignup(data) {
    try {
        // Generate secure temporary password
        const temporaryPassword = generateSecurePassword();
        
        // Generate organization slug from company name
        const organizationSlug = generateSlug(data.company);
        
        // Extract domain from website URL if provided
        let domainOnly = null;
        if (data.website && data.website.trim() !== '') {
            try {
                const url = new URL(data.website.startsWith('http') ? data.website : 'https://' + data.website);
                domainOnly = url.hostname;
            } catch (e) {
                // If URL parsing fails, assume it's already a domain
                domainOnly = data.website.replace(/^https?:\/\//, '').split('/')[0];
            }
        }

        // Format data according to API requirements
        const requestData = {
            organization: {
                name: data.company,
                slug: organizationSlug,
                domain: domainOnly
            },
            admin: {
                email: data.email.toLowerCase().trim(),
                password: temporaryPassword,
                first_name: data.firstName.trim(),
                last_name: data.lastName.trim()
            }
        };
        
        console.log('Sending registration request:', {
            ...requestData,
            admin: { ...requestData.admin, password: '[HIDDEN]' }
        });
        
        // Make API call to registration endpoint
        const response = await fetch('https://uppalcrm-api.onrender.com/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(errorData.message || `Registration failed: ${response.status} ${response.statusText}`);
        }
        
        const responseData = await response.json();
        
        // Store temporary password for user notification (in production, this should be sent via email)
        console.log('Account created successfully!');
        console.log('Temporary password:', temporaryPassword);
        console.log('Organization slug:', organizationSlug);
        
        return {
            success: true,
            message: 'Account created successfully',
            data: responseData,
            temporaryPassword: temporaryPassword,
            organizationSlug: organizationSlug
        };
        
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle specific error types
        if (error.message.includes('slug already exists')) {
            throw new Error('A company with this name already exists. Please choose a different company name.');
        } else if (error.message.includes('Email already exists')) {
            throw new Error('An account with this email already exists.');
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
        } else {
            throw new Error(error.message || 'Failed to create account. Please try again or contact support.');
        }
    }
}

// Analytics tracking
function trackConversion(eventName, data) {
    // Integration with analytics services like Google Analytics, Mixpanel, etc.
    console.log(`Tracking conversion: ${eventName}`, data);
    
    // Example Google Analytics 4 event
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, {
            'company_name': data.company,
            'industry': data.industry || 'unknown',
            'team_size': data.teamSize || 'unknown'
        });
    }
    
    // Example Facebook Pixel event
    if (typeof fbq !== 'undefined') {
        fbq('track', 'CompleteRegistration', {
            content_name: 'CRM Trial Signup',
            value: 149, // Professional plan value
            currency: 'USD'
        });
    }
}

// Pricing interactions
function initPricingInteractions() {
    const pricingCards = document.querySelectorAll('.pricing-card');
    
    pricingCards.forEach(card => {
        const button = card.querySelector('.btn');
        
        if (button) {
            button.addEventListener('click', (e) => {
                const planName = card.querySelector('h3').textContent;
                
                if (button.textContent.includes('Contact Sales')) {
                    // Handle enterprise contact
                    handleEnterpriseContact(planName);
                } else {
                    // Handle trial signup for other plans
                    handlePlanTrialSignup(planName);
                }
            });
        }
    });
}

function handleEnterpriseContact(planName) {
    // Scroll to form or open contact modal
    const trialSection = document.getElementById('trial');
    if (trialSection) {
        trialSection.scrollIntoView({ behavior: 'smooth' });
        
        // Pre-fill form with enterprise interest
        const companyField = document.getElementById('company');
        if (companyField && !companyField.value) {
            companyField.focus();
        }
    }
    
    // Track enterprise interest
    trackConversion('enterprise_interest', { plan: planName });
}

function handlePlanTrialSignup(planName) {
    // Scroll to trial form
    const trialSection = document.getElementById('trial');
    if (trialSection) {
        trialSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Track plan interest
    trackConversion('plan_interest', { plan: planName });
}

// Animations and scroll effects
function initAnimations() {
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll(
        '.feature-card, .pricing-card, .trial-form-container'
    );
    
    animateElements.forEach(el => {
        observer.observe(el);
    });
    
    // Counter animations for stats
    animateCounters();
}

function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    });
    
    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

function animateCounter(element) {
    const text = element.textContent;
    const value = parseInt(text.replace(/[^\d]/g, ''));
    const suffix = text.replace(/[\d,]/g, '');
    
    if (isNaN(value)) return;
    
    const duration = 2000;
    const increment = value / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
            current = value;
            clearInterval(timer);
        }
        
        const displayValue = Math.floor(current);
        element.textContent = displayValue.toLocaleString() + suffix;
    }, 16);
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Add CSS for mobile navigation and animations
const additionalStyles = `
<style>
/* Mobile Navigation Styles */
@media (max-width: 768px) {
    .nav-menu {
        position: fixed;
        top: 80px;
        left: 0;
        width: 100%;
        height: calc(100vh - 80px);
        background: white;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        padding: var(--space-8) 0;
        transform: translateX(-100%);
        transition: transform 0.3s ease-in-out;
        box-shadow: var(--shadow-lg);
    }
    
    .nav-menu.active {
        transform: translateX(0);
    }
    
    .nav-toggle.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
    }
    
    .nav-toggle.active span:nth-child(2) {
        opacity: 0;
    }
    
    .nav-toggle.active span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
    }
    
    body.menu-open {
        overflow: hidden;
    }
}

/* Animation Classes */
.feature-card,
.pricing-card,
.trial-form-container {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}

.feature-card.animate-in,
.pricing-card.animate-in,
.trial-form-container.animate-in {
    opacity: 1;
    transform: translateY(0);
}

/* Enhanced navbar scroll effect */
.navbar.scrolled {
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
    box-shadow: var(--shadow-sm);
}

/* Form Success Styling */
.form-success {
    background: #f0f9ff;
    border: 2px solid #0ea5e9;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    color: #0c4a6e;
}

.form-success h4 {
    margin: 0 0 15px 0;
    color: #0ea5e9;
    font-size: 1.2em;
}

.form-success .login-details {
    background: white;
    border-radius: 6px;
    padding: 15px;
    margin: 15px 0;
    border-left: 4px solid #0ea5e9;
}

.form-success .login-details p {
    margin: 8px 0;
    font-size: 0.95em;
}

.form-success code {
    background: #e0f2fe;
    padding: 4px 8px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-weight: bold;
    color: #0c4a6e;
    user-select: all;
}

.form-success .next-steps {
    margin-top: 15px;
}

.form-success ol {
    margin: 10px 0;
    padding-left: 20px;
}

.form-success ol li {
    margin: 8px 0;
    font-size: 0.95em;
}

.form-success a {
    color: #0ea5e9;
    text-decoration: none;
    font-weight: 500;
}

.form-success a:hover {
    text-decoration: underline;
}

.form-error {
    background: #fef2f2;
    border: 2px solid #ef4444;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 20px;
    color: #dc2626;
}
</style>
`;

// Inject additional styles
document.head.insertAdjacentHTML('beforeend', additionalStyles);
