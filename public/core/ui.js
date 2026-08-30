let pendingConfirmAction = null;


function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
    });

    const screen = document.getElementById(screenId);

    if (screen) {
        screen.classList.add("active");
    }
}


function openModal(modalId) {
    const modal = document.getElementById(modalId);

    if (modal) {
        modal.classList.add("active");
    }
}


function closeModal(modalId) {
    const modal = document.getElementById(modalId);

    if (modal) {
        modal.classList.remove("active");
    }
}


function openConfirmModal(message, onConfirm) {
    const messageElement =
        document.getElementById("confirm-message");

    if (messageElement) {
        messageElement.textContent = message;
    }

    pendingConfirmAction = onConfirm;

    openModal("confirm-modal");
}



export { showScreen, openModal, closeModal, openConfirmModal };