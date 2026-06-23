const registerForm = document.getElementById('register-form');

if (registerForm) {

    registerForm.addEventListener('submit', async (event) => {

        event.preventDefault();

        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const confirmPassword = document.getElementById('confirm-password').value.trim();

        if (!username || !email || !password || !confirmPassword) {
            return alert('Please complete all fields.');
        }

        if (password !== confirmPassword) {
            return alert('Passwords do not match.');
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    email,
                    password
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                return alert(result.message || 'Registration failed');
            }

            localStorage.setItem('isLoggedIn', 'true');
            alert('Registration successful');
            window.location.href = 'admin.html';

        } catch (error) {
            console.error(error);
            alert('Server error, please try again later.');
        }
    });
}