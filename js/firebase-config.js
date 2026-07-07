
const firebaseConfig = {
  apiKey: "AIzaSyCi-g9viypw2qBXOqDLhGzKjZEZUwTqPeM",
  authDomain: "gym-management-system-b6fbd.firebaseapp.com",
  databaseURL: "https://gym-management-system-b6fbd-default-rtdb.firebaseio.com",
  projectId: "gym-management-system-b6fbd",
  storageBucket: "gym-management-system-b6fbd.firebasestorage.app",
  messagingSenderId: "465758719080",
  appId: "1:465758719080:web:a78081a95dc9ff71727fdd",
  measurementId: "G-NCXESWGC4E"
};


// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence()
  .catch((err) => {
    console.warn("Firestore offline persistence could not be enabled:", err.code);
  });


// Add Member
function addMember(memberId, name, email, phone, packageType, status) {
  const joinDate = new Date().toISOString();
  db.collection('members').doc(memberId).set({
    name,
    email,
    phone,
    package: packageType,
    joinDate,
    status
  }).then(() => console.log('Member added!'))
    .catch(error => console.error('Error:', error));
}

// Add Bill
function addBill(billId, memberId, amount, status, packageType) {
  const date = new Date().toISOString();
  db.collection('bills').doc(billId).set({
    memberId,
    amount,
    date,
    status,
    package: packageType
  }).then(() => console.log('Bill added!'))
    .catch(error => console.error('Error:', error));
}


// Add a notification
function addNotification(message, sentBy, recipientType, recipients = []) {
  const notificationData = {
    message: message,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    sentBy: sentBy,
    recipientType: recipientType,
    recipients: recipientType === 'selected' ? recipients : [],
    readBy: []
  };

  db.collection("notifications").add(notificationData)
    .then((docRef) => {
      console.log("Notification sent with ID:", docRef.id);
    })
    .catch((error) => {
      console.error("Error sending notification:", error);
    });
}


// Add a new supplement
async function addSupplement() {
  try {
    const docRef = await addDoc(collection(db, "supplements"), {
      name: "Protein Powder", 
      description: "Whey protein isolate", 
      price: 29.99, 
      stock: 100 
    });
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

//Add Diet plan
function addDietPlan(name, description, calories, duration, difficulty) {
  db.collection("dietPlans").add({
    name: name,
    description: description,
    calories: Number(calories),
    duration: duration,
    difficulty: difficulty
  })
  .then((docRef) => {
    console.log("Diet Plan added with ID:", docRef.id);
  })
  .catch((error) => {
    console.error("Error adding diet plan:", error);
  });
}


// Add User
function addUser(userId, name, email, role) {
  db.collection('users').doc(userId).set({
    name,
    email,
    role
  }).then(() => console.log('User added!'))
    .catch(error => console.error('Error:', error));
}
