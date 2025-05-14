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
  
      const payload = {
          "email": email,
          "password": password
      }
      try {
        let result = await axios.post("http://localhost:8000/signup", payload)
          console.log("Signed up successfully created", result.status)
          alert("Signedup successfully")
          document.getElementById("signup-form").classList.add("hidden");
          document.getElementById("login-form").classList.remove("hidden");
      } catch (error) {
          console.log(error.response.data.message)
      }
  });
  
  // LOGIN logic
  document.getElementById("login-form").addEventListener("submit", async function (e) {
    e.preventDefault();
  console.log("Inside login logic")
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
  
    try {
      const response = await axios.post("http://localhost:8000/signin", {
        email,
        password
      });
        
        console.log(response.status === 200)
        if (response.status === 200) {
            alert("Logged in successfully");
            window.location.href = "home.html"; 
            localStorage.setItem("email", email);
            localStorage.setItem("product", response.data.details.processingData|| "");
            
      } else {
        alert(response.data.message || "Login failed.");
      }
  
    } catch (error) {
        console.error("Login error:", error);
        console.log(error)
      alert(error.response?.data?.message || "Server error. Please try again.");
    }
  });