let useLocalStorage = true;
let unknownMessage = "-";
let networkErrorMessages = ["Network Error", "Failed to fetch", "Request failed with status code 404"];
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

function checkIfDataExists(userdata) {
    // if the user data is empty, show the message
    if (Object.keys(userdata).length === 0) {
        showMessage("No data found");
        return false;
    }
    if (userdata.message === "Not Found") {
        showMessage("No data found");
        return false;
    }
    return true;
}

function showProfile(userdata) {
    if (!checkIfDataExists(userdata)) 
        return;
    if (userdata.bio) {
        userdata.bio = userdata.bio.replace(/\\r\\n/g, "<br>");
    }
    document.getElementById("message").style.display = "none";
    document.getElementById("result-box").innerHTML = `
    <div class="row top-result-box">
        <img id="profile-image" src=${userdata.avatar_url} alt="Profile Image">
        <h2 id="name">${userdata.name}</h2>
    </div>
                 <div class="profile row profile-info">
                    <p id="login" class="tag"><b>Id:</b> ${userdata.login}</p>
                    <p id="location" class="tag"><b>Location:</b> ${userdata.location}</p>
                    <p id="followers" class="tag"><b>Followers:</b> ${userdata.followers}</p>
                    <p id="following" class="tag"><b>Following:</b> ${userdata.following}</p>
                    <p id="company" class="tag"><b>Company:</b> ${userdata.company}</p>
                    <p id="favoriteLanguage" class="tag"><b>Favorite Language:</b> ${userdata.favoriteLanguage}</p>
                </div>
                <div class="profile-bottom">
                    <p id="blog" class="tag"><b>Blog:</b> <a href="${userdata.blog}" target="_blank">${userdata.blog}</a></p>
                    <p id="bio" class="tag"><b>Bio:</b> ${userdata.bio}</p>
                </div>
`
    // if no image
    if (userdata.avatar_url === null || userdata.avatar_url === "null" || userdata.avatar_url === "") {
        document.getElementById("profile-image").src = "assets/user-solid.svg";
    }
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
        return;
    } else if (useLocalStorage) {
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
                    showMessage(error.message);
                });
        }
        // check if we should use the data from the localStorage or the cookie from the radio button
        // get the data from the localStorage
        userdata = JSON.parse(localStorage.getItem(username));
        // show the data in the console
        console.log(userdata);
    } else {
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
                    showMessage("Error: " + error.message);
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
    document.getElementById("message").style.display = "flex";
}

async function getUsersFavoriteLanguage(username, data) {
    data.favoriteLanguage = "No data found";
    // get the user's last 5 repos from the GitHub API and update the favoriteLanguage variable
    await fetch(data.repos_url).then(response => response.json()).then(repos => {
        // sort the repos by the time they were last updated
        repos.sort((a, b) => {
            return new Date(b.updated_at) - new Date(a.updated_at);
        });
        // create an array to store the languages
        let languages = {};
        // check if the user has repo
        if (repos.length === 0) {
            data.favoriteLanguage = "No repos";
            return;
        }
        // loop through the repos and get the most frequently used language in the last 5 repos
        for (let i = 0; i < Math.min(5, repos.length); i++) {
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
        // somehow GitHub replies null to some languages
        if (data.favoriteLanguage === "null") {
            data.favoriteLanguage = sortedLanguages.length > 1 ? sortedLanguages[1] : "No data found";
        }
    }).catch(error => {
        //show an error message if there is an error in the message paragraph
        showMessage();
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