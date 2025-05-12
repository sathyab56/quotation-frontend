// Toggle between login and signup forms
function toggleForms() {
    document.getElementById("login-form").classList.toggle("hidden");
    document.getElementById("signup-form").classList.toggle("hidden");
  }
  
  // SIGNUP logic
document.getElementById("signup-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;

    const payload = { email, password };

    try {
        let result = await axios.post("https://quotation-backend-2vww.onrender.com/signup", payload);
        console.log("Signed up successfully created", result.status);
        alert("Signed up successfully");
    } catch (error) {
        console.log(error.response.data.message);
        alert(error.response?.data?.message || "Signup failed.");
    }
});

// LOGIN logic
document.getElementById("login-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    console.log("Inside login logic");

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
        const response = await axios.post("https://quotation-backend-2vww.onrender.com/signin", {
            email,
            password
        });

        if (response.status === 200) {
            alert("Logged in successfully");
            window.location.href = "home.html";
            localStorage.setItem("email", email);
            localStorage.setItem("product", response.data.details.processingData || "");
        } else {
            alert(response.data.message || "Login failed.");
        }
    } catch (error) {
        console.error("Login error:", error);
        alert(error.response?.data?.message || "Server error. Please try again.");
    }
});
