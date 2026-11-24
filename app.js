// Firebase konfiguracija
const firebaseConfig = {
    apiKey: "AIzaSyBk6ULmy3GYHOGZJM5TboJD8yGf_7PelSA",
    authDomain: "moje-biljeske-687c0.firebaseapp.com",
    projectId: "moje-biljeske-687c0",
    storageBucket: "moje-biljeske-687c0.firebasestorage.app",
    messagingSenderId: "1006282870759",
    appId: "1:1006282870759:web:f8ecf0157b5524f19eb742"
};

// Uvoz Firebase funkcija
import { initializeApp } from
    "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from
    "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    deleteDoc,
    doc,
    query,
    where,
    onSnapshot,
    serverTimestamp
} from
    "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Inicijalizacija
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// HTML elementi
const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const registerBtn = document.getElementById("register-btn");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");

const authMessage = document.getElementById("auth-message");
const userEmail = document.getElementById("user-email");

const noteInput = document.getElementById("note-input");
const addNoteBtn = document.getElementById("add-note-btn");
const notesList = document.getElementById("notes-list");

let currentUser = null;
let unsubscribeNotes = null;


// REGISTRACIJA
registerBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        authMessage.textContent = "Unesi e-mail i lozinku!";
        return;
    }

    try {
        authMessage.textContent = "Registracija u toku...";

        await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        authMessage.textContent = "Registracija uspješna!";

    } catch (error) {
        authMessage.textContent = error.message;
        console.error(error);
    }
});


// PRIJAVA
loginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        authMessage.textContent = "Unesi e-mail i lozinku!";
        return;
    }

    try {
        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        authMessage.textContent = "";

    } catch (error) {
        authMessage.textContent = error.message;
        console.error(error);
    }
});


// ODJAVA
logoutBtn.addEventListener("click", async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error(error);
    }
});


// PRAĆENJE PRIJAVLJENOG KORISNIKA
onAuthStateChanged(auth, (user) => {

    if (unsubscribeNotes) {
        unsubscribeNotes();
        unsubscribeNotes = null;
    }

    if (user) {
        currentUser = user;

        authSection.classList.add("hidden");
        appSection.classList.remove("hidden");

        userEmail.textContent = user.email;

        loadNotes(user.uid);

    } else {
        currentUser = null;

        authSection.classList.remove("hidden");
        appSection.classList.add("hidden");

        notesList.innerHTML = "";
        noteInput.value = "";
    }
});


// DODAVANJE BILJEŠKE
addNoteBtn.addEventListener("click", async () => {

    const text = noteInput.value.trim();

    if (!text || !currentUser) {
        return;
    }

    try {
        await addDoc(collection(db, "notes"), {
            text: text,
            userId: currentUser.uid,
            createdAt: serverTimestamp()
        });

        noteInput.value = "";

    } catch (error) {
        alert("Greška: " + error.message);
        console.error(error);
    }
});


// PRIKAZ BILJEŠKI
function loadNotes(userId) {

    const notesQuery = query(
        collection(db, "notes"),
        where("userId", "==", userId)
    );

    unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {

        notesList.innerHTML = "";

        if (snapshot.empty) {
            const li = document.createElement("li");
            li.textContent = "Nemate nijednu bilješku.";
            li.className = "empty-message";

            notesList.appendChild(li);
            return;
        }

        const notes = [];

        snapshot.forEach((documentSnapshot) => {
            notes.push({
                id: documentSnapshot.id,
                ...documentSnapshot.data()
            });
        });

        notes.sort((a, b) => {
            const timeA = a.createdAt?.toMillis() || 0;
            const timeB = b.createdAt?.toMillis() || 0;
            return timeB - timeA;
        });

        notes.forEach((note) => {

            const li = document.createElement("li");

            const span = document.createElement("span");
            span.className = "note-text";
            span.textContent = note.text;

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Obriši";
            deleteBtn.className = "delete-btn";

            deleteBtn.addEventListener("click", () => {
                deleteNote(note.id);
            });

            li.appendChild(span);
            li.appendChild(deleteBtn);

            notesList.appendChild(li);
        });

    }, (error) => {
        console.error("Greška pri učitavanju:", error);
    });
}


// BRISANJE BILJEŠKE
async function deleteNote(noteId) {

    if (!currentUser) {
        return;
    }

    try {
        await deleteDoc(doc(db, "notes", noteId));

    } catch (error) {
        alert("Greška pri brisanju: " + error.message);
    }
}
