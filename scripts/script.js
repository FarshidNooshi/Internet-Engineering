function searchProfile() {
    // a variable for the username in the form
    let username = document.getElementById("username").value;
    // check if the username is empty or not
    if (username === "") {
        // if it is empty, show an alert
        alert("Please enter a username");
    }
    else {
        // if it is not empty, show an alert with the username
        // alert("Hello " + username);
        // check if the username is in the localStorage
        if (localStorage.getItem(username) === null) {
            // if it is not, show an alert
            alert("User not found");
            // fetch user data from the GitHub API
            fetch("https://api.github.com/users/" + username)
                .then(response => response.json())
                .then(data => {
                    // if the user exists, save the data in the localStorage
                    localStorage.setItem(username, JSON.stringify(data));
                });
        }
        else {
            // if it is, show an alert
            alert("User found");
            // get the data from the localStorage
            let data = JSON.parse(localStorage.getItem(username));
            // show the data in the console
            console.log(data);
            // get the user's favorite language
            getUsersFavoriteLanguage(username);
        }
    }
}


function getUsersFavoriteLanguage(username) {
    // data is the user's data from the localStorage
    let data = JSON.parse(localStorage.getItem(username));
    // get the user's last 5 repos from the GitHub API
    fetch(data.repos_url).then(response => response.json()).then(repos => {
        // sort the repos by the time they were last updated
        repos.sort((a, b) => {
            return new Date(b.updated_at) - new Date(a.updated_at);
        });
        // create an array to store the languages
        let languages = {};
        // loop through the repos and get the most frequently used language in the last 5 repos
        for (let i = 0; i < 5; i++) {
            // get the language of the current repo
            let language = repos[i].language;
            // check if the language is in the languages array
            if (language in languages) {
                // if it is, increase the number of times it has been used
                languages[language]++;
            }
            else {
                // if it is not, add it to the languages array
                languages[language] = 1;
            }
        }
        // sort the languages by the number of times they have been used
        let sortedLanguages = Object.keys(languages).sort((a, b) => {
            return languages[b] - languages[a];
        });
        // get the most frequently used language
        let favoriteLanguage = sortedLanguages[0];
        // show the languages in the console
        console.log(favoriteLanguage);
    });
    
}