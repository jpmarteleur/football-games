// Mobile Input Handler - Handles mobile keyboard input for games
class MobileInputHandler {
    constructor(options = {}) {
        this.inputElement = options.inputElement || null;
        this.onLetter = options.onLetter || (() => {});
        this.onEnter = options.onEnter || (() => {});
        this.onBackspace = options.onBackspace || (() => {});
        this.onFocus = options.onFocus || (() => {});
        this.enabled = false;
        this.isMobile = this.detectMobile();
    }

    // Detect if device is mobile
    detectMobile() {
        try {
            const ua = navigator.userAgent || navigator.vendor || window.opera || '';
            const hasMobi = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
            const isIOSiPad = /iPad/.test(ua) || 
                (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);
            return hasMobi || isIOSiPad;
        } catch (error) {
            return false;
        }
    }

    // Initialize mobile input handler
    init(inputElementId, containerElementId) {
        if (!this.isMobile) {
            return; // Not a mobile device, skip initialization
        }

        const inputEl = document.getElementById(inputElementId);
        if (!inputEl) {
            console.warn('Mobile input element not found:', inputElementId);
            return;
        }

        this.inputElement = inputEl;
        this.enabled = true;

        // Set input attributes for mobile
        inputEl.type = 'text';
        inputEl.inputMode = 'text';
        inputEl.autocomplete = 'off';
        inputEl.autocorrect = 'off';
        inputEl.autocapitalize = 'characters';
        inputEl.spellcheck = false;
        inputEl.setAttribute('aria-hidden', 'true');

        // Handle text input
        inputEl.addEventListener('input', (e) => this.handleInput(e));

        // Handle Enter and Backspace
        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.onEnter();
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                this.onBackspace();
            }
        });

        // Focus management
        this.setupFocusHandling(containerElementId);

        console.log('✅ Mobile input handler initialized');
    }

    // Handle text input from mobile keyboard
    handleInput(e) {
        if (!this.enabled) return;

        const value = (e.target.value || '').toUpperCase();
        
        // Process each character
        for (let i = 0; i < value.length; i++) {
            const char = value[i];
            if (char >= 'A' && char <= 'Z') {
                this.onLetter(char);
            }
        }

        // Reset input so next keystroke triggers input event
        e.target.value = '';
    }

    // Setup focus handling for mobile
    setupFocusHandling(containerElementId) {
        const container = containerElementId 
            ? document.getElementById(containerElementId)
            : document.body;

        if (!container) return;

        // Focus input when container is clicked/tapped
        const focusInput = () => {
            if (this.inputElement && document.activeElement !== this.inputElement) {
                try {
                    this.inputElement.focus({ preventScroll: true });
                    this.onFocus();
                } catch (error) {
                    this.inputElement.focus();
                }
            }
        };

        container.addEventListener('pointerdown', focusInput);
        container.addEventListener('touchstart', focusInput, { passive: true });
        container.addEventListener('click', focusInput);
    }

    // Focus the input
    focus() {
        if (this.inputElement && this.enabled) {
            try {
                this.inputElement.focus({ preventScroll: true });
            } catch (error) {
                this.inputElement.focus();
            }
        }
    }

    // Blur the input
    blur() {
        if (this.inputElement) {
            this.inputElement.blur();
        }
    }

    // Check if mobile input is enabled
    isEnabled() {
        return this.enabled && this.isMobile;
    }
}

