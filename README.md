# Map Mosaic - The only travel app you'll ever need!
A team - team 6 - working in CSCI 3308 on a travel vlogging app!

## Project Overview
Map Mosaic is an innovative travel application designed to help users document and explore every U.S. state and other countries they visit. Through a user-friendly interface, travelers can log the states they’ve been to and access pertinent information about each location, including when they visted and personal notes. By integrating API data sources like Google Maps and AllTrails, MapMosaic enhances travel experiences by providing rich, location-based content. The app serves not only as a digital travel journal but also as a personalized reference tool, keeping users connected to their past journeys. Users can range from travel enthusiasts, students, and families who want to document their journeys. Whether you’re a frequent traveler mapping out your adventures or someone exploring states for the first time, MapMosaic simplifies the process of tracking and recalling your experiences. The application is designed with accessibility in mind, ensuring it is user-friendly for people of all ages and technical backgrounds. Features like simple navigation, clear visual elements, and responsive design will make the app approachable and convenient.

For travelers who wish to capture their experiences and access useful information on the go, stated is a perfect companion. Unlike standard travel logs or generic state information websites, our product offers a unique combination of personalized tracking and enriched virtual imagery, all in one seamless platform. MapMosaic stands out by offering a blend of practicality and discovery, ensuring users not only track where they’ve been but also gain meaningful insights about those locations.

The project will feature:
  - Graphical User Interface (GUI)
  - Database to store user data
  - Google Maps & MapboxGL API data sources for country information and rendering
  - Middle layer connecting the UI and the data
  - Docker containers for portability


### Contributors

- Jevan Wiltz - GitHub: *WiltzJevan* - Email: jewi1870@colorado.edu
- Treyanna Brown - GitHub: *TreyannaBrown* - Email: trbr3899@colorado.edu
- Chandler Farnsworth - GitHub: *chandlerfarnsworth* - Email: chandler.farnsworth@colorado.edu
- Johnny Sainbayar - GitHub: *jsainbayar* - Email: josa6092@colorado.edu
- Ben Grumbles - GitHub: *bengrumbles* - Email: begr5146@colorado.edu
- Juliana Garcia-Gallo - GitHub: *Julianag10* - Email: juga2381@colorado.edu

### Technology Stack 

  - Frontend: HTML, CSS, JavaScript, MapboxGL (API)
  - Backend: Python (Flask/Django), Nodemailer
  - Database: PostgreSQL
  - Containerization: Docker
  - Version Control: Git/GitHub

### Prerequisites 

Before running the application, ensure you have the following installed:
  - Docker
  - Python
  - PostgreSQL

## Setup and Installation

### Clone the repository
git clone (enter repo link)  
cd MapMosaic

### Navigate to src folder (ensures that docker runs correctly)
cd ProjectSourceCode  
cd src

### Build the Docker containers
docker-compose build

### Start the application
docker-compose up

**Access the app at http://localhost:5000 on your browser**

## Running Tests
  - Ensure the app is running in the Docker environment
  - Execute the test suite

docker exec -it stated-app pytest

## Deployed Application
https://mapmosaic.onrender.com

