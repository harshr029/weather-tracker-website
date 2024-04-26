// api part
api = [
    {
        locationUrl: "dummy url", //add your api url here for calling with latitude and longitude
        options: {
            // add your method and headers keys with api key
        }
    },

    {
        cityUrl: " dummy url ",   //add your api url here for calling with city name
        options: {
            // add your method and headers keys with api key
        }
    }
    // For api follow the link:  https://rapidapi.com/worldapi/api/open-weather13/  and generate your own api key 
]


// Fetching needed elements
// --for ui switching
const userTab = document.querySelector('[data-userWeather]');
const searchTab = document.querySelector('[data-searchWeather]');

const grantLocationUI = document.querySelector('[data-grantLocationContainer]');
const searchContainer = document.querySelector('[data-searchForm]');
const weatherInfoContainer = document.querySelector('[data-weatherInfoContainer]');
const loadingUI = document.querySelector('[data-loadingContainer]');

const grantAccessBtn = document.querySelector('[data-grantAccess]');


//initial condition
let currentTab = userTab;
currentTab.classList.add('current-tab');
//to ask for location and further proceedings
handleLocation();
//ask location permission
function handleLocation() {
    grantLocationUI.classList.add('active');
    getCurrentLocation();
}

//saving current location co ordinates in local session storage, that'll happen on clicking grant button
function getCurrentLocation() {
    // console.log("start getCurrentLocation")
    if (navigator.geolocation) {
        // console.log("calling position");
        navigator.geolocation.getCurrentPosition(showPosition);
        // console.log("called position not answered");

    } else {
        // console.log("in else");
        alert("Your browser does not have location support.");
    }
    // console.log("returning bare handed");
}

function showPosition(position) {
    // console.log("In position");
    const userCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
    }

    sessionStorage.setItem('userLocation', JSON.stringify(userCoordinates));
    //converting from json to string as only string can be stored in session

    // now, we can fetch user weather from here
    const currentLocation = sessionStorage.getItem('userLocation');
    // console.log("calling current location");
    fetchUserWeather(currentLocation);
}

grantAccessBtn.addEventListener('click', getCurrentLocation);


//function to fetch user weather
async function fetchUserWeather(currentLocation) {      //this function will only get data from api then will call render function
    // convert from string to json
    const Coordinates = JSON.parse(currentLocation);

    // getting lat and long
    const { latitude, longitude } = Coordinates;

    // remove weather info ui,grant permission ui and add loading screen
    if (weatherInfoContainer.classList.contains('active')) {
        weatherInfoContainer.classList.remove('active');
    }
    if (grantLocationUI.classList.contains('active')) {
        grantLocationUI.classList.remove('active');
    }
    loadingUI.classList.add('active');

    // API call
    const url = `${api[0].locationUrl}${latitude}/${longitude}`;
    const options = api[0].options;

    console.log(url);

    try {
        //call
        const response = await fetch(url, options);

        //convert response into json
        const weatherData = await response.json();


        // if API key gets exhausted the json object will contain only one key named message so handling that eles undefined data will be showed
        if (Object.keys(weatherData).length == 1)
            throw new Error("Something went wrong");


        //remove loading screen
        loadingUI.classList.remove('active');

        //render information on UI
        renderWeatherInfo(weatherData, 1);
    } catch (error) {
        //error
        alert(error);

    }
}


const notFoundUI = document.querySelector('[data-notFoundContainer]');

// Function to render weather on ui
function renderWeatherInfo(weatherData, flag) {

    //first of all check whether we got the data or not by
    if (weatherData?.cod == '404') {
        notFoundUI.classList.add('active');
        return;
    }

    //first disable not found UI and activate weather info UI
    notFoundUI.classList.remove('active');
    weatherInfoContainer.classList.add('active');

    //--elements needed for data rendering
    const cityName = document.querySelector('[data-cityName]');
    const countryFlag = document.querySelector('[data-countryFlag]');
    const description = document.querySelector('[data-description]');
    const descriptionIcon = document.querySelector('[data-weatherIcon]');
    const temperature = document.querySelector('[data-temperature]');
    const windSpeed = document.querySelector('[data-windspeedValue]');
    const humidity = document.querySelector('[data-humidityValue]');
    const clouds = document.querySelector('[data-cloudsValue]');

    //now extract info and show on ui
    cityName.textContent = weatherData?.name;
    countryFlag.src = `https://flagcdn.com/144x108/${weatherData?.sys?.country.toLowerCase()}.png`;
    description.textContent = weatherData?.weather?.[0]?.description;
    descriptionIcon.src = `http://openweathermap.org/img/w/${weatherData?.weather?.[0]?.icon}.png`;


    // The API we're using gives result of lat and long in Kelvin and result of city in Fahrenheit so we need to convert
    let tempInCelcius = null;
    if (flag == 2) {
        tempInCelcius = ((weatherData?.main?.temp - 32) * 5 / 9).toFixed(2);
    } else {
        tempInCelcius = ((weatherData?.main?.temp) - 273.15).toFixed(2);
    }

    temperature.innerText = `${tempInCelcius} °C`;
    windSpeed.innerText = `${weatherData?.wind?.speed} m/s`;
    humidity.innerText = `${weatherData?.main?.humidity} %`;
    clouds.innerText = `${weatherData?.clouds?.all} %`;
}

//function to switch tab
function switchTab(clickedTab) {

    // if clicked on user tab
    if (!userTab.classList.contains('current-tab')) {
        //remove search container
        searchContainer.classList.remove('active');

        if (notFoundUI.classList.contains('active'))
            notFoundUI.classList.remove('active');

        if (weatherInfoContainer.classList.remove('active'))
            weatherInfoContainer.classList.remove('active');

        //just call fetch user weather it will handle the rest
        // check whether location access is granted or not
        handleLocation();
    }

    // if clicked on search tab
    else {
        //remove active class from grant location and weather info also from 
        loadingUI.classList.remove('active');
        if (grantLocationUI.classList.contains('active')) {
            grantLocationUI.classList.remove('active');
        }
        else {
            weatherInfoContainer.classList.remove('active');
        }
        // search container made active
        searchContainer.classList.add('active');
    }

    // change current tab and button appearance
    currentTab.classList.remove('current-tab');
    currentTab = clickedTab;
    currentTab.classList.add('current-tab');
}


// event listeners for tab switching
userTab.addEventListener('click', (e) => {
    if (e.target != currentTab) {          //e.target means element jis par click hua hai
        switchTab(userTab);
    }
});

searchTab.addEventListener('click', (e) => {
    if (e.target != currentTab) {
        switchTab(searchTab);
    }
});




// now handling searched city weather
// --getting needed elements
const searchCity = document.querySelector('[data-searchInput]');
const searchBtn = document.querySelector('[data-searchBtn]');

async function fetchSearchedWeather() {
    //extract value in city input and make it empty
    const city = searchCity.value;
    searchCity.value = "";
    // console.log(city);

    //check if input field has something on it or not
    if (!city) { return }

    // remove weather info ui,grant permission ui and add loading screen
    if (weatherInfoContainer.classList.contains('active')) {
        weatherInfoContainer.classList.remove('active');
    }
    //add loading screen
    loadingUI.classList.add('active');

    // API call
    const url = `${api[1].cityUrl}${city}`;
    const options = api[1].options;

    try {
        //call
        const response = await fetch(url, options);

        //convert response into json
        const weatherData = await response.json();


        // if API key gets exhausted the json object will contain only one key named message so handling that eles undefined data will be showed
        if (Object.keys(weatherData).length == 1)
            throw new Error("Something went wrong");


        //remove loading screen
        loadingUI.classList.remove('active');

        //render information on UI
        renderWeatherInfo(weatherData, 2);
    } catch (error) {
        //error
        alert(error);
        loadingUI.classList.remove('active');
    }
}

//event listener on search button
// searchBtn.addEventListener('click', fetchSearchedWeather);
searchContainer.addEventListener('submit', (e) => {
    e.preventDefault();
    fetchSearchedWeather();
})
