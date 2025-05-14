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
    const result = await axios.post("https://quotation-backend-2vww.onrender.com/signup", payload);
    console.log("Signed up successfully", result.status);
    alert("Signed up successfully");
    window.location.href = "index.html";
  } catch (error) {
    console.error("Signup error:", error);
    const message = error.response?.data?.message || "Signup failed. Please try again.";
    alert(message);
  }
});

// LOGIN logic
document.getElementById("login-form").addEventListener("submit", async function (e) {
  e.preventDefault();
  console.log("Inside login logic");

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const response = await axios.post("https://quotation-backend-2vww.onrender.com/signin", { email, password });


    if (response.status === 200) {
      alert("Logged in successfully");
      localStorage.setItem("email", email);
      localStorage.setItem("product", response.data.details?.processingData || "");
      window.location.href = "home.html";
    } else {
      alert(response.data.message || "Login failed.");
    }

  } catch (error) {
    console.error("Login error:", error);
    const message = error.response?.data?.message || "Server error. Please check connection.";
    alert(message);
  }
});
