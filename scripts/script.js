let useLocalStorage = true;
let unknownMessage = "-";
window.onload = init;

// init function
function init() {
    // hide the message paragraph
    document.getElementById("message").hidden = true;
}

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
    if (userdata.bio) {
        userdata.bio = userdata.bio.replace(/\\r\\n/g, "<br>");
    }
    console.log(userdata);
    document.getElementById("result-box").innerHTML = `
    <img id="profile-image" src="${userdata.avatar_url}" alt="Profile Image">
                <div id="profile-info">
                    <h1 id="name">${userdata.name}</h1>
                    <p id="login">${userdata.login}</p>
                    <p id="followers"><b>Followers:</b> ${userdata.followers}</p>
                    <p id="following"><b>Following:</b> ${userdata.following}</p>
                    <p id="favorite-language"><b>Favorite Language:</b> ${userdata.favoriteLanguage}</p>
                    <p id="company"><b>Company:</b> ${userdata.company}</p>
                    <p id="location"><b>Location:</b> ${userdata.location}</p>
                    <p id="bio"><b>Bio:</b> ${userdata.bio}</p>
                    <b>Blog:</b> <a id="blog" href="${userdata.blog}">${userdata.blog}</a>
                </div>
`
    // if a field is empty, hide it
    for (let key in userdata) {
        // if document contains an element with the id of the key and the value is empty, show the unknown message instead
        if (document.getElementById(key) && (userdata[key] === "" || userdata[key] === null)) {
            document.getElementById(key).innerHTML = `
            <b>${key.charAt(0).toUpperCase() + key.slice(1)}:</b> ${unknownMessage}`
        }
    }

}

async function searchProfile() {
    // a variable for the username in the form
    let username = document.getElementById("username").value;
    let userdata = {};
    // check if the username is empty or not
    if (username === "") {
        // if it is empty, show a message in the message paragraph
        document.getElementById("message").innerHTML = "Please enter a username";
    } else if (useLocalStorage) {
        document.getElementById("message").hidden = true;
        // check if the username is in the localStorage
        if (localStorage.getItem(username) === null) {
            // fetch user data from the GitHub API
            await fetch("https://api.github.com/users/" + username)
                .then(response => response.json())
                .then(async data => {
                    // get the user's favorite language
                    // update the localStorage with the user's favorite language
                    data.favoriteLanguage = await getUsersFavoriteLanguage(username, data);
                    localStorage.setItem(username, JSON.stringify(data));
                }).catch(error => {
                    //show an error message if there is an error in the message paragraph
                    document.getElementById("message").innerHTML = "Error: " + error;
                });
        }
        // check if we should use the data from the localStorage or the cookie from the radio button
        // get the data from the localStorage
        userdata = JSON.parse(localStorage.getItem(username));
        // show the data in the console
        console.log(userdata);
    } else {
        document.getElementById("message").hidden = true;
        // check if the username is in the cookie
        if (getCookie(username).includes("undefined")) {
            
            // fetch user data from the GitHub API
            await fetch("https://api.github.com/users/" + username)
                .then(response => response.json())
                .then(async data => {
                    // get the user's favorite language
                    data.favoriteLanguage = await getUsersFavoriteLanguage(username, data);
                    // update the cookie with the user's favorite language
                    setCookie(username, JSON.stringify(data), 1);
                    // show the user's data in the console
                    console.log(data);
                }).catch(error => {
                    document.getElementById("message").innerHTML = "Error: " + error;
                });
        }
        // check if we should use the data from the localStorage or the cookie from the radio button
        // get the data from the cookie
        userdata = JSON.parse(getCookie(username));
        // show the data in the console
        console.log(userdata);
    }
    showProfile(userdata);

}

function showMessage(error) {
    document.getElementById("message").innerHTML = "Error: " + error;
    document.getElementById("message").hidden = false;
}

async function getUsersFavoriteLanguage(username, data) {
    data.favoriteLanguage = "";
    // get the user's last 5 repos from the GitHub API and update the favoriteLanguage variable
    await fetch(data.repos_url).then(response => response.json()).then(repos => {
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
        // set the favoriteLanguage variable from outer scope to the most frequently used language
        data.favoriteLanguage = sortedLanguages[0];
    }).catch(error => {
        //show an error message if there is an error in the message paragraph
        showMessage(error);
    });
    return data.favoriteLanguage;
}

function setStorageType(storageType) {
    if (storageType === "local-storage") {
        useLocalStorage = true;
        document.cookie = "expires = Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    } else {
        useLocalStorage = false;
        localStorage.clear();
    }
}

function getCookie(name) {
    // get the cookie with the given name
    let cookie = document.cookie;
    let cookieArray = cookie.split(";");
    let fields = {};
    for (const element of cookieArray) {
        let cookieName = element.split("=")[0];
        //ignore the spaces and the case of the cookie name
        if (cookieName.trim().toLowerCase().startsWith(name.toLowerCase())) {
            fields[cookieName.split(".")[1]] = element.split("=")[1];
        }
    }
    return JSON.stringify(fields);
}