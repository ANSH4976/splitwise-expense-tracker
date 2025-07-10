function email() {
    console.log('Submit clicked');
    var email = document.getElementById('input-el').value;
    var password = document.getElementById('pwd-el').value;

    fetch('/submitData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pwd: password }) 
    })
    .then(response => {
        if (response.redirected) {
            window.location.href = response.url; 
        } else {
            return response.text();
        }
    })
    .then(data => {
        console.log(data);
        document.getElementById('message').innerText = data;
    })
    .catch(error => console.error('Error:', error));
}
