// Firebase imports (CDN/ESM version)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCjrNHH1oDk6aDNMJN2Hym82xaRPIrrdFI",
  authDomain: "vendora-c8823.firebaseapp.com",
  projectId: "vendora-c8823",
  storageBucket: "vendora-c8823.firebasestorage.app",
  messagingSenderId: "592490796517",
  appId: "1:592490796517:web:f69ae8eaf2add7c3b60b0c",
  measurementId: "G-QQLQL6QCSV",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Application data with sample products
const appData = {
  products: [
    {
      id: "potatoes",
      name: "Fresh Potatoes (1kg)",
      price: 17, // original ~₹20
      category: "vegetables",
      image: "🥔",
    },
    {
      id: "onions",
      name: "Red Onions (1kg)",
      price: 21, // original ~₹25
      category: "vegetables",
      image: "🧅",
    },
    {
      id: "tomatoes",
      name: "Fresh Tomatoes (1kg)",
      price: 26, // original ~₹30
      category: "vegetables",
      image: "🍅",
    },
    {
      id: "wheat_flour",
      name: "Wheat Flour (1kg)",
      price: 43, // original ~₹50
      category: "grains",
      image: "🌾",
    },
    {
      id: "refined_oil",
      name: "Refined Sunflower Oil (1L)",
      price: 153, // original ~₹180
      category: "essentials",
      image: "🛢️",
    },
    {
      id: "basmati_rice",
      name: "Basmati Rice (1kg)",
      price: 85, // original ~₹100
      category: "grains",
      image: "🍚",
    },
    {
      id: "paneer",
      name: "Fresh Paneer (1kg)",
      price: 255, // original ~₹300
      category: "dairy",
      image: "🧀",
    },
    {
      id: "curd",
      name: "Fresh Curd (1kg)",
      price: 85, // original ~₹100
      category: "dairy",
      image: "🥛",
    },
    {
      id: "spices",
      name: "Mixed Indian Spices (1kg)",
      price: 425, // original ~₹500
      category: "spices",
      image: "🌶️",
    },
    {
      id: "tea",
      name: "Tea Leaves (1kg)",
      price: 340, // original ~₹400
      category: "beverages",
      image: "🍵",
    },
    {
      id: "sugar",
      name: "Refined Sugar (1kg)",
      price: 85, // original ~₹100
      category: "essentials",
      image: "🍬",
    },
    {
      id: "chickpeas",
      name: "Chickpeas (1kg)",
      price: 85, // original ~₹100
      category: "legumes",
      image: "🫘",
    },
  ],
};

// Global application state
let currentUser = null;
let userFormData = {};
const cart = [];
let appState = "auth"; // Track current app state: auth, welcome, form1, form2, shopping

// Utility functions
function showAlert(message, type = "error") {
  const existingAlert = document.querySelector(".alert");
  if (existingAlert) {
    existingAlert.remove();
  }

  const alert = document.createElement("div");
  alert.className = `alert alert--${type}`;
  alert.textContent = message;

  const authForm = document.querySelector(".auth-form.active");
  if (authForm) {
    authForm.insertBefore(alert, authForm.firstChild);
    setTimeout(() => {
      if (alert.parentNode) {
        alert.remove();
      }
    }, 5000);
  }
}

function setButtonLoading(button, loading) {
  const spinner = button.querySelector(".btn-spinner");
  const text = button.querySelector(".btn-text");

  if (loading) {
    button.disabled = true;
    if (spinner) spinner.classList.remove("hidden");
    if (text) text.style.opacity = "0.7";
  } else {
    button.disabled = false;
    if (spinner) spinner.classList.add("hidden");
    if (text) text.style.opacity = "1";
  }
}

// Screen management
function showScreen(screenId) {
  console.log("Switching to screen:", screenId);

  // Hide all screens
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.add("hidden");
    const content = screen.querySelector(
      ".card, .message-container, .loading-content, .success-content, .error-content"
    );
    if (content) {
      content.classList.remove("fade-in", "fade-out");
    }
  });

  // Show target screen
  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    targetScreen.classList.remove("hidden");
    appState = screenId.replace("Screen", "");

    if (screenId === "shoppingPage") {
      setTimeout(() => {
        targetScreen.classList.add("fade-in");
      }, 50);
    }
  } else {
    console.error("Screen not found:", screenId);
  }
}

// Authentication functions
// async function handleSignup(e) {
//   e.preventDefault();

//   const fullName = document.getElementById("signupName").value.trim();
//   const email = document.getElementById("signupEmail").value.trim();
//   const password = document.getElementById("signupPassword").value.trim();
//   const confirmPassword = document
//     .getElementById("signupConfirmPassword")
//     .value.trim();
//   const signupBtn = document.getElementById("signupBtn");

//   if (!fullName || !email || !password || !confirmPassword) {
//     showAlert("Please fill in all fields.");
//     return;
//   }
//   if (password !== confirmPassword) {
//     showAlert("Passwords do not match.");
//     return;
//   }
//   if (password.length < 6) {
//     showAlert("Password must be at least 6 characters.");
//     return;
//   }

//   setButtonLoading(signupBtn, true);

//   try {
//     const userCredential = await createUserWithEmailAndPassword(
//       auth,
//       email,
//       password
//     );
//     await updateProfile(userCredential.user, { displayName: fullName });

//     showAlert(`Account created successfully for ${fullName}!`, "success");
//     document.getElementById("signupForm").reset();

//     // Switch to login tab after successful signup
//     setTimeout(() => {
//       switchTab("login");
//     }, 1500);
//   } catch (error) {
//     console.error("Signup Error:", error);
//     let errorMessage = "An error occurred during signup.";

//     switch (error.code) {
//       case "auth/email-already-in-use":
//         errorMessage = "An account with this email already exists.";
//         break;
//       case "auth/invalid-email":
//         errorMessage = "Please enter a valid email address.";
//         break;
//       case "auth/weak-password":
//         errorMessage = "Password should be at least 6 characters.";
//         break;
//       default:
//         errorMessage = error.message;
//     }

//     showAlert(errorMessage);
//   } finally {
//     setButtonLoading(signupBtn, false);
//   }
// }

async function handleSignup(e) {
  e.preventDefault();
  console.log("Signup handler started"); // First check

  const fullName = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();
  const confirmPassword = document
    .getElementById("signupConfirmPassword")
    .value.trim();
  const signupBtn = document.getElementById("signupBtn");

  console.log("Collected form data:", {
    fullName,
    email,
    password,
    confirmPassword,
  });

  // Validation (unchanged)
  if (!fullName || !email || !password || !confirmPassword) {
    showAlert("Please fill in all fields.");
    return;
  }
  if (password !== confirmPassword) {
    showAlert("Passwords do not match.");
    return;
  }
  if (password.length < 6) {
    showAlert("Password must be at least 6 characters.");
    return;
  }

  console.log("Validation passed, creating user...");
  setButtonLoading(signupBtn, true);

  try {
    localStorage.setItem("newSignup", "true");
    console.log("Signup flag stored in localStorage");
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    await updateProfile(userCredential.user, { displayName: fullName });
    console.log("User created successfully");

    showAlert(`Account created successfully for ${fullName}!`, "success");
    document.getElementById("signupForm").reset();
  } catch (error) {
    console.error("Signup Error:", error);
    showAlert(error.message);
  } finally {
    setButtonLoading(signupBtn, false);
  }
}

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const loginBtn = document.getElementById("loginBtn");

  if (!email || !password) {
    showAlert("Please fill in both fields.");
    return;
  }

  setButtonLoading(loginBtn, true);

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    document.getElementById("loginForm").reset();
    // The auth state change handler will handle the redirect
  } catch (error) {
    console.error("Login Error:", error);
    let errorMessage = "Login failed. Please try again.";

    switch (error.code) {
      case "auth/user-not-found":
        errorMessage = "No account found with this email.";
        break;
      case "auth/wrong-password":
        errorMessage = "Incorrect password.";
        break;
      case "auth/invalid-email":
        errorMessage = "Please enter a valid email address.";
        break;
      case "auth/too-many-requests":
        errorMessage = "Too many failed attempts. Please try again later.";
        break;
      default:
        errorMessage = error.message;
    }

    showAlert(errorMessage);
  } finally {
    setButtonLoading(loginBtn, false);
  }
}

async function handleLogout() {
  try {
    await signOut(auth);
    // Clear application state
    userFormData = {};
    cart.length = 0;
    updateCartBadge();
    appState = "auth";

    // Reset all forms
    document.querySelectorAll("form").forEach((form) => form.reset());

    showScreen("authScreen");
  } catch (error) {
    console.error("Logout Error:", error);
    showAlert("Error logging out. Please try again.");
  }
}

function switchTab(tabName) {
  document.querySelectorAll(".auth-tab").forEach((tab) => {
    tab.classList.remove("active");
  });
  document.querySelectorAll(".auth-form").forEach((form) => {
    form.classList.remove("active");
  });

  document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");
  document.getElementById(`${tabName}Form`).classList.add("active");
}

// Auth state management
// onAuthStateChanged(auth, (user) => {
//   if (user) {
//     currentUser = user;
//     console.log("Logged in as:", user.email, "| Name:", user.displayName);

//     // Redirect to dashboard.html after login
//     window.location.href = "dashboard.html"; // <-- Replace with your dashboard file name
//   } else {
//     currentUser = null;
//     console.log("No user logged in");
//     appState = "auth";
//     showScreen("authScreen");
//   }
// });

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    console.log("Logged in as:", user.email, "| Name:", user.displayName);

    const isNewSignup = localStorage.getItem("newSignup") === "true";
    console.log(isNewSignup);
    if (isNewSignup) {
      // Fresh signup → onboarding flow
      localStorage.removeItem("newSignup"); // Clear the flag
      showScreen("welcomeScreen");
      initWelcomeScreen();
    } else {
      // Normal login → go to dashboard
      window.location.href = "dashboard.html";
    }
  } else {
    currentUser = null;
    appState = "auth";
    showScreen("authScreen");
  }
});

// Welcome screen animation
function initWelcomeScreen() {
  appState = "welcome";
  setTimeout(() => {
    const welcomeScreen = document.getElementById("welcomeScreen");
    welcomeScreen.classList.add("welcome-fade-out");
    setTimeout(() => {
      showScreen("form1");
      const form1Card = document.querySelector("#form1 .card");
      if (form1Card) {
        setTimeout(() => {
          form1Card.classList.add("fade-in");
        }, 100);
      }
    }, 700);
  }, 2000);
}

// Form validation helper
function validateFormFields(fieldIds) {
  return fieldIds.every((fieldId) => {
    const field = document.getElementById(fieldId);
    if (!field) {
      console.error("Field not found:", fieldId);
      return false;
    }
    const value = field.value.trim();

    // Special validation for required fields
    if (field.hasAttribute("required") && value === "") {
      console.log("Required field is empty:", fieldId);
      return false;
    }

    return true;
  });
}

// Form handling
function initForms() {
  // Form 1 - Personal Information
  const form1NextBtn = document.getElementById("form1Next");
  if (form1NextBtn) {
    form1NextBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Form 1 Next button clicked");

      // Validate required form 1 fields
      const requiredFields = ["firstName", "lastName", "phone", "address"];
      const isValid = validateFormFields(requiredFields);

      if (!isValid) {
        showToast("Please fill in all required fields");
        return;
      }

      // Save form 1 data
      userFormData.form1 = {
        firstName: document.getElementById("firstName").value.trim(),
        lastName: document.getElementById("lastName").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        address: document.getElementById("address").value.trim(),
        preferences: document.getElementById("preferences").value.trim(),
      };

      console.log("Form 1 data saved:", userFormData.form1);

      // Animate transition to form 2
      const form1Card = document.querySelector("#form1 .card");
      if (form1Card) {
        form1Card.classList.add("fade-out");
        form1Card.classList.remove("fade-in");
      }

      setTimeout(() => {
        showScreen("form2");
        const form2Card = document.querySelector("#form2 .card");
        if (form2Card) {
          setTimeout(() => {
            form2Card.classList.add("fade-in");
          }, 100);
        }
      }, 600);
    });
  }

  // Form 2 - Delivery Details
  const form2NextBtn = document.getElementById("form2Next");
  if (form2NextBtn) {
    form2NextBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Form 2 Next button clicked");

      // Validate required form 2 fields
      const requiredFields = [
        "deliveryTime",
        "frequency",
        "emergencyContact",
        "budget",
      ];
      const isValid = validateFormFields(requiredFields);

      if (!isValid) {
        showToast("Please fill in all required fields");
        return;
      }

      // Save form 2 data
      userFormData.form2 = {
        deliveryTime: document.getElementById("deliveryTime").value,
        frequency: document.getElementById("frequency").value,
        specialInstructions: document
          .getElementById("specialInstructions")
          .value.trim(),
        emergencyContact: document
          .getElementById("emergencyContact")
          .value.trim(),
        budget: document.getElementById("budget").value,
      };

      console.log("Form 2 data saved:", userFormData.form2);

      // Animate transition to select message
      const form2Card = document.querySelector("#form2 .card");
      if (form2Card) {
        form2Card.classList.add("fade-out");
        form2Card.classList.remove("fade-in");
      }

      setTimeout(() => {
        showScreen("selectMessage");
        const messageContainer = document.querySelector(".message-container");
        if (messageContainer) {
          setTimeout(() => {
            messageContainer.classList.add("fade-in");

            setTimeout(() => {
              messageContainer.classList.add("fade-out");
              messageContainer.classList.remove("fade-in");

              setTimeout(() => {
                showScreen("shoppingPage");
              }, 600);
            }, 1500);
          }, 100);
        }
      }, 600);
    });
  }
}

// Product rendering and management
function renderProducts(productsToRender = appData.products) {
  const productGrid = document.getElementById("productGrid");
  if (!productGrid) return;

  productGrid.innerHTML = "";

  productsToRender.forEach((product) => {
    const productCard = document.createElement("div");
    productCard.className = "product-card";
    productCard.innerHTML = `
      <div class="product-image">${product.image}</div>
      <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-price">₹${product.price.toFixed(2)}</p>
        <div class="product-controls">
          <div class="quantity-container">
            <button type="button" class="quantity-btn" data-product-id="${
              product.id
            }" data-action="decrease">−</button>
            <input type="number" 
                   class="quantity-input" 
                   id="qty-${product.id}" 
                   value="1" 
                   min="1" 
                   max="99"
                   data-product-id="${product.id}">
            <button type="button" class="quantity-btn" data-product-id="${
              product.id
            }" data-action="increase">+</button>
          </div>
          <button type="button" class="add-btn" data-product-id="${product.id}">
            <span>Add</span>
            <span>🛒</span>
          </button>
        </div>
      </div>
    `;
    productGrid.appendChild(productCard);
  });

  initProductControls();
}

function initProductControls() {
  // Quantity buttons
  document.querySelectorAll(".quantity-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const productId = btn.dataset.productId;
      const action = btn.dataset.action;
      const change = action === "increase" ? 1 : -1;
      changeQuantity(productId, change);
    });
  });

  // Quantity inputs
  document.querySelectorAll(".quantity-input").forEach((input) => {
    input.addEventListener("change", (e) => {
      e.preventDefault();
      const productId = input.dataset.productId;
      updateQuantity(productId, e.target.value);
    });
  });

  // Add buttons
  document.querySelectorAll(".add-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const productId = btn.dataset.productId;
      addToCart(productId);
    });
  });
}

function initSearch() {
  const searchInput = document.getElementById("searchInput");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const filteredProducts = appData.products.filter((product) =>
        product.name.toLowerCase().includes(searchTerm)
      );
      renderProducts(filteredProducts);
    });
  }
}

function changeQuantity(productId, change) {
  const qtyInput = document.getElementById(`qty-${productId}`);
  if (!qtyInput) return;

  let currentQty = parseInt(qtyInput.value) || 1;
  let newQty = currentQty + change;

  if (newQty < 1) newQty = 1;
  if (newQty > 99) newQty = 99;

  qtyInput.value = newQty;
}

function updateQuantity(productId, value) {
  const qtyInput = document.getElementById(`qty-${productId}`);
  if (!qtyInput) return;

  let newQty = parseInt(value);

  if (isNaN(newQty) || newQty < 1) newQty = 1;
  if (newQty > 99) newQty = 99;

  qtyInput.value = newQty;
}

// Cart management
function addToCart(productId) {
  const product = appData.products.find((p) => p.id === productId);
  const qtyInput = document.getElementById(`qty-${productId}`);

  if (!product || !qtyInput) return;

  const quantity = parseInt(qtyInput.value) || 1;

  const existingItem = cart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.qty += quantity;
  } else {
    cart.push({
      id: productId,
      name: product.name,
      price: product.price,
      qty: quantity,
    });
  }

  updateCartBadge();
  showToast(`Added ${quantity} × ${product.name} to cart`);

  qtyInput.value = 1;
}

function updateCartBadge() {
  const cartBadge = document.getElementById("cartBadge");
  const itemCount = cart.length;

  if (cartBadge) {
    if (itemCount > 0) {
      cartBadge.textContent = itemCount;
      cartBadge.classList.remove("hidden");
    } else {
      cartBadge.classList.add("hidden");
    }
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");

  if (toast && toastMessage) {
    toastMessage.textContent = message;
    toast.classList.remove("hidden");

    setTimeout(() => {
      toast.classList.add("show");
    }, 50);

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        toast.classList.add("hidden");
      }, 250);
    }, 3000);
  }
}

// Firebase order saving
async function saveOrderToFirestore(cartItems) {
  try {
    if (!currentUser) throw new Error("User not authenticated");

    const totalAmount = cartItems.reduce(
      (total, item) => total + item.price * item.qty,
      0
    );

    const orderData = {
      userId: currentUser.uid,
      userEmail: currentUser.email,
      userName: currentUser.displayName || currentUser.email,
      userFormData: userFormData,
      items: cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.qty,
        price: item.price,
      })),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      timestamp: serverTimestamp(),
      orderStatus: "pending",
    };

    await addDoc(collection(db, "orders"), orderData);
    console.log("Order saved:", orderData);

    return { success: true }; // match what your checkout flow expects
  } catch (error) {
    console.error("Error saving order:", error);
    return { success: false, error }; // also match structure
  }
}

// Checkout functionality
function initCheckout() {
  const checkoutButton = document.getElementById("checkoutButton");

  if (checkoutButton) {
    checkoutButton.addEventListener("click", async (e) => {
      e.preventDefault();

      if (cart.length === 0) {
        showToast("Your cart is empty!");
        return;
      }

      showScreen("loadingScreen");
      const loadingContent = document.querySelector(".loading-content");
      if (loadingContent) {
        setTimeout(() => {
          loadingContent.classList.add("fade-in");
        }, 100);
      }

      try {
        const result = await saveOrderToFirestore([...cart]);

        if (result.success) {
          setTimeout(() => {
            showScreen("successScreen");
            const successContent = document.querySelector(".success-content");
            if (successContent) {
              setTimeout(() => {
                successContent.classList.add("fade-in");
              }, 100);
            }

            cart.length = 0;
            updateCartBadge();
          }, 1500);
        } else {
          setTimeout(() => {
            showScreen("errorScreen");
            const errorContent = document.querySelector(".error-content");
            if (errorContent) {
              setTimeout(() => {
                errorContent.classList.add("fade-in");
              }, 100);
            }
          }, 1500);
        }
      } catch (error) {
        console.error("Checkout error:", error);
        setTimeout(() => {
          showScreen("errorScreen");
          const errorContent = document.querySelector(".error-content");
          if (errorContent) {
            setTimeout(() => {
              errorContent.classList.add("fade-in");
            }, 100);
          }
        }, 1500);
      }
    });
  }
}

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing app...");

  // Auth tab switching
  document.querySelectorAll(".auth-tab").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      switchTab(e.target.dataset.tab);
    });
  });

  // Auth form handlers
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  if (signupForm) {
    signupForm.addEventListener("submit", handleSignup);
  }

  // Logout button handlers
  document.querySelectorAll('[id^="logoutBtn"]').forEach((btn) => {
    btn.addEventListener("click", handleLogout);
  });

  // Continue shopping button
  const continueShoppingBtn = document.getElementById("continueShoppingBtn");
  if (continueShoppingBtn) {
    continueShoppingBtn.addEventListener("click", () => {
      window.location.href = "dashboard.html"; // Redirect to homepage
    });
  }

  // Retry button
  const retryButton = document.getElementById("retryButton");
  if (retryButton) {
    retryButton.addEventListener("click", () => {
      showScreen("shoppingPage");
    });
  }

  // Initialize components
  initForms();
  renderProducts();
  initSearch();
  initCheckout();

  console.log("🔥 Firebase initialized successfully!");
  console.log("📱 Vendora app ready to use");
});

document.getElementById("signupForm").addEventListener("submit", handleSignup);
document.getElementById("loginForm").addEventListener("submit", handleLogin);

// Attach logout button listeners
document
  .querySelectorAll(
    "#logoutBtn, #logoutBtn1, #logoutBtn2, #logoutBtn3, #logoutBtn4, #logoutBtn5"
  )
  .forEach((btn) => btn.addEventListener("click", handleLogout));

// Initialize other features after DOM loads
document.addEventListener("DOMContentLoaded", () => {
  initForms();
  renderProducts();
  initSearch();
});
