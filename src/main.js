// Importing two modules: dictionary.js (list of valid words) and targetWords.js (daily target words)
import dictionary from "./dictionary.js";
import targetWords from "./targetWords.js";

// Constants
const WORD_LENGTH = 5; // Length of the word to guess
const FLIP_ANIMATION_DURATION = 500; // Duration of the flip animation in ms
const DANCE_ANIMATION_DURATION = 500; // Duration of the winning dance animation in ms
const keyboard = document.querySelector("[data-keyboard]"); // Virtual keyboard container
const alertContainer = document.querySelector("[data-alert-container]"); // Alerts container
const guessGrid = document.querySelector("[data-guess-grid]"); // Grid for guesses

// Calculate the daily target word based on the date difference from Jan 1, 2022
const offsetFromDate = new Date(2022, 0, 1);
const msOffset = Date.now() - offsetFromDate; // Time difference in milliseconds
const dayOffset = msOffset / 1000 / 60 / 60 / 24; // Convert to days
const targetWord = targetWords[Math.floor(dayOffset)]; // Get the word for the day

// Start listening for user interaction (clicks and key presses)
startInteraction();

function startInteraction() {
  document.addEventListener("click", handleMouseClick); // Listen for mouse clicks
  document.addEventListener("keydown", handleKeyPress); // Listen for keyboard input
}

function stopInteraction() {
  // Stop listening for user interaction
  document.removeEventListener("click", handleMouseClick);
  document.removeEventListener("keydown", handleKeyPress);
}

// Handle mouse clicks on virtual keyboard or buttons
function handleMouseClick(e) {
  if (e.target.matches("[data-key]")) {
    pressKey(e.target.dataset.key); // Handle letter keys
    return;
  }

  if (e.target.matches("[data-enter]")) {
    submitGuess(); // Handle "Enter" button
    return;
  }

  if (e.target.matches("[data-delete]")) {
    deleteKey(); // Handle "Delete" button
    return;
  }
}

// Handle physical keyboard input
function handleKeyPress(e) {
  if (e.key === "Enter") {
    submitGuess(); // Submit guess on Enter key
    return;
  }

  if (e.key === "Backspace" || e.key === "Delete") {
    deleteKey(); // Delete last letter on Backspace/Delete
    return;
  }

  if (e.key.match(/^[a-z]$/)) {
    pressKey(e.key); // Accept only alphabet letters
    return;
  }
}

// Add a key to the next available tile
function pressKey(key) {
  const activeTiles = getActiveTiles(); // Get tiles currently in use
  if (activeTiles.length >= WORD_LENGTH) return; // Prevent adding more letters than the word length

  const nextTile = guessGrid.querySelector(":not([data-letter])"); // Find the next empty tile
  nextTile.dataset.letter = key.toLowerCase(); // Set the letter (lowercase)
  nextTile.textContent = key; // Display the letter
  nextTile.dataset.state = "active"; // Mark tile as active
}

// Remove the last entered key
function deleteKey() {
  const activeTiles = getActiveTiles(); // Get tiles currently in use
  const lastTile = activeTiles[activeTiles.length - 1]; // Find the last active tile
  if (lastTile == null) return; // Do nothing if no tiles are active

  lastTile.textContent = ""; // Clear the letter
  delete lastTile.dataset.state; // Remove active state
  delete lastTile.dataset.letter; // Remove the letter data
}

// Submit the guess and validate it
function submitGuess() {
  const activeTiles = [...getActiveTiles()]; // Get all active tiles
  if (activeTiles.length !== WORD_LENGTH) {
    showAlert("Not enough letters"); // Show an alert if the guess is incomplete
    shakeTiles(activeTiles); // Shake tiles to indicate an error
    return;
  }

  const guess = activeTiles.reduce((word, tile) => {
    return word + tile.dataset.letter; // Combine letters to form the guessed word
  }, "");

  if (!dictionary.includes(guess)) {
    showAlert("Not in word list"); // Show alert if guess is invalid
    shakeTiles(activeTiles); // Shake tiles
    return;
  }

  stopInteraction(); // Prevent further interaction while processing
  activeTiles.forEach((...params) => flipTile(...params, guess)); // Flip each tile with animations
}

// Animate the flipping of tiles and validate letters
function flipTile(tile, index, array, guess) {
  const letter = tile.dataset.letter; // Get the letter from the tile
  const key = keyboard.querySelector(`[data-key="${letter}"i]`); // Find the corresponding key on the keyboard

  setTimeout(() => {
    tile.classList.add("flip"); // Start the flip animation
  }, (index * FLIP_ANIMATION_DURATION) / 2);

  tile.addEventListener(
    "transitionend",
    () => {
      tile.classList.remove("flip"); // Remove the flip animation

      // Check if the letter is correct, in the wrong location, or incorrect
      if (targetWord[index] === letter) {
        tile.dataset.state = "correct";
        key.classList.add("correct");
      } else if (targetWord.includes(letter)) {
        tile.dataset.state = "wrong-location";
        key.classList.add("wrong-location");
      } else {
        tile.dataset.state = "wrong";
        key.classList.add("wrong");
      }

      // Start interaction again after the last tile finishes
      if (index === array.length - 1) {
        tile.addEventListener(
          "transitionend",
          () => {
            startInteraction();
            checkWinLose(guess, array); // Check for win or loss
          },
          { once: true }
        );
      }
    },
    { once: true }
  );
}

// Get all currently active tiles
function getActiveTiles() {
  return guessGrid.querySelectorAll('[data-state="active"]');
}

// Show an alert message for a specific duration
function showAlert(message, duration = 1000) {
  const alert = document.createElement("div");
  alert.textContent = message; // Set alert text
  alert.classList.add("alert");
  alertContainer.prepend(alert); // Add alert to the container

  if (duration == null) return; // Don't auto-hide if duration is null

  setTimeout(() => {
    alert.classList.add("hide"); // Start hide animation
    alert.addEventListener("transitionend", () => {
      alert.remove(); // Remove the alert after hiding
    });
  }, duration);
}

// Shake tiles to indicate an error
function shakeTiles(tiles) {
  tiles.forEach((tile) => {
    tile.classList.add("shake"); // Add shake animation
    tile.addEventListener(
      "animationend",
      () => {
        tile.classList.remove("shake"); // Remove shake animation after it ends
      },
      { once: true }
    );
  });
}

// Check if the player has won or lost
function checkWinLose(guess, tiles) {
  if (guess === targetWord) {
    showAlert("You Win", 5000); // Show winning message
    danceTiles(tiles); // Play winning animation
    stopInteraction();
    return;
  }

  const remainingTiles = guessGrid.querySelectorAll(":not([data-letter])");
  if (remainingTiles.length === 0) {
    showAlert(targetWord.toUpperCase(), null); // Show target word if the player loses
    stopInteraction();
  }
}

// Animate tiles in a dance for a win
function danceTiles(tiles) {
  tiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add("dance"); // Add dance animation
      tile.addEventListener(
        "animationend",
        () => {
          tile.classList.remove("dance"); // Remove dance animation
        },
        { once: true }
      );
    }, (index * DANCE_ANIMATION_DURATION) / 5); // Stagger animations
  });
}
