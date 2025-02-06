class CustomForm extends HTMLElement {
    constructor() {
        super().attachShadow({ mode: "open" });

        this.errorDiv = document.createElement("div");
        this.errorDiv.classList.add("error");
        this.appendChild(this.errorDiv);

        this.state = {
            loading: false,
            formData: {},
        };

        this.shadowRoot.innerHTML = `
            <style>
                .loading {
                    pointer-events: none;
                    opacity: 0.6;
                }
                .error {
                    color: red;
                    text-align: center;
                    position: absolute;
                    bottom: -2.5rem;
                    width: 100%;
                }
                .success {
                    color: green;
                    text-align: center;
                    position: absolute;
                    bottom: -4.5rem;
                    width: 100%;
                }
                .spinner-border {
                    width: 1rem;
                    height: 1rem;
                    border-width: 0.2em;
                }
                form {
                    position: relative;
                }
            </style>
            <form class="needs-validation" novalidate>
                <slot></slot>
                <div id="form-error" class="error"></div>
                <div id="form-success" class="success"></div>
            </form>
            `;
    }

    connectedCallback() {
        this.form = this.shadowRoot.querySelector("form");

        if (this.form) {
            this.form.addEventListener("submit", this.handleSubmit.bind(this));
            this.form.addEventListener(
                "input",
                this.handleInputChange.bind(this)
            );
            this.querySelectorAll("input, select, textarea").forEach(
                (input) => {
                    this.state.formData[input.id.toLowerCase()] = input.value;
                }
            );
            this.querySelector("button[type='submit']").addEventListener(
                "click",
                (event) => {
                    event.preventDefault();
                    this.form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
                }
            );
        }
    }

    disconnectedCallback() {
        if (this.form) {
            this.form.removeEventListener("submit", this.handleSubmit);
            this.form.removeEventListener("input", this.handleInputChange);
        }
    }

    handleInputChange(event) {
        const { id, value } = event.target;
        this.state.formData[id.toLowerCase()] = value;
    }

    async handleSubmit(event) {
        event.preventDefault();
        if (this.form.checkValidity() === false) {
            event.stopPropagation();
        } else {
            this.loading = true;
            try {
                const response = await this.submitForm(this.formData);
                // handle successful form submission
                console.log("Form submitted successfully", response);
            } catch (error) {
                // handle error in form submission
                console.error("Form submission error", error);
                // this.errorDiv.textContent = "Error submitting form: " + error.message;
            } finally {
                this.loading = false;
            }
        }
        this.form.classList.add("was-validated");
    }

    showFormError(message) {
        const errorDiv = this.shadowRoot.querySelector("#form-error");
        const successDiv = this.shadowRoot.querySelector("#form-success");
        successDiv.textContent = ""; // Clear success message
        errorDiv.textContent = message;
    }
    
    showFormSuccess(message) {
        const errorDiv = this.shadowRoot.querySelector("#form-error");
        const successDiv = this.shadowRoot.querySelector("#form-success");
        errorDiv.textContent = ""; // Clear error message
        successDiv.textContent = message;
    }

    get formData() {
        return this.state.formData;
    }

    get loading() {
        return this.state.loading;
    }

    /**
     * @param {boolean} isLoading
     * @type {boolean}
     */
    set loading(isLoading) {
        this.state.loading = isLoading;
        const inputs = this.querySelectorAll("input, select, textarea");
        const buttons = this.querySelectorAll('button[type="submit"]');

        inputs.forEach((input) => (input.disabled = isLoading));

        buttons.forEach((button) => {
            if (isLoading) {
                button.disabled = true;
                button.setAttribute("data-original-text", button.textContent);
                button.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...`;
            } else {
                button.disabled = false;
                button.innerHTML = button.getAttribute("data-original-text");
            }
        });
    }

    async submitForm(formData) {
        // Simulate a form submission request
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve({ success: true });
            }, 2000);
        });
    }
}

if (!customElements.get("custom-form"))
    customElements.define("custom-form", CustomForm);
