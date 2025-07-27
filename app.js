// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase configuration
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

// Products data
const products = [
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
];

// Global state
let currentUser = null;
let currentCart = [];
let currentSection = "home";
let isEditingProfile = false;

// DOM Elements
const loadingOverlay = document.getElementById("loadingOverlay");
const toastContainer = document.getElementById("toastContainer");
const navButtons = document.querySelectorAll(".nav-btn");
const contentSections = document.querySelectorAll(".content-section");

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  initializeAuth();
  setupEventListeners();
  renderProducts();
});

// Authentication
function initializeAuth() {
  showLoading();

  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      updateUserInfo(user);
      loadUserData();
      hideLoading();
    } else {
      // Redirect to login if no user
      window.location.href = "login.html";
    }
  });
}

function updateUserInfo(user) {
  const userName = document.getElementById("userName");
  const userEmail = document.getElementById("userEmail");

  userName.textContent = user.displayName || "User";
  userEmail.textContent = user.email;
}

// Event Listeners
function setupEventListeners() {
  // Navigation
  navButtons.forEach((btn) => {
    btn.addEventListener("click", handleNavigation);
  });

  // Search
  const searchInput = document.getElementById("productSearch");
  if (searchInput) {
    searchInput.addEventListener("input", handleProductSearch);
  }

  // View more button
  const viewMoreBtn = document.getElementById("viewMoreBtn");
  if (viewMoreBtn) {
    viewMoreBtn.addEventListener("click", () => showSection("recurring"));
  }

  // Profile editing
  const editProfileBtn = document.getElementById("editProfileBtn");
  const saveProfileBtn = document.getElementById("saveProfileBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");

  if (editProfileBtn)
    editProfileBtn.addEventListener("click", enableProfileEdit);
  if (saveProfileBtn) saveProfileBtn.addEventListener("click", saveProfile);
  if (cancelEditBtn) cancelEditBtn.addEventListener("click", cancelProfileEdit);

  // Cart confirmation
  const confirmCartBtn = document.getElementById("confirmCartBtn");
  if (confirmCartBtn) {
    confirmCartBtn.addEventListener("click", confirmOrder);
  }
}

// Navigation
function handleNavigation(e) {
  const section = e.target.dataset.section;

  if (section === "logout") {
    handleLogout();
    return;
  }

  showSection(section);
}

function showSection(sectionName) {
  // Update active nav button
  navButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.section === sectionName);
  });

  // Hide current section with fade out
  const currentSectionEl = document.querySelector(".content-section.active");
  if (currentSectionEl) {
    currentSectionEl.style.opacity = "0";
    currentSectionEl.style.transform = "translateY(20px)";

    setTimeout(() => {
      currentSectionEl.classList.remove("active");

      // Show new section with fade in
      const newSectionEl = document.getElementById(sectionName);
      if (newSectionEl) {
        newSectionEl.classList.add("active");
        setTimeout(() => {
          newSectionEl.style.opacity = "1";
          newSectionEl.style.transform = "translateY(0)";
        }, 50);
      }
    }, 150);
  }

  currentSection = sectionName;

  // Load section-specific data
  if (sectionName === "profile") {
    loadProfileData();
  } else if (sectionName === "history") {
    loadOrderHistory();
  }
}

// User Data Management
async function loadUserData() {
  if (!currentUser) return;

  try {
    await loadRecurringItems();
  } catch (error) {
    console.error("Error loading user data:", error);
    showToast("Error loading user data", "error");
  }
}

// async function loadRecurringItems() {
//   const recurringItemsEl = document.getElementById('recurringItems');

//   try {
//     // Get user's latest order
//     const ordersRef = collection(db, 'orders');
//     const q = query(
//       ordersRef,
//       where('userId', '==', currentUser.uid),
//       orderBy('timestamp', 'desc'),
//       limit(1)
//     );

//     const querySnapshot = await getDocs(q);

//     if (!querySnapshot.empty) {
//       const latestOrder = querySnapshot.docs[0].data();
//       renderRecurringItems(latestOrder.items || []);
//     } else {
//       recurringItemsEl.innerHTML = '<div class="loading-state">No recurring items found. Place your first order to see items here.</div>';
//     }
//   } catch (error) {
//     console.error('Error loading recurring items:', error);
//     recurringItemsEl.innerHTML = '<div class="loading-state">Error loading recurring items</div>';
//   }
// }

// function renderRecurringItems(items) {
//   const recurringItemsEl = document.getElementById('recurringItems');

//   if (items.length === 0) {
//     recurringItemsEl.innerHTML = '<div class="loading-state">No recurring items found</div>';
//     return;
//   }

//   recurringItemsEl.innerHTML = items.map(item => `
//     <div class="recurring-item">
//       <div class="item-image">${getProductById(item.id)?.image || '📦'}</div>
//       <div class="item-name">${item.name}</div>
//       <div class="item-details">Qty: ${item.quantity} • $${item.price.toFixed(2)}</div>
//     </div>
//   `).join('');
// }

async function loadRecurringItems() {
  const recurringItemsEl = document.getElementById("recurringItems");

  try {
    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("userId", "==", currentUser.uid),
      orderBy("timestamp", "desc"),
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const latestOrder = querySnapshot.docs[0].data();
      const items = Array.isArray(latestOrder.items) ? latestOrder.items : [];
      renderRecurringItems(items);
    } else {
      recurringItemsEl.innerHTML =
        '<div class="loading-state">No recurring items found. Place your first order to see items here.</div>';
    }
  } catch (error) {
    console.error("Error loading recurring items:", error);
    recurringItemsEl.innerHTML =
      '<div class="loading-state">Error loading recurring items</div>';
  }
}

function renderRecurringItems(items) {
  const recurringItemsEl = document.getElementById("recurringItems");

  if (!Array.isArray(items) || items.length === 0) {
    recurringItemsEl.innerHTML =
      '<div class="loading-state">No recurring items found</div>';
    return;
  }

  recurringItemsEl.innerHTML = items
    .map((item) => {
      const product = getProductById(item.id) || {};
      return `
        <div class="recurring-item">
          <div class="item-image">${product.image || "📦"}</div>
          <div class="item-name">${item.name || "Unnamed Item"}</div>
          <div class="item-details">
            Qty: ${item.quantity || 0} • ₹${(item.price || 0).toFixed(2)}
          </div>
        </div>
      `;
    })
    .join("");
}

// Products Management
function renderProducts(filteredProducts = products) {
  const productGrid = document.getElementById("productGrid");

  productGrid.innerHTML = filteredProducts
    .map(
      (product) => `
    <div class="product-card" data-product-id="${product.id}">
      <div class="product-image">${product.image}</div>
      <div class="product-name">${product.name}</div>
      <div class="product-price">₹${product.price.toFixed(2)}</div>
      <div class="quantity-selector">
        <button class="quantity-btn" onclick="updateQuantity('${
          product.id
        }', -1)">-</button>
        <input type="number" class="quantity-input" id="qty-${
          product.id
        }" value="1" min="1" max="10">
        <button class="quantity-btn" onclick="updateQuantity('${
          product.id
        }', 1)">+</button>
      </div>
      <button class="btn btn--primary btn--sm" onclick="addToCart('${
        product.id
      }')">Add to Cart</button>
    </div>
  `
    )
    .join("");
}

function handleProductSearch(e) {
  const searchTerm = e.target.value.toLowerCase();
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm)
  );
  renderProducts(filteredProducts);
}

function getProductById(id) {
  return products.find((product) => product.id === id);
}

// Cart Management
window.updateQuantity = function (productId, change) {
  const qtyInput = document.getElementById(`qty-${productId}`);
  const currentQty = parseInt(qtyInput.value);
  const newQty = Math.max(1, Math.min(10, currentQty + change));
  qtyInput.value = newQty;
};

window.addToCart = function (productId) {
  const product = getProductById(productId);
  const qtyInput = document.getElementById(`qty-${productId}`);
  const quantity = parseInt(qtyInput.value);

  if (!product) return;

  // Check if item already in cart
  const existingItem = currentCart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    currentCart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
    });
  }

  updateCartDisplay();
  showToast(`Added ${product.name} to cart`, "success");
};

function updateCartDisplay() {
  const cartSummary = document.getElementById("cartSummary");
  const cartItems = document.querySelector(".cart-items");
  const cartTotal = document.getElementById("cartTotal");

  if (currentCart.length === 0) {
    cartSummary.classList.add("hidden");
    return;
  }

  cartSummary.classList.remove("hidden");

  cartItems.innerHTML = currentCart
    .map(
      (item) => `
    <div class="cart-item">
      <span>${item.name} x ${item.quantity}</span>
      <span>₹${(item.price * item.quantity).toFixed(2)}</span>
    </div>
  `
    )
    .join("");

  const total = currentCart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  cartTotal.textContent = total.toFixed(2);
}

async function confirmOrder() {
  if (currentCart.length === 0) return;

  showLoading();

  try {
    // Check if there's an existing order for this user
    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("userId", "==", currentUser.uid),
      orderBy("timestamp", "desc"),
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Found the latest order → merge the new cart items
      const existingOrderDoc = querySnapshot.docs[0];
      const existingOrderRef = doc(db, "orders", existingOrderDoc.id);
      const existingData = existingOrderDoc.data();

      const updatedItems = [...(existingData.items || []), ...currentCart];
      const updatedTotal =
        (existingData.totalAmount || 0) +
        currentCart.reduce((sum, item) => sum + item.price * item.quantity, 0);

      await updateDoc(existingOrderRef, {
        items: updatedItems,
        totalAmount: updatedTotal,
        timestamp: serverTimestamp(), // refresh timestamp so it sorts correctly
      });
    } else {
      // No previous order → create a new one
      const newOrderData = {
        userId: currentUser.uid,
        items: currentCart,
        totalAmount: currentCart.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),
        timestamp: serverTimestamp(),
      };

      await addDoc(ordersRef, newOrderData);
    }

    // Clear cart
    currentCart = [];
    updateCartDisplay();

    // Reload recurring items on Home tab
    await loadRecurringItems();

    showToast("Order placed successfully!", "success");
  } catch (error) {
    console.error("Error placing order:", error);
    showToast("Error placing order", "error");
  }

  hideLoading();
}

// Profile Management
async function loadProfileData() {
  if (!currentUser) return;

  showLoading();

  try {
    // Load form1 data
    const form1Doc = await getDoc(
      doc(db, "userFormData", currentUser.uid, "forms", "form1")
    );
    if (form1Doc.exists()) {
      const form1Data = form1Doc.data();
      document.getElementById("firstName").value = form1Data.firstName || "";
      document.getElementById("lastName").value = form1Data.lastName || "";
      document.getElementById("phone").value = form1Data.phone || "";
      document.getElementById("address").value = form1Data.address || "";
      document.getElementById("preferences").value =
        form1Data.preferences || "";
    }

    // Load form2 data
    const form2Doc = await getDoc(
      doc(db, "userFormData", currentUser.uid, "forms", "form2")
    );
    if (form2Doc.exists()) {
      const form2Data = form2Doc.data();
      document.getElementById("deliveryTime").value =
        form2Data.deliveryTime || "morning";
      document.getElementById("frequency").value =
        form2Data.frequency || "weekly";
      document.getElementById("specialInstructions").value =
        form2Data.specialInstructions || "";
      document.getElementById("emergencyContact").value =
        form2Data.emergencyContact || "";
    }
  } catch (error) {
    console.error("Error loading profile data:", error);
    showToast("Error loading profile data", "error");
  }

  hideLoading();
}

function enableProfileEdit() {
  isEditingProfile = true;

  // Enable form fields
  const formControls = document.querySelectorAll(
    "#profileForm .form-control, #deliveryForm .form-control"
  );
  formControls.forEach((control) => {
    control.removeAttribute("readonly");
    control.removeAttribute("disabled");
  });

  // Show/hide buttons
  document.getElementById("editProfileBtn").style.display = "none";
  document.querySelector(".form-actions").classList.remove("hidden");
}

function cancelProfileEdit() {
  isEditingProfile = false;

  // Disable form fields
  const formControls = document.querySelectorAll(
    "#profileForm .form-control, #deliveryForm .form-control"
  );
  formControls.forEach((control) => {
    if (control.tagName === "SELECT") {
      control.setAttribute("disabled", "");
    } else {
      control.setAttribute("readonly", "");
    }
  });

  // Show/hide buttons
  document.getElementById("editProfileBtn").style.display = "inline-flex";
  document.querySelector(".form-actions").classList.add("hidden");

  // Reload data
  loadProfileData();
}

async function saveProfile() {
  if (!currentUser) return;

  showLoading();

  try {
    // Save form1 data
    const form1Data = {
      firstName: document.getElementById("firstName").value,
      lastName: document.getElementById("lastName").value,
      phone: document.getElementById("phone").value,
      address: document.getElementById("address").value,
      preferences: document.getElementById("preferences").value,
    };

    await setDoc(
      doc(db, "userFormData", currentUser.uid, "forms", "form1"),
      form1Data
    );

    // Save form2 data
    const form2Data = {
      deliveryTime: document.getElementById("deliveryTime").value,
      frequency: document.getElementById("frequency").value,
      specialInstructions: document.getElementById("specialInstructions").value,
      emergencyContact: document.getElementById("emergencyContact").value,
    };

    await setDoc(
      doc(db, "userFormData", currentUser.uid, "forms", "form2"),
      form2Data
    );

    cancelProfileEdit();
    showToast("Profile updated successfully!", "success");
  } catch (error) {
    console.error("Error saving profile:", error);
    showToast("Error saving profile", "error");
  }

  hideLoading();
}

// Load profile details when Profile tab is opened
const profileTab = document.querySelector('[data-section="profile"]');
if (profileTab) {
  profileTab.addEventListener("click", async () => {
    try {
      const ordersRef = collection(db, "orders");
      const q = query(
        ordersRef,
        where("userId", "==", currentUser.uid),
        orderBy("timestamp", "desc"),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        console.warn("No profile data found.");
        return;
      }
      const latestOrder = querySnapshot.docs[0].data();
      const form1 = latestOrder.userFormData?.form1 || {};
      const form2 = latestOrder.userFormData?.form2 || {};
      // Personal Info
      document.getElementById("profileFirstName").value = form1.firstName || "";
      document.getElementById("profileLastName").value = form1.lastName || "";
      document.getElementById("profilePhone").value = form1.phone || "";
      document.getElementById("profileAddress").value = form1.address || "";
      document.getElementById("profilePreferences").value =
        form1.preferences || "";
      // Delivery Settings
      document.getElementById("profileDeliveryTime").value = (
        form2.deliveryTime || ""
      ).toLowerCase();
      document.getElementById("profileFrequency").value = (
        form2.frequency || ""
      ).toLowerCase();
      document.getElementById("profileSpecialInstructions").value =
        form2.specialInstructions || "";
      document.getElementById("profileEmergencyContact").value =
        form2.emergencyContact || "";
    } catch (error) {
      console.error("Error loading profile data:", error);
    }
  });
}

// Order History
async function loadOrderHistory() {
  const orderHistoryEl = document.getElementById("orderHistory");

  if (!currentUser) return;

  showLoading();

  try {
    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("userId", "==", currentUser.uid),
      orderBy("timestamp", "desc"),
      limit(5)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      orderHistoryEl.innerHTML =
        '<div class="loading-state">No orders found</div>';
      return;
    }

    const orders = [];
    querySnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() });
    });

    renderOrderHistory(orders);
  } catch (error) {
    console.error("Error loading order history:", error);
    orderHistoryEl.innerHTML =
      '<div class="loading-state">Error loading order history</div>';
  }

  hideLoading();
}

function renderOrderHistory(orders) {
  const orderHistoryEl = document.getElementById("orderHistory");

  orderHistoryEl.innerHTML = orders
    .map((order) => {
      const orderDate = order.timestamp?.toDate
        ? order.timestamp.toDate().toLocaleDateString()
        : new Date().toLocaleDateString();

      return `
      <div class="order-card">
        <div class="order-header">
          <div class="order-date">Order placed on ${orderDate}</div>
          <div class="order-total">Total: $${order.totalAmount.toFixed(2)}</div>
        </div>
        <div class="order-items">
          ${order.items
            .map(
              (item) => `
            <div class="order-item">
              <span>${getProductById(item.id)?.image || "📦"} ${item.name} x ${
                item.quantity
              }</span>
              <span>₹${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
    })
    .join("");
}

// Logout
async function handleLogout() {
  try {
    showLoading();
    await signOut(auth);
    // Will be redirected by auth state change
  } catch (error) {
    console.error("Error signing out:", error);
    showToast("Error signing out", "error");
    hideLoading();
  }
}

// Utility Functions
function showLoading() {
  loadingOverlay.classList.add("active");
}

function hideLoading() {
  loadingOverlay.classList.remove("active");
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add("show"), 100);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

// Export for global access (if needed)
window.updateQuantity = window.updateQuantity;
window.addToCart = window.addToCart;

// Load recurring items when the Recurring tab is clicked
document
  .querySelector('[data-section="recurring"]')
  .addEventListener("click", loadRecurringGrid);

let recurringEditMode = false;

async function loadRecurringGrid() {
  const grid = document.getElementById("recurringItemsGrid");
  grid.innerHTML =
    '<div class="loading-state">Loading recurring items...</div>';

  try {
    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("userId", "==", currentUser.uid),
      orderBy("timestamp", "desc"),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      grid.innerHTML =
        '<div class="loading-state">No recurring items found.</div>';
      return;
    }

    const latestOrder = querySnapshot.docs[0];
    const orderData = latestOrder.data();
    const items = Array.isArray(orderData.items) ? orderData.items : [];

    renderRecurringGrid(items, latestOrder.id);
  } catch (error) {
    console.error("Error loading recurring items:", error);
    grid.innerHTML = '<div class="loading-state">Error loading items</div>';
  }
}

function renderRecurringGrid(items, orderId) {
  const grid = document.getElementById("recurringItemsGrid");
  if (!items.length) {
    grid.innerHTML = '<div class="loading-state">No recurring items.</div>';
    return;
  }

  grid.innerHTML = items
    .map((item, index) => {
      const product = getProductById(item.id) || {};
      return `
        <div class="recurring-item-card" data-index="${index}">
          <div class="item-image">${product.image || "📦"}</div>
          <div class="item-name">${item.name}</div>
          <div class="item-details">Qty: ${
            item.quantity
          } • ₹${item.price.toFixed(2)}</div>
          <button class="remove-btn">&times;</button>
        </div>
      `;
    })
    .join("");

  // Attach remove button listeners
  grid.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const card = e.target.closest(".recurring-item-card");
      const index = parseInt(card.dataset.index, 10);
      await removeRecurringItem(orderId, index);
    });
  });

  // Toggle edit mode
  const editBtn = document.getElementById("editRecurringBtn");
  if (editBtn) {
    editBtn.onclick = () => {
      recurringEditMode = !recurringEditMode;
      grid.querySelectorAll(".recurring-item-card").forEach((card) => {
        if (recurringEditMode) card.classList.add("edit-mode");
        else card.classList.remove("edit-mode");
      });
      editBtn.textContent = recurringEditMode ? "Done" : "Edit Items";
    };
  }
}

// async function removeRecurringItem(orderId, index) {
//   try {
//     const orderRef = doc(db, "orders", orderId);
//     const orderSnap = await getDoc(orderRef);
//     if (!orderSnap.exists()) return;

//     const data = orderSnap.data();
//     const updatedItems = [...(data.items || [])];
//     updatedItems.splice(index, 1);

//     await updateDoc(orderRef, { items: updatedItems });
//     loadRecurringGrid(); // Refresh the grid
//   } catch (error) {
//     console.error("Error removing item:", error);
//   }
// }

async function removeRecurringItem(orderId, index) {
  try {
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) return;

    const data = orderSnap.data();
    const updatedItems = [...(data.items || [])];
    updatedItems.splice(index, 1);

    await updateDoc(orderRef, { items: updatedItems });

    // Refresh both the Recurring tab and the Home tab
    loadRecurringGrid(); // Recurring tab grid
    loadRecurringItems(); // Home tab "Current Recurring Items" card
  } catch (error) {
    console.error("Error removing item:", error);
  }
}
// Load profile details when Profile tab is clicked
document
  .querySelector('[data-section="profile"]')
  .addEventListener("click", loadProfileData);
