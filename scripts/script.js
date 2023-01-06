let useLocalStorage = true;

function getImportantFields(s) {
    let fields = {};
    fields["name"] = s.split('"name":')[1].split(',')[0];
    fields["login"] = s.split('"login":')[1].split(',')[0];
    fields["avatar_url"] = s.split('"avatar_url":')[1].split(',')[0];
    fields["html_url"] = s.split('"html_url":')[1].split(',')[0];
    fields["followers"] = s.split('"followers":')[1].split(',')[0];
    fields["following"] = s.split('"following":')[1].split(',')[0];
    fields["favoriteLanguage"] = s.split('"favoriteLanguage":')[1].split(',')[0];
    fields["company"] = s.split('"company":')[1].split(',')[0];
    fields["location"] = s.split('"location":')[1].split(',')[0];
    fields["bio"] = s.split('"bio":')[1].split(',')[0];
    fields["blog"] = s.split('"blog":')[1].split(',')[0];
    return fields;
    
}

function setCookie(username, s, number) {
    let fields = getImportantFields(s);
    let d = new Date();
    d.setTime(d.getTime() + (number * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    // set the cookie for each field in the dictionary
    for (let key in fields) {
        document.cookie = username + "." + key + "=" + fields[key] + ";" + expires + ";path=/";
    }
}

function showProfile(userdata) {
    // show the user's data in the result box
document.getElementById("result-box").innerHTML = `
    <img id="profile-image" src="${userdata.avatar_url}" alt="Profile Image">
                <!-- name, login, followers, following, favorite language, company, location, bio, blog -->
                <div id="profile-info">
                    <h1 id="name">${userdata.name}</h1>
                    <p id="login">${userdata.login}</p>
                    <p id="followers">Followers: ${userdata.followers}</p>
                    <p id="following">Following: ${userdata.following}</p>
                    <p id="favorite-language">Favorite Language: ${userdata.favoriteLanguage}</p>
                    <p id="company">Company: ${userdata.company}</p>
                    <p id="location">Location: ${userdata.location}</p>
                    <p id="bio">Bio: ${userdata.bio}</p>
                    <p id="blog">Blog: ${userdata.blog}</p>
                </div>
`
    
}

function searchProfile() {
    // a variable for the username in the form
    let username = document.getElementById("username").value;
    let userdata = {};
    // check if the username is empty or not
    if (username === "") {
        // if it is empty, show a message in the message paragraph
        document.getElementById("message").innerHTML = "Please enter a username";
    } else if (useLocalStorage) {
        // check if the username is in the localStorage
        if (localStorage.getItem(username) === null) {
            // fetch user data from the GitHub API
            fetch("https://api.github.com/users/" + username)
                .then(response => response.json())
                .then(data => {
                    // get the user's favorite language
                    // update the localStorage with the user's favorite language
                    data.favoriteLanguage = getUsersFavoriteLanguage(username, data);
                    localStorage.setItem(username, JSON.stringify(data));
                    // show the user's data in the console
                    console.log(data);
                    userdata = data;
                });
        } else {
            // check if we should use the data from the localStorage or the cookie from the radio button
            // get the data from the localStorage
            userdata = JSON.parse(localStorage.getItem(username));
            // show the data in the console
            console.log(userdata);
        }
    } else {
        // check if the username is in the cookie
        if (getCookie(username) === "") {
            // fetch user data from the GitHub API
            fetch("https://api.github.com/users/" + username)
                .then(response => response.json())
                .then(data => {
                    // get the user's favorite language
                    let favoriteLanguage = getUsersFavoriteLanguage(username, data);
                    // update the cookie with the user's favorite language
                    console.log(favoriteLanguage);
                    data.favoriteLanguage = favoriteLanguage;
                    setCookie(username, JSON.stringify(data), 1);
                    // show the user's data in the console
                    console.log(data);
                    userdata = data;
                });
        } else {
            // check if we should use the data from the localStorage or the cookie from the radio button
            // get the data from the cookie
            userdata = JSON.parse(getCookie(username));
            // show the data in the console
            console.log(userdata);
        }
    }
    showProfile(userdata);
    
}

function getUsersFavoriteLanguage(username, data) {
    // get the user's last 5 repos from the GitHub API
    let favoriteLanguage = "";
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
            } else {
                // if it is not, add it to the languages array
                languages[language] = 1;
            }
        }
        // sort the languages by the number of times they have been used
        let sortedLanguages = Object.keys(languages).sort((a, b) => {
            return languages[b] - languages[a];
        });
        // get the most frequently used language
        favoriteLanguage = sortedLanguages[0];
        // show the languages in the console
        console.log(favoriteLanguage);
    });
    return favoriteLanguage;
}

function clearLocalStorage() {
    // clear the localStorage
    localStorage.clear();
    useLocalStorage = false;
}

function getCookie(name) {
    // get the cookie with the given name
    let cookie = document.cookie;
    let cookieArray = cookie.split(";");
    let fields = {};
    for (const element of cookieArray) {
        let cookieName = element.split("=")[0];
        if (cookieName.trim().startsWith(name)) {
            fields[cookieName.split(".")[1]] = element.split("=")[1];
        }
    }
    return JSON.stringify(fields);
}